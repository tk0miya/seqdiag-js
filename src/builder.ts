import * as parser from "./parser";

export class Diagram {
}

export function buildDiagram(ast: parser.ParseResult): Diagram | undefined {
	if (!ast.ast) return;

	return new Diagram();
}
