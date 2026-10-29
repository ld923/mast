// Mast PressureClock. new PressureClock(el,{seconds,increment,onFlag}); start pause addTime reset remaining
import { play } from './sound.js';
import { full, buzz, getAnim } from './fx.js';
const CSS = `
.pclk{--c:#FFC857;--g:rgba(255,200,87,.55);position:relative;width:min(240px,100%);aspect-ratio:1;margin:0 auto;font-family:Oswald,Osw,"Arial Narrow",sans-serif}
.pclk svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.pclk .trk{stroke:rgba(255,255,255,.1)}.pclk .arc{stroke:var(--c);transition:stroke .4s}
.pclk .dg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;color:var(--c);text-shadow:0 0 28px var(--g),0 0 4px var(--c);font-variant-numeric:tabular-nums;letter-spacing:.04em;line-height:1;transition:color .4s}
.pclk .t{font-size:clamp(34px,20cqw,56px)}.pclk{container-type:inline-size}.pclk .t{font-size:21cqw}
.pclk .st{font:600 3.6cqw Oswald,Osw,sans-serif;letter-spacing:.3em;text-transform:uppercase;opacity:.7;margin-top:2.5cqw;text-shadow:none}
.pclk.tense{--c:#FF9A3C;--g:rgba(255,154,60,.6)}.pclk.tense .dg{animation:pclkp 1.6s ease-in-out infinite}
.pclk.critical{--c:#FF5A4E;--g:rgba(255,90,78,.7)}.pclk.critical .dg{animation:pclkp .55s ease-in-out infinite}
.pclk.paused .dg{opacity:.55}.pclk.flagged .dg{animation:none;opacity:.9}
@keyframes pclkp{0%,100%{transform:scale(1)}50%{transform:scale(1.045);filter:brightness(1.25)}}
body.critical{--vig:1}
body.critical::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;background:radial-gradient(ellipse at center,transparent 68%,rgba(120,0,0,.3) 100%);animation:pclkv 1s ease-in-out infinite}
@keyframes pclkv{0%,100%{opacity:.6}50%{opacity:1}}
body.critical.hb::after{animation:none;opacity:.35}
#hb-edge{position:fixed;inset:0;pointer-events:none;z-index:51;opacity:0;box-shadow:inset 0 0 14vmin 2vmin rgba(220,30,30,.85)}
.pclk.glass svg{transform:none;height:72%;top:0;bottom:auto}.pclk.glass .dg{top:auto;bottom:0;height:26%;justify-content:center}
.pclk.glass .arc{display:none}
.pclk.glass .t{font-size:17cqw}.pclk.glass .st{display:none}
.pclk .gl{fill:rgba(255,255,255,.07);stroke:rgba(255,255,255,.55);stroke-width:2.2;stroke-linejoin:round}.pclk .sand{fill:var(--c);transition:fill .4s}
.pclk .strm{stroke:var(--c);stroke-width:1.6;stroke-dasharray:3 3;opacity:0}.pclk.glass:not(.paused):not(.flagged) .strm{opacity:.9;animation:pclks .5s linear infinite}
@keyframes pclks{to{stroke-dashoffset:-6}}
@media (prefers-reduced-motion:reduce){.pclk .strm{animation:none!important}.pclk .dg,.pclk.tense .dg,.pclk.critical .dg,body.critical::after{animation:none}.pclk .arc,.pclk .dg{transition:none}}`;
function edgePulse() {
  if (getAnim() === 'off') return; document.body.classList.add('hb');
  let e = document.getElementById('hb-edge'); if (!e) { e = document.createElement('div'); e.id = 'hb-edge'; e.setAttribute('aria-hidden', 'true'); document.body.appendChild(e); }
  if (e.animate) e.animate(full() ? [{ opacity: 0 }, { opacity: .95, offset: .12 }, { opacity: .25, offset: .3 }, { opacity: .7, offset: .42 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: .5, offset: .3 }, { opacity: 0 }], { duration: full() ? 620 : 700, easing: 'ease-out' });
}
const R = 54, C = 2 * Math.PI * R;
export class PressureClock {
  constructor(el, o = {}) {
    if (!document.getElementById('mast-clock-css')) { const s = document.createElement('style'); s.id = 'mast-clock-css'; s.textContent = CSS; document.head.appendChild(s); }
    this.onState = o.onState || (() => { }); this.glass = !!o.glass; this.el = el; this.inc = o.increment || 0; this.onFlag = o.onFlag || (() => { }); this.total = o.seconds ?? 60; this.ms = this.total * 1000; this.run = false; this.raf = 0; this.lastSec = null; this.flagged = false;
    el.classList.add('pclk'); if (this.glass) el.classList.add('glass');
    el.innerHTML = `<svg viewBox="0 0 120 120"><circle class="trk" ${this.glass ? 'style="display:none"' : ''} cx="60" cy="60" r="${R}" fill="none" stroke-width="5"/>${this.glass ? '<defs><clipPath id="gc' + (PressureClock.n = (PressureClock.n || 0) + 1) + '"><path id="gp' + PressureClock.n + '" d="M30 8H90C90 36 66 52 62 60C66 68 90 84 90 112H30C30 84 54 68 58 60C54 52 30 36 30 8Z"/></clipPath></defs><g clip-path="url(#gc' + PressureClock.n + ')"><rect class="sand st1" x="20" width="80"/><rect class="sand st2" x="20" width="80"/></g><path class="gl" d="M30 8H90C90 36 66 52 62 60C66 68 90 84 90 112H30C30 84 54 68 58 60C54 52 30 36 30 8Z" fill="none"/><line class="strm" x1="60" x2="60" y1="60"/>' : ''}<circle class="arc" cx="60" cy="60" r="${R}" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><div class="dg" role="timer" aria-live="off"><span class="t"></span><span class="st"></span></div>`;
    this.arc = el.querySelector('.arc'); this.s1 = el.querySelector('.st1'); this.s2 = el.querySelector('.st2'); this.sm = el.querySelector('.strm'); this.tEl = el.querySelector('.t'); this.sEl = el.querySelector('.st');
    this._tick = this._tick.bind(this); this._render(true);
  }
  remaining() { return this.run ? Math.max(0, this.ms - (performance.now() - this.t0)) / 1000 : this.ms / 1000; }
  start() { if (this.run || this.flagged) return; this.run = true; this.t0 = performance.now(); this.base = this.ms; if (this._st === 'critical') document.body.classList.add('critical'); this.el.classList.remove('paused'); this.raf = requestAnimationFrame(this._tick); }
  pause() { if (!this.run) return; this.ms = Math.max(0, this.base - (performance.now() - this.t0)); this.run = false; cancelAnimationFrame(this.raf); this.el.classList.add('paused'); this._render(); }
  addTime(s = this.inc) { if (this.run) { this.base += s * 1000; this.ms = this.base; this.t0 = this.t0; } else this.ms += s * 1000; this.total = Math.max(this.total, this.remaining()); this._render(true); }
  reset(seconds) { this.pause(); document.body.classList.remove('critical', 'hb'); if (seconds != null) this.total = seconds; this.ms = this.total * 1000; this.flagged = false; this.lastSec = null; this.el.classList.remove('paused', 'flagged'); this._render(true); }
  destroy() { cancelAnimationFrame(this.raf); document.body.classList.remove('critical', 'hb'); try { this.onState('calm'); } catch (_) { } }
  _tick() {
    if (!this.run) return;
    const left = this.base - (performance.now() - this.t0);
    this.ms = Math.max(0, left); this._render();
    if (left <= 0) { this.run = false; this.flagged = true; this.el.classList.add('flagged'); this._render(); this.onFlag(); return; }
    this.raf = requestAnimationFrame(this._tick);
  }
  _render(force) {
    const rem = this.run ? Math.max(0, this.base - (performance.now() - this.t0)) / 1000 : this.ms / 1000;
    const T = this.total, tT = Math.min(T * .5, 30), cT = Math.min(T * .25, 10), st = rem > tT ? 'calm' : rem > cT ? 'tense' : 'critical', cl = this.el.classList;
    if (force || this._st !== st) { cl.remove('calm', 'tense', 'critical'); cl.add(st); this._st = st; try { this.onState(st); } catch (_) { } this.sEl.textContent = this.flagged ? 'flag' : st; document.body.classList.toggle('critical', st === 'critical' && !this.flagged && this.run); }
    if (this.flagged) document.body.classList.remove('critical', 'hb');
    if (rem > 5.2 || !this.run) document.body.classList.remove('hb');
    if (!this.run && st === 'critical' && !this.flagged) document.body.classList.remove('critical');
    const m = Math.floor(rem / 60), s = Math.floor(rem % 60), txt = rem < 10 ? `${Math.floor(rem)}.${Math.floor((rem % 1) * 10)}` : `${m}:${String(s).padStart(2, '0')}`;
    if (txt !== this._txt) { const flip = this._txt != null && (this._txt.split('.')[0] !== txt.split('.')[0]); this.tEl.textContent = txt; this._txt = txt; if (flip && full() && this.tEl.animate) this.tEl.animate([{ transform: 'perspective(200px) rotateX(-70deg)', opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 180, easing: 'ease-out' }); }
    if (this.s1) { const f = Math.min(1, rem / this.total), yb = 112 - 50 * (1 - f); this.s1.setAttribute('y', 8 + 52 * (1 - f)); this.s1.setAttribute('height', 52 * f + 1); this.s2.setAttribute('y', yb); this.s2.setAttribute('height', 112 - yb + 1); this.sm.setAttribute('y2', f > 0.01 ? yb : 60); }
    this.arc.style.strokeDashoffset = C * (1 - Math.min(1, rem / this.total));
    if (this.run) { const sec = Math.ceil(rem); if (sec !== this.lastSec) { this.lastSec = sec; if (sec <= 5 && sec > 0) { play('heartbeat'); buzz(10); edgePulse(); } } }
  }
}
