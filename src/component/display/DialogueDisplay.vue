
<template>
    <div class = "container" id = "dialog_display">
        <component v-for="msg in current_dialog!.quene" :is="displayMessage(msg)" @delete_message = "deleteMessage" :value="getMessageValue(msg)"></component>
    </div>
</template>

<script lang="ts">
    import { Dialogue, type IBase64IMGMessage, type IMessage, type IAsyncMessage, type ITextMessage, type IUrlIMGMessage, type IVideoMesasage } from "@/core/dialog/dialog_type";
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
                    message_id : msg.id,
                    role : msg.role,
                    content : "" as string | Ref<string>,
                    base64imgs : undefined as Ref<string[]> | undefined,
                    imgs_url : undefined as Ref<string[]> | undefined,
                    video_url : undefined as Ref<string> | undefined
                }
                if ("current_content" in msg && "finish_reason" in msg) {
                    value.content = toRef((msg as IAsyncMessage), "current_content")
                }
                else if("content" in msg) {
                    value.content = toRef((msg as ITextMessage), "content")
                }
                if ("base64imgs" in msg) {
                    value.base64imgs = toRef((msg as IBase64IMGMessage), "base64imgs")
                }
                if ("imgs_url" in msg) {
                    value.imgs_url = toRef((msg as IUrlIMGMessage), "imgs_url")
                }
                if ("video_url" in msg) {
                    value.video_url = toRef((msg as IVideoMesasage), "video_url")
                }
                return reactive(value)
            },
            deleteMessage(msg_id : string) {
                this.current_dialog!.quene = this.current_dialog!.quene.filter(msg => msg.id != msg_id)
            },
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
    min-height: 200px;
    height: 600px;
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