// Coach core (Phase 9): storage, data, motif tagging, charts, the position runner (timed / first-instinct), the play-it-out-vs-engine runner, CCT prompt.
import { Board } from './board2.js';
import { getEngine } from './engine.js';
import { store, avatar, hydrate } from './ui.js';
import * as Pr from './progress.js';
import { play as sfx } from './sound.js';
import { full } from './fx.js';

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const q = (r, s) => r.querySelector(s);
export const j = u => fetch(u).then(r => r.ok ? r.json() : Promise.reject(u));
const DEBUG = () => /[?&]debug=1/.test(location.search);
export const isDebug = DEBUG;

/* ---------- storage: one versioned key ---------- */
export const C = () => { const c = store.get('coach', null); return c && typeof c === 'object' ? c : {}; };
export const upd = f => { const c = C(); f(c); store.set('coach', c); return c; };
export const day = () => Pr.dayKey();
export const fmtDay = t => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export function isoWeek(d = new Date()) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - y0) / 864e5 + 1) / 7)).padStart(2, '0'); }
export const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
export const shuffle = (a, r = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };

/* ---------- data ---------- */
const cache = {};
export const data = name => cache[name] || (cache[name] = j(name.startsWith('data/') ? name + '.json' : 'data/coach/' + name + '.json'));
export const toUci = (fen, san) => { try { const g = new Chess(fen), c = String(san).replace(/[+#!?]/g, ''); const m = g.moves({ verbose: true }).find(x => x.san.replace(/[+#]/g, '') === c); return m ? m.from + m.to + (m.promotion || '') : null; } catch (_) { return null; } };
export const sanOf = (fen, uci) => { try { const g = new Chess(fen), m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); return m ? m.san : uci; } catch (_) { return uci; } };
/* pool of positions with a known best move (from his own errors): {id,fen,sol:[uci],san,played,src} */
export async function errorPool(Sync) {
  const [cv, bt] = await Promise.all([data('data/convert'), data('data/blitz_tactics')]);
  const A = cv.map(x => ({ id: x.id, fen: x.fen, sol: [x.best_uci], san: x.best_san, played: x.played_san, kind: 'convert' }));
  const B = bt.map(x => ({ id: x.id, fen: x.fen, sol: [x.solution[0]], san: x.solution_san.replace(/^\d+\.(\.\.)?\s*/, '').split(' ')[0], played: x.you_played, kind: 'tactic' }));
  let L = []; if (Sync) { await Sync.S.ready; L = Sync.latestPuzzles().map(x => ({ id: x.id, fen: x.fen, sol: [x.solution[0]], san: x.solution_san.replace(/^\d+\.(\.\.)?\s*/, '').split(' ')[0], played: x.you_played, kind: 'recent' })); }
  return { convert: A, tactic: B, recent: L, bundled: [...A, ...B] };
}

/* ---------- heuristic motif tagger for synced errors (noisy, labelled as such) ---------- */
const V = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export function tagMove(fen, playedSan, bestUci) {
  try {
    const g = new Chess(fen); const mv = g.moves({ verbose: true }), bm = mv.find(m => m.from + m.to + (m.promotion || '') === bestUci); if (!bm) return 'positional/other';
    if (/[#+]/.test(bm.san)) return 'missed_check_mate';
    if (bm.captured && V[bm.captured] >= V[bm.piece] - 0) return 'missed_capture';
    const pm = mv.find(m => m.san === playedSan);
    if (pm) { const g2 = new Chess(fen); g2.move(pm.san); for (const o of g2.moves({ verbose: true })) { if (!o.captured) continue; const val = V[o.captured]; if (val > V[o.piece] || val >= 3) { const g3 = new Chess(g2.fen()); g3.move(o.san); const back = g3.moves({ verbose: true }).some(x => x.to === o.to && x.captured); if (!back || val > V[o.piece]) return 'hanging_piece'; } } }
    const g4 = new Chess(fen); g4.move(bm.san); const tk = new Chess(g4.fen().replace(/ [wb] /, g4.turn() === 'w' ? ' b ' : ' w ')); // pieces the best move attacks
    let n = 0; try { for (const m of tk.moves({ verbose: true })) if (m.from === bm.to && m.captured && (V[m.captured] >= 3 || m.captured === 'k')) n++; } catch (_) { }
    if (n >= 2) return 'missed_fork';
  } catch (_) { }
  return 'positional/other';
}
export const MOTIF = {
  'hanging_piece': ['Hanging pieces', 'You leave a piece where it can be taken for free, or trade it for less.'],
  'missed_fork': ['Missed forks', 'A move that attacked two things at once was there.'],
  'bad_trade_when_ahead': ['Bad trades when ahead', 'Swapping the wrong pieces when you were winning.'],
  'missed_capture': ['Missed captures', 'A free or favourable capture was on the board.'],
  'king_safety': ['King safety', 'Your king (or theirs) was exposed and you did not act.'],
  'pin_skewer': ['Pins and skewers', 'A line-piece trick that you missed or walked into.'],
  'missed_promotion/passed_pawn': ['Passed pawns', 'A pawn could have run or been stopped.'],
  'missed_check_mate': ['Missed checks and mates', 'A forcing check or mate was available.'],
  'back_rank': ['Back rank', 'The first rank was weak.'],
  'positional/other': ['Positional and other', 'Too broad to drill with one example. First-instinct training helps most here.']
};

/* ---------- small SVG charts ---------- */
export function barsChart(items, { w = 320, h = 150, max = 100, unit = '%', labels = true } = {}) { // items: [{label,v,cls}]
  const bw = Math.min(70, (w - 20) / items.length - 16), gap = (w - 20 - bw * items.length) / (items.length + 1);
  return `<svg class="co-chart" viewBox="0 0 ${w} ${h + 48}" role="img" aria-label="${esc(items.map(i => i.label + ' ' + (i.v == null ? 'none' : Math.round(i.v) + unit)).join(', '))}">${[0, 50, 100].map(t => `<line x1="10" x2="${w - 10}" y1="${h - t / 100 * h + 20}" y2="${h - t / 100 * h + 20}" stroke="currentColor" opacity=".12"/>`).join('')}` +
    items.map((it, i) => { const x = 10 + gap + i * (bw + gap), v = it.v == null ? 0 : Math.max(0, Math.min(max, it.v)), bh = v / max * h; return `<rect class="b ${it.cls || ''}" x="${x.toFixed(1)}" y="${(h - bh + 20).toFixed(1)}" width="${bw}" height="${Math.max(bh, 1).toFixed(1)}" rx="5"/><text x="${(x + bw / 2).toFixed(1)}" y="${(h - bh + 14).toFixed(1)}" text-anchor="middle" class="v">${it.v == null ? '-' : Math.round(it.v) + unit}</text>` + (labels ? `<text x="${(x + bw / 2).toFixed(1)}" y="${h + 38}" text-anchor="middle" class="l">${esc(it.label)}</text>` : ''); }).join('') + '</svg>';
}
export function lineChart(pts, { w = 320, h = 110, min, max, unit = '', fmt = v => Math.round(v), base } = {}) { // pts: [{x(label),y}]
  if (!pts.length) return '';
  const ys = pts.map(p => p.y).concat(base != null ? [base] : []); let lo = min ?? Math.min(...ys), hi = max ?? Math.max(...ys); if (hi - lo < 1e-6) { hi += 1; lo -= 1; } const pad = (hi - lo) * .12; lo -= pad; hi += pad;
  const X = i => 14 + (pts.length === 1 ? (w - 28) / 2 : i * (w - 28) / (pts.length - 1)), Y = v => 8 + (1 - (v - lo) / (hi - lo)) * (h - 22);
  return `<svg class="co-chart" viewBox="0 0 ${w} ${h + 18}" role="img" aria-label="Trend: ${esc(pts.map(p => p.x + ' ' + fmt(p.y) + unit).join(', '))}">${base != null ? `<line x1="10" x2="${w - 10}" y1="${Y(base).toFixed(1)}" y2="${Y(base).toFixed(1)}" stroke="currentColor" stroke-dasharray="4 4" opacity=".4"/>` : ''}` +
    `<polyline fill="none" stroke="var(--a)" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ')}"/>` +
    pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4" fill="var(--a)"/>${pts.length <= 8 || i === pts.length - 1 ? `<text x="${X(i).toFixed(1)}" y="${(Y(p.y) - 8).toFixed(1)}" text-anchor="middle" class="v">${fmt(p.y)}${unit}</text>` : ''}<text x="${X(i).toFixed(1)}" y="${h + 12}" text-anchor="middle" class="l">${esc(p.x)}</text>`).join('') + '</svg>';
}
export const bar = (frac, cls = '') => `<div class="co-prog ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.max(0, Math.min(1, frac)) * 100)}"><i style="width:${Math.max(0, Math.min(1, frac)) * 100}%"></i></div>`;
/* designed empty state with a crew member */
export const empty = (who, ex, title, line, action = '') => `<div class="co-empty">${avatar(who, ex, 'lg')}<div><b>${esc(title)}</b><p>${line}</p>${action}</div></div>`;
export const crewSays = (who, ex, text) => `<div class="co-says">${avatar(who, ex, 'sm')}<p><b>${esc(who)}:</b> ${text}</p></div>`;

/* ---------- lifecycle: everything a coach screen starts is registered here and stopped on route change ---------- */
const live = new Set();
export const reg = o => { live.add(o); return o; };
export function stopCoach() { live.forEach(o => { try { o.stop(); } catch (_) { } }); live.clear(); try { getEngine().stop(); } catch (_) { } }

/* ---------- engine helpers ---------- */
export async function eng() { const e = getEngine(); await e.init(); return e; }
export const cpStm = line => { const s = line && line.score || {}; return s.mate != null ? (s.mate > 0 ? 10000 - s.mate : -10000 - s.mate) : (s.cp || 0); }; // side to move
/* re-verify a candidate with the engine: top move must equal the recorded best and clearly beat the 2nd line */
export async function verify(fen, bestUci, { depth = 10, gap = 70 } = {}) {
  const e = await eng(), r = await e.analyse(fen, { depth, multipv: 2, timeout: 12000 }); if (!r.lines.length) return null;
  const a = r.lines[0], b = r.lines[1]; if (bestUci && a.pv[0] !== bestUci) return null;
  if (b && cpStm(a) - cpStm(b) < gap && Math.abs(cpStm(a)) < 5000) return null;
  return { uci: a.pv[0], cp: cpStm(a) };
}

/* ---------- CCT (checks, captures, threats) prompt ---------- */
export const getCCT = () => store.get('cct', true) !== false;
export const setCCT = on => store.set('cct', !!on);
export const cctRecord = ok => upd(c => { c.cct = (c.cct || []).concat(ok ? 1 : 0).slice(-30); });
export const cctAcc = () => { const a = C().cct || []; return a.length >= 10 ? a.reduce((x, y) => x + y, 0) / a.length : null; };
/* chance of showing the prompt: always while learning (<10 results), fading from 100% at <=55% accuracy to 15% at >=85% */
export const cctChance = () => { const a = cctAcc(); return a == null ? 1 : Math.max(.15, Math.min(1, 1 - (a - .55) / .3 * .85)); };
export function cctCounts(fen) {
  try {
    const g = new Chess(fen), mv = g.moves({ verbose: true }); const checks = mv.filter(m => /[+#]/.test(m.san)).length, caps = mv.filter(m => m.captured).length;
    let th = 0; if (!g.in_check()) { const o = new Chess(fen.replace(/ [wb] /, g.turn() === 'w' ? ' b ' : ' w ').replace(/ [a-h][36] /, ' - ')); try { th = o.moves({ verbose: true }).filter(m => m.captured && (V[m.captured] >= 3 || m.captured === 'k')).length; } catch (_) { } }
    return { checks, caps, th };
  } catch (_) { return null; }
}
export function cctFlash(host, fen) {
  if (!getCCT() || !host || Math.random() > cctChance()) return; const c = cctCounts(fen); if (!c) return;
  const el = document.createElement('div'); el.className = 'co-cct'; el.setAttribute('role', 'status');
  el.innerHTML = `<b>Pause. Check the board.</b><span>${c.checks} check${c.checks === 1 ? '' : 's'} for you</span><span>${c.caps} capture${c.caps === 1 ? '' : 's'}</span><span>${c.th} threat${c.th === 1 ? '' : 's'} against you</span>`;
  host.appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), full() ? 350 : 0); }, 1000);
}

/* ---------- CSS ---------- */
export function css() {
  if (document.getElementById('co-css')) return; const s = document.createElement('style'); s.id = 'co-css';
  s.textContent = `.co-hub{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:14px}
.co-hub .card{display:block;text-decoration:none;color:inherit}.co-hub h3{margin:2px 0 4px;font-size:18px}.co-hub p{margin:0;font-size:13.5px;line-height:1.4;opacity:.85}
.co-wrap{max-width:900px}.co-sec{margin-top:22px}.co-sec>h2{margin:0 0 8px;font-size:21px}
.co-bw{max-width:min(100%,520px);margin:0 auto}.co-run{display:grid;gap:10px}
.co-hud{display:flex;align-items:center;gap:10px;font:700 13px var(--f-disp,sans-serif);letter-spacing:.08em;text-transform:uppercase}
.co-hud .co-t{flex:1;height:10px;border-radius:99px;background:var(--glass-h,rgba(255,255,255,.08));overflow:hidden}.co-hud .co-t i{display:block;height:100%;width:100%;background:var(--a);transform-origin:left}
.co-hud .co-t.low i{background:#e0584a}.co-info{padding:12px 14px;border-radius:14px;background:var(--glass,rgba(255,255,255,.06));border:1px solid var(--glass-b,rgba(255,255,255,.12))}.co-info p{margin:4px 0}
.co-info.ok{border-color:#3FB37F}.co-info.bad{border-color:#e0584a}
.co-chart{width:100%;height:auto;max-width:460px;color:var(--fg)}.co-chart .b{fill:var(--a)}.co-chart .b.alt{fill:#5aa7d6}.co-chart .b.bad{fill:#e0584a}.co-chart .b.good{fill:#3FB37F}.co-chart text{fill:currentColor;font:600 11px var(--f-disp,sans-serif)}.co-chart text.l{opacity:.7;font-size:10px}
.co-prog{height:10px;border-radius:99px;background:var(--glass-h,rgba(255,255,255,.1));overflow:hidden;margin:6px 0}.co-prog i{display:block;height:100%;background:var(--a);border-radius:99px;transition:width .5s}.co-prog.good i{background:#3FB37F}.co-prog.bad i{background:#e0584a}
html[data-anim=off] .co-prog i,html[data-anim=reduced] .co-prog i{transition:none}
.co-empty,.co-says{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:14px;background:var(--glass,rgba(255,255,255,.06));border:1px dashed var(--glass-b,rgba(255,255,255,.2))}.co-says{border-style:solid;margin:8px 0}.co-empty p,.co-says p{margin:2px 0;font-size:14px;line-height:1.4}
.co-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.co-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.co-tile{padding:12px;border-radius:14px;background:var(--glass,rgba(255,255,255,.06));border:1px solid var(--glass-b,rgba(255,255,255,.12))}.co-tile .big{font:700 28px var(--f-disp,sans-serif)}.co-tile small{display:block;opacity:.7;font-size:11.5px;line-height:1.35;margin-top:2px}
.co-leak{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--glass-b,rgba(255,255,255,.1))}.co-leak .nm{font-weight:700}.co-leak p{grid-column:1/-1;margin:0;font-size:13px;opacity:.75}
.co-cct{position:absolute;left:8px;right:8px;top:8px;z-index:30;display:flex;flex-wrap:wrap;gap:4px 12px;padding:8px 12px;border-radius:12px;background:rgba(7,17,26,.88);color:#f1e9d4;font:600 12.5px var(--f-disp,sans-serif);letter-spacing:.04em;pointer-events:none;transition:opacity .35s}.co-cct b{width:100%;color:var(--a,#C9A24B)}.co-cct.out{opacity:0}
.co-bd{position:relative}.co-bd.blind .pc{opacity:0!important}
.co-tabs{display:flex;gap:6px;flex-wrap:wrap}.co-tabs .btn.on{background:var(--a);color:var(--on-a,#111)}
.co-more-bg{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.5)}.co-more{position:fixed;left:0;right:0;bottom:0;z-index:41;padding:16px 16px calc(16px + env(safe-area-inset-bottom));border-radius:18px 18px 0 0;background:var(--nav-bg,#0b1a26);border-top:1px solid var(--glass-b);backdrop-filter:blur(14px)}.co-more a{display:flex;gap:12px;align-items:center;padding:12px;border-radius:12px;color:var(--fg);text-decoration:none;font:700 14px var(--f-disp);letter-spacing:.14em;text-transform:uppercase}.co-more a svg{width:22px;height:22px}
#nav a.item.more-btn{background:none;border:0;cursor:pointer;font:inherit}
@media(min-width:821px){#nav .more-btn{display:none}}@media(max-width:820px){#nav a.item[data-more="1"]{display:none}}
.co-opts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.co-opts .btn{text-align:left}
.co-sq{outline:3px solid var(--a);outline-offset:-3px}
@media(max-width:480px){.co-hub{grid-template-columns:1fr}.co-cct{font-size:11.5px}}`;
  document.head.appendChild(s);
}

/* ---------- the position runner ---------- */
/* items: [{fen, sol:[uci], san, note}]. cfg: {timed:secs|0, instinct:bool, cct:bool, title, onEach(res,item,i)}. Resolves with results[] ({ok,secs,played,...}). */
export function runSet(root, items, cfg = {}) {
  css(); let stopped = false, resolveAll; const done = new Promise(r => resolveAll = r), results = [];
  const timers = new Set(); const later = (f, ms) => { const t = setTimeout(() => { timers.delete(t); if (!stopped) f(); }, ms); timers.add(t); };
  let i = 0, g, board, item, t0, phase, tick, first = null, memo = false;
  root.innerHTML = `<div class="co-run"><div class="co-hud"><span id="r-n"></span><div class="co-t" id="r-t"><i></i></div><span id="r-s"></span></div><div class="co-bw"><div class="co-bd" id="r-bd"></div></div><div class="co-info" id="r-i" aria-live="polite"></div><div class="co-row" id="r-a"></div></div>`;
  const $ = s => q(root, s), info = (h, c = '') => { const e = $('#r-i'); e.className = 'co-info ' + c; e.innerHTML = h; }, actions = h => { $('#r-a').innerHTML = h; };
  board = new Board($('#r-bd'), { orientation: 'white', coords: true, onMove: (f, t, p) => onMove(f, t, p) });
  const legal = () => { const m = {}; g.moves({ verbose: true }).forEach(x => (m[x.from] ??= []).push(x.to)); return m; };
  const tbar = f => { const t = $('#r-t'); t.classList.toggle('low', f < .3); t.firstElementChild.style.transform = `scaleX(${Math.max(0, f)})`; };
  const stopT = () => { clearInterval(tick); };
  const startT = (secs, onFlag) => { stopT(); t0 = performance.now(); tbar(1); tick = setInterval(() => { const f = 1 - (performance.now() - t0) / 1000 / secs; tbar(f); if (f <= 0) { stopT(); onFlag(); } }, 80); };
  const secsNow = () => (performance.now() - t0) / 1000;
  function load() {
    item = items[i]; g = new Chess(item.fen); first = null; phase = cfg.instinct ? 'first' : 'solve'; board.clearArrows();
    if ((g.turn() === 'w') !== (board.orient === 'white')) board.flip();
    board.setPosition(item.fen, { animate: false, check: g.in_check() }); board.setLegal(legal()); board.setTurn(g.turn() === 'w' ? 'white' : 'black', true);
    $('#r-n').textContent = `${i + 1}/${items.length}`; $('#r-s').textContent = `${results.filter(r => r.ok).length} right`; actions('');
    const side = g.turn() === 'w' ? 'White' : 'Black'; const bd = $('#r-bd'); bd.classList.remove('blind'); memo = false;
    if (cfg.cct) cctFlash(bd, item.fen);
    if (cfg.vanish) { memo = true; info(`<b>Memorise it.</b> The pieces vanish in ${cfg.vanish / 1000}s.`); tbar(1); later(() => { memo = false; bd.classList.add('blind'); info(`<b>${side} to move. Pieces gone.</b> Play the best move from memory.`); t0 = performance.now(); }, cfg.vanish); }
    else if (cfg.instinct) { info(`<b>${side} to move.</b> First instinct: pick a move in 3 seconds.`); startT(3, () => { first = { uci: null, secs: 3 }; toVerify(); }); }
    else if (cfg.prompt) { info(cfg.prompt(side, item)); t0 = performance.now(); tbar(1); if (cfg.timed) startT(cfg.timed, () => finish(false, null, cfg.timed, true)); }
    else if (cfg.timed) { info(`<b>${side} to move.</b> ${cfg.timed} seconds.`); startT(cfg.timed, () => finish(false, null, cfg.timed, true)); }
    else { info(`<b>${side} to move.</b> Take your time.`); t0 = performance.now(); tbar(1); }
  }
  function onMove(f, t, p) {
    if (stopped || !item || memo) return false; const m = g.move({ from: f, to: t, promotion: p || 'q' }); if (!m) return false;
    const u = m.from + m.to + (m.promotion || ''), s = secsNow(); g.undo();
    if (phase === 'first') { stopT(); first = { uci: u, san: m.san, secs: s }; sfx('move'); later(toVerify, 60); return false; }
    stopT(); finish(item.sol.includes(u), u, s, false, m.san); return false;
  }
  function toVerify() { // instinct phase 2: unlimited time, may change the move
    phase = 'solve'; tbar(1); const t = $('#r-t'); t.classList.remove('low'); t.firstElementChild.style.transform = 'scaleX(1)';
    board.clearArrows(); if (first.uci) board.showArrow(first.uci.slice(0, 2), first.uci.slice(2, 4), '#C9A24B');
    info(first.uci ? `<b>You picked ${esc(first.san)}</b> (gold arrow). Now verify: check, capture, threat. Keep it or play a better move.` : `<b>No move in 3 seconds.</b> Now take your time and find one.`);
    actions(first.uci ? '<button class="btn" id="r-keep" type="button">Keep my first move</button>' : ''); const k = $('#r-keep'); if (k) k.onclick = () => finish(item.sol.includes(first.uci), first.uci, first.secs, false, first.san, true);
    t0 = performance.now(); board.setLegal(legal()); board.setTurn(g.turn() === 'w' ? 'white' : 'black', true);
  }
  function finish(ok, played, secs, flagged, san, kept) {
    if (stopped) return; stopT(); board.setLegal({}); const best = item.sol[0];
    const res = { ok, secs, played, flagged: !!flagged, id: item.id, fen: item.fen, best, bestSan: item.san || sanOf(item.fen, best), kind: item.kind };
    if (cfg.instinct) { res.first = first.uci; res.firstSan = first.san; res.firstBest = !!first.uci && item.sol.includes(first.uci); res.changed = !!first.uci && played !== first.uci; res.verifySecs = secsNow(); res.firstSecs = first.secs; }
    results.push(res); if (cfg.cct) cctRecord(ok); $('#r-bd').classList.remove('blind');
    if (cfg.silent) { sfx('move'); info('<b>Recorded.</b> Answers come at the end.'); if (cfg.onEach) cfg.onEach(res, item, i); const l2 = i + 1 >= items.length; actions(`<button class="btn" id="r-next" type="button">${l2 ? 'Finish' : 'Next position'}</button>`); const b2 = $('#r-next'); b2.onclick = () => { if (l2) { stopped = true; resolveAll(results); } else { i++; load(); } }; b2.focus({ preventScroll: true }); return; }
    sfx(ok ? 'success' : 'fail'); board.showArrow(best.slice(0, 2), best.slice(2, 4), '#3FB37F');
    info(`<b>${ok ? 'Right.' : flagged ? 'Out of time.' : 'Not this one.'}</b> Best was <b>${esc(res.bestSan)}</b>${item.played && !ok ? `; in your game you played <b>${esc(item.played)}</b>` : ''}.${cfg.instinct ? (res.firstBest ? ' Your first instinct was already right.' : res.changed && ok ? ' Checking paid off: you improved on your first pick.' : res.changed ? ' You changed it, but not to the best move.' : '') : ''}${item.note ? `<p class="sub sm">${esc(item.note)}</p>` : ''}`, ok ? 'ok' : 'bad');
    if (cfg.onEach) cfg.onEach(res, item, i);
    const last = i + 1 >= items.length; actions(`<button class="btn" id="r-next" type="button">${last ? 'See results' : 'Next position'}</button>`);
    const b = $('#r-next'); b.onclick = () => { if (last) { stopped = true; resolveAll(results); } else { i++; load(); } }; b.focus({ preventScroll: true });
  }
  const api = reg({ stop() { stopped = true; stopT(); timers.forEach(clearTimeout); try { board.destroy(); } catch (_) { } resolveAll(results); }, board, root, done, results, skip() { if (!stopped) { stopped = true; resolveAll(results); } } });
  if (!items.length) { info('Nothing to show here yet.'); resolveAll([]); } else load();
  api.promise = done; api.items = items; api.cur = () => item; api.mv = u => board.o.onMove(u.slice(0, 2), u.slice(2, 4), u[4]); if (isDebug()) window.__coachSet = api; return api;
}

/* ---------- play it out against the engine (endgames, convert the win) ---------- */
/* cfg: {fen, goal:'win'|'draw', cap, holdN, resign:bool, title, ms} -> resolves {ok, reason, moves} */
export function vsEngine(root, cfg) {
  css(); let stopped = false, over = false, resolveAll; const done = new Promise(r => resolveAll = r);
  const g = new Chess(cfg.fen), me = g.turn(), mine = me === 'w' ? 'white' : 'black', cap = cfg.cap || 30, ms = cfg.ms || 250;
  let myMoves = 0, bad = 0, low = 0, busy = false, promoted = false;
  root.innerHTML = `<div class="co-run"><div class="co-hud"><span id="v-n"></span><span id="v-g" style="flex:1"></span><span id="v-s"></span></div><div class="co-bw"><div class="co-bd" id="v-bd"></div></div><div class="co-info" id="v-i" aria-live="polite"></div><div class="co-row" id="v-a"></div></div>`;
  const $ = s => q(root, s), info = (h, c = '') => { const e = $('#v-i'); e.className = 'co-info ' + c; e.innerHTML = h; };
  const goalTxt = cfg.goal === 'win' ? (cfg.resign ? `Win it within ${cap} moves: mate, promote into a won position, or collapse the engine's defence.` : `Win: checkmate or promote within ${cap} moves.`) : `Draw: survive ${cfg.holdN || 20} moves, or reach a drawn ending.`;
  $('#v-g').textContent = goalTxt;
  const board = new Board($('#v-bd'), { orientation: mine, coords: true, onMove: (f, t, p) => onMove(f, t, p) });
  const legal = () => { const m = {}; g.moves({ verbose: true }).forEach(x => (m[x.from] ??= []).push(x.to)); return m; };
  const sync = lm => { board.setPosition(g.fen(), { animate: true, lastMove: lm, check: g.in_check() }); board.setLegal(over ? {} : legal()); board.setTurn(mine, !over && g.turn() === me); };
  const hud = () => { $('#v-n').textContent = `Move ${myMoves}/${cap}`; };
  function end(ok, reason, text) {
    if (over) return; over = true; board.setLegal({}); sfx(ok ? 'success' : 'fail'); info(`<b>${ok ? 'Goal met.' : 'Not this time.'}</b> ${text}`, ok ? 'ok' : 'bad');
    $('#v-a').innerHTML = '<button class="btn" id="v-ok" type="button">Continue</button>'; q(root, '#v-ok').onclick = () => { stopped = true; resolveAll({ ok, reason, moves: myMoves }); };
  }
  const gameOver = () => { // returns true if it ended the run
    if (g.in_checkmate()) { const iWon = g.turn() !== me; if (cfg.goal === 'win') end(iWon, iWon ? 'mate' : 'mated', iWon ? 'Checkmate. Well finished.' : 'You were checkmated.'); else end(iWon, iWon ? 'mate' : 'mated', iWon ? 'Checkmate.' : 'You were checkmated, so the draw was lost.'); return true; }
    if (g.in_stalemate() || g.insufficient_material() || g.in_threefold_repetition() || g.in_draw()) { const why = g.in_stalemate() ? 'Stalemate' : g.insufficient_material() ? 'Not enough material to mate' : 'Drawn by repetition or the 50-move rule'; end(cfg.goal === 'draw', 'draw', cfg.goal === 'draw' ? why + ': that is the draw you wanted.' : why + '. The win slipped away.'); return true; }
    return false;
  };
  async function reply() {
    busy = true; info('The engine is thinking...'); board.setTurn(mine, false);
    try {
      const e = await eng(); if (stopped) return; const r = await e.analyse(g.fen(), { movetime: ms, multipv: 1, timeout: ms + 6000 }); if (stopped) return;
      const bm = r.bestmove; if (!bm) throw new Error('no move'); const sc = cpStm(r.lines[0]); // engine's side
      const m = g.move({ from: bm.slice(0, 2), to: bm.slice(2, 4), promotion: bm[4] }); if (!m) throw new Error('illegal');
      sfx(m.captured ? 'capture' : 'move'); sync({ from: m.from, to: m.to }); busy = false; if (gameOver()) return;
      // engine evaluation judgments (engine's side score)
      if (cfg.goal === 'win') { if (promoted && sc <= -500) return end(true, 'promoted', 'You promoted into a winning position. The engine agrees it is lost for them.'); if (cfg.resign) { low = sc <= -900 ? low + 1 : 0; if (low >= 3) return end(true, 'resign', 'The engine sees it is lost for them and would resign. That is a converted win.'); } bad = sc >= -60 && myMoves >= 4 ? bad + 1 : 0; if (cfg.resign && bad >= 3) return end(false, 'slipped', 'The win has slipped: the engine now rates the position equal or better for them.'); }
      else { bad = sc >= 700 ? bad + 1 : 0; if (bad >= 2) return end(false, 'lost', 'The engine now rates this as winning for them. The draw is gone.'); if (myMoves >= (cfg.holdN || 20)) return end(true, 'held', `You held for ${myMoves} moves.`); }
      if (cfg.goal === 'win' && myMoves >= cap) return end(false, 'cap', `The ${cap}-move limit is up. Winning slowly is not winning: find the shortest route.`);
      info(`<b>Your move.</b> ${esc(goalTxt)}`); hud();
    } catch (er) { busy = false; info('The engine could not answer (it may still be loading). <button class="btn sm" id="v-retry" type="button">Retry</button>'); const b = q(root, '#v-retry'); if (b) b.onclick = () => reply(); }
  }
  function onMove(f, t, p) {
    if (stopped || over || busy || g.turn() !== me) return false; const m = g.move({ from: f, to: t, promotion: p || 'q' }); if (!m) return false;
    myMoves++; if (m.promotion) promoted = true; sfx(m.captured ? 'capture' : 'move'); hud(); sync({ from: m.from, to: m.to });
    if (!gameOver()) { if (cfg.goal === 'win' && myMoves >= cap && !promoted) { end(false, 'cap', `The ${cap}-move limit is up.`); } else reply(); } return true;
  }
  sync(null); hud(); info(`<b>${me === 'w' ? 'White' : 'Black'} to move.</b> ${esc(goalTxt)}`);
  const api = reg({ stop() { stopped = true; try { board.destroy(); } catch (_) { } resolveAll({ ok: false, reason: 'stopped', moves: myMoves }); }, board, promise: done, move: (u) => onMove(u.slice(0, 2), u.slice(2, 4), u[4]), g, mine });
  api.auto = async () => { // debug helper: play the engine's best move for the learner until the run ends
    const e = await eng(); let guard = 0; while (!over && !stopped && guard++ < cap + 5) { if (g.turn() !== me || busy) { await new Promise(r => setTimeout(r, 120)); continue; } const r = await e.analyse(g.fen(), { movetime: 150, timeout: 5000 }); if (r.bestmove) onMove(r.bestmove.slice(0, 2), r.bestmove.slice(2, 4), r.bestmove[4]); await new Promise(r => setTimeout(r, 150)); } return done; };
  if (isDebug()) window.__coachRun = api;
  if (g.turn() !== me) reply();
  return api;
}
