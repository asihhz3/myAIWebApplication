
<template>
    <h4>dialog : {{ dialog_id }}</h4>
    <p class = "tips" v-if="is_new_dialog">this is a new dialog</p>
    <p class = "tips" v-else>this is a history dialog</p>
    <div>
        User name:
        <select v-model="user_selected_name">
            <option class = "dialog" v-for="pair in user_list.list">{{ pair.name }}</option>
        </select>
        <br></br>
        Model :
        <ModelSelect @model-update="setModel"></ModelSelect>
        <br></br>
        Source:
        <select v-model="model_source_selected">
            <option class 
            v-if="model_selected" 
            v-for="source in source_list"
            :value="source"
            >{{ source.type }}</option>
        </select>
        <br></br>
        <component v-if="param_selected" v-bind:is="param_selected" ref="param" v-bind:model_selected="model_selected!.id"></component>

        <button @click="systemOrder">System Order</button>
        <button @click="communicate">Send</button>
        <hr></hr>
        <button @click="test_user">Test User</button>
        <DialogueDisplay :current_dialog="dialog"/>
    </div>
    <hr></hr>
</template>

<script lang="ts">
    import { global_key_handle, UserIdentity } from '@/core/apikey/key_handle';
    import { client_dialog_history } from '@/core/dialog/dialog_history';
    import { Dialogue, SystemMessage } from '@/core/dialog/dialog_type'; 
    import { computed, ref, type Ref } from 'vue';
    import ModelSelect  from '@/component/select/ModelSelect.vue'
    import LLMModelParamPanel from './param/LLMModelParamPanel.vue';
import DialogueDisplay from '../display/DialogueDisplay.vue';
import type { IParamPanel } from '@/core/util/component_type';
import { type IModel,  type IModelSource,  ModelType } from '@/core/model/model_type';
import MixModelParamPanel from './param/MixModelParamPanel.vue';
import GeminiModelParamPanel from './param/GeminiModelParamPanel.vue';
import VideoModelParamPanel from './param/VideoModelParamPanel.vue';
import SeedreamModelParamPanel from './param/SeedreamModelParamPanel.vue';
import { writeLog } from '@/core/util/log';
import TTSModelParamPanel from './param/TTSModelParamPanel.vue';
import GPTImage2ParamPanel from './param/GPTImage2ParamPanel.vue';
import HappyHorseParamPanel from './param/HappyHorseParamPanel.vue';
import QwenImageParamPanel from './param/QwenImageParamPanel.vue';

    let new_dialog : Ref<Dialogue | null> = ref(null)
    export default {
        data () {
            return {
                user_list : global_key_handle,
                user_selected_name : null as string | null,
                model_selected : null as IModel | null,
                model_source_selected : null as IModelSource | null,
                is_new_dialog : computed(() => new_dialog.value != null ),
                dialog : computed(() => {
                    if (client_dialog_history.hasHistory(this.dialog_id))
                        return client_dialog_history.getHistory(this.dialog_id)!.dialog
                    else {
                        if (new_dialog.value == null) {
                            new_dialog.value = new Dialogue(
                                this.dialog_id,
                                new SystemMessage("you are a helpful ai.")
                            )
                        }
                        return new_dialog.value
                    }
                })
            }
        },
        computed : {
            param_selected() {
                if (this.model_selected) {
                    switch (this.model_selected.type) {
                        case ModelType.llm:
                            return "LLMModelParamPanel"
                        case ModelType.tts:
                            return "TTSModelParamPanel"
                        case ModelType.gemini_image:
                            return "GeminiModelParamPanel"
                        case ModelType.video:
                            return "VideoModelParamPanel"
                        case ModelType.seedream_image:
                            return "SeedreamModelParamPanel"
                        case ModelType.gpt_image2:
                            return "GPTImage2ParamPanel"
                        case ModelType.qwen_image:
                            return "QwenImageParamPanel"
                        case ModelType.happy_horse:
                            return "HappyHorseParamPanel"
                        case ModelType.mix:
                        default:
                            return "MixModelParamPanel"
                    }
                }
                return null;
            },
            user_selected() {
                return this.user_list.list.find(pair => pair.name == this.user_selected_name) || null
            },
            source_list() {
                if (!this.model_selected) {
                    return null
                }
                const a = this.model_selected.source.filter(_source => this.user_selected && this.user_selected.key_list.some(api => api.source_type == _source.type))
                return this.model_selected.source.filter(_source => this.user_selected && this.user_selected.key_list.some(api => api.source_type == _source.type))
            }
        },
        props : ["dialog_id"],
        methods : {
            setModel(val : IModel | null) {
                this.model_selected = val
                this.model_source_selected = null
            },
            communicate() {
                if (!this.model_selected) {
                    alert("model has not been selected!")
                    return
                }
                if (!this.user_selected_name) {
                    alert("user has not been selected!")
                    return
                }
                if (!this.user_selected) {
                    alert("user is invaild!")
                    return
                }
                if (!this.model_source_selected) {
                    alert("no suitable source!")
                    return
                }
                const user_message = (this.$refs.param as IParamPanel).createMessage()
                // const source = (this.$refs.param as IParamPanel).getSource()
                const user_config = (this.$refs.param as IParamPanel).createConfig()
                const selected_api = this.user_selected.key_list.find(key_pair => key_pair.source_type == this.model_source_selected!.type)
                if (!selected_api) {
                    alert("no suitable api key")
                    throw "no suitable api key"
                }
                if (user_message == null) {
                    return
                }
                this.dialog.quene.push(user_message)
                this.model_selected.sendRequest(selected_api.key, this.dialog, this.model_source_selected, user_config).then(
                    msg => {
                        if (msg) {
                            this.dialog.quene.push(msg)
                        }
                    }
                ).finally(
                    () => writeLog("The conversation is over.")
                )
            },
            test_user() {
                if (!this.model_selected) {
                    alert("model has not been selected!")
                    return
                }
                if (!this.user_selected_name) {
                    alert("user has not been selected!")
                    return
                }
                let user_message = (this.$refs.param as IParamPanel).createMessage()
                if (user_message == null) {
                    alert("message has not ready")
                    return
                }
                this.dialog.quene.push(user_message)
            },

            systemOrder() {
                let system = (this.$refs.param as IParamPanel).createSystemMessage()
                this.dialog.quene.push(system)
            }
        },
        components : {
            "ModelSelect" : ModelSelect,
            "LLMModelParamPanel" : LLMModelParamPanel,
            "MixModelParamPanel" : MixModelParamPanel,
            "GeminiModelParamPanel" : GeminiModelParamPanel,
            "VideoModelParamPanel" : VideoModelParamPanel,
            "DialogueDisplay" : DialogueDisplay,
            "SeedreamModelParamPanel" : SeedreamModelParamPanel,
            "GPTImage2ParamPanel" : GPTImage2ParamPanel,
            "TTSModelParamPanel" : TTSModelParamPanel,
            "HappyHorseParamPanel" : HappyHorseParamPanel,
            "QwenImageParamPanel" : QwenImageParamPanel,
        }
    }
</script>

<style>
    .text_input {
        overflow-y: auto;
        height: 40px;
        width: 90%;
        margin: 8px 0px;
        resize: vertical;
    }
</style>

<style scoped>
    .dialog {
        margin: 10px 2px;
    }
    .tips {
        font-size: x-small;
        color: gray;
    }
</style>

