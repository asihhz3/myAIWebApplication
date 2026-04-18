
<template>
    <details>
        <summary>browser log</summary>
        <div>
            <textarea class="textarea" v-bind:value="log.str"></textarea>
        </div>
    </details>
</template>


<script lang="ts">
import {content} from '@/core/util/log';

    export default {
        data() {
            return {
                log : content
            }
        },
    }
</script>

<style>
    .textarea {
        width: 95vw;
        height: 85vh;
        margin: 1vh 2.5vw;
        box-sizing: border-box;
        font-family: monospace;
        font-size: 14px;
        resize: vertical; /* 允许垂直调整，或者设为 none 完全固定 */
    }
</style>