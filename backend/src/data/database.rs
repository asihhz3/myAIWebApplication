
pub mod dbtype;

pub mod userdb;

pub mod dialogdb;

pub mod imgdb;



use sqlx::{Pool};


pub async fn database_init(pool : &Pool<sqlx::Sqlite>) -> Result<(), sqlx::Error> {
    sqlx::query("
        CREATE TABLE IF NOT EXISTS USERS (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL
        )
    ").execute(pool)
    .await?;

    sqlx::query("
        CREATE TABLE IF NOT EXISTS DIALOGS (
            msg_id TEXT PRIMARY KEY NOT NULL,
            role TEXT NOT NULL,
            dialog_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_time TEXT NOT NULL,
            content TEXT
        )
    
    ").execute(pool)
    .await?;

    sqlx::query("
        CREATE TABLE IF NOT EXISTS IMAGES (
            image_id TEXT PRIMARY KEY NOT NULL,
            msg_id TEXT NOT NULL,
            image_url TEXT NOT NULL
        )
    
    ").execute(pool)
    .await?;
    Ok(())
}