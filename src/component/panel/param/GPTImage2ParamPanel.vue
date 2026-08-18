
<template>
    <div class="param-card" id="gptimage2_model_param_main">
        <div class="card-title">Input</div>
        <textarea class="text_input" v-model="user_input"></textarea>
        <div class="card-title">Config</div>
        <div class="row">
            <div class="field">
                <span class="label">size</span>
                <select v-model="size_option">
                    <option value="1024x1024">1024x1024</option>
                    <option value="1536x1024">1536x1024</option>
                    <option value="1024x1536">1024x1536</option>
                    <option value="2048x2048">2048x2048</option>
                    <option value="2048x1152">2048x1152</option>
                    <option value="3840x2160">3840x2160</option>
                    <option value="2160x3840">2160x3840</option>
                </select>
            </div>
            <div class="field">
                <span class="label">quality</span>
                <select v-model="ouput_quality">
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                </select>
            </div>
            <div class="field">
                <span class="label">guidance scale</span>
                <input type="text" @change="checkGuidanceScale" v-model="guidance_scale"/>
            </div>
        </div>
        <div class="upload-row">
            <input ref="img_input" accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
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
                size_option : "1024x1024",
                ouput_quality : "low",
                guidance_scale : 3,
                ready : true
            }
        },
        methods : {
            imgs_select(event : Event) : void {
                if (event.target != null && "files" in event.target) {
                    this.ready = false
                    let files = event.target.files as File[]
                    if (files.length < 0) {
                        return;
                    }
                    this.imgs_preview.concat(new Array(files.length).fill(publicResource.loadingImage))
                    this.loadImgFileAsBase64(files[0]!)
                }
            },
            selected_imgs_clear() : void {
                (this.$refs.img_input as HTMLInputElement).value = ""
                this.imgs_input = []
                this.imgs_preview = []
            },
            async loadImgFileAsBase64(file: File) {
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
                    this.imgs_input[0] = await loadfile(reader, file)
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
                    quality : this.ouput_quality
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
        }
    }
</script>
