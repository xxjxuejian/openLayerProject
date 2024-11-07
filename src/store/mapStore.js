import { defineStore } from "pinia";
import TileLayer from "ol/layer/Tile.js";
import { XYZ as XYZ, OSM as OSM, BingMaps as BingMaps } from "ol/source";
import { ref, toRaw } from "vue";

export const useMapStore = defineStore("map", () => {
  const map = ref(null);
  const TIANDI_TOKEN = "ade57801997980f3af716dc86639979e";
  const isInitMap = ref(false);
  function setMap(instance) {
    console.log("map----");
    map.value = instance;
    isInitMap.value = true;
  }
  let pointStyle;
  let lineStyle;
  let polygonStyle;

  // 切换地图就要先移除当前的底图
  function removeLayers() {
    // 移除图层，就要指出哪一个图层，所以要先获取图层,返回值是图层数组
    const layers = map.value.getLayers().getArray();
    // console.log(layers); //数组

    // removeLayer()只是移除一个图层，所以需要对上面的数组遍历移除
    // for (let i = 0; i < layers.length; i++) {
    //   map.value.removeLayer(layers[i]);
    //   console.log(1);
    // }

    // 倒序循环删除
    for (let i = layers.length - 1; i >= 0; i--) {
      map.value.removeLayer(layers[i]);
      console.log(1);
    }
  }

  // 创建地图图层
  function createLayer(type) {
    let layers = [];
    switch (type) {
      case "OSM":
        layers = [
          new TileLayer({
            source: new OSM(),
          }),
        ];
        break;
      case "TIANDITU":
        layers = [
          new TileLayer({
            source: new XYZ({
              title: "天地图矢量图层",
              url:
                "http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=" +
                TIANDI_TOKEN,
            }),
          }),
          new TileLayer({
            source: new XYZ({
              title: "天地图矢量注记图层",
              url:
                "http://t0.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=" +
                TIANDI_TOKEN,
            }),
          }),
        ];
        break;
      // bing地图没有正确的key，暂时无法实现
      case "BING":
        layers = [
          new TileLayer({
            source: new BingMaps({
              key: "AkjzA7OhS4MIBjutL21bkAop7dc41HSE0CNTR5c6HJy8JKc7U9U9RveWJrylD3XJ",
              imagerySet: "Aerial",
            }),
          }),
        ];
        break;
    }
    return layers;
  }

  function deleteInteraction(interaction) {
    // 就是删除不掉
    // let t = map.value.removeInteraction(interaction);
    // console.log(t);

    // map是一个proxy对象，要toRaw(map.value)，而不是toRaw(map) 所以要转换成原始对象,
    if (!interaction) return;
    let tMap = toRaw(map.value);
    // console.log(tMap);
    let inter = tMap.removeInteraction(interaction);
    console.log("移除交互", inter);
  }

  function deleteOverlay(overlay) {
    if (!overlay) return;
    let tMap = toRaw(map.value);

    let ov = tMap.removeOverlay(overlay);
    console.log("移除overlay", ov);
  }

  return {
    map,
    isInitMap,
    TIANDI_TOKEN,
    setMap,
    removeLayers,
    createLayer,
    deleteInteraction,
    deleteOverlay,
  };
});
