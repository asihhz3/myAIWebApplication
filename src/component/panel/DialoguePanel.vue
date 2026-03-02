
<template>
    <h4>dialog : {{ dialog_id }}</h4>
    <p class = "tips" v-if="is_new_dialog">this is a new dialog</p>
    <p class = "tips" v-else>this is a history dialog</p>
    <div>
        User name:
        <select v-model="user_selected">
            <option class = "dialog" v-for="pair in user_list.list">{{ pair.user }}</option>
        </select>
        <br></br>
        Model :
        <ModelSelect @model-update="setModel"></ModelSelect>
        <br></br>
        <component v-if="param_selected" v-bind:is="param_selected" ref="param"></component>

        <button @click="systemOrder">System Order</button>
        <button @click="communicate">Send</button>
        <hr></hr>
        <button @click="test_user">Test User</button>
        <DialogueDisplay :current_dialog="dialog"/>
    </div>
    <hr></hr>
</template>

<script lang="ts">
    import { global_key_handle } from '@/core/apikey/key_handle';
    import { client_dialog_history } from '@/core/dialog/dialog_history';
    import { Dialogue, SystemMessage } from '@/core/dialog/dialog_type'; 
    import { computed, ref, type Ref } from 'vue';
    import ModelSelect  from '@/component/select/ModelSelect.vue'
    import { sendRequest } from '@/core/request/request';
    import LLMModelParamPanel from './param/LLMModelParamPanel.vue';
import DialogueDisplay from '../display/DialogueDisplay.vue';
import type { IParamPanel } from '@/core/util/component_type';
import { type IModel,  ModelType } from '@/core/model/model_type';
import MixModelParamPanel from './param/MixModelParamPanel.vue';
import GeminiModelParamPanel from './param/GeminiModelParamPanel.vue';
import VideoModelParamPanel from './param/VideoModelParamPanel.vue';

    let new_dialog : Ref<Dialogue | null> = ref(null)
    export default {
        data () {
            return {
                user_list : global_key_handle,
                user_selected : null as string | null,
                model_selected : null as IModel | null,
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
                        case ModelType.gemini_image:
                            return "GeminiModelParamPanel"
                        case ModelType.video:
                            return "VideoModelParamPanel"
                        case ModelType.mix:
                        default:
                            return "MixModelParamPanel"
                    }
                }
                return null;
            }
        },
        props : ["dialog_id"],
        methods : {
            setModel(val : IModel | null) {
                console.log(`selected : `)
                console.log(val)
                this.model_selected = val
            },
            communicate() {
                if (!this.model_selected) {
                    alert("model has not been selected!")
                    return
                }
                if (!this.user_selected) {
                    alert("user has not been selected!")
                    return
                }
                let user_key = this.user_list.list.find(pair => pair.user == this.user_selected)!.key
                let user_message = (this.$refs.param as IParamPanel).createMessage()
                let user_config = (this.$refs.param as IParamPanel).createConfig()
                if (user_message == null) {
                    return
                }
                this.dialog.quene.push(user_message)
                this.model_selected.sendRequest(user_key, this.dialog, user_config).then(
                // sendRequest(this.model_selected, user_key, this.dialog, user_config).then(
                    msg => {
                        if (msg) {
                            this.dialog.quene.push(msg)
                        }
                    }
                )
            },
            test_user() {
                if (!this.model_selected) {
                    alert("model has not been selected!")
                    return
                }
                if (!this.user_selected) {
                    alert("user has not been selected!")
                    return
                }
                let user_message = (this.$refs.param as IParamPanel).createMessage()
                if (user_message == null) {
                    alert("message has not ready")
                    return
                }
                this.dialog.quene.push(user_message)
                console.log(this.dialog.quene)
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

