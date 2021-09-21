import { readFile } from "fs/promises";
import { listify, mdLink, pluralize } from "./helpers.js";
import oktokit from "./userscripters.js";
export const shootUser = (_config, text) => {
    const [, userName] = /^shoot @([\w-]+)/i.exec(text) || [];
    return `@${userName} pew-pew!`;
};
export const sayPingPong = (_config, text) => {
    const responses = [
        [/pong/i, "ping"],
        [/ping/i, "pong"],
    ];
    return responses.reduce((a, [regex, r]) => (regex.test(text) ? `${a} ${r}` : a), "");
};
export const sayWhoWeAre = async ({ org }) => {
    const res = await oktokit.rest.orgs.get({ org });
    const { name, description } = res.data;
    return `We are ${name} - ${description}.`;
};
export const sayWhoMadeMe = async (_config) => {
    const { author } = JSON.parse(await readFile("./package.json", { encoding: "utf-8" }));
    return `${author.name} made me`;
};
export const sayWhoAreOurMemebers = async ({ org }) => {
    const res = await oktokit.rest.orgs.listPublicMembers({ org });
    const members = res.data;
    const info = members.map(async (member) => {
        if (!member)
            return "";
        const { login, html_url } = member;
        const userRes = await oktokit.rest.users.getByUsername({
            username: login,
        });
        if (userRes.status !== 200)
            return "";
        const { name } = userRes.data;
        return mdLink(html_url, name || login);
    });
    const data = await Promise.all(info);
    const memberList = data.filter(Boolean).join(", ");
    return `Our members: ${memberList}`;
};
export const sayWhatAreOurPackages = async ({ org }) => {
    const res = await oktokit.rest.packages.listPackagesForOrganization({
        org,
        package_type: "npm",
        visibility: "public",
    });
    const packages = res.data;
    const { length } = packages;
    const packs = pluralize(length, "package");
    const packageLinks = packages.map(({ html_url, name }) => mdLink(html_url, name));
    return `We published ${packs}: ${listify(...packageLinks)}`;
};
export const sayCreatedRepo = ({ html_url, private: p, name, }, fromTemplate = false) => {
    const pvt = p ? " private" : "";
    const tpl = fromTemplate ? " templated" : "";
    return `Created a${tpl}${pvt} ${mdLink(html_url, "repository")} for ${name}`;
};
