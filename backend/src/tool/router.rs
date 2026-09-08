use std::{path::{Path, PathBuf}};

use crate::{data::file::BACKEND_STORAGE_PATH, util::error::{Error}, tool::path::FilePath};


pub const SAVE_DIALOG_PATH : &str = "/save";
pub const STORAGE_PATH : &str = "/storage";
pub const QUERY_PATH : &str = "/query";


pub fn web_url_valid(router_url : &str) -> bool {
    match web_path_to_file_path(String::from(router_url)) {
        Some(path) => { 
            path.exists()
        },
        None => false
    }
}

pub fn web_path_to_file_path(web_url : String) -> Option<PathBuf>{
    Some(Path::new(BACKEND_STORAGE_PATH).join(web_url.strip_prefix(&format!("{}/", STORAGE_PATH))?.replace('/', "\\")))
    
}

pub fn file_path_to_web_path(router_url : PathBuf) -> Result<String, Box<dyn Error>>{
    Ok(format!("{}/{}", STORAGE_PATH, String::from(router_url.strip_prefix(BACKEND_STORAGE_PATH)?.to_str_safe()?)).replace('\\', "/"))
    
}