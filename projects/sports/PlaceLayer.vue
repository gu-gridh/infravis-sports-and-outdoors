<template>
  <div>
    <div id="map" style="width: 100%; height: 100vh;"></div>
    <div class="info-backdrop" :class="{ visible: showInfo }">
      <div class="info-overlay">
        <h2>Mistra Sport and Outdoors Accessibility Index</h2>
        <p><a href="/accessibility-index/about.html" target="_blank">About the project</a></p>
        <p><a href="/accessibility-index/map.html" target="_blank">About the map</a></p>
        
        <div class="disclaimer">This map uses data from SCB, Trafiklab and OpenStreetMap. It might not reflect the
          complete and latest street network, public transport, or sports and outdoors destinations in Sweden.</div>
        <button @click="emit('close')">Close</button>
      </div>
    </div>
    <CityLayer v-if="map && sportsStore.displayUnit === 'city'" :map="map" />
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

const lastCommune = ref(null)
const map = ref(null);
const sportsStore = useSportsStore();
const emit = defineEmits(['close']);

//destinations layer
const destinationsLayer = ref(null)
const destinationsDataByCity = ref({})

//info overlay
const props = defineProps({
  showInfo: Boolean
})

//region's data kommun_regso
const geojsonData = ref(null);
const communeData = ref(null);
const filteredLayer = ref(null);
const borderLayer = ref(null);

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

function drawCommuneBorder(communeName) {
  if (
    !geojsonData.value ||
    !geojsonData.value.features || //add this check
    !Array.isArray(geojsonData.value.features) ||
    !map.value
  ) return;

  if (borderLayer.value) {
    map.value.removeLayer(borderLayer.value);
    borderLayer.value = null;
  }

  const borderFc = {
    type: 'FeatureCollection',
    features: geojsonData.value.features.filter(
      f => f.properties.kommunnamn === communeName
    )
  };

  if (!borderFc.features.length) return;

  borderLayer.value = L.geoJSON(borderFc, {
    pane: 'borderPane',
    interactive: false,
    style: {
      color: '#000',
      weight: 2,
      dashArray: '6 4',
      fillOpacity: 0
    }
  }).addTo(map.value);
}

