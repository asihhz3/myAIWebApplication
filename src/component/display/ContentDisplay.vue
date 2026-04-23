
<template>
    <div v-bind:class="(value as IDisplayValue).role">
        <div>
            <p v-bind:hidden="is_edit_mode">{{ txt_content }}</p>
            <textarea wrap="soft" v-model="edit_content" :hidden="!is_edit_mode" style="width: 90%;"></textarea>
        </div>
        <div id="content_images">
            <img class="img" v-if="imgs" v-for="(bimg, idx) in imgs.value" :key="idx" :src="bimg" ></img>
        </div>
        <video v-if="value && value.video_url" controls>
            <source v-bind:src="value.video_url" type="video/mp4" />
        </video>
        <audio v-if="value && value.audio_url">
            <source v-bind:src="value.audio_url" type="audio/mp3" />
        </audio>
        <div>
            <input type="button" value="delete" @click="$emit('delete_message', value!.message_id)" />
            <input type="button" value="edit" @click="switch_edit_mode" :hidden="txt_content.length == 0 || is_edit_mode"/>
            <input type="button" value="cancle" @click="abandon_changes" :hidden="!is_edit_mode"/>
            <input type="button" value="save" @click="save_changes" :hidden="!is_edit_mode"/>
        </div>
    </div>
</template>

<script lang="ts">
    import { type IDisplayValue } from '@/core/util/display_type';
    import { computed, ref, type Ref } from 'vue';
    import { base64ToPath, pathToBase64 } from 'image-tools'
import { publicResource } from '@/core/util/router';
import Viewer from 'viewerjs';
import { writeError } from '@/core/util/log';
    export default {
        data() {
            return {
                txt_content :computed(
                    () => {
                        if (!this.value) {
                            return ""
                        }
                        if (typeof this.value.content == "string") {
                            return this.value.content
                        }
                        else {
                            writeError("unexpected error: invaild content type")
                            return ""
                        }
                    }
                ),
                imgs : computed(
                    () => {
                        if (this.value) {
                            const imgs_url_beg = (this.value.base64imgs ? this.value.base64imgs.length : 0)
                            const size =    
                                (this.value.imgs_url ? this.value.imgs_url.length : 0) + imgs_url_beg
                            let imgs_arr : Ref<string[]>= ref(Array(size).fill(publicResource.loadingImage))
                            if (this.value.base64imgs) {
                                this.value.base64imgs.forEach(
                                    (val, idx) => base64ToPath(val).then(
                                        path => imgs_arr.value[idx] = path,
                                        err => writeError(err)
                                    )
                                )
                            }
                            if (this.value.imgs_url) {
                                this.value.imgs_url.forEach(
                                    (val, idx) => imgs_arr.value[idx + imgs_url_beg] = val
                                )
                            }
                            return imgs_arr
                        }
                        return null
                    }
                ),
                is_edit_mode : ref(false),
                edit_content : this.value && typeof this.value.content == "string" ? this.value.content : "",
                img_gallery : null as null | Viewer
            }
        },
        methods : {
            switch_edit_mode() {
                this.is_edit_mode = true
            },
            abandon_changes() {
                this.edit_content = this.value && typeof this.value.content == "string" ? this.value.content : ""
                this.is_edit_mode = false
            },
            save_changes() {
                if (this.value) {
                    this.value.content = this.edit_content
                }
                this.is_edit_mode = false
            },
        },
        watch : {
        },
        props : {
            value : Object as () => IDisplayValue
        },
        mounted() {
        },
        beforeUnmount() {
            this.img_gallery?.destroy()
            this.img_gallery = null
        }
    }
</script>

<style scoped>
    .user {
        color: cadetblue;
        border: 1px solid cadetblue; 
        float:left;
        clear:both;
        padding: 2px 12px;
    }
    .assistant {
        color: coral;
        border: 1px solid coral; 
        float:right;
        padding: 2px 12px;
        clear:both;
    }
    .system{
        color : gray;
        font-size: small;
        font-style: italic;
    }
    .img {
        float: left;
        margin: 4px 4px;
        height: 90%;
        width: 90%;
    }
</style>