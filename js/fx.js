// Mast FX: animation settings, particles (one pooled canvas), shake, floating numbers, combo, wash, count-up, haptics,
// character celebrations, ambient background, card tilt. Everything honours Animations Full / Reduced / Off.
import { EYE } from './portraits.js';
import { play } from './sound.js';

const LS = {
  get(k, d) { try { const v = localStorage.getItem('mast.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mast.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
};
const osReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
let mode = LS.get('anim', null);
if (mode !== 'full' && mode !== 'reduced' && mode !== 'off') mode = osReduced() ? 'reduced' : 'full';
let haptics = LS.get('haptics', true) !== false;
export const getAnim = () => mode;
export const full = () => mode === 'full';
export const getHaptics = () => haptics;
export function setHaptics(on) { haptics = !!on; LS.set('haptics', haptics); }
export function setAnim(m) {
  mode = m; LS.set('anim', m); document.documentElement.dataset.anim = m;
  if (m !== 'full') { clearParticles(); ambient(false); } else ambient(true);
}
document.documentElement.dataset.anim = mode;
export function buzz(p) { if (haptics && mode !== 'off' && navigator.vibrate && navigator.userActivation?.hasBeenActive) { try { navigator.vibrate(p); } catch (e) { } } }
const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

/* ---------- particles: one overlay canvas, pool of 150, rAF only while something is alive ---------- */
const MAX = 150, pool = Array.from({ length: MAX }, () => ({ on: false }));
let cv = null, cx = null, raf = 0, last = 0, W = 0, H = 0, dpr = 1;
const FLAGS = [['#D23B2E', '#fff', 'h'], ['#FFC857', '#14233A', 'x'], ['#2FA3B4', '#fff', 'v'], ['#fff', '#D23B2E', 'c'], ['#14233A', '#FFC857', 's'], ['#3FB37F', '#fff', 'h'], ['#C23B6E', '#fff', 'x']];
function ensureCanvas() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.id = 'fx'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
  document.body.appendChild(cv); cx = cv.getContext('2d'); size();
  addEventListener('resize', size);
}
function size() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
function spawn(o) {
  for (let i = 0; i < MAX; i++) { const p = pool[i]; if (!p.on) { Object.assign(p, { on: true, rot: 0, vr: 0, g: 0, drag: .99, shape: 'dot', glow: 0 }, o, { age: 0 }); return p; } }
  return null;
}
function clearParticles() { pool.forEach(p => p.on = false); if (cx) cx.clearRect(0, 0, W, H); cancelAnimationFrame(raf); raf = 0; }
function loop(t) {
  const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; let alive = 0;
  cx.clearRect(0, 0, W, H);
  for (let i = 0; i < MAX; i++) {
    const p = pool[i]; if (!p.on) continue;
    p.age += dt; if (p.age >= p.life) { p.on = false; continue; }
    alive++; p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    const k = 1 - p.age / p.life; cx.globalAlpha = Math.min(1, k * 1.6);
    if (p.shape === 'flag') {
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); const [a, b, pat] = p.fl, w = p.s * 1.5, h = p.s;
      cx.fillStyle = a; cx.fillRect(-w / 2, -h / 2, w, h); cx.fillStyle = b;
      if (pat === 'h') cx.fillRect(-w / 2, -h / 2, w, h / 2); else if (pat === 'v') cx.fillRect(-w / 2, -h / 2, w / 2, h);
      else if (pat === 'x') { cx.fillRect(-w / 2, -h * .16, w, h * .32); cx.fillRect(-w * .12, -h / 2, w * .24, h); }
      else if (pat === 'c') { cx.beginPath(); cx.arc(0, 0, h * .3, 0, 7); cx.fill(); } else cx.fillRect(-w / 2, -h / 2, w / 3, h);
      cx.restore();
    } else {
      cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.s * (p.shrink ? k : 1), 0, 7); cx.fill();
      if (p.glow) { cx.globalAlpha *= .3; cx.beginPath(); cx.arc(p.x, p.y, p.s * 2.4, 0, 7); cx.fill(); }
    }
  }
  cx.globalAlpha = 1;
  raf = alive ? requestAnimationFrame(loop) : 0;
  if (!alive) cx.clearRect(0, 0, W, H);
}
const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
const R = (a, b) => a + Math.random() * (b - a);
/* kind: 'spark' amber burst (solve) | 'spray' sea spray (capture) */
export function burst(kind, x, y) {
  if (!full() || document.hidden) return; ensureCanvas();
  if (kind === 'spark') for (let i = 0; i < 30; i++) { const a = R(0, 6.283), v = R(90, 340); spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 380, drag: .965, life: R(.5, 1), s: R(1.6, 3.6), c: Math.random() < .3 ? '#fff3c4' : '#FFC857', glow: 1, shrink: 1 }); }
  else for (let i = 0; i < 22; i++) { const a = R(-2.9, -.25), v = R(80, 260); spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 620, drag: .985, life: R(.45, .85), s: R(1.4, 3.2), c: Math.random() < .5 ? '#DDF3FF' : '#8CC9E6', shrink: 1 }); }
  kick();
}
/* nautical signal-flag confetti: level 1 (streak 5) or 2 (streak 10) */
export function confetti(level = 1) {
  if (!full() || document.hidden) return; ensureCanvas();
  const n = level > 1 ? 56 : 34;
  for (let i = 0; i < n; i++) spawn({ shape: 'flag', fl: FLAGS[i % FLAGS.length], x: R(W * .1, W * .9), y: R(-30, H * .15), vx: R(-60, 60), vy: R(60, 220), g: 140, drag: .992, life: R(1.6, 2.6), s: R(8, 13), rot: R(0, 6), vr: R(-5, 5) });
  kick();
}
export const sparkAt = (el) => { const [x, y] = centre(el); burst('spark', x, y); };
export const sprayAt = (el) => { const [x, y] = centre(el); burst('spray', x, y); };

