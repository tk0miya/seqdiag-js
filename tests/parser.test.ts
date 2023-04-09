import assert from "assert";
import { parse } from "../src/parser";
import {
	ASTKinds,
	attribute_stmt,
	class_stmt,
	edge_stmt,
	fragment_stmt,
	group_stmt,
	node_stmt,
	plugin_stmt,
	separator_stmt,
} from "../src/parser";

describe("grammar.pegjs", () => {
	describe("given a class statement", () => {
		it("can define a class", () => {
			const ast = parse("seqdiag { class red [color = red] }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.class_stmt);

			const klass: class_stmt = ast.ast.statements[0];
			expect(klass.name).toBe("red");
			expect(klass.options.length).toBe(1);
			expect(klass.options[0].name).toBe("color");
			expect(klass.options[0].value).toBe("red");
		});
	});

	describe("given a plugin statement", () => {
		it("can define a plugin", () => {
			const ast = parse("seqdiag { plugin attributes [name = Name] }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.plugin_stmt);

			const plugin: plugin_stmt = ast.ast.statements[0];
			expect(plugin.name).toBe("attributes");
			expect(plugin.options.length).toBe(1);
			expect(plugin.options[0].name).toBe("name");
			expect(plugin.options[0].value).toBe("Name");
		});
	});

	describe("given an attribute statement", () => {
		it("can take an identifier as a value", () => {
			const ast = parse("seqdiag { default_shape = box }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.attribute_stmt);

			const attribute: attribute_stmt = ast.ast.statements[0];
			expect(attribute.name).toBe("default_shape");
			expect(attribute.value).toBe("box");
		});

		it("can take a string as a value", () => {
			const ast = parse("seqdiag { default_shape = 'box' }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.attribute_stmt);

			const attribute = ast.ast.statements[0];
			expect(attribute.name).toBe("default_shape");
			expect(attribute.value).toBe("box");
		});

		it("can take a multiline string as a value", () => {
			const ast = parse("seqdiag { description = '''\nbox\n''' }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.attribute_stmt);

			const attribute = ast.ast.statements[0];
			expect(attribute.name).toBe("description");
			expect(attribute.value).toBe("box");
		});

		it("can take a number as a value", () => {
			const ast = parse("seqdiag { default_fontsize = 16.0 }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.attribute_stmt);

			const attribute: attribute_stmt = ast.ast.statements[0];
			expect(attribute.name).toBe("default_fontsize");
			expect(attribute.value).toBe(16.0);
		});
	});

	describe("given a fragment statement", () => {
		it("can define a fragment", () => {
			const ast = parse("seqdiag { alt { A -> B } }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.fragment_stmt);

			const fragment: fragment_stmt = ast.ast.statements[0];
			expect(fragment.type).toBe("alt");
			assert(fragment.statements[0].kind === ASTKinds.edge_stmt);
			expect(fragment.statements[0].from).toBe("A");
			expect(fragment.statements[0].to[0].op).toBe("->");
			expect(fragment.statements[0].to[0].target).toBe("B");
		});
	});

	describe("given a group statement", () => {
		it("can define a group", () => {
			const ast = parse("seqdiag { group { A; B } }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.group_stmt);

			const group: group_stmt = ast.ast.statements[0];
			expect(group.statements.length).toBe(2);
			expect(group.statements[0].name).toBe("A");
			expect(group.statements[1].name).toBe("B");
		});
	});

	describe("given an edge statement", () => {
		it("can define an edge", () => {
			const ast = parse("seqdiag { A -> B }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.edge_stmt);

			const edge: edge_stmt = ast.ast.statements[0];
			expect(edge.from).toBe("A");
			expect(edge.to.length).toBe(1);
			expect(edge.to[0].op).toBe("->");
			expect(edge.to[0].target).toBe("B");
			expect(edge.options.length).toBe(0);
			expect(edge.statements.length).toBe(0);
		});

		it("can define a chained edge", () => {
			const ast = parse("seqdiag { A -> B --> C -->> D }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.edge_stmt);

			const edge: edge_stmt = ast.ast.statements[0];
			expect(edge.from).toBe("A");
			expect(edge.to.length).toBe(3);
			expect(edge.to[0].op).toBe("->");
			expect(edge.to[0].target).toBe("B");
			expect(edge.to[1].op).toBe("-->");
			expect(edge.to[1].target).toBe("C");
			expect(edge.to[2].op).toBe("-->>");
			expect(edge.to[2].target).toBe("D");
			expect(edge.options.length).toBe(0);
			expect(edge.statements.length).toBe(0);
		});

		it("can define an edge having attributes", () => {
			const ast = parse("seqdiag { A -> B [attr1, attr2 = value2, attr3 = value3] }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.edge_stmt);

			const edge: edge_stmt = ast.ast.statements[0];
			expect(edge.from).toBe("A");
			expect(edge.to.length).toBe(1);
			expect(edge.to[0].op).toBe("->");
			expect(edge.to[0].target).toBe("B");
			expect(edge.options.length).toBe(3);
			expect(edge.options[0].name).toBe("attr1");
			expect(edge.options[0].value).toBeUndefined();
			expect(edge.options[1].name).toBe("attr2");
			expect(edge.options[1].value).toBe("value2");
			expect(edge.options[2].name).toBe("attr3");
			expect(edge.options[2].value).toBe("value3");
			expect(edge.statements.length).toBe(0);
		});

		it("can define an edge having a block", () => {
			const ast = parse("seqdiag { A -> B { B -> C; C -> B } }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.edge_stmt);

			const edge: edge_stmt = ast.ast.statements[0];
			expect(edge.from).toBe("A");
			expect(edge.to.length).toBe(1);
			expect(edge.to[0].op).toBe("->");
			expect(edge.to[0].target).toBe("B");
			expect(edge.options.length).toBe(0);
			expect(edge.statements.length).toBe(2);

			assert(edge.statements[0].kind === ASTKinds.edge_stmt);
			expect(edge.statements[0].from).toBe("B");
			expect(edge.statements[0].to[0].op).toBe("->");
			expect(edge.statements[0].to[0].target).toBe("C");

			assert(edge.statements[1].kind === ASTKinds.edge_stmt);
			expect(edge.statements[1].from).toBe("C");
			expect(edge.statements[1].to[0].op).toBe("->");
			expect(edge.statements[1].to[0].target).toBe("B");
		});
	});

	describe("given a separator statement", () => {
		it("can define a separator", () => {
			const ast = parse("seqdiag { === separator ===; ... another separator ... }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(2);

			assert(ast.ast.statements[0].kind === ASTKinds.separator_stmt_1);
			const sep1: separator_stmt = ast.ast.statements[0];
			expect(sep1.label).toBe("separator");
			expect(sep1.type).toBe("===");

			assert(ast.ast.statements[1].kind === ASTKinds.separator_stmt_2);
			const sep2: separator_stmt = ast.ast.statements[1];
			expect(sep2.label).toBe("another separator");
			expect(sep2.type).toBe("...");
		});
	});

	describe("given a node statement", () => {
		it("can define a node without any attributes", () => {
			const ast = parse("seqdiag { A }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.node_stmt);

			const node: node_stmt = ast.ast.statements[0];
			expect(node.name).toBe("A");
			expect(node.options.length).toBe(0);
		});

		it("can define a node having attributes", () => {
			const ast = parse("seqdiag { B [attr1, attr2 = value2, attr3 = value3] }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.node_stmt);

			const node = ast.ast.statements[0];
			expect(node.name).toBe("B");
			expect(node.options.length).toBe(3);
			expect(node.options[0].name).toBe("attr1");
			expect(node.options[0].value).toBeUndefined();
			expect(node.options[1].name).toBe("attr2");
			expect(node.options[1].value).toBe("value2");
			expect(node.options[2].name).toBe("attr3");
			expect(node.options[2].value).toBe("value3");
		});
	});

	describe("given a comment", () => {
		it("can ignore a single line comment", () => {
			const ast = parse("seqdiag { // diagram\n  A\n}");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.node_stmt);

			const node: node_stmt = ast.ast.statements[0];
			expect(node.name).toBe("A");
			expect(node.options.length).toBe(0);
		});

		it("can ignore a multi line comment", () => {
			const ast = parse("seqdiag { /* diagram */ A }");
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.node_stmt);

			const node: node_stmt = ast.ast.statements[0];
			expect(node.name).toBe("A");
			expect(node.options.length).toBe(0);
		});
	});

	describe("given a multiline string", () => {
		it("can parse a multiline string", () => {
			const ast = parse(`seqdiag { default_node_color = """
								 orange
							     and
								 pink
							     """
							   }`);
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.attribute_stmt);

			const attribute: attribute_stmt = ast.ast.statements[0];
			expect(attribute.name).toBe("default_node_color");
			expect(attribute.value).toBe("orange\nand\npink");
		});

		it("can parse a string contains '\n'", () => {
			const ast = parse(`seqdiag { default_line_color = "orange\nand\npink" }`);
			assert(ast.ast !== null);
			expect(ast.ast.statements.length).toBe(1);
			assert(ast.ast.statements[0].kind === ASTKinds.attribute_stmt);

			const attribute: attribute_stmt = ast.ast.statements[0];
			expect(attribute.name).toBe("default_line_color");
			expect(attribute.value).toBe("orange\nand\npink");
		});
	});
});
