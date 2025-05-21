<template>
  <div>
    <div id="map" style="width: 100%; height: 100vh;"></div>
    <div 
      class="info-backdrop" 
      :class="{ visible: showInfo }"
    >
      <div class="info-overlay">
        <h2>Info Overlay</h2>
        <p>This is an info overlay.</p>
        <button @click="emit('close')">Close</button>
      </div>
    </div>
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
const emit = defineEmits(['close']);

//destinations layer
const destinationsLayer      = ref(null)
const destinationsDataByCity = ref({}) 

//info overlay
const props = defineProps({
  showInfo: Boolean
})

//region's data kommun_regso
const geojsonData = ref(null);

const communeData = ref(null);
const filteredLayer = ref(null);

const mapStyles = ref({
  OSM: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
});

onMounted(async () => {
  await initMap();
});

function asset(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}

function uriSegment(str) {
  return encodeURIComponent(str);
}

async function initMap() {
  map.value = L.map("map", {
    minZoom: 5, 
  }).setView([63, 17], 5); // Sweden's approximate center (Sollefteå)

  map.value.createPane('communePane')  
  map.value.getPane('communePane').style.zIndex = 650

  map.value.createPane('destinationsPane')
  map.value.getPane('destinationsPane').style.zIndex = 700

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

    //add north arrow and scale
    L.control.scale({
      imperial: false,
      metric: true,
      bar: true,          // enables the dual bar
      position: 'bottomleft'
    }).addTo(map.value);

    const NorthArrowControl = L.Control.extend({
      onAdd: function (map) {
        const img = L.DomUtil.create("img");
        img.src = "./assets/north-arrow.svg";
        img.style.width = "50px";
        img.style.opacity = "0.8";
        img.title = "North arrow";
        return img;
      },
    });

    L.control.northArrow = function (opts) {
      return new NorthArrowControl(opts);
    };

    L.control.northArrow({ position: "topright" }).addTo(map.value);

  } catch (error) {
    console.error(error);
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
      // console.log(`index_dd_${sportsStore.sustainabilityIndexMinutes}_min_${sportsStore.sustainabilityIndexActivity}_${sportsStore.sustainabilityIndexDay}`);
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
    pane: 'communePane',
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
  
  return `${activity}_${mode}${dayPart}_${minutes}`;
}

async function loadGeoJSONFile(commune) {
      if (!map.value) return

      //remove old layer
      if (filteredLayer.value) {
        map.value.removeLayer(filteredLayer.value)
        filteredLayer.value = null
      }

      const prefix = sportsStore.sustainabilityFilterType === 'index'
        ? 't2_index'
        : 't1_ttm_15_30_60'

      //"grid" or "regso"
      const unit = sportsStore.displayUnit

      // build path based on unit
      let geojsonPath
      if (unit === 'grid') {
        const seg = uriSegment(commune);
        geojsonPath = `geojson/geojson_grid_by_city/${seg}/${seg}_${prefix}_by_${unit}.geojson`;     
      } else { //regso
        // or: geojson/t2_index_by_regso.geojson
        geojsonPath = `geojson/${prefix}_by_${unit}.geojson`
      }

      try {
        const resp = await fetch(asset(geojsonPath))
        const raw = await resp.json()

        const features = raw.features.filter(
          f => f.properties.city_name === commune
        )
        communeData.value = { type: 'FeatureCollection', features }

        filteredLayer.value = L.geoJSON(communeData.value, { pane: 'communePane' })
        filteredLayer.value.addTo(map.value)
        map.value.fitBounds(filteredLayer.value.getBounds(), { padding: [50, 50] })

        createLegend(map.value)
        updateIndexMapLayer()
      } catch (err) {
        console.error(err)
      }
}

