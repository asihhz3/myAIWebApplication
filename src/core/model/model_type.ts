import { reactive, ref, toRef, unref, type Ref } from "vue";
import { type IDialogue, type IMessage, type IMessageBody, type IAsyncMessage, type IBase64IMGMessage, type ITextMessage, type IUrlIMGMessage, AssistantStreamMessage, AssistantTextMessage, type IVideoMesasage } from "../dialog/dialog_type";
import type { IImage } from "../util/assets_type";
import { IdGenerator2, ResponseAnalyzer} from "../util/tool";

export enum ModelSourceType {
    cometapi = "cometapi"
}

export enum ModelType {
    llm,
    txt2img,
    img2img,
    mix,
    video,
    gemini_image,
    seedream_image,
}

export interface IModelSource {
    type : ModelSourceType
    base_url : string
}

export interface IModel {
    source : IModelSource[]
    name : string,
    type : ModelType,
    id : string,
    sendRequest : (api_key: string, current_dialog: IDialogue, source:IModelSource, config?: object) => Promise<IMessage | IAsyncMessage | null>
}

export class LLMModel implements IModel {
    source : IModelSource[]
    name : string
    type : ModelType
    id : string
    constructor(actual_name :string, actual_id : string, source : IModelSource[]) {
        this.name = actual_name;
        this.type = ModelType.llm,
        this.id = actual_id
        this.source = source
    }


