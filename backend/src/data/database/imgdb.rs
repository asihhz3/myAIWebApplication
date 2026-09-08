use sqlx::{Sqlite, Transaction};

use crate::data::database::dbtype::ImageSelectRow;




async fn transaction_insert_image(
    tx : &mut Transaction<'_, Sqlite>,
    msg_id : &String,
    image_id : &String,
    image_url : &String
) -> Result<bool, sqlx::Error>{
    let result = sqlx::query("
        INSERT OR IGNORE INTO IMAGES (
            image_id, msg_id , image_url
        )
        VALUES (
            $1, $2, $3
        )
    ").bind(image_id)
    .bind(msg_id).
    bind(image_url)
    .execute(&mut **tx).await?;
    Ok(result.rows_affected() > 0)
}

pub async fn transaction_insert_images(
    tx : &mut Transaction<'_, Sqlite>,
    msg_id : &String,
    image_urls : &Vec<String>
) -> Result<bool, sqlx::Error>{
    // let mut builder = QueryBuilder::<Sqlite>::new("SELECT image_url FROM IMAGES WHERE image_url IN (");
    // // 逐个绑定参数，自动添加占位符
    // let mut separated = builder.separated(", ");
    // for url in &image.image_urls {
    //     separated.push_bind(url); // 自动生成 ? 并绑定
    // }
    // separated.push_bind_unseparated(")");
    // let existed = builder.build_query_scalar::<String>().fetch_all(&mut **tx).await?;

    let mut re = true;

    for url in image_urls {
        re = re && transaction_insert_image(tx, msg_id, &uuid::Uuid::now_v7().to_string(), url).await?
    }
    Ok(re)
}

pub async fn transaction_get_images(
    tx : &mut Transaction<'_, Sqlite>,
    msg_id : &String,
) -> Result<Vec<String>, sqlx::Error>{
    // let mut builder = QueryBuilder::<Sqlite>::new("SELECT image_url FROM IMAGES WHERE image_url IN (");
    // // 逐个绑定参数，自动添加占位符
    // let mut separated = builder.separated(", ");
    // for url in &image.image_urls {
    //     separated.push_bind(url); // 自动生成 ? 并绑定
    // }
    // separated.push_bind_unseparated(")");
    // let existed = builder.build_query_scalar::<String>().fetch_all(&mut **tx).await?;

    let re =sqlx::query_as::<Sqlite, ImageSelectRow>("
        SELECT * FROM IMAGES WHERE msg_id = $1
    ").bind(msg_id)
    .fetch_all(&mut **tx)
    .await?
    .into_iter()
    .map(
        |row| {
            row.image_url
        }
    ).collect();
    Ok(re)

}