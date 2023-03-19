/**
 * @jest-environment jsdom
 */

import assert from "assert";
import { parse } from "../src/parser";
import { buildDiagram } from "../src/builder";
import { DiagramRenderer } from "../src/renderer";

// https://github.com/apexcharts/react-apexcharts/issues/52#issuecomment-844757362
Object.defineProperty(global.SVGElement.prototype, "getBBox", {
	writable: true,
	value: jest.fn().mockReturnValue({
		x: 0,
		y: 0,
	}),
});

describe("DiagramRenderer", () => {
	describe("render()", () => {
		it("can render a diagram", () => {
			const ast = parse("seqdiag { A; B; }");
			const diagram = buildDiagram(ast);
			assert(diagram !== undefined);

			const rootElement = document.body;
			const renderer = new DiagramRenderer(diagram, rootElement);
			renderer.render();

			// NOTE: jsdom inserts a dummy node automatically to obtain the rendered size of the text
			expect(rootElement.children.length).toBe(2);
			expect(rootElement.lastElementChild?.tagName).toBe("svg");
		});
	});
});
