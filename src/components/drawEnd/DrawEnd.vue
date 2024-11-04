<template>
  <div class="wrapper">
    <div class="title">1.添加吸附 2.添加drawend 事件</div>
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
      <div class="style-settings-header">
        <p>样式配置</p>
        <div class="quit" @click="isShowStyleSetting = false" title="关闭">
          X
        </div>
      </div>
      <el-tabs
        v-model="activeName"
        type="border-card"
        class="demo-tabs"
        @tab-change="handleTabChange"
      >
        <el-tab-pane label="点" name="Point">
          <template #default>
            <StyleInput
              :type="type"
              v-if="type === 'Point'"
              ref="StyleInputRefInstance"
            ></StyleInput>
          </template>
        </el-tab-pane>
        <el-tab-pane label="线" name="LineString" :type="type">
          <template #default>
            <StyleInput
              :type="type"
              v-if="type === 'LineString'"
              ref="StyleInputRefInstance"
            ></StyleInput>
          </template>
        </el-tab-pane>
        <el-tab-pane label="面" name="Polygon" :type="type">
          <template #default>
            <StyleInput
              :type="type"
              v-if="type === 'Polygon'"
              ref="StyleInputRefInstance"
            ></StyleInput>
          </template>
        </el-tab-pane>
      </el-tabs>
      <div class="save-btn">
        <button class="btn" @click="handleSaveStyle">应用</button>
      </div>
    </div>
  </div>
</template>

<!--  每一个组件中使用的图层是独立的，这个组件中的图层和另外一个组件的图层互不影响
  但是这个组件中的矢量数据源，在这个组件中共享，这里修改的都是同一个矢量数据源  
  -->
<script setup>
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import { getArea } from "ol/sphere";
import { Point } from "ol/geom";
import { Feature } from "ol";
import StyleInput from "./StyleInput.vue";
import { useMapStore } from "@/store/mapStore";
import { ref, watch, toRaw } from "vue";
import { storeToRefs } from "pinia";

const mapStore = useMapStore();
const { map } = storeToRefs(mapStore);

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
      // 图层多的原因是因为侧边栏加载了多个组件，每个组件都创建了图层，所有会有多个矢量图层，
      // 这些图层都是挂载到一个地图上的，如果把之前的组件注释了，那就只会有两个最初的初始图层TileLayer
      // console.log(mapStore.map.getLayers());

      mapStore.map.addLayer(vectorLayer);
      console.log("initialed map & added vectorLayer");
      // console.log(toRaw(map.value));
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

// draw是交互对象，snap是吸附对象
let draw = null;
let snap = null;
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
    // 添加绘制结束事件
    addDrawEnd(draw);
    // 添加吸附
    snap = new Snap({ source: vectorSource });
    mapStore.map.addInteraction(snap);
  } else {
    // 选择none，应该是移除交互，而不是清空图层
    mapStore.deleteInteraction(draw);
    console.log("none");
  }
}
// 监听绘制完成的事件
function addDrawEnd(draw) {
  draw.on("drawend", (event) => {
    console.log("drawend-----------");
    const feature = event.feature;
    const geometry = feature.getGeometry();

    // 计算面积（以平方米为单位），坐标系要是4326，不是要做一个转换
    const area = getArea(geometry);

    // 将面积转换为公顷（可选）
    const areaInHectares = area / 10000;

    console.log("绘制区域的面积: " + area + "平方米");
    console.log("绘制区域的面积: " + areaInHectares + "公顷");

    // 把面积文本显示出来
    const areaText = `绘制区域的面积:  ${area.toFixed(2)} 平方米`;
    // 计算文本位置（取中心点），可以理解为质心，返回值的格式通常是 [longitude, latitude]，即经度和纬度坐标。
    const coordinates = geometry.getInteriorPoint().getCoordinates();
    const [lon, lat] = coordinates;

    // 标记这个点
    const zhiXinPointFeature = new Feature({
      geometry: new Point(coordinates),
      name: "质心",
    });
    zhiXinPointFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: "red",
          }),
          stroke: new Stroke({
            color: "black",
            width: 2,
          }),
        }),
      })
    );
    vectorSource.addFeature(zhiXinPointFeature);

    // 将坐标转换为像素坐标,这个像素坐标是相对于地图容器的偏移像素
    // 左上角是0，0 点，【x,y】
    const pixel = mapStore.map.getPixelFromCoordinate([lon, lat]);
    console.log(pixel);


    // 将文本特征添加到矢量源中，就是对这个矢量数据源操作，所以不需要重新获取数据源
    // mapStore.map.getLayers().item(0).getSource().addFeature(textFeature);
  });
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

