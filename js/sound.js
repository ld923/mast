// Mast sound: WebAudio-synthesised SFX, no files. play(name), setMuted(bool), isMuted().
// names: move capture check tick heartbeat success fail brilliant
let ctx = null, master = null, noiseBuf = null, muted = false;
try { muted = localStorage.getItem('mast.muted') === '1'; } catch (_) { }
function ac() {
  if (ctx) return ctx;
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
  ctx = new C(); master = ctx.createGain(); master.gain.value = .8;
  const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
function unlock() { const c = ac(); if (c && c.state !== 'running') c.resume().catch(() => { }); }
['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => addEventListener(ev, unlock, { passive: true, capture: true }));
export function setMuted(m) { muted = !!m; try { localStorage.setItem('mast.muted', muted ? '1' : '0'); } catch (_) { } }
export const isMuted = () => muted;
// building blocks
function env(g, t, a, peak, d) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(t, f0, f1, dur, peak, type = 'sine', dest) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, .003, peak, dur); o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + .05); return g;
}
function noise(t, dur, freq, q, peak, type = 'bandpass') {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  env(g, t, .002, peak, dur); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .2); s.stop(t + dur + .05);
}
function sax(t, midi, dur, vel = .5, slideFrom) {
  const f = 440 * Math.pow(2, (midi - 69) / 12), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = 6;
  const f0 = slideFrom ? 440 * Math.pow(2, (slideFrom - 69) / 12) : f;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f, t + .06); o2.frequency.setValueAtTime(f0, t); o2.frequency.exponentialRampToValueAtTime(f, t + .06);
  lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + dur * .7); lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(f * 2, t); bp.frequency.linearRampToValueAtTime(f * 4.5, t + .08); bp.frequency.linearRampToValueAtTime(f * 3, t + dur);
  lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = .7;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + .025); g.gain.setValueAtTime(vel * .8, t + dur * .6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const m2 = ctx.createGain(); m2.gain.value = .35; o.connect(bp); o2.connect(m2); m2.connect(bp); bp.connect(lp); lp.connect(g); g.connect(master);
  [o, o2, lfo].forEach(n => { n.start(t); n.stop(t + dur + .05); });
  noise(t, .08, f * 5, 1, vel * .12);
}
const S = {
  move(t) { tone(t, 220, 95, .07, .55, 'sine'); noise(t, .035, 1500, 1.2, .35); },
  capture(t) { tone(t, 150, 52, .13, .8, 'sine'); tone(t, 300, 110, .06, .3, 'triangle'); noise(t, .07, 900, .8, .55); },
  check(t) { tone(t, 1800, 1300, .05, .28, 'triangle'); noise(t, .025, 3500, 2, .35); tone(t + .005, 200, 100, .06, .35); },
  tick(t) { tone(t, 2200, 2000, .03, .18, 'sine'); },
  heartbeat(t) { tone(t, 75, 42, .13, .9, 'sine'); tone(t + .17, 65, 38, .16, .65, 'sine'); },
  success(t) { [84, 88, 91, 96].forEach((m, i) => { const f = 440 * Math.pow(2, (m - 69) / 12); tone(t + i * .07, f, f, .55, .22, 'sine'); tone(t + i * .07, f * 2.01, f * 2.01, .3, .06, 'sine'); }); },
  fail(t) { const g = tone(t, 110, 38, .35, .9, 'sawtooth'); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; g.disconnect(); g.connect(lp); lp.connect(master); noise(t, .12, 400, .7, .4); },
  drums(t) { // war drums: accelerating toms, then one big hit
    const hit = (dt, f, g) => { tone(t + dt, f, f * .5, .3, g, 'sine'); tone(t + dt, f * 2.1, f, .08, g * .3, 'triangle'); noise(t + dt, .1, 240, .8, g * .55); };
    [0, .42, .84, 1.1, 1.34, 1.56, 1.74, 1.9].forEach((dt, i) => hit(dt, i % 2 ? 92 : 128, .55 + i * .04)); hit(2.15, 62, 1); tone(t + 2.15, 48, 30, 1.4, .8, 'sine'); noise(t + 2.15, .9, 160, .5, .45);
  },
  brilliant(t) { sax(t, 62, .17, .5); sax(t + .17, 65, .17, .5); sax(t + .34, 69, .55, .6, 66); },
};
export function play(name) {
  if (muted || !S[name]) return;
  const c = ac(); if (!c) return;
  if (c.state !== 'running') { c.resume().catch(() => { }); return; } // locked until first gesture
  try { S[name](c.currentTime + .005); } catch (_) { }
}

