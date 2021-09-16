import { BotConfig } from "./config.js";
import { listify, mdLink, pluralize } from "./helpers.js";
import oktokit from "./userscripters.js";

/**
 * @summary has a little fun
 */
export const sayPingPong = (_config: BotConfig, text: string) => {
    const responses: [RegExp, string][] = [
        [/pong/i, "ping"],
        [/ping/i, "pong"],
    ];

    return responses.reduce(
        (a, [regex, r]) => (regex.test(text) ? `${a} ${r}` : a),
        ""
    );
};

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

/**
 * @summary says what the UserScripters packages are
 */
export const sayWhatAreOurPackages = async ({ org }: BotConfig) => {
    const res = await oktokit.rest.packages.listPackagesForOrganization({
        org,
        package_type: "npm",
        visibility: "public",
    });

    const packages = res.data;
    const { length } = packages;

    const packs = pluralize(length, "package");

    const packageLinks = packages.map(({ html_url, name }) =>
        mdLink(html_url, name)
    );

    return `We published ${packs}: ${listify(...packageLinks)}`;
};

/**
 * @summary says that a repository is successfully created
 */
export const sayCreatedRepo = (
    {
        html_url,
        private: p,
        name,
    }: { html_url: string; private: boolean; name: string },
    fromTemplate = false
) => {
    const pvt = p ? " private" : "";
    const tpl = fromTemplate ? " templated" : "";

    return `Created a${tpl}${pvt} ${mdLink(
        html_url,
        "repository"
    )} for ${name}`;
};
