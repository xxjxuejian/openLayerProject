<template>
  <div class="draw">
    <div>绘制几何图形</div>
    <el-dropdown @command="handleCommand">
      <span class="el-dropdown-link">
        请选择几何类型
        <el-icon class="el-icon--right">
          <arrow-down />
        </el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="None">无</el-dropdown-item>
          <el-dropdown-item command="Point">点</el-dropdown-item>
          <el-dropdown-item command="LineString">线</el-dropdown-item>
          <el-dropdown-item command="Polygon">多边形</el-dropdown-item>
          <el-dropdown-item command="Circle">圆</el-dropdown-item>
          <el-dropdown-item command="Square">正方形</el-dropdown-item>
          <el-dropdown-item command="Box">矩形</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div>
      <button
        class="btn"
        @click="handleIsModify"
        :class="{ active: !isModify }"
      >
        {{ isModify ? "禁用编辑" : "启用编辑" }}
      </button>
      <button class="btn" @click="resetLayer">重置图层</button>
    </div>
  </div>
</template>

<script setup>
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import { useMapStore } from "@/store/mapStore";
import { ref } from "vue";
const mapStore = useMapStore();

let vectorSource = null;
let vectorLayer = new VectorLayer({
  source: vectorSource,
});
function createvectorSource() {
  if (vectorSource === null) {
    //绘制用的矢量图层
    vectorSource = new VectorSource({ wrapX: false }); //   矢量数据源
    vectorLayer.setSource(vectorSource);
    mapStore.map.addLayer(vectorLayer);
    console.log("hasVectorLayer");
  }
}

let draw = null;
const handleCommand = (command) => {
  //   command :dot line circle ....
  console.log("command", command);
  mapStore.deleteInteraction(draw);
  addInteraction(command);
};

function addInteraction(command) {
  // 每次都要重置geometryFunction，所以要放在函数里面
  let geometryFunction;
  if (command !== "None") {
    if (vectorSource === null) {
      createvectorSource();
    }
    if (command === "Square") {
      command = "Circle";
      geometryFunction = createRegularPolygon(4);
    } else if (command === "Box") {
      command = "Circle";
      geometryFunction = createBox();
    }
    draw = new Draw({
      source: vectorSource,
      type: command,
      geometryFunction: geometryFunction,
    });
    mapStore.map.addInteraction(draw);
  } else {
    vectorSource = null;
    vectorLayer?.setSource(vectorSource);
    console.log("none");
  }
}

// 编辑相关
const isModify = ref(false);
let modify = null;
const handleIsModify = () => {
  // 启用与禁用编辑
  isModify.value = !isModify.value;
  // 如果是启用
  if (isModify.value) {
    if (!vectorSource) {
      createvectorSource();
    }
    modify = new Modify({ source: vectorSource });
    mapStore.map.addInteraction(modify);
  }
  // 如果是禁用
  else {
    // 禁用就移除编辑交互,移除绘制交互
    mapStore.deleteInteraction(draw);
    mapStore.deleteInteraction(modify);
  }
};

// 重置
const resetLayer = () => {
  if (vectorSource) {
    vectorSource.clear();
    mapStore.deleteInteraction(draw);
    console.log("reset layer");
  }
};
</script>

<style scoped lang="scss">
.draw {
  margin-top: 5px;
  height: 50px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  background-color: antiquewhite;

  .btn {
    padding: 3px 5px;
    margin-left: 5px;

    &.active {
      background-color: rgba(35, 167, 244, 0.397);
    }
  }
}
</style>
