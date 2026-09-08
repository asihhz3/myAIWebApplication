use sqlx::{Pool, Row, Sqlite, sqlite::SqliteRow};

use crate::data::user::UserData;



pub async fn get_user_by_id(pool : &Pool<Sqlite>, id : &str) -> Result<Option<UserData>, sqlx::Error>{
    let mut conn = pool.acquire().await?;
    let row_option = sqlx::query("
        SELECT * FROM USERS WHERE id == $1
    ").bind(id).fetch_optional(&mut *conn).await?;
    if let Some(row) = row_option {
        let id = row.try_get::<String, _>("id")?;
        let name = row.try_get::<String, _>("name")?;
        Ok(Some(UserData { id, name }))
    }
    else {
        Ok(None)
    }
}

pub async fn insert_user(
    pool : &Pool<Sqlite>, 
    userdata : &UserData
) -> Result<bool, sqlx::Error>{
    let mut tx = pool.begin().await?;
    let result = sqlx::query("
        INSERT OR IGNORE INTO USERS (
            id, name
        )
        VALUES (
            $1, $2
        )
    ").bind(userdata.id.clone())
    .bind(userdata.name.clone())
    .execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(result.rows_affected() > 0)
}