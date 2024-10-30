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
  </div>
</template>

<script setup>
import Draw from "ol/interaction/Draw.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import { useMapStore } from "@/store/mapStore";
import { watch, toRaw, reactive, ref, computed } from "vue";
import { storeToRefs } from "pinia";
const mapStore = useMapStore();

let vectorSource = null;
let vectorLayer = new VectorLayer({
  source: vectorSource,
});
// 矢量图层只需要添加一次，但是这里面直接用mapStore.map获取不到，因为还没赋值完成
// 使用watch也不好
console.log("inter----", mapStore.map);
function createvectorSource() {
  if (vectorSource === null) {
    //绘制用的矢量图层
    vectorSource = new VectorSource({ wrapX: false }); //   矢量数据源
    vectorLayer.setSource(vectorSource);
    mapStore.map.addLayer(vectorLayer);
    console.log("hasVectorLayer");
  }
}

// interaction组件会在mapStore.map被赋值之前就被使用，所以是null,不能直接// mapStore.map.addLayer(vectorLayer);
// 但是这样的话，每次map变化就都会执行了，这也不是我想要的
// watch(
//   () => mapStore.map,
//   () => {
//     console.log("添加绘制的矢量图层");
//     mapStore.map.addLayer(vectorLayer);
//   }
// );

// let draw = ref(null);  //不可以设置为响应式
let draw = null;
let geometryFunction;
const handleCommand = (command) => {
  let t = mapStore.map.getInteractions();
  // draw = null;
  console.log("ttt", t, draw);
  // console.log(mapStore.map.getInteractions().array_);
  //   command :dot line circle ....
  console.log("command", command);
  // if (draw !== null) {
  //   // mapStore.map.getInteractions().getArray().pop();
  // let interactions = toRaw(mapStore.map.getInteractions().getArray());
  // console.log(interactions);
  // addInteraction(command);
  // let curDraw = interactions.find((item) => item === draw);
  // console.log(curDraw);
  // let index = interactions.indexOf(curDraw);
  // if (index !== -1) {
  //   interactions.splice(index, 1);
  // }
  // }

  addInteraction(command);
  // map实例需要在多个组件中共同使用，但是它本身不能变成proxy对象，不然调用内部方法会有bug
  /* 
    解决：1.
    2.
  */
  // let map = toRaw(mapStore.map);
  // console.log(mapStore.map.getInteractions().getArray());
  // console.log(map.getInteractions().getArray());
  // console.log(map.removeInteraction(draw));

  // console.log("draw============", draw.value);
  // let t = mapStore.map.getInteractions().getArray().at(-1);
  // console.log(t);
  // console.log(mapStore.map.removeInteraction(draw.value));
  // // console.log("toRaw", toRaw(t) === draw);
  // console.log("mapStore", mapStore);
  // console.log("mapStore.map.token", mapStore.TIANDI_TOKEN);
};

function addInteraction(command) {
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
</script>

<style scoped lang="scss">
.draw {
  margin-top: 5px;
  display: flex;
  justify-content: space-evenly;
  background-color: antiquewhite;
}
</style>
