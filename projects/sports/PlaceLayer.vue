<template>
  <div id="map" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.vectorgrid";
import { onMounted, ref, watch } from "vue";
import { useSportsStore } from "./settings/store";
import markerIcon from "@/assets/marker-red.svg";

const map = ref(null);
const sportsStore = useSportsStore();

//region's data kommun_regso
const geojsonData = ref(null);

//raw commune data
const communeData = ref(null);

//the vectorGrid layers
const regionLayer = ref(null);  
const communeLayer = ref(null);  
const pointsLayer = ref(null); 


//hold the last filtered layer created by updateMapLayer
 const filteredLayer = ref(null);

const travelTimes = ref({
  15: "15_total",
  30: "30_total",
  60: "60_total",
});

const mapStyles = ref({
  arcGisTopo: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  OSM: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  topPlus: "http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png",
});

onMounted(async () => {
  await initMap();
});

//watch for store updates and refresh the map layer
watch(
  () => [sportsStore.travelTime, sportsStore.activity, sportsStore.dayType],
  () => {
    updateIndexMapLayer();
  }
);

//load commune geojson
watch(
  () => sportsStore.commune,
  (newCommune) => {
    loadGeoJSONFile(newCommune);
  }
);

//whenever a points file is selected
watch(() => sportsStore.activeGeoJsonFile, (newFile) => {
  if (newFile) {
    renderPointsLayer(newFile);
  } else {
    removePointsLayer();
  }
});

async function initMap() {
  map.value = L.map("map").setView([62, 15], 6); // Uppsala

  L.tileLayer(mapStyles.value.OSM, {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);

  try {
    const response = await fetch("./geojson/kommun_regso.geojson");
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

    const plainRegion = JSON.parse(JSON.stringify(rawRegion));

    regionLayer.value = L.vectorGrid.slicer(plainRegion, {
      vectorTileLayerStyles: {
        sliced: { color: "blue", weight: 1, fillOpacity: 0.6 },
      },
      getFeatureId: (feature) => feature.id,
    }).addTo(map.value);

  } catch (error) {
    console.error("Error loading kommun_regso.geojson:", error);
  }
}

function updateIndexMapLayer() {
  if (!map.value || !communeData.value) return;

  //remove the old filtered layer if it exists
  if (filteredLayer.value) {
    map.value.removeLayer(filteredLayer.value);
    filteredLayer.value = null;
  }

  const filteredGeoJSON = {
    type: "FeatureCollection",
    features: communeData.value.features,
  };

  function style(feature) {
    const propertyName = `index_dd_${sportsStore.travelTime}_min_${sportsStore.activity}_${sportsStore.dayType}`;
    const indexValue = feature.properties[propertyName];

    return {
      color: setColor(indexValue),
      fillColor: setColor(indexValue),
      fillOpacity: 0.7,
      weight: 1,
      dashArray: "2, 2",
    };
  }

  //hover event
  function onEachFeature(feature, layer) {
    layer.on("mouseover", (e) => {
      console.log("Mouseover event: ", feature.properties);
      const population = feature.properties.pop_1km_grid || "unknown population";
      //Leaflet popup
      L.popup({ offset: [0, -10] })
        .setLatLng(e.latlng)
        .setContent(`<b>${population}</b>`)
        .openOn(map.value);
    });

    layer.on("mouseout", () => {
      map.value.closePopup();
    });
  }

  const newGeoJsonLayer = L.geoJSON(filteredGeoJSON, {
    style,
    onEachFeature,
  });

  newGeoJsonLayer.addTo(map.value);

  filteredLayer.value = newGeoJsonLayer;
}

async function loadGeoJSONFile(commune) {
  if (!map.value) return;

  // remove old layers
  if (filteredLayer.value) {
    map.value.removeLayer(filteredLayer.value);
    filteredLayer.value = null;
  }
  if (communeLayer.value) {
    map.value.removeLayer(communeLayer.value);
    communeLayer.value = null;
  }
  if (regionLayer.value) {
    map.value.removeLayer(regionLayer.value);
  }

  //decide which file
  const geojsonFile = commune === "Lilla Edet"
    ? "lilla_edet_index.geojson"
    : "uppsala_index.geojson";

  try {
    const resp = await fetch(`./geojson/${geojsonFile}`);
    const rawCommune = await resp.json();

    communeData.value = rawCommune;

    const geoJsonLayer = L.geoJSON(rawCommune);
    map.value.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });

    updateIndexMapLayer();
  } catch (error) {
    console.error(`failed to load ${geojsonFile}:`, error);
  }
}

async function renderPointsLayer(geojsonFile) {
  if (!map.value) return;

  removePointsLayer();

  try {
    const response = await fetch(`./geojson/${geojsonFile}`);
    const rawPoints = await response.json();

    const plainPoints = JSON.parse(JSON.stringify(rawPoints));

    pointsLayer.value = L.vectorGrid.slicer(plainPoints, {
      vectorTileLayerStyles: {
        sliced: (properties, zoom) => ({
          color: "red",
          radius: 1,
          fillOpacity: 0.9,
          weight: 1,
        }),
      },
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: markerIcon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          }),
        }).bindPopup(
          `<b>${feature.properties.city_name}</b><br>${feature.properties.classification}`
        );
      },
      getFeatureId: (feature) => feature.id,
    }).addTo(map.value);

  } catch (error) {
    console.error(`error loading points file ${geojsonFile}:`, error);
  }
}

function removePointsLayer() {
  if (pointsLayer.value) {
    map.value.removeLayer(pointsLayer.value);
    pointsLayer.value = null;
  }
}

function setColor(time) {
  if (time === null || time === 0) return "#cccccc"; //missing data

  if (time >= 6 && time < 16) return "#ffcccc"; 
  if (time >= 16 && time < 26) return "#ff9999"; 
  if (time >= 26 && time < 36) return "#ff6666"; 
  if (time >= 36 && time < 46) return "#ff3333"; 
  if (time >= 46 && time < 56) return "#ff0000"; 
  if (time >= 56 && time < 66) return "#cc0000"; 
  if (time >= 66 && time < 76) return "#990000"; 
  if (time >= 76 && time < 86) return "#660000";
  if (time >= 86 && time <= 96) return "#330000"; 

  return "#cccccc"; //default
}
</script>

<style scoped>
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
</style>