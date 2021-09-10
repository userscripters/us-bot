import EventEmitter from "events";
import { splitENV } from "./helpers.js";

export class BotConfig extends EventEmitter {
    public roomIds: string[] = [];

    public logLevel = "default";

    public throttles: Map<string, number> = new Map();

    #email: string;
    #password: string;

    constructor({
        ROOM_IDS,
        EMAIL = "",
        PASSWORD = "",
        THROTTLES = "{}",
    }: NodeJS.ProcessEnv) {
        super();
        this.roomIds.push(...splitENV(ROOM_IDS));
        this.#email = EMAIL;
        this.#password = PASSWORD;

        Object.entries(THROTTLES).forEach(([id, throttle]) => {
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
}
