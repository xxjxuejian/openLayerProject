<script setup>
import { useMapStore } from "@/store/mapStore";
import { storeToRefs } from "pinia";
import { transform } from "ol/proj";
import {}

// 仅仅是获取store，直接解构，同时保留响应式,需要.value
// 如果是mapStore.map是不用.value的
const mapStore = useMapStore();
const { map } = storeToRefs(mapStore); //需要.value

// 左移
const moveToLeft = () => {
  const view = map.value.getView();
  // console.log(view);

  let mapCenter = view.getCenter();
  // console.log("mapCenter", mapCenter); [0,0]：center
  mapCenter[0] += 50000;
  view.setCenter(mapCenter);
  map.value.render();
};

const moveToRight = () => {
  const view = map.value.getView();
  let mapCenter = view.getCenter();
  view.setCenter(mapCenter);
  mapCenter[0] -= 50000;
  map.value.render();
};

// 向上移动地图
function moveToUp() {
  const view = map.value.getView();
  const mapCenter = view.getCenter();
  // 让地图中心的y值减少，即可使得地图向上移动，减少的值根据效果可自由设定
  mapCenter[1] -= 50000;
  view.setCenter(mapCenter);
  map.value.render();
}

// 下移
function moveToDown() {
  const view = map.value.getView();
  const mapCenter = view.getCenter();
  // 让地图中心的y值减少，即可使得地图向上移动，减少的值根据效果可自由设定
  mapCenter[1] += 50000;
  view.setCenter(mapCenter);
  map.value.render();
}

// 放大地图
function zoomIn() {
  const view = map.value.getView();
  // 让地图的zoom增加1，从而实现地图放大
  view.setZoom(view.getZoom() + 1);
}

// 缩小地图
function zoomOut() {
  const view = map.value.getView();
  // 让地图的zoom减小1，从而实现地图缩小
  view.setZoom(view.getZoom() - 1);
}

// 定位到杭州
function moveToHangZhou() {
  var view = map.value.getView();
  // 设置地图中心为杭州的坐标，即可让地图移动到杭州
  view.setCenter(transform([120.215223, 30.256326], "EPSG:4326", "EPSG:3857"));

  // 定义到杭州的同时，把地图的缩放等级也调高
  // 过渡动画怎么加？？
  view.setZoom(view.getZoom() + 2);
  map.value.render();
}

// 重置，就是重置到北京，默认参数
const reset = () => {
  console.log("reset");
};
</script>

<template>
  <div class="navigate-container">
    <input type="button" class="nav" value="左移" @click="moveToLeft" />
    <input type="button" class="nav" value="右移" @click="moveToRight" />
    <input type="button" class="nav" value="上移" @click="moveToUp" />
    <input type="button" class="nav" value="下移" @click="moveToDown" />
    <input type="button" class="nav" value="放大" @click="zoomIn" />
    <input type="button" class="nav" value="缩小" @click="zoomOut" />
    <input type="button" class="nav" value="定位杭州" @click="moveToHangZhou" />
    <input type="button" class="nav" value="重置" @click="reset" />
  </div>
</template>

<style scoped>
.navigate-container {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;

  .nav {
    background-color: #e5e5e5;
    color: #000;
    border: none;
    border-radius: 2px;
    padding: 2px;
  }
  .nav:hover {
    cursor: pointer;
  }
}
</style>
