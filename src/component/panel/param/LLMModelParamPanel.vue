
<template>
    <div class="param-card" id="llm_model_param_main">
        <div class="card-title">Config</div>
        <div class="field">
            <span class="label">stream</span>
            <span class="pills">
                <label v-for="val in ['true', 'false']">
                    <input type="radio" name="stream" v-bind:value="val" v-model="stream">{{ val }}
                </label>
            </span>
        </div>
        <div class="field">
            <span class="label">temperature · {{ temperature_rate / 100 }}</span>
            <input type="range" max="100" min="0" v-model="temperature_rate">
        </div>
        <div class="field">
            <span class="label">top p · {{ top_p_rate / 100 }}</span>
            <input type="range" max="100" min="0" v-model="top_p_rate">
        </div>
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
