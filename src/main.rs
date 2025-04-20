mod workerd_capnp {
    include!(concat!(env!("OUT_DIR"), "/workerd_capnp.rs"));
}

mod config;

fn main() {
    println!("Hello, world!");
}
