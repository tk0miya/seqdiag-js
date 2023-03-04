import assert from "assert";
import { parse } from "../src/parser";
import { buildDiagram } from "../src/builder";

describe("buildDiagram()", () => {
	describe("build a diagram", () => {
		it("can build an empty diagram", () => {
			const ast = parse("seqdiag {}");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);
		});
	});
});
