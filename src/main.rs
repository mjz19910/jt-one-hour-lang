enum Lang {
	SetVar(String,Value),
	GetVar(String)
}

#[derive(Clone)]
enum Value {
	Int(i64),
	String(String),
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
						None => return Err(EngineError::MissingVariable(name.into())),
					}
				}
			}
		}
        output
	}
}

fn parse_var_name(var_name) {
	Ok(var_name.into())
}

fn parse_value(val:&str) -> Result<Value, EngineError>{
	let result:Result<i64,_>=val.parse::<i64>();
	match result {
		Ok(x)=>return Value::Int(x),
		_ => Err(EngineError::MismatchType),
	}
}

fn parse_set(input:&[&str]) -> Result<Command,EngineError> {
	if input.len() != 3 {
		return Err(EngineError::MismatchNumParams)
	}

	let var_name = parse_var_name(input[1])?

	let value = parse_value(input[2])?

	Ok(Command::SetVar(var_name, value))
}

fn parse_get(input:&[&str]) -> Result<Command,EngineError> {
	if input.len() != 2 {
		return Err(EngineError::MismatchNumParams)
	}

	let var_name = parse_var_name(input[1])?

	Ok(Command::GetVar(var_name))
}

parse_string(val:&str)=>Result<Value,EngineError>{
	if val.starts_with("\"") && val.ends_with("\"") && val.len() > 1 {
		let inner = val[1..(val.len()-1)]
	} else {
		Err(EngineError::MismatchType)
	}
}

parse_int(val:&str)=>Result<Value, EngineError>{
	parse_i64(val)
}

parse_i64(val:&str)=>Result<Value, EngineError>{
	let result = val.parse::<i64>::parse(val);

	match result {
		Ok(x) => Ok(Value::Int(x)),
		_ => Err(EngineError::MismatchType),
	}
}

parse_value(val:&str) -> Result<Value, EngineError> {
	if val.starts_with("\"") && val.ends_with("\"") && val.len() > 1 {
		// Parse the string
		parse_string(val)
	} else {
		parse_int(val)
	}
}

fn parse(input: &str) -> Result<Vec<Command>, EngineError> {
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
			Some(name) => return Err(EngineError::UnknownCommand(name.to_string())),
			None => {}
		}
	}

    Ok(output)
}

#[test]
fn test1() -> Result<(), EngineError> {
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
fn parse_test1() -> Result<(), EngineError> {
	let input = r#"set x "test"\nget x"#;

	let commands = parse(input);

	let mut evaluator=Evaluator::new();
	let result = evaluator.evaluate(&commands)?;

	assert_eq!(result, Value::Int(30));

	Ok(())
}

fn parse_test2() -> Result<(), EngineError> {
	let input = r#"set x "hello"\nget x"#;

	let commands = parse(input);

	let mut evaluator=Evaluator::new();
	let result = evaluator.evaluate(&commands)?;

	assert_eq!(result, Value::String("hello".into()));

	Ok(())
}

fn main() {
	println!("Hello World");
}