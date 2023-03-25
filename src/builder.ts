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

	color = "white";
	height: number;
	lineColor: string;
	width: number;

	integerFields: { [key: string]: keyof Node } = {
		height: "height",
		width: "width",
	};
	stringFields: { [key: string]: keyof Node } = {
		color: "color",
		label: "label",
		linecolor: "lineColor",
	};

	constructor(diagram: Diagram, node_id: string) {
		super();
		this.id = node_id;
		this.label = node_id;

		this.height = diagram.nodeHeight;
		this.lineColor = diagram.defaultLineColor;
		this.width = diagram.nodeWidth;
	}
}

export class Edge extends Configurable {
	from: Node;
	op: string;
	to: Node;

	asynchronous: boolean;
	color;
	diagonal = false;
	direction: "forward" | "back";
	failed = false;
	label = "";
	return = "";
	style: "solid" | "dashed";

	booleanFields: { [key: string]: keyof Edge } = {
		diagonal: "diagonal",
		failed: "failed",
	};
	stringFields: { [key: string]: keyof Edge } = {
		color: "color",
		label: "label",
		return: "return",
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
	}

	is_self_referenced(): boolean {
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
					this.build_node(stmt);
					break;
				case ASTKinds.edge_stmt:
					this.build_edge(stmt);
					break;
			}
		});
	}

	private build_node(stmt: parser.node_stmt): void {
		const node = this.find_or_build_node(stmt.name);
		node.setAttributes(stmt.options);
	}

	private find_or_build_node(name: string): Node {
		const node = this.diagram.nodes.find((node) => node.id === name);
		if (node) {
			return node;
		} else {
			const new_node = new Node(this.diagram, name);
			this.diagram.nodes.push(new_node);
			return new_node;
		}
	}

	private build_edge(stmt: parser.edge_stmt) {
		const from = this.find_or_build_node(stmt.from);
		this.build_edge_sub(stmt, from, 0);
	}

	private build_edge_sub(stmt: parser.edge_stmt, from: Node, index: number) {
		const { op, target } = stmt.to[index];
		const to = this.find_or_build_node(target);

		let edge;
		if (op === "=>") {
			edge = new Edge(this.diagram, from, "->", to);
		} else {
			edge = new Edge(this.diagram, from, op, to);
		}
		edge.setAttributes(stmt.options);
		this.diagram.edges.push(edge);

		if (stmt.to.length > index + 1) {
			this.build_edge_sub(stmt, to, index + 1);
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
