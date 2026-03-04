import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/examples/jsm/controls/OrbitControls.js';

const root = document.getElementById('sim3d');

const controlsUI = {
  speed: document.getElementById('speed'),
  stride: document.getElementById('stride'),
  lift: document.getElementById('lift'),
  bodyHeight: document.getElementById('bodyHeight'),
  terrain: document.getElementById('terrain'),
  cameraYaw: document.getElementById('cameraYaw'),
  cameraTilt: document.getElementById('cameraTilt'),
  cameraZoom: document.getElementById('cameraZoom'),
};

const values = {
  speedVal: document.getElementById('speedVal'),
  strideVal: document.getElementById('strideVal'),
  liftVal: document.getElementById('liftVal'),
  bodyHeightVal: document.getElementById('bodyHeightVal'),
  terrainVal: document.getElementById('terrainVal'),
  cameraYawVal: document.getElementById('cameraYawVal'),
  cameraTiltVal: document.getElementById('cameraTiltVal'),
  cameraZoomVal: document.getElementById('cameraZoomVal'),
};

const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const randomBtn = document.getElementById('randomBtn');

const sim = { t: 0, paused: false, worldOffset: 0 };

const defaults = {
  speed: 1.1,
  stride: 0.65,
  lift: 0.36,
  bodyHeight: 1.05,
  terrain: 0.3,
  cameraYaw: 35,
  cameraTilt: 63,
  cameraZoom: 8.5,
};

function state() {
  return {
    speed: +controlsUI.speed.value,
    stride: +controlsUI.stride.value,
    lift: +controlsUI.lift.value,
    bodyHeight: +controlsUI.bodyHeight.value,
    terrain: +controlsUI.terrain.value,
    cameraYaw: +controlsUI.cameraYaw.value,
    cameraTilt: +controlsUI.cameraTilt.value,
    cameraZoom: +controlsUI.cameraZoom.value,
  };
}

function syncLabels() {
  const s = state();
  values.speedVal.textContent = s.speed.toFixed(2);
  values.strideVal.textContent = s.stride.toFixed(2);
  values.liftVal.textContent = s.lift.toFixed(2);
  values.bodyHeightVal.textContent = s.bodyHeight.toFixed(2);
  values.terrainVal.textContent = s.terrain.toFixed(2);
  values.cameraYawVal.textContent = Math.round(s.cameraYaw).toString();
  values.cameraTiltVal.textContent = Math.round(s.cameraTilt).toString();
  values.cameraZoomVal.textContent = s.cameraZoom.toFixed(1);
}
Object.values(controlsUI).forEach((el) => el.addEventListener('input', syncLabels));
syncLabels();

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a111d');
scene.fog = new THREE.Fog('#0a111d', 10, 28);

const camera = new THREE.PerspectiveCamera(50, root.clientWidth / root.clientHeight, 0.1, 100);
camera.position.set(6, 4.2, 6.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(root.clientWidth, root.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
root.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1.0, 0);

scene.add(new THREE.HemisphereLight('#9ec5ff', '#182028', 0.55));
const key = new THREE.DirectionalLight('#cfe2ff', 1.0);
key.position.set(5, 8, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
scene.add(key);

const fill = new THREE.PointLight('#87d8ff', 0.8, 20);
fill.position.set(-4, 2, -3);
scene.add(fill);

const rim = new THREE.DirectionalLight('#8ab6ff', 0.6);
rim.position.set(-6, 5, -4);
scene.add(rim);

const groundGeo = new THREE.PlaneGeometry(24, 24, 120, 120);
const groundMat = new THREE.MeshStandardMaterial({ color: '#1a2533', roughness: 0.95, metalness: 0.02 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const contactShadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.8, 40),
  new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22 })
);
contactShadow.rotation.x = -Math.PI / 2;
contactShadow.position.y = 0.03;
scene.add(contactShadow);

const spider = new THREE.Group();
scene.add(spider);

const bodyMat = new THREE.MeshStandardMaterial({ color: '#343b45', roughness: 0.48, metalness: 0.58 });
const accentMat = new THREE.MeshStandardMaterial({ color: '#8ea3bf', roughness: 0.35, metalness: 0.7 });

const thorax = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 1.9, 10, 18), bodyMat);
thorax.castShadow = true;
thorax.rotation.z = Math.PI / 2;
spider.add(thorax);

