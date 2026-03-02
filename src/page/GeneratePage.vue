
<template>
    <h3>Generate</h3>
    <DialoguePanel v-bind:dialog_id="latest_dialog_id"></DialoguePanel>
    <hr></hr>
</template>

<script lang="ts">
    import DialoguePanel from '@/component/panel/DialoguePanel.vue';
    import { client_dialog_history } from '@/core/dialog/dialog_history';
import { IdGenerator1 } from '@/core/util/tool';
    let all_histories = client_dialog_history.getAllHistories()
    let latest_dialog_id = "114514"
    if (all_histories.length == 0) {
        latest_dialog_id = IdGenerator1()
    }
    else {
        latest_dialog_id = all_histories[0]!.dialog.id
    }
    export default {
        data() {
            return {
                latest_dialog_id : latest_dialog_id
            }
        },
        components : {
            "DialoguePanel" : DialoguePanel
        }
    }
    
</script>