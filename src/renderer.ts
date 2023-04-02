import { Diagram, Edge, Node, ActivationBar, Group, Separator } from "./builder";
import { Metrics, Size } from "./metrics";
import "@svgdotjs/svg.filter.js/src/svg.filter.js";
import { Element as SVGElement, Marker, SVG, Svg } from "@svgdotjs/svg.js";

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

		this.diagram.groups.forEach((group) => {
			this.renderGroup(group);
		});

		this.diagram.nodes.forEach((node) => {
			this.renderNode(node);
			this.renderLifeline(node);
		});

		this.diagram.activationBars.forEach((bar) => {
			this.renderActivationBar(bar);
		});

		this.diagram.messages.forEach((msg) => {
			if (msg instanceof Edge) {
				this.renderEdge(msg);
			} else {
				this.renderSeparator(msg);
			}
		});

		this.element.id ||= generateElementId();
		this.drawer.addTo(`#${this.element.id}`);
	}

	private blur(e: SVGElement) {
		// @ts-ignore
		e.filterWith(function (add) {
			add.gaussianBlur(2);
		});
	}

	private dropShadow(e: SVGElement) {
		// @ts-ignore
		e.filterWith(function (add) {
			const blur = add.offset(2, 2).in(add.$sourceAlpha).gaussianBlur(2);
			add.blend(add.$source, blur);
		});
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
			const textSize = this.textSize(edge.label, edge.fontFamily, edge.fontSize);
			const text = this.drawer
				.text(edge.label)
				.stroke(edge.textColor)
				.font({ family: edge.fontFamily, size: edge.fontSize });
			if (edge.arrowDirection() === "right" || edge.arrowDirection() === "self") {
				text.move(box.left() + 4, top);
			} else {
				text.move(box.right() - textSize.width - 4, top);
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
		} else if (edge.arrowDirection() === "right" || edge.arrowDirection() === "self") {
			arrow = this.drawer.line(box.left(), top, box.right(), box.bottom()).stroke(edge.color);
		} else {
			arrow = this.drawer.line(box.right(), top, box.left(), box.bottom()).stroke(edge.color);
		}

		if (edge.style === "dashed") {
			arrow.stroke({ dasharray: "2" });
		}

		const marker = this.renderArrowheads(edge.asynchronous, edge.color);
		arrow.marker("end", marker);

		if (edge.failed) {
			const x = edge.isSelfReferenced() ? box.center().x - 16 : box.right() + 16;
			const y = box.bottom();
			this.drawer.line(x - 8, y - 8, x + 8, y + 8).stroke(edge.color);
			this.drawer.line(x - 8, y + 8, x + 8, y - 8).stroke(edge.color);
		}
	}

	private renderGroup(group: Group) {
		const box = this.metrics.group(group);
		if (group.shape === "box") {
			const rect = this.drawer
				.rect(box.width, box.height)
				.fill(group.color)
				.stroke(group.color)
				.move(box.left(), box.top());
			this.blur(rect);
		} else {
			const line = this.drawer.rect(box.width, box.height).fill("none").stroke(group.color).move(box.left(), box.top());
			if (group.style === "dashed") {
				line.stroke({ dasharray: "2" });
			}
		}

		if (group.label) {
			const text = this.textSize(group.label, group.fontFamily, group.fontSize);
			const x = box.center().x - text.width / 2;
			const y = box.top() + 4;
			this.drawer
				.text(group.label)
				.stroke(this.diagram.defaultTextColor)
				.font({ family: this.diagram.defaultFontFamily, size: this.diagram.defaultFontSize })
				.move(x, y);
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
		const rect = this.drawer
			.rect(box.width, box.height)
			.fill(node.color)
			.stroke(node.lineColor)
			.move(box.left(), box.top());

		this.dropShadow(rect);

		const text = this.textSize(node.label, node.fontFamily, node.fontSize);
		const x = box.left() + box.width / 2 - text.width / 2;
		const y = box.top() + box.height / 2 - text.height / 2;
		this.drawer
			.text(node.label)
			.stroke(node.textColor)
			.font({ family: node.fontFamily, size: node.fontSize })
			.move(x, y);
	}

	private renderActivationBar(bar: ActivationBar) {
		const box = this.metrics.activationBar(bar);
		const rect = this.drawer
			.rect(box.width, box.height)
			.fill("moccasin")
			.stroke(this.diagram.defaultLineColor)
			.move(box.left(), box.top());
		this.dropShadow(rect);
	}

	private renderSeparator(separator: Separator) {
		const box = this.metrics.separator(separator);
		const text = this.textSize(separator.label, separator.fontFamily, separator.fontSize);
		const textBox = text.move(box.center().x - text.width / 2, box.center().y - text.height / 2);
		const frameBox = textBox.extend({ top: 2, left: 2, right: 2, bottom: 2 });

		const frame = this.drawer.rect(frameBox.width, frameBox.height).move(frameBox.left(), frameBox.top());
		if (separator.type === "divider") {
			frame.fill("lightgray").stroke(this.diagram.defaultLineColor);
		} else {
			frame.fill("white");
		}

		this.drawer
			.text(separator.label)
			.stroke(this.diagram.defaultTextColor)
			.font({ family: this.diagram.defaultFontFamily, size: this.diagram.defaultFontSize })
			.move(textBox.left(), textBox.top());

		if (separator.type === "divider") {
			const baseline = box.center().y;
			this.drawer.line(box.left(), baseline - 2, frameBox.left(), baseline - 2).stroke(this.diagram.defaultLineColor);
			this.drawer.line(box.left(), baseline + 2, frameBox.left(), baseline + 2).stroke(this.diagram.defaultLineColor);
			this.drawer.line(frameBox.right(), baseline - 2, box.right(), baseline - 2).stroke(this.diagram.defaultLineColor);
			this.drawer.line(frameBox.right(), baseline + 2, box.right(), baseline + 2).stroke(this.diagram.defaultLineColor);
		}
	}

	textSize(s: string, family: string | undefined, size: number): Size {
		const text = this.drawer.text(s).font({ family, size });
		const bbox = text.bbox();
		text.remove();
		return new Size(bbox.width, bbox.height);
	}
}
