use core::fmt;
use std::path::StripPrefixError;


use crate::util::{error::{ClientError::InvaildInputData, ServerError::{DataBaseInnerError, FileSystemError, InvaildPathEncode}}, utype::Either};

pub trait Error : std::error::Error + Send + Sync{
    fn kind(&self) -> Either<&ClientError, &ServerError>;
}

#[derive(Debug)]
pub enum ClientError {
    InvaildInputData(String)
}


impl fmt::Display for ClientError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            InvaildInputData(msg) => write!(f, "invaild data : {}", msg)
        }
    }
}

impl std::error::Error for ClientError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        None
    }

    fn description(&self) -> &str {
        match self {
            ClientError::InvaildInputData(str) => str
        }
    }

    fn cause(&self) -> Option<&dyn std::error::Error> {
        None
    }
}

impl Error for ClientError {
    fn kind(&self) -> Either<&ClientError, &ServerError> {
        Either::Left(self)
    }
}


impl From<ClientError> for Box<dyn Error> {
    fn from(e: ClientError) -> Self {
        Box::new(e)
    }
}

impl From<axum::extract::multipart::MultipartError> for Box<dyn Error> {
    fn from(value: axum::extract::multipart::MultipartError) -> Self {
        Box::new(ClientError::InvaildInputData(value.to_string()))
    }
}


#[derive(Debug)]
pub enum ServerError {
    InvaildPathEncode(String),
    PathNotFound(String, String),
    StripPrefixError(String),
    DataBaseOperationError(String),
    DataBaseInnerError(sqlx::Error),
    IOError(std::io::Error),
    FileSystemError(String)
}

impl fmt::Display for ServerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            InvaildPathEncode(msg) => write!(f, "invaild path encode : {}", msg),
            FileSystemError(msg) => write!(f, "server file system error : {}", msg),
            Self::DataBaseOperationError(msg) => write!(f, "database operation error : {}", msg),
            Self::PathNotFound(path, msg) => write!(f, "file in '{}' not found : {}", path, msg),
            Self::StripPrefixError(msg) => write!(f, "strip prefix error : {}", msg),
            DataBaseInnerError(err) => err.fmt(f),
            Self::IOError(err) => err.fmt(f)
        }
    }
}

impl std::error::Error for ServerError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            DataBaseInnerError(err) => Some(err),
            _ => None
        }
    }

    fn description(&self) -> &str {
        match self {
            InvaildPathEncode(msg) => msg,
            FileSystemError(msg) => msg,
            Self::DataBaseOperationError(msg) => msg,
            Self::StripPrefixError(msg) => msg,
            Self::PathNotFound(path, msg) => msg,
            DataBaseInnerError(err) => err.description(),
            Self::IOError(err) => err.description()
        }
    }

    fn cause(&self) -> Option<&dyn std::error::Error> {
        None
    }
}


impl Error for ServerError {
    fn kind(&self) -> Either<&ClientError, &ServerError> {
        Either::Right(self)
    }
}

impl From<ServerError> for Box<dyn Error> {
    fn from(e: ServerError) -> Self {
        Box::new(e)
    }
}

impl From<StripPrefixError> for Box<dyn Error> {
    fn from(e: StripPrefixError) -> Self {
        Box::new(ServerError::StripPrefixError(e.to_string()))
    }
}

impl From<sqlx::Error> for Box<dyn Error> {
    fn from(e: sqlx::Error) -> Self {
        Box::new(ServerError::DataBaseInnerError(e))
    }
}

impl From<sqlx::Error> for ServerError {
    fn from(e: sqlx::Error) -> Self {
        ServerError::DataBaseInnerError(e)
    }
}

impl From<std::io::Error> for Box<dyn Error> {
    fn from(e: std::io::Error) -> Self {
        Box::new(ServerError::IOError(e))
    }
}

