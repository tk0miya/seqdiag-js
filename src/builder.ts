import * as parser from "./parser";
import { ASTKinds } from "./parser";

interface IConfigurable<T> {
	booleanFields: { [key: string]: keyof T };
	enumFields: { [key: string]: [keyof T, string[]] };
	integerFields: { [key: string]: keyof T };
	stringFields: { [key: string]: keyof T };
	setBooleanAttribute(name: string, value: string | number | undefined, propName: keyof T): void;
	setEnumAttribute(name: string, value: string | number | undefined, propName: keyof T, candidates: string[]): void;
	setIntegerAttribute(name: string, value: string | number | undefined, propName: keyof T): void;
	setStringAttribute(name: string, value: string | number | undefined, propName: keyof T): void;
}

class Configurable {
	booleanFields: { [key: string]: string } = {};
	enumFields: { [key: string]: [string, string[]] } = {};
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
		} else if (name in this.enumFields) {
			const [propName, candidates] = this.enumFields[name];
			this.setEnumAttribute(name, value, propName, candidates);
		} else if (name in this.integerFields) {
			this.setIntegerAttribute(name, value, this.integerFields[name]);
		} else if (name in this.stringFields) {
			this.setStringAttribute(name, value, this.stringFields[name]);
		} else {
			console.log(`unknown attribute: ${name}`);
		}
	}

	setBooleanAttribute<T>(this: T, name: string, value: string | number | undefined, propName: keyof T) {
		if (value === "false" || value === "none") {
			this[propName] = false as never;
		} else {
			this[propName] = true as never;
		}
	}

	setEnumAttribute<T>(
		this: T,
		name: string,
		value: string | number | undefined,
		propName: keyof T,
		candidates: string[],
	) {
		if (typeof value === "string" && candidates.includes(value)) {
			this[propName] = value as never;
		} else {
			console.log(`unknown ${name}: ${value}`);
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
	activation = true;
	activationBars: ActivationBar[];
	activationDepths: { [key: string]: number[] };
	groups: Group[];
	messages: Message[];
	nodes: Node[];

	defaultFontFamily?: string;
	defaultFontSize = 11;
	defaultLineColor = "black";
	defaultNodeColor = "white";
	defaultTextColor = "black";
	nodeHeight = 40;
	nodeWidth = 120;
	spanHeight = 20;
	spanWidth = 60;

	booleanFields: { [key: string]: keyof Diagram } = {
		activation: "activation",
	};
	integerFields: { [key: string]: keyof Diagram } = {
		default_fontsize: "defaultFontSize",
		node_height: "nodeHeight",
		node_width: "nodeWidth",
		span_height: "spanHeight",
		span_width: "spanWidth",
	};
	stringFields: { [key: string]: keyof Diagram } = {
		default_fontfamily: "defaultFontFamily",
		default_linecolor: "defaultLineColor",
		default_node_color: "defaultNodeColor",
		default_textcolor: "defaultTextColor",
	};

	constructor() {
		super();
		this.activationBars = [];
		this.activationDepths = {};
		this.groups = [];
		this.messages = [];
		this.nodes = [];
	}
}

export class Node extends Configurable {
	id: string;
	label: string;

	activated = false;
	color: string;
	fontFamily?: string;
	fontSize: number;
	height: number;
	lineColor: string;
	textColor: string;
	width: number;

	booleanFields: { [key: string]: keyof Node } = {
		activated: "activated",
	};
	integerFields: { [key: string]: keyof Node } = {
		fontsize: "fontSize",
		height: "height",
		width: "width",
	};
	stringFields: { [key: string]: keyof Node } = {
		color: "color",
		fontfamily: "fontFamily",
		label: "label",
		linecolor: "lineColor",
		textcolor: "textColor",
	};

	constructor(diagram: Diagram, node_id: string) {
		super();
		this.id = node_id;
		this.label = node_id;

		this.color = diagram.defaultNodeColor;
		this.fontFamily = diagram.defaultFontFamily;
		this.fontSize = diagram.defaultFontSize;
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
	leftToRight: boolean;

	activate = true;
	asynchronous: boolean;
	color: string;
	diagonal = false;
	direction: "forward" | "back";
	failed = false;
	fontFamily?: string;
	fontSize: number;
	label = "";
	rightNote = "";
	return = "";
	style: "solid" | "dashed";
	textColor: string;

	booleanFields: { [key: string]: keyof Edge } = {
		activate: "activate",
		diagonal: "diagonal",
		failed: "failed",
	};
	integerFields: { [key: string]: keyof Edge } = {
		fontsize: "fontSize",
	};
	stringFields: { [key: string]: keyof Edge } = {
		color: "color",
		fontfamily: "fontFamily",
		label: "label",
		note: "rightNote",
		return: "return",
		rightnote: "rightNote",
		textcolor: "textColor",
	};

	constructor(diagram: Diagram, from: Node, op: string, to: Node) {
		super();
		this.from = from;
		this.op = op;
		this.to = to;
		this.leftToRight = diagram.nodes.indexOf(from) <= diagram.nodes.indexOf(to);

		this.asynchronous = op.startsWith("<<") || op.endsWith(">>");
		this.color = diagram.defaultLineColor;
		this.direction = op.endsWith(">") ? "forward" : "back";
		this.fontFamily = diagram.defaultFontFamily;
		this.fontSize = diagram.defaultFontSize;
		this.style = op.includes("--") ? "dashed" : "solid";
		this.textColor = diagram.defaultTextColor;
	}

	setAttribute(name: string, value: string | number | undefined) {
		if (name === "noactivate") {
			this.activate = false;
		} else {
			super.setAttribute(name, value);
		}
	}

	isSelfReferenced(): boolean {
		return this.from === this.to;
	}

	arrowDirection(): "right" | "left" | "self" {
		if (this.isSelfReferenced()) {
			return "self";
		} else if ((this.leftToRight && this.direction === "forward") || (!this.leftToRight && this.direction === "back")) {
			return "right";
		} else {
			return "left";
		}
	}
}

export class ActivationBar {
	node: Node;
	from: Message;
	to?: Message;
	depth: number;

	constructor(node: Node, from: Message, to: Message | undefined, depth: number) {
		this.node = node;
		this.from = from;
		this.to = to;
		this.depth = depth;
	}
}

export class Group extends Configurable {
	nodes: Node[];

	color = "orange";
	fontFamily?: string;
	fontSize: number;
	label = "";
	shape: "box" | "line" = "box";
	style: "solid" | "dashed" = "solid";

	enumFields: { [key: string]: [keyof Group, string[]] } = {
		shape: ["shape", ["box", "line"]],
		style: ["style", ["dashed", "solid"]],
	};
	stringFields: { [key: string]: keyof Edge } = {
		color: "color",
		label: "label",
	};

	constructor(diagram: Diagram) {
		super();
		this.nodes = [];

		this.fontFamily = diagram.defaultFontFamily;
		this.fontSize = diagram.defaultFontSize;
	}
}

export class Separator {
	fontFamily?: string;
	fontSize: number;
	label: string;
	type: "delayed" | "divider";

	constructor(diagram: Diagram, label: string, op: string) {
		this.label = label;
		this.type = op === "===" ? "divider" : "delayed";

		this.fontFamily = diagram.defaultFontFamily;
		this.fontSize = diagram.defaultFontSize;
	}
}

export type Message = Edge | Separator;

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
				case ASTKinds.group_stmt:
					this.buildGroup(stmt);
					break;
				case ASTKinds.separator_stmt_1:
				case ASTKinds.separator_stmt_2:
					this.buildSeparator(stmt);
					break;
			}
		});

		this.reorderNodes();
		this.buildActivationBars();
	}

	private buildActivationBars() {
		const depths: { [key: string]: number } = {};

		if (this.diagram.messages.length === 0) {
			return;
		} else if (this.diagram.activation === false) {
			this.diagram.nodes.forEach((node) => {
				this.diagram.activationDepths[node.id] = this.diagram.messages.map(() => 0);
			});
			return;
		}

		this.diagram.nodes.forEach((node) => {
			this.diagram.activationDepths[node.id] = [];
			depths[node.id] = node.activated ? 1 : 0;
			if (node.activated) {
				this.diagram.activationBars.push(new ActivationBar(node, this.diagram.messages[0], undefined, 1));
			}
		});

		this.diagram.messages.forEach((msg) => {
			if (msg instanceof Separator || msg.isSelfReferenced() || msg.failed || msg.activate === false) {
				// No activation bar
				Object.keys(depths).forEach((nodeId) => {
					this.diagram.activationDepths[nodeId].push(depths[nodeId]);
				});
			} else {
				if (msg.direction === "forward") {
					const depth = (depths[msg.to.id] || 0) + 1;
					this.diagram.activationBars.push(new ActivationBar(msg.to, msg, undefined, depth));
					depths[msg.to.id] = depth;
				}

				Object.keys(depths).forEach((nodeId) => {
					this.diagram.activationDepths[nodeId].push(depths[nodeId]);
				});

				if (msg.direction === "back") {
					const activationBar = this.diagram.activationBars.findLast((bar) => {
						return bar.node === msg.to && bar.to === undefined;
					});
					if (activationBar) {
						activationBar.to = msg;
						depths[msg.to.id] -= 1;
					}
				}
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
			if (this.diagram.nodes.length === 0) {
				newNode.activated = true;
			}
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
		this.diagram.messages.push(edge);

		if (stmt.to.length > index + 1) {
			this.buildEdgeSub(stmt, to, index + 1);
		}

		if (op === "=>") {
			edge = new Edge(this.diagram, from, "<-", to);
			edge.setAttributes(stmt.options);
			edge.label = edge.return;
			edge.style = "dashed";
			this.diagram.messages.push(edge);
		}
	}

	private buildGroup(stmt: parser.group_stmt) {
		const group = new Group(this.diagram);

		stmt.statements.forEach((sub_stmt) => {
			switch (sub_stmt.kind) {
				case ASTKinds.attribute_stmt:
					group.setAttribute(sub_stmt.name, sub_stmt.value);
					break;
				case ASTKinds.node_stmt:
					const node = this.findOrBuildNode(sub_stmt.name);
					if (this.diagram.groups.some((g) => g.nodes.includes(node))) {
						console.log(`The node ${node.id} has already belong to other group. Ignored.`);
					} else {
						group.nodes.push(this.findOrBuildNode(sub_stmt.name));
					}
					break;
			}
		});

		this.diagram.groups.push(group);
	}

	private buildSeparator(stmt: parser.separator_stmt) {
		const separator = new Separator(this.diagram, stmt.label, stmt.type);
		this.diagram.messages.push(separator);
	}

	private reorderNodes() {
		const appeared: Node[] = [];

		this.diagram.nodes.concat().forEach((node) => {
			if (!appeared.includes(node)) {
				appeared.push(node);
				const group = this.diagram.groups.find((g) => g.nodes.includes(node));
				if (group) {
					let newIndex = this.diagram.nodes.indexOf(node);
					group.nodes.forEach((group_node) => {
						if (!appeared.includes(group_node)) {
							appeared.push(group_node);
							const oldIndex = this.diagram.nodes.indexOf(group_node);
							this.diagram.nodes.splice(oldIndex, 1);

							this.diagram.nodes.splice(newIndex + 1, 0, group_node);
							newIndex += 1;
						}
					});
				}
			}
		});
	}
}

export function buildDiagram(ast: parser.ParseResult): Diagram | undefined {
	if (!ast.ast) return;

	const builder = new DiagramBuilder();
	builder.build(ast.ast);
	return builder.diagram;
}
