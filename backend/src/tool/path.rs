use std::path::{Path, PathBuf};

use crate::util;


pub trait FilePath {
    fn to_str_safe(&self) -> Result<&str, util::error::ServerError>;
}

impl FilePath for PathBuf {
    fn to_str_safe(&self) -> Result<&str, util::error::ServerError> {
        match self.to_str() {
            Some(str) => Ok(str),
            None => Err(util::error::ServerError::InvaildPathEncode(format!("failed to parse path to string")))
        }
    }
}

impl FilePath for Path {
    fn to_str_safe(&self) -> Result<&str, util::error::ServerError> {
        match self.to_str() {
            Some(str) => Ok(str),
            None => Err(util::error::ServerError::InvaildPathEncode(format!("failed to parse path to string")))
        }
    }
}