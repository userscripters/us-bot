import { Command } from "commander";
import { listify, mdLink, splitArgs } from "./helpers.js";
import { sayCreatedRepo } from "./messages.js";
import oktokit from "./userscripters.js";
import { safeMatch } from "./utils/regex.js";
const addIdea = new Command("add-idea");
addIdea
    .requiredOption("-c, --column <id>", "Column id")
    .requiredOption("-s, --summary <text>", "Idea summary")
    .option("-o, --repository <link>", "Repository if exists")
    .option("-r, --reference <link>", "Inspiration reference");
const createRepo = new Command("create-repo");
createRepo
    .requiredOption("-n --name <name>", "Project name")
    .requiredOption("-d, --description <text>", "Project description")
    .option("-t, --template <template>", "Project template")
    .option("-p, --private", "Visibility");
const commands = [addIdea, createRepo];
export const sayManual = (_config, text) => {
    const [commandName] = safeMatch(/(?:(?:show|display) help|man(?:ual)?) for(?: the)? (.+?) command/, text);
    const command = commands.find((command) => command.name() === commandName);
    return command
        ? command.helpInformation()
        : `there is no "${commandName}" command`;
};
export const addUserscriptIdea = async ({ org }, text) => {
    const args = splitArgs(text);
    const parsed = addIdea.parse(args, { from: "user" });
    const { column, repository, reference, summary } = parsed.opts();
    const lines = [`**Idea**`, `${summary}`];
    if (reference)
        lines.push(`\n**Reference**`, reference);
    if (repository)
        lines.push(`\n**Repository**`, repository);
    const res = await oktokit.rest.projects.createCard({
        column_id: column,
        note: lines.join("\n"),
        mediaType: { previews: ["inertia"] },
    });
    const { id, project_url } = res.data;
    const projectId = +project_url.replace(/\D+/, "");
    const pres = await oktokit.rest.projects.get({ project_id: projectId });
    const { number } = pres.data;
    const html_url = `https://github.com/orgs/${org}/projects/${number}#card-${id}`;
    return `Successfully ${mdLink(html_url, "created an idea")}`;
};
export const addRepository = async ({ org }, text) => {
    const args = splitArgs(text);
    const parsed = createRepo.parse(args, { from: "user" });
    const { private: p = false, template, name, description } = parsed.opts();
    const common = { private: p, name, description };
    if (template) {
        const res = await oktokit.rest.repos.createUsingTemplate({
            ...common,
            template_owner: org,
            template_repo: template,
            owner: org,
        });
        return sayCreatedRepo(res.data, true);
    }
    const res = await oktokit.rest.repos.createInOrg({ ...common, org });
    return sayCreatedRepo(res.data);
};
export const listProjects = async ({ org }) => {
    const res = await oktokit.rest.projects.listForOrg({ org });
    const projects = res.data;
    return `Our projects: ${listify(...projects.map(({ html_url, name }) => mdLink(html_url, name)))}`;
};
export const listProjectColumns = async ({ org }, text) => {
    const [, projectName = ""] = /((?:\w+)|(?:"[\w-+\s.!?]+?")) project/i.exec(text) || [];
    const normalized = projectName
        ?.toLowerCase()
        .trim()
        .replace(/^"(.+)"$/, "$1");
    const prjRes = await oktokit.rest.projects.listForOrg({ org });
    const ps = prjRes.data;
    const project = ps.find(({ name }) => name.toLowerCase() === normalized);
    if (!project)
        return "";
    const { id, name } = project;
    const colRes = await oktokit.rest.projects.listColumns({ project_id: id });
    const columns = colRes.data;
    return `"${name}" columns:\n${columns
        .map(({ id, name }) => `- ${id} | ${name}`)
        .join("\n")}`;
};
