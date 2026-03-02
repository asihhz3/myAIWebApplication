
<template>
    <div id = "llm_model_param_main">
        Config
        <div>
            stream:
            <span v-for="val in ['true', 'false']">
                <input type="radio" name="stream" v-bind:value="val" v-model="stream">{{ val }}</input>
            </span>
        </div>
        <div>
            temperature:
            <input type="range" max="100" min="0" v-model="temperature_rate">{{ temperature_rate / 100 }}</input>
        </div>
        <div>
            top p:
            <input type="range" max="100" min="0" v-model="top_p_rate">{{ top_p_rate / 100 }}</input>
        </div>
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
                user_input : "",
                stream : "true",
                temperature_rate : 60,
                top_p_rate : 100
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
                    stream : this.stream == "true",
                    temperature : this.temperature_rate / 100,
                    top_p : this.top_p_rate / 100,
                }
            }
        },
    }
</script>

<style scoped>
    #llm_model_param_main {
        border: 1px dotted aquamarine;
        margin: 20px 10px;
        padding: 2% 1%;
    }
</style>