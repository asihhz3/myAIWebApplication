use std::{path::PathBuf, sync::Arc};

use axum::body::Bytes;
use tokio::sync;


pub type OnceSender<T> = sync::oneshot::Sender<T>;
pub type OnceReciver<T> = sync::oneshot::Receiver<T>;

type StrReciver = OnceReciver<Result<String, Arc<dyn std::error::Error + Send + Sync>>>;
type StrSender = OnceSender<Result<String, Arc<dyn std::error::Error + Send + Sync>>>;

type PathSender = OnceSender<Result<PathBuf, Arc<dyn std::error::Error + Send + Sync>>>;

pub trait TaskReponser {
    fn str_reponser(&mut self) -> Option<StrSender>;

    fn path_reponser(&mut self) -> Option<PathSender>;
}

pub trait FileSystemTask : TaskReponser + Send + Sync{
    fn kind(&self) -> &NormalTask;
}

pub enum NormalTask {
    SaveImgFile(Bytes, Option<PathSender>)
}

impl TaskReponser for NormalTask  {
    fn str_reponser(&mut self) -> Option<StrSender> {
        match self {
            _ => None
        }
    }

    fn path_reponser(&mut self) -> Option<PathSender> {
        match self {
            Self::SaveImgFile(_b, sd_option) => 
            {
                sd_option.take()
            },
            _ => None
        }
    }
}

impl FileSystemTask for NormalTask  {
    fn kind(&self) -> &NormalTask {self}
}