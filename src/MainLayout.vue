<template>
  <div class="map-container h-full">
<!--     <div class="left-pane">
      <div class="mobile-ui-drag"></div>
      <div class="left-pane-layer">
      
        <div class="left-pane-content">
         
          <slot name="title">
            <div v-if="config" class="">
              <div class="main-title" v-html="config.title"></div>
              <div class="sub-title" v-html="config.subtitle"></div>
            </div>
          </slot>
          <slot name="about">
            <div class="about">
              <p class="" v-html="config.about"></p>
            </div>
          </slot>
          <slot name="search"></slot>
        </div>
      </div>
      <div class="atlas-gradient"></div>
    </div> -->
    
    <div class="right-pane">
      <slot name="details">
        <div class="col-start-6 col-span-2 detail">
          <div class="detail">
            <div class="">
              <div>
              </div>
            </div>
          </div>
        </div>
      </slot>
    </div>
    <div class="atlas">
    
    <slot name="background">
      <MapComponent />
    </slot>
   
  </div>
 
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import MapComponent from "./components/MapComponent.vue";
import type { Project } from "./types/project";

const config = inject("config") as Project;

</script>

<style>
html,
body {
  height: 100vh;
  width: 100vw;
  margin: 0px !important;
  overflow: hidden !important;
  background-color:rgb(45,45,45);
  -ms-overflow-style: none;

}

#app {
  height: inherit;
  width: inherit;
  /* display: flex !important; */
}
.atlas {
  position:absolute;
  width:100%;
  height:100vh;
}

.mobile-ui-drag{
  display:none;
}

#app .about {
  line-height: 1.2;
  padding-top:10px;
}

.map-container {
  height: inherit;
  width: inherit;
}

  

/* Adaption for various screen sizes */

/* If your screen is very large */

 @media screen and (min-width: 1900px) {

#app .image-container {
  overflow: hidden;
  margin-bottom: 8px;
 width:100%;
 object-fit: cover !important;
}

#app .image {
 width:100%!important;

}
#app .place-meta-container{

}

#app .meta-container{

}
#app .meta-title{
  font-size:40px;
}

#app .place-meta-container .category-button{
  padding:12px 16px;
      background-size: 30px;
      padding-left: 50px;
      background-position: 10px 10px;
}

#app .meta-container .category-button{
  padding:12px 16px;
      background-size: 30px;
      padding-left: 50px;
      background-position: 10px 10px;
}

/* This one is also in mapview.css */
#app .masonry-grid {
  padding: 0px 10px 10px 600px;
}

#app .filter-container {
  height:calc(100vh - 480px);

}
} 

/* If your screen is smallish */

@media screen and (max-width: 1200px) {
.image-card {
  width: auto;
  pointer-events: auto !important;
  border-radius: 10px;
  margin-right: 20px;
  padding: 20px!important;
  margin-bottom: 20px;
  overflow:hidden!important;
}

#app .image-container {
  overflow: hidden;
  margin-bottom: 8px;
  border-radius:8px!important;
  width:100%!important;
 height:auto!important;
 padding-bottom:0px!important;
 overflow:hidden!important;
}

#app .image {
  overflow:hidden!important;
  width:100%!important;
  height:auto!important;
  transform:scale(1.2)!important;

}
.image-card:hover .image-container {
  transform:scale(1.0)!important;
}
}


/* If your screen is very small */

/* The basic structure */
@media screen and (max-width: 900px) {
 #app .left-pane {
  position: relative;
  float:left;
  min-height:100%;
  z-index: 500;
  width:100%;
  pointer-events: auto;
  margin-top:0px!important;
  border-radius:30px 30px 0 0;
  padding: 10px 30px 30px 30px !important;
  background-color:rgba(255,255,255,0.6);
  backdrop-filter:blur(5px);
  box-shadow: 0px -10px 20px 0 rgba(0, 0, 0, 0.3),
    0 0px 0px 0 rgba(0, 0, 0, 0.19);
}


#app .left-pane-layer {
width:100%;
height:100%;
padding: 20px 20px 0px 20px;
font-size:120%;
}


#app .main-title {
  width:100%;
  font-size: 70px;
  margin-left:0px;
  font-weight:200;
}

.sub-title {
  font-size: 55px;
  margin-left:0px;
  font-weight:200;
}

#app .about{
  width:100%;
  padding:0px;
 
}

#app .map-container {
overflow-y:auto;
width:100%;
height:calc(100vh) !important;
}

