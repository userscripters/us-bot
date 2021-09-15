import { expect } from "chai";
import { splitENV } from "../src/helpers.js";

describe("splitENV", () => {
    it("should correctly split ENV vars with multiple values", () => {
        const split = splitENV("A|B|C");
        expect(split).to.deep.equal(["A", "B", "C"]);
    });
});
