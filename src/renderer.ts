import { Diagram, Node } from "./builder";
import { Metrics } from "./metrics";
import { Marker, SVG, Svg } from "@svgdotjs/svg.js";

// https://stackoverflow.com/a/8084248
function generateElementId() {
	return `seqdiag-${Math.random().toString(32).substring(2)}`;
}

export class DiagramRenderer {
	diagram: Diagram;
	drawer: Svg;
	element: Element;
	metrics: Metrics;

	constructor(diagram: Diagram, element: Element) {
		this.diagram = diagram;
		this.element = element;
		this.drawer = SVG();
		this.metrics = new Metrics(diagram);
	}

	render() {
		const size = this.metrics.size();
		this.drawer.size(size.width, size.height);

		this.diagram.nodes.forEach((node) => {
			this.render_node(node);
			this.render_lifeline(node);
		});

		this.element.id ||= generateElementId();
		this.drawer.addTo(`#${this.element.id}`);
	}

	private render_lifeline(node: Node) {
		const box = this.metrics.lifeline(node);
		this.drawer.line(box.left(), box.top(), box.right(), box.bottom()).stroke({ color: "black", dasharray: "8,4" });
	}

	private render_node(node: Node) {
		const box = this.metrics.node(node);
		this.drawer.rect(box.width, box.height).fill("white").stroke("black").move(box.left(), box.top());

		const [textWidth, textHeight] = this.textSize(node.label);
		const x = box.left() + box.width / 2 - textWidth / 2;
		const y = box.top() + box.height / 2 - textHeight;
		this.drawer.text(node.label).move(x, y);
	}

	private textSize(s: string): [number, number] {
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
