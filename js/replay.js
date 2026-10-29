// Mistake replays: positions he got wrong are replayed first at the start of the next watch / drill session.
import { Board } from './board2.js';
import { store, avatar } from './ui.js';
import { css, esc, reg } from './coach-core.js';
import * as Pr from './progress.js';
import { play as sfx } from './sound.js';
import { sparkAt } from './fx.js';
const KEY = 'misses';
export const getMisses = () => (store.get(KEY, []) || []).filter(m => m && m.fen && Array.isArray(m.sol) && m.sol.length);
/* m: {k, fen, sol:[uci], alt?:true (sol = alternative first moves), san, played, link} */
export function noteMiss(m) { const L = getMisses().filter(x => x.k !== m.k); L.push({ ...m, t: Date.now() }); store.set(KEY, L.slice(-8)); }
export function clearMiss(k) { const L = getMisses(), n = L.filter(x => x.k !== k); if (n.length !== L.length) store.set(KEY, n); }
const dayDiff = t => Math.round((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 864e5);
const label = t => { const d = dayDiff(t); return d === 1 ? "Yesterday's miss" : d === 0 ? "Earlier miss" : "Last time's miss"; };

export function replayRun(root, { limit = 3 } = {}) {
  const items = getMisses().slice(0, limit); let stopped = false, board = null, res;
  const promise = new Promise(r => res = r), api = { promise, stopped: false, count: items.length, stop() { stopped = api.stopped = true; try { board && board.destroy(); } catch (_) { } res(); } };
  if (!items.length) { res(); return api; }
  css(); reg(api); let i = 0;
  const show = () => {
    if (stopped) return; const it = items[i], g = new Chess(it.fen); let k = 0, wrong = 0, done = false;
    const color = g.turn() === 'w' ? 'white' : 'black';
    root.innerHTML = `<div class="co-run" id="rp"><div class="co-hud"><b>${label(it.t)}</b><span style="flex:1"></span>${it.link ? `<a href="${esc(it.link)}" target="_blank" rel="noopener" style="margin-right:10px">original game</a>` : ''}<span>${i + 1}/${items.length}</span></div><div class="co-bw" style="width:min(100%,480px)"><div class="co-bd" id="rp-bd"></div></div><div class="co-info" id="rp-i" aria-live="polite"></div><div class="co-row" id="rp-a"></div></div>`;
    const info = h => { const e = root.querySelector('#rp-i'); if (e) e.innerHTML = h; };
    const legal = () => { const m = {}; g.moves({ verbose: true }).forEach(x => (m[x.from] ??= []).push(x.to)); return m; };
    const ok = u => it.alt ? it.sol.includes(u) : u === it.sol[k];
    const finish = () => {
      done = true; clearMiss(it.k); board.setLegal({}); sfx('success'); try { sparkAt(root.querySelector('#rp-bd')); } catch (_) { }
      const xp = wrong === 0; if (xp) { try { Pr.addXp(5, 'replay'); } catch (_) { } }
      info(`<b>Solved.</b> ${xp ? 'First try, +5 XP.' : 'No XP for retries, but now it is yours.'}`);
      const last = i + 1 >= items.length; root.querySelector('#rp-a').innerHTML = `<button class="btn" id="rp-next" type="button">${last ? 'On to the session' : 'Next miss'}</button>`;
      const b = root.querySelector('#rp-next'); b.onclick = () => { if (last) { board.destroy(); board = null; res(); } else { i++; board.destroy(); board = null; show(); } }; b.focus({ preventScroll: true });
    };
    board = new Board(root.querySelector('#rp-bd'), { orientation: color, coords: true, onMove: (f, t, p) => {
      if (stopped || done) return false; const m = g.move({ from: f, to: t, promotion: p || 'q' }); if (!m) return false;
      const u = m.from + m.to + (m.promotion || '');
      if (!ok(u)) {
        g.undo(); wrong++; sfx('fail'); board.clearArrows();
        if (wrong >= 2) { const b = it.alt ? it.sol[0] : it.sol[k]; board.showArrow(b.slice(0, 2), b.slice(2, 4), '#FFC857'); info(`<span style="display:inline-flex;gap:8px;align-items:center">${avatar('Skipper', 'pleased', 'sm')}<span><b>Skipper:</b> Here, look at the arrow. That is the move.</span></span>`); }
        else info('<b>Not that one.</b> Take another look. No limit on tries.');
        setTimeout(() => { if (!stopped && !done) { board.setLegal(legal()); board.setTurn(color, true); } }, 60);
        return false;
      }
      sfx(g.in_check() ? 'check' : m.captured ? 'capture' : 'move'); k++;
      if (it.alt || k >= it.sol.length) { setTimeout(finish, 150); return true; }
      setTimeout(() => { const o = it.sol[k], r = g.move({ from: o.slice(0, 2), to: o.slice(2, 4), promotion: o[4] }); k++; board.setPosition(g.fen(), { animate: true, lastMove: { from: r.from, to: r.to }, check: g.in_check() }); if (k >= it.sol.length) return finish(); board.setLegal(legal()); board.setTurn(color, true); info('<b>Good. Keep going.</b>'); }, 450);
      return true;
    } });
    board.setPosition(it.fen, { animate: false, check: g.in_check() }); board.setLegal(legal()); board.setTurn(color, true);
    info(`<b>${g.turn() === 'w' ? 'White' : 'Black'} to move.</b> You missed this one last time. Solve it before we sail on.${it.played ? ` (You played ${esc(it.played)}.)` : ''}`);
  };
  show(); return api;
}
