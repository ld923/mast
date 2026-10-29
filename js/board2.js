// Mast Board: DOM/CSS-grid chess board. No chess rules inside; legality comes from the caller via setLegal().
// API: new Board(el,{orientation,onMove(from,to,promo)->bool|Promise,coords,theme,movable,pieceBase})
//  setPosition(fen,{animate,lastMove,check}) move(from,to,promo) flip() setTurn(color,isUserTurn) setLegal(map)
//  showArrow(from,to,color) clearArrows() getPremove() clearPremove() destroy()
// Call order after an opponent move: setPosition -> setLegal -> setTurn(userColor,true) (a queued premove fires then).
import { full, sprayAt, sparkAt } from './fx.js';
const F = 'abcdefgh', TYPES = 'pnbrqk';
const RM = () => document.documentElement.dataset.anim === 'off' || (!document.documentElement.dataset.anim && matchMedia('(prefers-reduced-motion: reduce)').matches);
const DUR = 180;
const CSS = `
.mb{position:relative;width:100%;aspect-ratio:1;container-type:inline-size;user-select:none;-webkit-user-select:none;touch-action:none;perspective:1400px;perspective-origin:50% 38%;
 --lt:#B98F66;--dk:#17314B;--amb:#FFC857;--fr1:#7a5230;--fr2:#3d2813;--tb1:#1d3a52;--tb2:#0a141e;--tx:0deg;--cb:0deg;--ls:rgba(255,255,255,.12);--ds:rgba(255,255,255,.05)}
.mb[data-view=tilt]{--tx:16deg;--cb:-16deg}
.mb .tilt{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(var(--tx));transform-origin:50% 62%}
.mb .tbl{position:absolute;inset:-14% -18% -24% -18%;transform:translateZ(-2px);pointer-events:none;border-radius:30px;
 background:radial-gradient(ellipse at 50% 40%,var(--tb1),var(--tb2) 75%);-webkit-mask-image:radial-gradient(closest-side,#000 62%,transparent);mask-image:radial-gradient(closest-side,#000 62%,transparent);display:none}
.mb[data-view=tilt] .tbl{display:block}
.mb .frm{position:absolute;inset:-2.2%;border-radius:8px;pointer-events:none;background:linear-gradient(135deg,var(--fr1),var(--fr2));
 box-shadow:0 1px 0 #00000055,0 3px 0 var(--fr2),0 5px 0 #00000040,0 14px 30px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.14)}
.mb[data-view=tilt] .frm{inset:-4.2%;box-shadow:0 2px 0 var(--fr2),0 4px 0 #0006,0 7px 0 #0004,0 22px 36px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.18)}
.mb .sqs{position:absolute;inset:0;display:grid;grid-template:repeat(8,1fr)/repeat(8,1fr);border-radius:3px;overflow:hidden;box-shadow:0 0 0 .5cqw rgba(0,0,0,.45)}
.mb .sq{position:relative}
.mb .sq.l{background-color:var(--lt);background-image:linear-gradient(135deg,rgba(255,255,255,.12),rgba(80,40,0,.12)),repeating-linear-gradient(98deg,rgba(90,50,10,.07) 0 2px,transparent 2px 6px,rgba(255,255,255,.04) 6px 8px)}
.mb .sq.d{background-color:var(--dk);background-image:linear-gradient(135deg,rgba(255,255,255,.05),rgba(0,0,0,.18)),repeating-linear-gradient(98deg,rgba(255,255,255,.025) 0 2px,transparent 2px 9px)}
.mb[data-theme=slate]{--lt:#9fb1c4;--dk:#2d3f52}
.mb[data-theme=teak]{--lt:#d3a86b;--dk:#8a5a2e;--fr1:#9b6b3a;--fr2:#4d3017;--tb1:#3a2a1a;--tb2:#150e07}
.mb[data-theme=teak] .sq.l{background-image:linear-gradient(135deg,rgba(255,255,255,.1),rgba(80,40,0,.1)),repeating-linear-gradient(0deg,rgba(60,30,0,.22) 0 1px,transparent 1px 9px)}
.mb[data-theme=teak] .sq.d{background-image:linear-gradient(135deg,rgba(255,255,255,.04),rgba(0,0,0,.2)),repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 9px)}
.mb[data-theme=chart]{--lt:#ecdcb2;--dk:#c7ad78;--fr1:#6b5a3a;--fr2:#2e2514;--tb1:#2c3a3a;--tb2:#0c1414}
.mb[data-theme=chart] .sq.l{background-image:radial-gradient(circle at 30% 30%,rgba(255,255,255,.35),transparent 60%),repeating-linear-gradient(0deg,rgba(40,30,10,.12) 0 1px,transparent 1px 12.5%)}
.mb[data-theme=chart] .sq.d{background-image:radial-gradient(circle at 70% 70%,rgba(90,60,20,.25),transparent 65%),repeating-linear-gradient(90deg,rgba(40,30,10,.18) 0 1px,transparent 1px 12.5%)}
.mb[data-theme=havana]{--lt:#d9b48a;--dk:#5a2a1c;--fr1:#7b2f1f;--fr2:#2c0f09;--tb1:#3a1810;--tb2:#120504}
.mb[data-theme=havana] .sq.l{background-image:linear-gradient(135deg,rgba(255,235,200,.2),rgba(120,50,20,.18)),repeating-linear-gradient(95deg,rgba(120,50,20,.12) 0 3px,transparent 3px 9px)}
.mb[data-theme=havana] .sq.d{background-image:linear-gradient(135deg,rgba(255,150,100,.1),rgba(0,0,0,.3)),repeating-linear-gradient(95deg,rgba(255,170,120,.05) 0 3px,transparent 3px 11px)}
.mb[data-theme=riga]{--lt:#f4f9fd;--dk:#9dbad3;--fr1:#cfe0ee;--fr2:#6f8ea8;--tb1:#c9d9e6;--tb2:#5e7890;--amb:#d9822b}
.mb[data-theme=riga] .sq.l{background-image:radial-gradient(circle at 20% 25%,#fff 0 1px,transparent 2px),radial-gradient(circle at 70% 60%,#fff 0 1.3px,transparent 2.4px),radial-gradient(circle at 45% 85%,#fff 0 1px,transparent 2px),linear-gradient(135deg,#fff,#dbe9f4)}
.mb[data-theme=riga] .sq.d{background-image:radial-gradient(circle at 30% 70%,rgba(255,255,255,.8) 0 1px,transparent 2px),radial-gradient(circle at 75% 25%,rgba(255,255,255,.8) 0 1.2px,transparent 2.2px),linear-gradient(135deg,rgba(255,255,255,.25),rgba(60,100,140,.25))}
.mb[data-theme=riga] .cf,.mb[data-theme=riga] .cr{color:#476079!important}
.mb .sq.last::after{content:"";position:absolute;inset:0;background:rgba(255,200,87,.38)}
.mb .sq.sel::after{content:"";position:absolute;inset:0;background:rgba(255,200,87,.6);box-shadow:inset 0 0 0 .5cqw var(--amb)}
.mb .sq.pre::after{content:"";position:absolute;inset:0;background:rgba(190,70,70,.42);box-shadow:inset 0 0 0 .4cqw rgba(190,70,70,.6)}
.mb .sq.sel.pm::after{background:rgba(190,70,70,.32);box-shadow:inset 0 0 0 .5cqw rgba(190,70,70,.7)}
.mb .sq.hov{box-shadow:inset 0 0 0 .6cqw rgba(255,200,87,.85)}
.mb .sq.lg::before{content:"";position:absolute;left:50%;top:50%;width:30%;height:30%;margin:-15% 0 0 -15%;border-radius:50%;background:rgba(255,200,87,.85);box-shadow:0 0 1.2cqw rgba(255,200,87,.55);z-index:3;pointer-events:none}
.mb .sq.lc::before{content:"";position:absolute;inset:4%;border-radius:50%;border:1.1cqw solid rgba(255,200,87,.85);z-index:3;pointer-events:none}
.mb .sq.chk{background-image:radial-gradient(circle,rgba(255,90,78,.95) 0,rgba(255,90,78,.6) 38%,rgba(255,90,78,0) 72%),var(--cb,none)}
.mb .sq.chk::before{content:"";position:absolute;inset:-10%;border-radius:50%;background:radial-gradient(circle,rgba(255,90,78,.8),rgba(255,90,78,0) 68%);animation:mbchk 1.1s ease-in-out infinite;z-index:1;pointer-events:none}
@keyframes mbchk{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
.mb .rp{position:absolute;inset:14%;border-radius:50%;border:1px solid rgba(150,215,255,.55);pointer-events:none;animation:mbrip 2.6s ease-out infinite;opacity:0;z-index:1}
.mb .rp+.rp{animation-delay:1.3s}
@keyframes mbrip{0%{transform:scale(.4);opacity:.7}100%{transform:scale(1.5);opacity:0}}
html:not([data-anim=full]) .mb .rp{animation:none;opacity:.4;transform:scale(.9)}
.mb .cf,.mb .cr{position:absolute;font:600 max(8px,21cqw)/1 Inter,system-ui,sans-serif;opacity:.7;z-index:2;pointer-events:none}
.mb .cf{right:4%;bottom:3%}.mb .cr{left:4%;top:4%}
.mb .sq.l .cf,.mb .sq.l .cr{color:var(--dk)}.mb .sq.d .cf,.mb .sq.d .cr{color:var(--lt)}
.mb .pcs{position:absolute;inset:0;pointer-events:none;transform-style:preserve-3d}
.mb .pcs .mk{position:absolute;width:2px;height:2px;margin:-1px 0 0 -1px;visibility:hidden}
.mb .pc{position:absolute;left:0;top:0;width:12.5%;height:12.5%;will-change:transform;z-index:4;cursor:grab;transform-style:preserve-3d}
.mb .pc::before{content:"";position:absolute;left:16%;bottom:6%;width:70%;height:24%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));transform:translate(10%,12%)}
.mb .pc::after{content:"";position:absolute;inset:0;background:var(--img) center/92% no-repeat;transform-origin:50% 88%;transform:rotateX(var(--cb))}
.mb .pc[data-k^=w]::after{filter:drop-shadow(0 0 .25cqw rgba(35,18,0,.9)) drop-shadow(0 .3cqw .4cqw rgba(0,0,0,.35))}
.mb .pc.drag{z-index:20;cursor:grabbing}
.mb .pc.drag::after{filter:drop-shadow(0 1.4cqw 1.6cqw rgba(0,0,0,.55))}.mb .pc.drag::before{opacity:.5;transform:translate(25%,25%) scale(1.2)}
.mb .pc.gone{z-index:3}
html[data-anim=full] .mb .pc.sway::after{animation:mbsway 1.6s ease-in-out infinite}
@keyframes mbsway{0%,100%{transform:rotateX(var(--cb)) rotate(-3deg)}50%{transform:rotateX(var(--cb)) rotate(3deg)}}
.mb .pc.flash::after{animation:mbflash .6s ease-out}
@keyframes mbflash{0%{filter:brightness(3) drop-shadow(0 0 3cqw #ffd36b);transform:rotateX(var(--cb)) scale(1.4)}100%{transform:rotateX(var(--cb)) scale(1)}}
.mb .pc.topple::after{transform-origin:30% 92%;animation:mbtop .95s cubic-bezier(.55,0,.75,.55) forwards}
.mb .pc.toppled::after{transform-origin:30% 92%;transform:rotateX(var(--cb)) rotate(84deg)}
@keyframes mbtop{0%{transform:rotateX(var(--cb)) rotate(0)}72%{transform:rotateX(var(--cb)) rotate(88deg)}86%{transform:rotateX(var(--cb)) rotate(79deg)}100%{transform:rotateX(var(--cb)) rotate(84deg)}}
.mb .dimmer{position:absolute;inset:-4%;background:#000;opacity:0;pointer-events:none;z-index:6;transition:opacity .9s}
.mb.dim .dimmer{opacity:.5}
.mb svg.arr,.mb svg.wk{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8;overflow:visible}
.mb svg.wk{z-index:2}
.mb .lens{position:absolute;width:30%;height:30%;border-radius:50%;overflow:hidden;z-index:12;pointer-events:none;box-shadow:0 0 0 .7cqw #b8893b,0 0 0 1.1cqw #5a3d12,inset 0 0 0 .35cqw #f0d27a,0 1.5cqw 4cqw rgba(0,0,0,.65);background:#000}
.mb .lens .li{position:absolute;left:50%;top:50%;width:41.67%;height:41.67%;margin:-20.8% 0 0 -20.8%;transform:scale(1.9)}
.mb .lens .li .pc{left:0;top:0;width:100%;height:100%;transform:none;cursor:default}
.mb .lens::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.35),transparent 35%),radial-gradient(circle,transparent 55%,rgba(0,0,0,.55))}
.mb .promo{position:absolute;inset:0;z-index:30;background:rgba(5,12,20,.55);backdrop-filter:blur(2px)}
.mb .promo button{position:absolute;width:12.5%;height:12.5%;border:0;border-radius:50%;background:center/84% no-repeat,#f3e7cf;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.5);transition:transform .14s}
.mb .promo button:hover,.mb .promo button:focus-visible{transform:scale(1.12);outline:2px solid var(--amb)}
body.critical .mb .sqs{box-shadow:0 0 0 .5cqw rgba(255,90,78,.5),inset 0 0 14cqw rgba(0,0,0,.45)}
html[data-anim=full] .mb.storm1 .tilt{animation:mbrk1 5s ease-in-out infinite}
html[data-anim=full] .mb.storm2 .tilt{animation:mbrk2 3.4s ease-in-out infinite}
@keyframes mbrk1{0%,100%{transform:rotateX(var(--tx)) rotateZ(-.4deg)}50%{transform:rotateX(var(--tx)) rotateZ(.4deg)}}
@keyframes mbrk2{0%,100%{transform:rotateX(var(--tx)) rotateZ(-.8deg)}50%{transform:rotateX(var(--tx)) rotateZ(.8deg)}}
@media (prefers-reduced-motion:reduce){.mb .sq.chk::before{animation:none;opacity:.8}}
`;
const LSg = (k, d) => { try { return localStorage.getItem('mast.' + k) ?? d; } catch (_) { return d; } };
export const BOARD_THEMES = [['night', 'Night sea'], ['teak', 'Teak deck'], ['chart', "Captain's chart"], ['havana', 'Havana'], ['riga', 'Riga winter']];
export const unlockedThemes = () => { let t = []; try { t = JSON.parse(localStorage.getItem('mast.progress') || '{}').themes || []; } catch (_) { } return ['night', ...t]; };
export const getBoardTheme = () => { const t = LSg('boardTheme', 'night'); if (unlockedThemes().includes(t)) return t; if (t !== 'night') { try { localStorage.setItem('mast.boardTheme', 'night'); } catch (_) { } } return 'night'; };
export const getBoardView = () => { const v = LSg('boardView', null); return v === 'tilt' || v === 'flat' ? v : (innerWidth < 480 ? 'flat' : 'tilt'); };
export const getRipples = () => LSg('ripples', '0') === '1';
const boards = new Set();
/* the board a keyboard move should go to: visible, awaiting the user's move */
export function activeBoard() { let b = null; boards.forEach(x => { if (x.root.isConnected && x.userTurn && x.legal && x.fen && x.root.offsetParent !== null) b = x; }); return b; }
function pref(k, v) { try { localStorage.setItem('mast.' + k, v); } catch (_) { } boards.forEach(b => b._prefs()); }
export const setBoardTheme = t => { if (unlockedThemes().includes(t)) pref('boardTheme', t); };
export const setBoardView = v => pref('boardView', v);
export const setRipples = on => pref('ripples', on ? '1' : '0');
// quad -> inverse projective map (client px -> unit square), from the 4 projected corners of the board plane
function quadInv(p) {
  const [x0, y0] = p[0], [x1, y1] = p[1], [x2, y2] = p[2], [x3, y3] = p[3];
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = den ? (dx3 * dy2 - dx2 * dy3) / den : 0, h = den ? (dx1 * dy3 - dx3 * dy1) / den : 0;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
  const m = [e - f * h, c * h - b, b * f - c * e, f * g - d, a - c * g, c * d - a * f, d * h - e * g, b * g - a * h, a * e - b * d];
  return (x, y) => { const X = m[0] * x + m[1] * y + m[2], Y = m[3] * x + m[4] * y + m[5], W = m[6] * x + m[7] * y + m[8]; return [X / W, Y / W]; };
}
function injectCSS() {
  if (document.getElementById('mast-board-css')) return;
  const s = document.createElement('style'); s.id = 'mast-board-css'; s.textContent = CSS; document.head.appendChild(s);
}
export const parseFen = fen => {
  const pos = {}; const parts = fen.split(' ');
  parts[0].split('/').forEach((row, i) => { let c = 0; for (const ch of row) { if (/\d/.test(ch)) c += +ch; else { pos[F[c] + (8 - i)] = { c: ch === ch.toUpperCase() ? 'w' : 'b', t: ch.toLowerCase() }; c++; } } });
  return { pos, turn: parts[1] || 'w' };
};
const key = p => p.c + p.t.toUpperCase();
const cr = sq => [F.indexOf(sq[0]), +sq[1] - 1];

