
<template>
    <div class="param-card" id="qwen_image_param_main">
        <div class="card-title">Input</div>
        <textarea class="text_input" v-model="user_input"></textarea>
        <div class="upload-row">
            <input multiple accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
            <button class="btn-ghost" @click="selected_imgs_clear">clear</button>
        </div>
        <details class="summary-card">
            <summary>Negative Prompt</summary>
            <textarea class="text_input" v-model="negative_input"></textarea>
        </details>
        <div class="preview-grid" v-if="imgs_preview.length > 0">
            <img class="img_preview" v-for="bimg in imgs_preview" v-bind:src="bimg"></img>
        </div>
    </div>
</template>

<script lang="ts">
import { SystemMessage, UserMixMessage, type IMessage } from '@/core/dialog/dialog_type';
import { writeError } from '@/core/util/log';
import { publicResource } from '@/core/util/router';
import { base64ToPath } from 'image-tools';

    export default {
        data() {
            return {
                user_input : "",
                negative_input : "",
                imgs_input : [] as string[],
                imgs_preview : [] as string[],
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
                    parameters : {
                        negative_prompt : this.negative_input != '' ? this.negative_input : undefined
                    }
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
    }
</script>
