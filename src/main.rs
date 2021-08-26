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
						None => return Err(EngineError::MissingVariable(name.into())),
					}
				}
			}
		}
        output
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

fn parse(input: &str) -> Result<Vec<Commands>, EngineError> {
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

    Ok(vec![])
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

/////#[test]

fn main() {
	println!("Hello World");
}