import Client from "chatexchange";
import type WebSocketEvent from "chatexchange/dist/WebsocketEvent";
import dotenv from "dotenv";
import Queue from "p-queue";
import { BotConfig } from "./config.js";

type JoinStatus = {
    id: string;
    status: boolean;
    error?: unknown;
};

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
            console.log(msg);

            const response = "pong";

            if ((await msg.content) === "ping") {
                queue.add(() => room.sendMessage(response));
            }
        });

        await room.watch();

        return { id, status: true };
    } catch (error) {
        return { id, status: false, error };
    }
});

const statuses = await Promise.all(roomJoins);

console.log(statuses);
