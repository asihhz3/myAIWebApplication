import { reactive } from "vue"
import type { IDialogue, IMessage, IMessageBody } from "./dialog_type"
import { HistoryMessage, serializeMessage } from "./dialog_type"
import { writeError } from "../util/log"
import { strIsRole } from "../util/tool"

export class DialogHistory {
    dialog : IDialogue
    user : string

    constructor (dialog : IDialogue, user : string) {
        this.dialog = dialog
        this.user = user
    }
}


async function get_dialoghistory_id_list(user_id : string) : Promise<string[]>{
    const headers = new Headers()
    headers.append("Content-type", "application/json")
    return fetch("/server/query",
        {
            method : "post",
            headers : headers,
            body : JSON.stringify(
                {
                    user_id
                }
            )
        }
    )
    .then(rp => rp.json())
}

async function get_dialoghistory(dialog_id : string, user_id : string) : Promise<IDialogue>{
    interface ResponseDialog {
        message : {
            msg_id : string,
            role : string,
            content? : string,
            image_urls? : string[] 
        }[]
    }
    const headers = new Headers()
    headers.append("Content-type", "application/json")
    return fetch("/server/query",
        {
            method : "post",
            headers : headers,
            body : JSON.stringify(
                {
                    dialog_id,
                    user_id
                }
            )
        }
    )
    .then(rp => rp.json())
    .then(
        (response : ResponseDialog) => {
            let quene : IMessage[] = response.message.map(
                re => {
                    return new HistoryMessage(re.msg_id, {
                        content : re.content ? re.content : "",
                        role : strIsRole(re.role) ?  
                        re.role as "system" | "user" | "assistant" | "_invaild" : "_invaild",
                        imgs_url : re.image_urls ? re.image_urls : undefined
                    })
                }
            )
            return {
                id : dialog_id,
                quene
            }
        }
    )
}


const dialog_history_label = "dialog_history"

export var client_dialog_history = reactive(
    {

        history_id_list : getClientHistory().flatMap(dia => dia.dialog.id),
        hasHistory(id : string) : boolean{
            return getClientHistory().some(dia => dia.dialog.id == id)
        },
        getClientHistory (id : string) : DialogHistory | null{
            let dialog = getClientHistory().find(dia => dia.dialog.id == id)
            if (dialog) {
                return dialog
            }
            else {
                writeError("dialog not found: " + id)
                return null
            }
        },
        async pollServerHistory (id : string){
            await pollServerHistory(id)
        },

        getAllHistories () : DialogHistory[] {
            return getClientHistory()
        },
        pushHistory (new_dialog : DialogHistory) {
            this.history_id_list.push(new_dialog.dialog.id)
            let list = getClientHistory()
            list.push(new_dialog)
            setHistory(list)
        },
        removeHistory (dialog_id : string) {
            if (!this.history_id_list.some(id => id == dialog_id)) {
                writeError("unknown dialog id: " +  dialog_id)
                return
            }
            let list = getClientHistory().filter(dia => dia.dialog.id != dialog_id)
            this.history_id_list = list.flatMap(dia => dia.dialog.id)
            setHistory(list)
        },
        saveHistory (dialog : IDialogue, user? : string, model? : string) {
            const snapshot : IDialogue = {
                id : dialog.id,
                quene : dialog.quene.map(msg => {
                    const body = serializeMessage(msg) as IMessageBody
                    return {
                        id : msg.id,
                        role : msg.role,
                        content : body.content ?? "",
                        base64imgs : body.base64imgs,
                        imgs_url : body.imgs_url,
                        video_url : body.video,
                        audio_url : body.audio,
                        serialize() : IMessageBody {
                            const m = this as unknown as { content? : string, base64imgs? : string[], imgs_url? : string[], video_url? : string, audio_url? : string }
                            return {
                                role : msg.role,
                                content : m.content ?? "",
                                base64imgs : m.base64imgs,
                                imgs_url : m.imgs_url,
                                video : m.video_url,
                                audio : m.audio_url
                            }
                        }
                    }
                })
            }
            const list = getClientHistory()
            const idx = list.findIndex(dia => dia.dialog.id == dialog.id)
            if (idx >= 0) {
                const existing = list[idx]!
                list[idx] = new DialogHistory(
                    snapshot,
                    user ?? existing.user,
                )
            }
            else {
                list.unshift(new DialogHistory(snapshot, user ?? ""))
            }
            this.history_id_list = list.flatMap(dia => dia.dialog.id)
            setHistory(list)
        }
    }
)

var raw_historydialog = null as DialogHistory[] | null

//TODO
function getClientHistory() : DialogHistory[] {
    // let temp_str = window.localStorage.getItem(dialog_history_label)
    // return temp_str ? JSON.parse(temp_str) : []
    if (raw_historydialog == null) {
        raw_historydialog = []
    }
    return raw_historydialog
}

async function pollServerHistory(dialog_id : string) : Promise<void> {
}

function setHistory(list : DialogHistory[]) : void {
    // window.localStorage.setItem(dialog_history_label, JSON.stringify(list))
}


