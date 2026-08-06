import { reactive, ref, toRef, unref, type Ref } from "vue";
import { type IDialogue, type IMessage, type IMessageBody, type IAsyncMessage, type IBase64IMGMessage, type ITextMessage, type IUrlIMGMessage, AssistantStreamMessage, AssistantTextMessage, type IVideoMesasage, type IAudioMesasage as IAudioMessage } from "../dialog/dialog_type";
import type { IImage } from "../util/assets_type";
import { GetMimeTypeForBase64, IdGenerator2, ResponseAnalyzer } from "../util/tool";
import { content, writeError, writeLog } from "../util/log";
import uuid from "uuid-js";

export enum ModelSourceType {
    openrouter = "openrouter",
    cometapi = "cometapi",
    miloraapi = "miloraapi",
    aliyun = "aliyun",
    bytedance = "bytedance"
}

export enum ModelType {
    llm,
    txt2img,
    img2img,
    mix,
    video,
    tts,
    gemini_image,
    seedream_image,
    gpt_image2,
    qwen_image,
    happy_horse,
}

export interface IModelSource {
    type: ModelSourceType
    base_url: string
}


export interface IModel {
    source: IModelSource[]
    name: string,
    type: ModelType,
    id: string,
    sendRequest: (api_key: string, current_dialog: IDialogue, source: IModelSource, config?: object) => Promise<IMessage | IAsyncMessage | null>
}

export class LLMModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    constructor(actual_name: string, actual_id: string, source: IModelSource[]) {
        this.name = actual_name;
        this.type = ModelType.llm,
            this.id = actual_id
        this.source = source
    }


    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");

        //test
        const tools = []

        let body = JSON.stringify({
            model: this.id,
            ...config,
            messages: current_dialog.quene.flatMap(msg => msg.serialize())
        })
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        return fetch(source.base_url, requestOptions)
            .then(response => {
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
                        if (msg.finish_reason == "error") {
                            return Promise.reject("")
                        }
                    }
                    return msg;
                }
            ).catch(error => {
                writeError('error :' + error)
                return null;
            }
            );
    }

}

export class AssistantVideoMessage implements IVideoMesasage {
    id: string
    video_url: Ref<string>
    constructor(url: Ref<string>) {
        this.id = IdGenerator2()
        this.video_url = url
    }
    get role(): "system" | "user" | "assistant" | "_invaild" {
        return "assistant"
    }
    set role(role: "system" | "user" | "assistant" | "_invaild") {
    }

    serialize(): IMessageBody {
        return reactive(
            {
                role: "assistant",
                content: "",
                video: this.video_url
            }
        )
    }

}

export class XAiVideoModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    constructor(actual_name: string, actual_id: string, source: IModelSource[]) {
        this.name = actual_name;
        this.type = ModelType.video,
            this.id = actual_id
        this.source = source
    }


    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        const message_body = current_dialog.quene[current_dialog.quene.length - 1]!.serialize()
        let body = JSON.stringify({
            model: this.id,
            prompt: message_body.content,
            image: message_body.base64imgs && message_body.base64imgs.length > 0
                ? { url: message_body.base64imgs[0] } : undefined,
            ...config
        })
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        const video_url_ref = ref("")
        fetch(`${source.base_url}/generations`, requestOptions)
            .then(response => {
                return response.json()
            }
            ).then(
                json => {
                    const geration_response = json as { request_id: string }
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
                            try {
                                const req = await fetch(
                                    `${source.base_url}/${request_id}`,
                                    get_request_option
                                )
                                const req_body = (await req.json()) as {
                                    model?: string,
                                    usage?: {
                                        cost_in_usd_ticks: number
                                    },
                                    video?: {
                                        url: string,
                                        duration: number,
                                        respect_moderation: boolean
                                    },
                                    status?: string,
                                    progress?: number
                                }
                                if (req_body.status == "done") {
                                    video_url_ref.value = req_body.video!.url
                                    clearTimeout(request_func_id)
                                }
                            }
                            catch (err) {
                                clearTimeout(request_func_id)
                                throw err;
                            }
                        },
                        1000
                    )
                }
            ).catch(error => {
                writeError('error :' + error)
                return null;
            }
            )
        return new AssistantVideoMessage(video_url_ref)
    }

}

interface IGeminiMessageParts {
    text: undefined | string
    inlineData: undefined | IImage
}

interface IGeminiMessageBody {
    role: "user" | "model" | "_invaild",
    parts: IGeminiMessageParts[]
}


