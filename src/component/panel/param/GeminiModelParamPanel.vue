
<template>
    <div class="param-card" id="gemini_model_param_main">
        <div class="card-title">Input</div>
        <textarea class="text_input" v-model="user_input"></textarea>
        <div class="card-title">Config</div>
        <div class="row">
            <div class="field">
                <span class="label">aspectRatio</span>
                <select v-model="aspect_ratio_option">
                    <option value="1:1">1:1</option>
                    <option value="2:3">2:3</option>
                    <option value="3:2">3:2</option>
                    <option value="3:4">3:4</option>
                    <option value="4:3">4:3</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                </select>
            </div>
            <div class="field">
                <span class="label">size</span>
                <select v-model="size_option">
                    <option value="1k">1k</option>
                    <option value="2k">2k</option>
                    <option value="4k">4k</option>
                </select>
            </div>
        </div>
        <div class="field" v-if="multi_modal_enable">
            <span class="label">output</span>
            <span class="row">
                <label class="switch">
                    <input type="checkbox" value="TEXT" @change="set_ouput_option" checked />
                    <span class="track"></span>
                    text
                </label>
                <label class="switch">
                    <input type="checkbox" value="IMAGE" @change="set_ouput_option" checked />
                    <span class="track"></span>
                    image
                </label>
            </span>
        </div>
        <div class="field">
            <span class="label">tool</span>
            <label class="switch">
                <input type="checkbox" value="google_search" @change="set_tools_option">
                <span class="track"></span>
                Google Search
            </label>
        </div>
        <div class="upload-row">
            <input multiple ref="img_input" accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
            <button class="btn-ghost" @click="selected_imgs_clear">clear</button>
        </div>
        <div class="preview-grid" v-if="imgs_preview.length > 0">
            <img class="img_preview" v-for="bimg in imgs_preview" v-bind:src="bimg"></img>
        </div>
    </div>
</template>

<script lang="ts">
import { SystemMessage, UserMixMessage, type IMessage } from '@/core/dialog/dialog_type';
import type { IModelSource } from '@/core/model/model_type';
import { writeError } from '@/core/util/log';
import { publicResource } from '@/core/util/router';
import { base64ToPath } from 'image-tools';
import { computed } from 'vue';

    export default {
        data() {
            return {
                user_input : "",
                imgs_input : [] as string[],
                imgs_preview : [] as string[],
                aspect_ratio_option : "1:1",
                size_option : "1k",
                ouput_option : { TEXT : true, IMAGE : true},
                tools_option : { use_google_search : false} as any,
                multi_modal_enable : computed(
                    () => (this.model_selected as string).endsWith("image")
                ),
                ready : true
            }
        },
        methods : {
            imgs_select(event : Event) : void {
                if (event.target != null && "files" in event.target) {
                    this.ready = false
                    let files = event.target.files as File[]
                    this.imgs_preview.concat(new Array(files.length).fill(publicResource.loadingImage))
                    this.loadImgFileAsBase64(files)
                }
            },
            set_ouput_option (event: Event) {
                interface CheckBox {
                    value : string
                    checked : boolean
                }
                let check_box = event.target as unknown as CheckBox
                this.ouput_option[check_box.value as "TEXT" | "IMAGE"] = check_box.checked
            },
            set_tools_option (event: Event) {
                interface CheckBox {
                    value : string
                    checked : boolean
                }
                let check_box = event.target as unknown as CheckBox
                this.tools_option[check_box.value] = check_box.checked
            },
            selected_imgs_clear() : void {
                (this.$refs.img_input as HTMLInputElement).value = ''
                this.imgs_input = []
                this.imgs_preview = []
            },
            async loadImgFileAsBase64(files: File[]) {
                async function loadfile(reader : FileReader, file : File) : Promise<string> {
                    return new Promise(
                        (resolve, reject) => {
                            reader.readAsDataURL(file);
                            reader.onload = () => { resolve(reader.result as string); }
                            reader.onerror = (error) => reject(error);
                        }
                    )
                }
                return new Promise(async () => {
                    const reader = new FileReader();
                    for(let idx = 0; idx < files.length; idx++) {
                        this.imgs_input.push(await loadfile(reader, files[idx]!))
                    }
                    this.imgs_input.forEach(
                        (val,idx) => base64ToPath(val).then(
                            path => this.imgs_preview[idx] = path,
                            err => writeError(err)
                        )
                    )
                    this.ready = true
                });
            },

            createConfig() : any {
                let responseModalities = undefined
                if (this.multi_modal_enable) {
                    responseModalities = [] as string[]
                    for (const opt of Object.keys(this.ouput_option) as Array<keyof typeof this.ouput_option> ) {
                        if (this.ouput_option[opt]) {
                            responseModalities.push(opt)
                        }
                    }
                }
                let tools : string[] = []
                for (const opt of Object.keys(this.tools_option)) {
                    if (this.tools_option[opt]) {
                        tools.push(opt)
                    }
                }
                return {
                    generationConfig : {
                        responseModalities : responseModalities,
                        imageConfig: {
                            aspectRatio: this.aspect_ratio_option,
                            imageSize: this.size_option,
                        },
                    },
                    tools : tools.length > 0 ? tools.map(
                        toolstr => {
                            let obj : any = {}
                            obj[toolstr] = {}
                            return obj
                        }
                    ) : undefined
                }
            },
            createMessage() : IMessage | null {
                if (this.ready)
                    return new UserMixMessage(this.user_input, this.imgs_input)
                else {
                    alert("not ready yet")
                    return null
                }
            },
            createSystemMessage() : IMessage {
                return new SystemMessage(this.user_input)
            }
        },
        props : ["model_selected"]
    }
</script>