export class Board {
  constructor(el, o = {}) {
    injectCSS();
    this.root = el; this.o = o; this.orient = o.orientation || 'white';
    this.onMove = o.onMove || (() => true);
    this.coords = o.coords !== false;
    this.movable = o.movable || this.orient;
    this.pos = {}; this.els = new Map(); this.legal = null; this.turn = 'w'; this.userTurn = false;
    this.lastMove = null; this.check = null; this.sel = null; this.premove = null; this.arrows = []; this.drag = null; this._gen = 0;
    el.classList.add('mb'); this._themeFixed = o.theme; this._prefs = () => { el.dataset.theme = this._themeFixed || getBoardTheme(); el.dataset.view = o.view || getBoardView(); if (this.sqsEl) this._threats(); }; this._prefs();
    const base = o.pieceBase || new URL('../assets/pieces/', import.meta.url).href;
    this.url = k => `url(${base}${k}.svg)`;
    el.innerHTML = '<div class="tbl"></div><div class="tilt"><div class="frm"></div><div class="sqs"></div><svg class="wk" viewBox="0 0 8 8"></svg><div class="pcs"><i class="mk" style="left:0;top:0"></i><i class="mk" style="left:100%;top:0"></i><i class="mk" style="left:100%;top:100%"></i><i class="mk" style="left:0;top:100%"></i></div><svg class="arr" viewBox="0 0 8 8"></svg><div class="dimmer"></div></div>';
    this.sqsEl = el.querySelector('.sqs'); this.pcsEl = el.querySelector('.pcs'); this.arrEl = el.querySelector('svg.arr'); this.wkEl = el.querySelector('svg.wk'); this.tiltEl = el.querySelector('.tilt'); this.slow = 1; this.fen = ''; boards.add(this);
    this.arrEl.innerHTML = '<defs></defs><g></g>';
    this.sqEls = {};
    for (let r = 7; r >= 0; r--) for (let c = 0; c < 8; c++) { const n = F[c] + (r + 1), d = document.createElement('div'); d.className = 'sq ' + ((c + r) % 2 ? 'l' : 'd'); d.dataset.sq = n; this.sqEls[n] = d; }
    this._layoutSquares();
    this._onDown = e => this._down(e); this._onMove = e => this._pmove(e); this._onUp = e => this._up(e); this._onCancel = () => this._cancelDrag(true);
    el.addEventListener('pointerdown', this._onDown); el.addEventListener('pointermove', this._onMove);
    el.addEventListener('pointerup', this._onUp); el.addEventListener('pointercancel', this._onCancel);
    el.addEventListener('contextmenu', e => e.preventDefault());
    ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'].forEach(k => { new Image().src = `${base}${k}.svg`; });
  }
  destroy() { boards.delete(this); const el = this.root; el.removeEventListener('pointerdown', this._onDown); el.removeEventListener('pointermove', this._onMove); el.removeEventListener('pointerup', this._onUp); el.removeEventListener('pointercancel', this._onCancel); el.innerHTML = ''; el.classList.remove('mb', 'dim', 'storm1', 'storm2'); }
  // ---- geometry
  _xy(sq) { const [c, r] = cr(sq); return this.orient === 'white' ? [c, 7 - r] : [7 - c, r]; }
  _tf(sq) { const [x, y] = this._xy(sq); return `translate(${x * 100}%,${y * 100}%)`; }
  _inv() { const q = [...this.pcsEl.querySelectorAll('.mk')].map(m => { const r = m.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); return quadInv(q); }
  _uv(cx, cy) { return (this._invf = this._inv())(cx, cy); }
  _sqAt(cx, cy) { const [u, v] = this._uv(cx, cy), x = Math.floor(u * 8), y = Math.floor(v * 8); if (!(u >= 0 && v >= 0) || x < 0 || y < 0 || x > 7 || y > 7) return null; return this.orient === 'white' ? F[x] + (8 - y) : F[7 - x] + (y + 1); }
  _layoutSquares() {
    this.sqsEl.innerHTML = '';
    const w = this.orient === 'white';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const n = w ? F[x] + (8 - y) : F[7 - x] + (y + 1), d = this.sqEls[n]; d.querySelectorAll('.cf,.cr').forEach(n => n.remove());
      if (this.coords) { if (y === 7) d.insertAdjacentHTML('beforeend', `<i class="cf">${n[0]}</i>`); if (x === 0) d.insertAdjacentHTML('beforeend', `<i class="cr">${n[1]}</i>`); }
      this.sqsEl.appendChild(d);
    }
  }
  // ---- highlights
  _hl() {
    const sel = this.sel, pm = this.premove;
    for (const n in this.sqEls) { const d = this.sqEls[n]; d.classList.remove('last', 'sel', 'pm', 'pre', 'lg', 'lc', 'chk', 'hov'); }
    if (this.lastMove) { this.sqEls[this.lastMove.from]?.classList.add('last'); this.sqEls[this.lastMove.to]?.classList.add('last'); }
    if (this.check) this.sqEls[this.check]?.classList.add('chk');
    this.els.forEach((e, q) => e.classList.toggle('sway', q === this.check));
    if (pm) { this.sqEls[pm.from].classList.add('pre'); this.sqEls[pm.to].classList.add('pre'); }
    if (sel) {
      this.sqEls[sel].classList.add('sel'); const mode = this._mode(this.pos[sel]);
      if (mode === 'pre') this.sqEls[sel].classList.add('pm');
      if (mode === 'move' && this.legal && this.legal[sel]) for (const t of this.legal[sel]) this.sqEls[t]?.classList.add(this.pos[t] || (this.pos[sel].t === 'p' && t[0] !== sel[0]) ? 'lc' : 'lg');
    }
  }
  _mode(p) { // 'move' | 'pre' | null
    if (!p) return null; const m = this.movable;
    if (m !== 'both' && m !== (p.c === 'w' ? 'white' : 'black')) return null;
    const turnC = this.turn;
    if (this.userTurn && p.c === turnC) return 'move';
    if (m !== 'both' && p.c !== turnC) return 'pre';
    return null;
  }
  // ---- public API
  setLegal(map) { this.legal = map || null; this._hl(); }
  setTurn(color, isUserTurn) {
    this._tc = color;
    this.turn = color === 'black' || color === 'b' ? 'b' : 'w'; this.userTurn = !!isUserTurn;
    this.root.classList.toggle('myturn', this.userTurn); this._threats();
    if (this.userTurn && this.premove) { const { from, to } = this.premove; this.premove = null; this.sel = null; this._hl(); if (!this.legal || (this.legal[from] || []).includes(to)) { this._attempt(from, to, 'q', false); return; } }
    this._hl();
  }
  getPremove() { return this.premove; }
  clearPremove() { this.premove = null; this.sel = null; this._hl(); }
  flip() { this.orient = this.orient === 'white' ? 'black' : 'white'; this.movable = this.movable === 'both' ? 'both' : this.orient; this._layoutSquares(); this._reflow(true); this._renderArrows(); this._hl(); }
  setPosition(fen, o = {}) {
    this._cancelDrag(false); this.fen = fen; this.root.classList.remove('dim'); this.els.forEach(e => e.classList.remove('topple', 'toppled')); this._clearLens();
    const { pos, turn } = parseFen(fen);
    this.turn = turn; this.sel = null;
    if (o.lastMove !== undefined) this.lastMove = o.lastMove;
    this.check = o.check === true ? Object.keys(pos).find(s => pos[s].t === 'k' && pos[s].c === turn) || null : (o.check || null);
    this._reconcile(pos, o.animate ? true : false, o.lastMove);
    this._hl();
  }
  move(from, to, promo) { // animated programmatic move (heuristic castling / en passant; use setPosition for exactness)
    this._cancelDrag(false); this.sel = null; this.check = null; this.lastMove = { from, to };
    this._applyLocal(from, to, promo, true); this._hl();
  }
  showArrow(from, to, color = '#FFC857') { this.arrows.push({ from, to, color }); this._renderArrows(); }
  clearArrows() { this.arrows = []; this._renderArrows(); }
  _renderArrows() {
    const g = this.arrEl.querySelector('g'), defs = this.arrEl.querySelector('defs'); let m = '', s = '';
    this.arrows.forEach((a, i) => {
      const [x1, y1] = this._xy(a.from).map(v => v + .5), [x2, y2] = this._xy(a.to).map(v => v + .5), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const ex = x2 - ux * .42, ey = y2 - uy * .42, sx = x1 + ux * .22, sy = y1 + uy * .22;
      m += `<marker id="ah${i}" viewBox="0 0 4 4" refX="2.2" refY="2" markerWidth="2.2" markerHeight="2.2" orient="auto"><path d="M0 0L4 2L0 4z" fill="${a.color}"/></marker>`;
      s += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${a.color}" stroke-width=".2" stroke-linecap="round" opacity=".85" marker-end="url(#ah${i})"/>`;
    });
    defs.innerHTML = m; g.innerHTML = s;
  }
  // ---- v2 effects
  _slide(el, from, to) {
    const [x1, y1] = this._xy(from), [x2, y2] = this._xy(to), t = this._tf(to), f = this._tf(from), k = el.dataset.k, ty = k[1], dist = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const D = this.slow;
    if (!full()) { this._anim(el, [{ transform: f }, { transform: t }], DUR * D).then(() => this._settle(el, to)); return; }
    if (ty === 'N') { // rear, hop in an arc, land
      const mx = (x1 + x2) / 2 * 100, my = (y1 + y2) / 2 * 100 - 45, tr = (x, y, ex = '') => `translate(${x}%,${y}%)${ex}`;
      this._anim(el, [{ transform: f, offset: 0 }, { transform: tr(x1 * 100, y1 * 100 - 8, ' rotate(-10deg) scale(1.06)'), offset: .2 }, { transform: tr(mx, my, ' rotate(6deg) scale(1.16)'), offset: .55 }, { transform: t, offset: 1 }], 380 * D, 'ease-in-out').then(() => this._settle(el, to));
    } else if (ty === 'Q') this._anim(el, [{ transform: f }, { transform: t }], (DUR + 40 * dist) * D, 'cubic-bezier(.35,.05,.2,1)').then(() => this._settle(el, to));
    else this._anim(el, [{ transform: f }, { transform: t }], (DUR + 12 * dist) * D).then(() => this._settle(el, to));
    if (ty !== 'N' && dist >= 2) this._wake(x1, y1, x2, y2);
  }
  _wake(x1, y1, x2, y2) {
    const dx = x1 - x2, dy = y1 - y2, L = Math.min(Math.hypot(dx, dy), 3.2), a = Math.atan2(dy, dx), ex = x2 + .5, ey = y2 + .5;
    const arm = s => { const q = a + s; return `M${ex} ${ey}L${ex + Math.cos(q) * L} ${ey + Math.sin(q) * L}`; };
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = `<path d="${arm(.2)}${arm(-.2)}" stroke="#fff" stroke-opacity=".5" stroke-width=".05" fill="none" stroke-linecap="round"/><path d="${arm(.34)}${arm(-.34)}" stroke="#bfe6ff" stroke-opacity=".3" stroke-width=".035" fill="none" stroke-linecap="round"/>`;
    this.wkEl.appendChild(g);
    g.animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0 }], { duration: 400 + 180 * this.slow, easing: 'ease-out' }).finished.catch(() => { }).then(() => g.remove());
  }
  _overboard(el) {
    el.classList.add('gone'); el.style.pointerEvents = 'none';
    const m = /translate\(([-\d.]+)%,\s*([-\d.]+)%\)/.exec(el.style.transform) || [0, 0, 0], x = +m[1] / 100, y = +m[2] / 100, t = el.style.transform;
    const dirs = [[-1, 0, x + 1.4], [1, 0, 8 - x + .4], [0, -1, y + 1.4], [0, 1, 8 - y + .4]].sort((a, b) => a[2] - b[2])[0];
    const sd = Math.random() < .5 ? 1 : -1, dx = dirs[0] * dirs[2] * 100, dy = dirs[1] * dirs[2] * 100;
    const a = el.animate([{ transform: t, opacity: 1 }, { transform: `${t} translate(${dx * .3}%,${dy * .3 - 70}%) rotate(${sd * 120}deg)`, opacity: 1, offset: .35 }, { transform: `${t} translate(${dx}%,${dy + 40}%) rotate(${sd * 330}deg) scale(.75)`, opacity: .9, offset: .8 }, { transform: `${t} translate(${dx}%,${dy + 60}%) rotate(${sd * 360}deg) scale(.6)`, opacity: 0 }], { duration: 760, easing: 'cubic-bezier(.4,0,.8,.6)' });
    setTimeout(() => { if (el.isConnected) sprayAt(el); }, 520);
    a.finished.catch(() => { }).then(() => el.remove());
  }
  checkmate() { // loser = side to move; call after the mating move is on the board
    const loser = this.turn, sq = Object.keys(this.pos).find(q => this.pos[q].t === 'k' && this.pos[q].c === loser), el = sq && this.els.get(sq);
    if (!el) return Promise.resolve();
    const ev = () => { const d = { loser, sq }; this.root.dispatchEvent(new CustomEvent('mast:mate', { detail: d, bubbles: true })); };
    if (!full()) { el.classList.add('toppled'); this.root.classList.add('dim'); ev(); return Promise.resolve(); }
    this.root.classList.add('dim'); el.classList.add('topple'); el.classList.remove('sway');
    return new Promise(r => setTimeout(() => { el.classList.replace('topple', 'toppled'); ev(); r(); }, 950));
  }
  _clearLens() { this.root.querySelectorAll('.lens').forEach(l => l.remove()); }
  spyglass(sq, hold = 2800) { // telescope lens zoom over a square, brass ring
    this._clearLens(); const [x, y] = this._xy(sq), lens = document.createElement('div'); lens.className = 'lens';
    lens.style.left = (x * 12.5 + 6.25 - 15) + '%'; lens.style.top = (y * 12.5 + 6.25 - 15) + '%';
    const inner = document.createElement('div'); inner.className = 'li'; const sqc = this.sqEls[sq].cloneNode(false); sqc.className = 'sq ' + (this.sqEls[sq].classList.contains('l') ? 'l' : 'd'); sqc.style.cssText = 'position:absolute;inset:0';
    inner.appendChild(sqc); const pe = this.els.get(sq); if (pe) { const c = pe.cloneNode(false); c.className = 'pc'; c.style.transform = 'none'; inner.appendChild(c); }
    lens.appendChild(inner); this.tiltEl.appendChild(lens);
    if (full() && lens.animate) { lens.animate([{ transform: 'scale(2.6)', opacity: 0, filter: 'blur(6px)' }, { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.9)' }], { duration: 700, easing: 'ease-out' }); }
    clearTimeout(this._lt); this._lt = setTimeout(() => { if (lens.animate && full()) lens.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).finished.then(() => lens.remove()).catch(() => lens.remove()); else lens.remove(); }, hold);
  }
  _threats() { // squares the opponent attacks, on the player's turn (needs global chess.js)
    this.sqsEl.querySelectorAll('.rp').forEach(n => n.remove());
    if (!getRipples() || !this.userTurn || !this.fen || typeof Chess === 'undefined') return;
    try {
      const parts = this.fen.split(' '); parts[1] = this.turn === 'w' ? 'b' : 'w'; parts[3] = '-'; const c = new Chess(parts.join(' ')); const set = new Set();
      c.moves({ verbose: true }).forEach(m => { if (m.piece === 'p' && !m.captured && m.flags.indexOf('e') < 0) return; set.add(m.to); });
      [...set].slice(0, 28).forEach(q => { const d = this.sqEls[q]; if (d) d.insertAdjacentHTML('beforeend', '<b class="rp"></b><b class="rp"></b>'); });
    } catch (_) { }
  }
  // ---- piece reconciliation + animation
  _mkPiece(p, sq) { const d = document.createElement('div'); d.className = 'pc'; d.dataset.k = key(p); d.style.setProperty('--img', this.url(key(p))); d.style.transform = this._tf(sq); this.pcsEl.appendChild(d); return d; }
  _anim(el, kf, dur, easing = 'cubic-bezier(.2,.8,.2,1)', fill = 'none') { if (RM()) return Promise.resolve(); return el.animate(kf, { duration: dur, easing, fill }).finished.catch(() => { }); }
  _settle(el, sq) { const t = this._tf(sq); this._anim(el, [{ transform: t + ' scale(1.07)' }, { transform: t + ' scale(1)' }], 110, 'ease-out'); }
  _reconcile(newPos, animate, lastMove) {
    const oldPos = this.pos, oldEls = this.els, newEls = new Map(), usedOld = new Set();
    for (const sq in newPos) if (oldPos[sq] && key(oldPos[sq]) === key(newPos[sq]) && oldEls.get(sq)) { newEls.set(sq, oldEls.get(sq)); usedOld.add(sq); }
    let pendNew = Object.keys(newPos).filter(s => !newEls.has(s)), pendOld = [...oldEls.keys()].filter(s => !usedOld.has(s));
    const moved = [];
    const take = (from, to) => { const el = oldEls.get(from); newEls.set(to, el); pendNew = pendNew.filter(s => s !== to); pendOld = pendOld.filter(s => s !== from); if (el.dataset.k !== key(newPos[to])) { el.dataset.k = key(newPos[to]); el.style.setProperty('--img', this.url(key(newPos[to]))); if (animate && full()) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 650); sparkAt(el); } } moved.push([el, from, to]); };
    if (lastMove && pendOld.includes(lastMove.from) && pendNew.includes(lastMove.to)) take(lastMove.from, lastMove.to);
    for (const to of [...pendNew]) {
      let best = null, bd = 99; for (const f of pendOld) if (key(oldPos[f]) === key(newPos[to])) { const d = Math.abs(cr(f)[0] - cr(to)[0]) + Math.abs(cr(f)[1] - cr(to)[1]); if (d < bd) { bd = d; best = f; } }
      if (best) take(best, to);
    }
    const fresh = pendNew.map(s => [s, this._mkPiece(newPos[s], s)]); fresh.forEach(([s, el]) => newEls.set(s, el));
    const gone = pendOld.map(s => oldEls.get(s));
    this.pos = newPos; this.els = newEls;
    let captured = gone.length > 0 && moved.length > 0;
    gone.forEach(el => { if (animate && full()) this._overboard(el); else if (animate && !RM()) { el.classList.add('gone'); el.style.pointerEvents = 'none'; const t = el.style.transform; this._anim(el, [{ transform: t, opacity: 1 }, { transform: t + ' translateY(14%) scale(.7)', opacity: 0 }], 240, 'ease-in', 'forwards').then(() => el.remove()); } else el.remove(); });
    newEls.forEach((el, sq) => { if (!el.isConnected) this.pcsEl.appendChild(el); });
    const snap = animate === 'settle';
    moved.forEach(([el, from, to]) => {
      const t = this._tf(to), f = this._tf(from); el.style.transform = t;
      if (animate === true) this._slide(el, from, to);
      else if (snap) this._settle(el, to);
    });
    fresh.forEach(([s, el]) => { if (animate === true && Object.keys(oldPos).length) this._anim(el, [{ opacity: 0, transform: this._tf(s) + ' scale(.6)' }, { opacity: 1, transform: this._tf(s) }], 200); });
    this.root.dispatchEvent(new CustomEvent('boardmove', { detail: { capture: captured, lastMove: this.lastMove } }));
  }
  _reflow(animate) { this.els.forEach((el, sq) => { const t = this._tf(sq); el.style.transform = t; if (animate) this._anim(el, [{ opacity: .4 }, { opacity: 1 }], 220); }); }
  _applyLocal(from, to, promo, animate) {
    const np = { ...this.pos }, p = np[from]; if (!p) return;
    delete np[from];
    if (p.t === 'k' && Math.abs(cr(to)[0] - cr(from)[0]) === 2) { const r = from[1], rf = cr(to)[0] > cr(from)[0] ? 'h' : 'a', rt = rf === 'h' ? 'f' : 'd'; if (np[rf + r]) { np[rt + r] = np[rf + r]; delete np[rf + r]; } }
    if (p.t === 'p' && from[0] !== to[0] && !np[to]) delete np[to[0] + from[1]];
    np[to] = { c: p.c, t: promo || p.t };
    this._reconcile(np, animate === true ? true : animate, { from, to });
  }
  // ---- interaction
  _down(e) {
    if (e.button > 0 || this._promoOpen) return;
    const sq = this._sqAt(e.clientX, e.clientY); if (!sq) return;
    const p = this.pos[sq], mode = this._mode(p);
    if (this.sel && sq !== this.sel) { // destination click
      const sm = this._mode(this.pos[this.sel]);
      if (sm === 'move' && (!this.legal || (this.legal[this.sel] || []).includes(sq))) { const f = this.sel; this.sel = null; this._hl(); this._attempt(f, sq, null, false); return; }
      if (sm === 'pre' && !mode) { this.premove = { from: this.sel, to: sq }; this.sel = null; this._hl(); return; }
    }
    if (this.premove && !(mode === 'pre')) { this.premove = null; }
    if (mode) {
      const wasSel = this.sel === sq; this.sel = sq; this._hl();
      this.drag = { sq, wasSel, mode, x: e.clientX, y: e.clientY, active: false, id: e.pointerId, touch: e.pointerType === 'touch' };
      try { this.root.setPointerCapture(e.pointerId); } catch (_) { }
    } else { this.sel = null; this._hl(); }
  }
  _pmove(e) {
    const d = this.drag; if (!d || e.pointerId !== d.id) return;
    if (!d.active) { if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return; d.active = true; d.el = this.els.get(d.sq); d.el.classList.add('drag'); }
    const [u, v] = this._uv(e.clientX, e.clientY), W = this.pcsEl.offsetWidth, s = W / 8, lift = d.touch ? s * .55 : 0;
    d.el.style.transform = `translate(${u * W - s / 2}px,${v * W - s / 2 - lift}px) scale(1.14)`;
    const h = this._sqAt(e.clientX, e.clientY); if (h !== d.hov) { if (d.hov) this.sqEls[d.hov].classList.remove('hov'); d.hov = h; if (h) this.sqEls[h].classList.add('hov'); }
  }
  _up(e) {
    const d = this.drag; if (!d || e.pointerId !== d.id) return;
    this.drag = null; try { this.root.releasePointerCapture(e.pointerId); } catch (_) { }
    if (d.hov) this.sqEls[d.hov].classList.remove('hov');
    if (!d.active) { if (d.wasSel) { this.sel = null; this._hl(); } return; }
    d.el.classList.remove('drag');
    const to = this._sqAt(e.clientX, e.clientY);
    if (!to || to === d.sq) { this._snapBack(d.el, d.sq); if (to === d.sq) { /* keep selection */ } return; }
    if (d.mode === 'move') {
      if (this.legal && !(this.legal[d.sq] || []).includes(to)) { this._snapBack(d.el, d.sq); return; }
      this.sel = null; this._hl(); this._attempt(d.sq, to, null, true);
    } else { this._snapBack(d.el, d.sq); this.premove = { from: d.sq, to }; this.sel = null; this._hl(); }
  }
  _cancelDrag(snap) { const d = this.drag; if (!d) return; this.drag = null; if (d.hov) this.sqEls[d.hov]?.classList.remove('hov'); if (d.el) { d.el.classList.remove('drag'); if (snap) this._snapBack(d.el, d.sq); } }
  _snapBack(el, sq) { const b = el.style.transform; el.style.transform = this._tf(sq); if (!RM()) el.animate([{ transform: b }, { transform: this._tf(sq) }], { duration: 140, easing: 'ease-out' }); }
  async _attempt(from, to, promo, fromDrag) {
    const p = this.pos[from]; if (!p) return;
    if (!promo && p.t === 'p' && (to[1] === '8' && p.c === 'w' || to[1] === '1' && p.c === 'b')) {
      promo = await this._pickPromo(to, p.c);
      if (!promo) { const el = this.els.get(from); if (el) this._snapBack(el, from); this._hl(); return; }
    }
    const saved = this.pos, prevLast = this.lastMove; this.lastMove = { from, to }; this.check = null;
    this.turn = p.c === 'w' ? 'b' : 'w'; this.userTurn = false; this._threats(); this._applyLocal(from, to, promo, fromDrag ? 'settle' : true); this._hl();
    let ok; try { ok = await this.onMove(from, to, promo || undefined); } catch (_) { ok = false; }
    if (ok === false) { this.lastMove = prevLast; this._reconcile(saved, true); this._hl(); }
  }
  /* play a move typed as SAN or UCI; returns an error string or null */
  typeMove(txt) {
    if (!this.userTurn || !this.legal || this._promoOpen) return 'Not your move yet';
    let g; try { g = new Chess(this.fen); } catch (_) { return 'No position'; }
    const raw = String(txt || '').trim().replace(/0/g, 'O'); if (!raw) return 'Type a move';
    const ms = g.moves({ verbose: true }), u = raw.toLowerCase().replace(/[-=\s]/g, ''), cl = s => s.replace(/[+#!?=]/g, '').replace(/\s/g, '');
    let m = null;
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)) m = ms.find(x => x.from + x.to === u.slice(0, 4) && (u[4] ? x.promotion === u[4] : true));
    if (!m) m = ms.find(x => cl(x.san) === cl(raw));
    if (!m) { const c = ms.filter(x => cl(x.san).toLowerCase() === cl(raw).toLowerCase()); if (c.length === 1) m = c[0]; }
    if (!m) return `"${raw}" is not legal here`;
    if (!(this.legal[m.from] || []).includes(m.to)) return 'That move is not allowed now';
    this.sel = null; this._attempt(m.from, m.to, m.promotion || null, false); return null;
  }
  _pickPromo(to, color) {
    return new Promise(res => {
      this._promoOpen = true; const ov = document.createElement('div'); ov.className = 'promo';
      const [x, y] = this._xy(to), dir = y === 0 ? 1 : -1;
      ['q', 'n', 'r', 'b'].forEach((t, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Promote to ' + t); b.style.left = x * 12.5 + '%'; b.style.top = (y + dir * i) * 12.5 + '%'; b.style.backgroundImage = this.url(color + t.toUpperCase()) ; b.onclick = ev => { ev.stopPropagation(); done(t); }; ov.appendChild(b); });
      const done = v => { this._promoOpen = false; ov.remove(); res(v); };
      ov.addEventListener('pointerdown', ev => ev.stopPropagation()); ov.addEventListener('click', () => done(null));
      this.root.appendChild(ov); ov.querySelector('button').focus({ preventScroll: true });
    });
  }
}
