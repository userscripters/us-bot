import { createAppAuth } from "@octokit/auth-app";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { Octokit } from "octokit";
import ArrayMap from "./utils/arraymap.js";

dotenv.config();

const { APP_ID, CLID, SECRET, INSTALL_ID, PKEY } = process.env;

const privateKey =
    PKEY || (await readFile("./pkey.pem", { encoding: "utf-8" }));

const oktokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
        appId: APP_ID!,
        privateKey,
        clientId: CLID,
        clientSecret: SECRET,
        installationId: INSTALL_ID!,
    },
});

/**
 * @summary gets a {@link ArrayMap} of all org project columns
 * @param org name of the organization to get columns for
 */
export const getOrgColumns = async (org: string) => {
    const { data: projects } = await oktokit.rest.projects.listForOrg({ org });

    const columnMap: ArrayMap<string, number> = new ArrayMap();

    for (const { id } of projects) {
        const columns = await getProjectColumns(id);
        columnMap.join(columns);
    }

    return columnMap;
};

/**
 * @summary gets a {@link ArrayMap} of project columns
 * @param projectId project_id of the project
 */
export const getProjectColumns = async (projectId: string | number) => {
    const colRes = await oktokit.rest.projects.listColumns({
        project_id: +projectId
    });

    const columnMap: ArrayMap<string, number> = new ArrayMap();

    const columns = colRes.data;
    columns.forEach(({ id, name }) => columnMap.set(name, id));

    return columnMap;
};

export default oktokit;
