
<template>
    <div class="param-card" id="video_model_param_main">
        <div class="card-title">Input</div>
        <textarea class="text_input" v-model="user_input"></textarea>
        <div class="card-title">Config</div>
        <div class="row">
            <div class="field">
                <span class="label">aspectRatio</span>
                <select v-model="aspect_ratio">
                    <option value="shouldn't be defined">auto</option>
                    <option value="1:1">1:1</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                </select>
            </div>
            <div class="field">
                <span class="label">duration</span>
                <input type="text" v-model="duration" @change="check_duration"/>
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
import { writeError } from '@/core/util/log';
import { publicResource } from '@/core/util/router';
import { base64ToPath } from 'image-tools';

    export default {
        data() {
            return {
                user_input : "",
                imgs_input : [] as string[],
                imgs_preview : [] as string[],
                duration : "8",
                aspect_ratio : "shouldn't be defined",
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

            check_duration(e : Event) {
                const _duration = Number.parseInt(this.duration)
                if (Number.isNaN(_duration) || _duration < 1 || _duration > 16) {
                    this.duration = "8"
                }
            },
            createConfig() : any {
                return {
                    duration : Number.parseInt(this.duration),
                    aspect_ratio : this.aspect_ratio == "shouldn't be defined" ? null : this.aspect_ratio
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