/* ---- ambient sea: waves (filtered brown noise with slow swells), soft hull creaks, distant gulls. Very quiet, fades in/out,
   pauses when the tab is hidden. ambient(on, weather?) ; weather 'storm' = bigger swell and more creaks. ---- */
let A = null, ambWanted = false, ambWx = 'fair';
const AMB_VOL = .055;
function brown(sec) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0); let l = 0;
  for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.2; }
  return b;
}
function ambStart() {
  const c = ac(); if (!c || A || muted) return;
  if (c.state !== 'running') return; // waits for the first gesture (unlock calls ambKick)
  const out = c.createGain(); out.gain.value = 0; out.connect(c.destination);
  const buf = brown(6), mk = (freq, type, lfoHz, depth, base) => {
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = 0; s.loopEnd = 6;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = .4;
    const g = c.createGain(); g.gain.value = base; const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfoHz; lg.gain.value = depth; l.connect(lg); lg.connect(g.gain);
    s.connect(f); f.connect(g); g.connect(out); s.start(c.currentTime, Math.random() * 5); l.start(); return [s, l];
  };
  const storm = ambWx === 'storm';
  const nodes = [...mk(420, 'lowpass', storm ? .13 : .08, .45, .7), ...mk(1400, 'bandpass', storm ? .17 : .11, .25, .3)];
  A = { out, nodes, timers: [] };
  out.gain.linearRampToValueAtTime(AMB_VOL * (storm ? 1.4 : 1), c.currentTime + 3);
  const loop = (fn, lo, hi) => { const go = () => { if (!A) return; if (!document.hidden) fn(); A.timers.push(setTimeout(go, (lo + Math.random() * (hi - lo)) * 1000)); }; A.timers.push(setTimeout(go, lo * 1000)); };
  loop(creak, storm ? 4 : 9, storm ? 9 : 22);
  if (!storm) loop(gulls, 14, 34);
}
function creak() {
  const c = ctx, t = c.currentTime + .05, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(70 + Math.random() * 30, t); o.frequency.linearRampToValueAtTime(110 + Math.random() * 40, t + .5);
  f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 9; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .2); g.gain.linearRampToValueAtTime(0, t + .7);
  o.connect(f); f.connect(g); g.connect(A.out); o.start(t); o.stop(t + .8);
}
function gulls() {
  const c = ctx, n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const t = c.currentTime + .05 + i * (.28 + Math.random() * .1), o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), p = .9 + Math.random() * .25;
    o.type = 'triangle'; o.frequency.setValueAtTime(1300 * p, t); o.frequency.linearRampToValueAtTime(2100 * p, t + .07); o.frequency.exponentialRampToValueAtTime(1000 * p, t + .24);
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 2; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + .26);
    o.connect(f); f.connect(g); g.connect(A.out); o.start(t); o.stop(t + .3);
  }
}
function ambStop(fade = 1.5) {
  if (!A) return; const a = A; A = null; a.timers.forEach(clearTimeout);
  const t = ctx.currentTime; a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(a.out.gain.value, t); a.out.gain.linearRampToValueAtTime(0, t + fade);
  setTimeout(() => { a.nodes.forEach(n => { try { n.stop(); } catch (_) { } }); a.out.disconnect(); }, fade * 1000 + 100);
}
function ambKick() { if (ambWanted && !A && !document.hidden) ambStart(); }
['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, () => setTimeout(ambKick, 60), { passive: true }));
document.addEventListener('visibilitychange', () => { if (document.hidden) ambStop(.4); else ambKick(); });
export function ambient(on, wx) {
  if (wx && wx !== ambWx) { ambWx = wx; if (A) { ambStop(.8); } }
  ambWanted = !!on; try { localStorage.setItem('mast.amb', on ? '1' : '0'); } catch (_) { }
  if (on) ambKick(); else ambStop();
}
export const ambientOn = () => { try { return localStorage.getItem('mast.amb') === '1'; } catch (_) { return false; } };

/* ---- secrets layer: extra synthesized voices (aria, sax riff, squawk, thunder, drum kit) ---- */
function voice(t, midi, dur, vel = .25) { // operatic soprano-ish: vibrato, two formants, slow swell
  const f = 440 * Math.pow(2, (midi - 69) / 12), o = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), mix = ctx.createGain();
  o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.003; lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .018, t + dur * .6); lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  f1.type = 'bandpass'; f1.frequency.value = 800; f1.Q.value = 3; f2.type = 'bandpass'; f2.frequency.value = 1250; f2.Q.value = 4; mix.gain.value = .6;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + Math.min(.18, dur * .4)); g.gain.setValueAtTime(vel * .9, t + dur * .7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f1); o.connect(f2); o2.connect(mix); mix.connect(g); f1.connect(g); f2.connect(g); g.connect(master);
  [o, o2, lfo].forEach(n => { n.start(t); n.stop(t + dur + .05); });
}
Object.assign(S, {
  aria(t) { [[69, .5], [72, .45], [76, 1], [74, .4], [72, .4], [71, .55], [69, 1.5], [76, .5], [79, .5], [81, 1.6]].reduce((a, [m, d]) => { voice(t + a, m, d * 1.05); return a + d * .95; }, 0); [45, 52].forEach((m, i) => tone(t + i * 1.4, 440 * Math.pow(2, (m - 69) / 12), 440 * Math.pow(2, (m - 69) / 12), 3.4, .05, 'sine')); },
  saxriff(t) { [[65, .22], [68, .22], [72, .45], [70, .22], [68, .22], [65, .45], [63, .22], [65, 1.0]].reduce((a, [m, d]) => { sax(t + a, m, d, .42, a > 0 ? m - 2 : 0); return a + d * 1.02; }, 0); },
  squawk(t) { tone(t, 700, 1500, .09, .5, 'sawtooth'); tone(t + .11, 1500, 600, .12, .5, 'sawtooth'); tone(t + .26, 900, 1700, .08, .4, 'sawtooth'); noise(t, .3, 2200, 1.5, .25); },
  thunder(t) { noise(t, .05, 6000, .6, 1, 'highpass'); noise(t + .02, 1.6, 140, .5, .8, 'lowpass'); tone(t + .05, 70, 30, 1.2, .7, 'sine'); },
  kick(t) { tone(t, 140, 42, .22, .95, 'sine'); },
  snare(t) { noise(t, .14, 2200, .7, .5); tone(t, 210, 150, .09, .4, 'triangle'); },
  hat(t) { noise(t, .05, 7500, 1.2, .22, 'highpass'); },
  rim(t) { tone(t, 1100, 900, .04, .35, 'square'); },
  fanfare(t) { [[72, 0], [76, .12], [79, .24], [84, .38]].forEach(([m, d]) => { const f = 440 * Math.pow(2, (m - 69) / 12); tone(t + d, f, f, .5, .2, 'triangle'); tone(t + d, f * 2, f * 2, .3, .05, 'sine'); }); },
});
/* schedule a named sound dt seconds from now (rhythm game); returns audio-clock time, or null when muted/locked */
export function playAt(name, dt = 0) { if (muted || !S[name]) return null; const c = ac(); if (!c) return null; if (c.state !== 'running') { c.resume().catch(() => { }); return null; } try { S[name](c.currentTime + Math.max(.002, dt)); } catch (_) { } return c.currentTime + dt; }
export const clockNow = () => { const c = ac(); return c ? c.currentTime : performance.now() / 1000; };
