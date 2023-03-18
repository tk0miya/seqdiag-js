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

	constructor(diagram: Diagram) {
		this.diagram = diagram;
	}

	size(): Size {
		const nodes = this.diagram.nodes.length;
		const edges = this.diagram.edges.length;

		const height = this.diagram.defaultNodeHeight + (edges + 2) * this.diagram.defaultSpanHeight;
		const width = nodes * this.diagram.defaultNodeWidth + (nodes + 1) * this.diagram.defaultSpanWidth;

		return new Size(width, height);
	}

	node(node: Node): Box {
		const index = this.diagram.nodes.indexOf(node);
		const x = index * this.diagram.defaultNodeWidth + (index + 1) * this.diagram.defaultSpanWidth;
		const y = this.diagram.defaultSpanHeight;

		return new Box(x, y, this.diagram.defaultNodeWidth, this.diagram.defaultNodeHeight);
	}

	edge(edge: Edge): Box {
		const index = this.diagram.edges.indexOf(edge);

		const nodes = [this.node(edge.from), this.node(edge.to)];
		nodes.sort((a, b) => a.left() - b.left());

		const x1 = nodes[0].center().x;
		const x2 = nodes[1].center().x;
		const y = this.diagram.defaultNodeHeight + (index + 2) * this.diagram.defaultSpanHeight;

		return new Box(x1, y, x2 - x1, 1);
	}
}
