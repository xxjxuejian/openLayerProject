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
      <button class="modify" @click="handleIsModify">
        {{ isModify ? "禁用编辑" : "启用编辑" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import { useMapStore } from "@/store/mapStore";
import { ref, toRaw, watch } from "vue";
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
  // 每次只能先这样做，在删除，直接删，删不掉
  let map = toRaw(mapStore.map);
  console.log(map.removeInteraction(draw));
  // map.removeInteraction()
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
const handleIsModify = () => {
  isModify.value = !isModify.value;
  const modify = new Modify({ source: vectorSource });
  mapStore.map.addInteraction(modify);
  // 怎么禁用编辑呢？
};

function addSnap() {
  const snap = new Snap({ source: vectorSource });
  mapStore.map.addInteraction(snap);
}
</script>

<style scoped lang="scss">
.draw {
  margin-top: 5px;
  height: 50px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  background-color: antiquewhite;

  .modify {
    padding: 3px 5px;
  }
}
</style>
