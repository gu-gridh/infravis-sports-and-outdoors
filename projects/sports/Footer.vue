<template>
    <footer id="footer">
      <div id="developer-info">
        <div class="links-stack border-style">
          <a class="site-link link" href="https://github.com/gu-gridh/infravis-sports-and-outdoors" target="_blank">GitHub repository and development</a>
        </div>
        <div class="links-stack">
        <a class="site-link link" href="https://mistra.org/" target="_blank">Data repository</a>
      </div>
      </div>
      <div class="partners">
  
        <a href=" https://research.chalmers.se/project/12213">
          <div class="PartnerLogo" id=""><img src="/chalmersLogo.png" class="chalmers"/></div>
        </a>
  
        <a href="https://infravis.se">
          <div class="PartnerLogo" id=""><img src="/infravisLogo.png" class="infravis"/></div>
        </a>
    </div>
    </footer>
  </template>
  
  <script setup>
  </script>
  
  <style>
  #footer {
    display:block;
    background-color: #222;
    color: white;
    line-height: 1;
    height: 65px;
    width: calc(100% + 2px);
    font-size: 12px;
    position: absolute;
    z-index: 3000;
    bottom: -2px;;
    font-family: "Barlow Condensed", sans-serif;
  }
  
  a {
    font-weight: bold;
  }
  
  .partners {
      float: right;
      position: fixed;
  
      bottom: 0px;
      right: 0px;
      height: 80px;
    }
  
    .GRIDHLogo {
      float: right;
      margin-top: 27px;
      width: auto;
      height: auto;
      text-align: left;
      font-weight: 100;
      font-style: normal;
      font-size: 30px;
      line-height: 0.8;
      padding: 0px 50px 5px 30px;
      vertical-align: middle;
    }
  
    .PartnerLogo {
      float: right;
      margin-top: 27px;
      width: auto;
      height: auto;
      text-align: left;
      font-weight: 100;
      font-style: normal;
      font-size: 30px;
      line-height: 0.8;
      padding: 0px 30px 5px 30px;
      vertical-align: middle;
      border-width: 0px 0.5px 0px 0px;
      border-color: white;
      border-style: solid;
    }
  
  #developer-info {
    display: flex; 
    align-items: flex-end; 
    margin-left: 50px;
    margin-top: 15px;
    font-size: 1.5em;
    line-height: 1.4;
    font-weight: 200;
  }
  
  .border-style {
    border-width: 0 0.5px 0 0px;
    border-color: white;
    border-style: dashed;
    padding-left: 10px; 
    padding-right: 20px; 
  
  }
  
  .link{
  color:white;
  }
  
  .link:visited{
  color:white;
  }
  
  .link:hover{
  opacity:0.8;
  }
  
  .download-link{
    background:url("@/assets/interface/downloadbuttonwhite.png");
    background-size:18px;
    background-position:0px 50%;
    background-repeat:no-repeat;
    padding-left:25px;
    margin-left:0px;
  }
  
  .site-link{
    background:url("@/assets/interface/linkbuttonwhite.png");
    background-size:18px;
    background-position:0px 50%;
    background-repeat:no-repeat;
    padding-left:25px;
  
  }
  
  .links-stack {
    margin-right: 20px; 
  }
  
  .links-stack a {
    display: block;
  }
  
  #developer-info a:link{
    font-weight:200;
  }

  .chalmers {
    width: 150px;
    height: auto;
  }

  .infravis {
    width: 80px;
    height: auto;
  }
  
  </style>
  