import Client from "chatexchange";
import type WebSocketEvent from "chatexchange/dist/WebsocketEvent";
import dotenv from "dotenv";
import entities from "html-entities";
import Queue from "p-queue";
import { addUserscriptIdea } from "./commands.js";
import { BotConfig } from "./config.js";
import {
    sayWhatAreOurPackages,
    sayWhoAreOurMemebers,
    sayWhoWeAre,
} from "./messages.js";

type JoinStatus = {
    id: string;
    status: boolean;
    error?: unknown;
};

type ResponseBuilder = (c: BotConfig, t: string) => string | Promise<string>;

type ResponseRule = [matcher: RegExp, builder: ResponseBuilder];

dotenv.config();

const config = new BotConfig(process.env);

config.debug();

//@ts-expect-error
const client: Client = new Client.default("stackoverflow.com");

await client.login(...config.getCredentials());

const { roomIds } = config;

const roomJoins: Promise<JoinStatus>[] = roomIds.map(async (id) => {
    try {
        const room = await client.joinRoom(+id);

        const queue = new Queue({ interval: config.getThrottle(id) });

        room.on("message", async (msg: WebSocketEvent) => {
            if (!config.isAdmin(msg.userId))
                return console.log(`non-admin msg:\n${JSON.stringify(msg)}`);

            const text = entities.decode(await msg.content);

            const rules: ResponseRule[] = [
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
            ];

            const builder = rules.reduce(
                (a, [r, b]) => (r.test(text) ? b : a),
                (() => "") as ResponseBuilder
            );

            const response = await builder(config, text);
            if (!response) return;

            console.debug(`
            From:     ${msg.userId}
            Name:     ${msg.userName}
            Response: ${response}
            `);

            queue.add(() => room.sendMessage(response));
        });

        await room.watch();

        return { id, status: true };
    } catch (error) {
        return { id, status: false, error };
    }
});

const statuses = await Promise.all(roomJoins);

console.log(statuses);
