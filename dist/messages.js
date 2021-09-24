import { listify, mdLink, pluralize, readPackage } from "./helpers.js";
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
export const sayWhoIAm = async () => {
    const { description = "bot" } = await readPackage();
    const { BOT_HOME } = process.env;
    const residence = BOT_HOME
        ? `live ${mdLink(BOT_HOME, "here")}`
        : "am homeless";
    return `I am a ${description}, and I ${residence}`;
};
export const sayMaster = (_config, text) => `Yes, master${text.includes("?") ? "!" : "?"}`;
export const sayWhoMadeMe = async (_config) => {
    const { author, contributors = [] } = await readPackage();
    const authorName = typeof author === "string" ? author : author?.name;
    const names = contributors.map((p) => typeof p === "string" ? p : p.url ? mdLink(p.url, p.name) : p.name);
    const contribs = names.length
        ? `, and ${listify(...names)} helped out`
        : "";
    return `${authorName} made me${contribs}`;
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