const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 18), bodyMat);
abdomen.position.set(-1.05, 0, 0);
abdomen.scale.set(1.3, 0.95, 1.08);
abdomen.castShadow = true;
spider.add(abdomen);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), bodyMat);
head.position.set(1.18, 0.04, 0);
head.castShadow = true;
spider.add(head);

const eyeGeo = new THREE.SphereGeometry(0.09, 14, 14);
const eyeMat = new THREE.MeshStandardMaterial({ color: '#66c9ff', emissive: '#114460', emissiveIntensity: 1.1, metalness: 0.2, roughness: 0.15 });
for (let i = 0; i < 4; i++) {
  const e = new THREE.Mesh(eyeGeo, eyeMat);
  e.position.set(1.42, 0.12 + (i % 2) * 0.08, (i < 2 ? -1 : 1) * 0.14 + (i % 2) * 0.05);
  spider.add(e);
}

const dorsalPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 1.8, 16), accentMat);
dorsalPlate.rotation.z = Math.PI / 2;
dorsalPlate.position.set(-0.08, 0.34, 0);
dorsalPlate.castShadow = true;
spider.add(dorsalPlate);

for (let i = 0; i < 4; i++) {
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.24 + i * 0.06, 0.018, 12, 24),
    new THREE.MeshStandardMaterial({ color: '#aebcd0', metalness: 0.78, roughness: 0.22 })
  );
  stripe.rotation.x = Math.PI / 2;
  stripe.position.set(-0.7 - i * 0.18, 0.2 - i * 0.01, 0);
  stripe.castShadow = true;
  spider.add(stripe);
}

const mandibleMat = new THREE.MeshStandardMaterial({ color: '#9fb3cc', metalness: 0.75, roughness: 0.25 });
for (const side of [-1, 1]) {
  const fang = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.34, 10), mandibleMat);
  fang.position.set(1.48, -0.12, side * 0.12);
  fang.rotation.z = side * 0.18;
  fang.rotation.x = Math.PI;
  fang.castShadow = true;
  spider.add(fang);
}

function terrainHeight(x, z, roughness) {
  return (
    Math.sin(x * 0.9) * 0.12 * roughness +
    Math.cos(z * 1.4) * 0.08 * roughness +
    Math.sin((x + z) * 2.5) * 0.03 * roughness
  );
}

function updateGround(roughness) {
  const pos = ground.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const h = terrainHeight(x + sim.worldOffset * 0.1, z, roughness);
    pos.setZ(i, h);
  }
  pos.needsUpdate = true;
  ground.geometry.computeVertexNormals();
}

const legMaterial = new THREE.MeshStandardMaterial({ color: '#8c97a6', roughness: 0.3, metalness: 0.75 });
const jointMaterial = new THREE.MeshStandardMaterial({ color: '#b3c3d8', roughness: 0.28, metalness: 0.82 });

const legData = [];
const legCountPerSide = 4;

function createLeg(side, index) {
  const base = new THREE.Group();
  base.position.set(-0.75 + index * 0.5, -0.05 + index * 0.03, side * 0.43);
  spider.add(base);

  const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12), legMaterial);
  coxa.rotation.z = Math.PI / 2;
  coxa.castShadow = true;
  base.add(coxa);

  const femurPivot = new THREE.Group();
  femurPivot.position.set(side * 0.16, 0, 0);
  base.add(femurPivot);

  const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.72, 12), legMaterial);
  femur.position.y = -0.36;
  femur.castShadow = true;
  femurPivot.add(femur);

  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), jointMaterial);
  knee.position.y = -0.72;
  femurPivot.add(knee);

  const tibiaPivot = new THREE.Group();
  tibiaPivot.position.y = -0.72;
  femurPivot.add(tibiaPivot);

  const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.85, 12), legMaterial);
  tibia.position.y = -0.42;
  tibia.castShadow = true;
  tibiaPivot.add(tibia);

  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), jointMaterial);
  foot.position.y = -0.85;
  tibiaPivot.add(foot);

  return { side, index, base, femurPivot, tibiaPivot, foot };
}

for (let i = 0; i < legCountPerSide; i++) {
  legData.push(createLeg(1, i));
  legData.push(createLeg(-1, i));
}

const bodyBobPivot = new THREE.Group();
scene.add(bodyBobPivot);
bodyBobPivot.add(spider);

