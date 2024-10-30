<template>
  <div class="wrapper">
    <div class="title">针对点，线，面，有一个单独的样式配置选项卡</div>
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
    <div class="btns">
      <button class="btn" @click="saveFeatures">保存要素</button>
      <button class="btn" @click="loadFeatures">加载要素</button>
      <button class="btn" @click="configureStyle">配置样式</button>
    </div>
    <div class="style-settings" v-if="isShowStyleSetting">
      <el-tabs
        v-model="activeName"
        type="card"
        class="demo-tabs"
        @tab-change="handleTabChange"
      >
        <el-tab-pane label="点" name="point">
          <template #default>
            <div class="style point-style">
              <div class="item">
                <label for="pointRadius">点大小(radius):</label
                ><input type="number" id="pointRadius" placeholder="5" />
              </div>
              <div class="item">
                <label for="">填充颜色(color):</label>
                <el-color-picker v-model="color" show-alpha />
              </div>
              <div class="item">
                <label for="">边框颜色(color):</label>
                <el-color-picker v-model="color" show-alpha />
              </div>
              <div class="item">
                <label for="">边框粗细(width):</label>
                <input type="number" placeholder="5" />
              </div>
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="线" name="line">线样式</el-tab-pane>
        <el-tab-pane label="面" name="polygon">面样式</el-tab-pane>
      </el-tabs>
      <div class="save-btn">
        <button class="btn">保存</button>
      </div>
    </div>
  </div>
</template>

<!--  每一个组件中使用的图层是独立的，这个组件中的图层和另外一个组件的图层互不影响
但是这个组件中的矢量数据源，在这个组件中共享，这里修改的都是同一个矢量数据源  
-->
<script setup>
import { Draw, Modify } from "ol/interaction";
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

/*
改变了添加图层的逻辑，不能直接mapStore.map.addLayer，因为在setup中mapStore.map此时还没初始化完成
等到初始化完成以后自动添加一个矢量图层，用来绘制个加载矢量数据，后面就不用再添加图层了
而是直接修改数据源
*/
watch(
  () => mapStore.isInitMap,
  (v) => {
    if (v) {
      mapStore.map.addLayer(vectorLayer);
      console.log("initialed map & added vectorLayer");
    }
  }
);
function createvectorSource() {
  if (vectorSource === null) {
    //绘制用的矢量图层
    vectorSource = new VectorSource({ wrapX: false }); //   矢量数据源
    vectorLayer.setSource(vectorSource);
    // console.log("created vectorSource");
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
/*
在保存和读取这些features时，需要考虑坐标系问题。
在保存时，需要将要素转换为 GeoJSON 格式，并指定源坐标系和目标坐标系。
在加载时，需要将 GeoJSON 数据转换为要素，并指定源坐标系和目标坐标系。

重要的是统一坐标行，不指定默认采用的是地图使用的坐标系。
// 读取时，需要将 GeoJSON 数据转换为要素，并指定源坐标系和目标坐标系。
const vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(savedGeojsonData, {
    dataProjection: "EPSG:4326", // GeoJSON 的目标坐标系
    featureProjection: "EPSG:3857",
  }),
});
 */
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

  const geojsonFormat = new GeoJSON();
  // 将传入的要素数组（features）转换为 GeoJSON 格式的数据。它会生成一个包含所有要素信息的字符串，符合 GeoJSON 的规范。
  const geojsonData = geojsonFormat.writeFeatures(features);
  console.log("geojson", geojsonData);

  // 保存到localStorage中
  localStorage.setItem("vectorData", geojsonData);
  console.log("save succsee");
};

function createStyle() {
  return new Style({
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
}
// 加载矢量图形
const loadFeatures = () => {
  const savedGeojsonData = localStorage.getItem("vectorData");
  if (savedGeojsonData) {
    // 设置样式
    const vectorStyle = createStyle();

    const features = new GeoJSON().readFeatures(
      savedGeojsonData
      // {
      //   dataProjection: "EPSG:4326",
      //   featureProjection: "EPSG:3857", // 确保转换为地图使用的投影
      // }
    );
    if (vectorSource === null) {
      createvectorSource();
    }

    vectorSource.addFeatures(features);
    vectorLayer.setSource(vectorSource);
    vectorLayer.setStyle(vectorStyle); // 应用样式
    console.log("vectorSource", vectorSource.getFeatures());
  } else {
    console.log("no data");
  }
};

// 配置样式
const isShowStyleSetting = ref(false);
const activeName = ref("point");
const configureStyle = () => {
  isShowStyleSetting.value = !isShowStyleSetting.value;
};
const handleTabChange = (value) => {
  console.log(value);
};
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
  position: relative;
  margin-top: 5px;
  background-color: antiquewhite;
  .draw {
    height: 50px;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .btns {
    display: flex;
    justify-content: center;
  }

  .style-settings {
    position: absolute;
    left: 100%;
    top: -100%;
    z-index: 10;
    height: 300px;
    background-color: #fff;

    .save-btn {
      display: flex;
      justify-content: center;
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 30px;
      background-color: aquamarine;
    }
  }
}
</style>
