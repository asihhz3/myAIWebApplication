
<template>
    <div class="history-panel">
        <div class="history-actions">
            <button class="btn-accent btn-new" @click="$emit('new')">+ New</button>
        </div>
        <div class="history-list" v-if="list.length > 0">
            <div
                class="history-item"
                :class="{ active: item.dialog.id == current_id }"
                v-for="item in list"
                :key="item.dialog.id"
                @click="$emit('select', item.dialog.id)"
            >
                <div class="item-title">{{ dialogTitle(item) }}</div>
                <div class="item-meta">
                    <span class="meta-count">{{ item.dialog.quene.length }} msgs</span>
                    <button class="item-remove" title="delete" @click.stop="$emit('remove', item.dialog.id)">×</button>
                </div>
            </div>
        </div>
        <p class="history-empty" v-else>no conversations yet</p>
    </div>
</template>

<script lang="ts">
import { client_dialog_history, DialogHistory } from '@/core/dialog/dialog_history';
import type { ITextMessage } from '@/core/dialog/dialog_type';

    export default {
        props : {
            current_id : { type : String, default : "" }
        },
        computed : {
            list() : DialogHistory[] {
                return client_dialog_history.history_id_list
                    .map(id => client_dialog_history.hasHistory(id) ? client_dialog_history.getClientHistory(id) : null)
                    .filter((dia) : dia is DialogHistory => dia != null)
            }
        },
        methods : {
            dialogTitle(item : DialogHistory) : string {
                const firstUser = item.dialog.quene.find(msg => msg.role == "user")
                if (firstUser && "content" in firstUser) {
                    const text = (firstUser as ITextMessage).content
                    if (text) {
                        return text.length > 40 ? text.slice(0, 40) + "…" : text
                    }
                }
                return item.dialog.id
            }
        }
    }
</script>

<style scoped>
    .history-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }
    .history-actions {
        padding-bottom: var(--space-3);
        border-bottom: 1px solid var(--border);
        margin-bottom: var(--space-3);
    }
    .btn-new {
        width: 100%;
    }
    .history-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        overflow-y: auto;
        flex: 1;
        min-height: 0;
    }
    .history-item {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: var(--space-2) var(--space-3);
        cursor: pointer;
        transition: border-color var(--transition), background var(--transition), box-shadow var(--transition);
    }
    .history-item:hover {
        border-color: var(--border-strong);
        background: var(--surface-3);
    }
    .history-item.active {
        border-color: var(--accent);
        background: var(--accent-soft);
        box-shadow: 0 0 12px var(--accent-glow);
    }
    .item-title {
        font-size: 13px;
        font-weight: 550;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
    }
    .item-meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 11px;
        color: var(--text-muted);
    }
    .meta-model {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--font-mono);
    }
    .meta-count {
        flex: none;
    }
    .item-remove {
        flex: none;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 14px;
        line-height: 1;
        padding: 0 2px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: color var(--transition), background var(--transition);
    }
    .item-remove:hover {
        color: var(--danger);
        background: var(--danger-soft);
    }
    .history-empty {
        color: var(--text-muted);
        font-size: 12px;
        text-align: center;
        margin: var(--space-5) 0;
    }
</style>
