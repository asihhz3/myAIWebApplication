
<template>
    <select 
        v-model="selected"  
        @change="$emit('model-update', selected)"
    >
        <option v-for="api in model_api_list" v-bind:value="api">{{ api.name }}</option>
    </select>
</template>

<script lang="ts">
import { ModelSourceType, AImageModel, GeminiModel, LLMModel, XAiVideoModel, type IModel, ModelType, MiloraTTSModel } from '@/core/model/model_type';

    const ct_chat_model = {
        type : ModelSourceType.cometapi,
        base_url : "https://api.cometapi.com/v1/chat/completions"
    }
    function ct_gemini(id : string) {
        return {
            type : ModelSourceType.cometapi,
            base_url : `https://api.cometapi.com/v1beta/models/${id}:generateContent`
        }
    }
    const ct_image_model = {
        type : ModelSourceType.cometapi,
        base_url : "https://api.cometapi.com/v1/images/generations"
    }
    const ct_grok_video_model = {
        type : ModelSourceType.cometapi,
        base_url : "https://api.cometapi.com/grok/v1/videos"
    }


    export default {
        data() {
            return {
                selected : null as IModel | null,
                model_api_list : [
                    new LLMModel("GPT-5.1", "gpt-5.1", [ct_chat_model]),
                    new LLMModel("Grok 4.1 Fast Reasoning", "grok-4-1-fast-reasoning", [ct_chat_model]),
                    new GeminiModel(
                        "Gemini 2.5 flash image", 
                        "gemini-2.5-flash-image", 
                        [ct_gemini("gemini-2.5-flash-image")]
                    ),
                    new GeminiModel(
                        "Gemini 3 Pro image", 
                        "gemini-3-pro-image", 
                        [ct_gemini("gemini-3-pro-image")]
                    ),
                    new AImageModel("DouBao Seedream 4.5", "doubao-seedream-4-5-251128", [ct_image_model], ModelType.seedream_image),
                    new AImageModel("DouBao Seedream 5", "doubao-seedream-5-0-260128", [ct_image_model], ModelType.seedream_image),
                    new XAiVideoModel("Grok Imagine Video", "grok-imagine-video", [ct_grok_video_model]),
                    new MiloraTTSModel(),
                ] as IModel[]
            }
        },
        methods : {
        },
        watch : {
        }
    }
</script>