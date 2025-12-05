import { ref, type Ref } from "vue"

export interface IDisplayValue {
    content : string
    role : "system" | "user" | "assistant" | "_invaild"
    base64imgs : string[]
}

export class DisplayTextValue implements IDisplayValue{
    content : string
    role : "system" | "user" | "assistant" | "_invaild"
    base64imgs : string[]
    constructor (content : string, role : "system" | "user" | "assistant" | "_invaild") {
        this.content = content
        this.role = role
        this.base64imgs = []
    }
}

export class DisplayMixValue extends DisplayTextValue{
    constructor (
        content : string,
        role : "system" | "user" | "assistant" | "_invaild",
        imgs : string[]) {
            super(content,role)
            this.base64imgs = imgs
    }
}