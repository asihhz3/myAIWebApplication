import { ref, unref, type Ref } from "vue";
import type { IDialogue, IMessage, IMessageBody, IAsyncMessage, IBase64IMGMessage, ITextMessage } from "../dialog/dialog_type";
import type { IImage } from "../util/assets_type";
import { ResponseAnalyzer} from "../util/tool";


export enum ModelType {
    llm,
    txt2img,
    img2img,
    mix,
    gemini_image
}

export interface IModel {
    name : string,
    type : ModelType,
    id : string
}

interface IGeminiMessageParts {
    text : undefined | string
    inlineData : undefined | IImage
}

interface IGeminiMessageBody {
    role: "user" | "model" | "_invaild",
    parts : IGeminiMessageParts[]
}

function gRoleToRole(role : "user" | "model" | "_invaild") :  "system" | "user" | "assistant" | "_invaild"{
    switch (role) {
        case "model": return "assistant"
        default : return role
    }
}

function roleToGRole(role : "system" | "user" | "assistant" | "_invaild") : "user" | "model" | "_invaild"{
    switch (role) {
        case "assistant": return "model"
        case "system": return "user"
        default : return role
    }
}

function mBodyToGmBody(msg_body : IMessageBody) : IGeminiMessageBody {
    let target_body  : IGeminiMessageBody= {
        role : roleToGRole(msg_body.role),
        parts : []
    }
    if (msg_body.content.length > 0) {
        target_body.parts.push(
            {
                text : msg_body.content,
                inlineData : undefined
            }
        )
    }
    if (msg_body.base64imgs) {
        msg_body.base64imgs.forEach(
            base64img => {
                target_body.parts.push(
                    {
                        inlineData : {
                            mimeType : base64img.slice(base64img.indexOf(':') + 1, base64img.indexOf(';')),
                            data : base64img.slice(base64img.indexOf(',') + 1),
                        },
                        text : undefined
                    }
                )
            }
        )
    }
    return target_body
}

function gmBodyToMBody(msg_body : IGeminiMessageBody) : IMessageBody {
    let target_body  : IMessageBody= {
        role : gRoleToRole(msg_body.role),
        content : "",
        base64imgs : []
    }
    msg_body.parts.forEach(
        part => {
            if (part.text) {
                target_body.content += part.text + '\n'
            }
            if (part.inlineData) {
                if(part.inlineData.mimeType.startsWith("imaeg")) {
                    target_body.base64imgs?.push(
                        `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                    )
                }
            }
        }
    )
    return target_body
}


class GeminiMessage implements IMessage{
    get role() : "system" | "user" | "assistant" | "_invaild"{
        return gRoleToRole(this.actual_role)
    }
    set role(pass_role : "system" | "user" | "assistant" | "_invaild") {
        this.actual_role = roleToGRole(pass_role)
    }
    actual_role: "user" | "model" | "_invaild";


    constructor(
        role : "system" | "user" | "assistant" | "_invaild",
    ){
        this.actual_role = "_invaild"
        this.role = "assistant"
    }

    serialize() : IMessageBody {
        return {
            role : this.role,
            content : "",
            base64imgs : undefined
        }
    }
}

class GeminiResponseAnalyzer extends ResponseAnalyzer {
    protected parseSSEData(line : string) : any | null{
        if (this.is_recieve_large_data) {
            this.buffer.push(line)
            if (line.endsWith("}")) {
                let json : any = {}
                try {
                    json = JSON.parse(this.buffer.join(''));
                } catch {
                    console.warn('出现不完整数据', this.buffer[-1]?.slice(-100, -1));
                    return null;
                }
                this.is_recieve_large_data = false
                this.buffer = []
                return json
            }
        }
        else{
            const jsonStr = line
            if (jsonStr.endsWith("}")) {
                try {
                    return JSON.parse(jsonStr);
                } catch (error) {
                    console.warn('JSON解析失败:', jsonStr, error);
                    return null;
                }
            }
            else {
                this.is_recieve_large_data = true
                this.buffer.push(jsonStr)
            }
        }
        return null;
    }
}

class GeminiModelMessage extends GeminiMessage implements IAsyncMessage, ITextMessage, IBase64IMGMessage{
    content : string
    current_content: Ref<string, string>
    finish_reason: string | null
    base64imgs: Ref<string[], string[]>
    constructor(
        stream : ReadableStream<Uint8Array<ArrayBuffer>>
    ){
        super("assistant")
        this.content = ""
        this.current_content = ref(this.content)
        this.finish_reason = null
        this.base64imgs = ref([])
        this.read(stream)
    }

    async read(stream : ReadableStream<Uint8Array<ArrayBuffer>>) {
        new GeminiResponseAnalyzer(new TextDecoder('utf-8'), stream.getReader()).read(
            json => {
                if("candidates" in json) {
                    json.candidates.forEach(
                        (candidate : any) => {
                            if ("content" in candidate) {
                                let content = candidate.content as IGeminiMessageBody
                                content.parts.forEach(
                                    part => {
                                        if (part.text) {
                                            this.current_content.value += part.text
                                            this.content = unref(this.current_content)
                                        }
                                        if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
                                            this.base64imgs.value.push(
                                                `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                                            )
                                        }
                                    }
                                )
                            }
                            if ("finishReason" in candidate) {
                                this.finish_reason = candidate.finishReason
                            }
                        }
                    )
                }
                else {
                    console.error("invaild json data:")
                    console.log(json)
                }
            }
        )
    }
    serialize(): IMessageBody {
        return {
            role : this.role,
            content : this.content,
            base64imgs : unref(this.base64imgs)
        }
    }
}

export class GeminiModel implements IModel {
    name : string
    type : ModelType
    id : string
    constructor(actual_name :string, actual_id : string) {
        this.name = actual_name;
        this.type = ModelType.gemini_image,
        this.id = actual_id
    }

    sendRequest(
        api_key : string,
        current_dialog : IDialogue,
    ) : Promise<IMessage | IAsyncMessage | null>{
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection',' keep-alive')
        let body = JSON.stringify({
            contents : current_dialog.quene.flatMap(msg => mBodyToGmBody(msg.serialize()))
        })
        let requestOptions : RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        }
        return fetch(`https://api.cometapi.com/v1beta/models/${this.id}:generateContent`, requestOptions)
        .then(response => 
            {
                if (response.body) {
                    return new GeminiModelMessage(response.body)
                }
                else {
                    console.log(response)
                    return Promise.reject("invalid response body")
                }
            }
        ).catch(error => {
                console.error('error', error)
                return null;
            }
        );
    }

}