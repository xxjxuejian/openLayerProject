<script setup>
import Map from "./components/map.vue";
import Navigations from "./components/navigations.vue";
import ChangeLayer from "./components/changeLayer.vue";
import Interaction from "./components/interaction.vue";
</script>

<template>
  <div class="app">
    <div class="header">
      <h1>openLayer</h1>
    </div>
    <div class="content">
      <div class="left">
        <Navigations></Navigations>
        <ChangeLayer></ChangeLayer>
        <Interaction></Interaction>
      </div>
      <div class="right">
        <Map></Map>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
    width: 100%;
    height: calc(100% - 80px);

    .left {
      width: 400px;
      padding: 10px;
      background-color: rgb(179, 179, 179);
    }
    .right {
      // width: 100%;
      width: calc(100% - 400px);
      height: 100%;
    }
  }
}
</style>
