// Time drama: storm scene (tense -> critical), close-call slow-motion replay.
import { full, getAnim, floatText } from './fx.js';
import { play } from './sound.js';
const CSS = `
.storm{position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:0;transition:opacity .7s;overflow:hidden}
.storm.on{opacity:1}
.storm .dk{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(6,12,22,0) 25%,rgba(6,12,22,.55) 100%),linear-gradient(rgba(10,18,30,.35),rgba(10,18,30,.35));opacity:0;transition:opacity .7s}
.storm.l1 .dk{opacity:.55}.storm.l2 .dk{opacity:1}
.storm i{position:absolute;left:-30%;height:1px;width:22vw;background:linear-gradient(90deg,transparent,rgba(220,235,250,.55),transparent);animation:stw var(--d) linear infinite;animation-delay:var(--dl);top:var(--y);opacity:.7}
@keyframes stw{from{transform:translateX(0)}to{transform:translateX(150vw)}}
.storm b{position:absolute;top:-6vh;width:1px;height:14px;background:rgba(190,215,240,.55);transform:rotate(14deg);animation:str var(--d) linear infinite;animation-delay:var(--dl);left:var(--x);opacity:0}
.storm.l2 b{opacity:1}
@keyframes str{from{transform:translate(0,0) rotate(14deg)}to{transform:translate(-14vh,112vh) rotate(14deg)}}
.crc-bar{position:absolute;left:0;right:0;height:13%;background:#000;z-index:25;pointer-events:none}
.crc-bar.t{top:0}.crc-bar.b{bottom:0}
.crc-ph{position:absolute;left:50%;top:44%;z-index:26;transform:translate(-50%,-50%);font:700 15cqw Oswald,Impact,sans-serif;letter-spacing:.06em;color:#FFC857;text-shadow:0 0 30px rgba(255,200,87,.7),0 4px 0 #3a2300;pointer-events:none}
@media (prefers-reduced-motion:reduce){.storm i,.storm b{animation:none}}`;
let el = null;
function make() {
  if (el) return el;
  const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
  el = document.createElement('div'); el.className = 'storm'; el.setAttribute('aria-hidden', 'true');
  let h = '<div class="dk"></div>';
  for (let i = 0; i < 12; i++) h += `<i style="--y:${(8 + i * 7.6).toFixed(1)}vh;--d:${(1.1 + (i % 5) * .35).toFixed(2)}s;--dl:-${(i * .37).toFixed(2)}s"></i>`;
  for (let i = 0; i < 26; i++) h += `<b style="--x:${(i * 4.1 + (i % 3) * 1.3).toFixed(1)}vw;--d:${(.55 + (i % 4) * .12).toFixed(2)}s;--dl:-${(i * .23).toFixed(2)}s"></b>`;
  el.innerHTML = h; document.body.appendChild(el); return el;
}
/* Storm: call set(state) from the clock's onState ('calm'|'tense'|'critical'); calm() on move. board = Board (rocks the table). */
export function storm(board) {
  let cur = 'calm';
  const api = {
    set(st) {
      if (st === cur) return; cur = st;
      if (!full()) { if (el) el.className = 'storm'; board && board.root.classList.remove('storm1', 'storm2'); return; }
      const e = make(); e.className = 'storm' + (st === 'calm' ? '' : ' on ' + (st === 'tense' ? 'l1' : 'l2'));
      if (board) { board.root.classList.toggle('storm1', st === 'tense'); board.root.classList.toggle('storm2', st === 'critical'); }
    },
    calm() { api.set('calm'); },
    destroy() { cur = ''; api.set('calm'); if (el) { el.remove(); el = null; } }
  };
  return api;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
/* Close-call replay: rewind to fenBefore, replay mv at 0.5x with letterbox bars, Tempo says PHEW, then restore fenAfter. */
export async function closeCall(board, { fenBefore, fenAfter, mv, crew, secs }) {
  const root = board.root, line = crew && crew.line ? crew.line('Tempo', 'time_trouble', { secs }) : '';
  if (crew) crew.react('solve', { who: 'Tempo', ex: 'excited', line: 'PHEW. ' + line });
  if (!full()) return;
  const bars = ['t', 'b'].map(k => { const b = document.createElement('div'); b.className = 'crc-bar ' + k; root.appendChild(b); b.animate([{ transform: `translateY(${k === 't' ? -100 : 100}%)` }, { transform: 'none' }], { duration: 260, easing: 'ease-out', fill: 'both' }); return b; });
  const ph = document.createElement('div'); ph.className = 'crc-ph'; ph.textContent = 'PHEW'; root.appendChild(ph);
  ph.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .25 }, { opacity: 1 }, { opacity: 0 }], { duration: 1500, fill: 'both' });
  board.setPosition(fenBefore, { animate: false, lastMove: null }); board.setLegal({});
  await wait(350); board.slow = 2; play('tick'); board.move(mv.from, mv.to, mv.promotion); await wait(900); board.slow = 1;
  await wait(500);
  board.setPosition(fenAfter, { animate: false, lastMove: { from: mv.from, to: mv.to } }); board.setLegal({});
  await Promise.all(bars.map(b => b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'both' }).finished.catch(() => { })));
  bars.forEach(b => b.remove()); ph.remove();
}
export const getClockStyle = () => { try { return localStorage.getItem('mast.clockStyle') === 'glass' ? 'glass' : 'ring'; } catch (_) { return 'ring'; } };
export const setClockStyle = v => { try { localStorage.setItem('mast.clockStyle', v); } catch (_) { } };
