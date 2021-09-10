import EventEmitter from "events";
import { splitENV } from "./helpers.js";

export class BotConfig extends EventEmitter {
    public roomIds: string[] = [];

    public logLevel = "default";

    public throttles: Map<string, number> = new Map();

    public org: string;

    #email: string;
    #password: string;

    constructor({
        ROOM_IDS,
        EMAIL = "",
        PASSWORD = "",
        THROTTLES = "{}",
        ORG_NAME,
    }: NodeJS.ProcessEnv) {
        super();
        this.roomIds.push(...splitENV(ROOM_IDS));
        this.#email = EMAIL;
        this.#password = PASSWORD;
        this.org = ORG_NAME!;

        const parsed: Record<string, string> = JSON.parse(THROTTLES);
        Object.entries(parsed).forEach(([id, throttle]) => {
            this.throttles.set(id, +throttle);
        });
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
