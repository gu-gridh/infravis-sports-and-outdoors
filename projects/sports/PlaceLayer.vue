<template>
  <div>
    <div id="map" style="width: 100%; height: 100vh;"></div>
    <CityLayer v-if="map" :map="map" />
  </div>
</template>

<script setup>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.vectorgrid";
import { onMounted, ref, watch } from "vue";
import { useSportsStore } from "./settings/store";
import * as turf from '@turf/turf';
import CityLayer from "./CityLayer.vue";

const map = ref(null);
const sportsStore = useSportsStore();

//region's data kommun_regso
const geojsonData = ref(null);

//raw commune data
const communeData = ref(null);

const regionLayer = ref(null);
//const pointsLayer = ref(null);

const filteredLayer = ref(null);

const mapStyles = ref({
  arcGisTopo: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  OSM: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  topPlus: "http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png",
});

//for generating asset URLs
function asset(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}

onMounted(async () => {
  await initMap();
});

//load commune geojson
watch(
  [
    () => sportsStore.commune,
    () => sportsStore.displayUnit,
    () => sportsStore.sustainabilityFilterType,
    () => sportsStore.travelTimePopulationWeight
  ],
  ([newCommune, newDisplayUnit]) => {
    console.log('newCommune:', newCommune, 'newDisplayUnit:', newDisplayUnit);

    if (!newCommune) {
      map.value.setView([62, 15], 6);

      //remove filtered layer if present
      if (filteredLayer.value && map.value.hasLayer(filteredLayer.value)) {
        map.value.removeLayer(filteredLayer.value);
        filteredLayer.value = null;
      }

      return;
    }

    loadGeoJSONFile(newCommune);
  }
);

//watch for changes in the sustainability index and travel time filters
watch( 
  [
    () => sportsStore.sustainabilityIndexActivity,
    () => sportsStore.sustainabilityIndexMinutes,
    () => sportsStore.sustainabilityIndexDay,
    () => sportsStore.travelTimeActivity,
    () => sportsStore.travelTimeTransportMode,
    () => sportsStore.travelTimeMinutes,
    () => sportsStore.travelTimeDay,
  ],
  () => {
    updateIndexMapLayer();
  }
);

//whenever a points file is selected
// watch(() => sportsStore.activeGeoJsonFile, (newFile) => {
//   if (newFile) {
//     renderPointsLayer(newFile);
//   } else {
//     removePointsLayer();
//   }
// });

