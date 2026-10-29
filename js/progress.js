// Progression core: single source of truth, localStorage 'mast.progress' (versioned). No DOM here; prog-ui.js listens via on().
// XP, ranks, streak, daily voyage, chests, position cards, island bosses, Tempo unlock, achievements.
import { store } from './ui.js';

export const VERSION = 1;
export const RANKS = [
  { n: 'Deckhand', xp: 0 }, { n: 'Ordinary Seaman', xp: 100 }, { n: 'Able Seaman', xp: 300 }, { n: 'Bosun', xp: 700 }, { n: 'Second Mate', xp: 1300 },
  { n: 'First Mate', xp: 2200 }, { n: 'Captain', xp: 3500 }, { n: 'Commodore', xp: 5500 }, { n: 'Admiral', xp: 8000 }
];
export const THEMES = ['teak', 'chart', 'havana', 'riga'];
export const ISLAND_IDS = ['openings', 'tactics', 'middle', 'grind', 'endgame', 'leela'];
const GOAL = 20;
export const BOSSES = {
  openings: { src: 'Morphy', who: 'Morphy', name: 'Paul Morphy', title: 'Warden of Openings Reef', isle: 'Openings Reef' },
  tactics: { src: 'Tal', who: 'Tal', name: 'Mikhail Tal', title: 'Magician of the Tactics Isles', isle: 'Tactics Isles' },
  middle: { src: null, who: 'Kasparov', name: 'Garry Kasparov', title: 'Beast of the Narrows', isle: 'The Middlegame Narrows' },
  grind: { src: 'Carlsen', who: 'Carlsen', name: 'Magnus Carlsen', title: 'Grinder of the Bank', isle: "Grinder's Bank" },
  endgame: { src: 'Capablanca', who: 'Capablanca', name: 'José Capablanca', title: 'Machine of the Strait', isle: 'Endgame Strait' },
  leela: { src: null, who: 'Leela', name: 'Leela', title: 'Keeper of the Lighthouse', isle: "Leela's Lighthouse" }
};
export const BOSS_CLOCK = 20; // seconds per position (normal puzzles have no clock)

/* ---------- state ---------- */
const blank = () => ({
  v: VERSION, xp: 0, migrated: false, streak: { n: 0, last: '', best: 0 },
  daily: { date: '', have: {}, master: false, chest: 0, ids: {} }, dailyDone: 0, chests: [], themes: [], cards: {}, conquered: {},
  tempo: { unlocked: false, pending: false, rise: false }, ach: {}, xpLog: {},
  stats: { solves: 0, convRun: 0, sessions: 0, perfect: 0, sacs: 0, bosses: 0, chestsOpened: 0, masterSolves: {}, night: 0 }
});
const merge = (d, s) => { for (const k in d) { if (s[k] === undefined) s[k] = d[k]; else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && s[k] && typeof s[k] === 'object') merge(d[k], s[k]); } return s; };
let P = null, DATA = { sets: {} }, dayOff = 0;
const subs = [];
export const on = f => subs.push(f);
const emit = (type, d = {}) => subs.forEach(f => { try { f(type, d); } catch (e) { console.error(e); } });
const save = () => { store.set('progress', P); store.set('progress.streak', P.streak); };

