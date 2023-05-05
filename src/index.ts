import { parse } from "./parser";
import { buildDiagram } from "./builder";
import { DiagramRenderer } from "./renderer";

export function build(source: string, destination: Element): void {
	const ast = parse(source);
	const diagram = buildDiagram(ast);

	if (diagram) {
		destination.innerHTML = "";
		const renderer = new DiagramRenderer(diagram, destination);
		renderer.render();
	}
}

window.addEventListener("load", () => {
	document.querySelectorAll(".seqdiag").forEach((elem) => {
		const source = elem.textContent || "";
		build(source, elem);
	});
});
