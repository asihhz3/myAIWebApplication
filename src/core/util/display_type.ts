import { ref, type Ref } from "vue"

export interface IDisplayValue {
    message_id : string
    content : string
    role : "system" | "user" | "assistant" | "_invaild"
    base64imgs? : string[]
    imgs_url? : string[]
    video_url? : string
    audio_url? : string
}

// export class DisplayTextValue implements IDisplayValue{
//     content : string
//     role : "system" | "user" | "assistant" | "_invaild"
//     base64imgs : string[]
//     imgs_url : string[]
//     constructor (content : string, role : "system" | "user" | "assistant" | "_invaild") {
//         this.content = content
//         this.role = role
//         this.base64imgs = []
//         this.imgs_url = []
//     }
// }

// export class DisplayMixValue extends DisplayTextValue{
//     constructor (
//         content : string,
//         role : "system" | "user" | "assistant" | "_invaild",
//         imgs : string[]) {
//             super(content,role)
//             this.base64imgs = imgs
//     }
// }