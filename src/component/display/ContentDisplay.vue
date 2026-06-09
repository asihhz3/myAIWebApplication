
<template>
    <div v-bind:class="(value as IDisplayValue).role">
        <div>
            <p v-bind:hidden="is_edit_mode">{{ txt_content }}</p>
            <textarea wrap="soft" v-model="edit_content" :hidden="!is_edit_mode" style="width: 90%;"></textarea>
        </div>
        <div id="content_images">
            <img class="img" v-if="imgs && imgs.length" v-for="(bimg, idx) in imgs" :key="idx" :src="bimg" ></img>
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
    import { computed, watch } from 'vue';
    import { base64ToPath } from 'image-tools'
    import { publicResource } from '@/core/util/router';
    import Viewer from 'viewerjs';
    import { writeError } from '@/core/util/log';
    export default {
        data() {
            return {
                is_edit_mode : false,
                edit_content : this.value && typeof this.value.content == "string" ? this.value.content : "",
                resolved_base64imgs : [] as string[],
                img_gallery : null as null | Viewer
            }
        },
        computed : {
            txt_content() : string {
                if (!this.value) {
                    return ""
                }
                if (typeof this.value.content == "string") {
                    return this.value.content
                }
                writeError("unexpected error: invaild content type")
                return ""
            },
            imgs() : string[] | null {
                if (!this.value) {
                    return null
                }
                const base64Count = this.value.base64imgs?.length ?? 0
                const result : string[] = []
                for (let i = 0; i < base64Count; i++) {
                    result.push(this.resolved_base64imgs[i] ?? publicResource.loadingImage)
                }
                if (this.value.imgs_url) {
                    result.push(...this.value.imgs_url)
                }
                return result
            }
        },
        watch : {
            'value.base64imgs': {
                deep: true,
                immediate: true,
                handler(base64imgs : string[] | undefined) {
                    if (!base64imgs || base64imgs.length === 0) {
                        this.resolved_base64imgs = []
                        return
                    }
                    this.resolved_base64imgs = new Array(base64imgs.length).fill(publicResource.loadingImage)
                    base64imgs.forEach((val, idx) => {
                        base64ToPath(val).then(
                            path => { this.resolved_base64imgs[idx] = path },
                            err => writeError(err)
                        )
                    })
                }
            }
        },
        methods : {
            switch_edit_mode() {
                this.edit_content = this.value && typeof this.value.content == "string" ? this.value.content : ""
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