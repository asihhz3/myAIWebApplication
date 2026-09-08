use std::io;

use sqlx::prelude::FromRow;

use crate::{tool::router::web_url_valid};


pub struct ImageRecord {
    pub msg_id : String,
    pub image_urls : Vec<String>
}

#[derive(FromRow)]
pub struct ImageSelectRow {
    pub msg_id : String,
    pub image_url : String
}

#[derive(Clone)]
pub struct DialogMsgRecord {
    pub msg_id : String,
    pub role : String,
    pub dialog_id : String,
    pub user_id : String,
    pub created_time : String,
    pub content : Option<String>,
    pub image_urls : Option<Vec<String>>
}

#[derive(FromRow)]
pub struct DialigSelectRow {
    pub msg_id : String,
    pub role : String,
    pub dialog_id : String,
    pub user_id : String,
    pub rowid : i64,
    pub created_time : String,
    pub content : Option<String>,
}

impl DialogMsgRecord {
    pub fn url_valid(&self) -> Result<Result<(), &String>, io::Error>{
        // let mut re = true;

        if let Some(urls) = &self.image_urls {
            for image in urls {
                if !web_url_valid(&image) {
                    return Ok(Err(&image))
                }
            }
        };
        Ok(Ok(()))
    }
}