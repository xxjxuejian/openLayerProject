<template>
  <div class="wrapper">
    <div class="point feature" v-if="type === 'point'">
      <div class="item">
        <label for="pointRadius" class="title">点大小:</label>
        <input
          type="number"
          placeholder="2"
          id="pointRadius"
          min="1"
          v-model="pointRadius"
        />
      </div>
      <div class="item">
        <label for="pointWidth" class="title">边框大小:</label>
        <input
          type="number"
          placeholder="5"
          id="width"
          min="1"
          v-model="width"
        />
      </div>
      <div class="item">
        <label class="title">边框颜色：</label>
        <el-color-picker v-model="borderColor" show-alpha />
      </div>
      <div class="item">
        <label class="title">填充颜色：</label>
        <el-color-picker v-model="fillColor" show-alpha />
      </div>
    </div>

    <div class="line feature" v-else-if="type === 'line'">
      <div class="item">
        <label for="pointWidth" class="title">线条大小:</label>
        <input type="number" placeholder="5" id="width" min="1" />
      </div>
      <div class="item">
        <label class="title">线条颜色：</label>
        <el-color-picker v-model="borderColor" show-alpha />
      </div>
    </div>
    <div class="polygon feature" v-else>
      <div class="item">
        <label for="pointWidth" class="title">边框大小:</label>
        <input type="number" placeholder="5" id="width" min="1" />
      </div>
      <div class="item">
        <label class="title">边框颜色：</label>
        <el-color-picker v-model="borderColor" show-alpha />
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
const width = ref(5);
const borderColor = ref("");
const fillColor = ref("");
const props = defineProps({
  type: {
    type: String,
    default: "point",
  },
});
console.log("props.type", props.type);
const getValues = () => {
  console.log(pointRadius, width, borderColor, fillColor);
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
