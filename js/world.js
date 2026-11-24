// World — the night highway. Everything is pooled and recycled:
// road segments, guardrails, streetlights, hills, speed streaks.
// The player never leaves z = 0; the road's distance coordinate `s`
// flows past. Render x includes a gentle bend so the road curves.

import * as THREE from 'three';
import { getGlowTexture } from './car.js';

export const ROAD_HALF = 6.0;          // drivable half-width (m)
export const LANE_ONCOMING = -3.9;     // oncoming lane centre
export const LANES_SAME = [0.4, 3.7];  // same-direction lane centres
export const DIVIDER_X = -1.9;

const SEG_LEN = 10;
const SEG_COUNT = 38;                  // 380 m of road, recycled
const ROAD_LEN = SEG_LEN * SEG_COUNT;

// Gentle S-bend of the whole road, a function of distance along it.
export function bendX(s) {
  return 9 * Math.sin(s * 0.0055) + 3.5 * Math.sin(s * 0.0016 + 1.7);
}

// World-space x/z for something at road distance s in a lane.
export function roadToWorld(s, laneX, travelled) {
  return {
    x: laneX + bendX(s) - bendX(travelled),
    z: -(s - travelled),
  };
}

function makeAsphaltTexture(withDash) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const px = (x) => ((x + 6.5) / 13) * 512;

  g.fillStyle = '#181b24';
  g.fillRect(0, 0, 512, 256);
  // Noise speckle.
  for (let i = 0; i < 2600; i++) {
    const v = 18 + Math.random() * 22;
    g.fillStyle = `rgba(${v},${v},${v + 6},${0.16 + Math.random() * 0.2})`;
    g.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
  }
  // Darker wheel tracks in each lane.
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (const lane of [LANE_ONCOMING, ...LANES_SAME]) {
    for (const off of [-0.62, 0.62]) {
      g.fillRect(px(lane + off) - 7, 0, 14, 256);
    }
  }
  // Solid edge lines.
  g.fillStyle = 'rgba(205,212,220,0.85)';
  g.fillRect(px(-5.85) - 2, 0, 5, 256);
  g.fillRect(px(5.85) - 2, 0, 5, 256);
  // Double yellow at the divider.
  g.fillStyle = 'rgba(201,162,39,0.9)';
  g.fillRect(px(DIVIDER_X - 0.22) - 2, 0, 4, 256);
  g.fillRect(px(DIVIDER_X + 0.22) - 2, 0, 4, 256);
  // Dashed white between the two same-direction lanes.
  if (withDash) {
    g.fillStyle = 'rgba(205,212,220,0.85)';
    g.fillRect(px(2.05) - 3, 30, 6, 110);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCityTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 128);
  // Warm haze near the ground.
  const grad = g.createLinearGradient(0, 40, 0, 128);
  grad.addColorStop(0, 'rgba(255,150,60,0)');
  grad.addColorStop(1, 'rgba(255,150,60,0.20)');
  g.fillStyle = grad;
  g.fillRect(0, 40, 1024, 88);
  // Building silhouettes with lit windows.
  let x = 0;
  while (x < 1024) {
    const w = 26 + Math.random() * 60;
    const h = 34 + Math.random() * 62;
    g.fillStyle = '#0a0f1e';
    g.fillRect(x, 128 - h, w, h);
    for (let wy = 128 - h + 6; wy < 122; wy += 8) {
      for (let wx = x + 4; wx < x + w - 4; wx += 7) {
        if (Math.random() < 0.34) {
          g.fillStyle = Math.random() < 0.8 ? 'rgba(255,196,110,0.85)' : 'rgba(190,220,255,0.8)';
          g.fillRect(wx, wy, 3, 4);
        }
      }
    }
    x += w + 2 + Math.random() * 10;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePoolTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,170,80,0.5)');
  grad.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createWorld(scene) {
  scene.background = new THREE.Color(0x070d1d);
  scene.fog = new THREE.Fog(0x0a1122, 45, 335);

  scene.add(new THREE.HemisphereLight(0x24365e, 0x05070c, 1.25));
  const moonLight = new THREE.DirectionalLight(0x8fb0ff, 0.4);
  moonLight.position.set(-40, 80, -60);
  scene.add(moonLight);
  // Warm fill from behind the camera so car paint reads at night.
  const fill = new THREE.DirectionalLight(0xffd9b0, 0.5);
  fill.position.set(6, 14, 20);
  scene.add(fill);

  // ---- Ground (static: the player stays at z = 0) ----
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(760, 560),
    new THREE.MeshLambertMaterial({ color: 0x060a12 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.06, -170);
  scene.add(ground);

  // ---- Sky: stars + moon (static relative to the camera) ----
  const sky = new THREE.Group();
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 700; i++) {
    const a = (Math.random() - 0.5) * Math.PI * 1.6;
    const r = 640;
    starPos.push(
      Math.sin(a) * r,
      45 + Math.random() * 420,
      -Math.cos(a) * r + 60,
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xaec2e8, size: 1.7, sizeAttenuation: false,
    transparent: true, opacity: 0.85, fog: false,
  }));
  sky.add(stars);
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(17, 24),
    new THREE.MeshBasicMaterial({ color: 0xf2e8cf, fog: false }),
  );
  moon.position.set(-235, 148, -470);
  sky.add(moon);
  scene.add(sky);

  // ---- Road segments (pooled) ----
  const texA = makeAsphaltTexture(true);
  const texB = makeAsphaltTexture(false);
  const roadGeo = new THREE.PlaneGeometry(13, SEG_LEN + 0.05);
  const roadMatA = new THREE.MeshLambertMaterial({ map: texA });
  const roadMatB = new THREE.MeshLambertMaterial({ map: texB });
  const railGeo = new THREE.BoxGeometry(0.16, 0.5, SEG_LEN + 0.05);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x39415a, metalness: 0.7, roughness: 0.45,
  });
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.6, 6);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x2c3242, metalness: 0.5, roughness: 0.6,
  });
  const armGeo = new THREE.BoxGeometry(1.7, 0.09, 0.09);
  const lampHeadGeo = new THREE.BoxGeometry(0.52, 0.1, 0.26);
  const lampHeadMat = new THREE.MeshStandardMaterial({
    color: 0x2c2416, emissive: 0xffb454, emissiveIntensity: 2.8,
  });
  const poolTex = makePoolTexture();
  const poolGeo = new THREE.CircleGeometry(3.6, 18);

  const lampGlows = [];
  const segments = [];

  function buildLamp(side) {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.8;
    lamp.add(pole);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(-side * 0.8, 5.55, 0);
    lamp.add(arm);
    const head = new THREE.Mesh(lampHeadGeo, lampHeadMat);
    head.position.set(-side * 1.55, 5.5, 0);
    lamp.add(head);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 5.2),
      new THREE.MeshBasicMaterial({
        map: getGlowTexture(), color: 0xffb454, transparent: true,
        opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    glow.position.copy(head.position);
    lamp.add(glow);
    lampGlows.push(glow);
    const pool = new THREE.Mesh(
      poolGeo,
      new THREE.MeshBasicMaterial({
        map: poolTex, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-side * 1.55, 0.04, 0);
    lamp.add(pool);
    lampGlows.push(pool);
    lamp.position.x = side * 7.3;
    return lamp;
  }

  for (let i = 0; i < SEG_COUNT; i++) {
    const group = new THREE.Group();
    const road = new THREE.Mesh(roadGeo, i % 2 === 0 ? roadMatA : roadMatB);
    road.rotation.x = -Math.PI / 2;
    group.add(road);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(side * 6.7, 0.45, 0);
      group.add(rail);
    }
    if (i % 4 === 0) {
      group.add(buildLamp(i % 8 === 0 ? -1 : 1));
    }
    scene.add(group);
    segments.push({ group, s: i * SEG_LEN });
  }

  // ---- Hills (pooled silhouettes) ----
  const hillMat = new THREE.MeshLambertMaterial({ color: 0x0a1122, flatShading: true });
  const hills = [];
  for (let i = 0; i < 10; i++) {
    const r = 55 + Math.random() * 70;
    const hill = new THREE.Mesh(new THREE.ConeGeometry(r, 24 + Math.random() * 34, 6), hillMat);
    const side = i % 2 === 0 ? -1 : 1;
    hill.position.x = side * (85 + Math.random() * 110);
    hill.scale.z = 0.55;
    scene.add(hill);
    hills.push({ mesh: hill, s: i * 140 + Math.random() * 60 });
  }

  // ---- Distant city glow, right side (slow parallax, two tiling planes) ----
  const cityTex = makeCityTexture();
  const cityMat = new THREE.MeshBasicMaterial({
    map: cityTex, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
  });
  const cityPlanes = [];
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(520, 52), cityMat);
    p.position.set(175, 15, 0);
    p.rotation.y = -Math.PI / 2;
    scene.add(p);
    cityPlanes.push(p);
  }

  // ---- Speed streaks (pooled) ----
  const streakMat = new THREE.MeshBasicMaterial({
    color: 0xffd9a0, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const streakGeo = new THREE.PlaneGeometry(0.07, 4.4);
  const streaks = [];
  for (let i = 0; i < 20; i++) {
    const m = new THREE.Mesh(streakGeo, streakMat);
    const side = i % 2 === 0 ? -1 : 1;
    m.position.y = 0.4 + Math.random() * 2.3;
    m.visible = false;
    scene.add(m);
    streaks.push({
      mesh: m,
      s: Math.random() * 320,
      baseX: side * (7 + Math.random() * 3.6),
    });
  }

  let effectsHigh = true;

  function setEffects(high) {
    effectsHigh = high;
    for (const g of lampGlows) g.visible = high;
    if (!high) for (const st of streaks) st.mesh.visible = false;
  }

  function update(dt, travelled, speedNorm) {
    const bendHere = bendX(travelled);
    for (const seg of segments) {
      if (seg.s - travelled < -SEG_LEN * 1.5) seg.s += ROAD_LEN;
      const rel = seg.s - travelled;
      seg.group.position.set(bendX(seg.s) - bendHere, 0, -rel - SEG_LEN / 2);
    }
    for (const h of hills) {
      if (h.s - travelled < -80) h.s += 1400;
      h.mesh.position.z = -(h.s - travelled);
      h.mesh.position.y = 0;
    }
    for (let i = 0; i < cityPlanes.length; i++) {
      const span = 1040;
      const off = (travelled * 0.92 + i * 520) % span;
      cityPlanes[i].position.z = 250 - off;
    }
    const showStreaks = effectsHigh && speedNorm > 0.5;
    streakMat.opacity = showStreaks ? 0.14 + (speedNorm - 0.5) * 0.55 : 0;
    for (const st of streaks) {
      if (st.s - travelled < -10) st.s += 320;
      st.mesh.visible = showStreaks;
      if (showStreaks) {
        st.mesh.position.z = -(st.s - travelled);
        st.mesh.position.x = st.baseX + bendX(st.s) - bendHere;
        st.mesh.scale.y = 0.6 + speedNorm * 1.7;
      }
    }
  }

  return { update, setEffects, lampGlows };
}
