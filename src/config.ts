import User from "chatexchange/dist/User";
import EventEmitter from "events";
import { splitENV } from "./helpers.js";

export class BotConfig extends EventEmitter {
    public roomIds: string[] = [];

    public logLevel = "default";

    public throttles: Map<string, number> = new Map();

    public gitHubToChatUsers: Map<number, string> = new Map();

    public org: string;

    public host: string;

    #email: string;
    #password: string;
    #admins: Set<number> = new Set();

    constructor({
        HOST = "",
        ADMIN_IDS,
        ROOM_IDS,
        EMAIL = "",
        PASSWORD = "",
        THROTTLES = "{}",
        GITHUB_TO_CHAT_USERS = "[]",
        ORG_NAME,
    }: NodeJS.ProcessEnv) {
        super();
        this.roomIds.push(...splitENV(ROOM_IDS));
        this.#email = EMAIL;
        this.#password = PASSWORD;
        this.org = ORG_NAME!;
        this.host = HOST;

        splitENV(ADMIN_IDS).forEach((id) => this.#admins.add(+id));

        const parsed: Record<string, string> = JSON.parse(THROTTLES);
        Object.entries(parsed).forEach(([id, throttle]) => {
            this.throttles.set(id, +throttle);
        });

        this.gitHubToChatUsers = new Map(JSON.parse(GITHUB_TO_CHAT_USERS));
    }

    isAdmin(idOrUser: number | User) {
        const uid = typeof idOrUser === "number" ? idOrUser : idOrUser.id;
        return this.#admins.has(uid);
    }

    isOnHeroku() {
        const { host } = this;
        return host.includes("herokuapp.com");
    }

    getThrottle(id: string) {
        const seconds = this.throttles.get(id) || 1;
        return seconds * 1e3;
    }

    getCredentials(): [email: string, pwd: string] {
        return [this.#email, this.#password];
    }

    debug() {
        const { roomIds, throttles } = this;
        console.debug(`
Bot Config:
Email: ${this.#email}
Rooms: ${roomIds.join(", ")}

Throttles:
${[...throttles].map(([k, v]) => `${k} - ${v}s`).join("\n")}
`);
    }
}
