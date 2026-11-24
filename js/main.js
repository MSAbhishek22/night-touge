// Night Touge — main. State machine, player physics, camera, input,
// scoring, and the frame loop. States: menu → playing ⇄ paused,
// playing → crashing → over → playing (restart).

import * as THREE from 'three';
import { createWorld } from './world.js';
import { buildCar } from './car.js';
import { createTraffic } from './traffic.js';
import { createAudio } from './audio.js';
import { createUI } from './ui.js';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const BEST_KEY = 'nightTougeBest';
const EFFECTS_KEY = 'nightTougeEffects';

// ---------- Renderer / scene / camera ----------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1200);

const world = createWorld(scene);
const traffic = createTraffic(scene);
const audio = createAudio();
const ui = createUI();

// ---------- Player car ----------
const playerCar = buildCar({ color: 0xd1601a, isPlayer: true });
scene.add(playerCar);
const headlight = new THREE.SpotLight(0xffe2b0, 680, 85, 0.58, 0.65, 1.3);
headlight.position.set(0, 0.85, -2.0);
const headlightTarget = new THREE.Object3D();
headlightTarget.position.set(0, 0.1, -32);
playerCar.add(headlightTarget);
headlight.target = headlightTarget;
playerCar.add(headlight);

// ---------- Game state ----------
let state = 'menu';
let travelled = 0;
let score = 0;
let distance = 0;
let nearCount = 0;
let combo = 0;
let comboTimer = 0;
let elapsed = 0;
let speed = 0;
let playerX = 2.0;
let latVel = 0;
let prevSpeed = 0;
let accelSmooth = 0;
let crashTimer = 0;
let carSpin = 0;
let best = Number(localStorage.getItem(BEST_KEY) || 0);
let effectsHigh = localStorage.getItem(EFFECTS_KEY) !== 'low';

const keys = new Set();
const speedNorm = () => THREE.MathUtils.clamp((speed - 8) / 42, 0, 1);

// ---------- Effects ----------
function applyEffects() {
  world.setEffects(effectsHigh);
  traffic.setEffects(effectsHigh);
  for (const g of playerCar.userData.glowMeshes) g.visible = effectsHigh;
  renderer.setPixelRatio(
    effectsHigh ? Math.min(window.devicePixelRatio || 1, 1.5) : 1,
  );
  ui.setEffectsLabel(effectsHigh);
  localStorage.setItem(EFFECTS_KEY, effectsHigh ? 'high' : 'low');
}

function toggleEffects() {
  effectsHigh = !effectsHigh;
  applyEffects();
  ui.showToast(`Effects ${effectsHigh ? 'high' : 'low'}`);
}

// ---------- Flow ----------
function resetRun() {
  score = 0;
  distance = 0;
  nearCount = 0;
  combo = 0;
  comboTimer = 0;
  elapsed = 0;
  speed = 16;
  prevSpeed = speed;
  playerX = 2.0;
  latVel = 0;
  carSpin = 0;
  playerCar.rotation.set(0, 0, 0);
  traffic.reset(travelled);
  ui.hideCallout();
}

function startGame() {
  audio.ensure();
  resetRun();
  state = 'playing';
  ui.showScreen(null);
  ui.setStartBest(best);
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  audio.setEngine(0, false);
  ui.showScreen('pause');
}

function resumeGame() {
  if (state !== 'paused') return;
  audio.ensure();
  state = 'playing';
  ui.showScreen(null);
}

function endRun() {
  state = 'over';
  const isNewBest = score > best;
  if (isNewBest) {
    best = Math.floor(score);
    localStorage.setItem(BEST_KEY, String(best));
  }
  const lines = [
    'The guardrail sends its regards.',
    'Somewhere behind you, a streetlight flickers and moves on.',
    'The coupe deserved better. So did that gap.',
    'Clean road, sudden end. The gaps were there — take one next time.',
  ];
  const line = isNewBest
    ? 'Best run yet. The mountain remembers.'
    : lines[Math.floor(Math.random() * lines.length)];
  ui.fillGameOver({
    score, dist: distance, near: nearCount, best, isNewBest, line,
  });
  ui.setStartBest(best);
  ui.showScreen('over');
  audio.setEngine(0, false);
}

function startCrash() {
  state = 'crashing';
  crashTimer = 0.75;
  carSpin = 0;
  audio.crash();
  ui.flashCrash();
}

// ---------- Input ----------
const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
]);
window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  audio.ensure();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }
  if (e.code === 'KeyR') {
    if (state === 'over' || state === 'playing' || state === 'paused') startGame();
  }
  if ((e.code === 'Enter' || e.code === 'Space')) {
    if (state === 'menu' || state === 'over') startGame();
    else if (state === 'paused') resumeGame();
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pauseGame();
});

function steerInput() {
  let s = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) s -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) s += 1;
  return s;
}
const throttleUp = () => keys.has('ArrowUp') || keys.has('KeyW');
const throttleDown = () => keys.has('ArrowDown') || keys.has('KeyS');

// ---------- Buttons ----------
function toggleMute() {
  audio.ensure();
  audio.setMuted(!audio.isMuted());
  ui.setMuteLabel(audio.isMuted());
}
ui.el.btnStart.addEventListener('click', startGame);
ui.el.btnAgain.addEventListener('click', startGame);
ui.el.btnResume.addEventListener('click', resumeGame);
ui.el.btnRestartPause.addEventListener('click', startGame);
ui.el.btnPause.addEventListener('click', pauseGame);
ui.el.btnMute.addEventListener('click', toggleMute);
ui.el.btnMutePause.addEventListener('click', toggleMute);
ui.el.btnEffects.addEventListener('click', toggleEffects);
ui.el.btnEffectsPause.addEventListener('click', toggleEffects);

