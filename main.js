import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

// ----- Scene Setup -----
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 20, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// ----- Lights -----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 3, 500);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// ----- Sun -----
const sunGeometry = new THREE.SphereGeometry(2, 64, 64);
const sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xffff00,
  emissive: 0xffff00,
  emissiveIntensity: 2,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// ----- Stars Background -----
const starCount = 1000;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 600;
}
const starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// ----- Planet Class -----
class Planet {
  constructor(name, radius, color, selfSpeed, orbitSpeed, orbitRadius) {
    this.name = name;
    this.selfSpeed = selfSpeed;
    this.orbitSpeed = orbitSpeed;
    this.orbitRadius = orbitRadius;
    this.angle = Math.random() * Math.PI * 2;

    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 64),
      new THREE.MeshStandardMaterial({ color })
    );
    this.mesh.position.set(orbitRadius, 0, 0);
    this.mesh.name = name;
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }

  update() {
    this.angle += this.orbitSpeed;
    this.mesh.position.x = Math.cos(this.angle) * this.orbitRadius;
    this.mesh.position.z = Math.sin(this.angle) * this.orbitRadius;
    this.mesh.rotation.y += this.selfSpeed;
  }
}

// ----- Planets Data -----
const planetsData = [
  { name: 'Mercury', radius: 0.38, color: 0x909090, selfSpeed: 0.02, orbitSpeed: 0.04, orbitRadius: 5 },
  { name: 'Venus', radius: 0.95, color: 0xe5c16c, selfSpeed: 0.005, orbitSpeed: 0.015, orbitRadius: 8 },
  { name: 'Earth', radius: 1, color: 0x2a5caa, selfSpeed: 0.03, orbitSpeed: 0.01, orbitRadius: 11 },
  { name: 'Mars', radius: 0.53, color: 0xb22222, selfSpeed: 0.028, orbitSpeed: 0.008, orbitRadius: 14 },
  { name: 'Jupiter', radius: 1.5, color: 0xd2b48c, selfSpeed: 0.05, orbitSpeed: 0.002, orbitRadius: 20 },
  { name: 'Saturn', radius: 1.3, color: 0xf5deb3, selfSpeed: 0.045, orbitSpeed: 0.0018, orbitRadius: 25 },
  { name: 'Uranus', radius: 1.1, color: 0xadd8e6, selfSpeed: 0.02, orbitSpeed: 0.001, orbitRadius: 30 },
  { name: 'Neptune', radius: 1.05, color: 0x4169e1, selfSpeed: 0.018, orbitSpeed: 0.0009, orbitRadius: 35 },
];

// ----- Create Planets -----
const planets = planetsData.map(data => {
  const p = new Planet(
    data.name,
    data.radius,
    data.color,
    data.selfSpeed,
    data.orbitSpeed,
    data.orbitRadius
  );
  const label = createLabel(data.name);
  label.position.set(0, data.radius + 1.5, 0); // Position above planet
  p.mesh.add(label); // Attach to planet so it moves with it

  p.addToScene(scene);
  return p;
});

function createLabel(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;

  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.font = '64px Arial'; // Large and visible text
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(name, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(10, 2.5, 1); // Adjust this size based on distance from camera

  return sprite;
}



// ----- Draw Orbit Rings -----
planetsData.forEach(planet => {
  const segments = 64;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    points.push(new THREE.Vector3(
      Math.cos(theta) * planet.orbitRadius,
      0,
      Math.sin(theta) * planet.orbitRadius
    ));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.LineLoop(geometry, material);
  scene.add(ring);
});

// ----- UI: Orbit Speed Sliders -----
const sliderContainer = document.getElementById('sliders');
planetsData.forEach((planet, i) => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${planet.name}</td>
    <td>
      <input type="range" min="0" max="0.1" step="0.001" value="${planet.orbitSpeed}" data-index="${i}" />
    </td>
  `;
  sliderContainer.appendChild(row);
});

sliderContainer.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener('input', e => {
    const index = e.target.getAttribute('data-index');
    planets[index].orbitSpeed = parseFloat(e.target.value);
  });
});

// ----- Pause/Resume Button -----
let isPaused = false;
const pauseBtn = document.getElementById('pauseBtn');
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume Animation" : "Pause Animation";
});

// ----- Tooltip -----
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

window.addEventListener('mousemove', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
  
  if (intersects.length > 0) {
    tooltip.style.display = 'block';
    tooltip.style.left = event.clientX + 10 + 'px';
    tooltip.style.top = event.clientY + 10 + 'px';
    tooltip.textContent = intersects[0].object.name;
  } else {
    tooltip.style.display = 'none';
  }
});

// ----- Basic Camera Controls (Drag + Zoom) -----
let isDragging = false;
let previousMouse = { x: 0, y: 0 };

renderer.domElement.addEventListener('mousedown', () => (isDragging = true));
renderer.domElement.addEventListener('mouseup', () => (isDragging = false));
renderer.domElement.addEventListener('mousemove', e => {
  if (isDragging) {
    const deltaX = e.offsetX - previousMouse.x;
    const deltaY = e.offsetY - previousMouse.y;

    const rotX = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(toRadians(deltaY * 0.2), 0, 0, 'XYZ')
    );
    const rotY = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, toRadians(deltaX * 0.2), 0, 'XYZ')
    );

    camera.quaternion.multiplyQuaternions(rotY, camera.quaternion);
    camera.quaternion.multiplyQuaternions(rotX, camera.quaternion);
  }
  previousMouse = { x: e.offsetX, y: e.offsetY };
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault(); // Prevent page scrolling

  camera.position.z += e.deltaY * 0.01;

}, { passive: false });


function toRadians(deg) {
  return deg * (Math.PI / 180);
}

// ----- Resize Handling -----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----- Animation Loop -----
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    planets.forEach(planet => planet.update());
  }
  renderer.render(scene, camera);
}

animate();
