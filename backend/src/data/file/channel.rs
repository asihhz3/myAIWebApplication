use std::{fmt::Display, ops::Deref};

use crate::{data::file::ftype::OnceSender, tool::log::{log_write_error, log_write_error_str}};


pub fn send_response_no_result<O>(sd : OnceSender<O>, obj : O) {
    if let Err(_) = sd.send(obj) {
        log_write_error(Box::new("failed to send oneshot response in channel"));
    }
}

pub fn send_displayable_response_no_result<T, E>(sd : OnceSender<Result<T, E>>, obj : Result<T, E>) 
    where T : Display,
        E : std::error::Error {
    if let Err(re) = sd.send(obj) {
        match re {
            Ok(obj) => log_write_error(Box::new(format!("failed to send oneshot response in channel, response msg : {}", obj))),
            Err(obj) => log_write_error(Box::new(format!("failed to send oneshot response in channel, response msg : {}", obj))),
        };
    }
}

pub fn send_tostring_response_no_result<T, E>(sd : OnceSender<Result<T, E>>, obj : Result<T, E>) 
    where T : Into<String>,
    E : std::error::Error {
    if let Err(re) = sd.send(obj) {
        match re {
            Ok(obj) => log_write_error_str(format!("failed to send oneshot response in channel, response msg : {}", obj.into())),
            Err(obj) => log_write_error(Box::new(format!("failed to send oneshot response in channel, response msg : {}", obj))),
        };
    }
}

pub fn send_dpref_response_no_result<T, E>(sd : OnceSender<Result<T, E>>, obj : Result<T, E>) 
    where T : Deref, T::Target : Display,
    E : std::error::Error {
    if let Err(re) = sd.send(obj) {
        match re {
            Ok(obj) => log_write_error_str(format!("failed to send oneshot response in channel, response msg : {}", obj.to_string())),
            Err(obj) => log_write_error(Box::new(format!("failed to send oneshot response in channel, response msg : {}", obj))),
        };
    }
}