// chess.com sync, straight from the browser. Only requests to api.chess.com leave the device.
// New games -> IndexedDB (localStorage fallback) -> background engine pass over Gerald's moves -> worst mistake becomes a puzzle ("From your latest games").
import { store } from './ui.js';
import { Engine } from './engine.js';

const API = 'https://api.chess.com/pub/player/';
const DAY6H = 6 * 3600e3, MAXG = 150, MAXP = 60, MONTHS = 2;
export const getUser = () => (store.get('sync.user', 'congreve274') || 'congreve274').trim().toLowerCase();
export const setUser = u => { u = String(u || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''); store.set('sync.user', u || 'congreve274'); };

/* ---------- storage: IndexedDB with localStorage fallback ---------- */
let dbp = null;
const idb = () => dbp || (dbp = new Promise((res, rej) => {
  try { const r = indexedDB.open('mast', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
}));
async function kvGet(k, d) {
  try { const db = await idb(); return await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result === undefined ? d : q.result); q.onerror = () => rej(q.error); }); }
  catch (_) { return store.get('kv.' + k, d); }
}
async function kvSet(k, v) {
  try { const db = await idb(); await new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
  catch (_) { // localStorage guard: keep it small
    let s = JSON.stringify(v); if (Array.isArray(v) && s.length > 900e3) { v = v.slice(0, Math.max(10, Math.floor(v.length * 900e3 / s.length))); }
    store.set('kv.' + k, v);
  }
}

/* ---------- state (in memory, mirrored to storage) ---------- */
export const S = { games: [], puzzles: [], done: [], meta: {}, ready: null, status: 'idle', msg: '', progress: '' };
const subs = new Set(); export const onSync = f => { subs.add(f); return () => subs.delete(f); };
const emit = () => { subs.forEach(f => { try { f(); } catch (_) { } }); dispatchEvent(new CustomEvent('mast:sync')); };
S.ready = (async () => {
  S.games = await kvGet('games', []); S.puzzles = await kvGet('puzzles', []); S.done = await kvGet('done', []); S.meta = await kvGet('meta', {});
})();
const save = async () => { await kvSet('games', S.games); await kvSet('puzzles', S.puzzles); await kvSet('done', S.done); await kvSet('meta', S.meta); };

export const latestPuzzles = () => S.puzzles.slice();
export const syncedPGN = () => S.games.map(g => g.pgn).join('\n\n');
export const rating = () => S.meta.blitz ? { blitz: S.meta.blitz, rapid: S.meta.rapid, t: S.meta.statsT, user: S.meta.user } : null;
export const lastSync = () => S.meta.t || 0;
export const ago = t => { if (!t) return 'never'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 2880 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; };

/* bundled links, to de-dupe against my_games.pgn */
let bundled = null;
const bundledLinks = () => bundled || (bundled = fetch('data/my_games.pgn').then(r => r.text()).then(t => new Set([...t.matchAll(/^\[Link "([^"]+)"\]/gm)].map(m => m[1]))).catch(() => new Set()));

/* ---------- chess.com ---------- */
class SyncError extends Error { constructor(kind, msg) { super(msg); this.kind = kind; } }
async function getJSON(url) {
  let r; try { r = await fetch(url, { headers: { accept: 'application/json' } }); } catch (e) { throw new SyncError(navigator.onLine === false ? 'offline' : 'blocked', navigator.onLine === false ? 'You are offline.' : 'The browser could not reach chess.com (network or CORS).'); }
  if (r.status === 404) throw new SyncError('user', 'chess.com has no player called "' + getUser() + '".');
  if (r.status === 429) throw new SyncError('rate', 'chess.com asked us to slow down. Try again in a few minutes.');
  if (!r.ok) throw new SyncError('http', 'chess.com answered ' + r.status + '.');
  return r.json();
}
const asPGN = g => { // chess.com's pgn already has headers + clocks; make sure Link is present
  let p = g.pgn || ''; if (p && !/^\[Link /m.test(p)) p = p.replace(/\n\n/, `\n[Link "${g.url}"]\n\n`); return p;
};
const hdr = (p, k) => (new RegExp('^\\[' + k + ' "([^"]*)"\\]', 'm').exec(p) || [])[1] || '';

export async function syncNow({ manual = false } = {}) {
  await S.ready; if (S.status === 'syncing') return;
  const user = getUser();
  if (navigator.onLine === false) { S.status = 'offline'; S.msg = 'Offline. Sync resumes when you are back on the water.'; emit(); return; }
  S.status = 'syncing'; S.msg = 'Checking chess.com...'; emit();
  try {
    if (S.meta.user && S.meta.user !== user) { S.games = []; S.puzzles = []; S.done = []; S.meta = {}; }
    const arch = (await getJSON(API + user + '/games/archives')).archives || [];
    const seen = new Set(S.games.map(g => g.link)), known = await bundledLinks(), fresh = [];
    for (const url of arch.slice(-MONTHS).reverse()) {
      const m = await getJSON(url);
      for (const g of (m.games || [])) {
        if (!g.pgn || g.rules && g.rules !== 'chess' || !g.url || seen.has(g.url) || known.has(g.url)) continue;
        const pgn = asPGN(g); if (!pgn) continue;
        const white = (g.white.username || '').toLowerCase() === user;
        fresh.push({ link: g.url, t: g.end_time || 0, pgn, white, tc: g.time_class, res: (white ? g.white : g.black).result });
      }
    }
    fresh.sort((a, b) => b.t - a.t);
    S.games = [...fresh, ...S.games].slice(0, MAXG);
    try { // stats
      const st = await getJSON(API + user + '/stats');
      S.meta.blitz = st.chess_blitz && st.chess_blitz.last && st.chess_blitz.last.rating; S.meta.rapid = st.chess_rapid && st.chess_rapid.last && st.chess_rapid.last.rating; S.meta.bullet = st.chess_bullet && st.chess_bullet.last && st.chess_bullet.last.rating; S.meta.statsT = Date.now();
    } catch (e) { if (e.kind === 'offline') throw e; }
    S.meta.user = user; S.meta.t = Date.now(); S.meta.lastNew = fresh.length;
    S.status = 'ok'; S.msg = fresh.length ? `${fresh.length} new game${fresh.length > 1 ? 's' : ''} found.` : 'No new games.';
    await save(); emit(); analyseQueue();
  } catch (e) {
    S.status = e.kind === 'offline' ? 'offline' : 'error'; S.msg = e.kind ? e.message : 'Sync failed: ' + (e.message || e); S.errKind = e.kind || 'other'; emit();
  }
}
export const maybeAutoSync = async () => { await S.ready; if (Date.now() - lastSync() > DAY6H) syncNow(); else analyseQueue(); };

/* ---------- background analysis: one game at a time, only when visible and idle ---------- */
let eng = null, running = false, cancelled = false;
export const cancelAnalysis = () => { cancelled = true; if (eng) { try { eng.stop(); } catch (_) { } } };
const idle = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 3000 }) : setTimeout(r, 200)));
const okToRun = () => document.visibilityState === 'visible' && !cancelled;
const busyRoute = () => /^#(play|chat)/.test(location.hash);
const cpOf = (line, fen) => { // side-to-move centipawns
  const s = line && line.score || {}; return s.mate != null ? (s.mate > 0 ? 10000 - s.mate : -10000 - s.mate) : (s.cp || 0);
};
const phaseOf = (g, ply) => { const nonP = g.fen().split(' ')[0].replace(/[^qrbnQRBN]/g, '').length; return ply < 20 ? 'opening' : nonP <= 6 ? 'endgame' : 'middlegame'; };
const ADV = { opening: 'Morphy', middlegame: 'Kasparov', endgame: 'Capablanca' };

async function analyseGame(rec) {
  const Chess = window.Chess; const g0 = new Chess(); if (!g0.load_pgn(rec.pgn)) return null;
  const moves = g0.history({ verbose: true }), mineC = rec.white ? 'w' : 'b';
  const pos = []; const g = new Chess(); // fen before each of my moves, my move, and fen after
  moves.forEach((m, i) => { const before = g.fen(); g.move(m.san); if (m.color === mineC && i >= 8 && i < 90) pos.push({ i, before, after: g.fen(), m }); });
  if (!eng) eng = new Engine();
  let worst = null;
  for (let k = 0; k < pos.length; k++) {
    if (!okToRun() || cancelled) return 'paused';
    await idle(); if (!okToRun() || cancelled) return 'paused';
    S.progress = `Move ${k + 1} of ${pos.length}`; emit();
    const p = pos[k];
    const a = await eng.analyse(p.before, { depth: 10, multipv: 1, cancelled: () => cancelled || document.visibilityState !== 'visible' });
    if (a.cancelled || !a.lines.length) return 'paused';
    const best = a.lines[0], bestUci = best.pv[0]; if (!bestUci || bestUci === p.m.from + p.m.to + (p.m.promotion || '')) continue;
    const bestCp = cpOf(best, p.before); if (bestCp < -400 || bestCp > 900) continue; // already lost / already crushing
    const b = await eng.analyse(p.after, { depth: 10, multipv: 1, cancelled: () => cancelled || document.visibilityState !== 'visible' });
    if (b.cancelled || !b.lines.length) return 'paused';
    const loss = bestCp - (-cpOf(b.lines[0], p.after));
    if (loss >= 150 && (!worst || loss > worst.loss)) worst = { ...p, loss, bestCp, pv: best.pv.slice(0, 3) };
  }
  if (!worst) return null;
  const t = new Chess(worst.before), san = [], mn = Math.floor(worst.i / 2) + 1;
  worst.pv.forEach(u => { const mv = t.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); if (mv) san.push(mv.san); });
  if (!san.length) return null;
  const solution = worst.pv.slice(0, san.length), tx = new Chess(worst.before);
  const white = worst.before.split(' ')[1] === 'w';
  const solution_san = san.map((s, i) => (white ? (i % 2 === 0 ? `${mn + Math.floor(i / 2)}. ` : '') : (i === 0 ? `${mn}... ` : i % 2 === 1 ? `${mn + Math.ceil(i / 2)}. ` : '')) + s).join(' ');
  const h = k => hdr(rec.pgn, k);
  return {
    id: 'sg-' + rec.link.split('/').pop(), fen: worst.before, solution, solution_san, eval: worst.bestCp, loss: worst.loss, phase: phaseOf(tx, worst.i), themes: ['recent'], advisor: ADV[phaseOf(tx, worst.i)],
    source: { Date: h('Date'), White: h('White'), Black: h('Black'), Result: h('Result'), TimeControl: h('TimeControl'), Link: rec.link }, you_played: worst.m.san, recent: true
  };
}
export async function analyseQueue() {
  if (running) return; await S.ready; running = true; cancelled = false;
  try {
    while (!cancelled) {
      const rec = S.games.find(g => !S.done.includes(g.link)); if (!rec) break;
      if (document.visibilityState !== 'visible') { await new Promise(r => { const f = () => { if (document.visibilityState === 'visible') { removeEventListener('visibilitychange', f); r(); } }; addEventListener('visibilitychange', f); }); }
      if (busyRoute()) { await new Promise(r => setTimeout(r, 8000)); continue; }
      S.status = 'analysing'; S.msg = 'Looking over your latest games...'; emit();
      let r; try { r = await analyseGame(rec); } catch (e) { r = null; }
      if (r === 'paused') { continue; }
      S.done.push(rec.link); S.done = S.done.slice(-400);
      if (r) { S.puzzles = [r, ...S.puzzles.filter(p => p.id !== r.id)].slice(0, MAXP); }
      await save(); S.status = 'ok'; S.progress = ''; S.msg = r ? 'Added a puzzle from your latest games.' : S.msg; emit();
    }
  } finally {
    running = false; S.progress = ''; if (S.status === 'analysing') { S.status = 'ok'; S.msg = S.puzzles.length ? `${S.puzzles.length} puzzle${S.puzzles.length > 1 ? 's' : ''} from your latest games.` : 'Latest games looked over.'; }
    if (eng) { try { eng._reset(); } catch (_) { } eng = null; } emit();
  }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.games.some(g => !S.done.includes(g.link))) analyseQueue(); });

