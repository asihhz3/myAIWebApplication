use std::{fmt::Display, ops::Deref, sync::Arc};



pub fn log_write_message(msg : Box<dyn Display + '_>) {
    println!("[Server] {}", msg)
}

pub fn log_write_error(msg : Box<dyn Display + '_>) {
    println!("[Error] {}",msg)
}

pub fn log_write_error2<T>(msg : T) 
where T : Deref, T::Target : Display {
    println!("[Error] {}", &*msg)
}

pub fn log_write_error_str(msg : String) {
    println!("[Error] {}",msg)
}

pub fn log_write_error_async(msg : Arc<dyn Display>) {
    println!("[Error] {}",msg)
}