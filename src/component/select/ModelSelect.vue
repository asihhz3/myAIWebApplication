
<template>
    <select 
        v-model="selected"  
        @change="$emit('model-update', selected)"
    >
        <option v-for="api in model_api_list" v-bind:value="api">{{ api.name }}</option>
    </select>
</template>

<script lang="ts">
import { AImageModel, GeminiModel, LLMModel, XAiVideoModel, type IModel } from '@/core/model/model_type';

    const chat_model_base_url = "https://api.cometapi.com/v1/chat/completions"
    const image_model_base_url = "https://api.cometapi.com/v1/images/generations"
    const grok_video_model_base_url = "https://api.cometapi.com/grok/v1/videos"
    export default {
        data() {
            return {
                selected : null as IModel | null,
                model_api_list : [
                    new LLMModel("GPT-5.1", "gpt-5.1", chat_model_base_url),
                    new LLMModel("Grok 4.1 Fast Reasoning", "grok-4-1-fast-reasoning", chat_model_base_url),
                    new GeminiModel("Gemini 2.5 flash image", "gemini-2.5-flash-image"),
                    new GeminiModel("gemini-3-pro-image-preview", "gemini-3-pro-image-preview"),
                    new AImageModel("DouBao Seedream 4.5", "doubao-seedream-4-5-251128", image_model_base_url),
                    new XAiVideoModel("Grok Imagine Video", "grok-imagine-video", grok_video_model_base_url)
                ] as IModel[]
            }
        },
        methods : {
        },
        watch : {
        }
    }
</script>