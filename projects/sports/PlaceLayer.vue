<template>
  <div id="map" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import proj4 from "proj4";
import { onMounted, ref, watch } from "vue";
import { useSportsStore } from "./settings/store";
import markerIcon from "@/assets/marker-red.svg";

const map = ref(null);
const sportsStore = useSportsStore();
const geojsonData = ref(null);
const layerGroup = ref(null); // Stores the active layer group
const pointsLayer = ref(null);

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

// Watch for store updates and refresh the map layer
watch(
  () => [sportsStore.travelTime, sportsStore.travelMode, sportsStore.dayType],
  () => {
    updateMapLayer();
  }
);

//load commune geojson
watch(
  () => sportsStore.commune,
  (newCommune) => {
    loadCommuneGeoJSON(newCommune);
  }
);


watch(() => sportsStore.activeGeoJsonFile, (newFile) => {
  if (newFile) {
    renderPointsLayer(newFile, 20); //20 is how many points should be loaded...too many will make it unresponsive
  } else {
    removePointsLayer(); 
  }
});

const initMap = async () => {
  map.value = L.map("map").setView([59.8586, 17.6389], 10); // Uppsala

  L.tileLayer(mapStyles.value.OSM, {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);

  // Load GeoJSON data
  const response = await fetch("./geojson/uppsala.geojson");
  geojsonData.value = await response.json();
  console.log("GeoJSON Loaded:", geojsonData.value);

  // Initialize layer group
  layerGroup.value = L.layerGroup().addTo(map.value);

  // Draw polygons
  updateMapLayer();
};

//  update the map layer dynamically
const updateMapLayer = () => {
  if (!map.value || !geojsonData.value) return;

  // Clear previous layers
  layerGroup.value.clearLayers();

  const utm33n = "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs";

  // Filter features based on selected filtering types
  const filteredFeatures = geojsonData.value.features.filter((feature) => {
  return (
    feature.properties.mode === sportsStore.travelMode && // filter by travel mode
    (sportsStore.dayType === "all" || feature.properties.day_type === sportsStore.dayType) //also filter by day type if not "all"
  );
});

const filteredGeoJSON = {
  type: "FeatureCollection",
  features: filteredFeatures,
};

  // Create a GeoJSON layer
  const geoJsonLayer = L.geoJSON(filteredGeoJSON, {
    style: (feature) => {
      const time = feature.properties[travelTimes.value[sportsStore.travelTime]];
      return {
        color: "white",
        fillColor: setColor(time),
        fillOpacity: 0.7,
        weight: 1,
        dashArray: "2, 2",
      };
    },
    coordsToLatLng: (coords) => {
      const [lon, lat] = proj4(utm33n, "WGS84", coords); // Convert UTM to WGS84
      return [lat, lon]; // Flip latitude and longitude
    },
  });

  geoJsonLayer.addTo(layerGroup.value);

  // Fit the map bounds to new polygons
  if (geoJsonLayer.getBounds().isValid()) {
    map.value.fitBounds(geoJsonLayer.getBounds());
  }
};

const renderPointsLayer = async (geojsonFile, limit = null) => { //add points layer to map
  if (!map.value) return;

  removePointsLayer(); 

  try {
    const response = await fetch(`./geojson/${geojsonFile}`);
    const geojsonData = await response.json();

    const filteredFeatures = limit ? geojsonData.features.slice(0, limit) : geojsonData.features;

    pointsLayer.value = L.geoJSON({ type: "FeatureCollection", features: filteredFeatures }, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: markerIcon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          }),
        }).bindPopup(`<b>${feature.properties.city_name}</b><br>${feature.properties.classification}`);
      },
    });

    pointsLayer.value.addTo(map.value);

    if (pointsLayer.value.getBounds().isValid()) {
      map.value.fitBounds(pointsLayer.value.getBounds());
    }
  } catch (error) {
    console.error(`error loading ${geojsonFile}:`, error);
  }
};

const removePointsLayer = () => { //remove points layer from the map
  if (pointsLayer.value) {
    map.value.removeLayer(pointsLayer.value);
    pointsLayer.value = null;
  }
};

// determine polygon color based on amount of activities
const setColor = (time) => {
  return time === null || time === 0 ? "blue" : time > 0 && time < 6 ? "yellow" : time >= 6 && time < 10 ? "orange" : "red";
};

const loadCommuneGeoJSON = async (commune) => {
  layerGroup.value.clearLayers();

  const geojsonFile = commune === "Lilla Edet" ? "lilla_edet.geojson" : "uppsala.geojson";

  try {
    const response = await fetch(`./geojson/${geojsonFile}`);
    geojsonData.value = await response.json();

    updateMapLayer();
  } catch (error) {
    console.error(`error loading GeoJSON for ${commune}:`, error);
  }
};
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
