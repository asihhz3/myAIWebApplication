import { ref, type Ref } from "vue"
import { ResponseAnalyzer } from "../util/tool"


export interface IMessage {
    role : "system" | "user" | "assistant" | "_invaild",
}

export interface ITextMessage extends IMessage {
    content : string,
}

export interface IStreamMessage extends IMessage{
    current_content : Ref<string>
    finish_reason : string | null
}

export interface IBase64IMGMessage extends IMessage{
    base64imgs : Ref<string[]>
}


export function serializeTextMessage(msg : ITextMessage) {
    return JSON.stringify(
        {
            role : msg.role,
            content : msg.content
        },
    )
}
function parseSSEData(line : string) : any | null{

  // 过滤空行和 [DONE] 标记
  if (!line.trim() || line.trim() === 'data: [DONE]') {
    return null;
  }
  
  // 移除 "data: " 前缀
  if (line.startsWith('data: ')) {
    const jsonStr = line.slice(6); // 移除 "data: "
    
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn('JSON解析失败:', jsonStr, error);
      return null;
    }
  }
  
  return null;
}

export class UserTextMessage implements ITextMessage {
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    constructor(content : string, imgs : string[] = []) {
        this.role = "user"
        this.content = content
    }
}

export class UserMixMessage extends UserTextMessage implements IBase64IMGMessage {
    base64imgs : Ref<string[]>
    constructor(content : string, imgs : string[] = []) {
        super(content)
        this.base64imgs = ref(imgs)
    }
}

export class SystemMessage implements ITextMessage {
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    constructor(content : string) {
        this.role = "system"
        this.content = content
    }
}

export class AssistantTextMessage implements ITextMessage {
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    finish_reason : string | null
    constructor(
        stream : ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        this.role = "assistant"
        this.content = ""
        this.finish_reason = null
        this.read(stream.getReader())
    }

    async read(reader : ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>) {
        const decoder = new TextDecoder("utf-8")
        let { value, done } = await reader.read()
        if (done) {
            decoder.decode(undefined, {stream : false})
            this.finish_reason = "error"
            return
        }
        if (!value) {
            console.error("unexpected error : chunk is null while readStream is unclosed")
            this.finish_reason = "error"
            return
        }
        let json = parseSSEData(decoder.decode(value, {stream : true}))
        if (json != null) {
            this.finish_reason = json.choices[0].finish_reason
            this.content = json.choices[0].delta.content
        }
        else {
            console.error("unexpected error : failed to parse response json")
            this.finish_reason = "error"
        }
    }
}


export class AssistantStreamMessage implements IStreamMessage, IBase64IMGMessage {
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    current_content : Ref<string>
    base64imgs : Ref<string[]>
    finish_reason : string | null
    constructor(
        stream : ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        this.role = "assistant"
        this.current_content = ref("")
        this.content = this.current_content.value
        this.finish_reason = null
        this.base64imgs = ref([])
        this.read(stream.getReader())
    }


    async read(reader : ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>) {
        const analyzer = new ResponseAnalyzer(new TextDecoder("utf-8"), reader)
        await analyzer.read(
            json => {
                if (json == null) {
                    return
                }
                if (json.choices.length > 0 && json.choices[0].finish_reason != null) {
                    console.log("finish")
                    this.finish_reason = json.choices[0].finish_reason
                }
                else if(json.usage != null) {
                    console.log(`total usage: ${json.usage.total_tokens}`)
                }
                else {
                    if ((json.choices[0].delta.content as string).startsWith("![image]")) {
                        this.base64imgs.value.push((json.choices[0].delta.content as string).slice(9,-1))
                    }
                    else if ((json.choices[0].delta.content as string).length < 0x1000){
                        this.current_content.value += json.choices[0].delta.content
                    }
                    else {
                        this.current_content.value += "<...>"
                        console.error("response string out of range")
                    }
                }
            }
        )
        // while(true) {
        //     let { value, done } = await reader.read()
        //     if (done) {
        //         decoder.decode(undefined, {stream : false})
        //         break
        //     }
        //     if (!value) {
        //         console.error("unexpected error : chunk is null while readStream is unclosed")
        //         this.finish_reason = "error"
        //         break
        //     }
        //     decoder.decode(value, { stream: true }).split('\n').forEach(
        //         line => {
        //             let json = parseSSEData(line)
        //             if (json == null) {
        //                 return
        //             }
        //             if (json.choices.length > 0 && json.choices[0].finish_reason != null) {
        //                 console.log("finish")
        //                 this.finish_reason = json.choices[0].finish_reason
        //             }
        //             else if(json.usage != null) {
        //                 console.log(`total usage: ${json.usage.total_tokens}`)
        //             }
        //             else {
        //                 if ((json.choices[0].delta.content as string).startsWith("![image]")) {
        //                     this.base64imgs.value.push((json.choices[0].delta.content as string).slice(9,-2))
        //                 }
        //                 else if ((json.choices[0].delta.content as string).length < 0x1000){
        //                     this.current_content.value += json.choices[0].delta.content
        //                 }
        //                 else {
        //                     this.current_content.value += "<...>"
        //                     console.error("response string out of range")
        //                 }
        //             }
        //         }
        //     )
        // }
        // this.content = this.current_content.value
    }
}

export interface IDialogue {
    quene : IMessage[]
    id : string
}

export class Dialogue implements IDialogue {
    quene : IMessage[]
    id : string
    constructor(id : string, start_msg : SystemMessage) {
        this.quene = []
        this.id = id
        this.quene.push(start_msg)
    }
}