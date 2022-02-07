import oktokit from "./userscripters.js";
export const addRepositoryHandler = async (org, config) => {
    const { private: p = false, template, name, description } = config;
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
