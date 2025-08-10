import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';

/******************** 1. THREE.JS SCENE ********************/
const scene = new THREE.Scene();
// scene.background = new THREE.Color('#ffffff');
const camera   = new THREE.PerspectiveCamera(75, window.innerWidth/800, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});

document.getElementById('globe-container').appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, 800);


// Camera position
camera.position.z = 5.5;
const targetRotation = {y: 0, x: 0};
// group that holds globe + marker so they can rotate together
const globeGroup = new THREE.Group();
scene.add(globeGroup);

globeGroup.position.y = 0.5; // raise globe a bit above the ground

// Light (not strictly needed for MeshBasicMaterial, but handy if you swap material later)
scene.add(new THREE.DirectionalLight(0xffffff,1).position.set(5,5,5));

/******************** 2. EARTH SPHERE ********************/
const texture = new THREE.TextureLoader().load('img/earth-texture.jpg'); // ensure file exists!
const globe    = new THREE.Mesh(
  new THREE.SphereGeometry(2,64,64),
  new THREE.MeshBasicMaterial({map:texture})
);
globeGroup.add(globe);

// Change globe size based on window width

function changeGlobeSize() {
  const width = window.innerWidth;
  let newRadius;
  if (width < 600) {
    newRadius = 1.5; // smaller radius for mobile
  } else if (width < 1200) {
    newRadius = 1.6; // medium radius for tablets
  } else {
    newRadius = 2; // larger radius for desktops
  }
  const newGeometry = new THREE.SphereGeometry(newRadius, 64, 64);
  globe.geometry.dispose(); // Dispose of the old geometry
  globe.geometry = newGeometry; // Assign the new geometry

}

const input = document.getElementById('location-input');
window.addEventListener('load', () => {
  input.focus();
})

// Initial globe size adjustment based on current window size
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, 800);
  camera.aspect = window.innerWidth / 800;
  camera.updateProjectionMatrix();
  changeGlobeSize(); // Adjust globe size on resize
});
changeGlobeSize(); // Initial call to set globe size based on current window size

/******************** 3. MARKER ********************/
let marker = null;

function addMarker(lat, lon){
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon + 90); // 90 for texture alignment
  const r = 2.05; // slightly above surface
  const x = r*Math.cos(latRad)*Math.sin(lonRad);
  const y = r*Math.sin(latRad);
  const z = r*Math.cos(latRad)*Math.cos(lonRad);
  if(marker) globeGroup.remove(marker);
  

  marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.04,16,16),
    new THREE.MeshStandardMaterial({
    color: 0xffa500,
    emissive: 0xffa500,
    metalness: 1.0,
    roughness: 0.0,
})); 

  
  marker.position.set(x,y,z);
  globeGroup.add(marker);
  
  targetRotation.y = -lonRad;
  targetRotation.x = latRad;
}

/******************** 4. ANIMATION ********************/

let clock = new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);   
  
  if (marker) {
    const scale = 1 + 0.3 * Math.sin(clock.getElapsedTime() * 3);
    marker.scale.set(scale, scale, scale);
  }
  // globeGroup.rotation x and y are Object3D properties
  globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x)*0.02;
  globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y)*0.02;
  renderer.render(scene,camera);
}

animate();

/******************** 5. WEATHER API + UI ********************/
const API_KEY = 'ce6b5716bb1e4928bed73856222303'; // <-- replace
const form  = document.getElementById('weather-form');
const loading = document.getElementById('loading-message');
const card    = document.getElementById('weather-output');
const weatherFormBtn = document.getElementById('weather-form-btn');
const globeWeatherDiv = document.getElementById('globe-weather-div');
const infoIcon = document.getElementById('info-icon');

// UV color

