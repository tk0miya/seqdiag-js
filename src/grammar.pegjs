diagram := SP* prefix=diagram_prefix? SP* '{' SP* _statements=statements SP* '}' SP* $
        .id = identifier | undefined { return this.prefix?.diagram_id }
        .statements = statement[] { return this._statements.statements }
diagram_prefix := { 'seqdiag' | 'diagram' } _id={ SP+ value=identifier }?
                  .diagram_id = identifier | undefined { return this._id?.value }
statements := _statements={ statement=statement SP* { ';' SP* }? }*
              .statements = statement[] { return this._statements.map((e) => e.statement) }
statement := class_stmt | plugin_stmt | attribute_stmt | fragment_stmt | group_stmt | edge_stmt | separator_stmt | node_stmt

// seqdiag {
//   class red [color = red]
// }
class_stmt := 'class' SP* name=identifier SP* _options=option_list?
              .options = option_stmt[] { return this._options?.options || [] }

// seqdiag {
//   plugin attributes [name = Name]
// }
plugin_stmt := 'plugin' SP* name=identifier SP* _options=option_list?
               .options = option_stmt[] { return this._options?.options || [] }

// seqdiag {
//   default_shape box
// }
attribute_stmt := name=identifier SP* '=' SP* rvalue=value
                  .value = string | number {
                        if (typeof this.rvalue === 'string') {
                                return this.rvalue;
                        } else {
                                return this.rvalue.value
                        }
                  }

// seqdiag {
//   alt { A -> B }
//   loop { A -> B }
// }
fragment_stmt := type=fragment_type _id={ SP+ value=identifier }? SP* '{' SP* _statements={ statement=fragment_inline_stmt SP* { ';' SP* }? }* SP* '}'
                 .id = identifier | undefined { return this._id?.value }
                 .statements = fragment_inline_stmt[] { return this._statements.map((e) => e.statement) }
fragment_type := 'alt' | 'loop'
fragment_inline_stmt := attribute_stmt | fragment_stmt | edge_stmt | node_stmt

// seqdiag {
//   group { A; B }
// }
group_stmt := prefix=group_prefix? SP* '{' SP* _statements={ statement=group_inline_stmt SP* { ';' SP* }? }* SP* '}'
              .id = identifier | undefined { return this.prefix?.group_id }
              .statements = group_inline_stmt[] { return this._statements.map((e) => e.statement) }
group_prefix := 'group' _id={ SP+ value=identifier }?
                .group_id = identifier | undefined { return this._id?.value }
group_inline_stmt := attribute_stmt | node_stmt

// seqdiag {
//   A -> B
//   C -> D {
//     D -> E
//   }
// }
edge_stmt := from=identifier SP* to={ SP* op=edge_operator SP* target=identifier }+ SP* _options=option_list? SP* _block=edge_block?
             .options = option_stmt[] { return this._options?.options || [] }
             .statements = edge_block_stmt[] { return this._block?.statements || [] }
edge_operator := '<<--' | '-->>' | '<<-' | '->>' | '<--' | '-->' | '<-' | '->' | '=>'
edge_block := '{' SP* _statements={ statement=edge_block_stmt SP* { ';' SP* }? }* SP* '}'
             .statements = edge_block_stmt[] { return this._statements.map((e) => e.statement) }
edge_block_stmt := separator_stmt | edge_stmt

// seqdiag {
//   === separator ===
// }
separator_stmt := type='===' SP* label='.+?(?=\s*===)' SP* '==='
               |  type='\.\.\.' SP* label='.+?(?=\s*\.\.\.)' SP* '\.\.\.'

// seqdiag {
//   A
//   B [attr1, attr2 = value2]
// }
node_stmt := name=identifier SP* _options=option_list?
             .options = option_stmt[] { return this._options?.options || [] }

value := String | Number | identifier
option_list := '\[' SP* first=option_stmt followings={ SP* ',' SP* item=option_stmt }* SP* '\]'
               .options = option_stmt[] {
                        if (this.first) {
                                return [this.first].concat(this.followings.map((e) => e.item));
                        } else {
                                return []
                        }
               }
option_stmt := name=identifier rvalue={ SP* '=' SP* value=value }?
               .value = value | undefined { return this.rvalue?.value }

SP := '[ \t\r\n]' | SingleLineComment | MultiLineComment
String := literal='"""(.|\r\n)*?"""'
          .value = string { return this.literal.slice(3, -3).trim() }
       |  literal='\'\'\'(.|[\r\n])*?\'\'\''
          .value = string { return this.literal.slice(3, -3).trim() }
       |  literal='"(\\.|[^\"])*"'
          .value = string { return this.literal.slice(1, -1) }
       |  literal='\'(\\.|[^\\\'])*\''
          .value = string { return this.literal.slice(1, -1) }
Number := literal='-?(\.[0-9]+)|([0-9]+(\.[0-9]*)?)'
          .value = number { return parseInt(this.literal) }
identifier := '[A-Za-z_0-9\u0080-\uFFFF][A-Za-z_\-.0-9\u0080-\uFFFF]*'
SingleLineComment := '//.*?[\r\n]'
MultiLineComment := '/\*.*?\*\/'

