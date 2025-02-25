import { ref } from "vue";
import { defineStore } from "pinia";

// store for filtering map
export const useSportsStore = defineStore("sportsStore", () => {
    const sweden = ref(true);
    const commune = ref('');
    const allCommunes = ref();
    const activity = ref('');
    const travelMode = ref('sustainable');
    const travelModes = ref([
        "car", 
        "bicycle", 
        "walk", 
        "transit", 
        "sustainable",
      ])
    const travelTime = ref(15);
    const travelTimes = ref([
        15,
        30,
        60,
    ])
    const dayType = ref('all');
    const activeGeoJsonFile = ref(null);

    const toggleGeoJsonFile = (filename) => {
        activeGeoJsonFile.value = (activeGeoJsonFile.value === filename) ? null : filename;
    };

    const updateCommune = (value) => {
        commune.value = value;
    }

    const updateMode = (value) => {
        travelMode.value = value;
    }

    const updateTravelTime = (value) => {
        travelTime.value = value;
    }

    const updateDayType = (value) => {
        dayType.value = value;
    }
    
    return {
        sweden,
        commune, 
        allCommunes,
        activity, 
        travelMode, 
        travelTime, 
        travelTimes,
        travelModes,
        dayType,
        activeGeoJsonFile,
        updateDayType, 
        updateCommune,
        updateMode,
        updateTravelTime,
        toggleGeoJsonFile,
    }
})