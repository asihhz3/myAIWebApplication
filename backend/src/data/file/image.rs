

use std::{error::Error, path::PathBuf, sync::Arc};

use axum::body::Bytes;

use crate::data::file::{FileSender, ftype};

pub async fn image_store(fssd : &FileSender, data : Bytes) -> Result<PathBuf, Arc<dyn Error>>{
    let (sd, rv) = tokio::sync::oneshot::channel::<Result<PathBuf, Arc<dyn Error + Send + Sync>>>();
    if let Err(err) = fssd.send(Box::new(ftype::NormalTask::SaveImgFile(data, Some(sd)))).await {
        return Err(Arc::new(err));
    }
    match rv.await {
        Ok(inner) => match inner {
            Ok(path) => Ok(path),
            Err(e) => Err(e),
        },
        Err(err) => Err(Arc::new(err)),
    }
}