    async sendRequest(
        api_key : string,
        current_dialog : IDialogue,
        source : IModelSource,
        config? : object
    ) : Promise<IMessage | IAsyncMessage | null>{
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        let body = JSON.stringify({
            model : this.id,
            ...config,
            messages : current_dialog.quene.flatMap(msg => msg.serialize())
        })
        let requestOptions : RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        return fetch(source.base_url, requestOptions)
        .then(response => 
            {
                if (response.body) {
                    if (config && "stream" in config && typeof config.stream == "boolean" && config.stream)
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

export class XAiAssistantMessage implements IVideoMesasage {
    id : string
    video_url : Ref<string>
    constructor(url : Ref<string>) {
        this.id = IdGenerator2()
        this.video_url = url
    }
    get role() : "system" | "user" | "assistant" | "_invaild" {
        return "assistant"
    }
    set role(role : "system" | "user" | "assistant" | "_invaild") {
    }
    
    serialize(): IMessageBody {
        return reactive(
            {
                role : "assistant",
                content : "",
                video : this.video_url
            }
        )
    }

}

export class XAiVideoModel implements IModel {
    source : IModelSource[]
    name : string
    type : ModelType
    id : string
    constructor(actual_name :string, actual_id : string, source : IModelSource[]) {
        this.name = actual_name;
        this.type = ModelType.video,
        this.id = actual_id
        this.source = source
    }
    
    // private async get_video(json : any, api_key : string, source : IModelSource,  video_url_ref : Ref<string>) {
    //     const geration_response = json as { request_id : string}
    //     const get_request_headers = new Headers()
    //     get_request_headers.append("Authorization", api_key)
    //     const get_request_option = {
    //         method: 'GET',
    //         headers: get_request_headers,
    //         redirect: 'follow'
    //     }
    //     await fetch(
    //         `${source.base_url}/${geration_response.request_id}`,
    //     )
    // }

    async sendRequest(
        api_key : string,
        current_dialog : IDialogue,
        source : IModelSource,
        config? : object
    ) : Promise<IMessage | IAsyncMessage | null>{
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection',' keep-alive')
        const message_body = current_dialog.quene[current_dialog.quene.length - 1]!.serialize()
        let body = JSON.stringify({
            model : this.id,
            prompt : message_body.content,
            image :  message_body.base64imgs && message_body.base64imgs.length > 0
             ? { url : message_body.base64imgs[0] } : undefined,
            ...config
        })
        let requestOptions : RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        const video_url_ref = ref("")
        fetch(`${source.base_url}/generations`, requestOptions)
        .then(response => 
            {
                return response.json()
            }
        ).then(
            json => {
                const geration_response = json as { request_id : string}
                return geration_response.request_id
            }
        ).then(
            async request_id => {
                const get_request_headers = new Headers()
                get_request_headers.append("Authorization", api_key)
                const get_request_option = {
                    method: 'GET',
                    headers: get_request_headers,
                    redirect: "follow" as RequestRedirect
                }
                const request_func_id = setInterval(
                    async () => {
                        const req = await fetch(
                            `${source.base_url}/${request_id}`,
                            get_request_option
                        )
                        const req_body = await req.json() as {
                            data : {
                                failed_reason : string,
                                status : string,
                                data : {
                                    video : {
                                        url : string,
                                        duration : number
                                    }
                                }
                            }
                        }
                        if (req_body.data.status == "SUCCESS") {
                            video_url_ref.value = req_body.data.data.video.url
                            clearTimeout(request_func_id)
                        }
                        if (req_body.data.status == "FAILURE") {
                            clearTimeout(request_func_id)
                            return Promise.reject(`generation failed : ${req_body.data.failed_reason}`)
                        }
                    },
                    1000
                )
            }
        ).catch(error => {
                console.error('error', error)
                return null;
            }
        )
        return new XAiAssistantMessage(video_url_ref)
    }

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
    id : string
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
        this.id = IdGenerator2()
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
    id : string
    content : string
    current_content: Ref<string, string>
    finish_reason: string | null
    base64imgs: Ref<string[], string[]>
    constructor(
        stream : ReadableStream<Uint8Array<ArrayBuffer>>
    ){
        super("assistant")
        this.id = IdGenerator2()
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
                    console.error(json)
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
    source : IModelSource[]
    name : string
    type : ModelType
    id : string
    constructor(actual_name :string, actual_id : string, source : IModelSource[]) {
        this.name = actual_name;
        this.type = ModelType.gemini_image,
        this.id = actual_id
        this.source = source
        // this.base_url = `https://api.cometapi.com/v1beta/models/${this.id}:generateContent`;
    }

    protected createMsgBody(current_dialog : IDialogue, config?: object) {
        return JSON.stringify({
            contents : current_dialog.quene.flatMap(msg => mBodyToGmBody(msg.serialize())),
            generationConfig : config
        })
    }

    async sendRequest(
        api_key : string,
        current_dialog : IDialogue,
        source : IModelSource,
        config?: object
    ) : Promise<IMessage | IAsyncMessage | null>{
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection',' keep-alive')
        let body = JSON.stringify({
            contents : current_dialog.quene.flatMap(msg => mBodyToGmBody(msg.serialize())),
            generationConfig : config
        })
        const start_time = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort()
            console.error("out of time");
            }, 
            300000
        )
        let requestOptions : RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow',
            signal: controller.signal,
            keepalive: true
        }
        return fetch(source.base_url, requestOptions)
        .then(response => 
            {
                if (response.body) {
                    return new GeminiModelMessage(response.body)
                }
                else {
                    return Promise.reject("invalid response body")
                }
            }
        ).catch(error => {
                console.error('error', error)
                return null;
            }
        ).finally(
            () => {
                console.log("time used: " + (Date.now() - start_time))
                clearTimeout(timeoutId)
            }
        );
    }

}

// export class GeminiProModel extends GeminiModel{
//     protected createMsgBody(current_dialog : IDialogue, config?: object) {
//         return JSON.stringify({
//             model : this.id,
//             contents : current_dialog.quene.flatMap(msg => mBodyToGmBody(msg.serialize())),
//             config : config
//         })
//     }
// }

export interface IAImageMessageBody {
    model : string,
    prompt : string,
    size : string,
    watermark: boolean,
    // sequential_image_generation: string,
    // sequential_image_generation_options: {
    //     max_images: number,
    // }, 
}

function mBodyToImgBody(msg : IMessageBody, model : AImageModel, config? :object) : IAImageMessageBody | null {
    if (msg.content.length == 0) {
        console.error("message shoudle be text form")
        return null
    }
    let target_body : IAImageMessageBody = {
        model : model.id,
        prompt : msg.content,
        size : '1k',
        watermark: false,
        // sequential_image_generation: "auto",
        // sequential_image_generation_options: {
        //     max_images: 4,
        // }, 
    }

    // Type guard for extended properties
    // interface ExtendedMessageBody extends IMessageBody {
    //     sequential_image_generation_options?: {
    //         max_images: number;
    //     };
    // }
    // const extend_msg = msg as ExtendedMessageBody

    if ("size" in msg && typeof msg.size == "string") {
        target_body.size = msg.size
    }
    if ("watermark" in msg && typeof msg.watermark == "boolean") {
        target_body.watermark = msg.watermark
    }
    // if ("sequential_image_generation" in msg && typeof msg.sequential_image_generation == "string") {
    //     target_body.sequential_image_generation = msg.sequential_image_generation
    // }
    // if (extend_msg.sequential_image_generation_options){
    //     target_body.sequential_image_generation_options = extend_msg.sequential_image_generation_options
    // }
    if (config) {
        for (const key in config) {
            (target_body as any)[key] = (config as any)[key];
        }
    }
    return target_body
}

// export class UserAImageMessage implements IMessage{
//     role: "system" | "user" | "assistant" | "_invaild"
//     content : string
//     base64imgs : string[] | undefined
//     size? : string
//     watermark?: boolean
//     sequential_image_generation?: string
//     sequential_image_generation_options? : {
//         max_images: number,
//     }
//     constructor (
//         content : string,
//         base64imgs : string[] | undefined
//     ) {
//         this.role = "user"
//         this.content = content
//         this.base64imgs = base64imgs
//     }
//     serialize(): IMessageBody {
//         return {
//             ...this
//         }
//     }

// }

export class AssistantAImageMessage implements IUrlIMGMessage{
    id : string
    role: "system" | "user" | "assistant" | "_invaild";
    content : string
    imgs_url: Ref<string[], string[]>
    base64imgs: Ref<string[], string[]>
    constructor(
        stream : ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        this.id = IdGenerator2()
        this.role = "assistant"
        this.content = ""
        this.imgs_url = ref([])
        this.base64imgs = ref([])
        new ResponseAnalyzer(new TextDecoder('utf-8'), stream.getReader()).read(
            json => {

                interface AResponse{
                    created?: number,
                    data: [ {url : string} ],
                    usage : {
                        generated_images: number
                        output_tokens: number,
                        total_tokens: number
                    }
                }
                const response = json as AResponse
                for (let data of response.data) {
                    if (data.url.startsWith("data")) {
                        this.base64imgs.value.push(data.url)
                    }
                    else {
                        this.imgs_url.value.push(data.url)
                    }
                }
            }
        )
    }
    serialize(): IMessageBody {
        return {
            role : this.role,
            imgs_url : this.imgs_url.value,
            base64imgs : this.base64imgs.value,
            content : ""
        }
    }


}

export class AImageModel implements IModel {
    source : IModelSource[]
    name : string
    type : ModelType
    id : string
    constructor(actual_name :string, actual_id : string, source : IModelSource[], type? : ModelType) {
        this.name = actual_name;
        this.type = type ?? ModelType.mix,
        this.id = actual_id
        this.source = source
    }

    sendRequest(
        api_key : string,
        current_dialog : IDialogue,
        source : IModelSource,
        config? :object
    ) : Promise<IMessage | IAsyncMessage | null>{
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection',' keep-alive')
        let msg = current_dialog.quene[current_dialog.quene.length - 1]
        if (!current_dialog.quene || !msg) {
            return Promise.reject("lack of prompt message")
        }
        let msg_body = mBodyToImgBody(msg.serialize(), this, config)
        if (!msg_body) {
            return Promise.reject("failed to analyzed message")
        }
        let body = JSON.stringify(msg_body)
        let requestOptions : RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            // redirect: 'follow'
        }
        return fetch(source.base_url, requestOptions)
        .then(response => 
            {
                if (response.body) {
                    return new AssistantAImageMessage(response.body)
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