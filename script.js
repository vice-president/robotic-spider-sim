const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const controls = {
  speed: document.getElementById('speed'),
  stride: document.getElementById('stride'),
  lift: document.getElementById('lift'),
  legs: document.getElementById('legs'),
  bodyBob: document.getElementById('bodyBob'),
  hue: document.getElementById('hue'),
  direction: document.getElementById('direction'),
  zoom: document.getElementById('zoom'),
  terrain: document.getElementById('terrain'),
};

const values = {
  speedVal: document.getElementById('speedVal'),
  strideVal: document.getElementById('strideVal'),
  liftVal: document.getElementById('liftVal'),
  legsVal: document.getElementById('legsVal'),
  bodyBobVal: document.getElementById('bodyBobVal'),
  hueVal: document.getElementById('hueVal'),
  directionVal: document.getElementById('directionVal'),
  zoomVal: document.getElementById('zoomVal'),
};

const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const randomBtn = document.getElementById('randomBtn');

const sim = {
  t: 0,
  paused: false,
  bodyX: canvas.width * 0.5,
  bodyY: canvas.height * 0.56,
  bodyW: 240,
  bodyH: 70,
  worldOffset: 0,
};

function getState() {
  return {
    speed: +controls.speed.value,
    stride: +controls.stride.value,
    lift: +controls.lift.value,
    legPairs: +controls.legs.value,
    bodyBob: +controls.bodyBob.value,
    hue: +controls.hue.value,
    direction: +controls.direction.value,
    zoom: +controls.zoom.value,
    terrain: controls.terrain.value,
  };
}

function syncLabels() {
  const s = getState();
  values.speedVal.textContent = s.speed.toFixed(2);
  values.strideVal.textContent = s.stride.toFixed(0);
  values.liftVal.textContent = s.lift.toFixed(0);
  values.legsVal.textContent = s.legPairs;
  values.bodyBobVal.textContent = s.bodyBob.toFixed(2);
  values.hueVal.textContent = s.hue;
  values.directionVal.textContent = s.direction.toString();
  values.zoomVal.textContent = s.zoom.toFixed(2);
}

Object.values(controls).forEach((el) => el.addEventListener('input', syncLabels));
syncLabels();

function terrainHeight(x, terrain) {
  if (terrain === 'flat') return 0;
  if (terrain === 'wavy') return Math.sin(x * 0.015) * 12 + Math.cos(x * 0.03) * 7;
  return (
    Math.sin(x * 0.032) * 8 +
    Math.sin(x * 0.089) * 5 +
    (Math.floor((x % 120) / 40) - 1) * 4
  );
}

function legKinematics(anchorX, anchorY, side, phase, s, directionSign) {
  const cycle = sim.t * s.speed * 3 + phase;
  const swing = Math.sin(cycle);
  const lift = Math.max(0, Math.cos(cycle));

  const targetX = anchorX + side * (40 + s.stride * swing * directionSign);
  const footGround = terrainHeight(targetX + sim.worldOffset, s.terrain);
  const targetY = anchorY + 90 + footGround - s.lift * lift;

  const hip = { x: anchorX + side * 16, y: anchorY + 6 };
  const knee = {
    x: hip.x + side * (24 + s.stride * 0.25 * swing * directionSign),
    y: hip.y + 35 + s.lift * 0.18 * lift,
  };

  return { hip, knee, foot: { x: targetX, y: targetY } };
}

