import EventEmitter from "events";
import { splitENV } from "./helpers.js";

export class BotConfig extends EventEmitter {
    public roomIds: string[] = [];

    public logLevel = "default";

    #email: string;
    #password: string;

    constructor({ ROOM_IDS, EMAIL = "", PASSWORD = "" }: NodeJS.ProcessEnv) {
        super();
        this.roomIds.push(...splitENV(ROOM_IDS));
        this.#email = EMAIL;
        this.#password = PASSWORD;
    }

    getCredentials(): [email: string, pwd: string] {
        return [this.#email, this.#password];
    }
}
