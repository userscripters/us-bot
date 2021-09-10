import { BotConfig } from "./config.js";
import oktokit from "./userscripters.js";

/**
 * @summary says who UserScripters are
 */
export const sayWhoWeAre = async (_config: BotConfig) => {
    const res = await oktokit.rest.orgs.get({
        org: "userscripters",
    });

    const { name, description } = res.data;
    return `We are ${name} - ${description}.`;
};
