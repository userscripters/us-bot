import { Command } from "commander";
import { addRepositoryHandler } from "./handlers.js";
import { listify, mdLink, splitArgs } from "./helpers.js";
import { sayCreatedRepo } from "./messages.js";
import oktokit from "./userscripters.js";
import { safeMatch } from "./utils/regex.js";
const addIdea = new Command("add-idea");
addIdea
    .description("Logs a new idea for a userscript")
    .requiredOption("-c, --column <id>", "Column id")
    .requiredOption("-s, --summary <text>", "Idea summary")
    .option("-i, --init <name>", "Initialize a repository")
    .option("-t, --template <template>", "Project template")
    .option("-p, --private", "Visibility")
    .option("-o, --repository <link>", "Repository if exists")
    .option("-r, --reference <link>", "Inspiration reference");
const moveIdea = new Command("move-idea");
moveIdea
    .description("Updates status of a userscript idea")
    .requiredOption("-i, --id <id>", "Idea id to move")
    .requiredOption("-t, --to <id>", "Target column id")
    .option("-p, --position <top|bottom>", "Card position");
const createRepo = new Command("create-repo");
createRepo
    .description("Creates a [templated] GitHub repository")
    .requiredOption("-n, --name <name>", "Project name")
    .requiredOption("-d, --description <text>", "Project description")
    .option("-t, --template <template>", "Project template")
    .option("-p, --private", "Visibility");
const commands = [addIdea, createRepo, moveIdea];
export const sayManual = (_config, text) => {
    const [commandName] = safeMatch(/(?:(?:show|display) help|man(?:ual)?) for(?: the)? (.+?) command/, text);
    const command = commands.find((command) => command.name() === commandName);
    return command
        ? command.helpInformation()
        : `there is no "${commandName}" command`;
};
export const listCommands = () => {
    return commands.reduce((acc, command) => {
        const name = command.name();
        const desc = command.description();
        const ability = `- ${name}: ${desc}`;
        return `${acc}\n${ability}`;
    }, "My abilities include:");
};
export const addUserscriptIdea = async (config, text) => {
    const { org } = config;
    const args = splitArgs(text);
    const parsed = addIdea.parse(args, { from: "user" });
    const { c, i, p, t, o, r, s } = parsed.opts();
    const lines = [`**Idea**`, `${s}`];
    if (r)
        lines.push(`\n**Reference**`, r);
    if (o && !i)
        lines.push(`\n**Repository**`, o);
    if (i) {
        const { html_url } = await addRepositoryHandler(org, {
            description: s,
            name: i,
            private: p,
            template: t
        });
        lines.push(`\n**Repository**`, html_url);
    }
    const res = await oktokit.rest.projects.createCard({
        column_id: c,
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
export const moveUserscriptIdea = async ({ org }, text) => {
    const args = splitArgs(text);
    const parsed = moveIdea.parse(args, { from: "user" });
    const { id, to, position = "top" } = parsed.opts();
    const res = await oktokit.rest.projects.moveCard({
        card_id: +id,
        position,
        column_id: +to,
    });
    const cres = await oktokit.rest.projects.getColumn({ column_id: +to });
    const { project_url } = cres.data;
    const projectId = +project_url.replace(/\D+/, "");
    const pres = await oktokit.rest.projects.get({ project_id: projectId });
    const { number } = pres.data;
    const html_url = `https://github.com/orgs/${org}/projects/${number}#card-${id}`;
    return `${res.status ? "successfully moved" : "failed to move"} ${mdLink(html_url, "the idea")}`;
};
export const addRepository = async ({ org }, text) => {
    const args = splitArgs(text);
    const parsed = createRepo.parse(args, { from: "user" });
    const { private: p = false, template, name, description } = parsed.opts();
    const common = { private: p, name, description };
    const res = await addRepositoryHandler(org, { ...common, template });
    return sayCreatedRepo(res, !!template);
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
