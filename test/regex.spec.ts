import { expect } from "chai";
import {
    LIST_COLUMNS,
    SHOW_HELP,
    WHO_ARE_YOU,
    WHO_MADE_ME,
} from "../src/expressions.js";

const allMatch = (regex: RegExp, matches: string[], shouldMatch = true) =>
    matches.forEach((txt) => {
        const matched = regex.test(txt);
        expect(matched, `<${txt}> not matched`).to.be[
            shouldMatch.toString() as keyof Chai.Assertion
        ];
    });

describe("Regular expressions", () => {
    describe("bot metadata", () => {
        it("should correctly match request for author", () => {
            allMatch(WHO_MADE_ME, [
                "who made you?",
                "who made the bot",
                "who made bot",
                "who created you?",
            ]);
        });

        it("should correctly match a who are you request", () => {
            allMatch(WHO_ARE_YOU, [
                "who are you?",
                "who is the bot?",
                "who is this bot?",
                "what is this bot?",
            ]);

            allMatch(WHO_ARE_YOU, ["who are we?"], false);
        });
    });

    describe("command help", () => {
        it("should correctly match commands", () => {
            allMatch(SHOW_HELP, [
                "show help for the add-idea command",
                "show help for add-idea command",
                "display help for add-idea command",
                "man for add-idea command",
                "manual for the add-idea command",
            ]);
        });
    });

    describe("project column listing", () => {
        it("should correctly match commands", () => {
            allMatch(LIST_COLUMNS, [
                `list the "userscripts" project columns`,
                `show columns from "user" project`,
                `list columns for the "userscripts" project`,
            ]);
        });

        it("should not match too greedily", () => {
            allMatch(
                LIST_COLUMNS,
                [`show "user" project`, `show our projects`],
                false
            );
        });
    });
});
