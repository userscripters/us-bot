import oktokit from "./userscripters.js";

export interface AddRepositoryOptions {
    description: string;
    name: string;
    private?: boolean;
    template?: string;
}

/**
 * @summary handler for an addRepository command
 * @param org organization to create the repo for
 * @param config command configuration
 */
export const addRepositoryHandler = async (
    org: string,
    config: AddRepositoryOptions
) => {
    const {
        private: p = false,
        template,
        name,
        description
    } = config;

    const common = { private: p, name, description };

    if (template) {
        const res = await oktokit.rest.repos.createUsingTemplate({
            ...common,
            template_owner: org,
            template_repo: template,
            owner: org,
        });

        return res.data;
    }

    const res = await oktokit.rest.repos.createInOrg({ ...common, org });

    return res.data;
};