import { createRouter, createWebHistory } from "vue-router";
import MapView from "./MapView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: MapView,
    }, 
  ],
});

export default router;