/* ---------- settings UI ---------- */
export function mountSyncUI(box) {
  if (!box) return;
  box.innerHTML = `<div style="display:flex;gap:6px;margin-top:4px"><input id="sync-user" type="text" autocomplete="off" spellcheck="false" aria-label="chess.com username" style="flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid var(--glass-b);background:var(--glass-h);color:var(--fg)"><button class="btn ghost sm" type="button" id="sync-go">Sync now</button></div><p class="sub sm" id="sync-msg" style="margin:4px 0 0;line-height:1.4" role="status"></p><p class="sub sm" style="margin:4px 0 0;line-height:1.4">Your games are fetched from chess.com by this browser and stay on this device. Nothing else is sent anywhere.</p>`;
  const inp = box.querySelector('#sync-user'), btn = box.querySelector('#sync-go'), msg = box.querySelector('#sync-msg');
  inp.value = getUser(); inp.onclick = e => e.stopPropagation(); inp.onchange = () => { setUser(inp.value); inp.value = getUser(); syncNow({ manual: true }); };
  btn.onclick = e => { e.stopPropagation(); setUser(inp.value); syncNow({ manual: true }); };
  const paint = () => {
    const busy = S.status === 'syncing'; btn.disabled = busy; btn.textContent = busy ? 'Syncing...' : 'Sync now';
    const t = lastSync(), r = rating();
    msg.textContent = (S.status === 'error' ? S.msg + ' Your bundled games and puzzles still work.' : S.status === 'offline' ? S.msg : S.msg || '') + (S.progress ? ' ' + S.progress + '.' : '') +
      (t ? ` Last synced ${ago(t)}.` : ' Not synced yet.') + (r ? ` Blitz ${r.blitz}, updated ${ago(r.t)}.` : '');
  };
  paint(); onSync(paint);
}
