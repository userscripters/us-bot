import { Command } from "commander";
import { BotConfig } from "./config.js";
import { mdLink } from "./helpers.js";
import oktokit from "./userscripters.js";

const addIdea = new Command("add-idea");
addIdea
    .requiredOption("-c, --column <id>", "Column id")
    .option("-o, --repository <link>", "Repository if exists")
    .option("-r, --reference <link>", "Inspiration reference")
    .option("-s, --summary <text>", "Idea summary");

/**
 * @summary adds an idea to the Userscripts project
 */
export const addUserscriptIdea = async ({ org }: BotConfig, text: string) => {
    const args = text
        .split(/(?<!"[\w ]+)\s+(?![\w ]+")/)
        // removes extra quotes from arguments
        .map((t) => t.replace(/^"(.+)"$/, "$1"));

    const parsed = addIdea.parse(args, { from: "user" });

    const { column, repository, reference, summary } = parsed.opts();

    const lines = [`**Idea**`, `${summary}`];

    if (reference) lines.push(`\n**Reference**`, reference);
    if (repository) lines.push(`\n**Repository**`, repository);

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
