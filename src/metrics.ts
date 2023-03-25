import { Diagram, Node, Edge, ActivationBar } from "./builder";
import { DiagramRenderer } from "./renderer";

export class Size {
	height: number;
	width: number;

	constructor(width: number, height: number) {
		this.height = height;
		this.width = width;
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
		this.diagram.edges.forEach((edge) => {
			this.heights.push(this.diagram.spanHeight);
			this.heights.push(this.edge(edge).height);
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
		const index = this.diagram.edges.indexOf(edge);
		let textHeight = 0;
		if (edge.label) {
			textHeight = this.textSize(edge.label).height;
		}

		if (edge.isSelfReferenced()) {
			const i = this.diagram.nodes.indexOf(edge.from);

			const node = this.node(edge.from);
			const x = node.center().x;
			const dx = this.diagram.activationDepths[edge.from.id][index] * 4;
			const y = this.heights.slice(0, index * 2 + 3).reduce((a, b) => a + b, 0);
			const width = node.width / 2 + this.widths[i * 2] / 2;
			const height = this.diagram.nodeHeight;

			return new Box(x + dx, y, width - dx, height + textHeight);
		} else {
			const nodes = [edge.from, edge.to];
			nodes.sort((a, b) => this.diagram.nodes.indexOf(a) - this.diagram.nodes.indexOf(b));
			const boxes = nodes.map((node) => this.node(node));

			const x1 = boxes[0].center().x;
			const dx1 = this.diagram.activationDepths[nodes[0].id][index] * 4;
			const x2 = boxes[1].center().x;
			const dx2 = (this.diagram.activationDepths[nodes[1].id][index] - 2) * 4;
			const y = this.heights.slice(0, index * 2 + 3).reduce((a, b) => a + b, 0);
			const width = edge.failed ? (x2 - x1) / 2 - dx1 * 2 : x2 - x1 - dx1 + dx2;
			const height = edge.diagonal ? (this.diagram.nodeHeight * 3) / 4 : 0;

			return new Box(x1 + dx1, y, width, height + textHeight);
		}
	}

	activationBar(bar: ActivationBar): Box {
		const node = this.node(bar.node);
		const from = this.edge(bar.from);
		const to = this.edge(bar.to!);

		const x = node.center().x + (bar.depth - 1) * 4 - 4;
		const y1 = bar.from.diagonal ? from.bottom() : from.top();
		const y2 = bar.to!.diagonal ? to.top() : to.bottom();

		return new Box(x, y1, 8, y2 - y1);
	}

	textSize(s: string): Size {
		return this.renderer.textSize(s);
	}
}
