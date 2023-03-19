import { Diagram, Node, Edge } from "./builder";

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
	widths: number[];

	constructor(diagram: Diagram) {
		this.diagram = diagram;
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
		const node_heights = this.diagram.nodes.map((node) => node.height);
		this.heights.push(Math.max(...node_heights));
		this.diagram.edges.forEach((edge) => {
			this.heights.push(this.diagram.spanHeight);
			this.heights.push(0);
		});
		this.heights.push(this.diagram.spanHeight);
	}

	size(): Size {
		const width = this.widths.reduce((a, b) => a + b);
		const height = this.heights.reduce((a, b) => a + b);

		return new Size(width, height);
	}

	node(node: Node): Box {
		const index = this.diagram.nodes.indexOf(node);
		const x = this.widths.slice(0, index * 2 + 1).reduce((a, b) => a + b, 0);
		const y = this.heights[0] + (this.heights[1] - node.height) / 2;

		return new Box(x, y, node.width, node.height);
	}

	edge(edge: Edge): Box {
		const index = this.diagram.edges.indexOf(edge);

		const nodes = [this.node(edge.from), this.node(edge.to)];
		nodes.sort((a, b) => a.left() - b.left());

		const x1 = nodes[0].center().x;
		const x2 = nodes[1].center().x;
		const y = this.heights.slice(0, index * 2 + 3).reduce((a, b) => a + b, 0);

		return new Box(x1, y, x2 - x1, 1);
	}
}
