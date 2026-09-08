use std::sync::Arc;

use axum::body::Bytes;
use serde::{Deserialize, Serialize};

use crate::data::{mimetype::Image, user::UserData};



// #[derive(Deserialize, Clone)]
// pub struct JsonMessage {
//     pub content: Option<String>,
//     pub image_mime : Option<Vec<Image>>
// }

pub struct StoreMessage {
    pub msg_id : String,
    pub role : String,
    pub dialog_id : String,
    pub content: Option<String>,
    pub image_blob : Option<Vec<Bytes>>
}

#[derive(Deserialize, Clone)]
pub struct RequestMessage {
    pub user_id : String,
    pub dialog_id : Option<String>,
    pub msg_id : Option<String>,
}

#[derive(Serialize, Clone)]
pub struct ResponseMessage {
    pub msg_id : String,
    pub role : String,
    pub content: Option<String>,
    pub image_urls : Option<Vec<String>>
}



// #[derive(Deserialize, Clone)]
// pub struct JsonDialog {
//     pub messages : Arc<Vec<JsonMessage>>
// }

#[derive(Serialize, Clone)]
pub struct ResponseDialog {
    pub messages : Arc<Vec<ResponseMessage>>
}

impl ResponseDialog {
    pub fn from_vec(vec : Vec<ResponseMessage>) -> ResponseDialog{
        ResponseDialog { 
            messages: Arc::from(vec)
        }
    }

    pub fn new(vec : &Vec<ResponseMessage>) -> ResponseDialog{
        ResponseDialog { 
            messages: Arc::from((*vec).clone())
        }
    }
}


pub struct HistoryStoreRequest {
    pub user : UserData,
    // pub dialog : JsonDialog
    pub msg : StoreMessage
}