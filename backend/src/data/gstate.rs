

use chrono::Utc;
use sqlx::{Pool, Sqlite};

use crate::{data::{self, database::dbtype::DialogMsgRecord, dialog::dtype::{ResponseDialog, ResponseMessage, StoreMessage}, file::image::image_store, user::UserData}, tool::{router::file_path_to_web_path}, util::error::{Error, ServerError::{self, FileSystemError}}};



pub struct GState {
    sql_pool : Pool<Sqlite>,
    fs_sender : data::file::FileSender
}

impl GState  {
    pub async fn new(
        pool : Pool<Sqlite>,
        fssd : data::file::FileSender
    ) -> GState{
        GState {
            sql_pool : pool,
            fs_sender : fssd
        }
    }

    pub async fn get_user_by_id(&self, id : &str) -> Result<Option<UserData>, sqlx::Error>{
        data::database::userdb::get_user_by_id(&self.sql_pool, id).await
    }

    pub async fn create_new_user(&self, data : &UserData) -> Result<bool, sqlx::Error>{
        data::database::userdb::insert_user(&self.sql_pool, data).await
    }

    pub async fn get_dialog_list(&self, user : &UserData) -> Result<Vec<String>, Box<dyn Error>>{
        Ok(data::database::dialogdb::get_dialog_list(&self.sql_pool, &user.id).await?)
    }

    pub async fn get_dialog_msg(&self, user : &UserData, _dialog_id : &String, msg_id : &String) -> Result<ResponseMessage, Box<dyn Error>>{
        Ok(data::database::dialogdb::get_dialog_msg(&self.sql_pool, &user.id, msg_id).await?)
    }

    pub async fn get_dialog_all(&self, user : &UserData, dialog_id : &String) -> Result<ResponseDialog, Box<dyn Error>>{
        Ok(data::database::dialogdb::get_dialog_all(&self.sql_pool, &user.id, dialog_id).await?)
    }

    pub async fn insert_new_dialog_msg(&self, user : &UserData, msg : StoreMessage) -> Result<(), Box<dyn Error>>{
        let mut imgs_urls : Option<Vec<String>>= None;


        if let Some(blobs) = msg.image_blob {
            let mut url_list = Vec::<String>::new();
            for byte in blobs {
                match image_store(&self.fs_sender, byte).await {
                    Ok(path) => {
                        match file_path_to_web_path(path) {
                            Ok(path) => url_list.push(path),
                            Err(err) => return Err(err.into())
                        };
                    },
                    Err(err) => return Err(Box::new(FileSystemError(err.to_string())))
                }
            }
            imgs_urls = Some(url_list)
        }

        let (msg_id, role, dialog_id, user_id, content) = (msg.msg_id, msg.role, msg.dialog_id, user.id.clone(), msg.content);
        let record = DialogMsgRecord {
            msg_id,
            role,
            dialog_id,
            user_id,
            created_time : Utc::now().to_string(),
            content,
            image_urls : imgs_urls
        };

        if let Err(path) = record.url_valid()? {
            return Err(Box::new(ServerError::PathNotFound(String::from(path), String::from("failed to save image"))))
        }

        if !data::database::dialogdb::insert_dialog_msg(&self.sql_pool, &record).await? {
            return Err(Box::new(ServerError::DataBaseOperationError(String::from("failed to store img_url to db"))))
        }
        Ok(())
    }
}
