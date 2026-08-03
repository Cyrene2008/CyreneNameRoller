<template>
  <main class="settings-layout-view">
    <router-view v-slot="{ Component, route }">
      <Transition name="page-forward" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </main>
</template>

<style scoped>
.settings-layout-view { position: relative; width: 100%; min-height: 100%; overflow: hidden; }
</style>
