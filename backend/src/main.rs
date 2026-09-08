use std::{env, error::Error, str::FromStr, sync::Arc};

use axum::{Router, routing::post};
use sqlx::{SqlitePool};
use tower_http::services::ServeDir;

use crate::data::{gstate::GState, user::UserData};

mod config;
mod data;

mod util;
mod tool;
mod localresponse;

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
        tool::log::log_write_message(Box::new(String::from("ctrl + c : exit")));
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}


#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>>{
    // initialize tracing
    dotenv::from_path("backend/.env").ok();
    env::set_current_dir("backend").unwrap();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let options =
     sqlx::sqlite::SqliteConnectOptions::from_str(&database_url)
     .expect("DataUrl Unresove");

    // 创建连接池
    let pool = SqlitePool::connect_with(options)
        .await
        .expect("Failed to create pool");

    data::database::database_init(&pool).await.expect("falied to create table");

    let (sd, rv) = tokio::sync::mpsc::channel(20);

    let gstate = Arc::new(GState::new(pool, sd).await);

    let insert_re = gstate.create_new_user(&UserData { id : String::from("eeea"), name : String::from("asi") }).await
    .expect("create user failed");

    let app = Router::new()
    .route(tool::router::SAVE_DIALOG_PATH, post(data::dialog::store_history_handler))
    .route(tool::router::QUERY_PATH, post(data::dialog::get_history_handler))
    .nest_service(tool::router::STORAGE_PATH, ServeDir::new(data::file::BACKEND_STORAGE_PATH))
    .with_state(gstate);


    let listener = tokio::net::TcpListener::bind(String::from("127.0.0.1:") + &config::SERVER_PORT.to_string())
        .await
        .unwrap();

    tokio::spawn(
       data::file::file_deamon_server(rv)
    );

    axum::serve(listener, app)
    .with_graceful_shutdown(shutdown_signal()).await?;

    Ok(())

}