// ---------- Update ----------
function updatePlaying(dt) {
  elapsed += dt;

  // Speed: a cruise target that rises over the run; pedals bend it.
  let target = Math.min(24 + elapsed * 0.22, 47);
  if (throttleUp()) target += 9;
  if (throttleDown()) target = 9;
  const rate = target > speed
    ? (throttleUp() ? 10 : 3.2)
    : (throttleDown() ? 26 : 9);
  speed += THREE.MathUtils.clamp(target - speed, -rate * dt, rate * dt);
  speed = Math.max(speed, 0);

  travelled += speed * dt;
  distance += speed * dt;
  score += speed * dt * 2;

  // Steering: fast lateral move, clamped by the guardrails.
  const steer = steerInput();
  const targetLat = steer * (6.5 + speed * 0.11);
  latVel += (targetLat - latVel) * (1 - Math.exp(-11 * dt));
  playerX += latVel * dt;
  if (playerX < -5.05) { playerX = -5.05; latVel = 0; }
  if (playerX > 5.05) { playerX = 5.05; latVel = 0; }

  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;
  }

  const events = traffic.update(dt, travelled, { x: playerX, speed }, elapsed);
  if (events.crashed) {
    startCrash();
    return;
  }
  for (const nm of events.nearMisses) {
    combo = comboTimer > 0 ? combo + 1 : 1;
    comboTimer = 4;
    const mult = Math.min(combo, 5);
    const bonus = 100 * mult + (nm.oncoming ? 50 : 0);
    score += bonus;
    nearCount += 1;
    ui.showCallout(`NEAR MISS +${bonus}${mult > 1 ? ` ×${mult}` : ''}`);
    audio.blip();
  }
}

function updateCrashing(dt) {
  crashTimer -= dt;
  speed = Math.max(0, speed - 55 * dt);
  travelled += speed * dt;
  carSpin += dt * 1.9;
  traffic.update(dt, travelled, { x: playerX, speed }, elapsed);
  if (crashTimer <= 0) endRun();
}

function updatePlayerVisual(dt) {
  const accel = dt > 0 ? (speed - prevSpeed) / dt : 0;
  prevSpeed = speed;
  accelSmooth += (accel - accelSmooth) * (1 - Math.exp(-6 * dt));

  playerCar.position.set(playerX, 0, 0);
  const roll = THREE.MathUtils.clamp(-latVel * 0.016, -0.13, 0.13);
  const yaw = THREE.MathUtils.clamp(-latVel * 0.009, -0.08, 0.08);
  const pitch = THREE.MathUtils.clamp(accelSmooth * 0.0016, -0.028, 0.04);
  playerCar.rotation.z = roll;
  playerCar.rotation.y = yaw + carSpin;
  playerCar.rotation.x = pitch;
  const spin = (speed * dt) / 0.34;
  for (const w of playerCar.userData.wheels) w.rotation.x -= spin;
}

function updateCamera(dt) {
  const norm = speedNorm();
  const targetFov = REDUCED_MOTION ? 62 : 62 + 15 * norm;
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-5 * dt));
    camera.updateProjectionMatrix();
  }
  let sx = 0;
  let sy = 0;
  if (state === 'crashing' && !REDUCED_MOTION) {
    const mag = Math.max(0, crashTimer / 0.75) * 0.13;
    sx = (Math.random() - 0.5) * 2 * mag;
    sy = (Math.random() - 0.5) * 2 * mag;
  }
  camera.position.set(playerX * 0.58 + sx, 3.05 + sy, 7.6);
  camera.lookAt(playerX * 0.85, 1.05, -14);
}

// ---------- Perf auto-drop ----------
let perfTime = 0;
let perfFrames = 0;
let autoDropped = false;
function watchPerf(dt) {
  if (state !== 'playing' || autoDropped || !effectsHigh) return;
  perfTime += dt;
  perfFrames += 1;
  if (perfTime >= 2.5) {
    const fps = perfFrames / perfTime;
    if (fps < 45) {
      autoDropped = true;
      effectsHigh = false;
      applyEffects();
      ui.showToast('Effects lowered to keep the run smooth');
    }
    perfTime = 0;
    perfFrames = 0;
  }
}

// ---------- Loop ----------
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === 'menu') {
    travelled += 13 * dt;
    speed = 13;
    world.update(dt, travelled, 0.12);
  } else if (state === 'playing') {
    updatePlaying(dt);
    world.update(dt, travelled, speedNorm());
    watchPerf(dt);
  } else if (state === 'crashing') {
    updateCrashing(dt);
    world.update(dt, travelled, speedNorm());
  }
  // paused / over: world holds still, we only render.

  if (state !== 'paused') updatePlayerVisual(dt);
  updateCamera(dt);
  audio.setEngine(speedNorm(), state === 'playing');
  if (state === 'playing' || state === 'crashing') {
    ui.updateHud({
      score,
      dist: distance,
      near: nearCount,
      speedKmh: speed * 3.6,
      best: Math.max(best, Math.floor(score)),
    });
  }
  renderer.render(scene, camera);
}

// ---------- Resize ----------
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

// ---------- Boot ----------
applyEffects();
ui.setMuteLabel(audio.isMuted());
ui.setStartBest(best);
ui.showScreen('start');
onResize();
frame();

// Read-only snapshot for the automated QA harness (qa/smoke.mjs).
window.__NT = {
  version: '1.0.0',
  start: startGame,
  getState() {
    return {
      state,
      score: Math.floor(score),
      distance: Math.floor(distance),
      speedKmh: Math.round(speed * 3.6),
      playerX: Math.round(playerX * 100) / 100,
      nearMisses: nearCount,
      best,
      effectsHigh,
      traffic: traffic.snapshot(travelled),
    };
  },
};
