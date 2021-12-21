import express from "express";
import { request } from "https";
import { URL } from "url";
import { promisify } from "util";
const asyncRequest = promisify(request);
export const startServer = async (port) => {
    const app = express().set("port", port || process.env.PORT || 5000);
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json({
        strict: true,
        verify: (req, _res, buf, enc) => {
            Object.defineProperty(req, "raw", {
                value: buf.toString(enc)
            });
        }
    }));
    app.use((_req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    const server = app.listen(app.get("port"), () => {
        console.log(` listening on port ${app.get("port")}.`);
    });
    const farewell = async () => terminate(server);
    const terminate = (server) => server.close(() => process.exit(0));
    if (process.platform === "win32") {
        const rl = await import("readline");
        const rli = rl.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rli.on("SIGINT", farewell);
        return [app, server];
    }
    process.on("SIGINT", farewell);
    return [app, server];
};
export const herokuKeepAlive = (url, mins = 20) => {
    setInterval(async () => await asyncRequest(new URL(url)), mins * 6e4);
};
