// Traffic — a pooled set of cars that spawn far ahead, flow past the
// player, and recycle. Handles collision and near-miss detection in
// road space (distance s + lane x), where the road bend cancels out.

import { buildCar } from './car.js';
import { LANE_ONCOMING, LANES_SAME, roadToWorld } from './world.js';

const PALETTE = [0x5a6270, 0x31435f, 0x5f3138, 0x3f4a3a, 0x6b6f75, 0x44484f, 0x71602e];
const POOL_SIZE = 14;
const SPAWN_AHEAD = 390;
const COLLIDE_REL = 4.3;      // |s gap| that counts as a hit
const COLLIDE_DX = 1.75;      // |lane gap| that counts as a hit
const NEAR_MISS_DX = 3.1;     // passing closer than this (but no hit) pays

const LANES = [
  { x: LANES_SAME[0], oncoming: false, gap: 34 },
  { x: LANES_SAME[1], oncoming: false, gap: 34 },
  { x: LANE_ONCOMING, oncoming: true, gap: 60 },
];

export function createTraffic(scene) {
  const cars = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const group = buildCar({ color: PALETTE[i % PALETTE.length] });
    group.visible = false;
    scene.add(group);
    cars.push({
      group,
      active: false,
      s: 0,
      laneX: 0,
      speed: 0,
      oncoming: false,
      prevRel: 0,
    });
  }

  let spawnTimer = 0.5;
  let effectsHigh = true;

  function freeCar() {
    return cars.find((c) => !c.active) || null;
  }

  function laneClear(lane, s) {
    for (const c of cars) {
      if (c.active && c.laneX === lane.x && Math.abs(c.s - s) < lane.gap) {
        return false;
      }
    }
    return true;
  }

  function bothSameLanesBlocked(s) {
    let blocked = 0;
    for (const lane of LANES) {
      if (lane.oncoming) continue;
      for (const c of cars) {
        if (c.active && c.laneX === lane.x && Math.abs(c.s - s) < 16) {
          blocked++;
          break;
        }
      }
    }
    return blocked === 2;
  }

  function spawn(travelled) {
    const car = freeCar();
    if (!car) return;
    const s = travelled + SPAWN_AHEAD + Math.random() * 30;
    const order = [...LANES].sort(() => Math.random() - 0.5);
    for (const lane of order) {
      if (!laneClear(lane, s)) continue;
      // Fairness: never wall off all three lanes at the same distance.
      if (lane.oncoming && bothSameLanesBlocked(s)) continue;
      car.active = true;
      car.s = s;
      car.laneX = lane.x + (lane.oncoming ? 0 : (Math.random() - 0.5) * 0.3);
      car.oncoming = lane.oncoming;
      car.speed = lane.oncoming
        ? 17 + Math.random() * 9
        : 11 + Math.random() * 7;
      car.prevRel = s - travelled;
      car.group.userData.bodyMat.color.setHex(
        PALETTE[Math.floor(Math.random() * PALETTE.length)],
      );
      car.group.rotation.y = lane.oncoming ? Math.PI : 0;
      car.group.visible = true;
      for (const g of car.group.userData.glowMeshes) g.visible = effectsHigh;
      return;
    }
  }

  function reset(travelled) {
    for (const c of cars) {
      c.active = false;
      c.group.visible = false;
    }
    spawnTimer = 0.5;
    // Pre-fill so the first seconds are not an empty road.
    for (const rel of [130, 235, 330]) {
      const car = freeCar();
      if (!car) break;
      const lane = LANES[Math.floor(Math.random() * 2)]; // same-direction only
      car.active = true;
      car.s = travelled + rel;
      car.laneX = lane.x;
      car.oncoming = false;
      car.speed = 12 + Math.random() * 5;
      car.prevRel = rel;
      car.group.rotation.y = 0;
      car.group.visible = true;
    }
  }

  // player: { x, speed } — returns { crashed, nearMisses: [{closing}] }
  function update(dt, travelled, player, elapsed) {
    const events = { crashed: false, nearMisses: [] };

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn(travelled);
      if (elapsed > 75 && Math.random() < 0.35) spawn(travelled);
      const base = 1.15 - elapsed * 0.006;
      spawnTimer = Math.max(0.5, base) * (0.75 + Math.random() * 0.5);
    }

    for (const car of cars) {
      if (!car.active) continue;
      car.s += (car.oncoming ? -car.speed : car.speed) * dt;
      const rel = car.s - travelled;

      if (rel < -30 || rel > 520) {
        car.active = false;
        car.group.visible = false;
        continue;
      }

      const pos = roadToWorld(car.s, car.laneX, travelled);
      car.group.position.set(pos.x, 0, pos.z);
      const spin = (car.speed * dt) / 0.34;
      for (const w of car.group.userData.wheels) w.rotation.x -= spin;

      const dx = Math.abs(car.laneX - player.x);
      if (Math.abs(rel) < COLLIDE_REL && dx < COLLIDE_DX) {
        events.crashed = true;
      } else if (
        car.prevRel > 0 && rel <= 0 && player.speed > 14 && dx < NEAR_MISS_DX
      ) {
        events.nearMisses.push({
          closing: player.speed + (car.oncoming ? car.speed : -car.speed),
          oncoming: car.oncoming,
        });
      }
      car.prevRel = rel;
    }
    return events;
  }

  function setEffects(high) {
    effectsHigh = high;
    for (const c of cars) {
      for (const g of c.group.userData.glowMeshes) g.visible = high;
    }
  }

  function snapshot(travelled) {
    return cars
      .filter((c) => c.active)
      .map((c) => ({
        laneX: Math.round(c.laneX * 10) / 10,
        rel: Math.round(c.s - travelled),
        oncoming: c.oncoming,
      }));
  }

  return { update, reset, setEffects, snapshot };
}