function uvColor(uv) {
  if (uv <= 2) return '#00FF00'; // Low
  if (uv <= 5) return '#FFFF00'; // Moderate
  if (uv >= 7 && uv < 8) return 'rgba(255, 165, 0, 0.5)'; // High
  if (uv <= 8 && uv < 11 ) return '#D94C4C'; // Very High
  if (uv >= 11) return '#6F428B'; // Extreme
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const q = input.value.trim();
  if(!q) return;
  loading.classList.remove('hidden');
  
  try{
    const res = await fetch(`/api/weather?q=${encodeURIComponent(q)}`);
    if(!res.ok) throw new Error('Location not found! Please try again.');
    const data = await res.json();
    console.log(data);

    input.value = ''; // Clear input after submission

    // UI update

    const localTime = data.location.localtime.split(' ')[1];
    const localHour = parseInt(localTime.split(':')[0]);
    

    function setTimeOfDayClass(className) {
      // Remove all time-of-day classes
      document.body.classList.remove('morning', 'day', 'evening', 'night');

      // Force re-trigger of the fade-reset animation
      void document.body.offsetWidth;

      document.body.classList.add(className);
    }

    // Determine time of day and update styles
    if (localHour >= 6 && localHour < 12) {
      setTimeOfDayClass('morning');
      card.style.color = '#333';
      input.classList.remove('input-night');
      input.style.color = '#333';
      input.style.setProperty("--somecolor", '#333');
      weatherFormBtn.classList.add('weather-form-btn-day');
      weatherFormBtn.classList.remove('weather-form-btn-night');
      weatherFormBtn.style.color = '#333';
      globeWeatherDiv.style.color = '#333';
      infoIcon.style.color = '#333';
    }
    else if(localHour >= 12 && localHour < 18) {
      setTimeOfDayClass('day');
      card.style.color = '#333';
      input.classList.remove('input-night');
      input.style.color = '#333';
      input.style.setProperty("--somecolor", '#333');
      weatherFormBtn.classList.add('weather-form-btn-day');
      weatherFormBtn.classList.remove('weather-form-btn-night');
      weatherFormBtn.style.color = '#333';
      globeWeatherDiv.style.color = '#333';
      infoIcon.style.color = '#333';
    }
    else if(localHour >= 18 && localHour < 23) {
      setTimeOfDayClass('evening');
      card.style.color = '#333';
      input.classList.remove('input-night');
      input.style.color = '#333';
      input.style.setProperty("--somecolor", '#333');
      weatherFormBtn.classList.add('weather-form-btn-day');
      weatherFormBtn.classList.remove('weather-form-btn-night');
      weatherFormBtn.style.color = '#333';
      globeWeatherDiv.style.color = '#333';
      infoIcon.style.color = '#333';
    }
    else if(localHour >= 23 || localHour < 6) {
      setTimeOfDayClass('night');
      card.style.color = '#fff';
      input.classList.add('input-night');
      input.style.color = '#fff';
      input.style.setProperty("--somecolor", '#fff');
      weatherFormBtn.classList.remove('weather-form-btn-day');
      weatherFormBtn.classList.add('weather-form-btn-night');
      weatherFormBtn.style.color = '#fff';
      globeWeatherDiv.style.color = '#fff';
      infoIcon.style.color = '#fff';
    }

    // Location info
    document.getElementById('region-line').textContent   = `${data.location.name}, ${data.location.region}`;
    document.getElementById('country-line').textContent  = data.location.country;
  
    // Main info
    document.getElementById('local-time').textContent    = `${localTime}`;
    document.getElementById('weather-icon').src          = `https:${data.current.condition.icon}`;
    document.getElementById('temperature').innerHTML   = `${Math.round(data.current.temp_c)}<span class="temp-unit">°C</span>`;
    document.getElementById('condition').textContent     = data.current.condition.text;
    document.getElementById('feels-like').textContent    = `Feels like ${Math.round(data.current.feelslike_c)} °C`;

    // Other info
    document.getElementById('wind').textContent          = `${Math.round(data.current.wind_kph/3.6)} m/s`;
    document.getElementById('humidity').textContent      = `${data.current.humidity} %`;
    document.getElementById('visibility').textContent    = `${data.current.vis_km} km`;
    document.getElementById('pressure').textContent      = `${data.current.pressure_mb} mb`;
    document.getElementById('dew-point').textContent     = `${data.current.dewpoint_c} °C`;
    document.getElementById('uv').textContent            = data.current.uv;

    // UV index pulses, if high
     uv.style.backgroundColor = uvColor(data.current.uv);
    
  if (data.current.uv >= 7 && data.current.uv < 8) {
  uv.classList.add('pulse-uv-orange')
} else {
  uv.classList.remove('pulse-uv-orange');
}

 if (data.current.uv >= 8 && data.current.uv < 11) {
  uv.classList.add('pulse-uv-red')
} else {
  uv.classList.remove('pulse-uv-red');
}

 if (data.current.uv >= 11) {
  uv.classList.add('pulse-uv-extreme')
} else {
  uv.classList.remove('pulse-uv-extreme');
}

    card.classList.remove('hidden');
    loading.classList.add('hidden');

    // Globe update

    addMarker(data.location.lat, data.location.lon);
    
    

  }catch(err){
    alert(err.message);
    loading.classList.add('hidden');
  }

});

// Info modal
    const infoButton = document.getElementById('info-icon');
    const infoModal = document.getElementById('info-modal');
    const closeButton = document.getElementById('close-info-btn');

    infoButton.addEventListener('click', () => {
      infoModal.classList.remove('hidden');
      console.log('Info modal opened');
    });

    closeButton.addEventListener('click', () => {
      infoModal.classList.add('hidden');
      console.log('Info modal closed');
    });





