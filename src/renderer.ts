import { Diagram, Edge, Node } from "./builder";
import { Metrics } from "./metrics";
import { Marker, SVG, Svg } from "@svgdotjs/svg.js";

// https://stackoverflow.com/a/8084248
function generateElementId() {
	return `seqdiag-${Math.random().toString(32).substring(2)}`;
}

export class DiagramRenderer {
	arrowheads: { [key: string]: Marker };
	diagram: Diagram;
	drawer: Svg;
	element: Element;
	metrics: Metrics;

	constructor(diagram: Diagram, element: Element) {
		this.arrowheads = {};
		this.diagram = diagram;
		this.element = element;
		this.drawer = SVG();
		this.metrics = new Metrics(diagram);
	}

	render() {
		this.initialize_arrowheads();

		const size = this.metrics.size();
		this.drawer.size(size.width, size.height);

		this.diagram.nodes.forEach((node) => {
			this.render_node(node);
			this.render_lifeline(node);
		});

		this.diagram.edges.forEach((edge) => {
			this.render_edge(edge);
		});

		this.element.id ||= generateElementId();
		this.drawer.addTo(`#${this.element.id}`);
	}

	private initialize_arrowheads() {
		this.arrowheads["sync"] = this.drawer
			.marker(10, 10, function (marker) {
				marker.path("M 0 0 L 10 5 L 0 10");
			})
			.ref(10, 5)
			.orient("auto-start-reverse");
		this.arrowheads["async"] = this.drawer
			.marker(10, 10, function (marker) {
				marker.line(0, 0, 10, 5).stroke("black");
				marker.line(0, 10, 10, 5).stroke("black");
			})
			.ref(10, 5)
			.orient("auto-start-reverse");
	}

	private render_edge(edge: Edge) {
		const box = this.metrics.edge(edge);
		let arrow;

		if (edge.is_self_referenced()) {
			const points = [box.left(), box.top(), box.right(), box.top(), box.right(), box.bottom()];
			if (edge.failed) {
				points.push(box.center().x);
				points.push(box.bottom());
			} else {
				points.push(box.left());
				points.push(box.bottom());
			}
			arrow = this.drawer.polyline(points).fill("none").stroke("black");
		} else {
			arrow = this.drawer.line(box.left(), box.top(), box.right(), box.bottom()).stroke("black");
		}

		if (edge.style === "dashed") {
			arrow.stroke({ dasharray: "2" });
		}

		const marker = edge.asynchronous ? this.arrowheads["async"] : this.arrowheads["sync"];
		if (edge.direction === "forward") {
			arrow.marker("end", marker);
		} else {
			arrow.marker("start", marker);
		}

		if (edge.failed) {
			const x = edge.is_self_referenced() ? box.center().x - 16 : box.right() + 16;
			const y = box.bottom();
			this.drawer.line(x - 8, y - 8, x + 8, y + 8).stroke("black");
			this.drawer.line(x - 8, y + 8, x + 8, y - 8).stroke("black");
		}
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
