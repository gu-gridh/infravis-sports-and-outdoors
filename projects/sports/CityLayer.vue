<template>
    <div class="city-layer"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref, computed } from "vue";
import L from "leaflet";
import { useSportsStore } from "./settings/store";
// import * as turf from "@turf/turf";

const props = defineProps({
    map: {
        type: Object,
        required: true,
    },
});

const sportsStore = useSportsStore();
const layer = ref(null);

//generating URLs
function asset(path) {
    return `${import.meta.env.BASE_URL}${path}`;
}

//choose the correct file
const geojsonFile = computed(() => {
    return sportsStore.sustainabilityFilterType === "index"
        ? "geojson/t2_index_by_city.geojson"
        : "geojson/t1_ttm_15_30_60_by_city.geojson";
});

function generateTravelPropName() {
  //replace spaces with underscores
  const activity = sportsStore.travelTimeActivity.replace(/ /g, '_');
  const mode = sportsStore.travelTimeTransportMode.replace(/ /g, '_');
  
  const minutes = sportsStore.travelTimeMinutes;
  
  const modeLower = sportsStore.travelTimeTransportMode.toLowerCase();
  let dayPart = "";
  if (modeLower === "sustainable" || modeLower === "transit") { //only add if sustainable or transit mode
    //check if the day is saturday or sunday
    const dayValue = sportsStore.travelTimeDay;
    if (dayValue.toLowerCase() === "saturday" || dayValue.toLowerCase() === "sunday") {
      dayPart = `_${dayValue.replace(/ /g, '_')}`;
    }
  }
  
  return `${activity}_${mode}${dayPart}_${minutes}`;
}

function styleFeature(feature) {
    if (sportsStore.sustainabilityFilterType === "index") {
        const propName = `index_dd_${sportsStore.sustainabilityIndexMinutes}_min_${sportsStore.sustainabilityIndexActivity}_${sportsStore.sustainabilityIndexDay}`;
        const val = feature.properties[propName];
        console.log("Index mode:", { propName, val, properties: feature.properties });
        return {
            color: "black",
            fillColor: setIndexColor(val),
            fillOpacity: 0.9,
            weight: 1,
        };
    } else {
        const propName = generateTravelPropName();
        const val = feature.properties[propName];
        console.log("Travel mode:", { propName, val, properties: feature.properties });
        return {
            color: "black",
            fillColor: setAccColor(val),
            fillOpacity: 0.9,
            weight: 1,
        };
    }
}

function setIndexColor(time) {
    if (time === null || time === 0) return "#cccccc";
    if (time >= 0 && time <= 10) return "#d71f27";
    if (time >= 11 && time <= 20) return "#e95a38";
    if (time >= 21 && time <= 30) return "#f69c5a";
    if (time >= 31 && time <= 40) return "#fdc980";
    if (time >= 41 && time <= 50) return "#fdefac";
    if (time >= 51 && time <= 60) return "#e8eeac";
    if (time >= 61 && time <= 70) return "#c4dd87";
    if (time >= 71 && time <= 80) return "#99cc64";
    if (time >= 81 && time <= 90) return "#55b453";
    if (time >= 91 && time <= 100) return "#179847";
    return "#cccccc";
}

function setAccColor(time) {
    if (time === null || time === 0) return "#cccccc";
    if (time >= 0 && time <= 5) return "#dfbec43";
    if (time >= 6 && time <= 10) return "#cdbc68";
    if (time >= 11 && time <= 15) return "#979077";
    if (time >= 16 && time <= 20) return "#666970";
    if (time >= 21 && time <= 25) return "#32446b";
    if (time >= 26 && time <= 30) return "#13234b";
    if (time >= 31 && time <= 35) return "#000000";
    return "#cccccc";
}

async function loadLayer() {
    try {
        const response = await fetch(asset(geojsonFile.value));
        let geoData = await response.json();
        console.log("CityLayer GeoJSON loaded:", geoData);

        // if (
        //     sportsStore.sustainabilityFilterType !== "index" &&
        //     sportsStore.travelTimePopulationWeight
        // ) {
        //     geoData.features = geoData.features.map((feature) => {
        //         const pop = feature.properties.pop_1km_grid_decile ?? 0;
        //         const normPop = Math.min(9, pop) / 9; // Normalize to 0–1
        //         const scale = 0.3 + normPop * 0.8;
        //         const scaledFeature = turf.transformScale(feature, scale);
        //         scaledFeature.properties = feature.properties;
        //         return scaledFeature;
        //     });
        // }

        if (layer.value) {
            props.map.removeLayer(layer.value);
        }

        layer.value = L.geoJSON(geoData, {
            style: styleFeature,
            onEachFeature: (feature, lyr) => {
                lyr.on("mouseover", (e) => {
                    const content = `<b>Feature:</b> ${feature.properties.name || "N/A"}`;
                    L.popup({ offset: [0, -10] })
                        .setLatLng(e.latlng)
                        .setContent(content)
                        .openOn(props.map);
                });
                lyr.on("mouseout", () => {
                    props.map.closePopup();
                });
            },
        }).addTo(props.map);

    } catch (error) {
        console.error(error);
    }
}

onMounted(() => {
    if (props.map) {
        loadLayer();
    }
});

onBeforeUnmount(() => {
    if (layer.value) {
        props.map.removeLayer(layer.value);
    }
});

watch(
  [
    () => sportsStore.sustainabilityFilterType,
    () => sportsStore.displayUnit,
    () => sportsStore.travelTimePopulationWeight,
    () => sportsStore.sustainabilityIndexActivity,
    () => sportsStore.sustainabilityIndexMinutes,
    () => sportsStore.sustainabilityIndexDay,
    () => sportsStore.travelTimeActivity,
    () => sportsStore.travelTimeTransportMode,
    () => sportsStore.travelTimeMinutes,
    () => sportsStore.travelTimeDay,
  ],
  () => {
    if (!sportsStore.commune && props.map) {
      loadLayer();
    }
  }
);

watch(
    () => sportsStore.commune,
    (newCommune) => {
        if (newCommune) {
            //if a commune is selected, remove the city layer
            if (layer.value) {
                props.map.removeLayer(layer.value);
                layer.value = null;
            }
        } else {
            loadLayer();
        }
    }
);
</script>

<style scoped>
</style>