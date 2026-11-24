# Night Touge — Design Constitution

Project: Night Touge, a 3D endless night-highway driver for OpenGame Game Jam #1
(Racing genre track). Written 24 Nov 2026, before any frontend code, per the
ABHI_22 blueprint Part V chain: Research → Design Constitution → Build → QA.

## 1. Design research (inspected 24 Nov 2026)

At least five real references were inspected before building. Notes say what
was actually seen, what was learned, and what must NOT be copied.

1. **ThreeUI — https://threeui.com** (3D/spatial reference)
   Inspected: the component/template index (testimonials, footers, pricing,
   features sections built as real Three.js scenes; entries such as
   "Workshop Codex" with star fields and parallax ridgelines, "Ashforge" with
   a shader-lit action, "Agent AI" with an amber-lit 3D network).
   Learned: one authored 3D scene per surface beats decoration; warm amber
   light against dark scenes reads premium; parallax depth layers (stars,
   ridgelines) sell "night" cheaply.
   Not copied: no component, layout or shader code; only the lighting lesson.

2. **dark.design — https://dark.design** (visual identity / night palette)
   Inspected: the dark-theme gallery index (100+ dark sites: near-black
   grounds, one accent colour each, restrained glow, editorial type).
   Learned: discipline is the look — one accent, spent in few places; glow is
   earned by scarcity.
   Not copied: no site's layout or palette values.

3. **Taste Skill — https://tasteskill.dev** (composition / anti-slop rules)
   Inspected: the full one-pager, including its 20 named layout moves and its
   "from default to designed" sequence. Directly relevant moves: "19. The
   dark room — lit things in the dark" and "7. One motif — one shape runs it
   all". Its named anti-pattern is the generic default: purple gradient,
   gradient text, three glass cards.
   Learned: pick ONE motif and let it run everything; a night scene is lit
   objects on a dark ground, nothing else.
   Not copied: it is a ruleset, not a visual; no assets taken.

4. **Godly — https://godly.website** (product-category inspiration)
   Inspected: the landing and showcase structure ("The best design
   inspiration on the Internet", slide-based full-bleed showcase). Text
   extraction is thin because the gallery is image-driven; recorded honestly.
   Learned: one strong visual per screen, full-bleed, no competing elements —
   applied here as: the road is the whole screen; UI stays at the edges.
   Not copied: no imagery or layout.

5. **JavaScript Racer v4, Jake Gordon — https://codeincomplete.com/games/racer/**
   (game-feel / interaction reference)
   Inspected: the playable demo page (arrow-key driving, speed readout in
   mph, time/last/fastest lap HUD). The long-running reference implementation
   for segment-based road rendering and arcade speed feel.
   Learned: speed must be readable at a glance (one big number); the road
   moving under you, not the car moving across a map, is what sells velocity;
   traffic exists to be overtaken closely.
   Not copied: it is a 2D canvas pseudo-3D racer with lap circuits; Night
   Touge is real Three.js, endless, lane-based, and shares no code.

6. **Minimal Gallery — https://minimal.gallery** (typography / composition)
   Inspected: the index (quiet grid, small type with large space, category
   index set in plain lists, generous whitespace).
   Learned: "the quiet instrument" — small, calm type at the edges makes the
   loud centre (the road, the speed) feel louder.
   Not copied: no layout; this is a game HUD, not a gallery.

## 2. Visual identity

- **Metaphor:** a mountain expressway at 2 a.m. The screen is a windscreen.
  The UI is road furniture: direction signs, a dashboard cluster, painted
  lines. Nothing on screen that could not exist on a night highway.
- **Motif (one, per Taste Skill):** the amber sodium streetlight. Amber is
  the only warm colour; it marks everything that matters — lights, rules,
  the score, the start button. Cool colours (deep blue night, grey asphalt)
  are ground, never signal.
- **Palette:**
  - Night ink `#05080f` (sky, page ground)
  - Deep blue `#0a1122` (fog, distant hills)
  - Asphalt `#11141c` with painted lines in worn white `#cfd4da`
  - Amber `#ffb454` (accent: lights, score, primary actions)
  - Headlight white `#fff3d6`
  - Taillight red `#ff3b30` (danger, crash, oncoming warning only)
  - Signal teal `#57e6c9` (near-miss callout only — the one cool signal)
  - No purple/blue gradients. No glassmorphism. No glow blobs.
- **Typography:** no webfonts (the build must run offline as static files).
  Titles: system-ui, 800 weight, uppercase, wide letter-spacing — road-sign
  voice. Numbers: ui-monospace — dashboard instrument voice. Body: system-ui.
- **Composition:** full-viewport canvas. HUD lives at the corners like a
  dashboard and mirrors. Menus are "service-area signs": hard-edged panels,
  one thin amber rule, no rounded glass cards.
- **Motion system:** speed itself is the motion design — FOV widens with
  velocity, light streaks appear past ~120 km/h, the car rolls into lane
  changes and pitches under braking. UI transitions are short (150–250 ms)
  fades. `prefers-reduced-motion` disables FOV kick, streaks, and shake.
- **Sound:** WebAudio synth only, no files. A low engine hum whose pitch
  follows speed, a short blip for a near miss, a noise thud for a crash.
  Mute is a real toggle, persisted. Sound starts only after a user gesture.

## 3. Game design rules

- One clear primary action: change lanes at speed. Everything else
  (accelerate, brake) tunes that action.
- The loop must be complete: start screen → drive → near-miss bonuses →
  rising speed → crash → score screen → instant restart. No dead ends.
- Every visible control works. No placeholder buttons, no fake settings.
- Fair traffic: never spawn a wall across all lanes; oncoming lane is a
  risk the player chooses, never a trap.
- Performance is a design feature: pooled everything, no per-frame
  allocation in the loop, pixel ratio capped, an effects toggle that
  actually changes rendering cost, auto-drop if the frame rate sags.

## 4. What this design must never become

- A tech demo with a car on a road and no game (the jam rules reject
  prototypes; so does this constitution).
- A neon-purple synthwave clone. The night here is blue and amber, lit by
  sodium lamps, not by gradient skies.
- A dashboard of glass cards over a 3D scene. The road is the interface.
