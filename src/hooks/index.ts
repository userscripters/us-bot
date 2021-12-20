import type { PackageEvent, Schema } from "@octokit/webhooks-types";
import type Room from "chatexchange/dist/Room";
import dotenv from "dotenv";
import type { IncomingHttpHeaders } from "http2";
import { createHmac, timingSafeEqual, type Hmac } from "node:crypto";
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
export const startWebhookServer = async (room: Room, port?: number) => {
    dotenv.config();

    const { GITHUB_WEBHOOK_SECRET } = process.env;
    if (!GITHUB_WEBHOOK_SECRET) return false;

    const app = await startServer(port || 5001);

    const hash = createHmac("sha256", GITHUB_WEBHOOK_SECRET);

    /**
     * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks
     */
    app.post("/payload", async (req, res) => {
        const { headers, body } = req;

        if (!verifyWebhookSecret(headers, body, hash)) {
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

    return true;
};
