use std::ops::Deref;

use axum::{Json, http::StatusCode};
use sqlx::Either::{Left, Right};

use crate::{localresponse::rtype::ResponseContent, tool::log, util::error::{ClientError, Error}};


pub mod rtype;

pub fn response_ok_wrapper(code : StatusCode) -> (StatusCode, Json<ResponseContent>) {
    (
        code,
        Json (
            ResponseContent::Ok { status: code.to_string() }
        )
    )
}

pub fn response_error_wrapper2<E>(error : E) -> (StatusCode, Json<ResponseContent>)
where E : Deref, E::Target : Error {
    let (code, reason) = match error.kind() {
        Left(cerr) => match cerr {
            ClientError::InvaildInputData(_) => (StatusCode::NOT_FOUND, cerr.to_string())
        },
        Right(serr) => {
            log::log_write_error2(serr);
            (StatusCode::INTERNAL_SERVER_ERROR, String::from("server_error"))
        }
    };
    (
        code,
        Json (
            ResponseContent::Error { 
                status: code.to_string(),
                reason
            }
        )
    )
}

pub fn response_error_wrapper(code : StatusCode, error_reason : &str) -> (StatusCode, Json<ResponseContent>) {
    (
        code,
        Json (
            ResponseContent::Error { 
                status: code.to_string(),
                reason : String::from(error_reason)
            }
        )
    )
}