import dotenv from "dotenv";
import { createHmac, timingSafeEqual } from "node:crypto";
import { uptime } from "process";
import { startServer } from "../server.js";
import { handlePackageUpdate, makeIsPackageEvent } from "./packages.js";
const verifyWebhookSecret = (headers, body, hash) => {
    const signature = headers["X-Hub-Signature-256"];
    if (!signature)
        return false;
    const computed = `sha256=${hash.update(body).digest("hex")}`;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
};
export const startWebhookServer = async (room, port = 5001) => {
    dotenv.config();
    const { GITHUB_WEBHOOK_SECRET } = process.env;
    if (!GITHUB_WEBHOOK_SECRET) {
        console.log(`no GitHub Webhook secret provided, skipping server`);
        return false;
    }
    const app = await startServer(port);
    const hash = createHmac("sha256", GITHUB_WEBHOOK_SECRET);
    app.get("/payload", (_req, res) => {
        return res.send(`webhook server reporting for duty
        Port:   ${port}
        Uptime: ${uptime()}s`);
    });
    app.post("/payload", async (req, res) => {
        const { headers, body } = req;
        if (!verifyWebhookSecret(headers, body, hash)) {
            console.log("webhook: request signature does not match");
            return res.sendStatus(404);
        }
        const rules = [
            [makeIsPackageEvent("updated"), handlePackageUpdate]
        ];
        const [, handler] = rules.find(([guard]) => guard(body)) || [];
        if (!handler)
            return;
        const status = await handler(room, body);
        return res.sendStatus(status ? 200 : 500);
    });
    return true;
};
