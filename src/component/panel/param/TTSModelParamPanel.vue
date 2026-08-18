
<template>
    <div class="param-card" id="tts_model_param_main">
        <div class="card-title">Config</div>
        <div class="card-title">Input</div>
        <textarea class="text_input" v-model="user_input"></textarea>
    </div>
</template>

<script lang="ts">
import { SystemMessage, UserTextMessage, type IMessage } from '@/core/dialog/dialog_type';

    export default {
        data() {
            return {
                user_input : "",
            }
        },
        methods : {
            createMessage() : IMessage {
                return new UserTextMessage(this.user_input)
            },
            createSystemMessage() : IMessage {
                return new SystemMessage(this.user_input)
            },
            createConfig() : any {
                return {
                }
            }
        },
    }
</script>