function setIndexColor(percent) { //for the index layer
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
    //no decimals
    time = Math.round(time);
    //if (time === null || undefined) return "#cccccc";

    if (time === null || time === undefined || time == 0) return "#ffffff"; //white
    if (sportsStore.travelTimeMinutes == 15) {
        if (time > 0 && time <= 5) return "#ffea46";
        if (time >= 6 && time <= 10) return "#ccbb69";
        if (time >= 11 && time <= 15) return "#969078";
    } else if (sportsStore.travelTimeMinutes == 30) {
        console.log("setAccColor", time);
        if (time >= 16 && time <= 20) return "#666970";
        if (time >= 21 && time <= 25) return "#31446b";
        if (time >= 26 && time <= 30) return "#00204d";
    } else if (sportsStore.travelTimeMinutes == 60) {
        console.log("setAccColor", time);
        if (time >= 31 && time <= 35) return "#00204d";
        if (time >= 36 && time <= 40) return "#31446b";
        if (time >= 41 && time <= 45) return "#666970";
        if (time >= 46 && time <= 50) return "#969078";
    } else {
        console.log("setAccColor: out of range", time);
    }
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
      var accRanges = []
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
          div.innerHTML += `<p>Traveltime to activity (min)</p>`;
            //if <15min
            if (sportsStore.travelTimeMinutes == 15) {
                accRanges = [
                    { min: 1, max: 5, color: "#ffea46" },
                    { min: 6, max: 10, color: "#ccbb69" },
                    { min: 11, max: 15, color: "#969078" },
                ]
            }
            else if (sportsStore.travelTimeMinutes == 30) {
                accRanges = [
                    { min: 16, max: 20, color: "#666970" },
                    { min: 21, max: 25, color: "#31446b" },
                    { min: 26, max: 30, color: "#00204d" },
                ]
            } else if (sportsStore.travelTimeMinutes == 60) {
                accRanges = [
                    { min: 31, max: 35, color: "#00204d" },
                    { min: 36, max: 40, color: "#31446b" },
                    { min: 41, max: 50, color: "#666970" },
                    { min: 51, max: 60, color: "#969078" },

                ]
            }
            //always show value 0 as white on legend
            div.innerHTML += `<div><span style="background:#ffffff"></span> 0</div>`;
            accRanges.forEach(function (range) {
                div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
            });
         }
         return div;
     };
     legend.addTo(map);
}

async function loadDestinationsData (city) {
  if (!city) return

  if (destinationsDataByCity.value[city]) return

  try {
    const seg = encodeURIComponent(city)
    const path = `geojson/geojson_destinations_by_city/${seg}/${seg}_destinations.geojson`
    const resp = await fetch(asset(path))
    if (!resp.ok) {
      throw new Error('Error fetching destinations data')
    }
    destinationsDataByCity.value[city] = await resp.json()
  } catch (err) {
    console.error(err)
  }
}

function clearDestinations () {
  if (map.value && destinationsLayer.value) {
    map.value.removeLayer(destinationsLayer.value)
    destinationsLayer.value = null
  }
}

function renderDestinations (activity) {
  const city = sportsStore.commune
  const data = destinationsDataByCity.value[city]
  if (!map.value || !data) return

  const wantedClass = activity?.replace(/ /g, '_')

  const fc = {
    type: 'FeatureCollection',
    features: data.features.filter(f => {
      const okClass = !wantedClass || f.properties.classification === wantedClass
      return okClass
    })
  }

  clearDestinations()

  destinationsLayer.value = L.geoJSON(fc, {
    pointToLayer: (_f, latlng) =>
      L.circleMarker(latlng, {
        pane: 'destinationsPane',
        radius: 3,
        weight: 1,
        color: '#444',
        fillColor: '#000000',
        fillOpacity: 0.9
      })
  }).addTo(map.value)
}

watch( //load destinations
  [
    () => sportsStore.destinations,
    () => sportsStore.travelTimeActivity,
    () => sportsStore.commune
  ],
  async ([show, activity, city]) => {
    if (!show) {
      clearDestinations()
      return
    }
    if (!city) return

    await loadDestinationsData(city)
    renderDestinations(activity)
  },
  { immediate: true }
)

watch(() => props.showInfo, (newVal) => {
  if (newVal == true) {
    document.querySelector(".info-overlay").style.display = "block";
  } else {
    document.querySelector(".info-overlay").style.display = "none";
  }
})

//load commune geojson
watch(
  [
    () => sportsStore.commune,
    () => sportsStore.displayUnit,
    () => sportsStore.sustainabilityFilterType,
    () => sportsStore.travelTimePopulationWeight
  ],
  ([newCommune, newDisplayUnit]) => {
    // console.log('newCommune:', newCommune, 'newDisplayUnit:', newDisplayUnit);

    if (!newCommune) {
      map.value.setView([63, 17], 5);

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
    createLegend(map.value);
  }
);
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
  height: calc(100vh - 82px) !important;
}

/* .leaflet-tile-pane {
  -webkit-filter: grayscale(100%);
  filter: grayscale(100%);
} */
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

.info-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.3);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.info-backdrop.visible {
  display: flex;
}

.info-overlay {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.leaflet-control-scale-line {
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #000;
  padding: 2px 4px;
}

.leaflet-control-scale {
  background: transparent;
  box-shadow: none;
}
</style>