export function dayKey(off = 0) { const d = new Date(Date.now() + (dayOff + off) * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const dayNum = (k = dayKey()) => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };

function load() {
  if (P) return P;
  const raw = store.get('progress', null);
  if (raw && typeof raw === 'object') { P = merge(blank(), raw); P.v = VERSION; } // future: if (raw.v < 2) step-migrate here
  else { // migrate from pre-Phase-4 keys (estimates, flagged)
    P = blank();
    const cs = store.get('crewsolved', {}) || {}, pz = store.get('pz', []) || [], oldS = store.get('streak', 0);
    P.xp = (cs._all || 0) * 10 + pz.filter(x => x === 1).length * 8;
    const n = typeof oldS === 'number' ? oldS : (oldS && (oldS.n || oldS.count || oldS.days)) || 0; if (n) P.streak = { n, last: dayKey(-1), best: n };
    P.migrated = true; save();
  }
  return P;
}
load();
export const state = () => P;
export function setData(d) { DATA = d; CARDS = null; dm = null; }

/* ---------- XP, ranks ---------- */
export const rankIdx = (xp = P.xp) => { let r = 0; RANKS.forEach((k, i) => { if (xp >= k.xp) r = i; }); return r; };
export const rank = () => { const i = rankIdx(), a = RANKS[i], b = RANKS[i + 1]; return { i, name: a.n, xp: P.xp, next: b ? b.n : null, base: a.xp, to: b ? b.xp : a.xp, frac: b ? (P.xp - a.xp) / (b.xp - a.xp) : 1 }; };
export function addXp(n, why = '') {
  n = Math.round(n); if (n <= 0) return 0;
  const before = rankIdx(); P.xp += n; { const k = dayKey(), L = P.xpLog || (P.xpLog = {}); L[k] = (L[k] || 0) + n; Object.keys(L).sort().slice(0, -14).forEach(x => delete L[x]); } save(); emit('xp', { n, why });
  const after = rankIdx(); if (after > before) { emit('rank', { from: before, to: after }); check({}); }
  return n;
}
const mult = s => s >= 10 ? 1.5 : s >= 5 ? 1.25 : s >= 3 ? 1.1 : 1;

/* ---------- streak ---------- */
export function streakNow() { const s = P.streak; return s.last === dayKey() || s.last === dayKey(-1) ? s.n : 0; }
function touchStreak() {
  const s = P.streak, t = dayKey();
  if (s.last === t) return;
  s.n = s.last === dayKey(-1) ? s.n + 1 : 1; s.last = t; s.best = Math.max(s.best, s.n); save(); emit('streak', { n: s.n });
}

/* ---------- cards ---------- */
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
export const pid = (m, p) => m + ':' + hash(p.fen + (p.solution ? p.solution[0] : ''));
const key = p => (p.themes || []).slice().sort().join('+') + '|' + p.phase;
let CARDS = null;
export const RARITY = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
// rarity = how few positions in the whole master set share this pattern (themes + phase); the Opera game is always Legendary
export function allCards() {
  if (CARDS) return CARDS;
  const L = []; const freq = {}; let N = 0;
  Object.entries(DATA.sets).forEach(([m, list]) => { if (m === 'me') return; list.forEach(p => { freq[key(p)] = (freq[key(p)] || 0) + 1; N++; }); });
  Object.entries(DATA.sets).forEach(([m, list]) => { if (m === 'me') return; list.forEach(p => {
    const s = p.source || {}, f = freq[key(p)] / N, opera = /Isouard|Brunswick/.test((s.White || '') + (s.Black || ''));
    const sn = x => (x || '').split(',')[0].trim();
    L.push({ id: pid(m, p), m, fen: p.fen, move: (p.solution || [])[0], year: (s.Date || '').slice(0, 4), white: sn(s.White), black: sn(s.Black), event: s.Event || '', opera,
      rar: opera ? 4 : f >= .25 ? 0 : f >= .10 ? 1 : f >= .04 ? 2 : f >= .015 ? 3 : 4, themes: p.themes || [], phase: p.phase });
  }); });
  return CARDS = L;
}
export const cardById = id => allCards().find(c => c.id === id) || ((P && P.cards[id] || {}).custom || null);
export const collected = () => Object.keys(P.cards);
/* secrets: mint a one-off card (Immortal, bottle riddles); the card data lives in the save itself */
export const customCards = () => Object.values(P.cards).map(x => x.custom).filter(Boolean);
export function mintCard(c, via) { if (P.cards[c.id]) return false; P.cards[c.id] = { m: c.m, t: Date.now(), via: via || 'secret', custom: c }; save(); emit('card', { card: c, via }); return true; }
function collect(c, via) {
  if (P.cards[c.id]) return false;
  P.cards[c.id] = { m: c.m, t: Date.now(), via: via || 'solve' }; save(); emit('card', { card: c, via }); return true;
}

/* ---------- honest dedupe: each position pays out once per day ---------- */
function fresh(id) {
  if (P.daily.date !== dayKey()) rollDaily();
  if (P.daily.ids[id]) return false; P.daily.ids[id] = 1; return true;
}

/* ---------- daily voyage ---------- */
function rollDaily() { P.daily = { date: dayKey(), have: {}, master: false, chest: 0, ids: {} }; save(); }
const rng = s => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
let dm = null;
function dailyMaster() {
  const t = dayKey(), ok = !!Object.keys(DATA.sets).length; if (dm && dm.t === t && dm.ok === ok) return dm;
  const ms = Object.keys(DATA.sets).filter(k => k !== 'me').sort(), r = rng(dayNum() * 7919 + 13); r(); r();
  let o = { t, ok, m: null, p: null, id: null };
  if (ms.length) { const m = ms[Math.floor(r() * ms.length)], list = DATA.sets[m], p = list[Math.floor(r() * list.length)]; o = { ...o, m, p, id: pid(m, p) }; }
  return dm = o;
}
export function daily() {
  if (P.daily.date !== dayKey()) rollDaily();
  const D = P.daily, M = dailyMaster(), set = (k, label, href) => ({ k, label, need: 5, have: Math.min(5, D.have[k] || 0), done: (D.have[k] || 0) >= 5, href });
  const stops = [set('convert', 'Convert set', '#drills/convert'), set('blitz', 'Blitz set', '#drills/blitz'),
    { k: 'master', label: M.m ? `${M.m} puzzle` : 'Master puzzle', need: 1, have: D.master ? 1 : 0, done: !!D.master, href: '#puzzles/daily' }, set('tempo', 'Tempo set', '#drills/tempo')];
  return { date: D.date, stops, done: stops.every(s => s.done), chest: D.chest, master: M };
}
function dailyCheck() {
  const d = daily();
  if (d.done && !P.daily.chest) { P.daily.chest = 1; P.chests.push({ id: 'd' + Date.now(), from: 'daily' }); P.dailyDone++; save(); emit('daily', { d }); check({}); }
  else emit('dailyprog', { d });
}

/* ---------- chests ---------- */
export const chestCount = () => P.chests.length;
export function openChest() {
  const c = P.chests.shift(); if (!c) return null;
  const R = [], boss = c.from !== 'daily', xp = (boss ? 60 : 30) + Math.floor(Math.random() * 30);
  R.push({ t: 'xp', v: xp });
  const locked = THEMES.filter(t => !P.themes.includes(t));
  if (locked.length && (!P.themes.length || Math.random() < (boss ? .7 : .35))) { const t = locked[Math.floor(Math.random() * locked.length)]; P.themes.push(t); R.push({ t: 'theme', id: t }); }
  const ms = ['Morphy', 'Kasparov', 'Capablanca', 'Tal', 'Carlsen'], who = ms[Math.floor(Math.random() * ms.length)];
  const cs = store.get('crewsolved', {}) || {}; cs[who] = (cs[who] || 0) + 3; store.set('crewsolved', cs); R.push({ t: 'outfit', who, v: 3 });
  const un = allCards().filter(x => !P.cards[x.id]);
  if (un.length && Math.random() < (boss ? .9 : .5)) { const cd = un[Math.floor(Math.random() * un.length)]; collect(cd, 'chest'); R.push({ t: 'card', id: cd.id }); }
  P.stats.chestsOpened++; save(); addXp(xp, 'chest'); check({}); emit('chestopen', { R, from: c.from }); return R;
}

/* ---------- bosses ---------- */
const islProg = id => ((store.get('prog', {}) || {})[id] || 0) / GOAL;
export const bossReady = id => !P.conquered[id] && islProg(id) >= .5;
export const isConquered = id => !!P.conquered[id];
export const conqueredCount = () => ISLAND_IDS.filter(i => P.conquered[i]).length;
const diff = p => (p.themes || []).reduce((a, t) => a + (t === 'sacrifice' ? 3 : String(t).startsWith('mate') ? 3 : t === 'quiet' ? 2 : 1), 0) + (p.solution || []).length + Math.abs(p.eval || 0) / 300;
export function bossSet(id) {
  const B = BOSSES[id], sets = DATA.sets; let pool = [];
  if (B.src && sets[B.src]) pool = sets[B.src].map(p => ({ p, m: B.src }));
  else Object.entries(sets).forEach(([m, l]) => { if (m !== 'me') l.forEach(p => { if (id === 'leela' ? (p.themes || []).some(t => String(t).startsWith('mate') || t === 'sacrifice') : p.phase === 'middlegame') pool.push({ p, m }); }); });
  pool.sort((a, b) => diff(b.p) - diff(a.p)); pool = pool.slice(0, 40);
  for (let i = pool.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [pool[i], pool[k]] = [pool[k], pool[i]]; }
  return pool.slice(0, 5).map(x => ({ ...x.p, __m: x.m }));
}
export function bossWin(id) {
  if (P.conquered[id]) return false;
  P.conquered[id] = Date.now(); P.stats.bosses++; P.chests.push({ id: 'b' + Date.now(), from: 'boss:' + id }); save();
  addXp(60, 'boss'); emit('conquer', { id });
  if (conqueredCount() === ISLAND_IDS.length && !P.tempo.unlocked) { P.tempo.unlocked = true; P.tempo.pending = true; P.tempo.rise = true; save(); emit('tempo', {}); }
  check({}); return true;
}
export const tempoUnlocked = () => P.tempo.unlocked;
export const tempoPending = () => P.tempo.pending;
export function tempoSeen() { P.tempo.pending = false; save(); }
export function takeRise() { const r = P.tempo.rise; if (r) { P.tempo.rise = false; save(); } return r; }

/* ---------- hooks (called by drills.js / app.js) ---------- */
export function onDrillSolve({ mode, id, spent = 0, budget = 8, streak = 1, sac = false }) {
  const first = fresh(mode + ':' + id), st = P.stats; st.solves++; if (sac) st.sacs++;
  if (mode === 'convert') st.convRun++;
  if (new Date().getHours() < 4) st.night++;
  let xp = 0;
  if (first) { const bonus = Math.max(0, Math.min(5, Math.round(5 * (1 - spent / budget)))); xp = addXp((10 + bonus) * mult(streak), 'drill'); P.daily.have[mode] = (P.daily.have[mode] || 0) + 1; save(); dailyCheck(); }
  save(); check({ mode, spent }); return xp;
}
export function onDrillMiss({ mode }) { if (mode === 'convert') { P.stats.convRun = 0; save(); } }
export function onSession({ mode, ok, n, avg, flags, best, storm }) {
  P.stats.sessions++; if (ok === n && n >= 10) P.stats.perfect++; touchStreak();
  const p = store.get('prog', {}) || {}; p.leela = (p.leela || 0) + 2; store.set('prog', p); // the lighthouse fills as you visit it
  save(); addXp(25, 'session'); check({ session: { mode, ok, n, avg, flags, best, storm } });
}
export function onPuzzle({ src, pz, sac = false, boss = false }) {
  const master = src && src !== 'me', id = master ? pid(src, pz) : 'me:' + hash(pz.fen), out = { xp: 0, card: null };
  P.stats.solves++; if (sac) P.stats.sacs++; if (new Date().getHours() < 4) P.stats.night++;
  if (master) P.stats.masterSolves[src] = (P.stats.masterSolves[src] || 0) + 1;
  if (!boss && fresh('pz:' + id)) out.xp = addXp(master ? 12 : 8, 'puzzle');
  if (master) { const c = cardById(id); if (c && collect(c, 'solve')) out.card = c; if (daily().master.id === id && !P.daily.master) { P.daily.master = true; save(); dailyCheck(); } }
  save(); check({ puzzleId: id, card: out.card }); return out;
}

/* ---------- achievements ---------- */
const rk = () => rankIdx();
export const ACH = [
  { id: 'firstsail', n: 'First Sail', d: 'Solve your first position.', who: 'Skipper', line: 'Anchors aweigh. First one in the log.', t: () => P.stats.solves >= 1 },
  { id: 'cleanharbour', n: 'Clean Harbour', d: 'Solve 10 Convert drills in a row.', who: 'Carlsen', line: 'Ten won positions, ten wins. Boring. Perfect.', t: () => P.stats.convRun >= 10 },
  { id: 'flagnever', n: 'Flag Never Fell', d: 'Finish a session without a single timeout.', who: 'Tempo', line: 'Never rushed, never late.', t: c => c.session && c.session.flags === 0 },
  { id: 'knotspeed', n: 'Knot Speed', d: 'Average under 3 seconds a decision over a full session.', who: 'Kasparov', line: 'Initiative! That is how you move.', t: c => c.session && c.session.n >= 10 && c.session.avg < 3 },
  { id: 'oldsalt', n: 'Old Salt', d: 'Keep a 30-day streak.', who: 'Skipper', line: 'Thirty days of salt in the beard.', t: () => streakNow() >= 30 },
  { id: 'opera', n: 'Opera Night', d: "Solve a position from Morphy's Opera game.", who: 'Morphy', line: 'Bravo, sir. The Duke never saw it coming.', t: c => c.card && c.card.opera },
  { id: 'storm', n: 'Weathered the Storm', d: 'Miss three in a row, then solve three in a row, in one session.', who: 'Skipper', line: 'Rough seas. You rode it out.', t: c => c.session && c.session.storm },
  { id: 'fairwinds', n: 'Fair Winds', d: 'Reach a 3-day streak.', who: 'Skipper', line: 'The wind is with us.', t: () => streakNow() >= 3 },
  { id: 'weekatsea', n: 'A Week at Sea', d: 'Reach a 7-day streak.', who: 'Capablanca', line: 'Consistency. The quiet strength.', t: () => streakNow() >= 7 },
  { id: 'ordinary', n: 'Signed On', d: 'Reach the rank of Ordinary Seaman.', who: 'Skipper', line: 'Proper crew now.', t: () => rk() >= 1 },
  { id: 'able', n: 'Able and Willing', d: 'Reach the rank of Able Seaman.', who: 'Skipper', line: 'Able Seaman. Say it loud.', t: () => rk() >= 2 },
  { id: 'bosun', n: "Bosun's Whistle", d: 'Reach the rank of Bosun.', who: 'Kasparov', line: 'Now you give the orders!', t: () => rk() >= 3 },
  { id: 'captain', n: "Captain's Hat", d: 'Reach the rank of Captain.', who: 'Carlsen', line: 'Captain, huh. Fine. Do not get comfortable.', t: () => rk() >= 6 },
  { id: 'admiral', n: 'Admiral of the Fleet', d: 'Reach the rank of Admiral.', who: 'Tempo', line: 'Admiral. I will still be waiting.', t: () => rk() >= 8 },
  { id: 'chartmaker', n: 'Chart Maker', d: 'Collect 10 position cards.', who: 'Morphy', line: 'A gentleman collects.', t: () => collected().length >= 10 },
  { id: 'curios', n: 'Cabinet of Curiosities', d: 'Collect 50 position cards.', who: 'Tal', line: 'Into the dark forest of cards!', t: () => collected().length >= 50 },
  { id: 'rarefind', n: 'Rare Find', d: 'Collect a Rare or better card.', who: 'Leela', line: 'Low frequency pattern detected. Nice.', t: c => c.card && c.card.rar >= 2 },
  { id: 'treasure', n: 'Treasure Found', d: 'Open your first chest.', who: 'Skipper', line: 'Shiver me timbers.', t: () => P.stats.chestsOpened >= 1 },
  { id: 'dailywatch', n: 'Daily Watch', d: 'Complete a daily voyage.', who: 'Skipper', line: 'Four stops, all ticked off.', t: () => P.dailyDone >= 1 },
  { id: 'sevenwatches', n: 'Seven Watches', d: 'Complete seven daily voyages.', who: 'Capablanca', line: 'A routine well kept.', t: () => P.dailyDone >= 7 },
  { id: 'landfall', n: 'Landfall', d: 'Conquer your first island.', who: 'Tal', line: 'Plant the flag, my friend.', t: () => conqueredCount() >= 1 },
  { id: 'fullchart', n: 'The Full Chart', d: 'Conquer all six islands.', who: 'Skipper', line: 'Every island is ours.', t: () => conqueredCount() >= ISLAND_IDS.length },
  { id: 'rock', n: "Tempo's Rock", d: 'Find the way to the final boss.', who: 'Tempo', line: 'Took you long enough.', t: () => P.tempo.unlocked },
  { id: 'sealegs', n: 'Sea Legs', d: 'Solve 100 positions.', who: 'Skipper', line: 'You walk like a sailor now.', t: () => P.stats.solves >= 100 },
  { id: 'marlin', n: 'Sharp as a Marlinspike', d: 'Solve 5 sacrifice positions.', who: 'Tal', line: 'Sacrifice! Always sacrifice!', t: () => P.stats.sacs >= 5 },
  { id: 'fullsail', n: 'Full Sail', d: 'Score 10 of 10 in a session.', who: 'Capablanca', line: 'Flawless technique.', t: c => c.session && c.session.ok === c.session.n && c.session.n >= 10 },
  { id: 'middlewatch', n: 'Middle Watch', d: 'Solve a position after midnight.', who: 'Leela', line: 'Even the lighthouse sleeps at this hour.', t: () => P.stats.night >= 1 },
  { id: 'bossdown', n: 'Boss Down', d: 'Beat an island boss.', who: 'Kasparov', line: 'Crushing, simply crushing!', t: () => P.stats.bosses >= 1 }
];
function check(ctx) {
  ACH.forEach(a => { if (!P.ach[a.id]) { let ok = false; try { ok = !!a.t(ctx); } catch (e) { } if (ok) { P.ach[a.id] = Date.now(); save(); emit('ach', { a }); } } });
}
export const achieved = id => !!P.ach[id];

/* ---------- debug (only with ?debug=1) ---------- */
if (/[?&]debug=1/.test(location.search)) {
  window.__mastDebug = {
    unlockTheme: id => { if (!P.themes.includes(id)) P.themes.push(id); save(); },
    grant: n => addXp(n, 'debug'), state: () => P, rank, daily, streakNow,
    day: n => { dayOff = n; dm = null; }, setStreak: n => { P.streak = { n, last: dayKey(), best: Math.max(n, P.streak.best) }; save(); emit('streak', { n }); check({}); },
    session: o => onSession({ mode: 'convert', ok: 10, n: 10, avg: 2.5, flags: 0, best: 10, storm: false, ...o }),
    finishDaily: () => { if (P.daily.date !== dayKey()) rollDaily(); ['convert', 'blitz', 'tempo'].forEach(k => P.daily.have[k] = 5); P.daily.master = true; save(); dailyCheck(); },
    chest: (from = 'daily') => { P.chests.push({ id: 'x' + Date.now(), from }); save(); emit('daily', {}); },
    solveCard: (m = 'Morphy', i = 310) => onPuzzle({ src: m, pz: DATA.sets[m][i] }),
    prog: (id, n) => { const p = store.get('prog', {}) || {}; p[id] = n; store.set('prog', p); },
    tempoAgain: () => { P.tempo.pending = true; P.tempo.rise = true; save(); },
    conquer: id => bossWin(id), conquerAll: () => ISLAND_IDS.forEach(bossWin),
    ach: id => { P.ach[id] = Date.now(); save(); emit('ach', { a: ACH.find(a => a.id === id) }); },
    reset: () => { ['progress', 'progress.streak', 'prog', 'seen', 'crewsolved', 'ship'].forEach(k => localStorage.removeItem('mast.' + k)); location.reload(); }
  };
}
