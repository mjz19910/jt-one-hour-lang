#![allow(dead_code)]

use std::collections::HashMap;

#[derive(Debug)]
enum Command {
    SetVar(String, Value),
    GetVar(String),
    PushVar(String),
    Push(Value),
    Pop,
    Add,
}

#[derive(Clone, PartialEq, Debug)]
enum Value {
    Nothing,
    Int(i64),
    String(String),
}

#[derive(Clone, PartialEq, Debug)]
enum Type {
    Int,
    String,
    Nothing,
}

enum Object {
    Nothing,
    Value(Type, Value),
    Raw(Value),
}

#[derive(Debug)]
enum EngineError {
    MismatchNumParams,
    MismatchType,
    UnknownCommand(String),
    MissingVariable(String),
    EmptyStack,
}

struct Evaluator {
    vars: HashMap<String, Object>,
    stack: Vec<Object>,
    global_vars: HashMap<String, Object>,
    scope_stack: Vec<HashMap<String, Object>>,
}

impl Evaluator {
    fn new() -> Evaluator {
        Self {
            vars: HashMap::new(),
            stack: vec![],
            global_vars: HashMap::new(),
            scope_stack: vec![],
        }
    }

    fn pop(&mut self) -> Result<Object, EngineError> {
        let result = self.stack.pop();
        match result {
            Some(v) => Ok(v),
            None => Err(EngineError::EmptyStack),
        }
    }

    fn add(&self, lhs: Object, rhs: Object) -> Result<Object, EngineError> {
        match (lhs, rhs) {
            (Object::Raw(Value::Int(i1)), Object::Raw(Value::Int(i2))) => {
                Ok(Object::Raw(Value::Int(i1 + i2)))
            }
            (Object::Raw(Value::String(s1)), Object::Raw(Value::String(s2))) => {
                Ok(Object::Raw(Value::String(s1 + &s2)))
            }
            _ => Err(EngineError::MismatchType),
        }
    }

    fn evaluate<'a>(&mut self, commands: &[Command], typechecker: &'a mut Typechecker) -> Result<(Object, &'a mut Typechecker), EngineError> {
        let mut output = Object::Raw(Value::Nothing);
        for (_command_id, command) in commands.iter().enumerate() {
			let type_result = typechecker.typecheck_command(command)?;
            match command {
                Command::SetVar(name, value) => {
                    self.vars.insert(name.into(), Object::Value(type_result.clone(), value.clone()));
                }
                Command::GetVar(name) => match self.vars.get(name) {
                    Some(Object::Raw(value)) => output = Object::Raw(value.clone()),
                    Some(Object::Value(v_type, value)) => {
                        output = Object::Value(v_type.clone(), value.clone())
                    }
                    Some(Object::Nothing) => panic!("nothing object"),
                    None => return Err(EngineError::MissingVariable(name.into())),
                },
                Command::PushVar(name) => match self.vars.get(name) {
                    Some(Object::Raw(value)) => self.stack.push(Object::Raw(value.clone())),
                    Some(Object::Value(v_type, value)) => self
                        .stack
                        .push(Object::Value(v_type.clone(), value.clone())),
                    Some(Object::Nothing) => panic!("nothing object"),
                    None => return Err(EngineError::MissingVariable(name.into())),
                },
                Command::Push(v) => self.stack.push(Object::Raw(v.clone())),
                Command::Pop => {
                    output = self.pop()?;
                }
                Command::Add => {
                    let lhs = self.pop()?;
                    let rhs = self.pop()?;

                    let result = self.add(lhs, rhs)?;
                    self.stack.push(result)
                }
            }
        }
        Ok((output, typechecker))
    }
}

fn parse_var_name(var_name: &str) -> Result<String, EngineError> {
    Ok(var_name.into())
}

fn parse_string(val: &str) -> Result<Value, EngineError> {
    if val.starts_with("\"") && val.ends_with("\"") && val.len() > 1 {
        let inner = val[1..(val.len() - 1)].to_string();

        Ok(Value::String(inner))
    } else {
        Err(EngineError::MismatchType)
    }
}

fn parse_int(val: &str) -> Result<Value, EngineError> {
    let result = val.parse::<i64>();

    match result {
        Ok(x) => Ok(Value::Int(x)),
        _ => Err(EngineError::MismatchType),
    }
}

fn parse_value(val: &str) -> Result<Value, EngineError> {
    if val.starts_with('"') && val.ends_with('"') && val.len() > 1 {
        // Parse the string
        parse_string(val)
    } else {
        // Parse the number
        parse_int(val)
    }
}

fn parse_set(input: &[&str]) -> Result<Command, EngineError> {
    if input.len() != 3 {
        return Err(EngineError::MismatchNumParams);
    }

    let var_name = parse_var_name(input[1])?;
    let value = parse_value(input[2])?;

    Ok(Command::SetVar(var_name, value))
}

