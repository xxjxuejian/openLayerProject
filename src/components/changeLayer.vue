<template>
  <div class="change-layer">
    <div class="title">切换地图</div>
    <el-radio-group v-model="radioLayer" @change="changeLayer">
      <el-radio value="TIANDITU" size="large">天地图</el-radio>
      <el-radio value="OSM" size="large">OSM地图</el-radio>
      <el-radio value="BING" size="large">Bing地图</el-radio>
    </el-radio-group>
  </div>
</template>

<script setup>
import { useMapStore } from "../store/mapStore";
import { ref } from "vue";

const mapStore = useMapStore();
const radioLayer = ref("TIANDITU");

const changeLayer = (value) => {
  console.log(value);
  mapStore.removeLayers();
  let layers = mapStore.createLayer(value);
  layers.forEach((layer) => {
    mapStore.map.addLayer(layer);
  });
};
</script>

<style scoped lang="scss">
.change-layer {
  margin-top: 5px;

  // 可以不使用:deep()的原因是这里使用了scss，有嵌套
  .el-radio-group {
    display: flex;
    justify-content: space-between;

    .el-radio {
      // color: #fff;
    }
  }
}
</style>
