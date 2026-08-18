
<template>
    <select 
        v-model="selected"  
        @change="$emit('model-update', selected)"
    >
        <option value="" disabled>choose a model…</option>
        <option v-for="api in model_api_list" v-bind:value="api">{{ api.name }}</option>
    </select>
</template>

<script lang="ts">
import { ModelSourceType, AImageModel, GeminiModel, LLMModel, XAiVideoModel, type IModel, ModelType, MiloraTTSModel, GPTImageModel, QwenImageModel, HappyHorseVideoModel, OpenRouterAPIModel, OpenRouterAPIVideoModel, SeedDreamImageModel } from '@/core/model/model_type';

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
        base_url : "https://api.cometapi.com/v1/images"
    }
    const ct_grok_video_model = {
        type : ModelSourceType.cometapi,
        base_url : "https://api.cometapi.com/grok/v1/videos"
    }
    const or_chat_model = {
        type : ModelSourceType.openrouter,
        base_url : "/api/openrouter/api/v1/chat/completions"
    }
    const or_video_model = {
        type : ModelSourceType.openrouter,
        base_url : "/api/openrouter/api/v1/videos"
    }
    const seedream_image_model = {
        type : ModelSourceType.bytedance,
        base_url : "https://ark.cn-beijing.volces.com/api/v3/images/generations"
    }
    const aliyun_beijing_qwen_model = {
        type : ModelSourceType.aliyun,
        base_url : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
    }
    const aliyun_beijing_happyhorse_model = {
        type : ModelSourceType.aliyun,
        base_url : "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis"
    }

    export default {
        data() {
            return {
                selected : null as IModel | null,
                model_api_list : [
                    new LLMModel("GPT-5.1", "gpt-5.1", [ct_chat_model]),
                    new LLMModel("Grok 4.1 Fast Reasoning", "grok-4-1-fast-reasoning", [ct_chat_model]),
                    new OpenRouterAPIModel(ModelType.llm, "Grok 4.3(OR)", "grok-4.3", [or_chat_model], 'x-ai'),
                    new GeminiModel(
                        "Gemini 2.5 flash image", 
                        "gemini-2.5-flash-image", 
                        [ct_gemini("gemini-2.5-flash-image")]
                    ),
                    new GeminiModel(
                        "Gemini 2.5 Pro", 
                        "gemini-2.5-pro", 
                        [ct_gemini("gemini-2.5-pro")]
                    ),
                    new GeminiModel(
                        "Gemini 3 flash", 
                        "gemini-3-flash", 
                        [ct_gemini("gemini-3-flash")]
                    ),
                    new GeminiModel(
                        "Gemini 3 Pro image", 
                        "gemini-3-pro-image", 
                        [ct_gemini("gemini-3-pro-image")]
                    ),
                    new GeminiModel(
                        "Gemini 3.1 Flash Image Preview", 
                        "gemini-3.1-flash-image-preview", 
                        [ct_gemini("gemini-3.1-flash-image")]
                    ),
                    // new GeminiModel(
                    //     "Gemini 3.5 Flash", 
                    //     "gemini 3.5 flash", 
                    //     [or_chat_model]
                    // ),
                    new OpenRouterAPIModel(ModelType.txt2img, "Recraft v4.1", "recraft-v4.1", [or_chat_model], 'recraft'),
                    new OpenRouterAPIModel(ModelType.txt2img, "Recraft v4.1 Pro", "recraft-v4.1-pro", [or_chat_model], 'recraft'),
                    new AImageModel("DouBao Seedream 4.5", "doubao-seedream-4-5-251128", [ct_image_model], ModelType.seedream_image),
                    new AImageModel("DouBao Seedream 5", "doubao-seedream-5-0-260128", [ct_image_model], ModelType.seedream_image),
                    new GPTImageModel("GPT-Image 1.5", "gpt-image-1.5", [ct_image_model], ModelType.gpt_image2),
                    new GPTImageModel("GPT-Image 1", "gpt-image-1", [ct_image_model], ModelType.gpt_image2),
                    new GPTImageModel("GPT-Image 2", "gpt-image-2", [ct_image_model], ModelType.gpt_image2),
                    new QwenImageModel("Qwen Image 2.0 Pro", "qwen-image-2.0-pro", [aliyun_beijing_qwen_model]),
                    new QwenImageModel("Qwen Image 2.0", "qwen-image-2.0", [aliyun_beijing_qwen_model]),
                    new QwenImageModel("Qwen Image Max", "qwen-image-max", [aliyun_beijing_qwen_model]),
                    new QwenImageModel("Wan2.6 t2i", "wan2.6-t2i", [aliyun_beijing_qwen_model]),
                    new SeedDreamImageModel("Seedream 5.0", "doubao-seedream-5-0-260128", [seedream_image_model]),
                    new SeedDreamImageModel("Seedream 5.0 Pro", "doubao-seedream-5-0-pro-260628", [seedream_image_model]),
                    new XAiVideoModel("Grok Imagine Video", "grok-imagine-video", [ct_grok_video_model]),
                    new OpenRouterAPIVideoModel('Grok Imagine Video(OR)', 'grok-imagine-video', [or_video_model], 'x-ai'),
                    new OpenRouterAPIVideoModel('Hailuo 2.3', 'hailuo-2.3', [or_video_model], 'minimax'),
                    new OpenRouterAPIVideoModel('Kling v3.0 Standard', 'kling-v3.0-std', [or_video_model], 'kwaivgi'),
                    new HappyHorseVideoModel("Happyhorse 1.0 i2v", "happyhorse-1.0-i2v", [aliyun_beijing_happyhorse_model]),
                    new HappyHorseVideoModel("Happyhorse 1.0 t2v", "happyhorse-1.0-t2v", [aliyun_beijing_happyhorse_model]),
                    new HappyHorseVideoModel("Wan2.7 i2v", "wan2.7-i2v", [aliyun_beijing_happyhorse_model]),
                    new HappyHorseVideoModel("Wan2.7 t2v", "wan2.7-t2v", [aliyun_beijing_happyhorse_model]),
                    new MiloraTTSModel(),
                ] as IModel[]
            }
        }
    }
</script>