function gRoleToRole(role: "user" | "model" | "_invaild"): "system" | "user" | "assistant" | "_invaild" {
    switch (role) {
        case "model": return "assistant"
        default: return role
    }
}

function roleToGRole(role: "system" | "user" | "assistant" | "_invaild"): "user" | "model" | "_invaild" {
    switch (role) {
        case "assistant": return "model"
        case "system": return "user"
        default: return role
    }
}

function mBodyToGmBody(msg_body: IMessageBody): IGeminiMessageBody {
    let target_body: IGeminiMessageBody = {
        role: roleToGRole(msg_body.role),
        parts: []
    }
    if (msg_body.content.length > 0) {
        target_body.parts.push(
            {
                text: msg_body.content,
                inlineData: undefined
            }
        )
    }
    if (msg_body.base64imgs) {
        msg_body.base64imgs.forEach(
            base64img => {
                target_body.parts.push(
                    {
                        inlineData: {
                            mimeType: base64img.slice(base64img.indexOf(':') + 1, base64img.indexOf(';')),
                            data: base64img.slice(base64img.indexOf(',') + 1),
                        },
                        text: undefined
                    }
                )
            }
        )
    }
    return target_body
}

function gmBodyToMBody(msg_body: IGeminiMessageBody): IMessageBody {
    let target_body: IMessageBody = {
        role: gRoleToRole(msg_body.role),
        content: "",
        base64imgs: []
    }
    msg_body.parts.forEach(
        part => {
            if (part.text) {
                target_body.content += part.text + '\n'
            }
            if (part.inlineData) {
                if (part.inlineData.mimeType.startsWith("imaeg")) {
                    target_body.base64imgs?.push(
                        `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                    )
                }
            }
        }
    )
    return target_body
}


class GeminiMessage implements IMessage {
    id: string
    get role(): "system" | "user" | "assistant" | "_invaild" {
        return gRoleToRole(this.actual_role)
    }
    set role(pass_role: "system" | "user" | "assistant" | "_invaild") {
        this.actual_role = roleToGRole(pass_role)
    }
    actual_role: "user" | "model" | "_invaild";


    constructor(
        role: "system" | "user" | "assistant" | "_invaild",
    ) {
        this.id = IdGenerator2()
        this.actual_role = "_invaild"
        this.role = "assistant"
    }

    serialize(): IMessageBody {
        return {
            role: this.role,
            content: "",
            base64imgs: undefined
        }
    }
}

class GeminiResponseAnalyzer extends ResponseAnalyzer {
    protected parseSSEData(line: string): any | null {
        if (this.is_recieve_large_data) {
            this.buffer.push(line)
            if (line.endsWith("}")) {
                let json: any = {}
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
        else {
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

class GeminiModelMessage extends GeminiMessage implements IAsyncMessage, ITextMessage, IBase64IMGMessage {
    id: string
    content: string
    current_content: Ref<string, string>
    finish_reason: string | null
    base64imgs: Ref<string[], string[]>
    constructor(
        stream: ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        super("assistant")
        this.id = IdGenerator2()
        this.content = ""
        this.current_content = ref(this.content)
        this.finish_reason = null
        this.base64imgs = ref([])
        this.read(stream)
    }

    async read(stream: ReadableStream<Uint8Array<ArrayBuffer>>) {
        new GeminiResponseAnalyzer(new TextDecoder('utf-8'), stream.getReader()).read(
            json => {
                if ("candidates" in json) {
                    json.candidates.forEach(
                        (candidate: any) => {
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
                    writeError("invaild json data:")
                    writeError(json.toString())
                }
            }
        )
    }
    serialize(): IMessageBody {
        return {
            role: this.role,
            content: this.content,
            base64imgs: unref(this.base64imgs)
        }
    }
}

export class GeminiModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    constructor(actual_name: string, actual_id: string, source: IModelSource[]) {
        this.name = actual_name;
        this.type = ModelType.gemini_image,
            this.id = actual_id
        this.source = source
        // this.base_url = `https://api.cometapi.com/v1beta/models/${this.id}:generateContent`;
    }

    protected createMsgBody(current_dialog: IDialogue, config?: object) {
        return JSON.stringify({
            contents: current_dialog.quene.flatMap(msg => mBodyToGmBody(msg.serialize())),
            generationConfig: config
        })
    }

    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        let body = JSON.stringify({
            contents: current_dialog.quene.flatMap(msg => mBodyToGmBody(msg.serialize())),
            ...config
        })
        const start_time = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort()
            writeError("out of time");
        },
            300000
        )
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            // redirect: 'follow',
            signal: controller.signal,
            // keepalive: true
        }
        return fetch(source.base_url, requestOptions)
            .then(response => {
                if (response.body) {
                    return new GeminiModelMessage(response.body)
                }
                else {
                    return Promise.reject("invalid response body")
                }
            }
            ).catch(error => {
                writeError('error' + error)
                return null;
            }
            ).finally(
                () => {
                    writeLog("time used: " + (Date.now() - start_time))
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
    model: string,
    prompt: string,
    size?: string,
    watermark?: boolean,
    // sequential_image_generation: string,
    // sequential_image_generation_options: {
    //     max_images: number,
    // }, 
}

function mBodyToImgBody(msg: IMessageBody, model: AImageModel, config?: object): IAImageMessageBody | null {
    if (msg.content.length == 0) {
        writeError("message shoudle be text form")
        return null
    }
    let target_body: IAImageMessageBody = {
        model: model.id,
        prompt: msg.content,
        // watermark: false,
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

async function mBodyToGPTImgEditBody(msg: IMessageBody, model: AImageModel, config?: object): Promise<FormData | null> {
    if (msg.content.length == 0) {
        writeError("message shoudle be text form")
        return null
    }
    const target_body = new FormData()
    target_body.append('model', model.id)
    target_body.append('prompt', msg.content)

    if (msg.base64imgs && msg.base64imgs.length > 0) {
        try {
            const file_name = `${model.id}-${uuid.randomUI04()}.${GetMimeTypeForBase64(msg.base64imgs[0]!)}`
            const blob = await (await fetch(msg.base64imgs[0]!)).blob()
            const file = new File([blob], file_name, { type: blob.type })
            target_body.append('image', file)
        }
        catch (e: any) {
            writeError(e.toString());
            return null
        }
    }
    if ("size" in msg && typeof msg.size == "string") {
        target_body.append('size', msg.size)
    }
    if (config) {
        for (const key in config) {
            target_body.append(key, (config as any)[key])
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

export class AssistantAImageMessage implements IUrlIMGMessage {
    id: string
    role: "system" | "user" | "assistant" | "_invaild";
    content: string
    imgs_url: Ref<string[], string[]>
    base64imgs: Ref<string[], string[]>
    constructor(
        stream: ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        this.id = IdGenerator2()
        this.role = "assistant"
        this.content = ""
        this.imgs_url = ref([])
        this.base64imgs = ref([])
        new ResponseAnalyzer(new TextDecoder('utf-8'), stream.getReader()).read(
            json => {
                interface AResponse {
                    created?: number,
                    data: [{ url: string }],
                    usage: {
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
            role: this.role,
            imgs_url: this.imgs_url.value,
            base64imgs: this.base64imgs.value,
            content: ""
        }
    }


}

export class AImageModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    constructor(actual_name: string, actual_id: string, source: IModelSource[], type?: ModelType) {
        this.name = actual_name;
        this.type = type ?? ModelType.mix,
            this.id = actual_id
        this.source = source
    }

    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        let msg = current_dialog.quene[current_dialog.quene.length - 1]
        if (!current_dialog.quene || !msg) {
            return Promise.reject("lack of prompt message")
        }
        let msg_body = mBodyToImgBody(msg.serialize(), this, config)
        if (!msg_body) {
            return Promise.reject("failed to analyzed message")
        }
        let body = JSON.stringify(msg_body)
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            // redirect: 'follow'
        }
        return fetch(source.base_url, requestOptions)
            .then(response => {
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

class GPTImage2Message implements IBase64IMGMessage {
    id: string;
    role: "system" | "user" | "assistant" | "_invaild";
    base64imgs: Ref<string[]>

    constructor(json: Promise<any>) {
        interface GPTImage2Response {
            created?: number,
            data: [{ b64_json: string }],
            output_format: string
            // usage : {
            //     generated_images: number
            //     output_tokens: number,
            //     total_tokens: number
            // }
        }
        this.id = IdGenerator2()
        this.role = "assistant"
        this.base64imgs = ref([])
        json.then(
            (response: GPTImage2Response) => {
                for (var data of response.data) {
                    this.base64imgs.value.push(`data:image/${response.output_format};base64, `.concat(data.b64_json))
                }
            }
        ).catch(
            err => {
                writeError(`error : ${err}`)
            }
        )
    }
    serialize(): IMessageBody {
        return {
            role: this.role,
            content: "",
            base64imgs: this.base64imgs.value
        }
    }

}

export class GPTImageModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    constructor(actual_name: string, actual_id: string, source: IModelSource[], type?: ModelType) {
        this.name = actual_name;
        this.type = type ?? ModelType.mix,
            this.id = actual_id
        this.source = source
    }

    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let msg = current_dialog.quene[current_dialog.quene.length - 1]
        if (!current_dialog.quene || !msg) {
            return Promise.reject("lack of prompt message")
        }
        const msg_body: IMessageBody = msg.serialize()
        let body: FormData | string | null = null
        const is_edit = msg_body.base64imgs && msg_body.base64imgs.length > 0
        if (is_edit) {
            body = await mBodyToGPTImgEditBody(msg.serialize(), this, config)
        }
        else {
            body = JSON.stringify(mBodyToImgBody(msg_body, this, config))
        }
        if (!body) {
            return Promise.reject("failed to analyzed message")
        }

        const header = new Headers();
        header.append("Authorization", `Bearer ${api_key}`);
        if (!is_edit) {
            header.append("Content-Type", "application/json");
        }
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            // redirect: 'follow'
        }
        return fetch(`${source.base_url}${is_edit ? '/edits' : '/generations'}`, requestOptions)
            .then(async response => {
                if (response.ok) {
                    return new GPTImage2Message(response.json())
                }
                else {
                    console.log(response)
                    var msg = ""
                    try {
                        interface ErrorMsg {
                            error: {
                                message: string
                            }
                        }
                        msg = (await response.json() as ErrorMsg).error.message
                    }
                    catch { }
                    throw `response : ${response.status}\n${msg}`
                }
            }
            ).catch(error => {
                writeError(error.toString())
                return null;
            }
            );
    }
}

export class AudioOutputMessage implements IAudioMessage {
    id: string;
    role: "system" | "user" | "assistant" | "_invaild";
    audio_url: string;

    constructor(url: string) {
        this.id = IdGenerator2()
        this.role = "assistant"
        this.audio_url = url;
    }

    serialize(): IMessageBody {
        return {
            "role": this.role,
            "content": "",
            "audio": this.audio_url
        }
    }

}

export class MiloraTTSModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    constructor() {
        this.name = "Manbo TTs";
        this.type = ModelType.tts,
            this.id = "mbAIscvip"
        this.source = [{
            type: ModelSourceType.miloraapi,
            base_url: "https://api.milorapart.top"
        }]
    }


    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", `Bearer ${api_key}`);
        header.append("Content-Type", "application/json");
        let body = JSON.stringify({
            ...config,
            text: current_dialog.quene[0]!.serialize()!.content
        })
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        return fetch(`${source.base_url}/apis/mbAIscvip`, requestOptions)
            .then(async response => {
                if (response.ok) {
                    var body = await response.json();
                    if ("code" in body && body.code == "200") {
                        return Promise.resolve(new AudioOutputMessage(body.url as string))
                    }
                }
                throw "failed to analize response"
            }
            ).catch(error => {
                writeError('error :' + error)
                return null;
            }
            );

    }

}

export class QwenImageAssiantMessage implements IUrlIMGMessage {
    id: string;
    role: "system" | "user" | "assistant" | "_invaild";
    imgs_url: Ref<string[]>

    constructor(json: Promise<any>) {
        interface QwenImageResponse {
            output: {
                choices:
                {
                    finish_reason: string,
                    message: {
                        content:
                        {
                            image: string
                        }[],
                        role: "system" | "user" | "assistant" | "_invaild"
                    }
                }[]
            }
        }
        this.id = IdGenerator2()
        this.role = "assistant"
        this.imgs_url = ref([])
        json.then(
            (response: QwenImageResponse) => {
                const body = response.output.choices[0]!
                if (body.finish_reason != 'stop') {
                    throw `unexpectde finish reason ${body.finish_reason}`
                }
                for (var data of body.message.content) {
                    this.imgs_url.value.push(data.image)
                }
            }
        ).catch(
            err => {
                writeError(`error : ${err}`)
            }
        )
    }
    serialize(): IMessageBody {
        return {
            role: this.role,
            content: "",
            imgs_url: this.imgs_url.value
        }
    }

}

interface IQwenMessageBody {
    role: "user" | "assistant",
    content: ({ text: string } | { image: string })[]
}

export class QwenImageModel implements IModel {
    source: IModelSource[];
    name: string;
    type: ModelType;
    id: string;

    constructor(name: string, id: string, source: IModelSource[]) {
        this.type = ModelType.qwen_image
        this.source = source
        this.name = name
        this.id = id
    }

    private mbodyToQwenbody(mbody: IMessageBody): IQwenMessageBody {
        let role: "user" | "assistant" = "assistant"
        let content = [
            {
                text: mbody.content,
            },
        ] as ({ text: string } | { image: string })[]

        const image = mbody.base64imgs?.map(b64 => { return { image: b64 } })
        if (image) {
            content = content.concat(image)
        }

        if (mbody.role == "user") {
            role = "user"
        }
        return {
            role: role,
            content: content
        }
    }

    async sendRequest(api_key: string, current_dialog: IDialogue, source: IModelSource, config?: object): Promise<IMessage | IAsyncMessage | null> {
        let msg = current_dialog.quene[current_dialog.quene.length - 1]
        if (!current_dialog.quene || !msg) {
            return Promise.reject("lack of prompt message")
        }
        const msg_body: IMessageBody = msg.serialize()
        const body = {
            model: this.id,
            input: {
                messages: [
                    this.mbodyToQwenbody(msg_body)
                ]
            },
            ...config
        }
        const header = new Headers();
        header.append("Authorization", `Bearer ${api_key}`);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body),
            // redirect: 'follow'
        }
        return fetch(source.base_url, requestOptions)
            .then(async response => {
                if (response.ok) {
                    return new QwenImageAssiantMessage(response.json())
                }
                else {
                    console.log(response)
                    var msg = ""
                    try {
                        interface ErrorMsg {
                            error: {
                                message: string
                            }
                        }
                        msg = (await response.json() as ErrorMsg).error.message
                    }
                    catch { }
                    throw `response : ${response.status}\n${msg}`
                }
            }
            ).catch(error => {
                writeError(error.toString())
                return null;
            }
            );
    }
}

export class SeedDreamImageMessage implements IUrlIMGMessage {
    id: string
    role: "system" | "user" | "assistant" | "_invaild";
    content: string
    imgs_url: Ref<string[], string[]>
    base64imgs: Ref<string[], string[]>
    constructor(
        json_promise : Promise<any>
    ) {
        this.id = IdGenerator2()
        this.role = "assistant"
        this.content = ""
        this.imgs_url = ref([])
        this.base64imgs = ref([])
        interface SeedDreamResponse {
            created?: number,
            data: {
                b64_json? : string,
                url? : string
            }[],
            usage: {
                generated_images: number
                output_tokens: number,
                total_tokens: number
            }
        }
        json_promise.then(
            json => {
                const response = json as SeedDreamResponse
                for (let data of response.data) {
                    if (data.b64_json) {
                        this.imgs_url.value.push(data.b64_json)
                    }
                    if (data.url) {
                        this.imgs_url.value.push(data.url)
                    }
                }
            }
        )
    }
    serialize(): IMessageBody {
        return {
            role: this.role,
            imgs_url: unref(this.imgs_url),
            base64imgs: unref(this.base64imgs),
            content: ""
        }
    }
}

export class SeedDreamImageModel implements IModel {
    source: IModelSource[];
    name: string;
    type: ModelType;
    id: string;

    constructor(name: string, id: string, source: IModelSource[]) {
        this.type = ModelType.seedream_image
        this.source = source
        this.name = name
        this.id = id
    }

    async sendRequest(api_key: string, current_dialog: IDialogue, source: IModelSource, config?: object): Promise<IMessage | IAsyncMessage | null> {
        let msg = current_dialog.quene[current_dialog.quene.length - 1]
        if (!current_dialog.quene || !msg) {
            return Promise.reject("lack of prompt message")
        }
        const msg_body: IMessageBody = msg.serialize()
        let imgs_url = undefined
        if (msg_body.base64imgs) {
            imgs_url = msg_body.base64imgs
        }
        else if (msg_body.imgs_url) {
            imgs_url = msg_body.imgs_url
        }
        const body = {
            model: this.id,
            prompt : msg_body.content,
            image : imgs_url,
            ...config
        }
        const header = new Headers();
        header.append("Authorization", `Bearer ${api_key}`);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body),
            // redirect: 'follow'
        }
        return fetch(source.base_url, requestOptions)
            .then(async response => {
                if (response.ok) {
                    return new SeedDreamImageMessage(response.json())
                }
                else {
                    console.log(response)
                    var msg = ""
                    try {
                        interface ErrorMsg {
                            error: {
                                message: string
                            }
                        }
                        msg = (await response.json() as ErrorMsg).error.message
                    }
                    catch { }
                    throw `response : ${response.status}\n${msg}`
                }
            }
            ).catch(error => {
                writeError(error.toString())
                return null;
            }
            );
    }
}

export class HappyHorseVideoModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    constructor(actual_name: string, actual_id: string, source: IModelSource[]) {
        this.name = actual_name;
        this.type = ModelType.happy_horse,
            this.id = actual_id
        this.source = source
    }

    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", api_key);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        header.append('X-DashScope-Async', 'enable')
        const message_body = current_dialog.quene[current_dialog.quene.length - 1]!.serialize()
        let body = JSON.stringify({
            model: this.id,
            input: {
                prompt: message_body.content,
                media: message_body.base64imgs && message_body.base64imgs.length > 0
                    ? [{ type: "first_frame", url: message_body.base64imgs[0]! }] : undefined,
            },
            ...config
        })
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        const video_url_ref = ref("")
        fetch(source.base_url, requestOptions)
            .then(response => response.json()
            ).then(
                json => {
                    const geration_response = json as {
                        request_id: string
                        output: {
                            task_status: string,
                            task_id: string
                        },
                    }
                    return geration_response.output.task_id
                }
            ).then(
                async task_id => {
                    const get_request_headers = new Headers()
                    get_request_headers.append("Authorization", api_key)
                    const get_request_option = {
                        method: 'GET',
                        headers: get_request_headers,
                        redirect: "follow" as RequestRedirect
                    }
                    const request_func_id = setInterval(
                        async () => {
                            try {
                                const req = await fetch(
                                    `/api/dashscope/api/v1/tasks/${task_id}`,
                                    get_request_option
                                )
                                const req_body = (await req.json()) as
                                    {
                                        request_id: string,
                                        output: {
                                            task_id: string,
                                            task_status: string,
                                            submit_time: string,
                                            scheduled_time: string,
                                            end_time: string,
                                            orig_prompt: string,
                                            video_url: string
                                            message?: string
                                        },
                                        usage: {
                                            duration: number,
                                            input_video_duration: number,
                                            output_video_duration: number,
                                            video_count: number,
                                            SR: number,
                                            ratio: string
                                        }
                                    }
                                if (req_body.output.task_status == "SUCCEEDED") {
                                    video_url_ref.value = req_body.output.video_url
                                    clearTimeout(request_func_id)
                                }
                                else if (req_body.output.task_status != "PENDING" && req_body.output.task_status != "RUNNING") {
                                    throw `unexpected result : ${req_body.output.message ? req_body.output.message : req_body.output.task_status}`
                                }
                            }
                            catch (err) {
                                clearTimeout(request_func_id)
                                throw err;
                            }
                        },
                        1000
                    )
                }
            ).catch(error => {
                writeError('error :' + error)
                return null;
            }
            )
        return new AssistantVideoMessage(video_url_ref)
    }

}

type ORContent = String | ORContentObject[]

type ORContentObject = {
    type: string,
    text?: string,
    image_url?: {
        url: string
    }
}


class OpenRouterAssistantMessage implements IAsyncMessage, ITextMessage, IBase64IMGMessage {
    id: string;
    role: "system" | "user" | "assistant" | "_invaild";
    base64imgs: Ref<string[], string[]>;
    content: string;
    current_content: Ref<string, string>;
    finish_reason: string | null;
    constructor(response: Promise<any>) {
        interface ORResponse {
            choices:
            {
                finish_reason: string,
                index: number,
                message: {
                    content?: ORContent,
                    role: "assistant"
                    images? : {
                        image_url : {
                            url : string
                        }
                    }[]
                }
            }[],
            created: number,
            id: string,
            model: string,
            object: string,
            system_fingerprint: string,
            usage: {
                completion_tokens: number,
                prompt_tokens: number,
                total_tokens: number
            }
        }
        this.id = IdGenerator2();
        this.base64imgs = ref([])
        this.content = ''
        this.current_content = ref(this.content)
        this.role = "assistant"
        this.finish_reason = null;
        response.then(
            (response_json: ORResponse) => {
                if (response_json.choices.length > 0) {
                    const msg = response_json.choices[0]!.message
                    this.finish_reason = response_json.choices[0]!.finish_reason
                    if (typeof msg.content == 'string') {
                        this.current_content.value = msg.content
                    }
                    else if (msg.content) {
                        (msg.content as ORContentObject[]).forEach(
                            obj => {
                                if (obj.text) {
                                    this.current_content.value += obj.text + '\n'
                                }
                                if (obj.image_url) {
                                    this.base64imgs.value.push(obj.image_url.url)
                                }
                            }
                        )
                    }
                    if (msg.images) {
                        msg.images.forEach(img => this.base64imgs.value.push(img.image_url.url))
                    }
                }
                else {
                    throw 'unexpected : no choices given'
                }

            }
        ).catch(
            err => writeError(err)
        )
    }
    serialize(): IMessageBody {
        return {
            role: this.role,
            content: this.content,
            base64imgs: this.base64imgs.value,
        }
    }

}

class ORResponseAnalyzer extends ResponseAnalyzer {

    protected parseSSEData(line: string): any | null {
        line.trimStart()
        if (line.startsWith(': ')) {
            return null;
        }
        if (line.length == 0) {
            return null;
        }
        return super.parseSSEData(line)
    }
}

export class OpenRouterAPIAssistantStreamMessage implements IAsyncMessage, IBase64IMGMessage {
    id: string
    role: "system" | "user" | "assistant" | "_invaild"
    content: string
    current_content: Ref<string>
    base64imgs: Ref<string[]>
    finish_reason: string | null
    constructor(
        stream: ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        this.role = "assistant"
        this.id = IdGenerator2()
        this.content = ""
        this.current_content = ref(this.content)
        this.finish_reason = null
        this.base64imgs = ref([])
        new ORResponseAnalyzer(new TextDecoder("utf-8"), stream.getReader()).read(
            async (json: any) => {
                if (json == null) {
                    return
                }
                interface LLMResponse {
                    choices:
                    {
                        delta?:
                        {
                            content: string
                        },
                        finish_reason?: string,
                    }[],
                    usage?: {
                        total_tokens: string
                    }
                }
                const obj = json as LLMResponse
                if (obj.choices.length == 0) {
                }
                else if (obj.choices.length > 0 && obj.choices[0]!.finish_reason) {
                    this.finish_reason = obj.choices[0]!.finish_reason
                }
                else if (obj.usage != null) {
                    writeLog(`total usage: ${obj.usage.total_tokens}`)
                }
                else {
                    if (obj.choices[0]!.delta) {
                        if (obj.choices[0]!.delta && obj.choices[0]?.delta.content.startsWith("![image]")) {
                            this.base64imgs.value.push((json.choices[0].delta.content as string).slice(9, -1))
                        }
                        else if (obj.choices[0]!.delta.content.length < 0x1000) {
                            this.current_content.value += json.choices[0].delta.content
                        }
                        else {
                            this.current_content.value += "<...>"
                            writeError("response string out of range")
                        }
                    }
                }
            }
        )
    }

    serialize(): IMessageBody {
        return {
            role: this.role,
            content: unref(this.current_content),
            base64imgs: unref(this.base64imgs)
        }
    }

}

export class OpenRouterAPIModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string
    company_source: string
    constructor(
        model_type: ModelType,
        actual_name: string,
        actual_id: string,
        source: IModelSource[],
        conpany_source: string
    ) {
        this.name = actual_name;
        this.type = model_type
        this.id = actual_id
        this.source = source
        this.company_source = conpany_source
        // this.base_url = `https://api.cometapi.com/v1beta/models/${this.id}:generateContent`;
    }
    private mBodyToOrBody(msg_body: IMessageBody) {
        const body: any = {
            role: msg_body.role
        }
        if (msg_body.base64imgs || msg_body.imgs_url || msg_body.video || msg_body.audio) {
            body.content = [] as ORContent
            if (msg_body.content.length > 0) {
                (body.content as any[]).push({ type: 'text', text: msg_body.content })
            }
            if (msg_body.base64imgs) {
                msg_body.base64imgs.forEach(
                    b64 => {
                        (body.content as any[]).push({ type: 'image_url', image_url: { url: b64 } })
                    }
                )
            }
            if (msg_body.imgs_url) {
                msg_body.imgs_url.forEach(
                    url => {
                        (body.content as any[]).push({ type: 'image_url', image_url: { url: url } })
                    }
                )
            }
        }
        else {
            body.content = msg_body.content;
        }
        return body;
    }


    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", `Bearer ${api_key}`);
        header.append("Content-Type", "application/json");
        header.append('Accept', '*/*')
        header.append('Connection', ' keep-alive')
        let body = JSON.stringify({
            model: `${this.company_source}/${this.id}`,
            messages: current_dialog.quene.flatMap(msg => this.mBodyToOrBody(msg.serialize())),
            ...config
        })
        const start_time = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort()
            writeError("out of time");
        },
            400000
        )
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            // redirect: 'follow',
            signal: controller.signal,
            // keepalive: true
        }
        return fetch(source.base_url, requestOptions)
            .then(response => {
                if (response.body) {
                    if (config && 'stream' in config && config.stream) {
                        return new OpenRouterAPIAssistantStreamMessage(response.body)
                    }
                    else {
                        return new OpenRouterAssistantMessage(response.json())
                    }
                }
                else {
                    return Promise.reject("invalid response body")
                }
            }
            ).catch(error => {
                writeError('error' + error)
                return null;
            }
            ).finally(
                () => {
                    writeLog("time used: " + (Date.now() - start_time))
                    clearTimeout(timeoutId)
                }
            );
    }
}

