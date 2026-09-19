<script setup lang="ts">
  import { RouterLink } from 'vue-router';
import Log from './Log.vue';
import TopUserManager from './component/manager/user/TopUserManager.vue';

</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="brand">
      <span class="brand-mark">🍌</span>
      <span class="brand-name">nano·banana·pie</span>
    </RouterLink>
    <div class="nav-container">
        <nav class="navigation">
        <RouterLink to="/" class="nav-link">Generate</RouterLink>
        <RouterLink to="/identify" class="nav-link">Identify</RouterLink>
        </nav>
        <TopUserManager></TopUserManager>
    </div>
  </header>
  <main class="main">
    <RouterView></RouterView>
  </main>
  <Log></Log>
</template>

<style>
    .topbar {
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 0 1.5rem;
        height: 56px;
        background: rgba(10, 14, 18, 0.82);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border);
    }
    .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
    }
    .brand-mark {
        font-size: 20px;
        filter: drop-shadow(0 0 8px var(--accent-glow));
    }
    .brand-name {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--text);
        background: linear-gradient(120deg, var(--accent), var(--info));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .navigation {
        display: inline-flex;
        gap: 0.25rem;
    }
    .nav-container {
        display: inline-flex;
        align-items: center;
    }
    .nav-link {
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 550;
        text-decoration: none;
        padding: 6px 14px;
        border-radius: var(--radius-md);
        transition: color var(--transition), background var(--transition), box-shadow var(--transition);
    }
    .nav-link:hover {
        color: var(--text);
        background: var(--surface-2);
        text-decoration: none;
    }
    .nav-link.router-link-exact-active {
        color: var(--accent-contrast);
        background: linear-gradient(135deg, var(--accent), var(--accent-strong));
        box-shadow: var(--shadow-accent);
    }
    .main {
        max-width: 1440px;
        margin: 0 auto;
        padding: 1.5rem;
    }
</style>
