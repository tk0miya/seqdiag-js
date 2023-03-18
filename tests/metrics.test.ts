import assert from "assert";
import { parse } from "../src/parser";
import { buildDiagram } from "../src/builder";
import { Metrics } from "../src/metrics";

describe("Metrics", () => {
	describe("Metrics.node()", () => {
		it("returns a metrics of the given node", () => {
			const ast = parse("seqdiag { A; B; }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);

			const metrics = new Metrics(diagram);
			expect(metrics.node(diagram.nodes[0])).toMatchObject({ coordinate: { x: 60, y: 20 }, height: 40, width: 120 });
			expect(metrics.node(diagram.nodes[1])).toMatchObject({ coordinate: { x: 240, y: 20 }, height: 40, width: 120 });
		});
	});

	describe("Metrics.edge()", () => {
		it("returns a metrics of the given edge", () => {
			const ast = parse("seqdiag { A -> B; C -> A; }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);

			const metrics = new Metrics(diagram);
			expect(metrics.edge(diagram.edges[0])).toMatchObject({ coordinate: { x: 120, y: 80 }, height: 1, width: 180 });
			expect(metrics.edge(diagram.edges[1])).toMatchObject({ coordinate: { x: 120, y: 100 }, height: 1, width: 360 });
		});
	});
});
