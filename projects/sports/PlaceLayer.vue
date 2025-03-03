<template>
  <div id="map" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.vectorgrid";
import geojsonvt from "geojson-vt";
import proj4 from "proj4";
import { onMounted, ref, watch } from "vue";
import { useSportsStore } from "./settings/store";
import markerIcon from "@/assets/marker-red.svg";

const map = ref(null);
const sportsStore = useSportsStore();
const geojsonData = ref(null);
const pointsLayer = ref(null); // Stores the active points layer
const layerGroup = ref(null);  // Stores the active layer group
const sweden = ref(true);

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
    renderPointsLayer(newFile);
  } else {
    removePointsLayer(); 
  }
});

const initMap = async () => {
  map.value = L.map("map").setView([62, 15], 6); // Uppsala

  L.tileLayer(mapStyles.value.OSM, {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);

  try {
    const response = await fetch("./geojson/kommun_regso.geojson");
    geojsonData.value = await response.json();

    if (!geojsonData.value?.features) throw new Error("GeoJSON features are missing.");

    //store communes list for dropdown
    sportsStore.allCommunes = geojsonData.value.features.map(feature => feature.properties);

    //sort the communes alphabetically
    if (Array.isArray(sportsStore.allCommunes)) {
      sportsStore.allCommunes.sort((a, b) => a.kommunnamn.localeCompare(b.kommunnamn));
    }

    const plainGeojson = JSON.parse(JSON.stringify(geojsonData.value));

    const tileIndex = geojsonvt(plainGeojson, {
      maxZoom: 14,
      tolerance: 3,
      extent: 4096,
      buffer: 64,
      debug: 0,
    });

    const vectorGrid = L.vectorGrid.slicer(plainGeojson, {
      vectorTileLayerStyles: {
        sliced: { color: "blue", weight: 1, fillOpacity: 0.6 },
      },
      getFeatureId: (feature) => feature.id,
    });

    vectorGrid.addTo(map.value);
  } catch (error) {
    console.error("error loading GeoJSON:", error);
  }
};

//  update the map layer dynamically
const updateMapLayer = () => {
  if (!map.value || !geojsonData.value) return;

  //clear previous layers
  layerGroup.value.clearLayers();

  const utm33n = "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs";

    //filter features based on selected filtering types
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

const renderPointsLayer = async (geojsonFile) => {
  if (!map.value) return;

  removePointsLayer(); 

  try {
    const response = await fetch(`./geojson/${geojsonFile}`);
    const geojson = await response.json();

    const tileIndex = geojsonvt(geojson, {
      maxZoom: 14,
      extent: 4096,
      buffer: 64,
    });

    pointsLayer.value = L.vectorGrid.slicer(geojson, {
      vectorTileLayerStyles: {
        sliced: (properties, zoom) => {
          return {
            color: "red",
            radius: 1,
            fillOpacity: 0.9,
            weight: 1,
          };
        },
      },
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
      getFeatureId: (feature) => feature.id,
    });

    pointsLayer.value.addTo(map.value);

  } catch (error) {
    console.error(`error loading ${geojsonFile}:`, error);
  }
};

const removePointsLayer = () => {
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