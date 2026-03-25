
<template>
    <h4>All User Key Available</h4>
    <div class="container">
        <ul>
            <li v-for="user in user_handle.list">
                <span>
                    User: {{ user.name }}
                </span>
                <ul>
                    <li v-for="pair in user.key_list">
                        <span>
                            {{ pair.source_type }}
                        </span>
                        :
                        <span>
                            {{ createHiddenKey(pair.key) }}
                        </span>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
    <div>
        CreateUser or AddKey
        <br/>
        <br/>
        <input type="text" v-model="user_name">user</input>
        <select v-model="user_name">
            <option :value="user.name" v-for="user in user_handle.list">{{user.name}}</option>
        </select>
        <br/>
        <input type="text" v-model="key">key</input>
        <br/>
        <input type="text" v-model="source">source</input>
        <select v-model="source">
            <option :value="_source.toString()" v-for="_source in source_list">{{_source}}</option>
        </select>
        <br/>
        <button v-on:click="addKey">addkey</button>
        <button v-on:click="createUser">create</button>
        <button v-on:click="removeAllKeys">remove all keys</button>
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

<style>
    .container {
        border: 1px solid black;
    }
</style>