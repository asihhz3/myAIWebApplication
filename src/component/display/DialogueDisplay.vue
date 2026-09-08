
<template>
    <div class="chat-card" id="dialog_display" ref="chat_scroll">
        <div class="chat-list">
            <component v-for="msg in current_dialog!.quene" :key="msg.id" :is="displayMessage(msg)" @delete_message = "deleteMessage" @message_edited="onMessageEdited" @message_updated="onMessageUpdated" :value="getMessageValue(msg)"></component>
        </div>
    </div>
</template>

<script lang="ts">
    import { Dialogue, type IBase64IMGMessage, type IMessage, type IAsyncMessage, type ITextMessage, type IUrlIMGMessage, type IVideoMesasage, type IAudioMesasage } from "@/core/dialog/dialog_type";
    import ContentDisplay from "@/component/display/ContentDisplay.vue"
import { type IDisplayValue } from "@/core/util/display_type";
import { client_dialog_history } from "@/core/dialog/dialog_history";
import { reactive, toRef, type Ref } from "vue";
    export default {
        methods : {
            displayMessage(msg : IMessage) : string{
                return "ContentDisplay"
            },
            scrollToBottom() {
                const el = this.$refs.chat_scroll as HTMLElement | undefined
                if (!el) {
                    return
                }
                const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
                if (nearBottom) {
                    el.scrollTop = el.scrollHeight
                }
            },
            getMessageValue(msg : IMessage) : IDisplayValue{
                let value = {
                    message_id : msg.id,
                    role : msg.role,
                    content : "" as string | Ref<string>,
                    streaming : false as boolean,
                    base64imgs : undefined as Ref<string[]> | undefined,
                    imgs_url : undefined as Ref<string[]> | undefined,
                    video_url : undefined as Ref<string> | undefined,
                    audio_url : undefined as string | undefined
                }
                if ("current_content" in msg && "finish_reason" in msg) {
                    value.content = toRef((msg as IAsyncMessage), "current_content")
                    value.streaming = (msg as IAsyncMessage).finish_reason == null
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
                if ("audio_url" in msg) {
                    value.audio_url = (msg as IAudioMesasage).audio_url
                }
                return reactive(value)
            },
            deleteMessage(msg_id : string) {
                this.current_dialog!.quene = this.current_dialog!.quene.filter(msg => msg.id != msg_id)
                client_dialog_history.saveHistory(this.current_dialog!)
            },
            onMessageEdited() {
                client_dialog_history.saveHistory(this.current_dialog!)
            },
            onMessageUpdated() {
                client_dialog_history.saveHistory(this.current_dialog!)
            },
        },
        props : {
            current_dialog : Object as () => Dialogue
        },
        mounted() {
            this.scrollToBottom()
        },
        updated() {
            this.scrollToBottom()
        },
        components : {
            "ContentDisplay" : ContentDisplay
        },
    }
</script>
<style scoped>
.chat-card {
    width: 100%;
    height: calc(100vh - 96px);
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-sizing: border-box;
    scroll-behavior: smooth;
}

.chat-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 860px;
    margin: 0 auto;
}

@media (max-width: 960px) {
    .chat-card {
        height: 60vh;
    }
}
</style>
