import express, { Application } from "express";
import { Server } from "http";
import { request } from "https";
import { URL } from "url";
import { promisify } from "util";

const asyncRequest = promisify(request);

/**
 * @summary starts the bot server
 * @returns {Promise<Application>}
 */
export const startServer = async (port?: number): Promise<[Application, Server]> => {
    const app = express().set("port", port || process.env.PORT || 5000);

    //see https://stackoverflow.com/a/59892173/11407695
    app.use(express.urlencoded({ extended: true }));

    app.use(express.json({
        strict: true,
        // https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428
        verify: (req, _res, buf, enc) => {
            Object.defineProperty(req, "raw", {
                value: buf.toString(enc as BufferEncoding)
            });
        }
    }));

    app.use((_req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    });

    const server = app.listen(app.get("port"), () => {
        console.log(` listening on port ${app.get("port")}.`);
    });

    const farewell = async () => terminate(server);

    const terminate = (server: Server) => server.close(() => process.exit(0));

    /** @see https://stackoverflow.com/a/67567395/11407695 */
    if (process.platform === "win32") {
        const rl = await import("readline");
        const rli = rl.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rli.on("SIGINT", farewell);
        return [app, server];
    }

    /** @see https://stackoverflow.com/a/14516195/11407695 */
    process.on("SIGINT", farewell);
    return [app, server];
};

/**
 * @summary adds a Heroku keep-alive interval
 * @param url application URL
 * @param mins minutes to wait between keep-alives
 */
export const herokuKeepAlive = (url: string, mins = 20) => {
    setInterval(async () => await asyncRequest(new URL(url)), mins * 6e4);
};
