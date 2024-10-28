import "./styles/main.css";
// import "./styles/ol.css";
import "element-plus/dist/index.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// App.vue是根组件
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

// 全局注册element-plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

console.log("环境变量：", import.meta.env.VITE_TIANDI_TOKEN);

app.use(pinia);
app.use(ElementPlus);
app.mount("#app");
