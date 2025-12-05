
import type { IMessage } from "@/core/dialog/dialog_type"

interface IRequestBody {
    model : string,
    messages : IMessage[]
    stream : boolean
    stringify : () => string,
}

class RequestBody implements IRequestBody {
    model : string
    messages : IMessage[]
    stream : boolean

    constructor(
        model : string,
        messages : IMessage[],
        stream : boolean
    ) {
        this.model = model,
        this.messages = messages
        this.stream = stream
    }

    stringify() :string {
        return JSON.stringify({
            model :this.model,
            messages : this.messages,
            stream : this.stream
        })
    }
}