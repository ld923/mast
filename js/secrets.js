// Secrets layer: registry, found-state (mast.secrets), detection hooks (games, drills, puzzles), the #secrets page, personal file.
// Scenes and mini-games live in secrets-fun.js. Nothing here is visible until found, except hints.
import { store } from './ui.js';
import { speak } from './voice.js';
import { full, confetti, wash, getAnim } from './fx.js';
import { photo } from './photo.js';
import { CH } from './portraits.js';
import * as Pr from './progress.js';
import { play as sfx } from './sound.js';
import { weather } from './sky.js';
import * as Sync from './sync.js';
import * as F from './secrets-fun.js';
import { OP_LINE } from './riddles.js';
import { STORIES } from './stories.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dbg = () => /[?&]debug=1/.test(location.search);
const qp = k => { try { return new URLSearchParams(location.search).get(k); } catch (_) { return null; } };
export const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* ---------- state ---------- */
export let ST = store.get('secrets', null) || {};
ST.found ??= {}; ST.c ??= { drills: 0, stormRun: 0 }; ST.stories ??= {}; ST.bottle ??= { date: '', pending: false, solved: [] }; ST.opera ??= { seen: [] }; ST.rate ??= { base: null, claimed: {} };
export const save = () => store.set('secrets', ST);

/* ---------- registry (hints are vague on purpose) ---------- */
export const REG = [
  { id: 'opera', name: 'A Night at the Opera', who: 'Morphy', xp: 150, reward: '150 XP and a box seat', hint: 'Some openings have been performed before, in front of a duke. The crew would know the tune.' },
  { id: 'immortal', name: 'The Immortal', who: 'Tal', xp: 200, reward: '200 XP and a unique card from your own game', hint: 'Win the way the Magician would: give up the most precious piece, then win anyway.' },
  { id: 'bongcloud', name: 'Okay. Respect.', who: 'Carlsen', xp: 60, reward: '60 XP and a broken character', hint: 'The Grinder takes everything seriously. Almost everything. Try to find what he cannot.' },
  { id: 'englund', name: 'Sir... Again?', who: 'Morphy', xp: 60, reward: '60 XP and a raised eyebrow', hint: 'The gentleman from New Orleans has opinions about a certain way to meet 1.d4.' },
  { id: 'horse', name: 'Horse Sense', who: 'Tal', xp: 80, reward: '80 XP', hint: 'When the engine says to promote to something small, believe it.' },
  { id: 'numbers', name: 'Number Nods', who: 'Capablanca', xp: 60, reward: '60 XP and a knowing nod', hint: 'Dates matter to the Machine. One of them is the year he took the crown. Another is a full board.' },
  { id: 'sax', name: 'Sax Under Deck', who: 'Skipper', xp: 100, reward: 'A calm sea and Smooth Sailing', hint: 'Skipper keeps something golden close to the ship\'s oldest barrel. It likes to be asked three times.' },
  { id: 'bottle', name: 'Message in a Bottle', who: 'Skipper', xp: 40, reward: 'A rare card per riddle', hint: 'Now and then the tide brings something in. Not every day. Never twice in one.' },
  { id: 'ghost', name: 'The Ghost Ship', who: 'Tal', xp: 120, reward: '120 XP and a game from beyond', hint: 'Be awake when the day turns over. Look at the horizon.' },
  { id: 'drums', name: 'The Drum Kit in the Hold', who: 'Tempo', xp: 100, reward: '100 XP and a steady hand', hint: 'Tempo practises somewhere he thinks nobody can hear. Try the planks, not the walls.' },
  { id: 'rainbow', name: 'After the Storm', who: 'Skipper', xp: 150, reward: 'A rainbow over the deck and 150 XP', hint: 'Keep your head when the weather is at its worst. Five times, without slipping.' },
  { id: 'parrot', name: 'The Parrot', who: 'Skipper', xp: 80, reward: '80 XP and a very honest bird', hint: 'Ships that have seen a hundred hard positions attract a certain kind of passenger.' },
  { id: 'konami', name: 'Old Code', who: 'Tempo', xp: 80, reward: 'The crew trades places for a day', hint: 'Somebody on board still remembers the cheat codes of the cartridge era.' },
  { id: 'backstory', name: 'Hidden Backstories', who: 'Capablanca', xp: 40, reward: '40 XP per story, five stories', hint: 'Every crew member has a story they only tell to someone who keeps knocking on their portrait.' },
  { id: 'aprilfools', name: 'First of April', who: 'Tal', xp: 60, reward: '60 XP and a laugh', hint: 'The Magician is at his worst on one particular day each spring.' },
  { id: 'seasons', name: 'The Calendar Remembers', who: 'Skipper', xp: 60, reward: '60 XP and a festive deck', hint: 'The deck dresses up on certain days in November and June. Ask the crew about birthdays.' },
  { id: 'cameo', name: 'Tempo on Deck', who: 'Tempo', xp: 40, reward: '40 XP', hint: 'The boss is not always in his lair. Sometimes he is asleep, snacking, or drumming in the background.' }
];
const BY = Object.fromEntries(REG.map(r => [r.id, r]));
export const isFound = id => !!ST.found[id];
export const foundCount = () => REG.filter(r => ST.found[r.id]).length;

