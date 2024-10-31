<template>
  <div class="color-picker">
    <label class="title">{{ props.type }}颜色：</label>
    <el-color-picker v-model="color" show-alpha />
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "边框",
  },
});
const color = ref("#000000");
</script>

<style scoped lang="scss">
.color-picker {
  display: flex;
  justify-content: start;
  align-items: center;
  margin-bottom: 5px;

  .title {
    width: 40%;
  }
}
</style>
