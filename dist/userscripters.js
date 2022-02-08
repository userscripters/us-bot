import { createAppAuth } from "@octokit/auth-app";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { Octokit } from "octokit";
import ArrayMap from "./utils/arraymap.js";
dotenv.config();
const { APP_ID, CLID, SECRET, INSTALL_ID, PKEY } = process.env;
const privateKey = PKEY || (await readFile("./pkey.pem", { encoding: "utf-8" }));
const oktokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
        appId: APP_ID,
        privateKey,
        clientId: CLID,
        clientSecret: SECRET,
        installationId: INSTALL_ID,
    },
});
export const getOrgColumns = async (org) => {
    const { data: projects } = await oktokit.rest.projects.listForOrg({ org });
    const columnMap = new ArrayMap();
    for (const { id } of projects) {
        const columns = await getProjectColumns(id);
        columnMap.join(columns);
    }
    return columnMap;
};
export const getProjectColumns = async (projectId) => {
    const colRes = await oktokit.rest.projects.listColumns({
        project_id: +projectId
    });
    const columnMap = new ArrayMap();
    const columns = colRes.data;
    columns.forEach(({ id, name }) => columnMap.set(name, id));
    return columnMap;
};
export default oktokit;