async function initMap() {
  map.value = L.map("map", {
    minZoom: 5,
  }).setView([63, 17], 5); // Sweden's approximate center (Sollefteå)

  map.value.createPane('communePane')
  map.value.getPane('communePane').style.zIndex = 650

  map.value.createPane('borderPane')
  map.value.getPane('borderPane').style.zIndex = 675

  map.value.createPane('destinationsPane')
  map.value.getPane('destinationsPane').style.zIndex = 700

  L.tileLayer(mapStyles.value.OSM, {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);

  try {
    const response = await fetch(asset("geojson/kommun_regso.geojson"));
    const rawRegion = await response.json();
    console.log("Loaded region data:", rawRegion);
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
        img.src = 'north-arrow.svg';
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
  if (
    !map.value ||
    !communeData.value ||
    !communeData.value.features ||
    !Array.isArray(communeData.value.features) ||
    !sportsStore.commune ||
    sportsStore.displayUnit === 'city'
  ) {
    console.warn('updateIndexMapLayer skipped due to missing data');
    return;
  }

  // Remove old layer if present
  if (filteredLayer.value && map.value.hasLayer(filteredLayer.value)) {
    map.value.removeLayer(filteredLayer.value);
    filteredLayer.value = null;
  }

  let features = communeData.value.features;
  const isGrid = sportsStore.displayUnit === 'grid';

  // Apply population-based scaling if needed
  if (
    isGrid &&
    sportsStore.sustainabilityFilterType !== "index" &&
    sportsStore.travelTimePopulationWeight
  ) {
    features = features.map((feature) => {
      const pop = feature.properties.pop_1km_grid_decile ?? 0;
      const normPop = Math.min(9, pop) / 9;
      const scale = 0.3 + normPop * 0.7;
      const scaled = turf.transformScale(feature, scale);
      scaled.properties = feature.properties;
      return scaled;
    });
  } else if (
    isGrid &&
    sportsStore.sustainabilityFilterType === "index" &&
    sportsStore.indexPopulationWeight
  ) {
    features = features.map((feature) => {
      const pop = feature.properties.pop_1km_grid_decile ?? 0;
      const normPop = Math.min(9, pop) / 9;
      const scale = 0.3 + normPop * 0.7;
      const scaled = turf.transformScale(feature, scale);
      scaled.properties = feature.properties;
      return scaled;
    });
  }

  const newFC = { type: "FeatureCollection", features };

  function styleFeature(feature) {
    if (sportsStore.sustainabilityFilterType === "index") {
      const propName = `index_dd_${sportsStore.sustainabilityIndexMinutes}_min_${sportsStore.sustainabilityIndexActivity}_${sportsStore.sustainabilityIndexDay}`;
      const val = feature.properties[propName];
      return {
        color: 'white',
        fillColor: setIndexColor(val),
        fillOpacity: 0.8,
        weight: 1,
      };
    } else {
      const propName = generateTravelPropName();
      const val = feature.properties[propName];
      return {
        color: 'white',
        fillColor: setAccColor(val),
        fillOpacity: 0.8,
        weight: 1,
      };
    }
  }

  function onEachFeature(feature, layer) {
    layer.on("mouseover", (e) => {
      let val;
      if (sportsStore.sustainabilityFilterType === "index") {
        const p = `index_dd_${sportsStore.sustainabilityIndexMinutes}_min_${sportsStore.sustainabilityIndexActivity}_${sportsStore.sustainabilityIndexDay}`;
        val = feature.properties[p];
      } else {
        val = feature.properties[generateTravelPropName()];
      }

      val = (val === null || val === undefined) ? "No data" : Math.round(val);

      const valueIs = val === "No data"
        ? val
        : (sportsStore.sustainabilityFilterType === "index"
            ? `${val}%`
            : `${val} min`);

      L.popup({ offset: [0, -10] })
        .setLatLng(e.latlng)
        .setContent(`<b>${valueIs}</b>`)
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

  sportsStore.isLoading = true

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
  const seg = uriSegment(commune);

  // build path based on unit
  let geojsonPath
  if (unit === 'grid') {
    geojsonPath = `geojson/geojson_grid_by_city/${seg}/${seg}_${prefix}_by_${unit}.geojson`;
  } else { //regso
    geojsonPath = `geojson/geojson_regso_by_city/${seg}/${seg}_${prefix}_by_${unit}.geojson`;
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

    if (commune !== lastCommune.value) {
      drawCommuneBorder(commune);
      map.value.fitBounds(filteredLayer.value.getBounds(), { padding: [50, 50] })
      lastCommune.value = commune
    }

    createLegend(map.value)
    updateIndexMapLayer()
  } catch (err) {
    console.error(err)
  }
  finally {
    sportsStore.isLoading = false
  }
}

function setIndexColor(percent) { //for the index layer
  if (percent === null || percent === undefined) return "#cccccc"; //gray
  //no decimals
  percent = Math.round(percent);
  if (percent === null || undefined) return "#cccccc";
  if (percent >= 0 && percent <= 10) return "#d7191c";
  if (percent >= 10 && percent <= 20) return "#e85b3b";
  if (percent >= 20 && percent <= 30) return "#f99d59";
  if (percent >= 30 && percent <= 40) return "#fec981";
  if (percent >= 40 && percent <= 50) return "#ffedab";
  if (percent >= 50 && percent <= 60) return "#ebf7ad";
  if (percent >= 60 && percent <= 70) return "#c4e687";
  if (percent >= 70 && percent <= 80) return "#96d265";
  if (percent >= 80 && percent <= 90) return "#58b453";
  if (percent >= 90 && percent <= 100) return "#1a9641";
  else console.log("setIndexColor: out of range", percent);
}

const colors = { 1: '#ffea46', 2: '#ccbb69', 3: '#969078', 4: '#666970', 5: '#31446b', 6: '#00204d' };

function setAccColor(time) {
  if (time === null || time === undefined) return "#cccccc";
  //no decimals
  time = Math.round(time);
  if (time === null || time === undefined) return "#cccccc";
  if (sportsStore.travelTimeMinutes == 15) {
    if (time >= 0 && time <= 2.5) return colors[1];
    if (time > 2.5 && time <= 5) return colors[2];
    if (time > 5 && time <= 7.5) return colors[3];
    if (time > 7.5 && time <= 10) return colors[4];
    if (time > 10 && time <= 12.5) return colors[5];
    if (time > 12.5 && time <= 15) return colors[6];

  } else if (sportsStore.travelTimeMinutes == 30) {
    if (time >= 0 && time <= 5) return colors[1];
    if (time > 5 && time <= 10) return colors[2];
    if (time > 10 && time <= 15) return colors[3];
    if (time > 15 && time <= 20) return colors[4];
    if (time > 20 && time <= 25) return colors[5];
    if (time > 25 && time <= 30) return colors[6];

  } else if (sportsStore.travelTimeMinutes == 60) {
    if (time >= 0 && time <= 10) return colors[1];
    if (time > 10 && time <= 20) return colors[2];
    if (time > 20 && time <= 30) return colors[3];
    if (time > 30 && time <= 40) return colors[4];
    if (time > 40 && time <= 50) return colors[5];
    if (time > 50 && time <= 60) return colors[6];

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
      div.innerHTML += "<p>Activities reached by sustainable modes compared to by car (%)</p>";
      var indexRanges = [
        { min: 0, max: 10, color: "#d7191c" },
        { min: 10, max: 20, color: "#e85b3b" },
        { min: 20, max: 30, color: "#f99d59" },
        { min: 30, max: 40, color: "#fec981" },
        { min: 40, max: 50, color: "#ffedab" },
        { min: 50, max: 60, color: "#ebf7ad" },
        { min: 60, max: 70, color: "#c4e687" },
        { min: 70, max: 80, color: "#96d265" },
        { min: 80, max: 90, color: "#58b453" },
        { min: 90, max: 100, color: "#1a9641" }
      ];
      indexRanges.forEach(function (range) {
        div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
      });
    } else if (sportsStore.sustainabilityFilterType === "travel") {
      div.innerHTML += `<p>Traveltime to activity (min)</p>`;
      if (sportsStore.travelTimeMinutes == 15) {
        accRanges = [
          { min: 0, max: 2.5, color: colors[1] },
          { min: 2.5, max: 5, color: colors[2] },
          { min: 5, max: 7.5, color: colors[3] },
          { min: 7.5, max: 10, color: colors[4] },
          { min: 10, max: 12.5, color: colors[5] },
          { min: 12.5, max: 15, color: colors[6] },
        ]
      }
      else if (sportsStore.travelTimeMinutes == 30) {
        accRanges = [
          { min: 0, max: 5, color: colors[1] },
          { min: 5, max: 10, color: colors[2] },
          { min: 10, max: 15, color: colors[3] },
          { min: 15, max: 20, color: colors[4] },
          { min: 20, max: 25, color: colors[5] },
          { min: 25, max: 30, color: colors[6] },
        ]
      } else if (sportsStore.travelTimeMinutes == 60) {
        accRanges = [
          { min: 0, max: 10, color: colors[1] },
          { min: 10, max: 20, color: colors[2] },
          { min: 20, max: 30, color: colors[3] },
          { min: 30, max: 40, color: colors[4] },
          { min: 40, max: 50, color: colors[5] },
          { min: 50, max: 60, color: colors[6] },
        ]
      }
      accRanges.forEach(function (range) {
        div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
      });
    }
    return div;
  };
  legend.addTo(map);
}

async function loadDestinationsData(city) {
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

function clearDestinations() {
  if (map.value && destinationsLayer.value) {
    map.value.removeLayer(destinationsLayer.value)
    destinationsLayer.value = null
  }
}

function renderDestinations(activity) {
  const city = sportsStore.commune
  const data = destinationsDataByCity.value[city]
  if (!map.value || !data) return

  clearDestinations()
  const wanted = activity
    .trim()
    .replace(/[\s-]+/g, "_")
    .toLowerCase();

  destinationsLayer.value = L.geoJSON(data, {
    filter: f =>
      (f.properties.classification || "")
        .toLowerCase() === wanted,
    pointToLayer: (_f, latlng) =>
      L.circleMarker(latlng, {
        pane: 'destinationsPane',
        radius: 2.5,
        weight: 1,
        color: '#ccc',
        fillColor: '#000',
        fillOpacity: 0.9,
      }),
  }).addTo(map.value);
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
    () => sportsStore.travelTimePopulationWeight,
    () => sportsStore.indexPopulationWeight
  ],
  ([newCommune]) => {
    if (!newCommune) {
      if (borderLayer.value) {
        map.value.removeLayer(borderLayer.value);
        borderLayer.value = null;
      }
      lastCommune.value = null;
      map.value.setView([63, 17], 5);

      //remove filtered layer if present
      if (filteredLayer.value && map.value.hasLayer(filteredLayer.value)) {
        map.value.removeLayer(filteredLayer.value);
        filteredLayer.value = null;
      }
      communeData.value = null;
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
  height: calc(100vh - 65px) !important;
}

/* .leaflet-tile-pane {
  -webkit-filter: grayscale(100%);
  filter: grayscale(100%);
} */
.legend {
  position: absolute;
  bottom: 50px;
  right: 20px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  line-height: 18px;
  font-size: 12px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-width: 170px;
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

.disclaimer {
  font-size: 14px;
  color: #666;
  margin-top: 20px;
  text-align: left;
}

.info-overlay h2 {
  color: #497723;
  font-weight: bold;
}

.info-overlay a {
  text-decoration: underline;
  color: #497723;
  font-weight: normal;
  cursor: pointer;
}

</style>
