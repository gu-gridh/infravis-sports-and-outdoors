<template>
    <div class="city-layer"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref, computed } from "vue";
import L from "leaflet";
import { useSportsStore } from "./settings/store";

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

function generatePercentPropName() {
    const activity = sportsStore.travelTimeActivity.replace(/ /g, '_');
    const mode = sportsStore.travelTimeTransportMode.replace(/ /g, '_');
    const modeLower = mode.toLowerCase();
    const minutes = sportsStore.travelTimeMinutes;
    const day = sportsStore.travelTimeDay;

    let daySegment = '';

    if (
        (day === 'saturday' || day === 'sunday') &&
        (modeLower === 'sustainable' || modeLower === 'transit')
    ) {
        daySegment = `_${day}`;
    }

    const key = `${activity}_${mode}${daySegment}_${minutes}_percent`;
    return key;
}

//choose the correct file
const geojsonFile = computed(() => {
    if (
        sportsStore.sustainabilityFilterType === 'travel' &&
        sportsStore.travelTimePercentageAccess
    ) {
        return 'geojson/t3_percent_15_30_60_by_city.geojson';
    }

    return sportsStore.sustainabilityFilterType === 'index'
        ? 'geojson/t2_index_15_30_60_by_city.geojson'
        : 'geojson/t1_ttm_15_30_60_by_city.geojson';
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
        return {
            color: "white",
            fillColor: setIndexColor(val),
            fillOpacity: 0.8,
            weight: 1,
        };
    } else if (!sportsStore.travelTimePercentageAccess) {
        const propName = generateTravelPropName();
        const val = feature.properties[propName];
        return {
            color: "white",
            fillColor: setAccColor(val),
            fillOpacity: 0.8,
            weight: 1,
        };
    } else if (sportsStore.travelTimePercentageAccess) {
        const propName = generatePercentPropName();
        const val = feature.properties[propName];
        return {
            color: 'white',
            fillColor: setPercAccColor(val),
            fillOpacity: 0.8,
            weight: 1
        };
    }
}

function setIndexColor(percent) {
    //no decimals
    if (percent === null || percent === undefined) return "#cccccc"; //gray
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

const colors = {1: '#ffea46', 2: '#ccbb69', 3: '#969078', 4: '#666970', 5: '#31446b', 6: '#00204d'};

function setAccColor(time) {
    if (time === null || time === undefined) return "#cccccc"; //gray
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
        if (time >= 0 && time <= 5 ) return colors[1];
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

function setPercAccColor(percent) {
    if (percent === null || percent === undefined) return "#cccccc"; //gray
    //no decimals
    percent = Math.round(percent);
    if (percent >= 0 && percent <= 10) return "#feebe2";
    if (percent >= 10 && percent <= 20) return "#fdd3d0";
    if (percent >= 20 && percent <= 30) return "#fbbabe";
    if (percent >= 30 && percent <= 40) return "#fa9bb1";
    if (percent >= 40 && percent <= 50) return "#f879a6";
    if (percent >= 50 && percent <= 60) return "#ec579c";
    if (percent >= 60 && percent <= 70) return "#d63592";
    if (percent >= 70 && percent <= 80) return "#bd1888";
    if (percent >= 80 && percent <= 90) return "#9b0d7f";
    if (percent >= 90 && percent <= 100) return "#7a0177";
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
        } 
        else if (sportsStore.travelTimePercentageAccess && sportsStore.sustainabilityFilterType === "travel") {
            div.innerHTML += `<p>Population with access to activity (%)</p>`;
            var indexRanges = [
                { min: 0, max: 10, color: "#feebe2" },
                { min: 10, max: 20, color: "#fdd3d0" },
                { min: 20, max: 30, color: "#fbbabe" },
                { min: 30, max: 40, color: "#fa9bb1" },
                { min: 40, max: 50, color: "#f879a6" },
                { min: 50, max: 60, color: "#ec579c" },
                { min: 60, max: 70, color: "#d63592" },
                { min: 70, max: 80, color: "#bd1888" },
                { min: 80, max: 90, color: "#9b0d7f" },
                { min: 90, max: 100, color: "#7a0177" }
            ];
            indexRanges.forEach(function (range) {
                div.innerHTML += `<div><span style="background:${range.color}"></span> ${range.min}-${range.max}</div>`;
            });
        }
        else if (sportsStore.sustainabilityFilterType === "travel") {
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

async function loadLayer() {

    sportsStore.isLoading = true
    try {
        const response = await fetch(asset(geojsonFile.value));
        let geoData = await response.json();
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
                    let val;
                    if (sportsStore.sustainabilityFilterType === "index") {
                        const p = `index_dd_${sportsStore.sustainabilityIndexMinutes}_min_${sportsStore.sustainabilityIndexActivity}_${sportsStore.sustainabilityIndexDay}`;
                        val = feature.properties[p];
                    } else if (sportsStore.travelTimePercentageAccess && sportsStore.sustainabilityFilterType === "travel") {
                        val = feature.properties[generatePercentPropName()];
                    }
                    else {
                        val = feature.properties[generateTravelPropName()];
                    }
                    // Check for missing value
                    if (val === null || val === undefined) {
                    val = "No data";
                    } else {
                    val = Math.round(val); // Always round to whole number
                    }

                    // Avoid appending unit when no value exists
                    const valueIs = val === "No data"
                    ? val
                    : (sportsStore.sustainabilityFilterType === "index" | sportsStore.travelTimePercentageAccess
                        ? `${val}%`
                        : `${val} min`);
                    L.popup({ offset: [0, -10] })
                        .setLatLng(e.latlng)
                        .setContent(content + `<br><b>${valueIs ?? "No data"}</b>`)
                        .openOn(props.map);
                });
                lyr.on("mouseout", () => {
                    props.map.closePopup();
                });
                lyr.on("click", () => {
                    const clickedCommune = feature.properties.city_name;
                    sportsStore.updateCommune(clickedCommune) 
                    sportsStore.clickedCommune = true
                    sportsStore.displayUnit = 'grid'
                });
            },
        }).addTo(props.map);
        createLegend(props.map)

    } catch (error) {
        console.error(error);
    } finally {
        sportsStore.isLoading = false
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
        () => sportsStore.travelTimePercentageAccess,
        () => sportsStore.indexPopulationWeight
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

<style scoped></style>