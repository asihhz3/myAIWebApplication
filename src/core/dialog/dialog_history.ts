import { reactive } from "vue"
import type { IDialogue } from "./dialog_type"

export class DialogHistory {
    dialog : IDialogue
    user : string
    model : string

    constructor (dialog : IDialogue, user : string, model : string) {
        this.dialog = dialog
        this.user = user
        this.model = model
    }
}


const dialog_history_label = "dialog_history"

export var client_dialog_history = reactive(
    {
        history_id_list : getHistory().flatMap(dia => dia.dialog.id),
        hasHistory(id : string) : boolean{
            return getHistory().some(dia => dia.dialog.id == id)
        },
        getHistory (id : string) : DialogHistory | null{
            let dialog = getHistory().find(dia => dia.dialog.id == id)
            if (dialog) {
                return dialog
            }
            else {
                console.error("dialog not found: " + id)
                return null
            }
        },

        getAllHistories () : DialogHistory[] {
            return getHistory()
        },
        pushHistory (new_dialog : DialogHistory) {
            this.history_id_list.push(new_dialog.dialog.id)
            let list = getHistory()
            list.push(new_dialog)
            setHistory(list)
        },
        removeHistory (dialog_id : string) {
            if (!this.history_id_list.some(id => id == dialog_id)) {
                console.error("unknown dialog id: " +  dialog_id)
                return
            }
            let list = getHistory().filter(dia => dia.dialog.id != dialog_id)
            this.history_id_list = list.flatMap(dia => dia.dialog.id)
            setHistory(list)
        }
    }
)

function getHistory() : DialogHistory[] {
    let temp_str = window.localStorage.getItem(dialog_history_label)
    return temp_str ? JSON.parse(temp_str) : []
}

function setHistory(list : DialogHistory[]) : void {
    window.localStorage.setItem(dialog_history_label, JSON.stringify(list))
}


