import type { IDialogue, IMessage, IStreamMessage } from "../dialog/dialog_type";


export enum ModelType {
    llm,
    txt2img,
    img2img,
    mix,
    gemini_3_pro_image
}

export interface IModel {
    name : string,
    type : ModelType,
    id : string
}

export class GeminiModel implements IModel {
    name : string
    type : ModelType
    id : string
    constructor(actual_name :string, actual_id : string) {
        this.name = actual_name;
        this.type = ModelType.gemini_3_pro_image,
        this.id = actual_id
    }

    sendRequest(
        api_key : string,
        current_dialog : IDialogue,
    ) : Promise<IMessage | IStreamMessage | null>{
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('User-Agent','Apidog/1.0.0 (https://apidog.com)');
        header.append('Accept:', ' */*')
        header.append('Host:',' api.cometapi.com')
        header.append('Connection:',' keep-alive')
        let body = JSON.stringify({
            messages : current_dialog.quene
        })
        let requestOptions : RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        return fetch("https://api.cometapi.com/v1beta/models/gemini-3-pro-image:generateContent", requestOptions)
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

}