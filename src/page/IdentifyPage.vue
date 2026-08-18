
<template>
    <div class="identify-page">
        <h3 class="page-title">All User Key Available</h3>
        <div class="user-grid">
            <div class="user-card" v-for="user in user_handle.list" :key="user.name">
                <div class="user-head">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="key-count">{{ user.key_list.length }} keys</span>
                </div>
                <ul class="key-list">
                    <li v-for="pair in user.key_list" :key="pair.source_type" class="key-chip">
                        <span class="key-source">{{ pair.source_type }}</span>
                        <span class="key-value">{{ createHiddenKey(pair.key) }}</span>
                    </li>
                </ul>
                <p v-if="user.key_list.length == 0" class="key-empty">no keys</p>
            </div>
        </div>

        <div class="form-card">
            <div class="card-title">Manage</div>
            <div class="form-grid">
                <div class="field">
                    <span class="label">user</span>
                    <input type="text" v-model="user_name" placeholder="new user name"/>
                </div>
                <div class="field">
                    <span class="label">select user</span>
                    <select v-model="user_name">
                        <option :value="user.name" v-for="user in user_handle.list" :key="user.name">{{user.name}}</option>
                    </select>
                </div>
                <div class="field">
                    <span class="label">key</span>
                    <input type="text" v-model="key" placeholder="api key"/>
                </div>
                <div class="field">
                    <span class="label">source</span>
                    <select v-model="source">
                        <option :value="_source.toString()" v-for="_source in source_list" :key="_source.toString()">{{_source}}</option>
                    </select>
                </div>
            </div>
            <div class="actions">
                <button class="btn-accent" @click="addKey">add key</button>
                <button @click="createUser">create user</button>
                <button class="btn-danger" @click="removeAllKeys">remove all keys</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { global_key_handle } from '@/core/apikey/key_handle';
import { ModelSourceType } from '@/core/model/model_type';
    import {} from "@/core/util/tool"
    export default {
        data () {
           return {
                user_handle: global_key_handle,
                user_name : "",
                key : "",
                source : null as null | string,
                source_list : Object.values(ModelSourceType).map(type => type.toString())
            }
        },
        methods : {
            createUser() {
                if (this.source && this.source_list.includes(this.source)) {
                    if (this.user_name) {
                        this.user_handle.createUser(this.user_name, this.source as unknown as ModelSourceType, this.key)
                    }
                }
                else {
                    alert("invaild source")
                }
            },
            addKey () {
                if (this.source && this.source_list.includes(this.source)) {
                    if (this.user_name) {
                        this.user_handle.setKey(this.user_name, this.source as unknown as ModelSourceType, this.key)
                    }
                }
                else {
                    alert("invaild source")
                }
            },
            removeAllKeys () {
                if (this.user_name) {
                    this.user_handle.removeAllKeys(this.user_name)
                }
                else {
                    alert("invaild user_name")
                }
            },
            createHiddenKey(key : string) {
                return `${key.slice(0, 2)}***`
            }
        }
    }
</script>

<style scoped>
    .page-title {
        margin-bottom: var(--space-4);
    }
    .user-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-5);
    }
    .user-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        transition: border-color var(--transition), box-shadow var(--transition);
    }
    .user-card:hover {
        border-color: var(--border-strong);
        box-shadow: var(--shadow-md);
    }
    .user-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
    }
    .user-name {
        font-size: 15px;
        font-weight: 650;
        color: var(--text);
    }
    .key-count {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
        background: var(--surface-2);
        border: 1px solid var(--border);
        padding: 2px 10px;
        border-radius: var(--radius-full);
    }
    .key-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
    .key-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 6px 12px;
        font-size: 13px;
    }
    .key-source {
        color: var(--accent);
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 600;
    }
    .key-value {
        color: var(--text-secondary);
        font-family: var(--font-mono);
        font-size: 12px;
    }
    .key-empty {
        color: var(--text-muted);
        font-size: 12px;
        margin: 0;
    }
    .form-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        max-width: 720px;
    }
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-3);
    }
    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-top: var(--space-4);
    }
</style>
