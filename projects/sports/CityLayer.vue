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
        return 'geojson/t3_city_ttm_percent.geojson';
    }

    return sportsStore.sustainabilityFilterType === 'index'
        ? 'geojson/t2_index_by_city.geojson'
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
        //console.log("Index mode:", { propName, val, properties: feature.properties });
        return {
            color: "black",
            fillColor: setIndexColor(val),
            fillOpacity: 0.9,
            weight: 1,
        };
    } else if (!sportsStore.travelTimePercentageAccess) {
        const propName = generateTravelPropName();
        const val = feature.properties[propName];
        //console.log("Travel mode:", { propName, val, properties: feature.properties });
        return {
            color: "black",
            fillColor: setAccColor(val),
            fillOpacity: 0.9,
            weight: 1,
        };
    } else {
        const propName = generatePercentPropName();
        const val = feature.properties[propName];
        return {
            color: 'black',
            fillColor: setIndexColor(val),
            fillOpacity: 0.9,
            weight: 1
        };
    }
}

function setIndexColor(percent) {
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
        () => sportsStore.travelTimePercentageAccess,
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

//change legend if travel time is changed
// watch(
//     () => sportsStore.travelTimeActivity,
//     (newActivity) => {
//         if (layer.value) {
//             props.map.removeLayer(layer.value);
//             layer.value = null;
//             loadLayer();
//         }
//     }
// );

</script>

<style scoped>
</style>