/* ---------- shake, floating numbers, wash, combo ---------- */
export function shake(el) {
  if (!full() || !el || !el.animate) return;
  el.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-5px,2px)' }, { transform: 'translate(5px,-2px)' }, { transform: 'translate(-4px,-1px)' }, { transform: 'translate(3px,2px)' }, { transform: 'translate(-1px,0)' }, { transform: 'translate(0,0)' }], { duration: 250, easing: 'ease-out' });
}
export function floatText(text, cls, x, y) {
  if (mode === 'off') return;
  const d = document.createElement('div'); d.className = 'fx-num ' + cls; d.textContent = text; d.setAttribute('aria-hidden', 'true');
  d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d);
  const move = full() ? 'translate(-50%,-90px)' : 'translate(-50%,-50%)';
  const a = d.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.7)' }, { opacity: 1, transform: 'translate(-50%,-70%) scale(1.12)', offset: .18 }, { opacity: 0, transform: move + ' scale(1)' }], { duration: full() ? 1150 : 900, easing: 'ease-out' });
  a.onfinish = () => d.remove();
}
export const floatAt = (el, text, cls) => { if (el) { const [x, y] = centre(el); floatText(text, cls, x, y); } };
export function wash() {
  if (!full()) return;
  const d = document.createElement('div'); d.className = 'fx-wash'; d.setAttribute('aria-hidden', 'true'); document.body.appendChild(d);
  const a = d.animate([{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], { duration: 520, easing: 'ease-in-out' }); a.onfinish = () => d.remove();
}
/* combo chip: n>=3 shows "n× COMBO", tier 3/5/10 sets the glow */
export function combo(el, n) {
  if (!el) return;
  if (el._n === n) return; el._n = n;
  if (n < 3) { el.classList.remove('on'); return; }
  const tier = n >= 10 ? 10 : n >= 5 ? 5 : 3; el.className = 'combo on t' + tier; el.textContent = `${n}× COMBO`;
  if (full() && el.animate) el.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'cubic-bezier(.34,1.56,.64,1)' });
}

/* ---------- number count-up ("1,234", "63%", "4.2s") ---------- */
const NUM = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/;
export function countUp(el, text, ms = 700) {
  text = String(text); const m = NUM.exec(text);
  cancelAnimationFrame(el._cu || 0);
  const from = el._cv != null ? el._cv : 0;
  if (!m || !full()) { el.textContent = text; if (m) el._cv = parseFloat(m[2].replace(/,/g, '')); return; }
  const to = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, sep = m[2].includes(','), t0 = performance.now();
  if (from === to) { el.textContent = text; return; }
  const fmt = v => { let s = v.toFixed(dec); if (sep) { const [a, b] = s.split('.'); s = a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); } return m[1] + s + m[3]; };
  const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) el._cu = requestAnimationFrame(step); else { el.textContent = text; el._cv = to; } };
  el._cv = to; el._cu = requestAnimationFrame(step);
}
export function countAll(root = document) { root.querySelectorAll('.tile .led, .led.big').forEach(el => { if (!el.dataset.cu) { el.dataset.cu = 1; countUp(el, el.textContent); } }); }

