import { ref } from "vue";
import { defineStore } from "pinia";

//store for filtering map
export const useSportsStore = defineStore("sportsStore", () => {
  const sweden = ref(true);
  const commune = ref('');
  const allCommunes = ref();

  //index filters
  const activity = ref('sports');
  const travelTime = ref(15);
  const travelTimes = ref([15, 30, 60]);
  const dayType = ref('week_day');

  //sustainability filters
  const sustainabilityActivity = ref('sports');
  const sustainabilityTravelTime = ref(15);
  const sustainabilityDayType = ref('weekday');
  const activeGeoJsonFile = ref(null);
  const sustainabilityTravelMode = ref('sustainable');
  const sustainabilityTravelModes = ref([
    "car", 
    "bicycle", 
    "walk", 
    "transit", 
    "sustainable",
  ]);

  //tracks button selection ("index" or "sustainability")
  const metric = ref('index');

  const toggleGeoJsonFile = (filename) => {
    activeGeoJsonFile.value = (activeGeoJsonFile.value === filename) ? null : filename;
  };

  const updateCommune = (value) => {
    commune.value = value;
  };

  //index update functions
  const updateTravelTime = (value) => {
    travelTime.value = value;
  };

  const updateDayType = (value) => {
    dayType.value = value;
  };

  //sustainability update functions
  const updateSustainabilityDayType = (value) => {
    sustainabilityDayType.value = value;
  };

  const updateSustainabilityActivity = (value) => {
    sustainabilityActivity.value = value;
  };

  const updateSustainabilityTravelTime = (value) => {
    sustainabilityTravelTime.value = value;
  };

  const updateSustainabilityMode = (value) => {
    sustainabilityTravelMode.value = value;
  };

  //setter for metric
  const setMetric = (value) => {
    metric.value = value;
  };

  return {
    sweden,
    commune,
    allCommunes,
    //index metric state and update functions
    activity,
    travelTime,
    travelTimes,
    dayType,
    updateDayType,
    updateTravelTime,
    //sustainability metric state and update functions
    sustainabilityActivity,
    sustainabilityTravelMode,
    sustainabilityTravelTime,
    sustainabilityDayType,
    updateSustainabilityDayType,
    updateSustainabilityActivity,
    updateSustainabilityTravelTime,
    updateSustainabilityMode,
    sustainabilityTravelModes,
    //common state & functions
    activeGeoJsonFile,
    metric,
    toggleGeoJsonFile,
    updateCommune,
    setMetric,
  };
});
