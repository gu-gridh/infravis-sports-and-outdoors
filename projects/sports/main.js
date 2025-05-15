import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import { createPinia } from "pinia";
import router from "./router";
import OpenLayersMap from "vue3-openlayers";
import "vue3-openlayers/dist/vue3-openlayers.css";
import "@/assets/main.css";
import messages from "@/locales/index.json";

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "sv",
  messages
});

createApp(App)
  .use(createPinia())
  .use(router)
  .use(OpenLayersMap)
  .use(i18n)
  .mount("#app");
