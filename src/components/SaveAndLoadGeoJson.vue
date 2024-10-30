<template>
  <div class="wrapper">
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
    <div class="save">
      <button class="btn" @click="saveFeatures">保存要素</button>
      <button class="btn" @click="loadFeatures">加载要素</button>
    </div>
  </div>
</template>

<script setup>
import { Draw, Modify } from "ol/interaction";
import Circle from "ol/geom/Circle.js";
import Feature from "ol/Feature.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import { useMapStore } from "@/store/mapStore";
import { ref, watch } from "vue";
const mapStore = useMapStore();

let vectorSource = null;
let vectorLayer = new VectorLayer({
  source: vectorSource,
});
watch(
  () => mapStore.isInitMap,
  (v) => {
    if (v) {
      mapStore.map.addLayer(vectorLayer);
      console.log(11);
    }
  }
);
function createvectorSource() {
  if (vectorSource === null) {
    //绘制用的矢量图层
    vectorSource = new VectorSource({ wrapX: false }); //   矢量数据源
    vectorLayer.setSource(vectorSource);
    // mapStore.map.addLayer(vectorLayer);
    // console.log("hasVectorLayer");
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
    // 选择none，应该是移除交互，而不是清空图层
    // vectorSource = null;
    // vectorLayer?.setSource(vectorSource);
    mapStore.deleteInteraction(draw);
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
    vectorSource.clear(); //vectorSource.clear();并不是vectorSource=null
    mapStore.deleteInteraction(draw);
    console.log("reset layer", vectorSource);
  }
};

// 保存矢量图形
const saveFeatures = () => {
  if (!vectorSource || vectorSource.getFeatures().length === 0) {
    ElMessage({
      message: "请绘制要素后再保存!",
      type: "warning",
    });
    return;
  }
  // 获取所有要素,返回当前矢量源中所有的要素（features）
  const features = vectorSource.getFeatures();
  console.log("Allfeatures", features);
  // 转为geojson格式
  // 创建一个 GeoJSON 格式化对象，用于将要素转换为 GeoJSON 格式
  const geojsonFormat = new GeoJSON({
    dataProjection: "EPSG:4326", // GeoJSON 的目标坐标系
    featureProjection: "EPSG:3857", // 源要素的坐标系
  });
  // 将传入的要素数组（features）转换为 GeoJSON 格式的数据。它会生成一个包含所有要素信息的字符串，符合 GeoJSON 的规范。
  const geojsonData = geojsonFormat.writeFeatures(features);
  console.log("geojson", geojsonData);

  // 保存到localStorage中
  localStorage.setItem("vectorData", geojsonData);
  console.log("save succsee");
};

// 加载矢量图形
const loadFeatures = () => {
  const savedGeojsonData = localStorage.getItem("vectorData");
  if (savedGeojsonData) {
    // 设置样式
    const vectorStyle = new Style({
      fill: new Fill({
        color: "rgba(255, 0, 255, 0.6)",
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.8)",
        width: 2,
      }),
      image: new CircleStyle({
        radius: 5,
        fill: null,
        stroke: new Stroke({ color: "red", width: 1 }),
      }),
    });

    // const vectorSource = new VectorSource({
    //   features: new GeoJSON().readFeatures(savedGeojsonData, {
    //     dataProjection: "EPSG:4326", // GeoJSON 的目标坐标系
    //     featureProjection: "EPSG:3857",
    //   }),
    // });

    const features = new GeoJSON().readFeatures(savedGeojsonData, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857", // 确保转换为地图使用的投影
    });
    if (vectorSource === null) {
      createvectorSource();
    }
    // console.log("loadjson", new GeoJSON().readFeatures(savedGeojsonData));
    vectorSource.addFeatures(features);
    // const vectorLayer = new VectorLayer({
    //   source: vectorSource,
    // });
    vectorLayer.setSource(vectorSource);
    vectorLayer.setStyle(vectorStyle); // 应用样式
    // mapStore.map.addLayer(vectorLayer);
    // if (vectorSource === null) {
    //   createvectorSource();
    // }
    // vectorSource.addFeatures(features);
    // // mapStore.map.addLayer(vectorLayer);
    console.log("vectorSource", vectorSource.getFeatures());
    // // console.log("vectorLayer", vectorLayer.getSource().getFeatures());
  } else {
    console.log("no data");
  }
};

function test() {}
</script>

<style scoped lang="scss">
.btn {
  padding: 3px 5px;
  margin-left: 5px;

  &.active {
    background-color: rgba(35, 167, 244, 0.397);
  }
}
.wrapper {
  margin-top: 5px;
  background-color: antiquewhite;
  .draw {
    height: 50px;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .save {
    display: flex;
    justify-content: center;
  }
}
</style>
