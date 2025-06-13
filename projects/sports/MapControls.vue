<template>
  <div class="map-controls">
    <div class="section logo"><a href="https://www.mistrasportandoutdoors.se/ " target="_blank">
        <img src="./assets/logo_mistra.png" alt="Logo" width="200" /></a>
      <button class="lang-btn" @click="toggleLocale" :title="locale === 'sv' ? 'Svenska' : 'English'">
        {{ locale === 'sv' ? 'SV' : 'EN' }}
      </button>
      <img src="./assets/info-button.svg" alt="Info" width="30" class="info-button" @click="$emit('showInfo')" />
    </div>
    <div class="section" :class="{ greyout: store.isLoading }">
      <h2>{{ t('Municipality') }}</h2>
      <div ref="searchContainer" class="municipality-search">
        <input type="text" v-model="searchQuery" :placeholder="$t('search')" @focus="showDropdown" />
        <button v-if="searchQuery" class="clear-btn" @click="clearCommune">X</button>
        <ul v-show="isDropdownVisible && filteredCommunes.length" class="search-results">
          <li v-for="commune in filteredCommunes" :key="commune.id" @click="selectCommune(commune.kommunnamn)">
            {{ commune.kommunnamn }}
          </li>
        </ul>
      </div>

      <!-- Grid vs Regso -->
      <div class="btn-group2" style="margin-top: 10px;">
        {{ t('display') }}
        <button @click="setDisplayUnit('grid')" :disabled="isCity"
          :class="[{ greyout: isCity }, { active: store.displayUnit === 'grid' }]">
          {{ t('grid') }}
        </button>
        <button @click="setDisplayUnit('regso')" :disabled="isCity"
          :class="[{ greyout: isCity }, { active: store.displayUnit === 'regso' }]">
          RegSo
        </button>
        <button @click="setDisplayUnit('city')" :class="{ active: isCity }">
          {{ t('city') }}
        </button>
      </div>
    </div>

    <!-- Sustainability Filters -->
    <div class="section" :class="{ greyout: store.isLoading }">
      <h2>{{ t('indicator') }}</h2>
      <!-- <p>{{ t('chooseone') }}</p> -->
      <div class="btn-group">
        <button @click="setSustainabilityFilterType('index')"
          :class="{ active: store.sustainabilityFilterType === 'index' }">
          {{ t('susindex') }}
        </button>
        <button @click="setSustainabilityFilterType('travel')"
          :class="{ active: store.sustainabilityFilterType === 'travel' }">
          {{ t('traveltime') }}
        </button>
      </div>
      <template v-if="store.sustainabilityFilterType === 'index'">
        <div class="btn-group">
          <label>{{ t('activity') }}</label>
          <select @change="setSustainabilityIndexActivity($event.target.value)"
            :value="store.sustainabilityIndexActivity">
            <option v-for="act in sustainabilityIndexOptions" :key="act.value" :value="act.value">
              {{ act.label }}
            </option>
          </select>
        </div>
        <div class="btn-group">
          <label>{{ t('minutes') }}</label>
          <button v-for="min in minutesOptions" :key="min" @click="setSustainabilityIndexMinutes(min)"
            :class="{ active: store.sustainabilityIndexMinutes === min }">
            {{ min }}
          </button>
        </div>
        <div class="btn-group">
          <span>{{ t('day') }}</span>
          <button v-for="day in dayTypes" :key="day.value" @click="setSustainabilityIndexDay(day.value)"
            :class="{ active: store.sustainabilityIndexDay === day.value }">
            {{ day.label }}
          </button>
        </div>
      </template>

      <template v-if="store.sustainabilityFilterType === 'travel'">
        <div class="btn-group">
          <label>{{ t('activity') }}</label>
          <select @change="setTravelTimeActivity($event.target.value)" :value="store.travelTimeActivity">
            <option v-for="act in activityTypes" :key="act.value" :value="act.value">
              {{ act.label }}
            </option>
          </select>
          <div class="btn-group toggle-switch" :class="{ greyout: !store.commune }">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <small>{{ t('destinations') }}</small>
              <label class="switch">
                <input type="checkbox" v-model="store.destinations" :disabled="!store.commune">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
        <div class="btn-group">
          <label>{{ t('mode') }}</label>
          <select @change="setTravelTimeTransportMode($event.target.value)" :value="store.travelTimeTransportMode">
            <option v-for="mode in travelModes" :key="mode.value" :value="mode.value">
              {{ mode.label }}
            </option>
          </select>
        </div>
        <div class="btn-group">
          <label>{{ t('minutes') }}</label>
          <button v-for="min in minutesOptions" :key="min" @click="setTravelTimeMinutes(min)"
            :class="{ active: store.travelTimeMinutes === min }">
            {{ min }}
          </button>
        </div>
        <div class="btn-group">
          <button v-for="day in dayTypes" :key="day.value" @click="setTravelTimeDay(day.value)"
            :class="{ active: store.travelTimeDay === day.value }">
            {{ day.label }}
          </button>
        </div>
        <div class="btn-group toggle-switch" :class="{ greyout: !store.commune || store.displayUnit === 'regso' }">
          <label>{{ t('popgrid') }}</label>
          <label class="switch">
            <input type="checkbox" v-model="store.travelTimePopulationWeight"
              :disabled="!store.commune || store.displayUnit === 'regso'">
            <span class="slider"></span>
          </label>
        </div>

        <div v-if="isCity" class="btn-group toggle-switch">
          <label>% {{ t('popaccess') }}</label>
          <label class="switch">
            <input type="checkbox" v-model="store.travelTimePercentageAccess">
            <span class="slider"></span>
          </label>
        </div>

        <div v-else class="btn-group">
          <label>% {{ t('popaccess') }}</label>
          <span>{{ percentageValue ?? '–' }}%</span>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSportsStore } from "./settings/store";

