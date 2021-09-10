import { BotConfig } from "./config.js";
import { mdLink } from "./helpers.js";
import oktokit from "./userscripters.js";

/**
 * @summary says who UserScripters are
 */
export const sayWhoWeAre = async ({ org }: BotConfig) => {
    const res = await oktokit.rest.orgs.get({ org });
    const { name, description } = res.data;
    return `We are ${name} - ${description}.`;
};

/**
 * @summary says who UserScripters members are
 */
export const sayWhoAreOurMemebers = async ({ org }: BotConfig) => {
    const res = await oktokit.rest.orgs.listPublicMembers({ org });
    const members = res.data;

    const info = members.map(async (member) => {
        if (!member) return "";

        const { login, html_url } = member;

        const userRes = await oktokit.rest.users.getByUsername({
            username: login,
        });

        if (userRes.status !== 200) return "";

        const { name } = userRes.data;
        return mdLink(html_url, name || login);
    });

    const data = await Promise.all(info);
    const memberList = data.filter(Boolean).join(", ");
    return `Our members: ${memberList}`;
};
