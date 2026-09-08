
<template>
    <div class="generate-layout">
        <aside class="settings-col">
            <DialoguePanel v-bind:dialog_id="latest_dialog_id" :dialog="dialog"></DialoguePanel>
        </aside>
        <section class="chat-col">
            <DialogueDisplay :current_dialog="dialog" :key="dialog.id"></DialogueDisplay>
        </section>
        <aside class="history-col" :class="{ collapsed: !show_history }">
            <div class="history-inner">
                <div class="history-head">
                    <button class="collapse-btn" :title="show_history ? 'collapse' : 'expand'" @click="toggleHistory">
                        {{ show_history ? '⟩' : '⟨' }}
                    </button>
                    <span class="history-title" v-show="show_history">History</span>
                </div>
                <div class="history-body" v-show="show_history">
                    <DialogHistoryPanel
                        :current_id="latest_dialog_id"
                        @select="selectDialog"
                        @remove="removeDialog"
                        @new="newDialog"
                    ></DialogHistoryPanel>
                </div>
            </div>
        </aside>
    </div>
</template>

<script lang="ts">
    import DialoguePanel from '@/component/panel/DialoguePanel.vue';
    import DialogueDisplay from '@/component/display/DialogueDisplay.vue';
    import DialogHistoryPanel from '@/component/panel/DialogHistoryPanel.vue';
    import { client_dialog_history } from '@/core/dialog/dialog_history';
import { Dialogue, SystemMessage, type IDialogue } from '@/core/dialog/dialog_type';
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
            const dialog : IDialogue = client_dialog_history.hasHistory(latest_dialog_id)
                ? client_dialog_history.getClientHistory(latest_dialog_id)!.dialog
                : new Dialogue(latest_dialog_id, new SystemMessage("you are a helpful ai."))
            return {
                latest_dialog_id : latest_dialog_id,
                dialog : dialog,
                show_history : true
            }
        },
        methods : {
            toggleHistory() {
                this.show_history = !this.show_history
            },
            selectDialog(id : string) {
                if (!client_dialog_history.hasHistory(id)) {
                    return
                }
                const history = client_dialog_history.getClientHistory(id)!
                this.latest_dialog_id = id
                this.dialog = history.dialog
            },
            removeDialog(id : string) {
                client_dialog_history.removeHistory(id)
                if (this.latest_dialog_id != id) {
                    return
                }
                const remaining = client_dialog_history.getAllHistories()
                if (remaining.length > 0) {
                    const next = remaining[0]!
                    this.latest_dialog_id = next.dialog.id
                    this.dialog = next.dialog
                }
                else {
                    this.newDialog()
                }
            },
            newDialog() {
                const id = IdGenerator1()
                this.latest_dialog_id = id
                this.dialog = new Dialogue(id, new SystemMessage("you are a helpful ai."))
            }
        },
        components : {
            "DialoguePanel" : DialoguePanel,
            "DialogueDisplay" : DialogueDisplay,
            "DialogHistoryPanel" : DialogHistoryPanel
        }
    }
    
</script>

<style scoped>
    .generate-layout {
        display: flex;
        gap: 1.5rem;
        align-items: flex-start;
    }
    .settings-col {
        flex: none;
        width: 400px;
        position: sticky;
        top: 80px;
        max-height: calc(100vh - 96px);
        overflow-y: auto;
        padding-right: 4px;
    }
    .chat-col {
        flex: 1 1 auto;
        min-width: 0;
    }
    .history-col {
        flex: none;
        width: 320px;
        height: calc(100vh - 96px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: sticky;
        top: 80px;
        transition: width var(--transition);
    }
    .history-col.collapsed {
        width: 34px;
    }
    .history-inner {
        width: 320px;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }
    .history-head {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--border);
        margin-bottom: var(--space-3);
    }
    .collapse-btn {
        flex: none;
        width: 28px;
        height: 28px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-size: 14px;
        cursor: pointer;
        transition: color var(--transition), border-color var(--transition), background var(--transition);
    }
    .collapse-btn:hover {
        color: var(--accent);
        border-color: var(--accent);
        background: var(--accent-soft);
    }
    .history-title {
        font-size: 12px;
        font-weight: 650;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        white-space: nowrap;
    }
    .history-body {
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }
    @media (max-width: 960px) {
        .generate-layout {
            flex-direction: column;
        }
        .settings-col {
            position: static;
            width: 100%;
            max-height: none;
        }
        .history-col {
            display: none;
        }
    }
</style>
