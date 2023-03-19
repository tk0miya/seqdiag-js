import assert from "assert";
import { parse } from "../src/parser";
import { buildDiagram } from "../src/builder";

describe("buildDiagram()", () => {
	describe("build a diagram", () => {
		it("can build an empty diagram", () => {
			const ast = parse("seqdiag {}");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);
			expect(diagram.edges.length).toBe(0);
			expect(diagram.nodes.length).toBe(0);
		});

		it("can build a diagram having node definitions", () => {
			const ast = parse("seqdiag { A; B; }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);
			expect(diagram.edges.length).toBe(0);
			expect(diagram.nodes.length).toBe(2);
			expect(diagram.nodes[0]).toMatchObject({ id: "A", label: "A" });
			expect(diagram.nodes[1]).toMatchObject({ id: "B", label: "B" });
		});

		it("can build a diagram having edge definitions", () => {
			const ast = parse("seqdiag { A -> B -> C; D => E => F }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);
			expect(diagram.edges.length).toBe(6);
			expect(diagram.edges[0]).toMatchObject({ from: { id: "A" }, op: "->", to: { id: "B" } });
			expect(diagram.edges[1]).toMatchObject({ from: { id: "B" }, op: "->", to: { id: "C" } });
			expect(diagram.edges[2]).toMatchObject({ from: { id: "D" }, op: "->", to: { id: "E" } });
			expect(diagram.edges[3]).toMatchObject({ from: { id: "E" }, op: "->", to: { id: "F" } });
			expect(diagram.edges[4]).toMatchObject({ from: { id: "E" }, op: "<-", to: { id: "F" } });
			expect(diagram.edges[5]).toMatchObject({ from: { id: "D" }, op: "<-", to: { id: "E" } });
			expect(diagram.nodes.length).toBe(6);
			expect(diagram.nodes[0]).toMatchObject({ id: "A", label: "A" });
			expect(diagram.nodes[1]).toMatchObject({ id: "B", label: "B" });
			expect(diagram.nodes[2]).toMatchObject({ id: "C", label: "C" });
			expect(diagram.nodes[3]).toMatchObject({ id: "D", label: "D" });
			expect(diagram.nodes[4]).toMatchObject({ id: "E", label: "E" });
			expect(diagram.nodes[5]).toMatchObject({ id: "F", label: "F" });
		});

		it("can assign attributes to the diagram", () => {
			const ast = parse(`seqdiag {
								 node_height = 123;
								 node_width = 456;
								 span_height = 789;
								 span_width = 123;
							   }`);
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);
			expect(diagram.nodeHeight).toBe(123);
			expect(diagram.nodeWidth).toBe(456);
			expect(diagram.spanHeight).toBe(789);
			expect(diagram.spanWidth).toBe(123);
		});
	});
});