fn parse_get(input: &[&str]) -> Result<Command, EngineError> {
    if input.len() != 2 {
        return Err(EngineError::MismatchNumParams);
    }

    let var_name = parse_var_name(input[1])?;

    Ok(Command::GetVar(var_name))
}

fn parse_push(input: &[&str]) -> Result<Command, EngineError> {
    if input.len() != 2 {
        return Err(EngineError::MismatchNumParams);
    }

    let val = parse_value(input[1])?;

    Ok(Command::Push(val))
}

fn parse_pushvar(input: &[&str]) -> Result<Command, EngineError> {
    if input.len() != 2 {
        return Err(EngineError::MismatchNumParams);
    }

    let var_name = parse_var_name(input[1])?;

    Ok(Command::PushVar(var_name))
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
}

struct Typechecker {
    stack: Vec<Type>,
}

impl Typechecker {
    fn print_types(&mut self) -> Option<()> {
        for (id, type_info) in self.stack.iter().enumerate() {
            println!("type[{}]={:?}", id, type_info);
        }
        Some(())
    }

    fn typecheck_command(&mut self, command: &Command) -> Result<Type, EngineError> {
        //println!("typecheck command {:?}", command);
        match command {
            Command::SetVar(_, Value::Int(_)) => Ok(Type::Int),
            Command::SetVar(_, Value::String(_)) => Ok(Type::String),
			Command::Push(Value::Int(_)) => Ok(Type::Int),
			Command::Push(Value::String(_)) => Ok(Type::String),
            _ => Ok(Type::Nothing),
        }
    }

    fn typecheck(&mut self, commands: &[Command]) -> Result<Type, EngineError> {
        for command in commands {
            let typecheck_result = self.typecheck_command(&command)?;
            self.stack.push(typecheck_result);
        }
        Ok(Type::Nothing)
    }
}

#[test]
fn test1() -> Result<(), EngineError> {
    let commands = vec![
        Command::SetVar("a".into(), Value::Int(100)),
        Command::GetVar("a".into()),
    ];

    let mut evaluator = Evaluator::new();

    let result = evaluator.evaluate(&commands)?;

    assert_eq!(result, Value::Int(100));

    Ok(())
}

#[test]
fn eval_set_get() -> Result<(), EngineError> {
    let input = "set x 30\nget x";

    let commands = parse(input)?;

    let mut evaluator = Evaluator::new();
    let result = evaluator.evaluate(&commands)?;

    assert_eq!(result, Value::Int(30));

    Ok(())
}

#[test]
fn eval_set_get_string() -> Result<(), EngineError> {
    let input = "set x \"hello\"\nget x";

    let commands = parse(input)?;

    let mut evaluator = Evaluator::new();
    let result = evaluator.evaluate(&commands)?;

    assert_eq!(result, Value::String("hello".into()));

    Ok(())
}

#[test]
fn eval_stack() -> Result<(), EngineError> {
    let input = "push 100\npush 30\nadd\npop";

    let commands = parse(input)?;

    let mut evaluator = Evaluator::new();
    let result = evaluator.evaluate(&commands)?;

    assert_eq!(result, Value::Int(130));

    Ok(())
}

#[test]
fn eval_pushvar() -> Result<(), EngineError> {
    let input = "set x 33\npushvar x\npush 100\nadd\npop";

    let commands = parse(input)?;

    let mut evaluator = Evaluator::new();
    let result = evaluator.evaluate(&commands)?;

    assert_eq!(result, Value::Int(133));

    Ok(())
}

fn do_typecheck_test() -> Result<(), EngineError> {
    let mut typechecker = Typechecker { stack: vec![] };

    let input = "set x 33\nset x \"qv\"\nget x";

    let commands = parse(input)?;

    let type_res = typechecker.typecheck(&commands)?;

    typechecker.print_types();

    let mut engine = Evaluator::new();

	let (answer, _typechecker) = engine.evaluate(&commands,&mut typechecker)?;

    if let Object::Raw(out) = answer {
        println!("return {:?}", out);
    }

    println!("type {:?}", type_res);

    Ok(())
}

fn main() -> Result<(), EngineError> {
    for arg in std::env::args().skip(1) {
        let contents = std::fs::read_to_string(arg).unwrap();
        let mut engine = Evaluator::new();
		let mut typechecker = Typechecker { stack: vec![] };
        let commands = parse(&contents)?;
		let (answer, _) = engine.evaluate(&commands,&mut typechecker)?;
		match answer {
			Object::Raw(Value::Int(answer)) => {
				println!("{:?}", answer);
			},
			Object::Raw(Value::String(answer)) => {
				println!("{:?}", answer);
			},
			Object::Raw(answer) => {
				println!("{:?}", answer);
			},
			Object::Value(answer_type, Value::String(answer)) => {
				println!("{:?} {:?}",answer_type, answer);
			},
			Object::Value(answer_type, answer) => {
				println!("{:?} {:?}",answer_type, answer);
			},
			Object::Nothing=>{}
		} 
    }

    Ok(())
}
