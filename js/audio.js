// Audio — WebAudio synth only, no files. A low engine hum that follows
// speed, a blip for a near miss, a noise thud for a crash. The context is
// created lazily on the first user gesture (browser autoplay rules).

export function createAudio() {
  let ctx = null;
  let master = null;
  let engineOsc = null;
  let engineSub = null;
  let engineFilter = null;
  let engineGain = null;
  let muted = localStorage.getItem('nightTougeMuted') === '1';

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);

    engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 420;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 52;
    engineSub = ctx.createOscillator();
    engineSub.type = 'square';
    engineSub.frequency.value = 26;
    engineOsc.connect(engineFilter);
    engineSub.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(master);
    engineOsc.start();
    engineSub.start();
    return true;
  }

  // speedNorm: 0..1, running: whether the engine should be audible.
  function setEngine(speedNorm, running) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const freq = 50 + speedNorm * 115;
    engineOsc.frequency.setTargetAtTime(freq, t, 0.08);
    engineSub.frequency.setTargetAtTime(freq / 2, t, 0.08);
    engineFilter.frequency.setTargetAtTime(380 + speedNorm * 950, t, 0.1);
    engineGain.gain.setTargetAtTime(running ? 0.045 + speedNorm * 0.03 : 0, t, 0.15);
  }

  function blip() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, t);
    osc.frequency.exponentialRampToValueAtTime(1180, t + 0.09);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  function crash() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1300, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + 0.38);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(muted ? 0 : 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
    setEngine(0, false);
  }

  function setMuted(m) {
    muted = m;
    localStorage.setItem('nightTougeMuted', m ? '1' : '0');
    if (master && ctx) {
      master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.03);
    }
  }

  return {
    ensure,
    setEngine,
    blip,
    crash,
    setMuted,
    isMuted: () => muted,
  };
}
