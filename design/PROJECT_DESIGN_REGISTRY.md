# Project Design Registry — Night Touge vs the three most recent builds

Per ABHI_22 blueprint Part V: every project gets a distinct visual identity,
checked against the three most recent projects. Accent-colour swaps do not
count as distinct.

| Dimension | GeoRaksha (Configure 2026) | FlagAgent (Toggle Wars) | TriageMate (Homingo) | **Night Touge (this project)** |
|---|---|---|---|---|
| Visual metaphor | Operations map room | Change-desk / approval queue | Editorial triage desk | **A windscreen at 2 a.m.; UI as road furniture** |
| Ground / palette | Dark slate + map greens | Light admin neutrals | Light editorial paper | **Near-black blue night; amber as the only signal colour** |
| Typography | Sans, data-dense labels | Sans, form-like | Serif-leaning editorial | **Road-sign uppercase for titles, monospace for instruments** |
| Layout | Map + side panels | Split list / diff view | Reading column + cards | **Full-viewport 3D canvas; HUD only at corners** |
| Interaction model | Pan/zoom map, filters | Approve/reject workflow | Filter, tick, export | **Real-time driving: steer, accelerate, brake** |
| Motion system | Map transitions | Panel slides | Page fades | **Velocity itself: FOV kick, light streaks, body roll** |
| 3D treatment | 2D canvas map | None (tool UI) | None (tool UI) | **Full Three.js scene: road, traffic, lights, hills** |
| Sound | None | None | None | **WebAudio synth engine, near-miss blip, crash thud** |

Distinct on every row: metaphor, palette, typography, layout, interaction,
motion and 3D treatment all differ from the three previous projects.
Engineering utilities reused: none of the visual templates; only habits
(static files, no build step, honest QA files).
