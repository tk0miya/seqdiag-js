import * as parser from "./parser";
import { ASTKinds } from "./parser";

export class Diagram {
	edges: Edge[];
	nodes: Node[];

	defaultNodeHeight = 40;
	defaultNodeWidth = 120;
	defaultSpanHeight = 20;
	defaultSpanWidth = 60;

	constructor() {
		this.edges = [];
		this.nodes = [];
	}
}

export class Node {
	id: string;
	label: string;

	constructor(node_id: string) {
		this.id = node_id;
		this.label = node_id;
	}
}

export class Edge {
	from: Node;
	op: string;
	to: Node;

	constructor(from: Node, op: string, to: Node) {
		this.from = from;
		this.op = op;
		this.to = to;
	}
}

class DiagramBuilder {
	diagram: Diagram;

	constructor() {
		this.diagram = new Diagram();
	}

	build(ast: parser.diagram): void {
		this.diagram = new Diagram();

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
		this.diagram.nodes.push(new Node(stmt.name));
	}

	private find_or_build_node(name: string): Node {
		const node = this.diagram.nodes.find((node) => node.id === name);
		if (node) {
			return node;
		} else {
			const new_node = new Node(name);
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
			edge = new Edge(from, "->", to);
		} else {
			edge = new Edge(from, op, to);
		}
		this.diagram.edges.push(edge);

		if (stmt.to.length > index + 1) {
			this.build_edge_sub(stmt, to, index + 1);
		}

		if (op === "=>") {
			edge = new Edge(from, "<-", to);
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
