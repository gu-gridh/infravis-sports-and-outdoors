<script setup>
import { provide } from "vue";
import config from "./config";
import Footer from './Footer.vue';

provide("config", config);
</script>

<template>
  <Footer />
  <router-view />
</template>

<style>
h2 {
  font-size: 24px !important;
  margin: 0;
  padding: 0;
  padding-bottom: 5px !important;
} 
</style>