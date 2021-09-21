import { expect } from "chai";
import { BotConfig } from "../src/config.js";
import { sayWhoMadeMe } from "../src/messages.js";

describe("Messages", () => {
    describe("sayWhoWeAre", () => {
        it("should correctly describe author", async () => {
            const author = await sayWhoMadeMe({} as BotConfig);
            expect(author).to.match(/\w+ made me/);
        });
    });
});
