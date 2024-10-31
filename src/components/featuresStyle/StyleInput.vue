<template>
  <div class="wrapper">
    <div class="item">
      <WidthPicker></WidthPicker>
    </div>
    <div class="item">
      <ColorPicker></ColorPicker>
    </div>
    <div class="item">
      <ColorPicker></ColorPicker>
    </div>
    <div class="item">
      <WidthPicker></WidthPicker>
    </div>
  </div>
</template>

<script setup>
import ColorPicker from "./ColorPicker.vue";
import WidthPicker from "./WidthPicker.vue";
const props = defineProps({
  type: {
    type: String,
    default: "point",
  },
});
console.log(props.type);
</script>

<style scoped></style>
