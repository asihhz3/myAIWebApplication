import { ref, unref, type Ref } from "vue"
import { IdGenerator2, ResponseAnalyzer } from "../util/tool"


export interface IMessageBody {
    role : "system" | "user" | "assistant" | "_invaild",
    content : string,
    base64imgs? : string[],
    imgs_url? : string[],
    video?: string
}

export interface IMessage {
    id : string,
    role : "system" | "user" | "assistant" | "_invaild",
    serialize() : IMessageBody;
}

export interface ITextMessage extends IMessage {
    content : string
}

export interface IAsyncMessage extends IMessage{
    current_content : Ref<string>
    finish_reason : string | null
}

export interface IBase64IMGMessage extends IMessage{
    base64imgs : Ref<string[]>
}

export interface IUrlIMGMessage extends IMessage{
    imgs_url : Ref<string[]>
}
 export interface IVideoMesasage extends IMessage {
    video_url : Ref<string>
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
    id : string
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    constructor(content : string) {
        this.id = IdGenerator2()
        this.role = "user"
        this.content = content
    }

    serialize(): IMessageBody {
        return {
            role : this.role,
            content : this.content,
            base64imgs : undefined,
        }
    }
}

export class UserMixMessage extends UserTextMessage implements IBase64IMGMessage {
    base64imgs : Ref<string[]>
    constructor(content : string, imgs : string[] = []) {
        super(content)
        this.base64imgs = ref(imgs)
    }

    serialize(): IMessageBody {
        return {
            role : this.role,
            content : this.content,
            base64imgs : unref(this.base64imgs)
        }
    }
}

export class SystemMessage implements ITextMessage {
    id : string
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    constructor(content : string) {
        this.id = IdGenerator2()
        this.role = "system"
        this.content = content
    }
    serialize(): IMessageBody {
        return {
            role : this.role,
            content : this.content,
            base64imgs : undefined
        }
    }
}

export class AssistantTextMessage implements ITextMessage, IAsyncMessage {
    id : string
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    current_content : Ref<string>
    finish_reason : string | null
    constructor(
        stream : ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        this.id = IdGenerator2()
        this.role = "assistant"
        this.content = ""
        this.current_content = ref(this.content)
        this.finish_reason = null
        this.read(stream.getReader())
    }

    serialize(): IMessageBody {
        return {
            role : this.role,
            content : this.content
        } as IMessageBody
    }

    async read(reader : ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>) {
        const decoder = new TextDecoder("utf-8")
        const analyzer = new ResponseAnalyzer(new TextDecoder("utf-8"), reader)
        analyzer.read(
            json => {
                if (json != null) {
                    this.finish_reason = json.choices[0].finish_reason
                    this.current_content.value = json.choices[0].message.content
                    this.content = this.current_content.value
                }
                else {
                    console.error("unexpected error : failed to parse response json")
                    this.finish_reason = "error"
                }
            }
        )
    }
}


export class AssistantStreamMessage implements IAsyncMessage, IBase64IMGMessage {
    id : string
    role : "system" | "user" | "assistant" | "_invaild"
    content : string
    current_content : Ref<string>
    base64imgs : Ref<string[]>
    finish_reason : string | null
    constructor(
        stream : ReadableStream<Uint8Array<ArrayBuffer>>
    ) {
        this.role = "assistant"
        this.id = IdGenerator2()
        this.current_content = ref("")
        this.content = this.current_content.value
        this.finish_reason = null
        this.base64imgs = ref([])
        this.read(stream.getReader())
    }

    serialize(): IMessageBody {
        return {
            role : this.role,
            content : this.content,
            base64imgs : unref(this.base64imgs)
        }
    }


    async read(reader : ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>) {
        const analyzer = new ResponseAnalyzer(new TextDecoder("utf-8"), reader)
        await analyzer.read(
            json => {
                if (json == null) {
                    return
                }
                interface LLMResponse {
                    choices : 
                        {
                            delta?: 
                            {
                                content : string
                            },
                            finish_reason?: string,
                        }[],
                        usage?: {
                            total_tokens : string
                        }
                }
                const obj = json as LLMResponse
                if(obj.choices.length == 0) {
                }
                else if (obj.choices.length > 0 && obj.choices[0]!.finish_reason) {
                    console.log("finish")
                    this.finish_reason = obj.choices[0]!.finish_reason
                }
                else if(obj.usage != null) {
                    console.log(`total usage: ${obj.usage.total_tokens}`)
                }
                else {
                    if (obj.choices[0]!.delta) {
                        if (obj.choices[0]!.delta && obj.choices[0]?.delta.content.startsWith("![image]")) {
                            this.base64imgs.value.push((json.choices[0].delta.content as string).slice(9,-1))
                        }
                        else if (obj.choices[0]!.delta.content.length < 0x1000){
                            this.current_content.value += json.choices[0].delta.content
                        }
                        else {
                            this.current_content.value += "<...>"
                            console.error("response string out of range")
                        }
                    }
                }
            }
        )
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