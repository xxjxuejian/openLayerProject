<script setup>
import { useMapStore } from "@/store/mapStore";
import { storeToRefs } from "pinia";
import { transform } from "ol/proj";

// 仅仅是获取store，直接解构，同时保留响应式,需要.value
// 如果是mapStore.map是不用.value的
const mapStore = useMapStore();
const { map } = mapStore; //需要.value

console.log("---", mapStore.map);
// 左移
const moveToLeft = () => {
  const view = map.getView();
  // console.log(view);

  let mapCenter = view.getCenter();
  // console.log("mapCenter", mapCenter); [0,0]：center
  mapCenter[0] += 50000;
  view.setCenter(mapCenter);
  map.render();
};

const moveToRight = () => {
  const view = map.getView();
  let mapCenter = view.getCenter();
  view.setCenter(mapCenter);
  mapCenter[0] -= 50000;
  map.render();
};

// 向上移动地图
function moveToUp() {
  const view = map.getView();
  const mapCenter = view.getCenter();
  // 让地图中心的y值减少，即可使得地图向上移动，减少的值根据效果可自由设定
  mapCenter[1] -= 50000;
  view.setCenter(mapCenter);
  map.render();
}

// 下移
function moveToDown() {
  const view = map.getView();
  const mapCenter = view.getCenter();
  // 让地图中心的y值减少，即可使得地图向上移动，减少的值根据效果可自由设定
  mapCenter[1] += 50000;
  view.setCenter(mapCenter);
  map.render();
}

// 放大地图
function zoomIn() {
  const view = map.getView();
  // 让地图的zoom增加1，从而实现地图放大
  view.setZoom(view.getZoom() + 1);
}

// 缩小地图
function zoomOut() {
  const view = map.getView();
  // 让地图的zoom减小1，从而实现地图缩小
  view.setZoom(view.getZoom() - 1);
}

// 定位到杭州
function moveToHangZhou() {
  const view = map.getView();
  // 设置地图中心为杭州的坐标，即可让地图移动到杭州：无动画
  // view.setCenter(transform([120.215223, 30.256326], "EPSG:4326", "EPSG:3857"));
  // view.setZoom(view.getZoom() + 3);
  // map.render();

  // 平移动画效果
  view.animate({
    center: transform([120.215223, 30.256326], "EPSG:4326", "EPSG:3857"),
    duration: 2000,
    zoom: view.getZoom() + 3,
  });
}

// 重置，就是重置到北京，默认参数
const reset = () => {
  const view = map.getView();

  // 平移动画效果
  view.animate({
    center: transform([116.410305, 39.912943], "EPSG:4326", "EPSG:3857"),
    duration: 2000,
    zoom: view.getZoom() - 3,
  });
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
