
<template>
    <div class="panel">
        <div class="panel-head">
            <div class="dialog-title">dialog · {{ dialog_id }}</div>
            <span class="badge" :class="is_new_dialog ? 'badge-new' : 'badge-hist'">
                {{ is_new_dialog ? 'new dialog' : 'history' }}
            </span>
        </div>

        <div class="field">
            <span class="label">User</span>
            <select v-model="user_selected_name">
                <option v-for="pair in user_list.list" :key="pair.name" :value="pair.name">{{ pair.name }}</option>
            </select>
        </div>

        <div class="field">
            <span class="label">Model</span>
            <ModelSelect @model-update="setModel"></ModelSelect>
        </div>

        <div class="field" v-if="model_selected">
            <span class="label">Source</span>
            <select v-model="model_source_selected">
                <option
                    v-if="model_selected"
                    v-for="source in source_list"
                    :key="source.type"
                    :value="source"
                >{{ source.type }}</option>
            </select>
        </div>

        <component
            v-if="param_selected"
            v-bind:is="param_selected"
            ref="param"
            v-bind:model_selected="model_selected!.id"
        ></component>

        <div class="actions">
            <button class="btn-accent" @click="communicate">Send</button>
            <button class="btn-ghost" @click="systemOrder">System</button>
            <button class="btn-ghost" @click="test_user">Test</button>
        </div>
    </div>
</template>

<script lang="ts">
    import { global_key_handle, UserIdentity } from '@/core/apikey/key_handle';
    import { client_dialog_history } from '@/core/dialog/dialog_history';
    import { Dialogue, SystemMessage } from '@/core/dialog/dialog_type'; 
    import { computed, ref, type Ref } from 'vue';
    import ModelSelect  from '@/component/select/ModelSelect.vue'
    import LLMModelParamPanel from './param/LLMModelParamPanel.vue';
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

    export default {
        data () {
            return {
                user_list : global_key_handle,
                user_selected_name : null as string | null,
                model_selected : null as IModel | null,
                model_source_selected : null as IModelSource | null,
                is_new_dialog : computed(() => !client_dialog_history.hasHistory(this.dialog_id)),
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
                return this.model_selected.source.filter(_source => this.user_selected && this.user_selected.key_list.some(api => api.source_type == _source.type))
            }
        },
        props : {
            dialog_id : { type : String, required : true },
            dialog : { type : Object as () => Dialogue, required : true }
        },
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
            "SeedreamModelParamPanel" : SeedreamModelParamPanel,
            "GPTImage2ParamPanel" : GPTImage2ParamPanel,
            "TTSModelParamPanel" : TTSModelParamPanel,
            "HappyHorseParamPanel" : HappyHorseParamPanel,
            "QwenImageParamPanel" : QwenImageParamPanel,
        }
    }
</script>

<style scoped>
    .panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
    }
    .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
    }
    .dialog-title {
        font-size: 12px;
        font-weight: 650;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .badge {
        flex: none;
        font-size: 11px;
        font-weight: 650;
        padding: 2px 10px;
        border-radius: var(--radius-full);
    }
    .badge-new {
        color: var(--accent-contrast);
        background: var(--accent);
        box-shadow: 0 0 10px var(--accent-glow);
    }
    .badge-hist {
        color: var(--info);
        background: rgba(34, 211, 238, 0.12);
    }
    .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        margin-bottom: var(--space-3);
    }
    .label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }
    .actions {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-4);
    }
    .actions .btn-accent {
        flex: 1;
    }
</style>
