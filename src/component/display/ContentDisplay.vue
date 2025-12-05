
<template>
    <div v-bind:class="(value as IDisplayValue).role">
        <p >{{ txt_content }}</p>
        <div>
            <img class="img" v-if="imgs" v-for="bimg in imgs.value" v-bind:src="bimg"></img>
        </div>
    </div>
</template>

<script lang="ts">
    import { type IDisplayValue } from '@/core/util/display_type';
    import { computed, ref, type Ref } from 'vue';
    import { base64ToPath, pathToBase64 } from 'image-tools'
import { publicResource } from '@/core/util/router';
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
                            console.error("unexpected error: invaild content type")
                            return ""
                        }
                    }
                ),
                imgs : computed(
                    () => {
                        if (this.value && this.value.base64imgs != null) {
                            let imgs_arr : Ref<string[]> = ref(Array(this.value.base64imgs.length).fill(publicResource.loadingImage))
                            this.value.base64imgs.forEach(
                                (val, idx) => base64ToPath(val).then(
                                    path => imgs_arr.value[idx] = path,
                                    err => console.error(err)
                                )
                            )
                            return imgs_arr
                        }
                        return null
                    }
                )
            }
        },
        watch : {
            imgs : function(newval) {
            }
        },
        props : {
            value : Object as () => IDisplayValue
        },
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
        height: 10%;
        width: 10%;
    }
</style>