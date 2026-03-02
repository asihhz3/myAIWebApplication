

<template>
    <div id = "gemini_model_param_main">
        Input :
        <br></br>
        <textarea class="text_input" v-model="user_input" >{{ user_input }}</textarea>
        <br></br>
        Config : 
        <div>
            <span>
                aspectRatio
                <select v-model="aspect_ratio_option">
                    <option  value="1:1">1:1</option>
                    <option  value="2:3">2:3</option>
                    <option  value="3:2">3:2</option>
                    <option  value="3:4">3:4</option>
                    <option  value="4:3">4:3</option>
                    <option  value="16:9">16:9</option>
                    <option  value="9:16">9:16</option>
                </select>
            </span>
            <span>
                size
                <select v-model="size_option">
                    <option  value="1k">1k</option>
                    <option  value="2k">2k</option>
                    <option  value="4k">4k</option>
                </select>
            </span>
            <div>
                ouput: 
                <span>
                    text
                    <input type="checkbox" value="TEXT" @change="set_ouput_option" checked />
                </span>
                <span>
                    image
                    <input type="checkbox" value="IMAGE" @change="set_ouput_option" checked />
                </span>
            </div>
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
import { publicResource } from '@/core/util/router';
import { base64ToPath } from 'image-tools';

    export default {
        data() {
            return {
                user_input : "",
                imgs_input : [] as string[],
                imgs_preview : [] as string[],
                aspect_ratio_option : "1:1",
                size_option : "1k",
                ouput_option : { TEXT : true, IMAGE : true},
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
                for (const opt of Object.keys(this.ouput_option) as Array<keyof typeof this.ouput_option> ) {
                    this.ouput_option[opt] = check_box.checked
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
                            err => console.error(err)
                        )
                    )
                    this.ready = true
                });
            },

            createConfig() : any {
                let responseModalities = [] as string[]
                for (const opt of Object.keys(this.ouput_option) as Array<keyof typeof this.ouput_option> ) {
                    if (this.ouput_option[opt]) {
                        responseModalities.push(opt)
                    }
                }
                return {
                    responseModalities : responseModalities,
                    imageConfig: {
                        aspectRatio: this.aspect_ratio_option,
                        imageSize: this.size_option,
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

<style scoped>
    #gemini_model_param_main {
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