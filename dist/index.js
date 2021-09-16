import Client from "chatexchange";
import dotenv from "dotenv";
import entities from "html-entities";
import Queue from "p-queue";
import { addRepository, addUserscriptIdea } from "./commands.js";
import { BotConfig } from "./config.js";
import { sayWhatAreOurPackages, sayWhoAreOurMemebers, sayWhoWeAre, } from "./messages.js";
import { herokuKeepAlive, startServer } from "./server.js";
dotenv.config();
const config = new BotConfig(process.env);
config.debug();
const client = new Client.default("stackoverflow.com");
await client.login(...config.getCredentials());
const { roomIds } = config;
const roomJoins = roomIds.map(async (id) => {
    try {
        const room = await client.joinRoom(+id);
        const queue = new Queue({ interval: config.getThrottle(id) });
        room.on("message", async (msg) => {
            if (!config.isAdmin(msg.userId))
                return console.log(`non-admin msg:\n${JSON.stringify(msg)}`);
            const text = entities.decode(await msg.content);
            const rules = [
                [/ping/, () => "pong"],
                [/who are we/, sayWhoWeAre],
                [
                    /who (?:are|is)(?: (?:the|our))?(?: organi[sz]ation)? members?/,
                    sayWhoAreOurMemebers,
                ],
                [
                    /what (?:are|is)(?: (?:the|our))?(?: organi[sz]ation)? packages?/,
                    sayWhatAreOurPackages,
                ],
                [/add-idea\s+.+/, addUserscriptIdea],
                [/(?:create|add) repo(?:sitory)?/, addRepository],
            ];
            const builder = rules.reduce((a, [r, b]) => (r.test(text) ? b : a), (() => ""));
            const response = await builder(config, text);
            if (!response)
                return;
            console.debug(`
            From:     ${msg.userId}
            Name:     ${msg.userName}
            Response: ${response}
            `);
            queue.add(() => room.sendMessage(response));
        });
        await room.watch();
        setInterval(async () => await client.joinRoom(room.id), 5 * 6e4);
        await startServer();
        if (config.isOnHeroku())
            herokuKeepAlive(config.host);
        return { id, status: true };
    }
    catch (error) {
        return { id, status: false, error };
    }
});
const statuses = await Promise.all(roomJoins);
console.log(statuses);
