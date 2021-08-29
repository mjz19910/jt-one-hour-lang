x: {
	let rust_exec_code_funcs = [
		'STATIC_init', 'S_Crate_init',
		[
			'rust_exec_struct', 'rust_exec_impl', 'rust_exec_enum', 'rust_exec_fn',
			'rust_exec_any',
		],
	];
	let rust_autoexec_funcs = [
		'STATIC_init', 'S_Crate_init',
		'rust_exec_struct', 'rust_exec_impl', 'rust_exec_enum',
		'rust_exec_fn','rust_exec_any'
	];
	let my_rust_sym = Symbol();
	let ts = performance.now();
	let block_id = 0;
	let in_parse = false;
	let block_stack = [];
	let __rust;
	rust_static_init();
	let rr = function(mm, ...rest) {
		let res=[];
		ts += performance.now() - ts;
		let parse_pass = 0;
		let scope = null;
		scope = __rust.push_block_vec();
		if (!in_parse) {
			in_parse = true;
		}
		let iter_index=0;
		res.push(mm.raw[iter_index++]);
		for (let cur of rest) {
			console.log(cur.name);
			if (typeof cur === 'function' && rust_autoexec_funcs.includes(cur.name)) {
				res.push(cur);
				cur(parse_pass);
				res.push(mm.raw[iter_index++]);
			}
		}
		console.log('p0 done', performance.now() - ts);
		parse_pass++;
		for (i of rust_exec_code_funcs) {
			for (let cur of rest) {
				if (i instanceof Array && i.includes(cur.name)) {
					cur(parse_pass);
					continue;
				}
				if (cur.name === i) {
					cur(parse_pass);
					continue;
				}
			}
		}
		console.log('p1 done', performance.now() - ts);
		in_parse = false;
		if (scope) {
			__rust.drop(scope);
		}
		return mm.raw.join('');
	};
	function rust_static_init() {
		if (__rust) return;
		class RemoteRef {
			constructor(parent) {
				this.ref_type = 'block';
				this.ref = null;
				this.parent = parent;
			}
			make_ref(value) {
				let ref_id = this.parent.block_vec_ref.length;
				this.parent.block_vec_ref.push(value);
				this.ref = ref_id;
			}
			deref() {
				return this.value;
			}
			get value() {
				return this.parent.block_vec_ref[this.ref];
			}
		}
		class Rust {
			constructor(base) {
				this.sym = my_rust_sym;
				this.block_vec = [];
			}
			set_resolved_block(block_id, ...data) {
				if (data.length === 1) {
					data = data[0];
				}
				let ref = new RemoteRef(this);
				ref.make_ref(data);
				this.block_vec[block_id] = ref;
			}
		}
		__rust = new Rust;
		class RefGenerator {
			constructor(from) {
				if (from) {
					console.log(from);
				}
				this.host_backing_value = null;
				if (from) {
					this.rust_type = from.rust_type;
				}
			}
			clone() {
				return new RefGenerator(this);
			}
			ffi_use_this(type, _this) {
				if (this.is_mut_borrow) {
					throw Error('can\' borrow');
				}
				this.rust_type(type);
				this.ffi_set_backing_value(_this);
				return this;
			}
			ffi_set_backing_value(value) {
				if (this.is_mut_borrow) {
					throw Error('can\' borrow');
				}
				this.host_backing_value = value;
			}
			rust_type(value) {
				if (this.is_mut_borrow) {
					throw Error('can\' borrow');
				}
				this._rust_type = value;
			}
			no_mut() {
				this.is_mut_borrow = true;
			}
		};
		__rust_priv = {};
		__rust_priv.ref_generator = new RefGenerator;
		__rust_priv.ref_generator.no_mut();
		__rust.get_ref_generator = function() {
			return __rust_priv.ref_generator;
		};
		__rust.block_vec = [];
		__rust.block_vec_stack = [];
		__rust.block_vec_ref = [];
		let rust_chars = [";", ",", ".", "(", ")", "{", "}", "[", "]", "@", "#", "~", "?", ":", "$", "=", "!", "<", ">", "-", "&", "|", "+", "*", "/", "^", "%"]
		function get_log_time() {
			let ret = performance.now() - ts;
			ts = performance.now();
			return ret;
		}
		let is_val_char = /(?<i_s>[a-zA-Z_])|(?<ws>[ \t])|(?<char>[;,\.(){}\[\]@#~\?:\$=!<>\-&\|\+\*\/\^%])|(?<line>[\n])/g;
		__rust.exec_lines = function(str, block_id_of_str) {
			if (block_id_of_str === void 0) {
				throw Error('BAD');
			}
			let val_acc = [];
			let tok_arr = [];
			let cur;
			let ci = 0;
			let mat_idx = 0;
			function back(n) {
				if (val_acc.length > (n - 1)) {
					return val_acc[val_acc.length - n][1];
				}
			}
			function bump() {
				mat_idx++;
			}
			let fn_cache = new Map;
			while (true) {
				if (mat_idx > is_val_char.lastIndex) {
					console.log(is_val_char.lastIndex, mat_idx, cc, str.slice(mat_idx, cc.index));
					debugger;
				}
				is_val_char.lastIndex = mat_idx;
				cc = is_val_char.exec(str);
				if (ci++ > 8192) {
					break;
				}
				if (back(1) === '/' && cc[0] === '/') {
					mat_idx = str.indexOf('\n', mat_idx);
					tok_arr.push({
						kind: 'line_comment',
						len: mat_idx - is_val_char.lastIndex + 2,
					});
					is_val_char.lastIndex = mat_idx + 1;
					val_acc = [];
					continue;
				};
				let g = cc?.groups;
				if ((val_acc[0]?.[0] === 'i_s' || val_acc.length == 0) && cc && g.i_s) {
					val_acc.push(['i_s', g.i_s]);
					bump();
					continue;
				}
				if (val_acc[0]?.[0] === 'i_s') {
					tok_arr.push({ kind: 'Ident', len: val_acc.length });
					val_acc.length = 0;
				}
				let mat = 'ws';
				let kind = 'Whitespace';
				if ((val_acc[0]?.[0] === mat || val_acc.length == 0) && cc && g[mat]) {
					val_acc.push([mat, g[mat]]);
					bump();
					continue;
				}
				if (val_acc[0]?.[0] === mat) {
					tok_arr.push({ kind: kind, len: val_acc.length });
					val_acc.length = 0;
				}
				mat = 'char';
				kind = '_char';
				if ((val_acc[0]?.[0] === mat || val_acc.length == 0) && cc && g[mat]) {
					val_acc.push([mat, g[mat]]);
					bump();
					continue;
				}
				if (val_acc[0]?.[0] === mat) {
					tok_arr.push({ kind: kind, len: val_acc.length });
					val_acc.length = 0;
				}
				mat = 'line';
				kind = '_line';
				if ((val_acc[0]?.[0] === mat || val_acc.length == 0) && cc && g[mat]) {
					val_acc.push([mat, g[mat]]);
					bump();
					continue;
				}
				if (val_acc[0]?.[0] === mat) {
					tok_arr.push({ kind: kind, len: val_acc.length });
					val_acc.length = 0;
				}
				if (cc === null) {
					break;
				}
			}
			let iter_index = 0;
			let str_iter_index = 0;
			let str_arr = [];
			for (; iter_index < tok_arr.length; iter_index++) {
				let cur_tok = tok_arr[iter_index];
				if (cur_tok.kind === '_char') {
					let ed = str_iter_index + cur_tok.len;
					while (str_iter_index < ed) {
						str_arr.push(str[str_iter_index]);
						str_iter_index++;
					}
					continue;
				}
				str_arr.push(str.slice(str_iter_index, str_iter_index + cur_tok.len));
				str_iter_index += cur_tok.len;
			}
			let s2_arr = [];
			function pr() {
				return s2_arr?.[s2_arr.length - 2];
			}
			function c() {
				return s2_arr?.[s2_arr.length - 1];
			}
			for (let i = 0; i < str_arr.length; i++) {
				s2_arr.push(str_arr[i]);
				if (pr() === ':' && c() === ':') {
					s2_arr.pop();
					s2_arr.pop();
					s2_arr.push('::');
				}
				if (pr() === '#' && c() === '[]'[0]) {
					s2_arr.pop();
					s2_arr.pop();
					s2_arr.push('#' + '[]'[0]);
				}
			}
			str_arr = s2_arr;
			str_arr.push(Symbol.for('EOF'));
			__rust.block_vec[block_id_of_str] ??= [];
			let block = __rust.block_vec[block_id_of_str];
			if (!block.push) {
				debugger;
			}
			for (let x of str_arr) {
				block.push(x);
			}
			__rust.last_exec = str_arr;
		}
		__rust.log_lines = function(callback_function) {
			let rs_lines = [[]];
			let src_arr = this.last_exec;
			for (let i = 0, ri = 0; i < src_arr.length; i++) {
				rs_lines[ri].push(src_arr[i]);
				if (src_arr[i] === '\n') {
					console.log(rs_lines[ri]);
					ri++;
					rs_lines[ri] = [];
				}
			}
			console.log(rs_lines[rs_lines.length - 1]);
			callback_function();
		}
		__rust_priv.stack = [];
		__rust.push_block_vec = function() {
			let ret = {};
			__rust.block_vec_stack.push([block_id, __rust.block_vec]);
			__rust.block_vec = [];
			block_id = 0;
			__rust_priv.stack.push(ret);
			return ret;
		}
		class BlockRef {
			constructor(ref) {
				this.ref_type = 'block';
				this.ref = ref;
			}
			deref() {
				return this.value;
			}
			get value() {
				return __rust.block_vec_ref[this.ref];
			}
		}
		__rust.drop = function(vv) {
			let last = __rust_priv.stack[__rust_priv.stack.length - 1];
			if (last === void 0) {
				throw Error('droping undefined');
			}
			if (last !== vv) {
				throw Error("failed to drop in order");
			}
			let last_vec_info = __rust.block_vec_stack.pop();
			let block_vec_from_stack_id = __rust.block_vec_ref.push(__rust.block_vec);
			__rust.block_vec = last_vec_info[1];
			block_id = last_vec_info[0];
			__rust.block_vec.push([new BlockRef(block_vec_from_stack_id - 1)]);
			__rust_priv.stack.length--;
		}
	}
	let rust_code = rr`

		${(function STATIC_init() { rust_static_init(); })}
		
		${(function rust_exec_use(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_use.block_id = block_id++;
				return;
			}
			let __id=rust_exec_use.block_id;
			__rust.exec_lines('use std::collections::HashMap;', __id);
		})}

		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(`enum Command {
				SetVar(String,Value),
				GetVar(String),
				PushVar(String),
				Push(Value),
				Pop,
				Add,
			}`, __id);
		}}
	
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(`#[derive(Clone, PartialEq, Debug)]
			enum Value {
				Nothing,
				Int(i64),
				String(String),
			}`, __id);
		}}
	
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(`#[derive(Clone, PartialEq, Debug)]
			enum Value {
				Nothing,
				Int(i64),
				String(String),
			}`, __id);
		}}
	
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(`#[derive(Debug)]
			enum EngineError {
				MismatchNumParams,
				MismatchType,
				UnknownCommand(String),
				MissingVariable(String),
				EmptyStack,
			}`, __id);
		}}
	
		${function rust_exec_struct(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_struct.block_id = block_id++;
				return;
			}
			let __id = rust_exec_struct.block_id;
			__rust.exec_lines(`struct Evaluator {
				vars:HashMap<String, Value>,
				stack:Vec<Value>,
			}`, __id);
		}}

		${function rust_exec_impl(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_impl.block_id = block_id++;
				return;
			}
			let __id = rust_exec_impl.block_id;
			__rust.exec_lines(`impl Evaluator {
				fn new() -> Evaluator {
					Self {
						vars:HashMap::new(),
						stack:vec![],
					}
				}
			
				fn pop(&mut self) -> Result<Value, EngineError> {
					let result = self.stack.pop();
					match result {
						Some(v)=> Ok(v),
						None =>	Err(EngineError::EmptyStack),
					}
				}
			
				fn add(&self, lhs: Value, rhs: Value) -> Result<Value, EngineError> {
					match (lhs, rhs) {
						(Value::Int(i1), Value::Int(i2)) => Ok(Value::Int(i1 + i2)),
						(Value::String(s1), Value::String(s2)) => Ok(Value::String(s1 + s2)),
						_ => Err(EngineError::MismatchType),
					}
				}
			
				fn evaluate(&mut self, commands: &[Command]) -> Result<Value, EngineError> {
					let output=Ok(Value::Nothing);
					for command in commands {
						match command {
							Command::SetVar(name, value) => {
								self.vars.insert(name.into(), value.clone());
							}
							Command::GetVar(name) => match self.vars.get(name) {
								Some(value) => output = Ok(value.clone()),
								None => return Err(EngineError::MissingVariable(name.into())),
							},
							Command::PushVar(name) => match self.vars.get(name) {
								Some(value) => self.stack.push(value.clone()),
								None => return Err(EngineError::MissingVariable(name.into())),
							},
							Command::Push(v) => self.stack.push(v.clone()),
							Command::Pop => {
								output = self.pop();
							},
							Command::Add => {
								let lhs = self.pop()?;
								let rhs = self.pop()?;
			
								let result = self.add(lhs, rhs)?;
								self.stack.push(result)
							}
						}
					}
					output
				}
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_var_name(var_name: &str) -> Result<String, EngineError> {
				Ok(var_name.into())
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_string(val: &str) -> Result<Value, EngineError>{
				if val.starts_with("\"") && val.ends_with("\"") && val.len() > 1 {
					let inner = val[1..(val.len() - 1)].to_string();
			
					Ok(Value::String(inner))
				} else {
					Err(EngineError::MismatchType)
				}
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_int(val: &str) -> Result<Value, EngineError>{
				let result = val.parse::<i64>();
			
				match result {
					Ok(x) => Ok(Value::Int(x)),
					_ => Err(EngineError::MismatchType),
				}
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_value(val: &str) -> Result<Value, EngineError>{
				if val.starts_with('"') && val.ends_with('"') && val.len() > 1 {
					// Parse the string
					parse_string(val)
				}else{
					// Parse the number
					parse_int(val)
				}
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_set(input: &[&str]) -> Result<Command,EngineError> {
				if input.len() != 3 {
					return Err(EngineError::MismatchNumParams);
				}
			
				let var_name = parse_var_name(input[1])?;
				let value = parse_value(input[2])?;
			
				Ok(Command::SetVar(var_name, value))
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_get(input: &[&str]) -> Result<Command,EngineError> {
				if input.len() != 2 {
					return Err(EngineError::MismatchNumParams);
				}
			
				let var_name = parse_var_name(input[1])?;
			
				Ok(Command::GetVar(var_name))
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_push(input: &[&str]) -> Result<Command,EngineError> {
			if input.len() != 2 {
				return Err(EngineError::MismatchNumParams);
			}
		
			let val = parse_value(input[1])?;
		
			Ok(Command::Push(val))
		}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse_pushvar(input: &[&str]) -> Result<Command,EngineError> {
				if input.len() != 2 {
					return Err(EngineError::MismatchNumParams);
				}
			
				let var_name = parse_var_name(input[1])?;
			
				Ok(Command::PushVar(var_name))
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn parse(input: &str) -> Result<Vec<Command>, EngineError> {
				// set a 100
				// get a
			
				let mut output = vec![];
			
				for line in input.lines() {
					let command: Vec<_> = line.split_ascii_whitespace().collect();
					
					match command.get(0) {
						Some(x) if *x == "set" => {
							output.push(parse_set(&command)?);
						}
						Some(x) if *x == "get" => {
							output.push(parse_get(&command)?);
						}
						Some(x) if *x == "push" => {
							output.push(parse_push(&command)?);
						}
						Some(x) if *x == "pushvar" => {
							output.push(parse_pushvar(&command)?);
						}
						Some(x) if *x == "pop" => {
							output.push(Command::Pop);
						}
						Some(x) if *x == "add" => {
							output.push(Command::Add);
						}
						Some(name) => return Err(EngineError::UnknownCommand(name.to_string())),
						None => {}
					}
				}
			
				Ok(output)
			}`, __id);
		}}
	
	${function rust_exec_struct(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_struct.block_id = block_id++;
				return;
			}
			let __id = rust_exec_struct.block_id;
			__rust.exec_lines(`struct Typechecker {
				stack: Vec<Type>,
			}`, __id);
		}}
	
		${function rust_exec_impl(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_impl.block_id = block_id++;
				return;
			}
			let __id = rust_exec_impl.block_id;
			__rust.exec_lines(`impl Typechecker {
				fn typecheck_command(&mut self, command: &Command) -> Result<Type, EngineError> {
					Ok(Type::Nothing)
				}
				
				fn typecheck(&mut self, commands: &[Command]) -> Result<Type, EngineError> {
					for command in commands {
						self.typecheck_command(&command)?;
					}
					Ok(Type::Nothing)
				}
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`#[test]
			fn test1() -> Result<(), EngineError> {
				let commands=vec![
					Command::SetVar("a".into(), Value::Int(100)),
					Command::GetVar("a".into()),
				];
				
				let mut evaluator = Evaluator::new();
			
				let result = evaluator.evaluate(&commands)?;
			
				assert_eq!(result, Value::Int(100));
			
				Ok(())
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`#[test]
			fn eval_set_get() -> Result<(), EngineError> {
				let input = "set x 30\nget x";
			
				let commands = parse(input)?;
			
				let mut evaluator=Evaluator::new();
				let result = evaluator.evaluate(&commands)?;
			
				assert_eq!(result, Value::Int(30));
			
				Ok(())
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`#[test]
			fn eval_set_get_string() -> Result<(), EngineError> {
				let input = "set x \"hello\"\nget x";
			
				let commands = parse(input)?;
			
				let mut evaluator = Evaluator::new();
				let result = evaluator.evaluate(&commands)?;
			
				assert_eq!(result, Value::String("hello".into()));
			
				Ok(())
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`#[test]
			fn eval_stack() -> Result<(), EngineError> {
				let input = "push 100\npush 30\nadd\npop";
			
				let commands = parse(input)?;
			
				let mut evaluator = Evaluator::new();
				let result = evaluator.evaluate(&commands)?;
			
				assert_eq!(result, Value::Int(130));
			
				Ok(())
			}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`#[test]
		fn eval_pushvar() -> Result<(), EngineError> {
			let input = "set x 33\npushvar x\npush 100\nadd\npop";
		
			let commands = parse(input)?;
		
			let mut evaluator = Evaluator::new();
			let result = evaluator.evaluate(&commands)?;
		
			assert_eq!(result, Value::Int(133));
		
			Ok(())
		}`, __id);
		}}
	
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`fn main() -> Result<(), EngineError> {
				for arg in std::env::args().skip(1) {
					let contents = std::fs::read_to_string(arg).unwrap();
					let mut engine = Evaluator::new();
					let commands = parse(&contents)?;
					let answer = engine.evaluate(&commands)?;
			
					println!("{:?}", answer);
				}
				
				Ok(())
			}
			`, __id);
		}}
	`;
	__rust.crates = [];
	__rust.files = [];
	__rust.files.push(['src/main.rs', __rust.block_vec[0][0].deref()]);
	__rust.crates.push(['onehour-language', ...__rust.files]);
	__rust.block_vec = [];
	//https://doc.rust-lang.org/stable/nightly-rustc/src/rustc_lexer/lib.rs.html
	let rustc_lexer_lib_file = rr`
		${(function STATIC_init() {
			rust_static_init();
		})}
		${function rust_doc_comment(parse_pass) {
			if (parse_pass === 0) {
				rust_doc_comment.block_id = block_id++;
				return;
			}
			let __id=rust_doc_comment.block_id;
			__rust.exec_lines(rr`
			//! Low-level Rust lexer.
			//!
			//! The idea with \`rustc_lexer\` is to make a reusable library,
			//! by separating out pure lexing and rustc-specific concerns, like spans,
			//! error reporting, and interning.  So, rustc_lexer operates directly on \`&str\`,
			//! produces simple tokens which are a pair of type-tag and a bit of original text,
			//! and does not report errors, instead storing them as flags on the token.
			//!
			//! Tokens produced by this lexer are not yet ready for parsing the Rust syntax.
			//! For that see [\`rustc_parse::lexer\`], which converts this basic token stream
			//! into wide tokens used by actual parser.
			//!
			//! The purpose of this crate is to convert raw sources into a labeled sequence
			//! of well-known token types, so building an actual Rust token stream will
			//! be easier.
			//!
			//! The main entity of this crate is the [\`TokenKind\`] enum which represents common
			//! lexeme types.
			//!
			//! [\`rustc_parse::lexer\`]: ../rustc_parse/lexer/index.html
			// We want to be able to build this crate with a stable compiler, so no
			// \`#![feature]\` attributes should be added.
			`, __id);
		}}
	
		${function rust_exec_mod(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_mod.block_id = block_id++;
				return;
			}
			let __id=rust_exec_mod.block_id;
			__rust.exec_lines(rr`
			mod cursor;
			pub mod unescape;
			`, __id);
		}}
	
		${function rust_exec_mod(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_mod.block_id = block_id++;
				return;
			}
			let __id = rust_exec_mod.block_id;
			__rust.exec_lines(rr`
			#[cfg(test)]
			mod tests;
			`, __id);
		}}

		${function rust_exec_use(parse_pass) {
			if (parse_pass === 0) {
				S_Crate_init.block_id = block_id++;
				return;
			}
			let __id = rust_exec_use.block_id;
			__rust.exec_lines(rr`
			use self::LiteralKind::*;
			use self::TokenKind::*;
			use crate::cursor::{Cursor, EOF_CHAR};
			use std::convert::TryFrom;
			`, S_Crate_init.block_id);
		}}
	
		${function rust_exec_struct(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_struct.block_id = block_id++;
				return;
			}
			let __id = rust_exec_struct.block_id;
			__rust.exec_lines(rr`
			/// Parsed token.
			/// It doesn't contain information about data that has been parsed,
			/// only the type of the token and its size.
			#[derive(Debug)]
			pub struct Token {
				pub kind: TokenKind,
				pub len: usize,
			}
			`, __id);
		}}
	
		${function rust_exec_impl() {
			'//nop;';
		}}
	
		${function rust_exec_impl(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_impl.block_id = block_id++;
				return;
			}
			let __id = rust_exec_impl.block_id;
			__rust.exec_lines(rr`
			impl Token {
				fn new(kind: TokenKind, len: usize) -> Token {
					Token { kind, len }
				}
			}
			`, __id);
		}}
	
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(rr`
			/// Enum representing common lexeme types.
			// perf note: Changing all \`usize\` to \`u32\` doesn't change performance. See #77629
			#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
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
			`, __id);
			//__rust.log_lines(() => console.log('here'));
		}}
	
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(rr`
			#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
			pub enum DocStyle {
				Outer,
				Inner,
			}
			`, __id);
		}}
	
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(rr`
			#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
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
			`, __id)
		}}
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(rr`
			/// Error produced validating a raw string. Represents cases like:
			/// - \`r##~"abcde"##\`: \`InvalidStarter\`
			/// - \`r###"abcde"##\`: \`NoTerminator { expected: 3, found: 2, possible_terminator_offset: Some(11)\`
			/// - Too many \`#\`s (>65535): \`TooManyDelimiters\`
			// perf note: It doesn't matter that this makes \`Token\` 36 bytes bigger. See #77629
			#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
			pub enum RawStrError {
				/// Non \`#\` characters exist between \`r\` and \`"\` eg. \`r#~"..\`
				InvalidStarter { bad_char: char },
				/// The string was never terminated. \`possible_terminator_offset\` is the number of characters after \`r\` or \`br\` where they
				/// may have intended to terminate it.
				NoTerminator { expected: usize, found: usize, possible_terminator_offset: Option<usize> },
				/// More than 65535 \`#\`s exist.
				TooManyDelimiters { found: usize },
			}
			`, __id)
		}}
		${function rust_exec_enum(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_enum.block_id = block_id++;
				return;
			}
			let __id = rust_exec_enum.block_id;
			__rust.exec_lines(rr`
				/// Base of numeric literal encoding according to its prefix.
				#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
				pub enum Base {
					/// Literal starts with "0b".
					Binary,
					/// Literal starts with "0o".
					Octal,
					/// Literal starts with "0x".
					Hexadecimal,
					/// Literal doesn't contain a prefix.
					Decimal,
				}
				`, __id)
		}}
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(rr`
			/// \`rustc\` allows files to have a shebang, e.g. "#!/usr/bin/rustrun",
			/// but shebang isn't a part of rust syntax.
			pub fn strip_shebang(input: &str) -> Option<usize> {
				// Shebang must start with \`#!\` literally, without any preceding whitespace.
				// For simplicity we consider any line starting with \`#!\` a shebang,
				// regardless of restrictions put on shebangs by specific platforms.
				if let Some(input_tail) = input.strip_prefix("#!") {
					// Ok, this is a shebang but if the next non-whitespace token is \`[\`,
					// then it may be valid Rust code, so consider it Rust code.
					let next_non_whitespace_token = tokenize(input_tail).map(|tok| tok.kind).find(|tok| {
						!matches!(
							tok,
							TokenKind::Whitespace
								| TokenKind::LineComment { doc_style: None }
								| TokenKind::BlockComment { doc_style: None, .. }
						)
					});
					if next_non_whitespace_token != Some(TokenKind::OpenBracket) {
						// No other choice than to consider this a shebang.
						return Some(2 + input_tail.lines().next().unwrap_or_default().len());
					}
				}
				None
			}
			`, __id)
		}}
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(rr`
			/// Parses the first token from the provided input string.
			pub fn first_token(input: &str) -> Token {
				debug_assert!(!input.is_empty());
				Cursor::new(input).advance_token()
			}
			`, __id)
		}}
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(rr`
			/// Creates an iterator that produces tokens from the input string.
			pub fn tokenize(mut input: &str) -> impl Iterator<Item = Token> + '_ {
				std::iter::from_fn(move || {
					if input.is_empty() {
						return None;
					}
					let token = first_token(input);
					input = &input[token.len..];
					Some(token)
				})
			}
			`, __id)
		}}
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(rr`
			/// True if \`c\` is considered a whitespace according to Rust language definition.
			/// See [Rust language reference](https://doc.rust-lang.org/reference/whitespace.html)
			/// for definitions of these classes.
			pub fn is_whitespace(c: char) -> bool {
				// This is Pattern_White_Space.
				//
				// Note that this set is stable (ie, it doesn't change with different
				// Unicode versions), so it's ok to just hard-code the values.
			
				matches!(
					c,
					// Usual ASCII suspects
					'\u{0009}'   // \t
					| '\u{000A}' // \n
					| '\u{000B}' // vertical tab
					| '\u{000C}' // form feed
					| '\u{000D}' // \r
					| '\u{0020}' // space
			
					// NEXT LINE from latin1
					| '\u{0085}'
			
					// Bidi markers
					| '\u{200E}' // LEFT-TO-RIGHT MARK
					| '\u{200F}' // RIGHT-TO-LEFT MARK
			
					// Dedicated whitespace characters from Unicode
					| '\u{2028}' // LINE SEPARATOR
					| '\u{2029}' // PARAGRAPH SEPARATOR
				)
			}
			`, __id)
		}}
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(rr`
			/// True if \`c\` is valid as a first character of an identifier.
			/// See [Rust language reference](https://doc.rust-lang.org/reference/identifiers.html) for
			/// a formal definition of valid identifier name.
			pub fn is_id_start(c: char) -> bool {
				// This is XID_Start OR '_' (which formally is not a XID_Start).
				// We also add fast-path for ascii idents
				('a'..='z').contains(&c)
					|| ('A'..='Z').contains(&c)
					|| c == '_'
					|| (c > '\x7f' && unicode_xid::UnicodeXID::is_xid_start(c))
			}
			`, __id)
		}}
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(rr`
			/// True if \`c\` is valid as a non-first character of an identifier.
			/// See [Rust language reference](https://doc.rust-lang.org/reference/identifiers.html) for
			/// a formal definition of valid identifier name.
			pub fn is_id_continue(c: char) -> bool {
				// This is exactly XID_Continue.
				// We also add fast-path for ascii idents
				('a'..='z').contains(&c)
					|| ('A'..='Z').contains(&c)
					|| ('0'..='9').contains(&c)
					|| c == '_'
					|| (c > '\x7f' && unicode_xid::UnicodeXID::is_xid_continue(c))
			}
			`, __id)
		}}
		${function rust_exec_fn(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_fn.block_id = block_id++;
				return;
			}
			let __id = rust_exec_fn.block_id;
			__rust.exec_lines(`
			/// The passed string is lexically an identifier.
			pub fn is_ident(string: &str) -> bool {
				let mut chars = string.chars();
				if let Some(start) = chars.next() {
					is_id_start(start) && chars.all(is_id_continue)
				} else {
					false
				}
			}
			`, __id);
		}}
	
		${function rust_exec_impl(parse_pass) {
			if (parse_pass === 0) {
				rust_exec_impl.block_id = block_id++;
				return;
			}
			__rust.exec_lines(rr`
			impl Cursor<'_> {
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					/// Parses a token from the input string.
					fn advance_token(&mut self) -> Token {
					let first_char = self.bump().unwrap();
					let token_kind = match first_char {
						// Slash, comment or block comment.
						'/' => match self.first() {
							'/' => self.line_comment(),
							'*' => self.block_comment(),
							_ => Slash,
						},
			
						// Whitespace sequence.
						c if is_whitespace(c) => self.whitespace(),
			
						// Raw identifier, raw string literal or identifier.
						'r' => match (self.first(), self.second()) {
							('#', c1) if is_id_start(c1) => self.raw_ident(),
							('#', _) | ('"', _) => {
								let (n_hashes, err) = self.raw_double_quoted_string(1);
								let suffix_start = self.len_consumed();
								if err.is_none() {
									self.eat_literal_suffix();
								}
								let kind = RawStr { n_hashes, err };
								Literal { kind, suffix_start }
							}
							_ => self.ident(),
						},
			
						// Byte literal, byte string literal, raw byte string literal or identifier.
						'b' => match (self.first(), self.second()) {
							('\'', _) => {
								self.bump();
								let terminated = self.single_quoted_string();
								let suffix_start = self.len_consumed();
								if terminated {
									self.eat_literal_suffix();
								}
								let kind = Byte { terminated };
								Literal { kind, suffix_start }
							}
							('"', _) => {
								self.bump();
								let terminated = self.double_quoted_string();
								let suffix_start = self.len_consumed();
								if terminated {
									self.eat_literal_suffix();
								}
								let kind = ByteStr { terminated };
								Literal { kind, suffix_start }
							}
							('r', '"') | ('r', '#') => {
								self.bump();
								let (n_hashes, err) = self.raw_double_quoted_string(2);
								let suffix_start = self.len_consumed();
								if err.is_none() {
									self.eat_literal_suffix();
								}
								let kind = RawByteStr { n_hashes, err };
								Literal { kind, suffix_start }
							}
							_ => self.ident(),
						},
			
						// Identifier (this should be checked after other variant that can
						// start as identifier).
						c if is_id_start(c) => self.ident(),
			
						// Numeric literal.
						c @ '0'..='9' => {
							let literal_kind = self.number(c);
							let suffix_start = self.len_consumed();
							self.eat_literal_suffix();
							TokenKind::Literal { kind: literal_kind, suffix_start }
						}
			
						// One-symbol tokens.
						';' => Semi,
						',' => Comma,
						'.' => Dot,
						'(' => OpenParen,
						')' => CloseParen,
						'{' => OpenBrace,
						'}' => CloseBrace,
						'[' => OpenBracket,
						']' => CloseBracket,
						'@' => At,
						'#' => Pound,
						'~' => Tilde,
						'?' => Question,
						':' => Colon,
						'$' => Dollar,
						'=' => Eq,
						'!' => Bang,
						'<' => Lt,
						'>' => Gt,
						'-' => Minus,
						'&' => And,
						'|' => Or,
						'+' => Plus,
						'*' => Star,
						'^' => Caret,
						'%' => Percent,
			
						// Lifetime or character literal.
						'\'' => self.lifetime_or_char(),
			
						// String literal.
						'"' => {
							let terminated = self.double_quoted_string();
							let suffix_start = self.len_consumed();
							if terminated {
								self.eat_literal_suffix();
							}
							let kind = Str { terminated };
							Literal { kind, suffix_start }
						}
						_ => Unknown,
					};
					Token::new(token_kind, self.len_consumed())
				}`, __id);
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn line_comment(&mut self) -> TokenKind {
						debug_assert!(self.prev() == '/' && self.first() == '/');
						self.bump();
				
						let doc_style = match self.first() {
							// \`//!\` is an inner line doc comment.
							'!' => Some(DocStyle::Inner),
							// \`////\` (more than 3 slashes) is not considered a doc comment.
							'/' if self.second() != '/' => Some(DocStyle::Outer),
							_ => None,
						};
				
						self.eat_while(|c| c != '\n');
						LineComment { doc_style }
					}
				`, __id)
				}}
			${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn block_comment(&mut self) -> TokenKind {
						debug_assert!(self.prev() == '/' && self.first() == '*');
						self.bump();
				
						let doc_style = match self.first() {
							// \`/*!\` is an inner block doc comment.
							'!' => Some(DocStyle::Inner),
							// \`/***\` (more than 2 stars) is not considered a doc comment.
							// \`/**/\` is not considered a doc comment.
							'*' if !matches!(self.second(), '*' | '/') => Some(DocStyle::Outer),
							_ => None,
						};
				
						let mut depth = 1usize;
						while let Some(c) = self.bump() {
							match c {
								'/' if self.first() == '*' => {
									self.bump();
									depth += 1;
								}
								'*' if self.first() == '/' => {
									self.bump();
									depth -= 1;
									if depth == 0 {
										// This block comment is closed, so for a construction like "/* */ */"
										// there will be a successfully parsed block comment "/* */"
										// and " */" will be processed separately.
										break;
									}
								}
								_ => (),
							}
						}
				
						BlockComment { doc_style, terminated: depth == 0 }
					}
				`, __id)
				}}
			${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn whitespace(&mut self) -> TokenKind {
						debug_assert!(is_whitespace(self.prev()));
						self.eat_while(is_whitespace);
						Whitespace
					}
				`, __id)
				}}
			${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn raw_ident(&mut self) -> TokenKind {
						debug_assert!(self.prev() == 'r' && self.first() == '#' && is_id_start(self.second()));
						// Eat "#" symbol.
						self.bump();
						// Eat the identifier part of RawIdent.
						self.eat_identifier();
						RawIdent
					}
				`, __id)
				}}
			${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn ident(&mut self) -> TokenKind {
						debug_assert!(is_id_start(self.prev()));
						// Start is already eaten, eat the rest of identifier.
						self.eat_while(is_id_continue);
						Ident
					}
				`, __id)
				}}
			${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
				fn number(&mut self, first_digit: char) -> LiteralKind {
					debug_assert!('0' <= self.prev() && self.prev() <= '9');
					let mut base = Base::Decimal;
					if first_digit == '0' {
						// Attempt to parse encoding base.
						let has_digits = match self.first() {
							'b' => {
								base = Base::Binary;
								self.bump();
								self.eat_decimal_digits()
							}
							'o' => {
								base = Base::Octal;
								self.bump();
								self.eat_decimal_digits()
							}
							'x' => {
								base = Base::Hexadecimal;
								self.bump();
								self.eat_hexadecimal_digits()
							}
							// Not a base prefix.
							'0'..='9' | '_' | '.' | 'e' | 'E' => {
								self.eat_decimal_digits();
								true
							}
							// Just a 0.
							_ => return Int { base, empty_int: false },
						};
						// Base prefix was provided, but there were no digits
						// after it, e.g. "0x".
						if !has_digits {
							return Int { base, empty_int: true };
						}
					} else {
						// No base prefix, parse number in the usual way.
						self.eat_decimal_digits();
					};
			
					match self.first() {
						// Don't be greedy if this is actually an
						// integer literal followed by field/method access or a range pattern
						// (\`0..2\` and \`12.foo()\`)
						'.' if self.second() != '.' && !is_id_start(self.second()) => {
							// might have stuff after the ., and if it does, it needs to start
							// with a number
							self.bump();
							let mut empty_exponent = false;
							if self.first().is_digit(10) {
								self.eat_decimal_digits();
								match self.first() {
									'e' | 'E' => {
										self.bump();
										empty_exponent = !self.eat_float_exponent();
									}
									_ => (),
								}
							}
							Float { base, empty_exponent }
						}
						'e' | 'E' => {
							self.bump();
							let empty_exponent = !self.eat_float_exponent();
							Float { base, empty_exponent }
						}
						_ => Int { base, empty_int: false },
					}
				}
			`, __id)
				}}
			${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
				fn lifetime_or_char(&mut self) -> TokenKind {
					debug_assert!(self.prev() == '\'');
			
					let can_be_a_lifetime = if self.second() == '\'' {
						// It's surely not a lifetime.
						false
					} else {
						// If the first symbol is valid for identifier, it can be a lifetime.
						// Also check if it's a number for a better error reporting (so '0 will
						// be reported as invalid lifetime and not as unterminated char literal).
						is_id_start(self.first()) || self.first().is_digit(10)
					};
			
					if !can_be_a_lifetime {
						let terminated = self.single_quoted_string();
						let suffix_start = self.len_consumed();
						if terminated {
							self.eat_literal_suffix();
						}
						let kind = Char { terminated };
						return Literal { kind, suffix_start };
					}
			
					// Either a lifetime or a character literal with
					// length greater than 1.
			
					let starts_with_number = self.first().is_digit(10);
			
					// Skip the literal contents.
					// First symbol can be a number (which isn't a valid identifier start),
					// so skip it without any checks.
					self.bump();
					self.eat_while(is_id_continue);
			
					// Check if after skipping literal contents we've met a closing
					// single quote (which means that user attempted to create a
					// string with single quotes).
					if self.first() == '\'' {
						self.bump();
						let kind = Char { terminated: true };
						Literal { kind, suffix_start: self.len_consumed() }
					} else {
						Lifetime { starts_with_number }
					}
				}
			`, __id)
				}}
			${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
				fn single_quoted_string(&mut self) -> bool {
					debug_assert!(self.prev() == '\'');
					// Check if it's a one-symbol literal.
					if self.second() == '\'' && self.first() != '\\' {
						self.bump();
						self.bump();
						return true;
					}
			
					// Literal has more than one symbol.
			
					// Parse until either quotes are terminated or error is detected.
					loop {
						match self.first() {
							// Quotes are terminated, finish parsing.
							'\'' => {
								self.bump();
								return true;
							}
							// Probably beginning of the comment, which we don't want to include
							// to the error report.
							'/' => break,
							// Newline without following '\'' means unclosed quote, stop parsing.
							'\n' if self.second() != '\'' => break,
							// End of file, stop parsing.
							EOF_CHAR if self.is_eof() => break,
							// Escaped slash is considered one character, so bump twice.
							'\\' => {
								self.bump();
								self.bump();
							}
							// Skip the character.
							_ => {
								self.bump();
							}
						}
					}
					// String was not terminated.
					false
				}
			`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					/// Eats double-quoted string and returns true
					/// if string is terminated.
					fn double_quoted_string(&mut self) -> bool {
						debug_assert!(self.prev() == '"');
						while let Some(c) = self.bump() {
							match c {
								'"' => {
									return true;
								}
								'\\' if self.first() == '\\' || self.first() == '"' => {
									// Bump again to skip escaped character.
									self.bump();
								}
								_ => (),
							}
						}
						// End of file reached.
						false
					}
				`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					/// Eats the double-quoted string and returns \`n_hashes\` and an error if encountered.
					fn raw_double_quoted_string(&mut self, prefix_len: usize) -> (u16, Option<RawStrError>) {
						// Wrap the actual function to handle the error with too many hashes.
						// This way, it eats the whole raw string.
						let (n_hashes, err) = self.raw_string_unvalidated(prefix_len);
						// Only up to 65535 \`#\`s are allowed in raw strings
						match u16::try_from(n_hashes) {
							Ok(num) => (num, err),
							// We lie about the number of hashes here :P
							Err(_) => (0, Some(RawStrError::TooManyDelimiters { found: n_hashes })),
						}
					}
				`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn raw_string_unvalidated(&mut self, prefix_len: usize) -> (usize, Option<RawStrError>) {
						debug_assert!(self.prev() == 'r');
						let start_pos = self.len_consumed();
						let mut possible_terminator_offset = None;
						let mut max_hashes = 0;
				
						// Count opening '#' symbols.
						let mut eaten = 0;
						while self.first() == '#' {
							eaten += 1;
							self.bump();
						}
						let n_start_hashes = eaten;
				
						// Check that string is started.
						match self.bump() {
							Some('"') => (),
							c => {
								let c = c.unwrap_or(EOF_CHAR);
								return (n_start_hashes, Some(RawStrError::InvalidStarter { bad_char: c }));
							}
						}
				
						// Skip the string contents and on each '#' character met, check if this is
						// a raw string termination.
						loop {
							self.eat_while(|c| c != '"');
				
							if self.is_eof() {
								return (
									n_start_hashes,
									Some(RawStrError::NoTerminator {
										expected: n_start_hashes,
										found: max_hashes,
										possible_terminator_offset,
									}),
								);
							}
				
							// Eat closing double quote.
							self.bump();
				
							// Check that amount of closing '#' symbols
							// is equal to the amount of opening ones.
							// Note that this will not consume extra trailing \`#\` characters:
							// \`r###"abcde"####\` is lexed as a \`RawStr { n_hashes: 3 }\`
							// followed by a \`#\` token.
							let mut n_end_hashes = 0;
							while self.first() == '#' && n_end_hashes < n_start_hashes {
								n_end_hashes += 1;
								self.bump();
							}
				
							if n_end_hashes == n_start_hashes {
								return (n_start_hashes, None);
							} else if n_end_hashes > max_hashes {
								// Keep track of possible terminators to give a hint about
								// where there might be a missing terminator
								possible_terminator_offset =
									Some(self.len_consumed() - start_pos - n_end_hashes + prefix_len);
								max_hashes = n_end_hashes;
							}
						}
					}
					`, __id);
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn eat_decimal_digits(&mut self) -> bool {
						let mut has_digits = false;
						loop {
							match self.first() {
								'_' => {
									self.bump();
								}
								'0'..='9' => {
									has_digits = true;
									self.bump();
								}
								_ => break,
							}
						}
						has_digits
					}
					`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					fn eat_hexadecimal_digits(&mut self) -> bool {
						let mut has_digits = false;
						loop {
							match self.first() {
								'_' => {
									self.bump();
								}
								'0'..='9' | 'a'..='f' | 'A'..='F' => {
									has_digits = true;
									self.bump();
								}
								_ => break,
							}
						}
						has_digits
					}
					`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					/// Eats the float exponent. Returns true if at least one digit was met,
					/// and returns false otherwise.
					fn eat_float_exponent(&mut self) -> bool {
						debug_assert!(self.prev() == 'e' || self.prev() == 'E');
						if self.first() == '-' || self.first() == '+' {
							self.bump();
						}
						self.eat_decimal_digits()
					}
					`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.set_resolved_block(__id, function eat_float_exponent() {
						let self = __rust.get_ref_generator().clone().ffi_use_this('&mut', this);
						self = self.build();
						__rust.get_for_expr('debug_assert!')
							.inject_tokenstream(`(self.prev() == 'e' || self.prev() == 'E')`)
							.finish(';').exec();
						if (self.first() == '-' || self.first() == '+') {
							self.bump();
						}
						self.eat_decimal_digits();
					});
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
				// Eats the suffix of the literal, e.g. "_u8".
				fn eat_literal_suffix(&mut self) {
					self.eat_identifier();
				}
			`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
				${function eat_identifier() {
							let self = __rust.get_ref_generator().clone().ffi_use_this('&mut', this);
							self.rust_type('&mut');
							self.ffi_set_backing_value(this);
							is_id_start = __rust.scope_lookup('is_id_start');
							is_id_start = __rust.scope_lookup('is_id_continue');
							self = self.build();

							if (!is_id_start(self.first())) {
								return;
							}
							self.bump();

							self.eat_while(is_id_continue);
						}}
			`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					// Eats the identifier.
					fn eat_identifier(&mut self) {
						if !is_id_start(self.first()) {
							return;
						}
						self.bump();
				
						self.eat_while(is_id_continue);
					}
			`, __id);
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
						${function eat_while(predicate_arg) {
							let self = __rust.get_ref_generator().clone();
							self.ref_type('&mut');
							self.ref.value_type('Self');
							self.ref.ffi_set_backing_value(this);
							let predicate = __rust.get_fn_generator().clone();
							predicate.value_type('mut');
							predicate.value.value_type('impl FnMut(char) -> bool');
							predicate.ffi_set_backing_value(predicate_arg);
							predicate.value.throw_if_type_error();
							while (predicate(self.first()) && !self.is_eof()) {
								self.bump();
							}
						}}
					`, __id)
				}}
				${function rust_exec_any(parse_pass) {
					if (parse_pass === 0) {
						rust_exec_any.block_id = block_id++;
						return;
					}
					let __id = rust_exec_any.block_id;
					__rust.exec_lines(rr`
					/// Eats symbols while predicate returns true or until the end of file is reached.
					fn eat_while(&mut self, mut predicate: impl FnMut(char) -> bool) {
						while predicate(self.first()) && !self.is_eof() {
							self.bump();
						}
					}
					`, __id)
				}}

			}
			`, __id);
		}}
	`;
	__rust.files = [];
	__rust.files.push(['rustc_lexer/lib.rs', __rust.block_vec]);
	__rust.crates.push(['nightly-rustc', __rust.files]);
	__rust.block_vec = [];
	window.__rust.current_scope.top.create_variable('__rust').set_value(__rust);
	console.log(__rust.crates);
	//console.log(rust_code);
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
				console.log('Test failures:' + fail_count);
				console.log(...this.results);
			}
		}
	};
	test.addTest(function() {
		let regex = /(\/\*|\*\/)(?:(?:!\/\*|\*\/).)*/g;
		let input = '/* /* */ */ /* /* */ */';
		let rust_rustc_tokens_vec = [];
		let tok_arr = [];
		let blk_com_dep = 0;
		let in_comment = false;
		let str_loc = 0;
		function accept_result(mat, acc) {
			let res = [];
			if (mat[0] === '/*') {
				if (blk_com_dep === 0) {
					in_comment = true;
				}
				blk_com_dep++;
			} else if (mat[0] === '*/') {
				blk_com_dep--;
				if (blk_com_dep === 0) {
					in_comment = false;
				}
			}
			res.push(input.slice(acc, mat.index));
			let di = mat.index - acc;
			res.push(acc + mat[0].length + di);
			let iter = {
				cur: 0,
				next() {
					if (this.cur < res.length) {
						return {
							value: res[this.cur++],
							done: false,
						}
					} else {
						return {
							value: void 0,
							done: true,
						}
					}
				}
			}
			return iter;
		}
		let cur;
		let in_comment_prev = false;
		for (; cur = regex.exec(input);) {
			let iter = accept_result(cur, str_loc);
			let str0 = iter.next().value;
			str_loc = iter.next().value;
			if (str0 !== '') {
				tok_arr.push(str0);
				if (in_comment_prev) {
					rust_rustc_tokens_vec.push({
						kind: 'block_comment_content',
						len: str0.length,
					});
				} else {
					rust_rustc_tokens_vec.push({
						kind: 'raw_text',
						len: str0.length,
					});
				}
			}
			in_comment_prev = in_comment;
			tok_arr.push(cur[0]);
			rust_rustc_tokens_vec.push({
				kind: 'block_comment_parsed',
				len: cur[0].length,
			});
		}
		console.log(tok_arr.join(), ...rust_rustc_tokens_vec.slice(0, 2), rust_rustc_tokens_vec[7]);
	});
	let cidx = 0;
	let mt = rust_match_rx.exec(rust_code);
	rust_code.slice(cidx, mt.index);
	cidx = mt.index + mt[0].length;
	//test.runAll();
	//# sourceURL=https://github.com/mjz19910/jt-one-hour-lang/blob/master/src/main.rs_to_js.js
}