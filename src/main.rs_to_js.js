let rust_code=`fn main() {
    println!("Hello World");
}`;
let rust_match_rx=/_(?=!>[a-zA-Z_])|fn|self|match|yield|macro|impl|\s|[\(\)]|[\[\]]|[{}]|::|->|<-|@|[a-zA-Z_]/;
let cidx=0;
let mt=rust_match_rx.exec(rust_code);
rust_code.slice(cidx,mt.index);
cidx=mt.index+mt[0].length;