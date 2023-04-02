import { Diagram, Node, Edge, ActivationBar, Group, Message, Separator } from "./builder";
import { DiagramRenderer } from "./renderer";

export const Margin = 2;
const activationBarWidth = 8;

export class Size {
	height: number;
	width: number;

	constructor(width: number, height: number) {
		this.height = height;
		this.width = width;
	}

	move(x: number, y: number): Box {
		return new Box(x, y, this.width, this.height);
	}
}

export class Point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

export class Box extends Size {
	coordinate: Point;

	constructor(x: number, y: number, width: number, height: number) {
		super(width, height);
		this.coordinate = new Point(x, y);
	}

	top(): number {
		return this.coordinate.y;
	}

	left(): number {
		return this.coordinate.x;
	}

	right(): number {
		return this.coordinate.x + this.width;
	}

	bottom(): number {
		return this.coordinate.y + this.height;
	}

	center(): Point {
		return new Point(this.coordinate.x + this.width / 2, this.coordinate.y + this.height / 2);
	}

	extend({ top, left, right, bottom }: { top?: number; left?: number; right?: number; bottom?: number }): Box {
		return new Box(
			this.coordinate.x - (left || 0),
			this.coordinate.y - (top || 0),
			this.width + (left || 0) + (right || 0),
			this.height + (top || 0) + (bottom || 0),
		);
	}
}

export class Metrics {
	diagram: Diagram;
	heights: number[];
	renderer: DiagramRenderer;
	widths: number[];

	constructor(diagram: Diagram, renderer: DiagramRenderer) {
		this.diagram = diagram;
		this.renderer = renderer;
		this.widths = [];
		this.heights = [];

		this.calculate();
	}

	calculate() {
		// widths
		this.diagram.nodes.forEach((node) => {
			this.widths.push(this.diagram.spanWidth);
			this.widths.push(node.width);
		});
		this.widths.push(this.diagram.spanWidth);

		// heights
		this.heights.push(this.diagram.spanHeight);
		const nodeHeights = this.diagram.nodes.map((node) => node.height);
		this.heights.push(Math.max(...nodeHeights));
		this.diagram.messages.forEach((msg) => {
			this.heights.push(this.diagram.spanHeight);
			this.heights.push(this.message(msg).height);
		});
		this.heights.push(this.diagram.spanHeight);
		this.heights.push(this.diagram.spanHeight);
	}

	size(): Size {
		const width = this.widths.reduce((a, b) => a + b);
		const height = this.heights.reduce((a, b) => a + b);

		return new Size(width, height);
	}

	lifeline(node: Node): Box {
		const box = this.node(node);
		const height = this.heights.reduce((a, b) => a + b, 0) - this.heights.slice(-1)[0];

		return new Box(box.center().x, box.bottom(), 0, height);
	}

	node(node: Node): Box {
		const index = this.diagram.nodes.indexOf(node);
		const x = this.widths.slice(0, index * 2 + 1).reduce((a, b) => a + b, 0);
		const y = this.heights[0] + (this.heights[1] - node.height) / 2;

		return new Box(x, y, node.width, node.height);
	}

	edge(edge: Edge): Box {
		const index = this.diagram.messages.indexOf(edge);
		let textHeight = 0;
		if (edge.label) {
			textHeight = this.textSize(edge).height;
		}

		if (edge.isSelfReferenced()) {
			const i = this.diagram.nodes.indexOf(edge.from);

			const node = this.node(edge.from);
			const x = node.center().x;
			const dx = this.diagram.activationDepths[edge.from.id][index] * (activationBarWidth / 2);
			const y = this.heights.slice(0, index * 2 + 3).reduce((a, b) => a + b, 0);
			const width = node.width / 2 + this.widths[i * 2] / 2;
			const height = this.diagram.nodeHeight;

			return new Box(x + dx, y, width - dx, height + textHeight);
		} else {
			const depths = this.diagram.activationDepths;
			const nodes = [edge.from, edge.to];
			nodes.sort((a, b) => this.diagram.nodes.indexOf(a) - this.diagram.nodes.indexOf(b));
			const boxes = nodes.map((node) => this.node(node));

			const depth1 = this.diagram.activationDepths[nodes[0].id][index];
			const depth2 = this.diagram.activationDepths[nodes[1].id][index];

			const x1 = boxes[0].center().x;
			const dx1 = depth1 * (activationBarWidth / 2);
			const x2 = boxes[1].center().x;
			const dx2 = depth2 ? (depth2 - 2) * (activationBarWidth / 2) : 0;
			const y = this.heights.slice(0, index * 2 + 3).reduce((a, b) => a + b, 0);
			const width = edge.failed ? (x2 - x1) / 2 - dx1 * 2 : x2 - x1 - dx1 + dx2;
			const height = edge.diagonal ? (this.diagram.nodeHeight * 3) / (activationBarWidth / 2) : 0;

			return new Box(x1 + dx1, y, width, height + textHeight);
		}
	}

	group(group: Group): Box {
		const indices = group.nodes.map((node) => this.diagram.nodes.indexOf(node));
		indices.sort((a, b) => a - b);
		const left = indices[0];
		const right = indices.splice(-1)[0];

		const text = this.textSize(group);
		const x1 = this.widths.slice(0, left * 2 + 1).reduce((a, b) => a + b, 0) - 8;
		const x2 = this.widths.slice(0, (right + 1) * 2).reduce((a, b) => a + b, 0) + 8;
		const y1 = this.heights[0] - 8 - text.height;
		const y2 = this.heights.reduce((a, b) => a + b, 0) - this.diagram.spanHeight + 8;

		return new Box(x1, y1, x2 - x1, y2 - y1);
	}

	activationBar(bar: ActivationBar): Box {
		const node = this.node(bar.node);
		const x = node.center().x + (bar.depth - 2) * (activationBarWidth / 2);

		let y1;
		const from = this.message(bar.from);
		if (bar.from instanceof Edge) {
			y1 = bar.from.diagonal ? from.bottom() : from.top() + this.textSize(bar.from).height;
		} else {
			y1 = from.top();
		}

		let y2;
		if (bar.to === undefined) {
			// unterminated activationBar will end the bottom of the diagram
			y2 = this.heights.slice(0, this.heights.length - 1).reduce((a, b) => a + b, 0);
		} else {
			const to = this.message(bar.to);
			if (bar.to instanceof Edge) {
				y2 = bar.to.diagonal ? to.top() + this.textSize(bar.to).height : to.bottom();
			} else {
				y2 = to.bottom();
			}
		}

		return new Box(x, y1, 8, y2 - y1);
	}

	message(message: Message): Box {
		if (message instanceof Edge) {
			return this.edge(message);
		} else {
			return this.separator(message);
		}
	}

	separator(separator: Separator): Box {
		const index = this.diagram.messages.indexOf(separator);
		const x = this.diagram.spanWidth / 2;
		const y = this.heights.slice(0, index * 2 + 3).reduce((a, b) => a + b, 0);
		const text = this.textSize(separator);
		const width = this.size().width - this.diagram.spanWidth;

		return new Box(x, y, width, text.height + Margin * 2);
	}

	textSize({ label, fontFamily, fontSize }: { label: string; fontFamily?: string; fontSize: number }): Size {
		return this.renderer.textSize({ label, fontFamily, fontSize });
	}
}
