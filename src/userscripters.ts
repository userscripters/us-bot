import { createAppAuth } from "@octokit/auth-app";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { Octokit } from "octokit";

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

export default oktokit;
