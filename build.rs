fn main() {
    // print out dir
    println!("out dir: {}", std::env::var("OUT_DIR").unwrap());

    // generate the capnp code
    capnpc::CompilerCommand::new()
        .src_prefix("workerd")
        .file("workerd/workerd.capnp")
        .run()
        .expect("Failed to generate capnp code");
}
