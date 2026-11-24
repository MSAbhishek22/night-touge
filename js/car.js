// Car factory — every car in Night Touge is built from Three.js primitives.
// No models, no textures files: boxes, cylinders, and light glow sprites.
// Forward is -Z. Length ~4.3 m, width ~1.85 m.

import * as THREE from 'three';

// Shared geometries (created once, reused by every car).
const GEO = {
  body: new THREE.BoxGeometry(1.84, 0.52, 4.3),
  hood: new THREE.BoxGeometry(1.78, 0.3, 1.15),
  cabin: new THREE.BoxGeometry(1.58, 0.46, 1.95),
  wheel: new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12),
  headlight: new THREE.BoxGeometry(0.36, 0.09, 0.06),
  taillight: new THREE.BoxGeometry(1.52, 0.09, 0.06),
  spoiler: new THREE.BoxGeometry(1.7, 0.05, 0.34),
  strut: new THREE.BoxGeometry(0.07, 0.2, 0.07),
  shadow: new THREE.PlaneGeometry(2.5, 5.0),
  glow: new THREE.PlaneGeometry(1.5, 1.5),
};

const MAT = {
  glass: new THREE.MeshStandardMaterial({ color: 0x0d1624, metalness: 0.9, roughness: 0.15 }),
  tyre: new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.1, roughness: 0.9 }),
  headlight: new THREE.MeshStandardMaterial({
    color: 0x554a33, emissive: 0xfff3d6, emissiveIntensity: 3.2,
  }),
  taillight: new THREE.MeshStandardMaterial({
    color: 0x330d0b, emissive: 0xff3b30, emissiveIntensity: 2.6,
  }),
  trim: new THREE.MeshStandardMaterial({ color: 0x14161c, metalness: 0.4, roughness: 0.6 }),
};

let glowTexture = null;
export function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

let shadowTexture = null;
function getShadowTexture() {
  if (shadowTexture) return shadowTexture;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 128, 8, 64, 128, 120);
  grad.addColorStop(0, 'rgba(0,0,0,0.62)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.save();
  g.translate(64, 128);
  g.scale(0.5, 1);
  g.translate(-64, -128);
  g.fillRect(0, 0, 256, 256);
  g.restore();
  shadowTexture = new THREE.CanvasTexture(c);
  return shadowTexture;
}

function glowSprite(color, scale, opacity) {
  const m = new THREE.MeshBasicMaterial({
    map: getGlowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(GEO.glow, m);
  mesh.scale.setScalar(scale);
  return mesh;
}

// buildCar({ color, isPlayer }) → group with userData:
//   wheels[], bodyMat (per-car paint), glowMeshes[] (effects toggle),
//   length, width
export function buildCar({ color = 0x8a8f98, isPlayer = false } = {}) {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({
    color, metalness: 0.55, roughness: 0.38,
  });

  const shadow = new THREE.Mesh(
    GEO.shadow,
    new THREE.MeshBasicMaterial({
      map: getShadowTexture(), transparent: true, depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  car.add(shadow);

  const body = new THREE.Mesh(GEO.body, paint);
  body.position.y = 0.56;
  car.add(body);

  const hood = new THREE.Mesh(GEO.hood, paint);
  hood.position.set(0, 0.47, -1.72);
  hood.rotation.x = 0.05;
  car.add(hood);

  const cabin = new THREE.Mesh(GEO.cabin, MAT.glass);
  cabin.position.set(0, 1.0, 0.22);
  car.add(cabin);

  const trim = new THREE.Mesh(GEO.taillight, MAT.trim);
  trim.position.set(0, 0.34, -2.16);
  trim.scale.set(1.05, 1.6, 0.6);
  car.add(trim);

  const wheels = [];
  const wheelPos = [
    [-0.84, -1.38], [0.84, -1.38], [-0.84, 1.38], [0.84, 1.38],
  ];
  for (const [x, z] of wheelPos) {
    const w = new THREE.Mesh(GEO.wheel, MAT.tyre);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.34, z);
    car.add(w);
    wheels.push(w);
  }

  const glowMeshes = [];

  for (const x of [-0.58, 0.58]) {
    const hl = new THREE.Mesh(GEO.headlight, MAT.headlight);
    hl.position.set(x, 0.64, -2.16);
    car.add(hl);
    const glow = glowSprite(0xffe9bb, 1.5, 0.55);
    glow.position.set(x, 0.64, -2.3);
    car.add(glow);
    glowMeshes.push(glow);
  }

  const tl = new THREE.Mesh(GEO.taillight, MAT.taillight);
  tl.position.set(0, 0.68, 2.16);
  car.add(tl);
  const tlGlow = glowSprite(0xff3b30, 1.15, 0.4);
  tlGlow.position.set(0, 0.68, 2.3);
  car.add(tlGlow);
  glowMeshes.push(tlGlow);

  if (isPlayer) {
    const spoiler = new THREE.Mesh(GEO.spoiler, MAT.trim);
    spoiler.position.set(0, 0.98, 2.0);
    car.add(spoiler);
    for (const x of [-0.6, 0.6]) {
      const strut = new THREE.Mesh(GEO.strut, MAT.trim);
      strut.position.set(x, 0.86, 2.0);
      car.add(strut);
    }
    // Warm underglow — the player's signature at night.
    const under = glowSprite(0xff9a3c, 3.4, 0.22);
    under.rotation.x = -Math.PI / 2;
    under.position.y = 0.06;
    under.scale.set(1, 1.6, 1);
    car.add(under);
    glowMeshes.push(under);
  }

  car.userData = {
    wheels,
    bodyMat: paint,
    glowMeshes,
    length: 4.4,
    width: 1.9,
  };
  return car;
}
