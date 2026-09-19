
<template>
    <div class="user-box">
        <button class="user-trigger" type="button" aria-haspopup="true">
            <img class="avatar" :src="avatar" alt="avatar"></img>
            <span class="user-name">{{ name }}</span>
            <span class="caret">▾</span>
        </button>

        <div class="popover">
            <div class="pop-card">
                <div class="pop-head">
                    <img class="pop-avatar" :src="avatar" alt="avatar"></img>
                    <div class="pop-id">
                        <div class="pop-name">{{ name }}</div>
                        <div class="pop-sub">当前用户</div>
                    </div>
                </div>
                <div class="pop-divider"></div>
                <ul class="pop-list">
                    <li v-for="row in details" :key="row.label">
                        <span class="pop-label">{{ row.label }}</span>
                        <span class="pop-value">{{ row.value }}</span>
                    </li>
                </ul>
                <RouterLink to="/identify" class="pop-link">Key 管理 →</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(defineProps<{
    avatar?: string
    name?: string
    details?: { label : string, value : string }[]
}>(), {
    avatar : "/icon/user_default_avatar.jpeg",
    name : "avicii",
    details : () => [
        { label : "模型配额", value : "—" },
        { label : "积分余额", value : "—" },
        { label : "Key 数量", value : "—" }
    ]
})
</script>

<style scoped>
    .user-box {
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-left: var(--space-4);
    }

    .user-trigger {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        background: transparent;
        border: none;
        padding: 4px 6px;
        border-radius: var(--radius-full);
        cursor: pointer;
        color: var(--text);
        transition: background var(--transition);
    }

    .user-trigger:hover {
        background: var(--surface-2);
    }

    .avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--border);
        transition: box-shadow var(--transition), border-color var(--transition);
    }

    .user-trigger:hover .avatar {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft), 0 0 14px var(--accent-glow);
    }

    .user-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text);
    }

    .caret {
        font-size: 10px;
        color: var(--text-muted);
        transition: transform var(--transition);
    }

    .user-box:hover .caret,
    .user-box:focus-within .caret {
        transform: rotate(180deg);
    }

    /* ---------- popover ---------- */

    .popover {
        position: absolute;
        top: 100%;
        right: 0;
        width: 280px;
        padding-top: 10px;
        z-index: 20;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-6px);
        transition: opacity var(--transition), transform var(--transition), visibility var(--transition);
    }

    .user-box:hover .popover,
    .user-box:focus-within .popover {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .pop-card {
        position: relative;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        padding: var(--space-4);
    }

    .pop-card::before {
        content: "";
        position: absolute;
        top: -6px;
        right: 22px;
        width: 10px;
        height: 10px;
        background: var(--surface);
        border-left: 1px solid var(--border);
        border-top: 1px solid var(--border);
        transform: rotate(45deg);
    }

    .pop-head {
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .pop-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--border);
    }

    .pop-id {
        min-width: 0;
    }

    .pop-name {
        font-size: 15px;
        font-weight: 650;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pop-sub {
        font-size: 12px;
        color: var(--text-muted);
    }

    .pop-divider {
        height: 1px;
        background: var(--border);
        margin: var(--space-3) 0;
    }

    .pop-list {
        list-style: none;
        margin: 0 0 var(--space-3);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .pop-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
    }

    .pop-label {
        color: var(--text-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .pop-value {
        color: var(--text);
        font-family: var(--font-mono);
        font-size: 12px;
    }

    .pop-link {
        display: inline-block;
        font-size: 13px;
        font-weight: 600;
        color: var(--accent);
        text-decoration: none;
        transition: color var(--transition);
    }

    .pop-link:hover {
        color: var(--accent-strong);
        text-decoration: underline;
    }
</style>
