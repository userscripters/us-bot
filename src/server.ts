import express, { Application } from "express";
import { Server } from "http";

/**
 * @summary starts the bot server
 * @returns {Promise<Application>}
 */
export const startServer = async (): Promise<Application> => {
    const app = express().set("port", process.env.PORT || 5000);

    //see https://stackoverflow.com/a/59892173/11407695
    app.use(express.urlencoded({ extended: true }));

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
        return app;
    }

    /** @see https://stackoverflow.com/a/14516195/11407695 */
    process.on("SIGINT", farewell);
    return app;
};
