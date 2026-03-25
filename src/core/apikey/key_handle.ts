import { reactive } from "vue"
import type { ModelSourceType } from "../model/model_type"

const api_key_records_label = "api_keys"

export class UserIdentity {
    name : string
    key_list : {
        source_type : ModelSourceType,
        key : string
    }[]
    constructor (user : string) {
        this.name = user
        this.key_list = []
    }
}

export var global_key_handle = reactive(
    {
        list : getKeys(),
        createUser(name : string, first_source_type : ModelSourceType, first_key : string) : void{
            const user = new UserIdentity(name)
            setKey(user, first_source_type, first_key)
            this.list.push(user)
            window.localStorage.setItem(api_key_records_label, JSON.stringify(this.list))
        },
        setKey(user : string, source_type : ModelSourceType, key : string) : void {
            const user_id = this.list.find(_user => _user.name = user)
            if (user_id === undefined) {
                alert(`unknown user : ${user}`)
                throw "unknown user"
            }
            setKey(user_id, source_type, key)
            window.localStorage.setItem(api_key_records_label, JSON.stringify(this.list))
        },
        removeAllKeys(user : string) : void { 
            const user_id = this.list.find(_user => _user.name = user)
            if (user_id === undefined) {
                alert(`unknown user : ${user}`)
                throw "unknown user"
            }
            removeAllKeys(user_id)
            window.localStorage.setItem(api_key_records_label, "[]")
        }

    }
)


function getKeys() : UserIdentity[]  { 
    let temp_str = window.localStorage.getItem(api_key_records_label)
    return temp_str ? JSON.parse(temp_str) : []
}

function setKey(user : UserIdentity, source_type : ModelSourceType, key : string) {
        const key_pair = user.key_list.find(_key_pair => _key_pair.source_type == source_type)
        if (key_pair) {
            key_pair.key = key
        }
        else {
            user.key_list.push(
                {
                    source_type,
                    key
                }
            )
        }
    }
function removeAllKeys(user : UserIdentity) {
    user.key_list = []
}


// export function setKey(user : string, key : string) : void { 
//     let group = getKeys();
//     group.push(new UserIdentity(user, key))
//     window.localStorage.setItem(api_key_records_label, JSON.stringify(group))
// }

// export function removeAllKeys() : void { 
//     window.localStorage.setItem(api_key_records_label, "[]")
// }



