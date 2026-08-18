
<template>
    <details class="log-drawer">
        <summary class="log-summary">
            <span class="log-dot"></span>
            browser log
        </summary>
        <div>
            <textarea class="textarea" v-bind:value="log.str" readonly></textarea>
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
    .log-drawer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 90;
        background: var(--surface);
        border-top: 1px solid var(--border);
        box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.45);
    }
    .log-summary {
        list-style: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        user-select: none;
        transition: color var(--transition);
    }
    .log-summary:hover {
        color: var(--text);
    }
    .log-summary::-webkit-details-marker {
        display: none;
    }
    .log-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 8px var(--accent-glow);
        animation: logpulse 2s ease-in-out infinite;
    }
    @keyframes logpulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }
    .textarea {
        width: 100%;
        height: 200px;
        margin: 0;
        padding: 12px 16px;
        box-sizing: border-box;
        background: var(--bg);
        color: var(--text-secondary);
        border: none;
        border-top: 1px solid var(--border);
        border-radius: 0;
        font-family: var(--font-mono);
        font-size: 12.5px;
        line-height: 1.6;
        resize: none;
    }
    .textarea:focus {
        outline: none;
    }
</style>
