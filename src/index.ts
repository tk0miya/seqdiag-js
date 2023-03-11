import { parse } from "./parser";
import { buildDiagram } from "./builder";
import { DiagramRenderer } from "./renderer";

export function main(element: Element): void {
	const source = element.textContent || "";
	const ast = parse(source);
	const diagram = buildDiagram(ast);

	if (diagram) {
		element.textContent = "";
		const renderer = new DiagramRenderer(diagram, element);
		renderer.render();
	}
}

window.addEventListener("load", () => {
	document.querySelectorAll(".seqdiag").forEach((elem) => {
		main(elem);
	});
});
