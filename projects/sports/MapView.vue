<script setup>
import PlaceLayer from "./PlaceLayer.vue";
import { mapStore } from "@/stores/store";
import { ref, onMounted } from "vue";
import MainLayout from "@/MainLayout.vue";
import MapControls from "./MapControls.vue";
//import MapViewThumbnail from "./MapViewThumbnail.vue";
import LandingPage from "./LandingPage.vue";

const store = mapStore();
const showInfoOverlay = ref(false)
const visibleAbout = ref(true)

onMounted(() => {
  //check if the "visited" key exists in session storage
//   let visited = false
//   visited = sessionStorage.getItem("visited") === "true";

//   if (!visited) {
//     visibleAbout.value = true;
//     sessionStorage.setItem("visited", "true");
//   }
 })

/* const toggleAboutVisibility = async () => {
  await nextTick();
  visibleAbout.value = !visibleAbout.value;
}; */

function handleShowInfo() {
  showInfoOverlay.value = true
}
</script>

<template>
  <div v-if="visibleAbout" class="overlay-landing">
    <LandingPage @close="visibleAbout = false" />
  </div>
  <MainLayout>
    <template #background>
      <div class="map-container">
        <MapControls @showInfo="handleShowInfo"/> 
        <PlaceLayer :show-info="showInfoOverlay" @close="showInfoOverlay = false">
        </PlaceLayer>

      </div>
    </template>

    <template #details>
      <!-- <MapViewThumbnail /> -->
    </template>

  </MainLayout>
</template>

<style>
.map-container {
  height: calc(100vh - 65) !important;
  width: 100%;
}

#map .leaflet-control-zoom-in {
  left: calc(50% + 50px) !important;
  top: calc(100vh - 140px) !important;
  position: fixed;
  border-radius: 10px 0px 0px 10px !important;
  height: 35px;
  border-bottom: none;
  background-color: var(--theme-3);
  color: white;
  width: 50px;
}

#map .leaflet-control-zoom-in:hover {
  background-color: var(--theme-4);
}

#map .leaflet-control-zoom-out {
  left: calc(50% + 100px);
  top: calc(100vh - 140px) !important;
  position: fixed;
  border-radius: 0px 10px 10px 0px !important;
  height: 35px;
  border-bottom: none;
  background-color: var(--theme-3);
  color: white;
  width: 50px;
}

#map .leaflet-control-zoom-out:hover {
  background-color: var(--theme-4);
}

@media screen and (max-width: 900px) {
  #map .leaflet-control-zoom-in {
    display: none !important;
    left: calc(50% - 50px) !important;
    top: calc(100vh - 320px) !important;
  }

  #map .leaflet-control-zoom-out {
    display: none !important;
    left: calc(50% + 0px) !important;
    top: calc(100vh - 320px) !important;
  }
  #map.leaflet-container {
    height: 100vh !important;
  }
}

.map-buttons {
  position: absolute;
  top: 20px;
  left: calc(50% + 100px);
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.map-button {
  background-color: var(--theme-3);
  border: none;
  border-radius: 10px 10px 10px 10px;
  padding: 10px;
  cursor: pointer;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.map-button img {
  width: 24px;
  height: 24px;
}

.map-button:hover {
  background-color: var(--theme-4);
}

.overlay-landing {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1200; 
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95); 
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
