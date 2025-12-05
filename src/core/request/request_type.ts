
import type { IMessage } from "@/core/dialog/dialog_type"

interface IRequestBody {
    model : string,
    message : IMessage[]
    stringify : () => string,
}

class RequestBody implements IRequestBody {
    model : string
    message : IMessage[]

    constructor(model : string) {
        this.model = model,
        this.message = []
    }

    stringify() {
        return JSON.stringify(this)
    }
}