// 创建样式
// 设置一个默认的样式对象,目前只针对点,线,面,三种要素
let defaultStyle = createStyleV2();
// 这个函数是创建一个整个图层的所有的要素的样式的,由于要针对不同要素设置不同样式,所有需要用createStyleV2的方式
/* function createStyle() {
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
  } */

function createStyleV2() {
  return {
    Point: new Style({
      image: new CircleStyle({
        radius: 5,
        fill: null,
        stroke: new Stroke({ color: "#77b8d7", width: 2 }),
      }),
    }),
    LineString: new Style({
      stroke: new Stroke({
        color: "#77b8d7",
        width: 2,
      }),
    }),
    Polygon: new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.5)", // 半透明
      }),
      stroke: new Stroke({
        color: "#77b8d7",
        width: 2,
      }),
    }),
  };
}
//
/*
  加载矢量图形, 目前圆形加载不支持，要怎么修改
  这个加载是把所有的 features 加载到同一个矢量图层中，样式设置是图层设置的,vectorLayer.setStyle(vectorStyle);
  如果要针对点,线,面,设置不同的样式,就需要将他们分别渲染在不同的图层中
   */
const loadFeatures = () => {
  const savedGeojsonData = localStorage.getItem("vectorData");
  if (savedGeojsonData) {
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
    // 只执行一次
    // vectorLayer.setStyle(vectorStyle); // 应用样式

    // setStyle(fn),这个函数会在每次拖动地图都会执行 ,可能会对性能有一定影像
    vectorLayer.setStyle((feature) => {
      // console.log("value", feature.getGeometry().getType());
      return defaultStyle[feature.getGeometry().getType()];
    });
  } else {
    console.log("no data");
  }
};

// 配置样式
const isShowStyleSetting = ref(false);
const activeName = ref("Point");
const type = ref("Point");
const StyleInputRefInstance = ref(null);

// 控制样式配置面板的显示
const configureStyle = () => {
  isShowStyleSetting.value = !isShowStyleSetting.value;
};

// tab切换改变type值
const handleTabChange = (value) => {
  type.value = value;
};
// 保存按钮的处理逻辑
const handleSaveStyle = () => {
  const styleSettings = StyleInputRefInstance.value.getValues();
  console.log(styleSettings);
  applyStyleSettings(styleSettings);
};

// 应用新的样式到要素上
function applyStyleSettings(styleSettings) {
  let newStyle = {};
  if (type.value === "Polygon") {
    newStyle = {
      Polygon: new Style({
        fill: new Fill({
          color: styleSettings.fillColor,
        }),
        stroke: new Stroke({
          color: styleSettings.strokeColor,
          width: styleSettings.strokeWidth,
        }),
      }),
    };
  } else if (type.value === "Point") {
    newStyle = {
      Point: new Style({
        image: new CircleStyle({
          radius: styleSettings.pointRadius,
          fill: new Fill({ color: styleSettings.fillColor }),
          stroke: new Stroke({
            color: styleSettings.strokeColor,
            width: styleSettings.strokeWidth,
          }),
        }),
      }),
    };
  } else {
    newStyle = {
      LineString: new Style({
        stroke: new Stroke({
          color: styleSettings.strokeColor,
          width: styleSettings.strokeWidth,
        }),
      }),
    };
  }

  defaultStyle = { ...defaultStyle, ...newStyle };
  vectorLayer.setStyle((feature) => {
    // console.log("value", feature.getGeometry().getType());
    return defaultStyle[feature.getGeometry().getType()];
  });
}
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
  // background-color: antiquewhite;
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
    // height: 300px;
    width: 300px;
    padding: 0 10px 35px;
    background-color: #fff;

    .style-settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 40px;

      .quit {
        cursor: pointer;
      }
    }

    :deep(.el-tabs__nav) {
      width: 100%;

      .el-tabs__item {
        flex: 1;
      }
    }

    .save-btn {
      display: flex;
      justify-content: center;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30px;
    }
  }
}
</style>
