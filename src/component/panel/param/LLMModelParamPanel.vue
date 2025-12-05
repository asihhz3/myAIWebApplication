
<template>
    <div id = "model_param_main">
        Input :
        <br></br>
        <textarea class="text_input" v-model="user_input" >{{ user_input }}</textarea>
    </div>
</template>

<script lang="ts">
import { SystemMessage, UserTextMessage, type IMessage } from '@/core/dialog/dialog_type';

    export default {
        data() {
            return {
                user_input : ""
            }
        },
        methods : {
            createMessage() : IMessage {
                return new UserTextMessage(this.user_input)
            },
            createSystemMessage() : IMessage {
                return new SystemMessage(this.user_input)
            }
        }
    }
</script>

<style scoped>
    #model_param_main {
        border: 1px dotted aquamarine;
        margin: 20px 10px;
        padding: 2% 1%;
    }
</style>