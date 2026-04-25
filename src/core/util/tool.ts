import uuid from "uuid-js";


declare global {
    interface String {
        isEmpty : () => boolean
    }
}

String.prototype.isEmpty = function() {
    return this == null || this.length == 0
}

export function isNumericEnum(enumType: any, value: any): boolean {
  // 检查值是否是枚举定义中的键或值
  return Object.values(enumType).includes(value) || value in enumType;
}

export interface IReaderResult {
    ok : ReaderResultEnum,
    message : string
}

export enum ReaderResultEnum {
    unfinished,
    finished,
    error
}

export class ResponseAnalyzer {
    decoder : TextDecoder
    reader : ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>
    is_recieve_large_data : boolean
    buffer : string[]
    constructor(
        decoder : TextDecoder,
        reader : ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>
    ) {
        this.decoder = decoder
        this.reader = reader
        this.buffer = []
        this.is_recieve_large_data = false
    }
    protected parseSSEData(line : string) : any | null{
        // 过滤空行和 [DONE] 标记
        if (!line.trim() || line.trim() === 'data: [DONE]') {
            return null;
        }

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
        else {
            const jsonStr = line.startsWith('data: ') ? line.slice(6) : line// 移除 "data: "
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
    private async readOnce() : Promise<string[] | ReaderResultEnum>{
        let { value, done } = await this.reader.read()
        if (done) {
            this.decoder.decode(undefined, {stream : false})
            return ReaderResultEnum.finished
        }
        if (!value) {
            return Promise.reject("unexpected error : chunk is null while readStream is unclosed")
        }
        return this.decoder.decode(value, {stream : true}).split('\n')
    }
    private async handleOnce(line : string, json_handler : (json : any) => void) : Promise<void>{
        let read_result = this.parseSSEData(line)
        if (read_result) {
            json_handler(read_result)
        }
    }

    private async handleLines(lines : string[], json_handler : (json : any) => void) : Promise<void>{
        for (let line of lines) {
            await this.handleOnce(line, json_handler)
        }
    }

    async read(json_handler : (json : any) => void) : Promise<IReaderResult>{
        let read_result : ReaderResultEnum | string[] = ReaderResultEnum.unfinished
        try {
            read_result = await this.readOnce()
            while (!isNumericEnum(ReaderResultEnum, read_result)) {
                let [result] = await Promise.all(
                    [
                        this.readOnce(),
                        this.handleLines(read_result as string[], json_handler)
                    ]
                )
                read_result = result
            }
        } catch(e) {
            return {
                ok : read_result as ReaderResultEnum,
                message : typeof e == "string" ? e : `Unknow error: ${e}`
            }
        }
        
        return {
            ok : read_result as ReaderResultEnum,
            message : "normal"
        }
    }
}

export function IdGenerator1() {
    return uuid.randomUI32().toString()
}

let counter = 0
let base = Number.parseInt(uuid.randomUI16().toString()) << 15

export function IdGenerator2() {
    return (base + counter++).toString()
}

export function GetMimeTypeForBase64(b64 : string) : string{
    return /(?<=data:image\/)(\w+)/.exec(b64)![0]
}

export default {}