/* ---------- helpers: overlay, cameo card, rewards ---------- */
let CSS_ON = false;
export function css() { if (CSS_ON) return; CSS_ON = true; const s = document.createElement('style'); s.id = 'sx-css'; s.textContent = F.CSS; document.head.appendChild(s); }
export function ov(cls, html, { onClose } = {}) { // modal
  css(); const el = document.createElement('div'); el.className = 'sx-ov ' + cls; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.tabIndex = -1; el.innerHTML = html;
  const prev = document.activeElement; document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on')); try { el.focus({ preventScroll: true }); } catch (_) { }
  const close = () => { if (!el.isConnected) return; el.classList.remove('on'); document.removeEventListener('keydown', key, true); setTimeout(() => el.remove(), getAnim() === 'off' ? 0 : 260); try { prev && prev.focus && prev.focus({ preventScroll: true }); } catch (_) { } onClose && onClose(); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', key, true);
  el.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', close));
  return { el, close };
}
/* non-blocking card (never covers the board, never pauses a clock) */
export function cameo({ who, k, line, ms = 6500, cls = '' }) {
  css(); const el = document.createElement('div'); el.className = 'sx-cam ' + cls; el.setAttribute('role', 'status'); el.style.setProperty('--ac', (CH[who] || {}).acc || '#C9A24B');
  el.innerHTML = `<span class="sx-camp">${CH[who] ? photo(who, 'excited') : ''}</span><div><span class="k">${esc(k)}</span><p>${esc(line)}</p></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 400); };
  el.addEventListener('click', close); const t = setTimeout(close, ms); return { el, close: () => { clearTimeout(t); close(); } };
}
let tq = Promise.resolve();
export function find(id, { silent = false, line } = {}) {
  const r = BY[id]; if (!r || ST.found[id]) return false;
  ST.found[id] = Date.now(); save();
  try { Pr.addXp(r.xp || 0, 'secret'); } catch (_) { }
  document.dispatchEvent(new CustomEvent('mast:secret', { detail: { id } }));
  if (!silent) speak(r.who || 'Skipper', line || r.reward, 'secret');
  if (!silent) import('./prog-ui.js').then(u => { tq = tq.then(() => u.toast({ k: 'Secret found', title: r.name, line: line || r.reward, who: r.who })).catch(() => { }); });
  return true;
}
const sans = (arr) => arr.map(s => s.replace(/[+#]/g, ''));
export const operaCount = (list, white) => { const mine = sans(list).filter((_, i) => (i % 2 === 0) === white), op = sans(OP_LINE).filter((_, i) => (i % 2 === 0) === white); let n = 0; while (n < mine.length && mine[n] === op[n]) n++; return n; };

/* ---------- personal file (all optional; null = feature silently absent) ---------- */
let PERS = { boatName: null, homePort: null, inJokes: [], tempoMessage: null, ratingRewards: [] };
const str = v => (typeof v === 'string' && v.trim()) ? v.trim() : null;
async function loadPersonal() {
  try {
    const j = await (await fetch(qp('personal') ? 'data/' + qp('personal').replace(/[^a-z0-9_.-]/gi, '') : 'data/secrets_personal.json', { cache: 'no-cache' })).json();
    PERS = { boatName: str(j.boatName), homePort: str(j.homePort), inJokes: (Array.isArray(j.inJokes) ? j.inJokes : []).map(str).filter(Boolean), tempoMessage: str(j.tempoMessage),
      ratingRewards: (Array.isArray(j.ratingRewards) ? j.ratingRewards : []).filter(r => r && +r.blitz > 0 && str(r.reward)).map(r => ({ blitz: +r.blitz, reward: str(r.reward) })) };
  } catch (_) { /* file missing: everything stays off */ }
}
export const personal = () => PERS;
export const boatName = () => PERS.boatName;
export function homePort() { // voyage chart island, unlocked by a 7-day streak
  if (!PERS.homePort) return null;
  let b = 0; try { b = Pr.state().streak.best || 0; } catch (_) { }
  return b >= 7 || ST.homeport ? (ST.homeport = true, { name: PERS.homePort }) : null;
}

/* ---------- crew bubble hook (crew.js react): Konami swap + in-jokes ---------- */
export const swapActive = () => !!(ST.swap && ST.swap.until > Date.now());
const NAMES = ['Morphy', 'Kasparov', 'Capablanca', 'Tal', 'Carlsen', 'Leela', 'Skipper', 'Tempo'];
export function bubbleHook(who, txt) {
  try {
    if (swapActive() && NAMES.includes(who)) who = NAMES[(NAMES.indexOf(who) + ST.swap.shift) % NAMES.length];
    if (PERS.inJokes.length && txt && Math.random() < 1 / 25) txt = PERS.inJokes[Math.floor(Math.random() * PERS.inJokes.length)];
  } catch (_) { }
  return { who, txt };
}
export function swapOutfit(n) { if (!swapActive()) return null; const i = NAMES.indexOf(n); return i < 0 ? null : (i % 2) + 1; }
export function startSwap() {
  ST.swap = { until: Date.now() + 864e5, shift: 1 + (Math.floor(Date.now() / 864e5) % 6) }; save();
  find('konami', { silent: true }); F.konamiScene(); confetti && full() && confetti(1);
}
export function smoothTake() { if (ST.smooth) { ST.smooth = false; save(); return true; } return false; }
export function setSmooth() { ST.smooth = true; save(); }

/* ---------- the #secrets page ---------- */
export function secretsView({ render, topbar }) {
  css(); const n = foundCount(), tot = REG.length, st = Object.keys(ST.stories).length;
  const lock = `<svg viewBox="0 0 48 48" class="sx-sil" aria-hidden="true"><path d="M24 4a10 10 0 0 0-10 10v6h-4v22h28V20h-4v-6A10 10 0 0 0 24 4zm0 5a5 5 0 0 1 5 5v6H19v-6a5 5 0 0 1 5-5z" fill="currentColor" opacity=".55"/><circle cx="24" cy="31" r="3.4" fill="#07111A"/></svg>`;
  render(`${topbar}<a class="back" href="#masters">&larr; Crew</a><span class="k">Hidden things</span><h1>Secrets</h1>
   <p class="sub mt1"><b class="led" id="sx-n" style="font-size:1.5em">${n} / ${tot}</b> found. The ship has more aboard than it shows. Hints only until you find one.</p>
   <div class="sx-grid mt2">${REG.map(r => ST.found[r.id]
    ? `<article class="sx-card on" style="--ac:${(CH[r.who] || {}).acc || '#C9A24B'}"><span class="sx-ph">${photo(r.who, 'excited')}</span><div><b>${esc(r.name)}</b><p class="sub sm">${esc(r.reward)}${r.id === 'backstory' ? ` · ${st}/5 told` : ''}${r.id === 'bottle' ? ` · ${ST.bottle.solved.length}/12 riddles` : ''}</p><span class="k">Found ${new Date(ST.found[r.id]).toLocaleDateString()}</span></div></article>`
    : `<article class="sx-card"><span class="sx-ph sil">${lock}</span><div><b>? ? ?</b><p class="sub sm">${esc(r.hint)}</p></div></article>`).join('')}</div>
   <p class="sub sm mt2">Some secrets never repeat. Others come back every year.</p>`);
}

/* ---------- crew whisper (rare hint toward an unfound secret) ---------- */
export function maybeHint(force) {
  const left = REG.filter(r => !ST.found[r.id]); if (!left.length) return;
  if (!force && (ST.hintDay === today() || Math.random() > 1 / 15)) return;
  ST.hintDay = today(); save();
  const r = left[Math.floor(Math.random() * left.length)];
  import('./prog-ui.js').then(u => u.toast({ k: 'The crew whispers', title: (CH[r.who] || {}).nick || r.who, line: r.hint, who: r.who })).catch(() => { });
}

/* ---------- event hooks ---------- */
const isAprilToday = () => { const d = new Date(); return (d.getMonth() === 3 && d.getDate() === 1) || qp('aprilfools') === '1'; };
export const aprilFlag = () => (isAprilToday() || ST.forceApril) && ST.afool !== today();
function inspectGame(d) { // live: {opp,color,sans,by}
  const white = d.color === 'white', mine = d.sans.filter((_, i) => (i % 2 === 0) === white);
  if (operaCount(d.sans, white) >= 6 && !ST.found.opera) F.operaScene();
  const m = mine.map(s => s.replace(/[+#]/g, ''));
  if (d.opp === 'Carlsen' && !ST.found.bongcloud) {
    const bong = white ? (d.sans[0] === 'e4' && d.sans[1] === 'e5' && m[1] === 'Ke2') : (d.sans[0] === 'e4' && m[0] === 'e5' && m[1] === 'Ke7');
    if (bong) F.bongScene();
  }
  if (d.opp === 'Morphy' && !ST.found.englund && !white && d.sans[0] === 'd4' && m[0] === 'e5') F.englundScene();
}
function lostQueenAndWon(sanList, white) { // returns {fen,uci} of the move that gave the queen, or null
  const g = new Chess(), me = white ? 'w' : 'b'; let last = null, sac = null;
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  for (let i = 0; i < sanList.length; i++) {
    const fenBefore = g.fen(), mv = g.move(sanList[i]); if (!mv) return null;
    if (mv.color === me && mv.piece === 'q') last = { fen: fenBefore, uci: mv.from + mv.to + (mv.promotion || ''), to: mv.to };
    if (mv.color !== me && mv.captured === 'q' && last && !sac) {
      const nx = sanList[i + 1] ? (() => { const t = new Chess(g.fen()); const r = t.move(sanList[i + 1]); return r && r.captured ? VAL[r.captured] : 0; })() : 0;
      if (nx < 9) sac = last;
    }
  }
  return sac;
}
function onPlayEnd(d) {
  const white = d.color === 'white';
  if (d.win) {
    const sac = lostQueenAndWon(d.sans, white); if (sac) F.immortalScene(d, sac);
    if (Math.ceil(d.sans.length / 2) === 21) numberNod('game');
    if (d.opp === 'Tempo' && PERS.tempoMessage) setTimeout(() => F.sealedLetter(PERS.tempoMessage), 2200);
  }
  inspectGame({ ...d, by: 'end' });
}
export function numberNod(kind) {
  const first = find('numbers', { silent: true }); ST.nods = ST.nods || {}; if (ST.nods[kind]) return; ST.nods[kind] = 1; save();
  cameo({ who: 'Capablanca', k: kind === 'game' ? 'Twenty-one moves' : 'Move sixty-four', line: kind === 'game' ? 'Twenty-one moves. Havana, 1921. I approve of the arithmetic.' : 'Sixty-four. A full board of squares, and you solved it. Tidy.', ms: 7000 });
  if (!first) try { Pr.addXp(15, 'secret'); } catch (_) { }
}
function onDrill(d) {
  const c = ST.c; c.drills = (c.drills || 0) + 1;
  if (d.ok) {
    if (weather() === 'storm') { c.stormRun = (c.stormRun || 0) + 1; if (c.stormRun >= 5) { c.stormRun = 0; ST.rainbow = today(); save(); if (find('rainbow', { silent: true })) F.rainbowScene(); } } else c.stormRun = 0;
  } else c.stormRun = 0;
  save(); if (c.drills >= 100) F.parrotArrived();
}
function onSync() { scanSynced(); checkRating(); }
async function scanSynced() {
  try {
    await Sync.S.ready; if (ST.found.opera) return; const seen = new Set(ST.opera.seen); let dirty = false;
    for (const g of Sync.S.games.slice(0, 400)) {
      if (!g.link || seen.has(g.link)) continue; seen.add(g.link); dirty = true;
      try { const t = new Chess(); if (!t.load_pgn(g.pgn)) continue; const list = t.history(); if (operaCount(list, !!g.white) >= 6) { ST.opera.seen = [...seen].slice(-600); save(); F.operaScene(); return; } } catch (_) { }
    }
    if (dirty) { ST.opera.seen = [...seen].slice(-600); save(); }
  } catch (_) { }
}
export function checkRating(forceBlitz) {
  const rr = PERS.ratingRewards; if (!rr.length) return;
  const cur = forceBlitz != null ? forceBlitz : (Sync.rating() || {}).blitz; if (!cur) return;
  if (ST.rate.base == null) { ST.rate.base = cur; save(); return; } // first look: only future crossings count
  const hit = rr.filter(r => cur >= r.blitz && ST.rate.base < r.blitz && !ST.rate.claimed[r.blitz]).sort((a, b) => b.blitz - a.blitz)[0];
  ST.rate.base = Math.max(ST.rate.base, cur); save();
  if (hit) { ST.rate.claimed[hit.blitz] = Date.now(); save(); F.treasureChest(hit.blitz, hit.reward); }
}

/* ---------- konami: keys on desktop, swipes on touch ---------- */
const KEYS = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
const SW = ['u', 'u', 'd', 'd', 'l', 'r', 'l', 'r', 't', 't'];
let kb = [], kt = [], ktT = 0, tp = null;
const onDeck = () => !!document.querySelector('#deck svg.deck');
function feed(buf, seq, v, at) { buf.push(v); while (buf.length && buf.some((x, i) => x !== seq[i])) buf.shift(); if (buf.length === seq.length) { buf.length = 0; return true; } return false; }
function wireKonami() {
  addEventListener('keydown', e => { if (!onDeck() || /input|textarea|select/i.test((e.target.tagName || ''))) return; if (feed(kb, KEYS, (e.key || '').toLowerCase())) startSwap(); });
  addEventListener('touchstart', e => { const t = e.changedTouches[0]; tp = onDeck() && e.target.closest && e.target.closest('#deck') ? { x: t.clientX, y: t.clientY, t: performance.now() } : null; }, { passive: true });
  addEventListener('touchend', e => {
    if (!tp) return; const t = e.changedTouches[0], dx = t.clientX - tp.x, dy = t.clientY - tp.y, dt = performance.now() - tp.t; tp = null;
    if (performance.now() - ktT > 4500) kt.length = 0; ktT = performance.now();
    let v = null; if (Math.max(Math.abs(dx), Math.abs(dy)) >= 36) v = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'u' : 'd') : (dx < 0 ? 'l' : 'r'); else if (dt < 350) v = 't';
    if (v && feed(kt, SW, v)) startSwap();
  }, { passive: true });
  addEventListener('click', e => { if (kt.length >= 8 && onDeck() && e.target.closest && e.target.closest('#deck')) { e.preventDefault(); e.stopPropagation(); } }, true); // the two closing taps must not open a hotspot
}

/* ---------- init + debug ---------- */
export async function initSecrets() {
  await loadPersonal(); css();
  document.addEventListener('mast:playmove', e => inspectGame(e.detail));
  document.addEventListener('mast:playend', e => onPlayEnd(e.detail));
  document.addEventListener('mast:drill', e => onDrill(e.detail));
  document.addEventListener('mast:promo', e => { if (e.detail && e.detail.piece === 'n') { if (find('horse', { silent: true })) cameo({ who: 'Tal', k: 'Horse Sense', line: 'A knight, not a queen, and the engine nods. The horse is a fine animal.', ms: 6000 }); } });
  document.addEventListener('mast:puzzle', e => { const d = e.detail || {}; if (d.ok && !d.hinted && d.pz && String(d.pz.fen).split(' ')[5] === '64') numberNod('puzzle'); });
  document.addEventListener('mast:drillend', () => maybeHint());
  document.addEventListener('mast:drillload', e => F.aprilFools(e.detail));
  addEventListener('mast:sync', onSync); wireKonami();
  Sync.S.ready.then(() => { setTimeout(onSync, 2500); });
  if (dbg()) {
    const D = window.__mastDebug = window.__mastDebug || {};
    D.secret = (id, a) => F.debugSecret(id, a);
    D.secretsState = () => ST; D.secretsReset = () => { store.set('secrets', null); localStorage.removeItem('mast.secrets'); location.reload(); };
    D.secretsList = () => REG.map(r => r.id);
  }
}
export { STORIES, esc, qp, dbg, BY };
export const wireBackstory = F.wireBackstory, deckParts = F.deckParts, wireDeck = F.wireDeck, onVisit = F.onVisit, barrelTap = F.barrelTap, aprilFools = F.aprilFools;
F.bind({ ST, save, find, cameo, ov, esc, qp, dbg, today, css, maybeHint, boatName, startSwap, setSmooth, aprilFlag, numberNod });
