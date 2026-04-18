<script setup lang="ts">
  import { RouterLink } from 'vue-router';
import Log from './Log.vue';

</script>

<template>
  <h1>Whos sockes on his head</h1>
  <span class="navigation">
    <RouterLink to="/">home</RouterLink>
    <RouterLink to="/identify">identify</RouterLink>
  </span>
  <RouterView></RouterView>
  <Log></Log>
</template>

<style>
    .container {
        border: 1px solid black;
    }
    .navigation {
        display: inline-flex;
        gap: 1rem;
    }
</style>
