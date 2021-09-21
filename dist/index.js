import Client, { ChatEventType } from "chatexchange";
import dotenv from "dotenv";
import entities from "html-entities";
import Queue from "p-queue";
import { addRepository, addUserscriptIdea, listProjectColumns, listProjects, } from "./commands.js";
import { BotConfig } from "./config.js";
import { ADD_IDEA, ADD_REPO, LIST_COLUMNS, LIST_MEMBERS, LIST_PACKAGES, LIST_PROJECTS, SHOOT_THEM, WHO_MADE_ME, WHO_WE_ARE, } from "./expressions.js";
import { sayPingPong, sayWhatAreOurPackages, sayWhoAreOurMemebers, sayWhoMadeMe, sayWhoWeAre, shootUser, } from "./messages.js";
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
        room.ignore(ChatEventType.USER_JOINED, ChatEventType.USER_LEFT, ChatEventType.ROOM_RENAMED, ChatEventType.STARS_CHANGED);
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
            if (config.isAdmin(userId) && msg.targetUserId === bot.id) {
                room.sendMessage("Yes, master?");
                return;
            }
            const rules = [
                [WHO_WE_ARE, sayWhoWeAre],
                [WHO_MADE_ME, sayWhoMadeMe],
                [SHOOT_THEM, shootUser],
                [LIST_MEMBERS, sayWhoAreOurMemebers],
                [LIST_PACKAGES, sayWhatAreOurPackages],
                [ADD_IDEA, addUserscriptIdea],
                [ADD_REPO, addRepository],
                [LIST_PROJECTS, listProjects],
                [LIST_COLUMNS, listProjectColumns],
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
            const maxChars = 500;
            const messages = response
                .split(new RegExp(`(^(?:.|\\n|\\r){1,${maxChars}})(?:\\n|\\s|$)`, "gm"))
                .filter(Boolean);
            for (const message of messages) {
                queue.add(() => room.sendMessage(message));
            }
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
