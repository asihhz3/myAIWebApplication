import { ref, type Ref } from "vue";

export class LogContent {
    str : string
    constructor() {
        this.str = ""
    }
}

export const content : Ref<LogContent> = ref(new LogContent())

export function writeLog(msg : string) {
    content.value.str = content.value.str.concat('\n', msg);
    console.log(msg)
}

export function writeError(msg : string) {
    content.value.str = content.value.str.concat('\n', msg);
    console.error(msg)
}