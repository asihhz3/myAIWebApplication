use std::{path::{PathBuf}, sync::Arc};

use chrono::Utc;
use tokio::sync::mpsc::{Receiver, Sender};
use uuid::{Uuid};

use crate::{data::file::{channel::{send_dpref_response_no_result, send_response_no_result}, ftype::{FileSystemTask, NormalTask::SaveImgFile}}, tool::{log::{log_write_error, log_write_error_async, log_write_error2}, path::FilePath}};

pub type FileSender = Sender<Box<dyn FileSystemTask>>;
pub type FileReciver = Receiver<Box<dyn FileSystemTask>>;


pub mod image;

pub mod ftype;

pub mod channel;

pub const BACKEND_STORAGE_PATH : &str = "data\\storage";

pub const BACKEND_IMAGE_PATH : &str = "image";

fn create_random_filename() -> String{
    let now = Utc::now();
    let uuid = Uuid::now_v7();
    format!("{}_{}", now.format("%Y%m%d_%H%M%S"), uuid)
}


pub async fn file_deamon_server(mut rv : FileReciver) {
    while let Some(mut task) = rv.recv().await {
        let sd_option = task.as_mut().path_reponser();
        match task.kind() {
            SaveImgFile(bytes, _) => {
                let mut img_url = PathBuf::from(BACKEND_STORAGE_PATH);
                img_url.push(BACKEND_IMAGE_PATH);
                if let Some(sd)= sd_option {
                    loop {
                        let file_name = create_random_filename();
                        match tokio::fs::try_exists(img_url.join(&file_name)).await {
                            Ok(t) if !t => {
                                img_url.push(file_name);
                                break;
                            },
                            Err(err) => {
                                let rc = Arc::new(err);
                                log_write_error_async(rc.clone());
                                send_response_no_result(sd, Err(rc));
                                return;
                            },
                            _ => {}
                        };
                    }
                    if let Some(parent) = img_url.parent() && let Err(err) = tokio::fs::create_dir_all(parent).await{
                        log_write_error2(&err);
                        send_response_no_result(sd, Err(Arc::new(err)));
                        return;
                    }

                    match tokio::fs::write(&img_url, bytes).await {
                        Ok(()) => {
                            send_response_no_result(sd, Ok(img_url));
                        },
                        Err(err)=>  {
                            let rc = Arc::new(err);
                            log_write_error_async(rc.clone());
                            send_response_no_result(sd, Err(rc));
                        }
                    }
                } 
                else {
                    log_write_error(Box::new("recevice a task without sender"));
                }
            }
        }
    }
}