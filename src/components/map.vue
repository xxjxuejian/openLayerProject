<script setup>
import "../styles/ol.css";
import Map from "ol/Map.js";
import TileLayer from "ol/layer/Tile.js";
import XYZ from "ol/source/XYZ";
import View from "ol/View.js";
import { transform } from "ol/proj";
import { onMounted } from "vue";
import { useMapStore } from "@/store/mapStore";

const mapStore = useMapStore();
const TIANDI_TOKEN = mapStore.TIANDI_TOKEN;

const emits = defineEmits(["mapLoaded"]);
// const TIANDI_TOKEN = import.meta.env.VITE_TIANDI_TOKEN;
function initMap() {
  const map = new Map({
    target: "map",
    layers: [
      new TileLayer({
        title: "天地图矢量图层",
        source: new XYZ({
          url:
            "http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=" +
            TIANDI_TOKEN,
          wrapX: false,
          crossOrigin: "anonymous",
        }),
      }),
      new TileLayer({
        title: "天地图矢量注记",
        source: new XYZ({
          url:
            "http://t0.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=" +
            TIANDI_TOKEN,
          wrapX: false,
          attributions: "天地图的属性描述",
          crossOrigin: "anonymous",
        }),
      }),
    ],
    view: new View({
      center: transform([116.410305, 39.912943], "EPSG:4326", "EPSG:3857"),
      // projection: "EPSG:3857",
      zoom: 5,
    }),
  });

  // 放到store上,发送事件，地图初始化完成
  mapStore.setMap(map);
  mapStore.map = map;
  console.log("mapvue", mapStore.map);
  console.log("collections", map.getInteractions());
  emits("mapLoaded");
}
onMounted(() => {
  initMap();
});
</script>

<template>
  <div id="map"></div>
</template>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}
</style>
