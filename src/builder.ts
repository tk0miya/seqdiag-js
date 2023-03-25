import * as parser from "./parser";
import { ASTKinds } from "./parser";

interface IConfigurable<T> {
	booleanFields: { [key: string]: keyof T };
	integerFields: { [key: string]: keyof T };
	stringFields: { [key: string]: keyof T };
	setBooleanAttribute(name: string, value: string | number | undefined, propName: keyof T): void;
	setIntegerAttribute(name: string, value: string | number | undefined, propName: keyof T): void;
	setStringAttribute(name: string, value: string | number | undefined, propName: keyof T): void;
}

class Configurable {
	booleanFields: { [key: string]: string } = {};
	integerFields: { [key: string]: string } = {};
	stringFields: { [key: string]: string } = {};

	setAttributes(statements: parser.attribute_stmt[] | parser.option_stmt[]) {
		statements.forEach((stmt) => {
			this.setAttribute(stmt.name, stmt.value);
		});
	}

	setAttribute<T>(this: IConfigurable<T>, name: string, value: string | number | undefined) {
		if (name in this.booleanFields) {
			this.setBooleanAttribute(name, value, this.booleanFields[name]);
		} else if (name in this.integerFields) {
			this.setIntegerAttribute(name, value, this.integerFields[name]);
		} else if (name in this.stringFields) {
			this.setStringAttribute(name, value, this.stringFields[name]);
		} else {
			console.log(`unknown attribute: ${name}`);
		}
	}

	setBooleanAttribute<T>(this: T, name: string, value: string | number | undefined, propName: keyof T) {
		if (value === "false") {
			this[propName] = false as never;
		} else {
			this[propName] = true as never;
		}
	}

	setIntegerAttribute<T>(this: T, name: string, value: string | number | undefined, propName: keyof T) {
		if (typeof value === "number") {
			this[propName] = value as never;
		} else {
			console.log(`unknown ${name}: ${value}`);
		}
	}

	setStringAttribute<T>(this: T, name: string, value: string | number | undefined, propName: keyof T) {
		if (value !== undefined) {
			this[propName] = value.toString() as never;
		} else {
			console.log(`unknown ${name}: ${value}`);
		}
	}
}

export class Diagram extends Configurable {
	edges: Edge[];
	nodes: Node[];

	defaultLineColor = "black";
	defaultNodeColor = "white";
	defaultTextColor = "black";
	nodeHeight = 40;
	nodeWidth = 120;
	spanHeight = 20;
	spanWidth = 60;

	integerFields: { [key: string]: keyof Diagram } = {
		node_height: "nodeHeight",
		node_width: "nodeWidth",
		span_height: "spanHeight",
		span_width: "spanWidth",
	};
	stringFields: { [key: string]: keyof Diagram } = {
		default_linecolor: "defaultLineColor",
		default_node_color: "defaultNodeColor",
		default_textcolor: "defaultTextColor",
	};

	constructor() {
		super();
		this.edges = [];
		this.nodes = [];
	}
}

export class Node extends Configurable {
	id: string;
	label: string;

	color: string;
	height: number;
	lineColor: string;
	textColor: string;
	width: number;

	integerFields: { [key: string]: keyof Node } = {
		height: "height",
		width: "width",
	};
	stringFields: { [key: string]: keyof Node } = {
		color: "color",
		label: "label",
		linecolor: "lineColor",
		textcolor: "textColor",
	};

	constructor(diagram: Diagram, node_id: string) {
		super();
		this.id = node_id;
		this.label = node_id;

		this.color = diagram.defaultNodeColor;
		this.height = diagram.nodeHeight;
		this.lineColor = diagram.defaultLineColor;
		this.textColor = diagram.defaultTextColor;
		this.width = diagram.nodeWidth;
	}
}

export class Edge extends Configurable {
	from: Node;
	op: string;
	to: Node;

	asynchronous: boolean;
	color: string;
	diagonal = false;
	direction: "forward" | "back";
	failed = false;
	label = "";
	return = "";
	style: "solid" | "dashed";
	textColor: string;

	booleanFields: { [key: string]: keyof Edge } = {
		diagonal: "diagonal",
		failed: "failed",
	};
	stringFields: { [key: string]: keyof Edge } = {
		color: "color",
		label: "label",
		return: "return",
		textcolor: "textColor",
	};

	constructor(diagram: Diagram, from: Node, op: string, to: Node) {
		super();
		this.from = from;
		this.op = op;
		this.to = to;

		this.asynchronous = op.startsWith("<<") || op.endsWith(">>");
		this.color = diagram.defaultLineColor;
		this.direction = op.endsWith(">") ? "forward" : "back";
		this.style = op.includes("--") ? "dashed" : "solid";
		this.textColor = diagram.defaultTextColor;
	}

	isSelfReferenced(): boolean {
		return this.from === this.to;
	}
}

class DiagramBuilder {
	diagram: Diagram;

	constructor() {
		this.diagram = new Diagram();
	}

	build(ast: parser.diagram): void {
		this.diagram = new Diagram();
		const attributes = ast.statements.filter(
			(stmt) => stmt.kind === ASTKinds.attribute_stmt,
		) as parser.attribute_stmt[];
		this.diagram.setAttributes(attributes);

		ast.statements.forEach((stmt) => {
			switch (stmt.kind) {
				case ASTKinds.node_stmt:
					this.buildNode(stmt);
					break;
				case ASTKinds.edge_stmt:
					this.buildEdge(stmt);
					break;
			}
		});
	}

	private buildNode(stmt: parser.node_stmt): void {
		const node = this.findOrBuildNode(stmt.name);
		node.setAttributes(stmt.options);
	}

	private findOrBuildNode(name: string): Node {
		const node = this.diagram.nodes.find((node) => node.id === name);
		if (node) {
			return node;
		} else {
			const newNode = new Node(this.diagram, name);
			this.diagram.nodes.push(newNode);
			return newNode;
		}
	}

	private buildEdge(stmt: parser.edge_stmt) {
		const from = this.findOrBuildNode(stmt.from);
		this.buildEdgeSub(stmt, from, 0);
	}

	private buildEdgeSub(stmt: parser.edge_stmt, from: Node, index: number) {
		const { op, target } = stmt.to[index];
		const to = this.findOrBuildNode(target);

		let edge;
		if (op === "=>") {
			edge = new Edge(this.diagram, from, "->", to);
		} else {
			edge = new Edge(this.diagram, from, op, to);
		}
		edge.setAttributes(stmt.options);
		this.diagram.edges.push(edge);

		if (stmt.to.length > index + 1) {
			this.buildEdgeSub(stmt, to, index + 1);
		}

		if (op === "=>") {
			edge = new Edge(this.diagram, from, "<-", to);
			edge.setAttributes(stmt.options);
			edge.label = edge.return;
			edge.style = "dashed";
			this.diagram.edges.push(edge);
		}
	}
}

export function buildDiagram(ast: parser.ParseResult): Diagram | undefined {
	if (!ast.ast) return;

	const builder = new DiagramBuilder();
	builder.build(ast.ast);
	return builder.diagram;
}
