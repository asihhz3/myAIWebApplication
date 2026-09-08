
pub mod dtype;

use std::sync::Arc;

use axum::{Json, body::Bytes, extract::{Multipart, State}, http::StatusCode, response::{IntoResponse, Response}};

use crate::{data::{dialog::dtype::{HistoryStoreRequest, RequestMessage, StoreMessage}, gstate::GState, user::UserData}, localresponse::{response_error_wrapper, response_error_wrapper2, response_ok_wrapper}, tool, util::{self, error::{ClientError, ServerError}, utype::Either}};

async fn resolve_dialog_resolve_form(part : &mut Multipart) -> Result<HistoryStoreRequest, Box<dyn util::error::Error>>{
    let mut content : Option<String> = None;
    let mut user_id : Option<String> = None;
    let mut user_name : Option<String> = None;
    let mut dialog_id : Option<String> = None;
    let mut msg_id : Option<String> = None;
    let mut role : Option<String> = None;
    let mut img_blob_vec = Vec::<Bytes>::new();
    while let Some(field) = part.next_field().await? {
        if let Some(name) = field.name() {
            match name {
                "content" => {
                    content = Some(field.text().await?)
                },
                "img" => {
                    img_blob_vec.push(field.bytes().await?);
                },
                "user_id" => {
                    user_id = Some(field.text().await?);
                },
                "user_name" => {
                    user_name = Some(field.text().await?);
                },
                "msg_id" => {
                    msg_id = Some(field.text().await?);
                }
                "role" => {
                    role = Some(field.text().await?);
                }
                "dialog_id" => {
                    dialog_id = Some(field.text().await?);
                }
                _ => {}
            };
        }
    };

    match (dialog_id, role, msg_id, user_id, user_name) {
        (Some(dialog_id), Some(role), Some(msg_id), Some(user_id), Some(user_name)) => {
            let msg = StoreMessage {
                msg_id,
                role,
                dialog_id,
                content,
                image_blob : if img_blob_vec.len() > 0 { Some(img_blob_vec) } else { None }
            };
            let user = UserData {
                id : user_id,
                name : user_name
            };
            Ok(HistoryStoreRequest { user, msg })
        },
        (None, _, _, _, _) => {
            Err(Box::new(util::error::ClientError::InvaildInputData(String::from("no dialog id"))))
        },
        (Some(_), None, _, _, _) => {
            Err(Box::new(util::error::ClientError::InvaildInputData(String::from("no role"))))
        }
        (Some(_), Some(_), None, _, _) => {
            Err(Box::new(util::error::ClientError::InvaildInputData(String::from("no msg id"))))
        }
        (Some(_), Some(_), Some(_), None, _) => {
            Err(Box::new(util::error::ClientError::InvaildInputData(String::from("no user id"))))
        }
        _ => {
            Err(Box::new(util::error::ClientError::InvaildInputData(String::from("no user name"))))
        }
    }

}

async fn store_history(
    gstate : Arc<GState>,
    request : HistoryStoreRequest
) -> impl IntoResponse {
    let (user, msg) = (request.user, request.msg);
    match gstate.get_user_by_id(&user.id).await { 
        Ok(data_option) => {
            match data_option {
                Some(_data) => {
                    match gstate.insert_new_dialog_msg(&user, msg).await {
                        Ok(_) => response_ok_wrapper(StatusCode::CREATED),
                        Err(err) => response_error_wrapper2(err)
                    }
                },
                None => {
                    if let Err(err) = gstate.create_new_user(&user).await {
                        let rc = Arc::<ServerError>::new(err.into());
                        let re = 
                        response_error_wrapper2(rc.clone());
                        tool::log::log_write_error2(rc);
                        re
                    }
                    else {
                        response_ok_wrapper(StatusCode::CREATED)
                    }
                }
            }
        }
        Err(err) => {
            let rc = Arc::<ServerError>::new(err.into());
            let re = response_error_wrapper2(rc.clone());
            tool::log::log_write_error2(rc);
            re
        }
    }
}

pub async fn store_history_handler(
    State(gstate) : State<Arc<GState>>,
    mut multi : Multipart
) -> Response {
    let request = resolve_dialog_resolve_form(&mut multi).await;
    match request {
        Ok(request) => {
            store_history(gstate, request).await.into_response()
        }
        Err(err)  => {
            if let Either::Left(cerr) = err.kind() {
                response_error_wrapper(StatusCode::BAD_REQUEST, &cerr.to_string()).into_response()
            }
            else {
                response_error_wrapper(StatusCode::INTERNAL_SERVER_ERROR, &err.to_string()).into_response()
            }
        }
    }
}


pub async fn get_history_handler(
    State(gstate) : State<Arc<GState>>,
    Json(request) : Json<RequestMessage>
) -> Response {
    let data =gstate.get_user_by_id(&request.user_id).await
    .map_err( |err| { 
        response_error_wrapper(StatusCode::INTERNAL_SERVER_ERROR, &err.to_string())
    })
    .and_then(
        |opt| {
            match opt {
                Some(data) => Ok(data),
                None => Err(response_error_wrapper(StatusCode::NOT_FOUND, "user not found"))
            }
        }
    );
    match data {
        Ok(data) => {
            match (&request.msg_id, &request.dialog_id ) {
                (Some(msg_id), Some(dialog_id)) => {
                    match gstate.get_dialog_msg(&data, dialog_id, msg_id).await {
                        Ok(response) => (StatusCode::ACCEPTED, Json(response)).into_response(),
                        Err(err) => response_error_wrapper2(err).into_response()
                    }
                }
                (_, Some(dialog_id)) => {
                    match gstate.get_dialog_all(&data, dialog_id).await {
                        Ok(response) => (StatusCode::ACCEPTED, Json(response)).into_response(),
                        Err(err) => response_error_wrapper2(err).into_response()
                    }
                },
                _ => {
                    match gstate.get_dialog_list(&data).await {
                        Ok(list) => (StatusCode::ACCEPTED, Json(list)).into_response(),
                        Err(err) => response_error_wrapper2(err).into_response()
                    }
                }
            }
        },
        Err(err) => {
            err.into_response()
        }
    }

}