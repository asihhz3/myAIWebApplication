import { AssistantTextMessage, AssistantStreamMessage, type IDialogue, type IMessage, type IStreamMessage } from "../dialog/dialog_type";


export async function sendRequest(
   model : string,
   api_key : string,
   current_dialog : IDialogue,
   stream : boolean
) : Promise<IMessage | IStreamMessage | null>{
   let header = new Headers();
   header.append("Authorization", api_key);
   header.append("Content-Type", "application/json");
   let body = JSON.stringify({
      model,
      stream,
      messages : current_dialog.quene
   })
   let requestOptions : RequestInit = {
      method: 'POST',
      headers: header,
      body: body,
      redirect: 'follow'
   };
   return fetch("https://api.cometapi.com/v1/chat/completions", requestOptions)
   .then(response => 
      {
         if (response.body) {
            if (stream)
               return new AssistantStreamMessage(response.body)
            else 
               return new AssistantTextMessage(response.body)
         }
         else
            return null
      }
   ).then(
      msg => {
         if (msg) {
            if(msg.finish_reason == "error") {
               return Promise.reject("")
            }
         }
         return msg;
      }
   ).catch(error => {
         console.error('error', error)
         return null;
      }
   );
}
