# Night Touge

A small 3D endless driver for the browser. One night highway, one low
coupe, and traffic that does not move for you.

You hold a rising cruise speed on a mountain expressway at 2 a.m. Thread
the gaps between cars. Pass close and the game pays you for it — near
misses are the whole point. Pass too close and the run ends.

## How to play

- **←/→** or **A/D** — steer
- **↑** or **W** — accelerate
- **↓** or **S** — brake
- **P** — pause · **M** — sound on/off · **R** — restart after a crash

Score comes from distance, and from near misses. A near miss is passing
a car with less than a car's width to spare. Chain them and the bonus
multiplies, up to ×5. The left lane is oncoming traffic: the closing
speed is brutal, the bonus is bigger, and so is the dent.

Speed rises the longer you survive. So does the traffic.

## Running it

No build step. Serve the folder with any static server and open
`index.html`:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

It must be served over http(s) — the ES modules and import map do not
run from `file://`. Desktop browser with a keyboard is the target;
that is what the jam asks for.

## What's inside

- `index.html` — page, HUD, and the three screens (start, pause, over)
- `style.css` — road-sign UI: dark ground, one amber accent, monospace
  numbers like a dashboard
- `js/main.js` — game state, player physics, camera, scoring
- `js/world.js` — the highway: pooled road segments, guardrails,
  streetlights, hills, a lit city skyline, moon and stars, speed streaks
- `js/car.js` — every car built from Three.js primitives; no model files
- `js/traffic.js` — pooled traffic, spawning, collision, near misses
- `js/audio.js` — WebAudio synth sound (engine hum, near-miss blip,
  crash thud). No audio files
- `vendor/three.module.js` — Three.js r160, vendored and pinned so the
  game works offline and never depends on a CDN being up
- `design/` — the design constitution and registry written before the build
- `qa/` — the interaction inventory, QA results, and the smoke test

## Honest bits

- Everything is pooled and recycled; nothing is allocated per frame in
  the hot loop. Pixel ratio is capped, and if the frame rate sags the
  game lowers its own effects and tells you.
- The best score lives in `localStorage`. No accounts, no tracking,
  no network calls at all once the files are served.
- Sound is synthesized live. It is simple on purpose.

Built for OpenGame Game Jam #1 (Racing track). See `SUBMISSION_PACK.md`
for the entry text and `DEPLOY.md` for the upload steps.
