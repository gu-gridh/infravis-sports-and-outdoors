<template>
  <div class="map-controls">
    <div class="section logo">
      <img src="./assets/logo_mistra.png" alt="Logo" width="200" />
      <img src="./assets/info-button.svg" alt="Info" width="30" class="info-button" @click="$emit('showInfo')" />
    </div>
    <div class="section">
      <h2>Municipality</h2>
      <div ref="searchContainer" class="municipality-search">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search municipality..." 
          @focus="showDropdown"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearCommune">X</button>
        <ul v-show="isDropdownVisible && filteredCommunes.length" class="search-results">
          <li 
            v-for="commune in filteredCommunes" 
            :key="commune.id" 
            @click="selectCommune(commune.kommunnamn)">
            {{ commune.kommunnamn }}
          </li>
        </ul>
      </div>

    <!-- Grid vs Regso -->
      <div class="btn-group2" style="margin-top: 10px;">
        Display unit
        <button @click="setDisplayUnit('grid')" :class="{ active: store.displayUnit === 'grid' }">
          Grid
        </button>
        <button @click="setDisplayUnit('regso')" :class="{ active: store.displayUnit === 'regso' }">
          Regso
        </button>
      </div>
    </div>
    
    <!-- Sustainability Filters -->
    <div class="section">
      <h2>Indicator</h2>
      <p>Choose one</p>
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
        <div class="btn-group toggle-switch" :class="{ greyout: !store.commune }">
          <label>Population Weight by Grid</label>
          <label class="switch">
            <input type="checkbox"
                  v-model="store.travelTimePopulationWeight"
                  :disabled="!store.commune">
            <span class="slider"></span>
          </label>
        </div>

        <div class="btn-group toggle-switch" :class="{ greyout: !store.commune }">
          <label>% Population with Access to City</label>
          <label class="switch">
            <input type="checkbox"
                  v-model="store.travelTimePercentageAccess"
                  :disabled="!store.commune">
            <span class="slider"></span>
          </label>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useSportsStore } from "./settings/store";

const store = useSportsStore();
const searchQuery = ref("");
const isDropdownVisible = ref(false);
const searchContainer = ref(null);


const filteredCommunes = computed(() => {
  if (!searchQuery.value) return [];
  return store.allCommunes.filter(c =>
    c.kommunnamn.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function showDropdown() {
  isDropdownVisible.value = true;
}

function selectCommune(name) {
  store.updateCommune(name);
  searchQuery.value = name;
  isDropdownVisible.value = false;
}

function clearCommune() {
  store.commune = "";
  searchQuery.value = "";
  isDropdownVisible.value = false;
}

function handleClickOutside(event) {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    isDropdownVisible.value = false;
  }
}

function showInfo() {
  store.showInfo = true;
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const dayTypes = [
  { label: "Weekday", value: "week_day" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

const sustainabilityIndexOptions = [
  { label: "Total", value: "total" },
  { label: "Sports", value: "sports" },
  { label: "Outdoors", value: "outdoors" },
];

const activityTypes = [
  { label: "Disc golf", value: "Disc golf" },
  { label: "Dog park", value: "Dog park" },
  { label: "Football", value: "Football" },
  { label: "Golf", value: "Golf" },
  { label: "Gym / fitness centre", value: "Gym FitnessCentre" },
  { label: "Horse riding", value: "Horse riding" },
  { label: "Ice hockey", value: "Ice hockey" },
  { label: "Other ballsports", value: "Other ballsports" },
  { label: "Outdoor swimming", value: "Outdoor swimming" },
  { label: "Outdoors", value: "Outdoors" },
  { label: "Picnic", value: "Picnic" },
  { label: "Playground", value: "Playground" },
  { label: "Racket sports", value: "Racket sports" },
  { label: "Walking / running", value: "Walking / running" },
  { label: "Athletics", value: "Athletics" },
  { label: "Gymnastics", value: "Gymnastics" },
  { label: "Outdoor gym", value: "Outdoor gym" },
  { label: "Swimming pool", value: "Swimming pool" },
];

const minutesOptions = [15, 30, 60];
const travelModes = ["car", "bicycle", "walk", "transit", "sustainable"];

//commune and (grid/regso)
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

.section {
  background-color: rgba(255, 255, 255, 0.7);
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  padding-top: 15px;
}

.logo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.info-button {
  cursor: pointer;
  transition: transform 0.3s;
}

.municipality-search {
  position: relative;
}

input[type="text"] {
  padding: 5px 30px 5px 5px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f0f0f0;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 2000;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ccc;
  background: white;
}

.search-results li {
  padding: 5px;
  cursor: pointer;
}

.search-results li:hover {
  background-color: #eee;
}

.clearbtn {
  margin-left: 10px;
  padding: 3px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f0f0f0;
}

.btn-group,
.btn-group2 {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 10px;
}


.btn-group button,
.btn-group2 button {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
  
}

button.active {
  background-color: #497723;
  color: white;
  border-color: #497723;
}

select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.clear-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #888;
}

/* Greyout button styles */
.greyout {
  opacity: 0.5;
  pointer-events: none;
}

.toggle-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1em;
}

.toggle-switch label {
  margin-right: 1em;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* Slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

/* Checked state */
input:checked + .slider {
  background-color: #4caf50;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Disabled state */
input:disabled + .slider {
  background-color: #999;
  cursor: not-allowed;
}
</style>