export class OpenRouterAPIVideoModel implements IModel {
    source: IModelSource[]
    name: string
    type: ModelType
    id: string

    company_source: string
    constructor(actual_name: string, actual_id: string, source: IModelSource[], company_source: string) {
        this.name = actual_name;
        this.type = ModelType.video,
            this.id = actual_id
        this.source = source
        this.company_source = company_source
    }


    async sendRequest(
        api_key: string,
        current_dialog: IDialogue,
        source: IModelSource,
        config?: object
    ): Promise<IMessage | IAsyncMessage | null> {
        let header = new Headers();
        header.append("Authorization", `Bearer ${api_key}`);
        header.append("Content-Type", "application/json");
        header.append('Connection', ' keep-alive')
        const message_body = current_dialog.quene[current_dialog.quene.length - 1]!.serialize()
        const frame_type = config && 'frame_type' in config ? config.frame_type : 'first_frame'
        let body = JSON.stringify({
            model: `${this.company_source}/${this.id}`,
            prompt: message_body.content,
            frame_images: message_body.base64imgs && message_body.base64imgs.length > 0
                ? [{ type: 'image_url', image_url: { url :message_body.base64imgs[0] }, frame_type: frame_type } ]: undefined,
            ...config
        })
        let requestOptions: RequestInit = {
            method: 'POST',
            headers: header,
            body: body,
            redirect: 'follow'
        };
        const video_url_ref = ref("")
        fetch(source.base_url, requestOptions)
            .then(response => {
                return response.json()
            }
            ).then(
                json => {
                    const geration_response = json as { polling_url: string, status: string, error?: string }
                    if (geration_response.status == 'failed') {
                        throw geration_response.error!
                    }
                    else if (geration_response.status == 'cancelled') {
                        throw "geratrion cancelled"
                    }
                    return geration_response.polling_url
                }
            ).then(
                async url => {
                    const get_request_headers = new Headers()
                    get_request_headers.append("Authorization", `Bearer ${api_key}`)
                    const get_request_option = {
                        method: 'GET',
                        headers: get_request_headers,
                        redirect: "follow" as RequestRedirect
                    }
                    return new Promise<string>(
                        (resolve, reject) => {
                            const request_func_id = setInterval(
                                async () => {
                                    try {
                                        const req = await fetch(
                                            `/api/openrouter${url}`,
                                            get_request_option
                                        )
                                        const req_body = (await req.json()) as {
                                            id: string,
                                            error?: string
                                            polling_url: string,
                                            status: string,
                                            generation_id: string,
                                            unsigned_urls: string[],
                                            usage: {
                                                cost: number
                                            }
                                        }
                                        if (req_body.status == "completed") {
                                            clearTimeout(request_func_id)
                                            resolve(req_body.unsigned_urls[0]!)
                                        }
                                        else if (req_body.status == "failed") {
                                            throw `geration failed : ${req_body.error}`
                                        }
                                    }
                                    catch (err) {
                                        clearTimeout(request_func_id)
                                        reject(err);
                                    }
                                },
                                1000
                            )
                        }
                    )
                }
            ).then(
                async (us_url : string) => {
                    const get_video_headers = new Headers()
                    get_video_headers.append("Authorization", `Bearer ${api_key}`)
                    const get_video_option = {
                        method: 'GET',
                        headers: get_video_headers,
                        redirect: "follow" as RequestRedirect
                    }
                    const res = await fetch(us_url, get_video_option)
                    if (!res.ok) {
                        throw new Error(`HTTP error!: ${res.status}`);
                    }
                    video_url_ref.value = URL.createObjectURL(await res.blob())
                }
            ).catch(error => {
                writeError('error :' + error)
                return null;
            }
            )
        return new AssistantVideoMessage(video_url_ref)
    }
}