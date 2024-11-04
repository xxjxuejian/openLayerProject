<template>
  <div class="wrapper">
    <div class="point feature" v-if="type === 'Point'">
      <div class="item">
        <label for="pointRadius" class="title">点半径:</label>
        <input
          type="number"
          placeholder="2"
          id="pointRadius"
          min="1"
          v-model="pointRadius"
        />
      </div>
      <div class="item">
        <!-- for="strokeWidth"  id="strokeWidth"-->
        <label class="title">点边框:</label>
        <input type="number" placeholder="5" min="1" v-model="strokeWidth" />
      </div>
      <div class="item">
        <label class="title">边框颜色：</label>
        <el-color-picker v-model="strokeColor" show-alpha />
      </div>
      <div class="item">
        <label class="title">填充颜色：</label>
        <el-color-picker v-model="fillColor" show-alpha />
      </div>
    </div>

    <div class="line feature" v-else-if="type === 'LineString'">
      <div class="item">
        <label for="strokeWidth" class="title">线条大小:</label>
        <input
          type="number"
          placeholder="5"
          min="1"
          id="strokeWidth"
          v-model="strokeWidth"
        />
      </div>
      <div class="item">
        <label class="title">线条颜色：</label>
        <el-color-picker v-model="strokeColor" show-alpha />
      </div>
    </div>
    <div class="polygon feature" v-else>
      <div class="item">
        <!-- for="strokeWidth"  id="strokeWidth" -->
        <label class="title">边框大小:</label>
        <input type="number" placeholder="5" min="1" v-model="strokeWidth" />
      </div>
      <div class="item">
        <label class="title">边框颜色：</label>
        <el-color-picker v-model="strokeColor" show-alpha />
      </div>
      <div class="item">
        <label class="title">填充颜色：</label>
        <el-color-picker v-model="fillColor" show-alpha />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const pointRadius = ref(2);
const strokeWidth = ref(5);
const strokeColor = ref("rgba(0, 0, 0, 1)");
const fillColor = ref("rgba(255, 255, 255, 0.3)");
const styleSettingResults = ref({});
const props = defineProps({
  type: {
    type: String,
    default: "Point",
  },
});
console.log("props.type", props.type);
const getValues = () => {
  if (props.type === "Point") {
    styleSettingResults.value = {
      pointRadius: pointRadius.value,
      strokeWidth: strokeWidth.value,
      strokeColor: strokeColor.value,
      fillColor: fillColor.value,
    };
  } else if (props.type === "LineSting") {
    styleSettingResults.value = {
      strokeWidth: strokeWidth.value,
      strokeColor: strokeColor.value,
    };
  } else {
    styleSettingResults.value = {
      strokeWidth: strokeWidth.value,
      strokeColor: strokeColor.value,
      fillColor: fillColor.value,
    };
  }
  return styleSettingResults.value;
};
defineExpose({
  getValues,
});
</script>

<style scoped lang="scss">
.wrapper {
  .feature {
    .item {
      display: flex;
      align-items: center;
      width: 100%;

      .title {
        width: 40%;
      }

      input {
        width: 60%;
      }
    }
  }
}
</style>
