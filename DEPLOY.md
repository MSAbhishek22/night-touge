# Deploy & Submit — Night Touge

Status of this build: **complete and QA-passed locally (18/18 smoke
checks, see `qa/QA_RESULTS.md`). Not yet deployed or submitted.**
The steps below are the exact remaining ones. Repo creation and the
OpenGame account steps need the user at his own browser — they are
marked **[USER]**.

## What is ready

The whole game is this folder. `index.html` sits at the root, as the
jam requires. Total size ~1.5 MB, of which 1.27 MB is the vendored
Three.js r160 build. No build step, no environment variables, no
server-side anything.

## Step 1 — GitHub repo + Pages (mirror / backup host)

1. **[USER]** Create a public GitHub repo named `night-touge`
   (the usual route: signed-in browser, github.com/new — repo creation
   cannot be done from this workspace).
2. Push this folder to it:

   ```
   cd ~/workspace/hackathons/opengame-jam
   git init && git add . && git commit -m "Night Touge — OpenGame Jam #1 entry"
   git branch -M main
   git remote add origin https://github.com/MSAbhishek22/night-touge.git
   git push -u origin main
   ```

3. Repo → Settings → Pages → deploy from branch `main`, folder `/ (root)`.
4. Open the Pages URL and play one full run (start → near miss → crash →
   restart) to confirm the deployed copy matches. This is the
   blueprint's live-deployment gate: do not submit a build you have not
   played from its live URL.

## Step 2 — Listen once

Before submitting, play once with sound on, on a real laptop. The
WebAudio engine hum is verified by construction and by the absence of
console errors, but nobody has heard the mix yet. If it annoys, the
mute button works and the game defaults are unchanged.

## Step 3 — OpenGame submission (the one that counts)

Per the rules verified on 24 Nov 2026 (https://opengame.io/rules and
https://opengame.io/jam — re-check them on the day; rules can change):

1. **[USER]** Sign in to opengame.io with the participant account
   (individuals only — this entry is solo, as required).
2. Install/sign in to the **OpenGame CLI** as their docs describe.
3. From this folder, run the CLI's deploy command (their docs name it;
   it uploads the static build with `index.html` at the root).
   Everything it needs is already in the folder — do not add a build
   step.
4. Paste the submission text from `SUBMISSION_PACK.md` (title, genre
   track Racing, description, controls).
5. After the CLI confirms, open the published game page on
   opengame.io, play one full run from that URL, and only then treat
   the entry as submitted. Keep the confirmation/reference the CLI or
   site shows — a submission counts when there is a receipt.
6. **Deadline: 19 Dec 2026, 13:29 IST** (18 Dec 11:59 PM PT). Aim to
   submit by 17 Dec to leave slack for upload problems.

## Fallbacks and notes

- If the OpenGame CLI wants a specific folder layout beyond "index.html
  at root", this folder already matches; point the CLI at the folder
  root, not at a subfolder.
- Three.js is vendored (`vendor/three.module.js`, r160, sha256
  `76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495`),
  so the deployed game does not depend on any CDN. If a future version
  switches to a CDN, pin `three@0.160.0` exactly — never a floating
  version.
- The game makes no network calls, has no login wall, no ads and no
  crypto anything — all per the jam rules.