function updateLegs(s) {
  const speed = s.speed;
  const stride = s.stride;
  const lift = s.lift;

  for (const leg of legData) {
    const phaseOffset = leg.index * 0.8 + (leg.side < 0 ? Math.PI : 0);
    const cycle = sim.t * speed * 3.0 + phaseOffset;
    const swing = Math.sin(cycle);
    const swing01 = (swing + 1) * 0.5;
    const stepLift = Math.max(0, Math.cos(cycle));

    leg.base.rotation.y = leg.side * (0.35 + swing * 0.35 * stride);
    leg.base.rotation.z = leg.side * (0.2 + swing * 0.18 * stride);

    leg.femurPivot.rotation.z = -0.55 - swing01 * 0.65 - stepLift * lift * 0.6;
    leg.femurPivot.rotation.x = leg.side * (0.15 + swing * 0.2);

    leg.tibiaPivot.rotation.z = 1.05 + swing01 * 0.85 + stepLift * lift;

    const worldFoot = new THREE.Vector3();
    leg.foot.getWorldPosition(worldFoot);
    const groundY = terrainHeight(worldFoot.x + sim.worldOffset * 0.2, worldFoot.z, s.terrain);
    if (worldFoot.y < groundY + 0.02) {
      leg.tibiaPivot.rotation.z -= (groundY + 0.02 - worldFoot.y) * 1.35;
    }
  }
}

function updateCameraFromUI(s) {
  const yaw = THREE.MathUtils.degToRad(s.cameraYaw);
  const tilt = THREE.MathUtils.degToRad(s.cameraTilt);
  const dist = s.cameraZoom;
  const target = orbit.target;
  const horizontal = Math.cos(tilt) * dist;
  camera.position.x = target.x + Math.cos(yaw) * horizontal;
  camera.position.z = target.z + Math.sin(yaw) * horizontal;
  camera.position.y = target.y + Math.sin(tilt) * dist;
}

function animate() {
  const s = state();
  if (!sim.paused) {
    sim.t += 0.016;
    sim.worldOffset += s.speed * s.stride * 0.015;
  }

  updateGround(s.terrain);
  updateLegs(s);

  bodyBobPivot.position.y = s.bodyHeight + Math.sin(sim.t * s.speed * 5.5) * 0.08;
  bodyBobPivot.rotation.y = Math.sin(sim.t * s.speed * 2.2) * 0.05;
  spider.rotation.x = Math.sin(sim.t * s.speed * 5.5) * 0.03;

  contactShadow.position.x = bodyBobPivot.position.x;
  contactShadow.position.z = bodyBobPivot.position.z;
  const shadowScale = 1.0 + (1.4 - s.bodyHeight) * 0.25;
  contactShadow.scale.setScalar(Math.max(0.75, Math.min(1.2, shadowScale)));

  updateCameraFromUI(s);
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

pauseBtn.addEventListener('click', () => {
  sim.paused = !sim.paused;
  pauseBtn.textContent = sim.paused ? 'Resume' : 'Pause';
});

function resetAll() {
  for (const [k, v] of Object.entries(defaults)) controlsUI[k].value = String(v);
  sim.t = 0;
  sim.worldOffset = 0;
  sim.paused = false;
  pauseBtn.textContent = 'Pause';
  syncLabels();
}

resetBtn.addEventListener('click', resetAll);

randomBtn.addEventListener('click', () => {
  controlsUI.speed.value = (Math.random() * 2.3 + 0.5).toFixed(2);
  controlsUI.stride.value = (Math.random() * 0.8 + 0.25).toFixed(2);
  controlsUI.lift.value = (Math.random() * 0.6 + 0.12).toFixed(2);
  controlsUI.bodyHeight.value = (Math.random() * 0.8 + 0.7).toFixed(2);
  controlsUI.terrain.value = (Math.random() * 0.9).toFixed(2);
  controlsUI.cameraYaw.value = Math.floor(Math.random() * 360 - 180);
  controlsUI.cameraTilt.value = Math.floor(Math.random() * 45 + 38);
  controlsUI.cameraZoom.value = (Math.random() * 6 + 6).toFixed(1);
  syncLabels();
});

window.addEventListener('resize', () => {
  camera.aspect = root.clientWidth / root.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(root.clientWidth, root.clientHeight);
});
