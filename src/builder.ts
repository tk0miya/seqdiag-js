import * as parser from "./parser";
import { ASTKinds } from "./parser";

export class Diagram {
	nodes: Node[];

	constructor() {
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
			}
		});
	}

	private build_node(stmt: parser.node_stmt): void {
		this.diagram.nodes.push(new Node(stmt.name));
	}
}

export function buildDiagram(ast: parser.ParseResult): Diagram | undefined {
	if (!ast.ast) return;

	const builder = new DiagramBuilder();
	builder.build(ast.ast);
	return builder.diagram;
}
