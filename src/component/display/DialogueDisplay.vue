
<template>
    <div class = "container" id = "dialog_display">
        <component v-for="msg in current_dialog!.quene" :is="displayMessage(msg)" :value="getMessageValue(msg)"></component>
    </div>
</template>

<script lang="ts">
    import { Dialogue, type IBase64IMGMessage, type IMessage, type IAsyncMessage, type ITextMessage } from "@/core/dialog/dialog_type";
    import ContentDisplay from "@/component/display/ContentDisplay.vue"
import { type IDisplayValue } from "@/core/util/display_type";
import { reactive, ref, toRef, type Ref } from "vue";
    export default {
        methods : {
            displayMessage(msg : IMessage) : string{
                return "ContentDisplay"
            },
            getMessageValue(msg : IMessage) : IDisplayValue{
                let value = {
                    role : msg.role,
                    content : "" as string | Ref<string>,
                    base64imgs : ref([]) as Ref<string[]>
                }
                if ("current_content" in msg && "finish_reason" in msg) {
                    value.content = toRef((msg as IAsyncMessage), "current_content")
                }
                else if("content" in msg) {
                    value.content = (msg as ITextMessage).content
                }
                if ("base64imgs" in msg) {
                    value.base64imgs = toRef((msg as IBase64IMGMessage), "base64imgs")
                }
                return reactive(value)
            }
        },
        props : {
            current_dialog : Dialogue
        },
        components : {
            "ContentDisplay" : ContentDisplay
        },
    }
</script>
<style scoped>
#dialog_display {
    width: 100%;
    min-height: 100px;
    height: 300px;
    overflow-y: auto;
    position: relative;
    padding: 10px;
    box-sizing: border-box;
}

#dialog_display:after {
    content: "";
    display: table;
    clear: both;
}
</style>