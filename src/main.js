import "./styles/main.css";
// import "./styles/ol.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
// App.vue是根组件
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
