
<template>
    <div class="param-card" id="sdream_model_param_main">
        <div class="card-title">Input</div>
        <textarea class="text_input" v-model="user_input"></textarea>
        <div class="card-title">Config</div>
        <div class="row">
            <div class="field">
                <span class="label">size</span>
                <select v-model="size_option">
                    <option value="2k">2k</option>
                    <option value="3k">3k</option>
                    <option value="4k">4k</option>
                </select>
            </div>
            <div class="field">
                <span class="label">watermark</span>
                <label class="switch">
                    <input type="checkbox" v-model="watermark"/>
                    <span class="track"></span>
                </label>
                <span class="label">background</span>
                <label class="switch">
                    <input type="checkbox" v-model="background"/>
                    <span class="track"></span>
                </label>
            </div>
        </div>
        <div class="upload-row">
            <input multiple accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
            <button class="btn-ghost" @click="selected_imgs_clear">clear</button>
        </div>
        <div class="preview-grid" v-if="imgs_preview.length > 0">
            <img class="img_preview" v-for="bimg in imgs_preview" v-bind:src="bimg"></img>
        </div>
    </div>
</template>

<script lang="ts">
import { SystemMessage, UserMixMessage, type IMessage } from '@/core/dialog/dialog_type';
import { writeError, writeLog } from '@/core/util/log';
import { publicResource } from '@/core/util/router';
import { base64ToPath } from 'image-tools';

    export default {
        data() {
            return {
                user_input : "",
                imgs_input : [] as string[],
                imgs_preview : [] as string[],
                size_option : "2k",
                guidance_scale : 3,
                watermark : true,
                background : true,
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
            selected_imgs_clear() : void {
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
                return {
                    size : this.size_option,
                    watermark : this.watermark,
                    background : this.background ? "opaque" : "transparent"
                    // guidance_scale : this.guidance_scale
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
            },
            checkGuidanceScale(e : Event) {
                writeLog( "select size:" + this.size_option)
                if (typeof this.guidance_scale != "number" || Number.isNaN(this.guidance_scale) || this.guidance_scale < 1 || this.guidance_scale > 16) {
                    this.guidance_scale = 3
                }
            },
        },
    }
</script>
