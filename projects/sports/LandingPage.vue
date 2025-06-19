<template>
  <div class="landing-page">
    <div class="language-switch">
      <button class="lang-btn" @click="toggleLocale" :title="locale === 'sv' ? 'Svenska' : 'English'">
        {{ locale === 'sv' ? 'SV' : 'EN' }}
      </button>
    </div>
    <h2>{{ $t('landingpage1') }}</h2>
    <h2>{{ $t('landingpage2') }}</h2>
    <div class="text">
      <p>{{ $t('landingpage3') }}</p>
      <p>{{ $t('landingpage4') }}</p>
      <ul>
        <li>{{ $t('landingpage5') }}</li>
        <li>{{ $t('landingpage6') }}</li>
        <li>{{ $t('landingpage7') }}</li>
        <li>{{ $t('landingpage8') }}</li>
      </ul>
      <p>{{ $t('landingpage9') }}
      </p>
    </div>
    <button @click="$emit('close')" class="btn">{{ $t('explorethemap') }}</button>
    <div class="infotext">
      <p>{{ $t('landingpage10') }}</p>
    </div>
    <p>
      <a href="/accessibility-index/about.html" target="_blank">About the project</a> 
      <a href="/accessibility-index/map.html" target="_blank">About the map</a>
    </p>
    <div class="disclaimer">
      <p>{{ $t('disclaimer') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function toggleLocale() {
  locale.value = locale.value === 'sv' ? 'en' : 'sv'
}
</script>

<style scoped>
h1 {
  font-size: 36px;
  margin: 0;
  padding: 0;
  padding-bottom: 10px;
  color: #497723;
}

h2 {
  font-size: 24px;
  margin: 0;
  padding: 0;
  padding-bottom: 5px;
  color: black;
}

.landing-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #333;
  text-align: center;
  overflow-y: scroll;
}

.text {
  flex-direction: column;
  columns: 2;
  max-width: 900px;
  margin: 20px auto;
  font-size: 18px;
  text-align: left;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
}

p {
  margin: 10px 0;
}

.btn {
  background-color: #497723;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 18px;
  font-size: 18px;
  cursor: pointer;
  margin-top: 20px;
}

.disclaimer {
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.infotext {
  margin-top: 20px;
}

a {
  text-decoration: underline;
  color: #497723;
  font-weight: normal;
  cursor: pointer;
  justify-content: space-between;
  margin-right: 20px;
}

.language-switch {
  position: absolute;

  left: 20px;
  z-index: 1000;
}

.lang-btn {
  background-color: transparent;
  background-color: #497723;
  color: white;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
}

@media (max-width: 800px) {
  .text {
    font-size: 16px;
  }
  
  h2 {
    font-size: 18px;
  }
  
  .btn {
    padding: 6px 12px;
    font-size: 16px;
  }
  
  .language-switch {
    top: 10px;
    left: 10px;
  }

  .landing-page {
    width: 90%;
    display: block;
    overflow-y: auto;
  }
  .disclaimer {
    font-size: 12px;
  }
}
</style>