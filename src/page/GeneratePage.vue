
<template>
    <div class="generate-layout">
        <aside class="settings-col">
            <DialoguePanel v-bind:dialog_id="latest_dialog_id" :dialog="dialog"></DialoguePanel>
        </aside>
        <section class="chat-col">
            <DialogueDisplay :current_dialog="dialog" :key="dialog.id"></DialogueDisplay>
        </section>
    </div>
</template>

<script lang="ts">
    import DialoguePanel from '@/component/panel/DialoguePanel.vue';
    import DialogueDisplay from '@/component/display/DialogueDisplay.vue';
    import { client_dialog_history } from '@/core/dialog/dialog_history';
import { Dialogue, SystemMessage } from '@/core/dialog/dialog_type';
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
            const dialog = client_dialog_history.hasHistory(latest_dialog_id)
                ? client_dialog_history.getHistory(latest_dialog_id)!.dialog
                : new Dialogue(latest_dialog_id, new SystemMessage("you are a helpful ai."))
            return {
                latest_dialog_id : latest_dialog_id,
                dialog : dialog
            }
        },
        components : {
            "DialoguePanel" : DialoguePanel,
            "DialogueDisplay" : DialogueDisplay
        }
    }
    
</script>

<style scoped>
    .generate-layout {
        display: grid;
        grid-template-columns: 400px minmax(0, 1fr);
        gap: 1.5rem;
        align-items: start;
    }
    .settings-col {
        position: sticky;
        top: 80px;
        max-height: calc(100vh - 96px);
        overflow-y: auto;
        padding-right: 4px;
    }
    .chat-col {
        min-width: 0;
    }
    @media (max-width: 960px) {
        .generate-layout {
            grid-template-columns: 1fr;
        }
        .settings-col {
            position: static;
            max-height: none;
        }
    }
</style>
