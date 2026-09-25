// audio.js — everything you hear is synthesised live with WebAudio:
// soft pads, a music box, cicadas and evening cicadas, greenhouse motors, wind, a car,
// coins, a camera, a tin roof ticking in the sun, paper, tape, telephones.

const IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export function freq(n) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
  const midi = 12 * (parseInt(m[2], 10) + 1) + IDX[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const MOODS = {
  title: { notes: ['D3', 'A3', 'E4', 'F#4', 'B4'], gain: 0.024, cut: 900 },
  dark: { notes: [], gain: 0, cut: 400 },
  office: { notes: ['F2', 'C3', 'G3', 'A3', 'E4'], gain: 0.02, cut: 700 },
  court: { notes: ['E2', 'B2', 'F#3', 'G3'], gain: 0.018, cut: 520 },
  ledger: { notes: ['D2', 'A2', 'E3', 'F3', 'C4'], gain: 0.022, cut: 640 },
  road: { notes: ['G2', 'D3', 'A3', 'B3', 'F#4'], gain: 0.022, cut: 1100 },
  farm: { notes: ['C3', 'G3', 'D4', 'E4'], gain: 0.018, cut: 700 },
  stand: { notes: ['D3', 'A3', 'C#4', 'E4', 'B4'], gain: 0.022, cut: 1000 },
  wallet: { notes: ['A2', 'E3', 'G3', 'C4', 'D4'], gain: 0.02, cut: 600 },
  veranda: { notes: ['G2', 'D3', 'B3', 'E4', 'A4'], gain: 0.02, cut: 900 },
  logs: { notes: ['C#2', 'G#2', 'D#3', 'E3'], gain: 0.02, cut: 480 },
  kado: { notes: ['E2', 'B2', 'G3', 'D4', 'F#4'], gain: 0.022, cut: 800 },
  officials: { notes: ['F#2', 'C#3', 'G3', 'A3'], gain: 0.016, cut: 560 },
  inventory: { notes: ['D2', 'A2', 'F3', 'C4', 'E4'], gain: 0.02, cut: 620 },
  november: { notes: ['D3', 'A3', 'C4', 'E4', 'G4'], gain: 0.024, cut: 900 },
  end: { notes: ['D3', 'A3', 'E4', 'F#4', 'A4', 'C#5'], gain: 0.028, cut: 1300 },
  hush: { notes: ['D3', 'A3'], gain: 0.016, cut: 500 },
};

export const A = {
  ctx: null,
  on: true,
  voices: [],
  moodName: null,
  humNode: null,
  ks: new Map(),
  beds: {},

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = this.on ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;
    this.master.connect(comp).connect(ctx.destination);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(3.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    this.verb.connect(wet).connect(this.master);
    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    this.send = ctx.createGain();
    this.send.gain.value = 0.9;
    this.send.connect(this.verb);
    this.padBus = ctx.createGain();
    this.padBus.connect(this.master);
    const padSend = ctx.createGain();
    padSend.gain.value = 0.6;
    this.padBus.connect(padSend).connect(this.verb);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },

  impulse(sec) {
    const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * sec);
    const b = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    return b;
  },

  get live() { return !!this.ctx && this.on && this.ctx.state === 'running'; },

  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  setOn(v) {
    this.on = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.05);
  },

  mood(name) {
    if (!this.ctx || name === this.moodName) return;
    this.moodName = name;
    const ctx = this.ctx, t = ctx.currentTime;
    const m = MOODS[name] || MOODS.dark;
    for (const v of this.voices) {
      v.g.gain.cancelScheduledValues(t);
      v.g.gain.setTargetAtTime(0, t, 0.9);
      v.oscs.forEach((o) => { try { o.stop(t + 6); } catch (e) { /* already stopped */ } });
    }
    this.voices = [];
    if (!m.notes.length) return;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = m.cut;
    lp.Q.value = 0.3;
    lp.connect(this.padBus);
    for (const n of m.notes) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(lp);
      const f0 = freq(n);
      const oscs = [-5, 5].map((det) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = f0;
        o.detune.value = det;
        o.connect(g);
        o.start(t);
        return o;
      });
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + Math.random() * 0.09;
      const lg = ctx.createGain();
      lg.gain.value = m.gain * 0.3;
      lfo.connect(lg).connect(g.gain);
      lfo.start(t);
      oscs.push(lfo);
      g.gain.setTargetAtTime(m.gain, t + 0.05, 1.4);
      this.voices.push({ g, oscs });
    }
  },

  // --- ambient beds ---------------------------------------------------------
  // Each bed is a loop that fades to a level: A.bed('cicada', 0.8). level 0 = off.
  bed(name, level) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    let b = this.beds[name];
    if (!b && level > 0) b = this.beds[name] = this.makeBed(name);
    if (!b) return;
    b.g.gain.cancelScheduledValues(t);
    b.g.gain.setTargetAtTime(level * b.k, t, b.tc || 0.5);
  },
  bedsOff(except = []) {
    for (const k of Object.keys(this.beds)) if (!except.includes(k)) this.bed(k, 0);
    this.bedTarget = {};
    this.revAt = null;
  },
  // What should be sounding now: { cicada: 0.8, engine: 0.5, rev: 0.3 }. Beds not named fade out.
  // Called every frame; only changes are sent on, so seeking into a scene sets its sound right.
  setBeds(levels = {}) {
    if (!this.ctx) return;
    this.bedTarget ||= {};
    const names = new Set([...Object.keys(this.beds), ...Object.keys(levels)]);
    for (const k of names) {
      if (k === 'rev') continue;
      const v = levels[k] || 0;
      if (this.bedTarget[k] !== v) { this.bedTarget[k] = v; this.bed(k, v); }
    }
    if (levels.rev !== undefined && levels.rev !== this.revAt) { this.revAt = levels.rev; this.rev(levels.rev); }
  },

  makeBed(name) {
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(this.bus);
    const src = () => { const n = ctx.createBufferSource(); n.buffer = this.noise; n.loop = true; n.start(t, Math.random() * 1.5); return n; };
    const lfo = (fq, amt, target) => { const o = ctx.createOscillator(); o.frequency.value = fq; const lg = ctx.createGain(); lg.gain.value = amt; o.connect(lg).connect(target); o.start(t); return o; };
    const bp = (fq, q) => { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = q; return f; };
    const lp = (fq) => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fq; return f; };
    switch (name) {
      case 'cicada': {
        // aburazemi: a dense frying hiss, pulsing; far and near voices
        for (const [fq, q, rate, amp] of [[4200, 3, 38, 1], [5600, 4, 51, 0.7], [3300, 2.5, 29, 0.6]]) {
          const n = src(), f = bp(fq, q), a = ctx.createGain();
          a.gain.value = 0.5 * amp;
          lfo(rate, 0.45 * amp, a.gain);
          lfo(0.07 + Math.random() * 0.05, 0.25 * amp, a.gain);
          n.connect(f).connect(a).connect(g);
        }
        g.connect(this.send);
        return { g, k: 0.05, tc: 0.8 };
      }
      case 'minmin': {
        // a minminzemi somewhere near: a tonal call that swells and falls
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = 3900;
        lfo(9, 260, o.frequency);
        const f = bp(4000, 6), a = ctx.createGain();
        a.gain.value = 0.0;
        lfo(0.33, 0.6, a.gain);
        lfo(9, 0.35, a.gain);
        o.connect(f).connect(a).connect(g);
        o.start(t);
        g.connect(this.send);
        return { g, k: 0.03, tc: 1 };
      }
      case 'higurashi': {
        // kana-kana-kana: a bright trill that falls away, over and over
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 4400;
        lfo(7.5, 700, o.frequency);
        const a = ctx.createGain();
        a.gain.value = 0;
        lfo(7.5, 0.5, a.gain);
        lfo(0.18, 0.5, a.gain);
        const f = bp(4600, 3);
        o.connect(f).connect(a).connect(g);
        o.start(t);
        g.connect(this.send);
        return { g, k: 0.02, tc: 1.2 };
      }
      case 'motors': {
        // six greenhouses' fans and motors, a low uneven chord
        for (const [fq, a0] of [[98, 1], [117, 0.6], [147, 0.45], [196, 0.25]]) {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = fq * (1 + (Math.random() - 0.5) * 0.01);
          const a = ctx.createGain();
          a.gain.value = a0;
          lfo(0.2 + Math.random() * 0.3, a0 * 0.3, a.gain);
          o.connect(lp(420)).connect(a).connect(g);
          o.start(t);
        }
        const n = src(), f = bp(900, 0.7), a = ctx.createGain();
        a.gain.value = 0.4;
        n.connect(f).connect(a).connect(g);
        return { g, k: 0.012, tc: 0.6 };
      }
      case 'wind': {
        const n = src(), f = lp(520), a = ctx.createGain();
        a.gain.value = 0.6;
        lfo(0.11, 0.4, a.gain);
        lfo(0.043, 0.3, f.frequency);
        n.connect(f).connect(a).connect(g);
        return { g, k: 0.05, tc: 1 };
      }
      case 'room': {
        // a room's air, and traffic far off
        const n = src(), f = lp(300), a = ctx.createGain();
        a.gain.value = 0.7;
        lfo(0.05, 0.25, a.gain);
        n.connect(f).connect(a).connect(g);
        return { g, k: 0.03, tc: 0.6 };
      }
      case 'engine': {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = 42;
        const o2 = ctx.createOscillator();
        o2.type = 'square';
        o2.frequency.value = 84.5;
        const f = lp(240), a = ctx.createGain();
        a.gain.value = 0.8;
        lfo(3.1, 0.12, a.gain);
        o.connect(f); o2.connect(f);
        f.connect(a).connect(g);
        const n = src(), nf = bp(500, 0.6), na = ctx.createGain();
        na.gain.value = 0.35;
        n.connect(nf).connect(na).connect(g);
        o.start(t); o2.start(t);
        this.engineOsc = [o, o2];
        return { g, k: 0.05, tc: 0.4 };
      }
      case 'copier': {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 180;
        const n = src(), f = bp(2400, 1.4), a = ctx.createGain();
        a.gain.value = 0.3;
        lfo(1.6, 0.25, a.gain);
        o.connect(lp(600)).connect(g);
        n.connect(f).connect(a).connect(g);
        o.start(t);
        return { g, k: 0.012, tc: 0.3 };
      }
      case 'fluor': {
        // a fluorescent tube's hum
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = 100;
        o.connect(bp(1200, 3)).connect(g);
        o.start(t);
        return { g, k: 0.01, tc: 0.2 };
      }
      default:
        return { g, k: 0 };
    }
  },
  // the engine's pitch follows the road (0 idle .. 1 climbing)
  rev(v) {
    if (!this.engineOsc) return;
    const t = this.ctx.currentTime;
    this.engineOsc[0].frequency.setTargetAtTime(38 + v * 26, t, 0.3);
    this.engineOsc[1].frequency.setTargetAtTime(77 + v * 52, t, 0.3);
  },

  // --- one-shots -------------------------------------------------------------
  tap(v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400 + Math.random() * 1600;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22 * v, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0006, t + 0.075);
    src.connect(bp).connect(g).connect(this.bus);
    src.start(t, Math.random() * 1.8, 0.1);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.07);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.1 * v, t);
    og.gain.exponentialRampToValueAtTime(0.0006, t + 0.09);
    o.connect(og).connect(this.bus);
    o.start(t);
    o.stop(t + 0.12);
  },

  // a key on the keyboard (a few per frame when typing fast)
  key(v = 1, delay = 0) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600 + Math.random() * 2400;
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1 * v, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.035);
    src.connect(bp).connect(g).connect(this.bus);
    src.start(t, Math.random() * 1.8, 0.05);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(420 + Math.random() * 120, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.03);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.035 * v, t);
    og.gain.exponentialRampToValueAtTime(0.0005, t + 0.04);
    o.connect(og).connect(this.bus);
    o.start(t);
    o.stop(t + 0.05);
  },
  typing(frames = 1, v = 1) {
    // a burst of keys spread over this frame
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n * frames; i++) this.key(v * (0.6 + Math.random() * 0.4), Math.random() * 0.08 * frames);
  },

  rustle(dur = 0.4, v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 0.5;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    for (let s = 0; s < dur; s += 0.028) {
      const env = Math.sin(Math.PI * Math.min(1, s / dur));
      g.gain.setValueAtTime(0.12 * v * env * (0.25 + Math.random() * 0.75), t + s);
    }
    g.gain.setValueAtTime(0, t + dur);
    src.connect(bp).connect(hp).connect(g).connect(this.bus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  },

  // plastic crinkling (a bag picked up, a bag put back)
  crinkle(dur = 0.5, v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (let s = 0; s < dur; s += 0.02 + Math.random() * 0.05) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 4000 + Math.random() * 5000;
      bp.Q.value = 2.5;
      const g = ctx.createGain();
      const a = 0.05 * v * (0.3 + Math.random());
      g.gain.setValueAtTime(0, t + s);
      g.gain.linearRampToValueAtTime(a, t + s + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0004, t + s + 0.03);
      src.connect(bp).connect(g).connect(this.bus);
      src.start(t + s, Math.random() * 1.8, 0.04);
    }
  },

  click() {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.018);
    src.connect(hp).connect(g).connect(this.bus);
    src.start(t, Math.random(), 0.03);
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 1900;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.03, t);
    og.gain.exponentialRampToValueAtTime(0.0005, t + 0.02);
    o.connect(og).connect(this.bus);
    o.start(t);
    o.stop(t + 0.03);
  },

  // the clock on the wall
  tick(v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 3100;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.03 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 0.012);
    o.connect(bp).connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.02);
  },

  // a neon tube catching (buzz + tick)
  neon(v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.click();
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 120;
    const lp = ctx.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.value = 600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.016 * v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 0.35);
    o.connect(lp).connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.4);
  },

  drip(v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1300 + Math.random() * 300, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03 * v, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 0.07);
    o.connect(g);
    g.connect(this.bus);
    g.connect(this.send);
    o.start(t);
    o.stop(t + 0.09);
  },
  stamp(v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0006, t + 0.18);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.2);
    this.tap(0.7 * v);
  },

  // A small music-box / celesta note.
  bell(note, v = 0.1, delay = 0) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime + delay, f = freq(note);
    const out = ctx.createGain();
    out.gain.value = v;
    out.connect(this.bus);
    out.connect(this.send);
    [[1, 1, 2.2], [2, 0.22, 1.2], [2.76, 0.12, 0.7], [5.4, 0.05, 0.35]].forEach(([mul, a, dec]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mul;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dec);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dec + 0.05);
    });
  },

  // A plucked string (Karplus-Strong, rendered once per pitch).
  pluck(note, v = 0.25) {
    if (!this.live) return;
    const ctx = this.ctx;
    let buf = this.ks.get(note);
    if (!buf) {
      const sr = ctx.sampleRate, f = freq(note), N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * 2.2);
      buf = ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      const ring = new Float32Array(N);
      let prev = 0;
      for (let i = 0; i < N; i++) { prev = prev * 0.5 + (Math.random() * 2 - 1) * 0.5; ring[i] = prev; }
      let idx = 0;
      for (let i = 0; i < len; i++) {
        const a = ring[idx], b = ring[(idx + 1) % N];
        d[i] = a;
        ring[idx] = (a + b) * 0.5 * 0.996;
        idx = (idx + 1) % N;
      }
      this.ks.set(note, buf);
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.value = v;
    src.connect(lp).connect(g);
    g.connect(this.bus);
    g.connect(this.send);
    src.start(t);
  },

  chime(notes, v = 0.08, spacing = 0.09) {
    notes.forEach((n, i) => this.bell(n, v, i * spacing));
  },

  // a short burst of filtered noise (the building block of many small sounds)
  burst(fq, q, v, dur, delay = 0, type = 'bandpass') {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = fq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random() * 1.5, dur + 0.05);
  },
  tone(fq, v, dur, delay = 0, type = 'sine', to = null) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(fq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  },

  // a greenhouse vent's motor stopping: カタン
  clunk(v = 1) {
    this.burst(900, 1.2, 0.12 * v, 0.06);
    this.tone(140, 0.12 * v, 0.12, 0, 'triangle', 60);
    this.burst(2400, 2, 0.05 * v, 0.04, 0.07);
  },
  // the vent motor running (a grinding whirr)
  whirr(dur = 0.8, v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 62;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.02 * v, t + 0.1);
    g.gain.setValueAtTime(0.02 * v, t + dur - 0.1);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f).connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  // drip irrigation: a long breath of hiss
  hiss(dur = 1.2, v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03 * v, t + 0.25);
    g.gain.setValueAtTime(0.03 * v, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  },
  // coins into the cash box: each strikes metal, then settles
  coin(v = 1, delay = 0) {
    const f0 = 2600 + Math.random() * 900;
    for (const [m, a, d] of [[1, 0.05, 0.25], [2.76, 0.02, 0.15], [5.4, 0.012, 0.08]]) this.tone(f0 * m, a * v, d, delay);
    this.burst(5000, 2, 0.04 * v, 0.03, delay);
    this.tone(420, 0.03 * v, 0.1, delay + 0.05, 'triangle', 200);
  },
  // coins sliding inside a heavy box
  coins(v = 1) {
    for (let i = 0; i < 7; i++) this.burst(3000 + Math.random() * 3000, 3, 0.03 * v * (1 - i / 8), 0.05, i * 0.035);
    this.tone(180, 0.05 * v, 0.2, 0, 'triangle', 90);
  },
  // a phone camera
  shutter(v = 1) {
    this.burst(3800, 1, 0.12 * v, 0.03);
    this.burst(2400, 1, 0.1 * v, 0.05, 0.07);
  },
  // the tin roof expanding in the sun: パン
  tin(v = 1) {
    this.burst(1800, 0.8, 0.16 * v, 0.07);
    for (const [fq, a, d] of [[410, 0.03, 0.4], [587, 0.02, 0.3], [913, 0.012, 0.2]]) this.tone(fq, a * v, d, 0.005, 'triangle');
  },
  // a car door, a boot on gravel
  door(v = 1) {
    this.tone(90, 0.14 * v, 0.18, 0, 'triangle', 50);
    this.burst(700, 0.8, 0.12 * v, 0.1);
    this.burst(2600, 2, 0.05 * v, 0.05, 0.02);
  },
  gravel(v = 1) {
    for (let i = 0; i < 4; i++) this.burst(1800 + Math.random() * 2400, 1.2, 0.035 * v, 0.05, i * 0.02 + Math.random() * 0.02);
  },
  step(v = 1) { this.burst(500, 0.8, 0.05 * v, 0.06); },
  // a vehicle going past (a swell and a fall)
  pass(v = 1, dur = 2.2) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(300, t);
    f.frequency.linearRampToValueAtTime(1400, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(300, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09 * v, t + dur * 0.5);
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  },
  // telephones: the ring back tone, the station's chime, the line going dead
  ringback(v = 1) { this.tone(400, 0.02 * v, 0.9, 0, 'sine'); this.tone(416, 0.014 * v, 0.9, 0, 'sine'); },
  station(v = 1) { ['E5', 'C5', 'G4', 'C5'].forEach((n, i) => this.bell(n, 0.03 * v, i * 0.28)); },
  busy(v = 1) { for (let i = 0; i < 3; i++) this.tone(400, 0.018 * v, 0.45, i * 0.9, 'sine'); },
  // a ballpoint's click
  knock(v = 1) { this.burst(4200, 3, 0.08 * v, 0.015); this.burst(2200, 3, 0.06 * v, 0.02, 0.05); },
  // packing tape pulled off the roll
  tape(dur = 0.7, v = 1) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(1600, t + dur);
    f.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    for (let s = 0; s < dur; s += 0.012) g.gain.setValueAtTime(0.06 * v * (0.5 + Math.random() * 0.5), t + s);
    g.gain.setValueAtTime(0, t + dur);
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  },
  // a page turning
  page(v = 1) { this.rustle(0.25, 0.6 * v); this.burst(1200, 0.7, 0.04 * v, 0.12, 0.12); },
  // a calculator key
  calc(v = 1) { this.tone(2800, 0.012 * v, 0.03, 0, 'square'); this.burst(3500, 2, 0.03 * v, 0.015); },
  // a small bird
  bird(v = 1) {
    const f0 = 3200 + Math.random() * 1400;
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.tone(f0 * (1 + i * 0.06), 0.012 * v, 0.07, i * 0.09, 'sine', f0 * 1.3);
  },
  // a wind chime under the eaves
  furin(v = 1) {
    const f0 = 2900 + Math.random() * 300;
    for (const [m, a, d] of [[1, 0.035, 1.6], [2.4, 0.012, 0.9], [4.1, 0.006, 0.5]]) this.tone(f0 * m, a * v, d, 0, 'sine');
  },
  // a glass set down on a wooden board
  glass(v = 1) { this.tone(1800, 0.02 * v, 0.18, 0, 'sine'); this.tone(240, 0.05 * v, 0.08, 0, 'triangle', 120); },
  // the music box that belongs to the farm
  motif(v = 0.06, delay = 0, which = 0) {
    const M = [
      ['D5', 'F#5', 'A5', 'B5', 'A5', 'F#5', 'E5'],
      ['A4', 'D5', 'E5', 'F#5', 'E5', 'D5', 'B4', 'D5'],
      ['F#5', 'E5', 'D5', 'A4', 'B4', 'D5'],
    ][which];
    M.forEach((n, i) => this.bell(n, v * (i === M.length - 1 ? 0.8 : 1), delay + i * 0.34));
  },
};
