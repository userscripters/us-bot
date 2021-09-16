import { Command } from "commander";
import { mdLink, splitArgs } from "./helpers.js";
import { sayCreatedRepo } from "./messages.js";
import oktokit from "./userscripters.js";
const addIdea = new Command("add-idea");
addIdea
    .requiredOption("-c, --column <id>", "Column id")
    .option("-o, --repository <link>", "Repository if exists")
    .option("-r, --reference <link>", "Inspiration reference")
    .option("-s, --summary <text>", "Idea summary");
const createRepo = new Command("create-repo");
createRepo
    .requiredOption("-n --name <name>", "Project name")
    .requiredOption("-d, --description <text>", "Project description")
    .option("-t, --template <template>", "Project template")
    .option("-p, --private", "Visibility");
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
    console.log(parsed);
    const { private: p = false, template, name, description } = parsed.opts();
    const common = { private: p, name, description };
    if (template) {
        const res = await oktokit.rest.repos.createUsingTemplate({
            ...common,
            template_owner: org,
            template_repo: template,
        });
        return sayCreatedRepo(res.data, true);
    }
    const res = await oktokit.rest.repos.createInOrg({ ...common, org });
    return sayCreatedRepo(res.data);
};
