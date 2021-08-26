x: {
	let rr=function(){};
	let rust_code = `
enum Lang {
	SetVar(String,Value),
	GetVar(String)
}

#[derive(Clone)]
enum Value {
	Int(i64),
	Nothing,
}

#[derive(Debug)]
enum EngineError {
	MismatchNumParams,
	MismatchType,
	UnknownCommand(String),
	MissingVariable(String),
}

struct Evaluator {
	vars:HashMap<String, Value>,
}

impl Evaluator {
	fn evaluate(commands: &[Command]) -> Result<Value, EngineError> {
		let output=Ok(Value::Nothing);
		for command in commands {
			match command {
				Command::SetVar(name, value) => {
					self.vars.insert(name.into(), value.clone());
				}
				Command::GetVar(name) => {
					match self.vars.get(name) {
						Some(value) => output = Ok(value.clone()),
						None => return Err(EngineError::MissingVariable(name.into()))
					}
				}
			}
		}
	}
}

fn parse_set(input:&[&str]) -> Result<Commands,EngineError> {
	if input.len() != 3 {
		return Err(EngineError::MismatchNumParams)
	}

	let var_name = parse_var_name(input[1])?

	let value = parse_value(input[2])?
}

fn parse_get(input:&[&str]) -> Result<Commands,EngineError> {
	
}

parse_value(val) -> Result<Value, EngineError> {
	let result = val.parse::<i64>::parse(val);
}

fn parse(input: &str) -> Result<Vec<Commands>,EngineError> {
	// set a 100
	// get a
	for line in input.lines() {
		let command: Vec<_> = line.split_ascii_whitespace().collect();
		match command.get(0) {
			Some(x) if *x == "set" => {
				output.push(parse_set(&command)?);
			}
			Some(x) if *x == "get" => {
				output.push(parse_get(&command)?);
			}
			Some(x) => return Err(EngineError::UnkownCommand(name.to_string())),
			None => {}
		}
	}
}

#[test]
fn test1 {
	let commands=vec![
		Command::SetVar("a".into(), Value::Int(100)),
		Command::GetVar("a".into()),
	];
	
	let mut evaluator = Evaluator::new();

	let result = evaluator.evaluate(&commands)?;

	assert_eq!(result, Value::Int(100));

	Ok(())
}

#[test]
fn 

fn main() {
	println!("Hello World");
}`;
	console.log(rust_code);
	let rust_match_rx = /\/\/.+(?=[\n])|\/\*.+(?=\/\*|\*\/)|_(?=!>[a-zA-Z_])|fn|self|match|yield|macro|impl|\s|[\(\)]|[\[\]]|[{}]|::|->|<-|@|[a-zA-Z_]/;
	let test = new class {
		constructor() {
			this.tests = [];
			this.results = [];
		}
		addTest(e) {
			this.tests.push(e);
		}
		runAll() {
			let fail_count = 0;
			for (let x of this.tests) {
				let res;
				try {
					let va = x();
					res = {
						result: 'success',
						detail: va,
					};
				} catch (e) {
					fail_count++;
					res = {
						result: 'fail',
						detail: e
					};
				}
				this.results.push(res);
			}
			if (fail_count > 0) {
				throw Error('Test failures:' + fail_count);
			}
		}
	};
	test.addTest(function () {
		let regex = /\/\*(?:(?:!\/\*|\*\/).)*/g;
		let input = '/* /* */ */';
		let blk_comments = [];
		let blk_com_dep = 0;
		function accept_result(mat, acc = 0) {
			if (mat[0] === '/*') {
				blk_com_dep++;
			} else if (mat[0] === '*/') {
				blk_com_dep--;
			}
			return { extn: input.slice(acc, mat.index), src: acc + mat[0].length };
		}
		let exr = regex.exec(input);
		let cur = accept_result(exr);
		let e2 = regex.exec(input);
		cur = accept_result(e2, cur.src);
		blk_comments.push({ type: 'BlockComment', doc_style: 'None', terminated: false });
		console.log(cur);
		console.log(e2);
	})
	let cidx = 0;
	let mt = rust_match_rx.exec(rust_code);
	rust_code.slice(cidx, mt.index);
	cidx = mt.index + mt[0].length;
	let tk=`
pub enum TokenKind {
	// Multi-char tokens:
	/// "// comment"
	LineComment { doc_style: Option<DocStyle> },
	/// \`/* block comment */\`
	///
	/// Block comments can be recursive, so the sequence like \`/* /* */\`
	/// will not be considered terminated and will result in a parsing error.
	BlockComment { doc_style: Option<DocStyle>, terminated: bool },
	/// Any whitespace characters sequence.
	Whitespace,
	/// "ident" or "continue"
	/// At this step keywords are also considered identifiers.
	Ident,
	/// "r#ident"
	RawIdent,
	/// "12_u8", "1.0e-40", "b"123"". See \`LiteralKind\` for more details.
	Literal { kind: LiteralKind, suffix_start: usize },
	/// "'a"
	Lifetime { starts_with_number: bool },

	// One-char tokens:
	/// ";"
	Semi,
	/// ","
	Comma,
	/// "."
	Dot,
	/// "("
	OpenParen,
	/// ")"
	CloseParen,
	/// "{"
	OpenBrace,
	/// "}"
	CloseBrace,
	/// "["
	OpenBracket,
	/// "]"
	CloseBracket,
	/// "@"
	At,
	/// "#"
	Pound,
	/// "~"
	Tilde,
	/// "?"
	Question,
	/// ":"
	Colon,
	/// "$"
	Dollar,
	/// "="
	Eq,
	/// "!"
	Bang,
	/// "<"
	Lt,
	/// ">"
	Gt,
	/// "-"
	Minus,
	/// "&"
	And,
	/// "|"
	Or,
	/// "+"
	Plus,
	/// "*"
	Star,
	/// "/"
	Slash,
	/// "^"
	Caret,
	/// "%"
	Percent,

	/// Unknown token, not expected by the lexer, e.g. "№"
	Unknown,
}
pub enum LiteralKind {
	/// "12_u8", "0o100", "0b120i99"
	Int { base: Base, empty_int: bool },
	/// "12.34f32", "0b100.100"
	Float { base: Base, empty_exponent: bool },
	/// "'a'", "'\\'", "'''", "';"
	Char { terminated: bool },
	/// "b'a'", "b'\\'", "b'''", "b';"
	Byte { terminated: bool },
	/// ""abc"", ""abc"
	Str { terminated: bool },
	/// "b"abc"", "b"abc"
	ByteStr { terminated: bool },
	/// "r"abc"", "r#"abc"#", "r####"ab"###"c"####", "r#"a"
	RawStr { n_hashes: u16, err: Option<RawStrError> },
	/// "br"abc"", "br#"abc"#", "br####"ab"###"c"####", "br#"a"
	RawByteStr { n_hashes: u16, err: Option<RawStrError> },
}
`;
	test.runAll();
	test;
}