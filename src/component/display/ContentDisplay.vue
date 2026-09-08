
<template>
    <div v-bind:class="['msg-row', role_class]">
        <div class="bubble" ref="gallery" :class="role_class">
            <div class="bubble-head" v-if="(value as IDisplayValue).role !== 'system'">
                <span class="role-name">{{ (value as IDisplayValue).role }}</span>
                <span class="stream-cursor" v-if="is_streaming">▍</span>
            </div>
            <div class="bubble-body">
                <div class="md-body" v-bind:hidden="is_edit_mode" v-html="txt_componet"></div>
                <textarea wrap="soft" v-model="edit_content" :hidden="!is_edit_mode" class="edit-area"></textarea>
            </div>
            <div id="content_images" class="msg-images" v-if="imgs && imgs.length">
                <img class="img" v-for="(bimg, idx) in imgs" :key="idx" :src="bimg" ></img>
            </div>
            <video v-if="value && value.video_url" class="msg-video" controls>
                <source v-bind:src="value.video_url" type="video/mp4" />
            </video>
            <audio v-if="value && value.audio_url" class="msg-audio" controls>
                <source v-bind:src="value.audio_url" type="audio/mp3" />
            </audio>
            <div class="msg-actions">
                <button class="act" @click="$emit('delete_message', value!.message_id)">delete</button>
                <button class="act" @click="switch_edit_mode" v-if="txt_componet.length > 0 && !is_edit_mode">edit</button>
                <button class="act" @click="abandon_changes" v-if="is_edit_mode">cancle</button>
                <button class="act" @click="save_changes" v-if="is_edit_mode">save</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { type IDisplayValue } from '@/core/util/display_type';
    import { base64ToPath } from 'image-tools'
    import { publicResource } from '@/core/util/router';
    import Viewer from 'viewerjs';
    import { writeError } from '@/core/util/log';
    import MarkdownIt from 'markdown-it'
    export default {
        data() {
            return {
                is_edit_mode : false,
                edit_content : this.value && typeof this.value.content == "string" ? this.value.content : "",
                resolved_base64imgs : [] as string[],
                img_gallery : null as null | Viewer,
                _stream_timer : null as null | ReturnType<typeof setTimeout>,
                _gallery_timer : null as null | ReturnType<typeof setTimeout>,
                viewerOptions : {
                    title : false,
                    navbar : true,
                    toolbar : {
                        zoomIn : 1,
                        zoomOut : 1,
                        oneToOne : 1,
                        reset : 1,
                        prev : 1,
                        next : 1,
                        rotateLeft : 1,
                        rotateRight : 1,
                    }
                }
            }
        },
        computed : {
            role_class() : string {
                return (this.value as IDisplayValue | null)?.role ?? "_invaild"
            },
            is_streaming() : boolean {
                return this.value?.streaming === true
            },
            txt_componet() : string {
                if (!this.value) {
                    return ""
                }
                if (typeof this.value.content == "string") {
                    return new MarkdownIt().render(this.value.content) 
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
            },
            'value.content'() {
                if (this.is_streaming) {
                    clearTimeout(this._stream_timer ?? undefined)
                    this._stream_timer = setTimeout(() => {
                        this.value!.streaming = false
                    }, 400)
                }
                this.refreshGallery()
            },
            imgs() {
                this.refreshGallery()
            },
            is_streaming() {
                if (!this.is_streaming) {
                    this.refreshGallery()
                    this.$emit('message_updated')
                }
            }
        },
        methods : {
            refreshGallery() {
                clearTimeout(this._gallery_timer ?? undefined)
                this._gallery_timer = setTimeout(() => {
                    this.$nextTick(() => {
                        const el = this.$refs.gallery as HTMLElement | undefined
                        if (!el || el.querySelectorAll('img').length === 0) {
                            this.img_gallery?.destroy()
                            this.img_gallery = null
                            return
                        }
                        if (this.img_gallery) {
                            this.img_gallery.update()
                        }
                        else {
                            this.img_gallery = new Viewer(el, this.viewerOptions as Viewer.Options)
                        }
                    })
                }, 200)
            },
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
                this.$emit('message_edited')
            },
        },
        props : {
            value : Object as () => IDisplayValue
        },
        mounted() {
            this.refreshGallery()
        },
        beforeUnmount() {
            this.img_gallery?.destroy()
            this.img_gallery = null
            clearTimeout(this._stream_timer ?? undefined)
            clearTimeout(this._gallery_timer ?? undefined)
        }
    }
</script>

