/**
 * @jest-environment jsdom
 */

import assert from "assert";
import { parse } from "../src/parser";
import { buildDiagram } from "../src/builder";
import { Metrics } from "../src/metrics";
import { DiagramRenderer } from "../src/renderer";

describe("Metrics", () => {
	describe("Metrics.node()", () => {
		it("returns a metrics of the given node", () => {
			const ast = parse("seqdiag { A; B; }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);

			const renderer = new DiagramRenderer(diagram, document.body);
			const metrics = new Metrics(diagram, renderer);
			expect(metrics.node(diagram.nodes[0])).toMatchObject({ coordinate: { x: 60, y: 20 }, height: 40, width: 120 });
			expect(metrics.node(diagram.nodes[1])).toMatchObject({ coordinate: { x: 240, y: 20 }, height: 40, width: 120 });
		});

		it("returns a metrics of the custom node", () => {
			const ast = parse(`seqdiag {
							     A; // width = 120, height = 40
							     B [width = 24, height = 96];
								 C [width = 32, height = 48];
							   }`);
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);

			const renderer = new DiagramRenderer(diagram, document.body);
			const metrics = new Metrics(diagram, renderer);
			expect(metrics.node(diagram.nodes[0])).toMatchObject({ coordinate: { x: 60, y: 48 }, height: 40, width: 120 });
			expect(metrics.node(diagram.nodes[1])).toMatchObject({ coordinate: { x: 240, y: 20 }, height: 96, width: 24 });
			expect(metrics.node(diagram.nodes[2])).toMatchObject({ coordinate: { x: 324, y: 44 }, height: 48, width: 32 });
		});

		it("returns a metrics of the given node for custom diagram", () => {
			const ast = parse(`seqdiag {
							     node_width = 20
							     node_height = 10
							     span_width = 10
							     span_height = 5
							     A; B;
							   }`);
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);

			const renderer = new DiagramRenderer(diagram, document.body);
			const metrics = new Metrics(diagram, renderer);
			expect(metrics.node(diagram.nodes[0])).toMatchObject({ coordinate: { x: 10, y: 5 }, height: 10, width: 20 });
			expect(metrics.node(diagram.nodes[1])).toMatchObject({ coordinate: { x: 40, y: 5 }, height: 10, width: 20 });
		});
	});

	describe("Metrics.edge()", () => {
		it("returns a metrics of the given edge", () => {
			const ast = parse("seqdiag { A -> B; C -> A; }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);

			const renderer = new DiagramRenderer(diagram, document.body);
			const metrics = new Metrics(diagram, renderer);
			expect(metrics.edge(diagram.edges[0])).toMatchObject({ coordinate: { x: 120, y: 80 }, height: 0, width: 180 });
			expect(metrics.edge(diagram.edges[1])).toMatchObject({ coordinate: { x: 120, y: 100 }, height: 0, width: 360 });
		});
	});
});
