import type { PackageEvent, PackagePublishedEvent, PullRequestEvent, PullRequestOpenedEvent, Schema } from "@octokit/webhooks-types";
import type Room from "chatexchange/dist/Room";
import dotenv from "dotenv";
import { Application, Request } from "express";
import type { IncomingHttpHeaders } from "http2";
import { createHmac, timingSafeEqual, type Hmac } from "node:crypto";
import { handlePackagePublished, handlePullRequestOpened, makeEventGuard } from "./packages.js";



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
    const signature = headers["x-hub-signature-256"];
    if (!signature) return false;

    const computed = `sha256=${hash.update(body).digest("hex")}`;

    return timingSafeEqual(
        Buffer.from(signature as string),
        Buffer.from(computed)
    );
};

/**
 * @summary forks a worker for processing GitHub webhook events
 * @param app express application instance
 * @param room ChatExchange room to pass to the handler
 */
export const addWebhookRoute = async (app: Application, room: Room): Promise<void> => {
    dotenv.config();

    const { GITHUB_WEBHOOK_SECRET } = process.env;
    if (!GITHUB_WEBHOOK_SECRET) {
        console.log(`no GitHub Webhook secret provided, skipping server`);
        return;
    }

    const hash = createHmac("sha256", GITHUB_WEBHOOK_SECRET);

    /**
     * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks
     */
    app.post("/payload", async (req, res) => {
        const { headers, body, raw } = req as Request & { raw: string; };

        if (!verifyWebhookSecret(headers, raw, hash)) {
            console.log("webhook: request signature does not match");
            return res.sendStatus(404);
        }

        const rules: PayloadHandlingRules<PackageEvent | PullRequestEvent> = [
            [makeEventGuard<PackagePublishedEvent>("published"), handlePackagePublished],
            [makeEventGuard<PullRequestOpenedEvent>("opened"), handlePullRequestOpened]
        ];

        const [, handler] = rules.find(([guard]) => guard(body)) || [];
        if (!handler) {
            return res.status(200).send("no Webhook handler registered");
        }

        const status = await handler(room, body);

        return res.sendStatus(status ? 200 : 500);
    });
};