<style scoped>
    .msg-row {
        display: flex;
        width: 100%;
    }
    .user {
        justify-content: flex-end;
    }
    .assistant {
        justify-content: flex-start;
    }
    .system {
        justify-content: center;
    }

    .bubble {
        max-width: 82%;
        border-radius: var(--radius-lg);
        padding: 10px 14px;
        font-size: 14px;
        position: relative;
    }
    .bubble.user {
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        color: var(--accent-contrast);
        border-bottom-right-radius: 4px;
        box-shadow: var(--shadow-accent);
    }
    .bubble.assistant {
        background: var(--surface-2);
        color: var(--text);
        border: 1px solid var(--border);
        border-bottom-left-radius: 4px;
    }
    .bubble.system {
        background: transparent;
        border: 1px dashed var(--border-strong);
        color: var(--text-muted);
        font-size: 12px;
        font-style: italic;
        padding: 6px 14px;
        border-radius: var(--radius-full);
    }

    .bubble-head {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
    }
    .bubble.user .role-name {
        color: rgba(12, 17, 6, 0.65);
    }
    .bubble.assistant .role-name {
        color: var(--text-muted);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.08em;
        font-weight: 600;
    }
    .bubble.system .role-name {
        display: none;
    }

    .stream-cursor {
        animation: blink 1s steps(1) infinite;
        font-weight: 700;
        color: var(--accent-contrast);
        font-size: 12px;
    }
    .bubble.assistant .stream-cursor {
        color: var(--accent);
    }
    @keyframes blink {
        0%, 50% { opacity: 1; }
        50.01%, 100% { opacity: 0; }
    }

    .bubble-body {
        word-break: break-word;
    }

    .msg-images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 8px;
        margin-top: 10px;
    }
    .msg-images .img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: var(--radius-md);
        border: 1px solid rgba(255, 255, 255, 0.12);
        cursor: zoom-in;
        transition: transform var(--transition), box-shadow var(--transition);
    }
    .msg-images .img:hover {
        transform: scale(1.02);
        box-shadow: var(--shadow-md);
    }

    .msg-video,
    .msg-audio {
        width: 100%;
        margin-top: 10px;
        border-radius: var(--radius-md);
        background: var(--bg);
    }

    .msg-actions {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        opacity: 0;
        transition: opacity var(--transition);
    }
    .bubble:hover .msg-actions {
        opacity: 1;
    }
    .bubble.system .msg-actions {
        opacity: 0;
    }
    .act {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 11px;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: color var(--transition), background var(--transition);
    }
    .act:hover {
        color: var(--accent);
        background: var(--accent-soft);
    }
    .act[data-danger]:hover {
        color: var(--danger);
        background: var(--danger-soft);
    }
    .bubble.user .act {
        color: rgba(12, 17, 6, 0.6);
    }
    .bubble.user .act:hover {
        color: var(--accent-contrast);
        background: rgba(12, 17, 6, 0.14);
    }

    .edit-area {
        width: 100%;
        min-height: 80px;
        background: var(--bg);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        color: var(--text);
        font-family: inherit;
        font-size: 13px;
        padding: 8px;
        resize: vertical;
    }

    /* ---------- markdown body ---------- */
    .md-body :deep(*) {
        margin: 0 0 8px;
    }
    .md-body :deep(p) {
        margin: 0 0 8px;
        line-height: 1.7;
    }
    .md-body :deep(ul), .md-body :deep(ol) {
        padding-left: 22px;
        margin: 0 0 8px;
    }
    .md-body :deep(li) {
        margin: 2px 0;
    }
    .md-body :deep(h1), .md-body :deep(h2), .md-body :deep(h3),
    .md-body :deep(h4), .md-body :deep(h5), .md-body :deep(h6) {
        margin: 14px 0 8px;
        font-weight: 650;
        line-height: 1.3;
    }
    .md-body :deep(h1) { font-size: 20px; }
    .md-body :deep(h2) { font-size: 18px; }
    .md-body :deep(h3) { font-size: 16px; }
    .md-body :deep(h4) { font-size: 14px; }
    .md-body :deep(code) {
        font-family: var(--font-mono);
        font-size: 12.5px;
        background: rgba(198, 242, 67, 0.12);
        color: var(--accent);
        padding: 1px 5px;
        border-radius: 4px;
    }
    .bubble.user :deep(code) {
        background: rgba(12, 17, 6, 0.18);
        color: var(--accent-contrast);
    }
    .md-body :deep(pre) {
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 12px;
        overflow-x: auto;
        margin: 0 0 10px;
    }
    .md-body :deep(pre code) {
        background: transparent;
        color: var(--text);
        padding: 0;
        font-size: 12.5px;
        line-height: 1.6;
    }
    .md-body :deep(blockquote) {
        border-left: 3px solid var(--accent);
        padding: 2px 12px;
        margin: 0 0 10px;
        color: var(--text-secondary);
        background: var(--accent-soft);
        border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    .md-body :deep(table) {
        border-collapse: collapse;
        margin: 0 0 10px;
        width: 100%;
        font-size: 13px;
    }
    .md-body :deep(th), .md-body :deep(td) {
        border: 1px solid var(--border);
        padding: 6px 10px;
        text-align: left;
    }
    .md-body :deep(th) {
        background: var(--surface-2);
        color: var(--text-secondary);
    }
    .md-body :deep(a) {
        color: var(--info);
    }
    .md-body :deep(img) {
        max-width: 100%;
        border-radius: var(--radius-md);
        cursor: zoom-in;
    }
    .md-body :deep(hr) {
        border: none;
        border-top: 1px solid var(--border);
        margin: 14px 0;
    }

    /* ---------- viewerjs dark theme ---------- */
    :global(.viewer-backdrop) {
        background: rgba(10, 14, 18, 0.92);
    }
    :global(.viewer-button) {
        color: var(--text-secondary);
    }
    :global(.viewer-button:hover) {
        color: var(--accent);
    }
    :global(.viewer-toolbar button) {
        color: var(--text-secondary);
    }
    :global(.viewer-toolbar button:hover) {
        color: var(--accent);
        background: var(--surface-3);
    }
    :global(.viewer-navbar) {
        background: rgba(10, 14, 18, 0.85);
    }
    :global(.viewer-navbar .viewer-list > li) {
        background: rgba(255, 255, 255, 0.06);
        border-radius: 4px;
    }
    :global(.viewer-navbar .viewer-list > li.viewer-active) {
        background: var(--accent);
    }
    :global(.viewer-title) {
        color: var(--text-secondary);
    }
</style>
