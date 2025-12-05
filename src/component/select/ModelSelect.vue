
<template>
    <select 
        v-model="selected"  
        @change="$emit('model-update', selected)"
    >
        <option v-for="api in llm_api_list" v-bind:value="api">{{ api.name }}</option>
    </select>
</template>

<script lang="ts">
import { GeminiModel, ModelType, type IModel } from '@/core/model/model_type';

    export default {
        data() {
            return {
                selected : null as IModel | null,
                llm_api_list : [
                    {
                        name : "GPT-5.1",
                        type : ModelType.llm,
                        id : "gpt-5.1"
                    },
                    {
                        name : "Grok 4.1 Fast Reasoning",
                        type : ModelType.llm,
                        id : "grok-4-1-fast-reasoning"
                    },
                    new GeminiModel("Gemini 2.5 flash image", "gemini-2.5-flash-image"),
                    new GeminiModel("gemini-3-pro-image", "gemini-3-pro-image")
                ] as IModel[]
            }
        },
        methods : {
        },
        watch : {
        }
    }
</script>