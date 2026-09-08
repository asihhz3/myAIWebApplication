
use sqlx::{Pool,  Sqlite, Transaction};

use crate::{data::{database::{dbtype::{DialigSelectRow, DialogMsgRecord}, imgdb::{transaction_get_images, transaction_insert_images}}, dialog::dtype::{ResponseDialog, ResponseMessage}}, tool, util};


async fn transaction_insert_dialog_msg(
    tx : &mut Transaction<'_, Sqlite>,
    data : &DialogMsgRecord
) -> Result<bool, sqlx::Error>{

    let result = sqlx::query("
        INSERT OR IGNORE INTO DIALOGS (
            msg_id, role, dialog_id, user_id, created_time, content
        )
        VALUES (
            $1, $2, $3, $4, $5, $6
        )
    ").bind(&data.msg_id)
    .bind(&data.role)
    .bind(&data.dialog_id)
    .bind(data.user_id.clone())
    .bind(data.created_time.clone())
    .bind(data.content.clone())
    .execute(&mut **tx).await?;


    let mut result = result.rows_affected() > 0;

    if !result {
        return Ok(result);
    }

    if let Some(imgs) = &data.image_urls {
        result = result && transaction_insert_images(tx, &data.msg_id, imgs).await?;
    }

    Ok(result)
}

async fn transaction_get_dialog_msg(
    tx : &mut Transaction<'_, Sqlite>, 
    user_id : &String,
    msg_id : &String,
) -> Result<ResponseMessage, sqlx::Error>{
    let row = sqlx::query_as::<Sqlite, DialigSelectRow>("
        SELECT * FROM DIALOGS WHERE user_id = $1 AND msg_id = $2
    ").bind(user_id)
    .bind(msg_id)
    .fetch_one(&mut **tx).await?;
    let imgs = transaction_get_images(tx, &row.msg_id).await?;
    Ok(ResponseMessage { 
        msg_id : msg_id.clone(),
        role : row.role,
        content: row.content, 
        image_urls: if imgs.len() > 0 {Some(imgs)} else {None}
    })
}
async fn transaction_get_dialog_list(tx : &mut Transaction<'_, Sqlite>, user_id : &String) -> Result<Vec<String>, sqlx::Error>{
    sqlx::query_scalar::<Sqlite, String>("
        SELECT dialog_id FROM DIALOGS WHERE user_id = $1
    ")
    .bind(user_id)
    .fetch_all(&mut **tx).await
}

async fn transaction_get_dialog_all(
    tx : &mut Transaction<'_, Sqlite>, 
    user_id : &String,
    dialog_id : &String,
) -> Result<ResponseDialog, sqlx::Error>{
    let rows = sqlx::query_as::<Sqlite, DialigSelectRow>("
        SELECT * FROM DIALOGS WHERE dialog_id = $1 AND user_id = $2 ORDER BY order_number ASC
    ").bind(dialog_id)
    .bind(user_id)
    .fetch_all(&mut **tx).await?;

    let mut re : Vec<ResponseMessage> = Vec::new();
    for row in rows {
        let imgs = transaction_get_images(tx, &row.msg_id).await?;
        re.push(
            ResponseMessage {
                msg_id : row.msg_id,
                role : row.role,
                content: row.content, 
                image_urls: if imgs.len() > 0 { Some(imgs) } else { None }}
        );
    }
    Ok(ResponseDialog::from_vec(re))
}


pub async fn get_dialog_list(
    pool : &Pool<Sqlite>, 
    user_id : &String
) -> Result<Vec<String>, sqlx::Error>{
    let mut tx = pool.begin().await?;
    match transaction_get_dialog_list(&mut tx, user_id).await {
        Ok(list) => {
            tx.commit().await?;
            Ok(list)
        },
        Err(err) => {
            tx.rollback().await?;
            Err(err)
        }
    }
}


pub async fn get_dialog_all(
    pool : &Pool<Sqlite>, 
    user_id : &String,
    dialog_id : &String,
) -> Result<ResponseDialog, sqlx::Error>{
    let mut tx = pool.begin().await?;
    match transaction_get_dialog_all(&mut tx, user_id, dialog_id).await {
        Ok(dialog) => {
            tx.commit().await?;
            Ok(dialog)
        },
        Err(err) => {
            tx.rollback().await?;
            Err(err)
        }
    }
}

pub async fn get_dialog_msg(
    pool : &Pool<Sqlite>, 
    user_id : &String,
    msg_id : &String
) -> Result<ResponseMessage, sqlx::Error>{
    let mut tx = pool.begin().await?;
    match transaction_get_dialog_msg(&mut tx, user_id, msg_id).await {
        Ok(dialog) => {
            tx.commit().await?;
            Ok(dialog)
        },
        Err(err) => {
            tx.rollback().await?;
            Err(err)
        }
    }
}

pub async fn insert_dialog_msg(
    pool : &Pool<Sqlite>, 
    data : &DialogMsgRecord,
) -> Result<bool, sqlx::Error>{
    let mut tx = pool.begin().await?;
    let re = transaction_insert_dialog_msg(&mut tx, data).await;
    match re  {
        Ok(t) => {
            if t {
                tx.commit().await?;
                Ok(true)
            }
            else {
                tx.rollback().await?;
                Ok(false)
            }
        }
        Err(err) => {
            tx.rollback().await?;
            Err(err)
        }
    }
}


pub async fn insert_dialog_msg_list(
    pool : &Pool<Sqlite>, 
    data : &Vec<DialogMsgRecord>,
) -> Result<bool, sqlx::Error>{


    let mut tx = pool.begin().await?;
    for record in data {
        let re = transaction_insert_dialog_msg(&mut tx, record).await;
        match re  {
            Ok(t) => {
                if !t {
                    tx.rollback().await?;
                    return Ok(false);
                }
            }
            Err(err) => {
                tx.rollback().await?;
                return Err(err);
            }
        };
    }
    tx.commit().await?;
    Ok(true)
}
