
<template>
    <div class="param-card" id="happy_horse_param_main">
        <div class="card-title">Input</div>
        <textarea class="text_input" v-model="user_input"></textarea>
        <div class="card-title">Config</div>
        <div class="row">
            <div class="field">
                <span class="label">resolution</span>
                <select v-model="resolution">
                    <option value="720P">720P</option>
                    <option value="1080P">1080P</option>
                </select>
            </div>
            <div class="field">
                <span class="label">duration</span>
                <input type="text" v-model="duration" @change="check_duration"/>
            </div>
            <div class="field">
                <span class="label">watermark</span>
                <label class="switch">
                    <input type="checkbox" v-model="watermark"/>
                    <span class="track"></span>
                </label>
            </div>
        </div>
        <div class="field" v-if="model_selected && model_selected.endsWith('i2v')">
            <span class="label">Image</span>
            <div class="upload-row">
                <input accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
                <button class="btn-ghost" @click="selected_imgs_clear">clear</button>
            </div>
            <div class="preview-grid" v-if="imgs_preview.length > 0">
                <img class="img_preview" v-for="bimg in imgs_preview" v-bind:src="bimg" ></img>
            </div>
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
                resolution : '720P',
                watermark : true,
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
                if (Number.isNaN(_duration) || _duration < 3 || _duration > 15) {
                    this.duration = "8"
                }
            },
            createConfig() : any {
                return {
                    parameters : {
                        duration : Number.parseInt(this.duration),
                        resolution : this.resolution,
                        watermark : this.watermark
                    }
                }
            },
            createMessage() : IMessage | null {
                if (this.model_selected && this.model_selected.endsWith("i2v") && this.imgs_input.length == 0) {
                    alert("must select one image for first frame")
                    return null;
                }
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
        props : {
            model_selected : String
        }
    }
</script>
