import { ref } from "vue";
import { defineStore } from "pinia";

export const useSportsStore = defineStore("sportsStore", () => {

  const isLoading = ref(false);

  //commune data
  const commune = ref('');
  const allCommunes = ref([]);

  //(grid vs regso)
  const displayUnit = ref('city');

  //("index" or "travel")
  const sustainabilityFilterType = ref('index');

  //sustainability Index filters
  const sustainabilityIndexActivity = ref('total');
  const sustainabilityIndexMinutes = ref(15);
  const sustainabilityIndexDay = ref('week_day');

  //travel time filters
  const travelTimeActivity = ref('Football');
  const travelTimeTransportMode = ref('sustainable');
  const travelTimeMinutes = ref(15);
  const travelTimeDay = ref('week_day');
  const travelTimePopulationWeight = ref(false);
  const travelTimePercentageAccess = ref(false);
  const destinations = ref(false)
  
  const clickedCommune = ref(false)


  const updateCommune = (value) => {
    commune.value = value;
  };

  return {
    commune,
    allCommunes,
    displayUnit,
    sustainabilityFilterType,
    sustainabilityIndexActivity,
    sustainabilityIndexMinutes,
    sustainabilityIndexDay,
    travelTimeActivity,
    travelTimeTransportMode,
    travelTimeMinutes,
    travelTimeDay,
    travelTimePopulationWeight,
    travelTimePercentageAccess,
    destinations,
    clickedCommune,
    updateCommune,
    isLoading,
  };
});
