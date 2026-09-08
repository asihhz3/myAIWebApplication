use serde::Deserialize;


#[derive(Deserialize)]
pub struct UserData {
    pub id : String,
    pub name : String   
}