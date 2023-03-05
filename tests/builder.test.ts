import assert from "assert";
import { parse } from "../src/parser";
import { buildDiagram } from "../src/builder";

describe("buildDiagram()", () => {
	describe("build a diagram", () => {
		it("can build an empty diagram", () => {
			const ast = parse("seqdiag {}");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);
			expect(diagram.nodes.length).toBe(0);
		});

		it("can build a diagram having node definitions", () => {
			const ast = parse("seqdiag { A; B; }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);
			expect(diagram.nodes.length).toBe(2);
			expect(diagram.nodes[0]).toMatchObject({ id: "A", label: "A" });
			expect(diagram.nodes[1]).toMatchObject({ id: "B", label: "B" });
		});
	});
});
