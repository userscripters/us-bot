var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BotConfig_email, _BotConfig_password, _BotConfig_admins;
import EventEmitter from "events";
import { splitENV } from "./helpers.js";
export class BotConfig extends EventEmitter {
    constructor({ ADMIN_IDS, ROOM_IDS, EMAIL = "", PASSWORD = "", THROTTLES = "{}", ORG_NAME, }) {
        super();
        this.roomIds = [];
        this.logLevel = "default";
        this.throttles = new Map();
        _BotConfig_email.set(this, void 0);
        _BotConfig_password.set(this, void 0);
        _BotConfig_admins.set(this, new Set());
        this.roomIds.push(...splitENV(ROOM_IDS));
        __classPrivateFieldSet(this, _BotConfig_email, EMAIL, "f");
        __classPrivateFieldSet(this, _BotConfig_password, PASSWORD, "f");
        this.org = ORG_NAME;
        splitENV(ADMIN_IDS).forEach((id) => __classPrivateFieldGet(this, _BotConfig_admins, "f").add(+id));
        const parsed = JSON.parse(THROTTLES);
        Object.entries(parsed).forEach(([id, throttle]) => {
            this.throttles.set(id, +throttle);
        });
    }
    isAdmin(idOrUser) {
        const uid = typeof idOrUser === "number" ? idOrUser : idOrUser.id;
        return __classPrivateFieldGet(this, _BotConfig_admins, "f").has(uid);
    }
    getThrottle(id) {
        const seconds = this.throttles.get(id) || 1;
        return seconds * 1e3;
    }
    getCredentials() {
        return [__classPrivateFieldGet(this, _BotConfig_email, "f"), __classPrivateFieldGet(this, _BotConfig_password, "f")];
    }
    debug() {
        const { roomIds, throttles } = this;
        console.debug(`
Bot Config:
Email: ${__classPrivateFieldGet(this, _BotConfig_email, "f")}
Rooms: ${roomIds.join(", ")}

Throttles:
${[...throttles].map(([k, v]) => `${k} - ${v}s`).join("\n")}
`);
    }
}
_BotConfig_email = new WeakMap(), _BotConfig_password = new WeakMap(), _BotConfig_admins = new WeakMap();
