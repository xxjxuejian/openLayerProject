<template>
  <div class="width-picker">
    <label for="" class="title">边框粗细:</label>
    <input type="number" placeholder="5" />
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
// const color = ref("#000000");
</script>

<style scoped lang="scss">
.width-picker {
  display: flex;
  justify-content: start;
  align-items: center;
  margin-bottom: 5px;

  .title {
    width: 40%;
  }

  input {
    width: 60%;
  }
  input:focus {
    outline: none;
  }
}
</style>
