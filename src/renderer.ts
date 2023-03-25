import { Diagram, Edge, Node, ActivationBar } from "./builder";
import { Metrics, Size } from "./metrics";
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
		this.metrics = new Metrics(diagram, this);
	}

	render() {
		const size = this.metrics.size();
		this.drawer.size(size.width, size.height);

		this.diagram.nodes.forEach((node) => {
			this.renderNode(node);
			this.renderLifeline(node);
		});

		this.diagram.activationBars.forEach((bar) => {
			this.renderActivationBar(bar);
		});

		this.diagram.edges.forEach((edge) => {
			this.renderEdge(edge);
		});

		this.element.id ||= generateElementId();
		this.drawer.addTo(`#${this.element.id}`);
	}

	private renderArrowheads(asynchronous: boolean, color: string): Marker {
		let callback;
		if (asynchronous) {
			callback = (marker: Marker) => {
				marker.line(0, 0, 10, 5).stroke(color);
				marker.line(0, 10, 10, 5).stroke(color);
			};
		} else {
			callback = (marker: Marker) => {
				marker.path("M 0 0 L 10 5 L 0 10").fill(color);
			};
		}

		return this.drawer.marker(10, 10, callback).ref(10, 5).orient("auto-start-reverse");
	}

	private renderEdge(edge: Edge) {
		const box = this.metrics.edge(edge);
		let top = box.top();
		if (edge.label) {
			const textSize = this.textSize(edge.label);
			if (edge.direction === "forward") {
				this.drawer.text(edge.label).move(box.left() + 4, top);
			} else {
				this.drawer.text(edge.label).move(box.right() - textSize.width - 4, top);
			}
			top += textSize.height;
		}

		let arrow;
		if (edge.isSelfReferenced()) {
			const points = [box.left(), top, box.right(), top, box.right(), box.bottom()];
			if (edge.failed) {
				points.push(box.center().x);
				points.push(box.bottom());
			} else {
				points.push(box.left());
				points.push(box.bottom());
			}
			arrow = this.drawer.polyline(points).fill("none").stroke(edge.color);
		} else {
			arrow = this.drawer.line(box.left(), top, box.right(), box.bottom()).stroke(edge.color);
		}

		if (edge.style === "dashed") {
			arrow.stroke({ dasharray: "2" });
		}

		const marker = this.renderArrowheads(edge.asynchronous, edge.color);
		const leftToRight = this.diagram.nodes.indexOf(edge.from) <= this.diagram.nodes.indexOf(edge.to);
		if (leftToRight) {
			arrow.marker("end", marker);
		} else {
			arrow.marker("start", marker);
		}

		if (edge.failed) {
			const x = edge.isSelfReferenced() ? box.center().x - 16 : box.right() + 16;
			const y = box.bottom();
			this.drawer.line(x - 8, y - 8, x + 8, y + 8).stroke(edge.color);
			this.drawer.line(x - 8, y + 8, x + 8, y - 8).stroke(edge.color);
		}
	}

	private renderLifeline(node: Node) {
		const box = this.metrics.lifeline(node);
		this.drawer
			.line(box.left(), box.top(), box.right(), box.bottom())
			.stroke({ color: this.diagram.defaultLineColor, dasharray: "8,4" });
	}

	private renderNode(node: Node) {
		const box = this.metrics.node(node);
		this.drawer.rect(box.width, box.height).fill(node.color).stroke(node.lineColor).move(box.left(), box.top());

		const text = this.textSize(node.label);
		const x = box.left() + box.width / 2 - text.width / 2;
		const y = box.top() + box.height / 2 - text.height / 2;
		this.drawer.text(node.label).move(x, y);
	}

	private renderActivationBar(bar: ActivationBar) {
		const box = this.metrics.activationBar(bar);
		this.drawer
			.rect(box.width, box.height)
			.fill("moccasin")
			.stroke(this.diagram.defaultLineColor)
			.move(box.left(), box.top());
	}

	textSize(s: string): Size {
		const text = this.drawer.text(s);
		const bbox = text.bbox();
		text.remove();
		return new Size(bbox.width, bbox.height);
	}
}
