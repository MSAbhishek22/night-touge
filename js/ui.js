// UI — thin DOM layer over index.html. No game logic lives here;
// main.js tells it what to show. Text updates are cached so the HUD
// only touches the DOM when a value actually changes.

const $ = (id) => document.getElementById(id);

export function createUI() {
  const el = {
    hud: $('hud'),
    score: $('hud-score'),
    dist: $('hud-dist'),
    near: $('hud-near'),
    speed: $('dash-speed'),
    dashBest: $('dash-best'),
    callout: $('callout'),
    toast: $('toast'),
    flash: $('crash-flash'),
    start: $('screen-start'),
    pause: $('screen-pause'),
    over: $('screen-over'),
    startBest: $('start-best'),
    overLine: $('over-line'),
    overScore: $('over-score'),
    overDist: $('over-dist'),
    overNear: $('over-near'),
    overBest: $('over-best'),
    overNewBest: $('over-newbest'),
    btnStart: $('btn-start'),
    btnAgain: $('btn-again'),
    btnResume: $('btn-resume'),
    btnRestartPause: $('btn-restart-pause'),
    btnPause: $('btn-pause'),
    btnMute: $('btn-mute'),
    btnEffects: $('btn-effects'),
    btnMutePause: $('btn-mute-pause'),
    btnEffectsPause: $('btn-effects-pause'),
  };

  const cache = {};
  function setText(node, key, value) {
    if (cache[key] !== value) {
      cache[key] = value;
      node.textContent = value;
    }
  }

  function fmtDist(m) {
    return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.floor(m)} m`;
  }

  let toastTimer = null;

  return {
    el,

    showScreen(name) {
      el.start.classList.toggle('hidden', name !== 'start');
      el.pause.classList.toggle('hidden', name !== 'pause');
      el.over.classList.toggle('hidden', name !== 'over');
      el.hud.classList.toggle('hidden', name === 'start');
      el.hud.setAttribute('aria-hidden', name === 'start' ? 'true' : 'false');
    },

    updateHud({ score, dist, near, speedKmh, best }) {
      setText(el.score, 'score', String(Math.floor(score)));
      setText(el.dist, 'dist', fmtDist(dist));
      setText(el.near, 'near', String(near));
      setText(el.speed, 'speed', String(Math.round(speedKmh)));
      setText(el.dashBest, 'best', String(Math.floor(best)));
    },

    setStartBest(best) {
      setText(el.startBest, 'startBest', String(Math.floor(best)));
    },

    showCallout(text) {
      el.callout.textContent = text;
      el.callout.classList.remove('hidden', 'pop');
      // Restart the CSS animation.
      void el.callout.offsetWidth;
      el.callout.classList.add('pop');
    },

    hideCallout() {
      el.callout.classList.add('hidden');
    },

    showToast(text, ms = 2600) {
      el.toast.textContent = text;
      el.toast.classList.remove('hidden');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.toast.classList.add('hidden'), ms);
    },

    flashCrash() {
      el.flash.classList.remove('hidden');
      const node = el.flash;
      // Remove after the animation so it can replay next crash.
      setTimeout(() => node.classList.add('hidden'), 550);
    },

    fillGameOver({ score, dist, near, best, isNewBest, line }) {
      el.overScore.textContent = String(Math.floor(score));
      el.overDist.textContent = fmtDist(dist);
      el.overNear.textContent = String(near);
      el.overBest.textContent = String(Math.floor(best));
      el.overLine.textContent = line;
      el.overNewBest.classList.toggle('hidden', !isNewBest);
    },

    setEffectsLabel(high) {
      const label = `Effects: ${high ? 'High' : 'Low'}`;
      el.btnEffects.textContent = label;
      el.btnEffectsPause.textContent = label;
    },

    setMuteLabel(muted) {
      const label = `Sound: ${muted ? 'Off' : 'On'}`;
      el.btnMute.textContent = label;
      el.btnMutePause.textContent = label;
    },
  };
}
