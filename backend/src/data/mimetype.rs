use serde::{Deserialize, Serialize};


#[derive(Deserialize, Serialize, Clone)]
pub struct Image {
    #[serde(rename = "type")]
    pub img_type : String, 
    pub data : Vec<u8>
}
