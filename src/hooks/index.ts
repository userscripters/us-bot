import type { PackageEvent, Schema } from "@octokit/webhooks-types";
import type Room from "chatexchange/dist/Room";
import dotenv from "dotenv";
import type { Application } from "express";
import type { Server } from "http";
import type { IncomingHttpHeaders } from "http2";
import { createHmac, timingSafeEqual, type Hmac } from "node:crypto";
import { uptime } from "process";
import { startServer } from "../server.js";
import { handlePackageUpdate, makeIsPackageEvent } from "./packages.js";



type PayloadHandlingRule<T extends Schema> = [guard: (p: Schema) => p is T, handler: (r: Room, p: T) => Promise<boolean>];

type PayloadHandlingRules<T extends Schema> = {
    [P in T as string]: PayloadHandlingRule<P>
}[string][];

/**
 * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks
 * @param headers incoming HTTP headers
 * @param body request body to check
 * @param hash HMAC to compare with
 */
const verifyWebhookSecret = (
    headers: IncomingHttpHeaders,
    body: string,
    hash: Hmac
): boolean => {
    const signature = headers["X-Hub-Signature-256"];
    if (!signature) return false;

    const computed = `sha256=${hash.update(body).digest("hex")}`;

    return timingSafeEqual(
        Buffer.from(signature as string),
        Buffer.from(computed)
    );
};

/**
 * @summary starts a server listening to GitHub webhooks
 */
export const startWebhookServer = async (room: Room, port = 5001): Promise<[Application, Server] | undefined> => {
    dotenv.config();

    const { GITHUB_WEBHOOK_SECRET } = process.env;
    if (!GITHUB_WEBHOOK_SECRET) {
        console.log(`no GitHub Webhook secret provided, skipping server`);
        return;
    }

    const [app, server] = await startServer(port);

    const hash = createHmac("sha256", GITHUB_WEBHOOK_SECRET);

    app.get("/payload", (_req, res) => {
        return res.send(`webhook server reporting for duty
        Port:   ${port}
        Uptime: ${uptime()}s`);
    });

    /**
     * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks
     */
    app.post("/payload", async (req, res) => {
        const { headers, body } = req;

        if (!verifyWebhookSecret(headers, body, hash)) {
            console.log("webhook: request signature does not match");
            return res.sendStatus(404);
        }

        const rules: PayloadHandlingRules<PackageEvent> = [
            [makeIsPackageEvent("updated"), handlePackageUpdate]
        ];

        const [, handler] = rules.find(([guard]) => guard(body)) || [];
        if (!handler) return;

        const status = await handler(room, body);

        return res.sendStatus(status ? 200 : 500);
    });

    return [app, server];
};
