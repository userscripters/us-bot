import Client from "chatexchange";
import dotenv from "dotenv";
import entities from "html-entities";
import Queue from "p-queue";
import { addRepository, addUserscriptIdea, listProjects } from "./commands.js";
import { BotConfig } from "./config.js";
import { sayPingPong, sayWhatAreOurPackages, sayWhoAreOurMemebers, sayWhoWeAre, } from "./messages.js";
import { herokuKeepAlive, startServer } from "./server.js";
dotenv.config();
const config = new BotConfig(process.env);
config.debug();
const client = new Client.default("stackoverflow.com");
await client.login(...config.getCredentials());
const { roomIds } = config;
const bot = await client.getMe();
const roomJoins = roomIds.map(async (id) => {
    try {
        const room = await client.joinRoom(+id);
        const queue = new Queue({ interval: config.getThrottle(id) });
        room.on("message", async (msg) => {
            const text = entities.decode(await msg.content);
            const { userId } = msg;
            if (!config.isAdmin(userId) && bot.id !== userId) {
                const pingpong = sayPingPong(config, text);
                if (pingpong)
                    room.sendMessage(pingpong);
                return;
            }
            const rules = [
                [/who are we/, sayWhoWeAre],
                [
                    /who (?:are|is)(?: (?:the|our))?(?: organi[sz]ation)? members?/,
                    sayWhoAreOurMemebers,
                ],
                [
                    /what (?:are|is)(?: (?:the|our))?(?: organi[sz]ation)? packages?/,
                    sayWhatAreOurPackages,
                ],
                [
                    /(?:create|add|new)(?: (?:user)?script)? idea\s+.+/,
                    addUserscriptIdea,
                ],
                [/(?:create|add|new) repo(?:sitory)?/, addRepository],
                [
                    /(?:list|our|show|display)(?: our|orgs?)? projects?/,
                    listProjects,
                ],
            ];
            const builder = rules.reduce((a, [r, b]) => (r.test(text) ? b : a), (() => ""));
            const response = await builder(config, text);
            if (!response)
                return;
            console.debug(`
            From:     ${userId}
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
