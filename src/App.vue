<script setup>
import Map from "./components/map.vue";
import Navigations from "./components/navigations.vue";
</script>

<template>
  <div class="app">
    <div class="header">
      <h1>App组件</h1>
    </div>
    <div class="content">
      <div class="left">
        <Navigations></Navigations>
      </div>
      <div class="right">
        <Map></Map>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  /* 高度不设置默认就是内容撑开 */
  height: 100%;

  .header {
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgb(209, 215, 213);
  }

  .content {
    display: flex;
    height: calc(100% - 80px);

    .left {
      width: 300px;
      background-color: turquoise;
    }
  }
}
</style>
