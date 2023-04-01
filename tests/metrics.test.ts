/**
 * @jest-environment jsdom
 */

import assert from "assert";
import { parse } from "../src/parser";
import { buildDiagram } from "../src/builder";
import { Box, Metrics, Size } from "../src/metrics";
import { DiagramRenderer } from "../src/renderer";

describe("Size", () => {
	describe("new Size()", () => {
		it("has width and height as properties", () => {
			const width = 123;
			const height = 456;
			const size = new Size(width, height);

			expect(size.width).toBe(width);
			expect(size.height).toBe(height);
		});
	});

	describe("Size.move()", () => {
		it("returns a Box instance", () => {
			const width = 123;
			const height = 456;
			const size = new Size(width, height);

			const x = 78;
			const y = 90;
			const box = size.move(x, y);
			expect(box.coordinate.x).toBe(x);
			expect(box.coordinate.y).toBe(y);
			expect(box.width).toBe(width);
			expect(box.height).toBe(height);
		});
	});
});

describe("Box", () => {
	describe("new Box()", () => {
		it("has coordinate, width and height as properties", () => {
			const width = 123;
			const height = 456;
			const x = 78;
			const y = 90;
			const box = new Box(x, y, width, height);

			expect(box.coordinate.x).toBe(x);
			expect(box.coordinate.y).toBe(y);
			expect(box.width).toBe(width);
			expect(box.height).toBe(height);
		});
	});

	describe("Box.extend()", () => {
		it("returns an extended Box", () => {
			const width = 123;
			const height = 456;
			const x = 78;
			const y = 90;
			const box = new Box(x, y, width, height);

			const [top, left, right, bottom] = [1, 2, 3, 4];
			const extended = box.extend({ top, left, right, bottom });
			expect(extended.coordinate.x).toBe(x - left);
			expect(extended.coordinate.y).toBe(y - top);
			expect(extended.width).toBe(width + left + right);
			expect(extended.height).toBe(height + top + bottom);
		});
	});
});

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
			expect(metrics.edge(diagram.edges[0])).toMatchObject({ coordinate: { x: 124, y: 80 }, height: 0, width: 172 });
			expect(metrics.edge(diagram.edges[1])).toMatchObject({ coordinate: { x: 128, y: 100 }, height: 0, width: 352 });
		});
	});
});