function drawLeg(leg, hue) {
  ctx.lineCap = 'round';

  ctx.strokeStyle = `hsl(${hue}, 70%, 70%)`;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(leg.hip.x, leg.hip.y);
  ctx.lineTo(leg.knee.x, leg.knee.y);
  ctx.stroke();

  ctx.strokeStyle = `hsl(${hue}, 85%, 62%)`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(leg.knee.x, leg.knee.y);
  ctx.lineTo(leg.foot.x, leg.foot.y);
  ctx.stroke();

  ctx.fillStyle = `hsl(${hue}, 90%, 72%)`;
  ctx.beginPath();
  ctx.arc(leg.foot.x, leg.foot.y, 4.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(s) {
  const y0 = canvas.height * 0.74;
  const step = 10;

  ctx.strokeStyle = 'rgba(120, 160, 220, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += step) {
    const y = y0 + terrainHeight(x + sim.worldOffset, s.terrain);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (let i = 0; i < 30; i++) {
    const x = (i / 30) * canvas.width;
    const y = y0 + terrainHeight(x + sim.worldOffset, s.terrain);
    const h = 4 + (i % 3) * 2;
    ctx.strokeStyle = 'rgba(140, 180, 230, 0.16)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y + h);
    ctx.stroke();
  }
}

function drawBody(s, directionSign) {
  const bob = Math.sin(sim.t * s.speed * 6) * (s.bodyBob * 12);
  const bx = sim.bodyX;
  const by = sim.bodyY + bob;

  const gradient = ctx.createLinearGradient(bx - 120, by - 20, bx + 130, by + 35);
  gradient.addColorStop(0, `hsl(${s.hue}, 42%, 36%)`);
  gradient.addColorStop(1, `hsl(${(s.hue + 35) % 360}, 60%, 25%)`);

  ctx.fillStyle = gradient;
  ctx.strokeStyle = `hsla(${s.hue}, 80%, 75%, 0.8)`;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(bx - sim.bodyW / 2, by - sim.bodyH / 2, sim.bodyW, sim.bodyH, 24);
  ctx.fill();
  ctx.stroke();

  const eyeX = bx + directionSign * 78;
  ctx.fillStyle = `hsla(${s.hue}, 90%, 80%, 0.9)`;
  ctx.beginPath();
  ctx.arc(eyeX, by - 8, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#07101c';
  ctx.beginPath();
  ctx.arc(eyeX + directionSign * 2, by - 8, 3, 0, Math.PI * 2);
  ctx.fill();

  return { bx, by };
}

function render() {
  const s = getState();
  const directionSign = s.direction === 0 ? 1 : s.direction;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width * (1 - s.zoom) * 0.5, canvas.height * (1 - s.zoom) * 0.55);
  ctx.scale(s.zoom, s.zoom);

  drawGround(s);
  const { bx, by } = drawBody(s, directionSign);

  const pairCount = s.legPairs;
  const spacing = sim.bodyW / (pairCount + 0.8);

  for (let i = 0; i < pairCount; i++) {
    const anchorX = bx - sim.bodyW / 2 + spacing * (i + 1);
    const anchorY = by + 4;
    const phase = i * 0.95;

    const leftLeg = legKinematics(anchorX, anchorY, -1, phase, s, directionSign);
    const rightLeg = legKinematics(anchorX, anchorY, 1, phase + Math.PI, s, directionSign);

    drawLeg(leftLeg, (s.hue + i * 14) % 360);
    drawLeg(rightLeg, (s.hue + i * 14) % 360);

    ctx.fillStyle = `hsl(${s.hue}, 65%, 76%)`;
    ctx.beginPath();
    ctx.arc(anchorX - 11, anchorY + 8, 3.5, 0, Math.PI * 2);
    ctx.arc(anchorX + 11, anchorY + 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (!sim.paused) {
    sim.t += 0.016;
    sim.worldOffset += s.speed * s.stride * 0.09 * directionSign;
  }

  requestAnimationFrame(render);
}

pauseBtn.addEventListener('click', () => {
  sim.paused = !sim.paused;
  pauseBtn.textContent = sim.paused ? 'Resume' : 'Pause';
});

resetBtn.addEventListener('click', () => {
  controls.speed.value = 1.2;
  controls.stride.value = 42;
  controls.lift.value = 30;
  controls.legs.value = 4;
  controls.bodyBob.value = 0.45;
  controls.hue.value = 180;
  controls.direction.value = 1;
  controls.zoom.value = 1;
  controls.terrain.value = 'flat';
  sim.t = 0;
  sim.worldOffset = 0;
  sim.paused = false;
  pauseBtn.textContent = 'Pause';
  syncLabels();
});

randomBtn.addEventListener('click', () => {
  controls.speed.value = (Math.random() * 2.8 + 0.3).toFixed(2);
  controls.stride.value = Math.floor(Math.random() * 65 + 20);
  controls.lift.value = Math.floor(Math.random() * 45 + 12);
  controls.legs.value = Math.floor(Math.random() * 4 + 3);
  controls.bodyBob.value = (Math.random() * 0.95).toFixed(2);
  controls.hue.value = Math.floor(Math.random() * 361);
  controls.direction.value = [-1, 0, 1][Math.floor(Math.random() * 3)];
  controls.zoom.value = (Math.random() * 0.7 + 0.75).toFixed(2);
  controls.terrain.value = ['flat', 'wavy', 'rocky'][Math.floor(Math.random() * 3)];
  syncLabels();
});

render();
