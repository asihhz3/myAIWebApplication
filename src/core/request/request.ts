import { AssistantTextMessage, AssistantStreamMessage, type IDialogue, type IMessage, type IAsyncMessage } from "../dialog/dialog_type";
import { AImageModel, GeminiModel, type IModel } from "../model/model_type";


// export async function sendRequest(
//    model : IModel,
//    api_key : string,
//    current_dialog : IDialogue,
//    config : any
// ) : Promise<IMessage | IAsyncMessage | null>{

//    if (model instanceof GeminiModel) {
//       return model.sendRequest(api_key, current_dialog)
//    }
//    else if (model instanceof AImageModel) {
//       return model.sendRequest(api_key, current_dialog)
//    }

//    let header = new Headers();
//    header.append("Authorization", api_key);
//    header.append("Content-Type", "application/json");
//    let body = JSON.stringify({
//       model : model.id,
//       ...config,
//       messages : current_dialog.quene.flatMap(msg => msg.serialize())
//    })
//    let requestOptions : RequestInit = {
//       method: 'POST',
//       headers: header,
//       body: body,
//       redirect: 'follow'
//    };
//    return fetch("", requestOptions)
//    .then(response => 
//       {
//          if (response.body) {
//             if (config.stream)
//                return new AssistantStreamMessage(response.body)
//             else 
//                return new AssistantTextMessage(response.body)
//          }
//          else
//             return null
//       }
//    ).then(
//       msg => {
//          if (msg) {
//             if(msg.finish_reason == "error") {
//                return Promise.reject("")
//             }
//          }
//          return msg;
//       }
//    ).catch(error => {
//          console.error('error', error)
//          return null;
//       }
//    );
// }
