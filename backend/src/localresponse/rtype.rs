use serde::Serialize;



#[derive(Serialize)]
pub enum ResponseContent{
    Ok {status : String },
    Error {status : String, reason : String}
}