async function initMap() {
  map.value = L.map("map", {
    minZoom: 4, 
  }).setView([62, 15], 5); //Uppsala

  L.tileLayer(mapStyles.value.OSM, {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);

  try {
    const response = await fetch(asset("geojson/kommun_regso.geojson"));
    const rawRegion = await response.json();
    geojsonData.value = rawRegion;

    if (!rawRegion?.features) {
      throw new Error("GeoJSON features are missing in region data.");
    }

    //store communes list for dropdown
    sportsStore.allCommunes = rawRegion.features.map((f) => f.properties);

    //sort the communes alphabetically
    if (Array.isArray(sportsStore.allCommunes)) {
      sportsStore.allCommunes.sort((a, b) => a.kommunnamn.localeCompare(b.kommunnamn));
    }

    // const plainRegion = JSON.parse(JSON.stringify(rawRegion));

    // regionLayer.value = L.vectorGrid.slicer(plainRegion, {
    //   vectorTileLayerStyles: {
    //     sliced: { color: "blue", weight: 1, fillOpacity: 0.6 },
    //   },
    //   getFeatureId: (feature) => feature.id,
    // }).addTo(map.value);

    //add north arrow and scale
    L.control.scale({ imperial: false }).addTo(map.value);

    const NorthArrowControl = L.Control.extend({
      onAdd: function (map) {
        const img = L.DomUtil.create("img");
        img.src = "./assets/north-arrow.svg";
        img.style.width = "50px";
        img.style.opacity = "1";
        img.title = "North arrow";
        return img;
      },
    });

    L.control.northArrow = function (opts) {
      return new NorthArrowControl(opts);
    };

L.control.northArrow({ position: "topright" }).addTo(map.value);

  } catch (error) {
    console.error("Error loading kommun_regso.geojson:", error);
  }
}

function updateIndexMapLayer() {
  if (!map.value || !communeData.value) return;

  // remove old layer
  if (filteredLayer.value) {
    map.value.removeLayer(filteredLayer.value);
  }

  const features = communeData.value.features.filter((f) => {
    if (sportsStore.sustainabilityFilterType === "index") {
      return true;
    } else {
      const propName = generateTravelPropName();
      return f.properties[propName] !== undefined;
    }
  });

  let scaledFeatures = features;
  if (sportsStore.sustainabilityFilterType !== "index" && sportsStore.travelTimePopulationWeight) {
    scaledFeatures = features.map((feature) => {
      const pop = feature.properties.pop_1km_grid_decile ?? 0;
      const normPop = Math.min(9, pop) / 9; // Normalize to 0–1
      const scale = 0.3 + normPop * 0.8;
      const scaled = turf.transformScale(feature, scale);
      scaled.properties = feature.properties;
      return scaled;
    });
  }

  const newFC = { type: "FeatureCollection", features: scaledFeatures };

  function styleFeature(feature) {
    if (sportsStore.sustainabilityFilterType === "index") {
      console.log(`index_dd_${sportsStore.sustainabilityIndexMinutes}_min_${sportsStore.sustainabilityIndexActivity}_${sportsStore.sustainabilityIndexDay}`);
      const propName = `index_dd_${sportsStore.sustainabilityIndexMinutes}_min_${sportsStore.sustainabilityIndexActivity}_${sportsStore.sustainabilityIndexDay}`;
      const val = feature.properties[propName];
      return {
        color: 'black',
        fillColor: setIndexColor(val),
        fillOpacity: 0.9,
        weight: 1,
      };
    } else { // travel time to activity
      const propName = generateTravelPropName();
      const val = feature.properties[propName];
      return {
        color: 'black',
        fillColor: setAccColor(val),
        fillOpacity: 0.9,
        weight: 1,
      };
    }
  }

  //hover features...
  function onEachFeature(feature, layer) {
    layer.on("mouseover", (e) => {
      const population = feature.properties.pop_1km_grid ?? "unknown";
      L.popup({ offset: [0, -10] })
        .setLatLng(e.latlng)
        .setContent(`<b>Population: ${population}</b>`)
        .openOn(map.value);
    });
    layer.on("mouseout", () => {
      map.value.closePopup();
    });
  }

  filteredLayer.value = L.geoJSON(newFC, {
    style: styleFeature,
    onEachFeature,
  });

  filteredLayer.value.addTo(map.value);
}

function generateTravelPropName() {
  //replace spaces with underscores
  const activity = sportsStore.travelTimeActivity.replace(/ /g, '_');
  const mode = sportsStore.travelTimeTransportMode.replace(/ /g, '_');
  const minutes = sportsStore.travelTimeMinutes;
  
  const modeLower = sportsStore.travelTimeTransportMode.toLowerCase();
  let dayPart = "";
  if (modeLower === "sustainable" || modeLower === "transit") { //only add day if mode is sustainable or transit
    const dayValue = sportsStore.travelTimeDay;
    if (dayValue.toLowerCase() === "saturday" || dayValue.toLowerCase() === "sunday") { //check if the day is saturday or sunday
      dayPart = `_${dayValue.replace(/ /g, '_')}`;
    }
  }
  
  console.log('Travel prop name:', `${activity}_${mode}${dayPart}_${minutes}`);
  return `${activity}_${mode}${dayPart}_${minutes}`;
}

async function loadGeoJSONFile(commune) {
  if (!map.value) return;

  //remove old layers
  if (filteredLayer.value) {
    map.value.removeLayer(filteredLayer.value);
    filteredLayer.value = null;
  }

  //compute filename based on store values:
  // For index: t2_index_15_30_60_by_<displayUnit>.geojson
  // For travel: t1_ttm_dd_15_30_60_by_<displayUnit>.geojson
  const prefix = sportsStore.sustainabilityFilterType === "index"
    ? "t2_index"
    : "t1_ttm_15_30_60";
  const unit = sportsStore.displayUnit; //either "grid" or "regso"
  const geojsonFile = `${prefix}_by_${unit}.geojson`;
  console.log('Loading file... ' + geojsonFile);

  try {
    const resp = await fetch(asset(`geojson/${geojsonFile}`));
    const rawCommune = await resp.json();

    //only include those for the selected commune
    const filteredFeatures = rawCommune.features.filter(
      (feature) => feature.properties.city_name === commune
    );
    communeData.value = {
      type: "FeatureCollection",
      features: filteredFeatures,
    };

    filteredLayer.value = L.geoJSON(communeData.value);
    filteredLayer.value.addTo(map.value);

    //move map to fit the new layer
    map.value.fitBounds(filteredLayer.value.getBounds(), { padding: [50, 50] });

    createLegend(map.value);
    updateIndexMapLayer();
    
  } catch (error) {
    console.error(`Failed to load ${geojsonFile}:`, error);
  }
}

function setIndexColor(time) { //for the index layer
  if (time === null || time === 0) return "#cccccc"; //missing data
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
  return "#cccccc"; //default
}

function setAccColor (time) { //for the accessibility layer
  if (time === null || time === 0) return "#cccccc"; //missing data

  if (time >= 0 && time <= 5) return "#dfbec43"; 
  if (time >= 6 && time <= 10) return "#cdbc68"; 
  if (time >= 11 && time <= 15) return "#979077"; 
  if (time >= 16 && time <= 20) return "#666970"; 
  if (time >= 21 && time <= 25) return "#32446b"; 
  if (time >= 26 && time <= 30) return "#13234b"; 
  if (time >= 31 && time <= 35) return "#000000";
  return "#cccccc"; //default
}

// adds legend based on what layer is active
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
        div.innerHTML += "<p>Index: % activities by sustainable modes</p>";
              var indexRanges = [
                  { min: 0, max: 10, color: "#d71f27" },
                  { min: 11, max: 20, color: "#e95a38" },
                  { min: 21, max: 30, color: "#f69c5a" },
                  { min: 31, max: 40, color: "#fdc980" },
                  { min: 41, max: 50, color: "#fdefac" },
                  { min: 51, max: 60, color: "#e8eeac" },
                  { min: 61, max: 70, color: "#c4dd87" },
                  { min: 71, max: 80, color: "#99cc64" },
                  { min: 81, max: 90, color: "#55b453" },
                  { min: 91, max: 100, color: "#179847" }
              ];
              indexRanges.forEach(function (range) {
                  div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
              });
      } else if (sportsStore.sustainabilityFilterType === "travel") {         
                div.innerHTML += "<p>Travel time (min)</p>"; 
                var accRanges = [
                    { min: 0, max: 5, color: "#dfbec43" },
                    { min: 6, max: 10, color: "#cdbc68" },
                    { min: 11, max: 15, color: "#979077" },
                    { min: 16, max: 20, color: "#666970" },
                    { min: 21, max: 25, color: "#32446b" },
                    { min: 26, max: 30, color: "#13234b" },
                    { min: 31, max: 35, color: "#000000" }
                ];

        accRanges.forEach(function (range) {
          div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
           });
         }
         return div;
     };
     legend.addTo(map);
 }
</script>

<style>
.legend {
  line-height: 18px;
  color: #555;
  padding-bottom: 20px;
  background-color: white !important;
}

.legend i {
  width: 18px;
  height: 18px;
  float: left;
  margin-right: 8px;
  opacity: 0.7;
}

#map.leaflet-container {
  height: calc(100vh - 80px) !important;
}

.legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  line-height: 18px;
  font-size: 12px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  z-index: 1000; /* Ensure it appears on top */
}

.legend h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: bold;
}

.legend div {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.legend span {
  width: 20px;
  height: 12px;
  display: inline-block;
  margin-right: 5px;
  border: 1px solid #999;
}

.legend span {
  width: 20px;
  height: 12px;
  display: inline-block;
  margin-right: 5px;
  border: 1px solid #999;
}

.leaflet-left {
  width: 400px;
}
</style>