const geojson = ref(null)
const { t, locale } = useI18n();
const store = useSportsStore();
const searchQuery = ref("");
const isDropdownVisible = ref(false);
const searchContainer = ref(null);
const isCity = computed(() => store.displayUnit === 'city')

const filteredCommunes = computed(() => {
  if (!searchQuery.value) return [];
  return store.allCommunes.filter(c =>
    c.kommunnamn.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function toggleLocale() {
  locale.value = locale.value === "sv" ? "en" : "sv";
}

function showDropdown() {
  isDropdownVisible.value = true;
}

function selectCommune(name) {
  store.updateCommune(name);
  searchQuery.value = name;
  isDropdownVisible.value = false;
  store.displayUnit = 'grid'
}

function clearCommune() {
  setDisplayUnit('city')
  store.commune = "";
  store.destinations = false
  searchQuery.value = "";
  isDropdownVisible.value = false;
  store.clickedCommune = false;
}

function handleClickOutside(event) {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    isDropdownVisible.value = false;
  }
}

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  /*  used to generate the sustainability % per acitivty and city when in grid/regso view */
  const res = await fetch('geojson/t3_percent_15_30_60_by_city.geojson')
  geojson.value = await res.json()
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const dayTypes = computed(() => [
  { label: t('weekday'), value: 'week_day' },
  { label: t('saturday'), value: 'saturday' },
  { label: t('sunday'), value: 'sunday' },
])

const sustainabilityIndexOptions = computed(() => [
  { label: t('total'), value: 'total' },
  { label: t('sports'), value: 'sports' },
  { label: t('outdoors'), value: 'outdoors' },
]);

const activityTypes = computed(() => [
  { label: t('football'), value: "Football" },
  { label: t('otherball'), value: "Other ballsports" },
  { label: t('hockey'), value: "Ice hockey" },
  { label: t('gymnastics'), value: "Gymnastics" },
  { label: t('gym'), value: "Gym FitnessCentre" },
  { label: t('swimming'), value: "Swimming pool" },
  { label: t('horse'), value: "Horse riding" },
  { label: t('athletics'), value: "Athletics" },
  { label: t('martialarts'), value: "Martial arts" },
  { label: "Golf", value: "Golf" },
  { label: t('racket'), value: "Racket sports" },
  { label: t('playground'), value: "Playground" },
  { label: t('walkrun'), value: "Walking Running" },
  { label: t('outdoorswimming'), value: "Outdoor swimming" },
  { label: t('picnic'), value: "Picnic" },
  { label: t('dog'), value: "Dog park" },
  { label: t('outgym'), value: "Outdoor gym" },
  { label: "Disc golf", value: "Disc golf" },
]);

function setDisplayUnit(unit) {
  if (unit === 'city') {
    store.commune = ''
    store.destinations = false
    searchQuery.value = ''
    isDropdownVisible.value = false
  }
  store.displayUnit = unit
}

const minutesOptions = [15, 30, 60];
const travelModes = computed(() => [
  { label: t('car'), value: 'car' },
  { label: t('bicycle'), value: 'bicycle' },
  { label: t('walk'), value: 'walk' },
  { label: t('transit'), value: 'transit' },
  { label: t('sustainable'), value: 'sustainable' },
]);


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

function activityKey(str) { return str.replace(/\s+/g, '_') }

const currentCity = computed(() =>
  geojson.value?.features.find(
    f => f.properties.city_name.toLowerCase() === (store.commune || '').toLowerCase()
  )
)

const propName = computed(() => {
  if (!currentCity.value) return null
  const activity = activityKey(store.travelTimeActivity)
  const mode     = store.travelTimeTransportMode.toLowerCase()
  const minutes  = store.travelTimeMinutes
  let dayPart = ''
  if (mode === 'sustainable' || mode === 'transit') {
    const dayValue = store.travelTimeDay.toLowerCase()
    if (dayValue === 'saturday' || dayValue === 'sunday') {
      dayPart = `_${dayValue}`
    }
  }

  return `${activity}_${mode}${dayPart}_${minutes}_percent`
})

const percentageValue = computed(() => {
  const key = propName.value
  const num = Number(currentCity.value?.properties?.[key])
  //   console.log(
  //   `[lookup] ${store.commune || '(no commune)'} → ${propName.value} =`,
  //   currentCity.value?.properties?.[propName.value]
  // )
  return isFinite(num) ? Math.round(num) : null
})

//watch if clicked commune on city layer
watch(
  () => store.clickedCommune,
  (newClicked) => {
    if (newClicked && store.commune) {
      searchQuery.value = store.commune;
      isDropdownVisible.value = false;
    }
  }
);
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
  align-items: center;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
input:checked+.slider {
  background-color: #4caf50;
}

input:checked+.slider:before {
  transform: translateX(24px);
}

/* Disabled state */
input:disabled+.slider {
  background-color: #999;
  cursor: not-allowed;
}

.lang-btn {
  margin-left: 6px;
  padding: 2px 6px;
  border: 1px solid #497723;
  background: #497723;
  color: #fff;
  font-size: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .map-controls {
    font-size: 0.8rem;
  }

  .section {
    padding: 5px;
  }

  h2 {
    font-size: 1.2rem !important;

  }

  button {
    font-size: 0.8rem;
  }
}
</style>
