import { expect } from "chai";
import { LIST_COLUMNS, WHO_MADE_ME } from "../src/expressions.js";

const allMatch = (regex: RegExp, matches: string[], shouldMatch = true) =>
    matches.forEach((txt) => {
        const matched = regex.test(txt);
        expect(matched, `<${txt}> not matched`).to.be[
            shouldMatch.toString() as keyof Chai.Assertion
        ];
    });

describe("Regular expressions", () => {
    describe("author and contributors", () => {
        it("should correctly match request for author", () => {
            allMatch(WHO_MADE_ME, [
                "who made you?",
                "who made the bot",
                "who made bot",
                "who created you?",
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
