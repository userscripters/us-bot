import { expect } from "chai";
import { LIST_COLUMNS } from "../src/expressions.js";

const allMatch = (regex: RegExp, matches: string[], shouldMatch = true) =>
    matches.forEach((txt) => {
        const matched = regex.test(txt);
        expect(matched, `<${txt}> not matched`).to.be[
            shouldMatch.toString() as keyof Chai.Assertion
        ];
    });

describe("Regular expressions", () => {
    describe("project column listing", () => {
        it("should correctly match commands", () => {
            allMatch(LIST_COLUMNS, [
                `list the "userscripts" project columns`,
                `show columns from "user" project`,
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
