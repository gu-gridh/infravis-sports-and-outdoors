<template>
    <div class="landing-page">
  <h1>Sport and Outdoors Sustainable Accessibility Map </h1>  
  <h2>Explore Sustainable Accessibility Across Sweden with Our Interactive Map </h2>
  <div class="text">
    <p>Welcome to the Sport and Outdoors Sustainable Accessibility Map - an innovative tool designed to explore, help understand and improve sustainable accessibility to sports and outdoor activities throughout Sweden. This tool offers an intuitive interactive map that visualizes accessibility at national and municipal scales, empowering individuals, policymakers, and organizations to make informed decisions.</p>
    <p>With this tool you can visualize how the population can access different sports and outdoors activities using different transport modes, including walking, cycling, driving and by public transport. </p>
    <ul>
        <li>How long does one need to walk to the nearest football pitch?</li>
        <li>Which locations can reach a swimming pool on a Saturday by public transport?</li>
        <li>How many people in the municipality have access to outdoors for walking and running within 15 minutes?</li>
        <li>How does access to sport by sustainable travel modes compare to using the car?</li>
    </ul>
    <p>Explore the map and learn about the landscape of sustainable accessibility to sport and outdoors across Sweden. </p>
  </div>
  <button @click="$emit('close')" class="btn">Explore the map</button>
  <div class="disclaimer">
    <p>Disclaimer: This map uses data from SCB, Trafiklab and OpenStreetMap. It might not reflect the complete and latest street network, public transport, or sport and outdoors destinations in Sweden. </p>
  </div>
  
  </div>
</template>

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
  height: calc(100vh-65px);
  width: 80%;
  color: #333;
  text-align: center;
}

.text {
    flex-direction: column;
    columns: 2;
  max-width: 800px;
  margin: 20px auto;
  font-size: 18px;
  line-height: 1.6;
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
</style>