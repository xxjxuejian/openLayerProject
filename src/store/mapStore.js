import { defineStore } from "pinia";
import { ref } from "vue";

export const useMapStore = defineStore("map", () => {
  const map = ref(null);
  const counter = ref(0);

  function setMap(instance) {
    map.value = instance;
  }
  return {
    map,
    counter,
    setMap,
  };
});
