<template>
    <div class="map-controls">
      <div class="top-section">
        <div class="btn-group">
          <label>Select commune</label>
          <select @change="setCommune($event.target.value)">
            <option value="" selected disabled>Select a commune</option>
            <option v-for="commune in store.allCommunes" :key="commune.id" :value="commune.kommunnamn">
              {{ commune.kommunnamn }}
            </option>
          </select>
        </div>
        <!-- Grid vs Regso -->
        <div class="btn-group" v-if="store.commune">
          <button @click="setDisplayUnit('grid')" :class="{ active: store.displayUnit === 'grid' }">
            Grid
          </button>
          <button @click="setDisplayUnit('regso')" :class="{ active: store.displayUnit === 'regso' }">
            Regso
          </button>
        </div>
      </div>
  
      <!-- Sustainability Filters -->
      <div class="bottom-section" v-if="store.commune">
        <div class="btn-group">
          <button @click="setSustainabilityFilterType('index')"
                  :class="{ active: store.sustainabilityFilterType === 'index' }">
            Sustainability Index
          </button>
          <button @click="setSustainabilityFilterType('travel')"
                  :class="{ active: store.sustainabilityFilterType === 'travel' }">
            Travel Time to Activities
          </button>
        </div>
  
        <template v-if="store.sustainabilityFilterType === 'index'">
          <div class="btn-group">
            <label>Activity</label>
            <select @change="setSustainabilityIndexActivity($event.target.value)"
                    :value="store.sustainabilityIndexActivity">
              <option v-for="act in sustainabilityIndexOptions" :key="act.value" :value="act.value">
                {{ act.label }}
              </option>
            </select>
          </div>
          <div class="btn-group">
            <label>Minutes</label>
            <button v-for="min in minutesOptions" :key="min"
                    @click="setSustainabilityIndexMinutes(min)"
                    :class="{ active: store.sustainabilityIndexMinutes === min }">
              {{ min }}
            </button>
          </div>
          <div class="btn-group">
            <span>Day</span>
            <button v-for="day in dayTypes" :key="day.value"
                    @click="setSustainabilityIndexDay(day.value)"
                    :class="{ active: store.sustainabilityIndexDay === day.value }">
              {{ day.label }}
            </button>
          </div>
        </template>
  
        <!-- Travel Time filters -->
        <template v-if="store.sustainabilityFilterType === 'travel'">
          <div class="btn-group">
            <label>Activity</label>
            <select @change="setTravelTimeActivity($event.target.value)"
                    :value="store.travelTimeActivity">
              <option v-for="act in activityTypes" :key="act.value" :value="act.value">
                {{ act.label }}
              </option>
            </select>
          </div>
          <div class="btn-group">
            <label>Mode</label>
            <select @change="setTravelTimeTransportMode($event.target.value)"
                    :value="store.travelTimeTransportMode">
              <option v-for="mode in travelModes" :key="mode" :value="mode">
                {{ mode }}
              </option>
            </select>
          </div>
          <div class="btn-group">
            <label>Minutes</label>
            <button v-for="min in minutesOptions" :key="min"
                    @click="setTravelTimeMinutes(min)"
                    :class="{ active: store.travelTimeMinutes === min }">
              {{ min }}
            </button>
          </div>
          <div class="btn-group">
            <span>Day</span>
            <button v-for="day in dayTypes" :key="day.value"
                    @click="setTravelTimeDay(day.value)"
                    :class="{ active: store.travelTimeDay === day.value }">
              {{ day.label }}
            </button>
          </div>
          <div class="btn-group">
            <label>Population Weight by Grid</label>
            <button @click="toggleTravelTimePopulationWeight"
                    :class="{ active: store.travelTimePopulationWeight }">
              {{ store.travelTimePopulationWeight ? 'On' : 'Off' }}
            </button>
          </div>
          <div class="btn-group">
            <label>% Population with Access to City</label>
            <button @click="toggleTravelTimePercentageAccess"
                    :class="{ active: store.travelTimePercentageAccess }">
              {{ store.travelTimePercentageAccess ? 'On' : 'Off' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useSportsStore } from "./settings/store";
  
  const store = useSportsStore();
  
  const dayTypes = [
    { label: "Weekday", value: "week_day" },
    { label: "Saturday", value: "saturday" },
    { label: "Sunday", value: "sunday" }
  ];

  const sustainabilityIndexOptions = [
  { label: "Total",    value: "total" },
  { label: "Sports",   value: "sports" },
  { label: "Outdoors", value: "outdoors" }
];
  
  const activityTypes = [
    { label: "Disc golf",         value: "Disc golf" },
    { label: "Dog park",          value: "Dog park" },
    { label: "Football",          value: "Football" },
    { label: "Golf",              value: "Golf" },
    { label: "Gym / fitness centre", value: "Gym / fitness centre" },
    { label: "Horse riding",      value: "Horse riding" },
    { label: "Ice hockey",        value: "Ice hockey" },
    { label: "Other ballsports",  value: "Other ballsports" },
    { label: "Outdoor swimming",  value: "Outdoor swimming" },
    { label: "Outdoors",          value: "Outdoors" },
    { label: "Picnic",            value: "Picnic" },
    { label: "Playground",        value: "Playground" },
    { label: "Racket sports",     value: "Racket sports" },
    { label: "Walking / running", value: "Walking / running" },
    { label: "Athletics",         value: "Athletics" },
    { label: "Gymnastics",        value: "Gymnastics" },
    { label: "Outdoor gym",       value: "Outdoor gym" },
    { label: "Swimming pool",     value: "Swimming pool" }
  ];
  
  const minutesOptions = [15, 30, 60];
  const travelModes = ["car", "bicycle", "walk", "transit", "sustainable"];
  
  //commune and (grid/regso)
  const setCommune = (value) => store.updateCommune(value);
  const setDisplayUnit = (value) => (store.displayUnit = value);
  
  //index or travel
  const setSustainabilityFilterType = (value) => (store.sustainabilityFilterType = value);
  
  //sustainability filters
  const setSustainabilityIndexActivity = (value) => (store.sustainabilityIndexActivity = value);
  const setSustainabilityIndexMinutes = (value) => (store.sustainabilityIndexMinutes = value);
  const setSustainabilityIndexDay = (value) => (store.sustainabilityIndexDay = value);
  
  //travel time filters
  const setTravelTimeActivity = (value) => (store.travelTimeActivity = value);
  const setTravelTimeTransportMode = (value) => (store.travelTimeTransportMode = value);
  const setTravelTimeMinutes = (value) => (store.travelTimeMinutes = value);
  const setTravelTimeDay = (value) => (store.travelTimeDay = value);
  const toggleTravelTimePopulationWeight = () => (store.travelTimePopulationWeight = !store.travelTimePopulationWeight);
  const toggleTravelTimePercentageAccess = () => (store.travelTimePercentageAccess = !store.travelTimePercentageAccess);
  </script>
  
  <style scoped>
  .map-controls {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    min-width: 300px;
  }
  
  .top-section,
  .bottom-section {
    background-color: white;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
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
  