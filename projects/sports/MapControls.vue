<template>
    <div class="map-controls">
        <!-- commune selection and metric buttons -->
        <div class="btn-group">
            <label>Select commune</label>
            <select @change="setCommune($event.target.value)">
                <option value="" selected disabled>Select a commune</option>
                <option v-for="commune in store.allCommunes" :key="commune.id" :value="commune.kommunnamn">
                    {{ commune.kommunnamn }}
                </option>
            </select>
            <template v-if="store.commune">
                <button @click="setMetric('index')" :class="{ active: store.metric === 'index' }">
                    Index
                </button>
                <button @click="setMetric('sustainability')" :class="{ active: store.metric === 'sustainability' }">
                    Sustainability
                </button>
            </template>
        </div>

        <!-- filters for index -->
        <template v-if="store.commune && store.metric === 'index'">
            <div class="btn-group">
                <span>Day Type</span>
                <button v-for="day in dayTypes" :key="day.value" @click="setDay(day.value)"
                    :class="{ active: store.dayType === day.value }">
                    {{ day.label }}
                </button>
            </div>

            <div class="btn-group">
                <span>Activity Type</span>
                <button v-for="type in activityTypes" :key="type.value" @click="setActivity(type.value)"
                    :class="{ active: store.activity === type.value }">
                    {{ type.label }}
                </button>
            </div>

            <div class="btn-group">
                <span>Travel Time</span>
                <button v-for="time in store.travelTimes" :key="time" @click="setTime(time)"
                    :class="{ active: store.travelTime === time }">
                    {{ time }} min
                </button>
            </div>
        </template>

        <!-- filters for sustainability -->
        <template v-if="store.commune && store.metric === 'sustainability'">
            <div class="btn-group">
                <span>Day Type</span>
                <button v-for="day in dayTypes" :key="day.value" @click="setSustainabilityDay(day.value)"
                    :class="{ active: store.sustainabilityDayType === day.value }">
                    {{ day.label }}
                </button>
            </div>

            <div class="btn-group">
                <span>Travel Type</span>
                <button v-for="mode in store.sustainabilityTravelModes" :key="mode" @click="setSustainabilityMode(mode)"
                    :class="{ active: store.sustainabilityTravelMode === mode }">
                    {{ mode }}
                </button>
            </div>

            <div class="btn-group">
                <span>Activity Type</span>
                <button v-for="type in activityTypes" :key="type.value" @click="setSustainabilityActivity(type.value)"
                    :class="{ active: store.sustainabilityActivity === type.value }">
                    {{ type.label }}
                </button>
            </div>

            <div class="btn-group">
                <span>Travel Time</span>
                <button v-for="time in store.travelTimes" :key="time" @click="setSustainabilityTime(time)"
                    :class="{ active: store.sustainabilityTravelTime === time }">
                    {{ time }} min
                </button>
            </div>
        </template>

        <!-- point layers -->
        <div class="btn-group">
            <button @click="store.toggleGeoJsonFile('destinations_outdoors_national.geojson')"
                :class="{ active: store.activeGeoJsonFile === 'destinations_outdoors_national.geojson' }">
                Outdoors
            </button>
            <button @click="store.toggleGeoJsonFile('destinations_per_city.geojson')"
                :class="{ active: store.activeGeoJsonFile === 'destinations_per_city.geojson' }">
                Destinations
            </button>
        </div>

        <!-- Info -->
        <p>
            Amount of accessible sports facilities in {{ store.commune }} within {{ store.travelTime }} minutes by {{
                store.travelMode }}
        </p>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useSportsStore } from "./settings/store";

const store = useSportsStore();

//options shared by both metrics
const dayTypes = [
    { label: "Weekday", value: "week_day" },
    { label: "Saturday", value: "saturday" },
    { label: "Sunday", value: "sunday" }
];

const activityTypes = [
    { label: "Sports", value: "sports" },
    { label: "Outdoors", value: "outdoors" },
    { label: "Total", value: "total" }
];

const setCommune = (commune) => store.updateCommune(commune);
const setMetric = (value) => store.setMetric(value);

//index setters
const setDay = (day) => store.updateDayType(day);
const setActivity = (activity) => store.activity = activity;
const setTime = (time) => store.updateTravelTime(time);

//sustainability setters
const setSustainabilityDay = (day) => store.updateSustainabilityDayType(day);
const setSustainabilityActivity = (activity) => store.updateSustainabilityActivity(activity);
const setSustainabilityTime = (time) => store.updateSustainabilityTravelTime(time);
const setSustainabilityMode = (mode) => store.updateSustainabilityMode(mode);
</script>

<style scoped>
.map-controls {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    background-color: white;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.5);
    min-width: 300px;
}

.btn-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding-bottom: 10px;
}

button {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f0f0f0;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
}

button.active {
    background-color: #007bff;
    color: white;
    border-color: #0056b3;
}

select {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f0f0f0;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
}
</style>