import Client, { ChatEventType } from "chatexchange";
import dotenv from "dotenv";
import entities from "html-entities";
import Queue from "p-queue";
import { addRepository, addUserscriptIdea, listCommands, listProjectColumns, listProjects, moveUserscriptIdea, sayManual } from "./commands.js";
import { BotConfig } from "./config.js";
import { ADD_IDEA, ADD_REPO, ALICE_THEM, DEFINE_WORD, LIST_COLUMNS, LIST_COMMANDS, LIST_MEMBERS, LIST_PACKAGES, LIST_PROJECTS, MOVE_IDEA, SHOOT_THEM, SHOW_HELP, WHO_ARE_YOU, WHO_MADE_ME, WHO_WE_ARE } from "./expressions.js";
import { isIgnoredUser, isSameRoom } from "./guards.js";
import { startWebhookServer } from "./hooks/index.js";
import { aliceUser, sayDefineWord, sayMaster, sayPingPong, sayWhatAreOurPackages, sayWhoAreOurMemebers, sayWhoIAm, sayWhoMadeMe, sayWhoWeAre, shootUser } from "./messages.js";
import { herokuKeepAlive, startServer } from "./server.js";
import { stripLeadingMention } from "./utils/chat.js";
import { getRandomBoolean } from "./utils/random.js";
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
        room.ignore(ChatEventType.USER_JOINED, ChatEventType.USER_LEFT, ChatEventType.ROOM_RENAMED, ChatEventType.STARS_CHANGED, ChatEventType.USER_MENTIONED);
        const queue = new Queue({ interval: config.getThrottle(id) });
        room.on("message", async (msg) => {
            const { userId } = msg;
            if (isIgnoredUser(room, userId) ||
                !isSameRoom(room, await msg.roomId)) {
                return;
            }
            const text = entities.decode(await msg.content);
            const isAdmin = config.isAdmin(userId);
            if (!isAdmin &&
                bot.id !== userId &&
                getRandomBoolean()) {
                const pingpong = sayPingPong(config, text);
                if (pingpong)
                    room.sendMessage(pingpong);
                return;
            }
            const rules = [
                [WHO_ARE_YOU, sayWhoIAm],
                [WHO_WE_ARE, sayWhoWeAre],
                [WHO_MADE_ME, sayWhoMadeMe],
                [SHOOT_THEM, shootUser],
                [ALICE_THEM, aliceUser],
                [LIST_MEMBERS, sayWhoAreOurMemebers],
                [LIST_PACKAGES, sayWhatAreOurPackages],
                [ADD_IDEA, addUserscriptIdea],
                [MOVE_IDEA, moveUserscriptIdea],
                [ADD_REPO, addRepository],
                [LIST_PROJECTS, listProjects],
                [LIST_COLUMNS, listProjectColumns],
                [DEFINE_WORD, sayDefineWord],
                [SHOW_HELP, sayManual],
                [LIST_COMMANDS, listCommands]
            ];
            const name = await bot.name;
            const stripped = stripLeadingMention(text, name);
            const builder = rules.reduce((a, [r, b]) => {
                return r.test(stripped) ? b : a;
            }, (() => ""));
            const response = await builder(config, text);
            console.debug(`
            From:     ${userId}
            Name:     ${msg.userName}
            Response: ${response}
            `);
            if (!response && !isAdmin)
                return;
            if (!response && isAdmin && msg.targetUserId === bot.id) {
                room.sendMessage(sayMaster(config, text));
                return;
            }
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
        await startWebhookServer(room);
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
