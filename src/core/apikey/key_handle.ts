import { reactive } from "vue"

const api_key_records_label = "api_keys"

class UserKeyPair {
    user : string
    key : string
    constructor (user : string, key : string) {
        this.user = user
        this.key = key
    }
}

export var global_key_handle = reactive(
    {
        list : getKeys(),
        setKey(user : string, key : string) : void { 
            this.list.push(new UserKeyPair(user, key))
            window.localStorage.setItem(api_key_records_label, JSON.stringify(this.list))
        },
        removeAllKeys() : void { 
            this.list = []
            window.localStorage.setItem(api_key_records_label, "[]")
        }

    }
)


export function getKeys() : UserKeyPair[]  { 
    let temp_str = window.localStorage.getItem(api_key_records_label)
    return temp_str ? JSON.parse(temp_str) : []
}

export function setKey(user : string, key : string) : void { 
    let group = getKeys();
    group.push(new UserKeyPair(user, key))
    window.localStorage.setItem(api_key_records_label, JSON.stringify(group))
}

export function removeAllKeys() : void { 
    window.localStorage.setItem(api_key_records_label, "[]")
}



