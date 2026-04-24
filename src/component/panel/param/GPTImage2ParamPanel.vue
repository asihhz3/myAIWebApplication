

<template>
    <div id = "gptimage2_model_param_main">
        Input :
        <br></br>
        <textarea class="text_input" v-model="user_input" >{{ user_input }}</textarea>
        <br></br>
        Config : 
        <div>
            <span>
                size
                <select v-model="size_option">
                    <option  value="1024x1024">1024x1024</option>
                    <option  value="1536x1024">1536x1024</option>
                    <option  value="1024x1536">1024x1536</option>
                    <option  value="2048x2048">2048x2048</option>
                    <option  value="2048x1152">2048x1152</option>
                    <option  value="3840x2160">3840x2160</option>
                    <option  value="2160x3840">2160x3840</option>

                </select>
            </span>
            <br></br>
            <span>
                quality
                <select v-model="ouput_quality">
                    <option  value="low">low</option>
                    <option  value="medium">medium</option>
                    <option  value="high">high</option>
                </select>
            </span>
            <br></br>
            <span>
                guidance_scale 
                <input type="text" @change="checkGuidanceScale" v-model="guidance_scale"/>
            </span>
        </div>
        <div>
        </div>
        <span>
            Image :
            <input multiple accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
            <input type="button" @click="selected_imgs_clear" value="clear"></input>
        </span>
        <div v-if="imgs_preview.length > 0">
            preview:
            <br></br>
            <img class = "img_preview" v-for="bimg in imgs_preview" v-bind:src="bimg"></img>
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

<style scoped>
    #gptimage2_model_param_main {
        border: 1px dotted aqua;
        margin: 20px 10px;
        padding: 2% 1%;
    }
    .img_preview {
        width: 128px;
        height: 128px;
        object-fit: cover;
    }
</style>