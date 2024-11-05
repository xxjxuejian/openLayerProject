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
  </div>
</template>

<!--  每一个组件中使用的图层是独立的，这个组件中的图层和另外一个组件的图层互不影响
  但是这个组件中的矢量数据源，在这个组件中共享，这里修改的都是同一个矢量数据源  
  -->
<script setup>
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import {
  Style,
  Fill,
  Stroke,
  Circle as CircleStyle,
  Text,
  RegularShape,
} from "ol/style.js";
import { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import { getArea, getLength } from "ol/sphere";
import { Point, LineString } from "ol/geom";
import { Feature } from "ol";
import Overlay from "ol/Overlay.js";
import { useMapStore } from "@/store/mapStore";
import { ref, watch } from "vue";

const mapStore = useMapStore();

let vectorSource = new VectorSource({ wrapX: false });
let vectorLayer = new VectorLayer({
  source: vectorSource,
});
vectorLayer.setSource(vectorSource);

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
      mapStore.map.addInteraction(modify);
      mapStore.map.addInteraction(snap);
      console.log("initialed map & added vectorLayer");
      // console.log(toRaw(map.value));
    }
  }
);
function createvectorSource() {
  if (vectorSource === null) {
    //绘制用的矢量图层
    vectorSource = new VectorSource({ wrapX: false }); //   矢量数据源
  }
}

// draw是交互对象，snap是吸附对象
/* 
  snap和modify对象可以初始就添加，可以通过setActice true或者false启用或者禁用
  draw每次绘制的都不一样，所以最开始不添加，而且每次要删除之前的，绘制新的图形，所以用的是deleteInteraction
  snap吸附甚至可以一直开启
*/
let draw = null;
let snap = new Snap({ source: vectorSource });
let tipPoint;
// 编辑相关,默认开启交互
const isModify = ref(true);
let modify = new Modify({ source: vectorSource });
const handleCommand = (command) => {
  //   command :dot line circle ....
  console.log("command", command);
  mapStore.deleteInteraction(draw);
  addInteraction(command);
};

const formatArea = function (polygon) {
  const area = getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + " km\xB2";
  } else {
    output = Math.round(area * 100) / 100 + " m\xB2";
  }
  return output;
};
const formatLength = function (line) {
  const length = getLength(line);
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + " km";
  } else {
    output = Math.round(length * 100) / 100 + " m";
  }
  return output;
};

const style = new Style({
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.2)",
  }),
  stroke: new Stroke({
    color: "rgba(0, 0, 0, 0.5)",
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
  }),
});
const labelStyle = new Style({
  text: new Text({
    font: "14px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [3, 3, 3, 3],
    textBaseline: "bottom",
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});
const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
  text: new Text({
    text: "Drag to modify",
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});
const segmentStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textBaseline: "bottom",
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
});

const segmentStyles = [segmentStyle];
function styleFunction(feature, segments, drawType, tip) {
  console.log("styleFunction+++++++++++++");
  const styles = [style];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type) {
    if (type === "Polygon") {
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === "LineString") {
      point = new Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    let count = 0;
    line.forEachSegment(function (a, b) {
      const segment = new LineString([a, b]);
      const label = formatLength(segment);
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  if (
    tip &&
    type === "Point" &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tipStyle.getText().setText(tip);
    styles.push(tipStyle);
  }
  return styles;
}

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
      // 这个函数每次绘制完成都会执行，所以可以动态修改样式
      style: function (feature) {
        return styleFunction(feature, true, "Polygon", "11");
      },
    });

    addDrawListener(draw);
    mapStore.map.addInteraction(draw);
  } else {
    // 选择none，应该是移除交互，不用清空图层
    mapStore.deleteInteraction(draw);
    console.log("none");
  }
}

// 监听绘制完成的事件
function addDrawListener(draw) {
  draw.on("drawstart", (event) => {
    modify.setActive(false);
  });

  draw.on("drawend", (event) => {
    console.log("drawend-----------");
    const feature = event.feature;
    const geometry = feature.getGeometry();
    const type = geometry.getType();
    if (type !== "Polygon") return;

    // 计算面积（以平方米为单位），坐标系要是4326，不是要做一个转换
    const area = getArea(geometry);

    // 区域质心
    const coordinates = geometry.getInteriorPoint().getCoordinates();
    const [lon, lat] = coordinates; //经纬度

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

    modify.setActive(true); // 启用修改交互
  });
}

const handleIsModify = () => {
  // 启用与禁用编辑
  isModify.value = !isModify.value;
  // 如果是启用
  if (isModify.value) {
    if (!vectorSource) {
      createvectorSource();
    }
    modify.setActive(true);
  }
  // 如果是禁用
  else {
    // 禁用就移除编辑交互,移除绘制交互
    mapStore.deleteInteraction(draw);
    modify.setActive(false);
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

.area-text {
  background-color: rgba(255, 255, 255, 0.7);
  padding: 5px;
  border-radius: 3px;
  font-size: 14px;
  font-weight: bold;
  color: black;
}
</style>
