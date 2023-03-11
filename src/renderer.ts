import { Diagram, Node } from "./builder";
import { SVG, Svg } from "@svgdotjs/svg.js";

// https://stackoverflow.com/a/8084248
function generateElementId() {
	return `seqdiag-${Math.random().toString(32).substring(2)}`;
}

export class DiagramRenderer {
	diagram: Diagram;
	drawer: Svg;
	element: Element;

	constructor(diagram: Diagram, element: Element) {
		this.diagram = diagram;
		this.element = element;
		this.drawer = SVG();
	}

	render() {
		this.diagram.nodes.forEach((node) => {
			this.render_node(node);
		});

		this.element.id ||= generateElementId();
		this.drawer.addTo(`#${this.element.id}`);
	}

	private render_node(node: Node) {
		const index = this.diagram.nodes.indexOf(node);

		const x = this.diagram.spanWidth * (index + 1) + this.diagram.nodeWidth * index;
		const y = this.diagram.spanHeight;

		this.drawer.rect(this.diagram.nodeWidth, this.diagram.nodeHeight).fill("white").stroke("black").move(x, y);

		const [textWidth, textHeight] = this.textsize(node.label);
		const textX = x + this.diagram.nodeWidth / 2 - textWidth / 2;
		const textY = y + this.diagram.nodeHeight / 2 - textHeight;
		this.drawer.text(node.label).move(textX, textY);
	}

	private textsize(s: string): [number, number] {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (context) {
			const metrics = context.measureText(s);
			return [metrics.width, metrics.actualBoundingBoxAscent];
		} else {
			return [0, 0];
		}
	}
}
