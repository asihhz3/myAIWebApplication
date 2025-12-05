
<template>
    <div id = "model_param_main">
        Input :
        <br></br>
        <textarea class="text_input" v-model="user_input" >{{ user_input }}</textarea>
        <br></br>
        <span>
            Image :
            <input multiple accept="image/png, image/jpeg" type="file" @change="imgs_select"></input>
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
import { publicResource } from '@/core/util/router';
import { base64ToPath } from 'image-tools';

    export default {
        data() {
            return {
                user_input : "",
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
                    this.imgs_preview = new Array(files.length).fill(publicResource.loadingImage)
                    this.loadImgFileAsBase64(files)
                }
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
                    this.imgs_input = Array(files.length)
                    for(let idx = 0; idx < files.length; idx++) {
                        let base64_str = await loadfile(reader, files[idx]!)
                        this.imgs_input[idx] = base64_str
                    }
                    this.imgs_input.forEach(
                        (val,idx) => base64ToPath(val).then(
                            path => this.imgs_preview[idx] = path,
                            err => console.error(err)
                        )
                    )
                    this.ready = true
                });
            },

            createConfig() : any {
                return {
                }
            },
            createMessage() : IMessage | null {
                if (this.ready)
                    return new UserMixMessage(this.user_input, this.imgs_input)
                else
                    return null
            },
            createSystemMessage() : IMessage {
                return new SystemMessage(this.user_input)
            }
        },
    }
</script>

<style scoped>
    #model_param_main {
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