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
        //console.log("Index mode:", { propName, val, properties: feature.properties });
        return {
            color: "black",
            fillColor: setIndexColor(val),
            fillOpacity: 0.9,
            weight: 1,
        };
    } else {
        const propName = generateTravelPropName();
        const val = feature.properties[propName];
        //console.log("Travel mode:", { propName, val, properties: feature.properties });
        return {
            color: "black",
            fillColor: setAccColor(val),
            fillOpacity: 0.9,
            weight: 1,
        };
    }
}

function setIndexColor(percent) {
    console.log("setIndexColor", percent);
    //no decimals
    percent = Math.round(percent);
    if (percent === null || undefined) return "#cccccc";
    if (percent >= 0 && percent <= 10) return "#d7191c";
    if (percent >= 11 && percent <= 20) return "#e85b3b";
    if (percent >= 21 && percent <= 30) return "#f99d59";
    if (percent >= 31 && percent <= 40) return "#fec981";
    if (percent >= 41 && percent <= 50) return "#ffedab";
    if (percent >= 51 && percent <= 60) return "#ebf7ad";
    if (percent >= 61 && percent <= 70) return "#c4e687";
    if (percent >= 71 && percent <= 80) return "#96d265";
    if (percent >= 81 && percent <= 90) return "#58b453";
    if (percent >= 91 && percent <= 100) return "#1a9641";
    else console.log("setIndexColor: out of range", percent);
}

function setAccColor(time) {
    console.log("setAccColor", time);
    if (time === null || time === 0) return "#cccccc";
    if (time >= 1 && time <= 5) return "#dfbec43";
    if (time >= 6 && time <= 10) return "#cdbc68";
    if (time >= 11 && time <= 15) return "#979077";
    if (time >= 16 && time <= 20) return "#666970";
    if (time >= 21 && time <= 25) return "#32446b";
    if (time >= 26 && time <= 30) return "#13234b";
    if (time >= 31 ) return "#000000";
    return "#cccccc";
}

function createLegend(map) {
        // Check if map exists
        if (!map) {
      return;
    }
    // Remove existing legend
    document.querySelectorAll(".legend").forEach((el) => el.remove());
    
    var legend = L.control({ position: "bottomright" });
     legend.onAdd = function () {
      var div = L.DomUtil.create("div", "legend");
      if (sportsStore.sustainabilityFilterType === "index") {
        div.innerHTML += "<p>Accessibility index</p><p>Activities reached (%)</p>";
              var indexRanges = [
                  { min: 0, max: 10, color: "#d7191c" },
                  { min: 11, max: 20, color: "#e85b3b" },
                  { min: 21, max: 30, color: "#f99d59" },
                  { min: 31, max: 40, color: "#fec981" },
                  { min: 41, max: 50, color: "#ffedab" },
                  { min: 51, max: 60, color: "#ebf7ad" },
                  { min: 61, max: 70, color: "#c4e687" },
                  { min: 71, max: 80, color: "#96d265" },
                  { min: 81, max: 90, color: "#58b453" },
                  { min: 91, max: 100, color: "#1a9641" }
              ];
              indexRanges.forEach(function (range) {
                  div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
              });
      } else if (sportsStore.sustainabilityFilterType === "travel") {         
                div.innerHTML += `<p>Activities within ${sportsStore.travelTimeMinutes} min</p>`; 
                var accRanges = [
                    {min: 0, max: 0, color: '#cccccc'},
                    { min: 1, max: 5, color: "#dfbec43" },
                    { min: 6, max: 10, color: "#cdbc68" },
                    { min: 11, max: 15, color: "#979077" },
                    { min: 16, max: 20, color: "#666970" },
                    { min: 21, max: 25, color: "#32446b" },
                    { min: 26, max: 30, color: "#13234b" },
                    { min: 31, max: 100, color: "#000000" }
                ];

        accRanges.forEach(function (range) {
          div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
           });
         }
         return div;
     };
     legend.addTo(map);
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
                    const content = `${feature.properties.city_name + " kommun" || "N/A"}`;
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
        createLegend(props.map)

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