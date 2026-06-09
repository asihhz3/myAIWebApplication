
<template>
    <div id = "happy_horse_param_main">
        Input :
        <br></br>
        <textarea class="text_input" v-model="user_input" >{{ user_input }}</textarea>
        <br></br>
        <div>
            Config : 
            <div>
                Resolution
                <select v-model="resolution">
                    <option value="720P">720P</option>
                    <option value="1080P">1080P</option>
                </select>
            </div>
            <div>
                Duration 
                <input type="text" v-model="duration" @change="check_duration"/>
            </div>

            <div>
                Watermark 
                <input type='checkbox' v-model="watermark"/>
            </div>
        </div>
        <div v-if="model_selected && model_selected.endsWith('i2v')">
            <span>
                Image :
                <input accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
                <input type="button" @click="selected_imgs_clear" value="clear"></input>
            </span>
            <div v-if="imgs_preview.length > 0">
                preview:
                <br></br>
                <img class = "img_preview" v-for="bimg in imgs_preview" v-bind:src="bimg" ></img>
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

<style scoped>
    #happy_horse_param_main {
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