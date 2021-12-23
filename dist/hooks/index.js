import dotenv from "dotenv";
import { createHmac, timingSafeEqual } from "node:crypto";
import { handlePackagePublished, handlePullRequestOpened, handlePushedTag, makeEventGuard } from "./packages.js";
const verifyWebhookSecret = (headers, body, hash) => {
    const signature = headers["x-hub-signature-256"];
    if (!signature)
        return false;
    const computed = `sha256=${hash.update(body).digest("hex")}`;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
};
export const addWebhookRoute = async (app, room) => {
    dotenv.config();
    const { GITHUB_WEBHOOK_SECRET } = process.env;
    if (!GITHUB_WEBHOOK_SECRET) {
        console.log(`no GitHub Webhook secret provided, skipping server`);
        return;
    }
    const hash = createHmac("sha256", GITHUB_WEBHOOK_SECRET);
    app.post("/payload", async (req, res) => {
        const { headers, body, raw } = req;
        if (!verifyWebhookSecret(headers, raw, hash)) {
            console.log("webhook: request signature does not match");
            return res.sendStatus(404);
        }
        const event = headers["x-github-event"];
        const eventMap = new Map([
            ["push", handlePushedTag]
        ]);
        const eventHandler = eventMap.get(event);
        if (eventHandler) {
            const status = await eventHandler(room, body);
            return res.sendStatus(status ? 200 : 500);
        }
        const rules = [
            [makeEventGuard("published"), handlePackagePublished],
            [makeEventGuard("opened"), handlePullRequestOpened],
        ];
        const [, handler] = rules.find(([guard]) => guard(body)) || [];
        if (!handler) {
            return res.status(200).send("no Webhook handler registered");
        }
        const status = await handler(room, body);
        return res.sendStatus(status ? 200 : 500);
    });
};