/* ---------- portrait life: blink overlay, plus per-character celebrations ---------- */
export function blinkHTML(name, ex) {
  const E = EYE[name]; if (!E || (name === 'Skipper' && ex === 'excited')) return '';
  const d = -(Math.random() * 6).toFixed(2);
  return E.xs.map(x => `<i class="bl" style="left:${x}%;top:${E.y}%;width:${E.w}%;height:${E.h}%;background:${E.skin};animation-delay:${d}s"></i>`).join('');
}
const NOTE = '<span style="--x:-14px;--d:0s">♪</span><span style="--x:6px;--d:.25s">♫</span><span style="--x:20px;--d:.5s">♪</span>';
const HAT = '<svg class="hat" viewBox="0 0 24 24"><path d="M5 17h14v2H5zM8 17V6h8v11z" fill="#14233A"/><path d="M8 14h8v2H8z" fill="#C23B6E"/></svg>';
const SPK = '<i class="sp" style="--x:-22px;--y:-14px"></i><i class="sp" style="--x:24px;--y:-10px;--d:.12s"></i><i class="sp" style="--x:2px;--y:-30px;--d:.22s"></i>';
const OV = {
  Tal: HAT + SPK, Kasparov: '<i class="ln" style="--r:-50deg"></i><i class="ln" style="--r:0deg"></i><i class="ln" style="--r:50deg"></i>',
  Carlsen: '', Tempo: '<i class="mo" style="--s:-1"></i><i class="mo" style="--s:1"></i>', Skipper: NOTE, Gerald: NOTE, Capablanca: '', Morphy: HAT, Leela: '<i class="rg"></i>'
};
/* f: the .f/.av host with a .pv and .ov child. Plays the character's signature celebration. */
export function celebrate(f, name, { sound = true } = {}) {
  if (!f || !full()) return;
  const ov = f.querySelector('.ov'); if (!ov) return;
  f.classList.remove('cel'); void f.offsetWidth; f.dataset.cel = name; f.classList.add('cel'); ov.innerHTML = OV[name] || '';
  if (sound && (name === 'Skipper' || name === 'Gerald')) play('brilliant');
  clearTimeout(f._ct); f._ct = setTimeout(() => { f.classList.remove('cel'); ov.innerHTML = ''; }, 1500);
}

/* ---------- ambient background: drifting floodlight + a few motes; CSS-only motion, paused when hidden ---------- */
let amb = null;
function ambient(on) {
  const st = document.getElementById('stage'); if (!st) return;
  if (!on) { if (amb) { amb.remove(); amb = null; } return; }
  if (amb) return;
  amb = document.createElement('div'); amb.className = 'amb'; amb.setAttribute('aria-hidden', 'true');
  const n = innerWidth < 700 ? 8 : 14;
  amb.innerHTML = '<b class="flood"></b>' + Array.from({ length: n }, () => `<i style="left:${R(2, 98).toFixed(1)}%;top:${R(10, 100).toFixed(1)}%;--s:${R(1.5, 3).toFixed(1)}px;--t:${R(14, 30).toFixed(1)}s;--dl:-${R(0, 20).toFixed(1)}s;--dx:${R(-30, 30).toFixed(0)}px"></i>`).join('');
  st.appendChild(amb);
}
document.addEventListener('visibilitychange', () => { document.documentElement.classList.toggle('tabhid', document.hidden); if (document.hidden) clearParticles(); });

/* ---------- card tilt: mouse only, max 4deg ---------- */
let tiltEl = null, tiltRaf = 0;
function tilt() {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !full()) return;
    const c = e.target.closest && e.target.closest('.card.link');
    if (tiltEl && tiltEl !== c) { tiltEl.style.removeProperty('--rx'); tiltEl.style.removeProperty('--ry'); }
    tiltEl = c; if (!c || tiltRaf) return;
    tiltRaf = requestAnimationFrame(() => {
      tiltRaf = 0; const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      c.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg'); c.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
    });
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (tiltEl) { tiltEl.style.removeProperty('--rx'); tiltEl.style.removeProperty('--ry'); tiltEl = null; } }, true);
}
export function initFx() { tilt(); if (full()) ambient(true); }
