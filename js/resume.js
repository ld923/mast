// Zero-tap resume: persists the route and the state of an in-progress session (drill, watch, puzzle, play, review).
import { store } from './ui.js';
const KEY = 'resume', MAX = 12 * 36e5;
let armed = null, fresh = () => { };
export const get = () => { const r = store.get(KEY, null); return r && typeof r === 'object' ? r : null; };
const hashNow = () => location.hash.slice(1) || 'today';
export function onFresh(f) { fresh = f; }
/* called on every route change: a different route drops any stored session state */
export function setRoute(h) { const r = get(); if (r && r.route === h) return; store.set(KEY, { route: h, kind: null, state: null, t: Date.now() }); }
export function save(kind, state) { store.set(KEY, { route: hashNow(), kind, state, t: Date.now() }); }
export function patch(kind, p) { const r = get(); if (r && r.kind === kind) store.set(KEY, { ...r, state: { ...r.state, ...p }, t: Date.now() }); }
export function clear(kind) { const r = get(); if (r && (!kind || r.kind === kind)) store.set(KEY, { route: r.route, kind: null, state: null, t: Date.now() }); }
/* at app open: if a recent session exists and the user did not deep-link, jump to its route and arm it for the screen to consume */
export function arm() {
  const r = get(), h = location.hash.slice(1);
  if (!r || !r.kind || !r.state || Date.now() - r.t > MAX || (h && h !== 'today' && h !== r.route)) return false;
  armed = r; if (r.route !== 'today') location.hash = r.route; return true;
}
export function consume(kind) {
  if (!armed || armed.kind !== kind) return null;
  const r = armed; armed = null; pill(); return r.state;
}
export const disarm = () => { armed = null; };
function pill() {
  const old = document.getElementById('rs-pill'); if (old) old.remove();
  const d = document.createElement('div'); d.id = 'rs-pill'; d.setAttribute('role', 'status');
  if (!document.getElementById('rs-css')) { const s = document.createElement('style'); s.id = 'rs-css'; s.textContent = '#rs-pill{position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:60;display:flex;gap:10px;align-items:center;padding:7px 8px 7px 14px;border-radius:99px;background:rgba(20,28,40,.94);color:#F2E8D0;border:1px solid rgba(201,162,75,.55);font:600 13px/1 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4)}#rs-pill button{font:inherit;color:#FFC857;background:rgba(255,200,87,.12);border:1px solid rgba(255,200,87,.4);border-radius:99px;padding:6px 11px;cursor:pointer}'; document.head.appendChild(s); }
  d.innerHTML = '<span>Resumed</span><button type="button">Start fresh?</button>'; document.body.appendChild(d);
  const off = () => d.remove(); d.querySelector('button').onclick = () => { off(); clear(); fresh(); };
  setTimeout(off, 9000);
}
