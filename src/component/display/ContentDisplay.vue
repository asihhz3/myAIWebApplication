
<template>
    <div v-bind:class="(value as IDisplayValue).role">
        <p >{{ txt_content }}</p>
        <div>
            <img class="img" v-if="imgs" v-for="bimg in imgs" v-bind:src="bimg"></img>
        </div>
    </div>
</template>

<script lang="ts">
    import { type IDisplayValue } from '@/core/util/display_type';
import { computed, isRef, type Ref } from 'vue';
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
                            return this.value.base64imgs
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