body {
  height: 100vh;
  width: 100vw;
}

.atlas {
  height: 120vh;
  float:left;
  width: calc(100% - 0px);
  position:absolute;
  overflow:hidden;
  margin-top: 0px;
}
/* This one makes the map appear to fade out under the transparent left-pane */
.atlas-gradient {
  left:0px;
  height: 100%;
  width: 100%;
  position:absolute;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0px, rgba(255,255,255,1) 300px);
  bottom: 0px;
  z-index:-100;
  pointer-events:none;
}

#app .right-pane {
  float:left;
  height: 100vh;
  width: 100%;
  left: 0px;
  padding-right:0px;

}

#app .mapview-preview {
  width: 100%;
  overflow:hidden;
 padding-top:20px;
 padding-bottom:35vh !important;
}

#app .image-card {
  width: auto;
  border-radius: 80px;
  margin-right: 30px;
  margin-bottom: 20px;
}

#app .image-card {
  float:left;
  overflow: hidden;
  margin-bottom: 30px;
  width:100%;
  height:auto;
  padding:0px!important;
  transition: all 0.2s ease-in-out;
}

#app .image-container {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  width:100%;
  height:auto;
  padding:0px;
}

#app .image-card:hover {
transform:scale(1.03);
border-radius: 8px;
}

#app .image {
  display: block;
  transform:scale(1.3);
}

#app .place-title {
  width: calc(100% - 25px);
  margin-bottom: - 25px;
  padding-right:10px;
}

.mobile-ui-drag{
display:block;
width:60px;
height:8px;
border-radius:4px;
border-color:grey;
border-width:0.5px 0.5px 0px 0.5px;
border-style:solid;
margin-left:auto;
margin-right:auto;
margin-bottom:5px;
margin-top:3px;
box-shadow: inset 0px 2px 2px 0 rgba(0, 0, 0, 0.2),
    0 0px 0px 0 rgba(0, 0, 0, 0.19);
}

.mobile-ui-drag:hover{
box-shadow: inset 0px 2px 2px 0 rgba(0, 0, 0, 0.3),
    0 0px 0px 0 rgba(0, 0, 0, 0.19);
}

#app .image-container {
  overflow: hidden;
  border-radius:8px !important;
  width: 100% !important;
  height:auto !important;
  margin-left:auto;
  margin-right:auto;
  transition: all 0.2s ease-in-out;
}

#app .image {
  display: block;
  transform:scale(1.1);
}

#app .image-container:hover {
  transform:scale(1.0);
}

#app #footer {
  display:none!important;
}


/* The object viewer */

#app .illustration {
  position:absolute;
  height:50vh !important;
  width: 100%;

}

#app .place-meta-container {
position:absolute;
margin-top:50vh;
height:50vh;
font-size:120%;
width:100%;
padding-right:20px;
padding-bottom:100px !important;
overflow-y:auto;
}

#app .meta-container {
position:absolute;
margin-top:50vh;
height:50vh;
font-size:120%;
width:100%;
padding-right:20px;
padding-bottom:100px !important;
overflow-y:auto;
}

#app .place-metadata {
  float: left;
  width:100%!important;

}

#app .metadata {
  float: left;
  width:100%!important;

}

#app .meta-title {
  width: auto;
}

#app  .back-button {
  margin-top:50vh;
}

#app .place-meta-container .category-button{
  padding:12px 16px;
      background-size: 30px;
      padding-left: 50px;
      background-position: 10px 10px;
}

#app .meta-container .category-button{
  padding:12px 16px;
      background-size: 30px;
      padding-left: 50px;
      background-position: 10px 10px;
}

/* The IIIF-viewer */


#app #ToolbarVertical {
  top: 15px;
}

/* The Map Widgets */

#app .ol-zoom {
  font-size: 22px !important;
  width: 25px;
  height: 25px;
  padding: 0px !important;

}

/* The Gallery */

#app .masonry-wall {
  padding: 0px 0px 270px 0px; 
}
}

@media screen and (max-width: 400px) {
  #app  .left-pane{
    padding: 30px 10px 30px 10px;
  }
  #app  .main-title {
  font-size: 70px !important;
}
#app .sub-title {
  font-size: 50px;
}
}

@media screen and (max-width: 350px) {
 
  #app .main-title {
  font-size: 60px !important;
}
#app .sub-title {
  font-size: 40px;
}
}


</style>
