
<template>
    <h4>API Key Available</h4>
    <div class="container">
        <ul>
            <li v-for="pair in keypair_list.list">User: {{pair.user}}</li>
        </ul>
    </div>
    <input type="text" v-model="user_input">user</input>
    <br></br>
    <input type="text" v-model="key_input">key</input>
    <br></br>
    <button v-on:click="addKey">add key</button>
    <br></br>
    <button v-on:click="removeAllKeys">remove all keys</button>

</template>

<script>
    import { global_key_handle } from '@/core/apikey/key_handle';
    import {} from "@/core/util/tool"
    export default {
        data () {
           return {
                keypair_list: global_key_handle,
                key_input : "",
                user_input : ""
            }
        },
        methods : {
            addKey () {
                if (this.user_input.isEmpty() || this.key_input.isEmpty()) {
                    alert("error: should not pass empty char here")
                    return
                }
                if (this.keypair_list.list.some(pair => pair.user == this.user_input)) {
                    alert(`error: user ${this.user_input} has existed`)
                    return
                }
                this.keypair_list.setKey(this.user_input, this.key_input)
            },
            removeAllKeys () {
                this.keypair_list.removeAllKeys()
                this.key_input = ""
                this.user_input = ""
            }
        }
    }
</script>

<style>
    .container {
        border: 1px solid black;
    }
</style>