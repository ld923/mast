import * as Resume from './resume.js';
import { motifOf, contextLine } from './reviewlines.js';
import { disagreement, isAggressive, bond } from './social.js';
import { openChat, hasKey } from './chat.js';
// Game review (#review): pick a game, step through it with the crew; Stockfish (in the browser) finds turning points progressively.
import { Board } from './board2.js';
import { getEngine, EvalBar, scoreWhite, fen4 } from './engine.js';
import { store, avatar, hydrate, loadingState, errorState } from './ui.js';
import { fmtEval } from './crew.js';
import * as Sync from './sync.js';
import { savedGames } from './play.js';
import { cabinSVG } from './scene.js';
import { logbook } from './captain.js';
import { CH } from './portraits.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const j = u => fetch(u).then(r => r.ok ? r.json() : Promise.reject(u));
const V = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const DEPTH = 12, TP = 150, cl = x => Math.max(-1000, Math.min(1000, x));

/* ---------- PGN ---------- */
export function parsePGNs(text) { return text.split(/\n\s*\n(?=\[Event )/).map(t => t.trim()).filter(Boolean).map(parseOne); }
function parseOne(t) {
  const h = {}; t.replace(/^\[(\w+) "([^"]*)"\]/gm, (_, k, v) => { h[k] = v; });
  const mt = t.replace(/^\[.*\]\s*$/gm, '').trim(), clk = [];
  mt.replace(/\{\[%clk (\d+):(\d+):(\d+(?:\.\d+)?)\]\}/g, (_, a, b, c) => { clk.push(+a * 3600 + +b * 60 + +c); });
  const san = mt.replace(/\{[^}]*\}/g, ' ').replace(/\([^)]*\)/g, ' ').replace(/\$\d+/g, ' ').replace(/\d+\.(\.\.)?/g, ' ').split(/\s+/).filter(x => x && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(x)).map(x => x.replace(/[!?]+$/, ''));
  return { h, san, clk };
}
let MY = null; let MYB = null; const bundledGames = () => MYB || (MYB = fetch('data/my_games.pgn').then(r => r.text()).then(parsePGNs).catch(() => []));
const myGames = async () => { await Sync.S.ready; const b = await bundledGames(), n = Sync.S.games.length; if (MY && MY.n === n) return MY.list; const list = [...Sync.S.games.map(g => parseOne(g.pgn)).filter(x => x && x.san.length), ...b]; MY = { n, list }; return list; };
const tcOf = h => { const m = /^(\d+)(?:\+(\d+))?/.exec(h.TimeControl || ''); return m ? { base: +m[1], inc: +(m[2] || 0) } : { base: 0, inc: 0 }; };
const mine = h => /congreve274|skipper/i.test(h.White || '') ? 'w' : /congreve274|skipper/i.test(h.Black || '') ? 'b' : 'w';
const resFor = (h, c) => { const r = h.Result; return r === '1/2-1/2' ? 'D' : (r === '1-0') === (c === 'w') && (r === '1-0' || r === '0-1') ? 'W' : (r === '1-0' || r === '0-1') ? 'L' : '?'; };

/* ---------- master positions ("this was in my game") ---------- */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const IDX = Object.fromEntries([...B64].map((c, i) => [c, i]));
function cyrb53(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const enc = (n, w) => { let s = ''; for (let k = w - 1; k >= 0; k--) s += B64[Math.floor(n / Math.pow(2, 6 * k)) % 64]; return s; };
let MI = null;
export const masterIndex = () => MI || (MI = j('data/master_index.json').then(d => { const m = new Map(), s = d.keys; for (let i = 0; i < d.n; i++) { const o = i * 9; m.set(s.substr(o, 6), (IDX[s[o + 6]] << 12) | (IDX[s[o + 7]] << 6) | IDX[s[o + 8]]); } return { games: d.games, map: m }; }).catch(() => ({ games: [], map: new Map() })));
export const masterKey = fen4s => enc(cyrb53(fen4s) % 68719476736, 6);
export const lookupMaster = (I, fen4s) => { const v = I.map.get(masterKey(fen4s)); return v == null ? null : I.games[v]; };
const lastName = s => String(s || '').split(',')[0].trim();
const masterLine = (m, userC, ply) => { const [who, w, b, y] = m, wasW = new RegExp(who, 'i').test(w), opp = lastName(wasW ? b : w); return `I reached this position against ${opp} in ${y}, with ${wasW ? 'White' : 'Black'}.`; };

/* ---------- cache ---------- */
const cacheGet = id => store.get('rv.' + id, null);
function cachePut(id, o) { const idx = (store.get('rvidx', []) || []).filter(x => x !== id); idx.unshift(id); idx.slice(30).forEach(x => { try { localStorage.removeItem('mast.rv.' + x); } catch (_) { } }); store.set('rvidx', idx.slice(0, 30)); store.set('rv.' + id, o); }

/* ---------- screen ---------- */
const CSS = `
.rv-list{display:flex;flex-direction:column;gap:6px;margin-top:var(--s2)}
.rv-row{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-radius:var(--r-md);background:var(--glass);border:1px solid var(--glass-b);cursor:pointer;color:inherit;font:inherit;text-align:left;width:100%}
.rv-row:hover{border-color:var(--a);background:var(--glass-h)}.rv-row .res{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:700 13px var(--f-disp);background:var(--glass-h)}
.rv-row .res.W{background:color-mix(in srgb,var(--good) 35%,transparent);color:var(--good)}.rv-row .res.L{background:color-mix(in srgb,var(--bad) 35%,transparent);color:var(--bad)}
.rv-row b{display:block;font-size:14px}.rv-row .sub{font-size:12px}.rv-row .ck{font:700 11px var(--f-disp);letter-spacing:.12em;color:var(--good)}
.rv-ctl{display:flex;gap:6px;justify-content:center;margin-top:6px}.rv-ctl .btn{white-space:nowrap;min-width:44px;padding-left:10px;padding-right:10px}
.rv-g{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--s3);margin-top:var(--s2);align-items:start}
.rv-bd{width:min(calc(100dvh - 250px),calc(100vw - 480px),600px);min-width:280px}.rv-bw{display:flex;gap:6px}.rv-bw #bd{flex:1;min-width:0}
.rv-side{display:flex;flex-direction:column;gap:var(--s2);min-width:0}
.rv-cm{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:var(--r-md);background:var(--glass-h);border:1px solid var(--glass-b);border-left:3px solid var(--ac,var(--a));min-height:74px}
.rv-cm p{margin:2px 0 0;font-size:14px;line-height:1.4;color:var(--fg)}.rv-cm .kk{font:700 12px var(--f-disp);letter-spacing:.18em;text-transform:uppercase;color:var(--ac,var(--a))}.rv-cm button{margin-top:6px}
.rv-mv{display:flex;flex-wrap:wrap;gap:3px 6px;max-height:190px;overflow:auto;font:600 13px var(--f-body,inherit)}.rv-mv i{font-style:normal;opacity:.55;margin-right:2px}
.rv-mv button{all:unset;cursor:pointer;padding:1px 5px;border-radius:5px;color:var(--fg)}.rv-mv button.on{background:var(--a);color:var(--on-a)}.rv-mv button.mk{box-shadow:inset 0 -2px 0 var(--ac,var(--a))}
.rv-mv .k-mistake,.rv-mv .k-blunder{color:var(--bad)}.rv-mv .k-inaccuracy{color:#e3a43b}.rv-mv .k-best{color:var(--good)}.rv-mv button.on{color:var(--on-a)}
.rv-gr{width:100%;height:auto;display:block;cursor:pointer;touch-action:manipulation}.rv-gr .ax{stroke:var(--glass-b);stroke-width:1}.rv-gr .ar{fill:color-mix(in srgb,var(--fg) 24%,transparent);stroke:var(--a);stroke-width:1.6}
.rv-gr .cur{stroke:var(--a);stroke-width:1.5;stroke-dasharray:3 3}.rv-gr .tp{fill:var(--bad)}.rv-gr .tp.o{fill:#e3a43b}.rv-gr .ba{fill:color-mix(in srgb,var(--a) 55%,transparent)}.rv-gr .ba.o{fill:color-mix(in srgb,var(--fg) 16%,transparent)}.rv-gr .ba.e{fill:var(--bad)}.rv-gr .ba.lt{stroke:#e3a43b;stroke-width:2}.rv-gr .cl{fill:none;stroke:var(--good);stroke-width:1.4;stroke-dasharray:4 3;opacity:.8}
.rv-gr text{fill:var(--dim);font:600 9px var(--f-disp);letter-spacing:.08em}
.rv-sum{display:flex;flex-wrap:wrap;gap:6px}.rv-sum span{font:700 12px var(--f-disp);letter-spacing:.08em;padding:3px 9px;border-radius:var(--r-pill);background:var(--glass-h);border:1px solid var(--glass-b)}
.rv-pg{display:flex;gap:10px;align-items:center;font-size:13px;color:var(--dim)}.rv-pg .bar{flex:1;height:6px;border-radius:3px;background:var(--glass-h);overflow:hidden}.rv-pg .bar i{display:block;height:100%;background:var(--a);transition:width .3s}
@media(max-width:820px){.rv-g{grid-template-columns:1fr}.rv-bd{width:min(100%,calc(100dvh - 300px));min-width:0;justify-self:center}}
html[data-anim=off] .rv-pg .bar i{transition:none}`;
function css() { if (document.getElementById('mast-rv-css')) return; const s = document.createElement('style'); s.id = 'mast-rv-css'; s.textContent = CSS; document.head.appendChild(s); }

let R = null;
export function stopReview() { if (!R) return; R.tok++; R.dead = true; try { R.board.destroy(); } catch (_) { } R = null; getEngine().stop(); document.removeEventListener('keydown', onKey); }
function onKey(e) { if (!R || /input|textarea/i.test(e.target.tagName)) return; if (e.key === 'ArrowLeft') { R.go(R.cur - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { R.go(R.cur + 1); e.preventDefault(); } else if (e.key === 'Home') R.go(0); else if (e.key === 'End') R.go(R.n); }

export async function reviewScreen(ctx, arg) {
  css(); stopReview(); const { render, topbar } = ctx, view = $('#view');
  const mg = await myGames(), crewG = savedGames();
  let g = null;
  if (arg && arg.startsWith('c-')) { const rec = crewG.find(x => x.id === arg.slice(2)); if (rec) { const p = parsePGNs(rec.pgn)[0]; g = { ...p, id: rec.id, label: 'vs ' + rec.opp } } }
  else if (arg && /^m\d+$/.test(arg)) { const p = mg[+arg.slice(1)]; if (p) g = { ...p, id: (p.h.Link || '').split('/').pop() || arg, label: 'vs ' + (/congreve274/i.test(p.h.White) ? p.h.Black : p.h.White) }; }
  if (!g) return listScreen(ctx, mg, crewG);
  return gameScreen(ctx, g);
}

function listScreen({ render, topbar }, mg, crewG) {
  const done = new Set(store.get('rvidx', []) || []);
  const row = (href, h, c, label) => { const r = resFor(h, c), eco = (h.ECOUrl || '').split('/').pop().replace(/-/g, ' ').replace(/\s*\d.*$/, '').slice(0, 44); const opp = c === 'w' ? h.Black : h.White, oe = c === 'w' ? h.BlackElo : h.WhiteElo;
    return `<a class="rv-row" href="#review/${href}"><span class="res ${r}">${r}</span><span><b>${esc(label || opp)}${oe ? ' <span class="sub">(' + esc(oe) + ')</span>' : ''}</b><span class="sub">${esc((h.Date || '').replace(/\./g, '-'))} · ${esc(h.TimeControl || '')}${eco ? ' · ' + esc(eco) : ''} · ${c === 'w' ? 'White' : 'Black'}</span></span><span class="ck">${done.has(href.startsWith('c-') ? href.slice(2) : ((h.Link || '').split('/').pop())) ? 'ANALYSED' : ''}</span></a>`; };
  const crewRows = crewG.map(x => { const p = parsePGNs(x.pgn)[0]; return p ? row('c-' + x.id, p.h, mine(p.h), 'vs ' + x.opp) : ''; }).join('');
  const myRows = mg.map((p, i) => row('m' + i, p.h, mine(p.h))).join('');
  render(`${topbar}<span class="k">Ship's log</span><h1>Review</h1><p class="sub mt1">Pick a game. The crew steps in at the turning points, and Stockfish (running right here in your browser) finds them as you watch.</p>
   ${crewRows ? `<h3 class="mt2">Games against the crew</h3><div class="rv-list">${crewRows}</div>` : ''}
   <h3 class="mt2">Your recent chess.com games</h3><div class="rv-list">${myRows || '<p class="sub">No games found.</p>'}</div><div id="lb"></div>`);
  const v = $('#view'); v.insertAdjacentHTML('afterbegin', `<div class="cabin-bg" aria-hidden="true">${cabinSVG()}</div>`); v.classList.add('in-cabin'); logbook($('#lb'));
}

async function gameScreen({ render, topbar }, g) {
  const view = $('#view'); render(`${topbar}${loadingState('Unrolling the game log...')}`);
  const userC = mine(g.h), tc = tcOf(g.h); let chars = {}; try { chars = (await j('data/characters.json')).characters; } catch (_) { }
  const I = await masterIndex();
  // replay
  const ch = new Chess(), fens = [ch.fen()], moves = [];
  for (const s of g.san) { const m = ch.move(s, { sloppy: true }); if (!m) break; moves.push({ san: m.san, uci: m.from + m.to + (m.promotion || ''), from: m.from, to: m.to, color: m.color, cap: !!m.captured, chk: /[+#]/.test(m.san) }); fens.push(ch.fen()); }
  const n = moves.length; if (!n) { render(`${topbar}${errorState('That game has no readable moves.')}`); return; }
  const f4 = fens.map(f => { const t = new Chess(f); return fen4(t); });
  const matches = {}; for (let p = 10; p <= Math.min(30, n); p++) { const m = lookupMaster(I, f4[p]); if (m) matches[p] = m; }
  const spent = moves.map((m, i) => { const c = g.clk[i]; if (c == null) return null; const pc = g.clk[i - 2]; return pc != null ? Math.max(0, pc - c + tc.inc) : Math.max(0, tc.base - c + (i < 2 ? 0 : tc.inc)); });
  const matDown = f => { let s = 0; (f.split(' ')[0]).replace(/[qrbnQRBN]/g, c => { s += V[c.toLowerCase()]; }); return s; };
  const cached = cacheGet(g.id);
  R = { tok: 0, cur: 0, n, fens, moves, userC, E: cached && cached.E.length === n + 1 ? cached.E.slice() : [], B: cached && cached.B.length === n + 1 ? cached.B.slice() : [], cm: {}, g, tc, spent, id: g.id };
  const orient = userC === 'w' ? 'white' : 'black', res = resFor(g.h, userC), opp = userC === 'w' ? g.h.Black : g.h.White;
  render(`${topbar}<a class="back" href="#review">&larr; All games</a><h1 style="margin-top:6px">${esc(g.label)}</h1><p class="sub">${esc((g.h.Date || '').replace(/\./g, '-'))} · ${esc(g.h.TimeControl || '')} · You were ${userC === 'w' ? 'White' : 'Black'} · ${res === 'W' ? 'Won' : res === 'L' ? 'Lost' : res === 'D' ? 'Drawn' : ''}${g.h.Termination ? ' · ' + esc(g.h.Termination) : ''}</p>
   <div class="rv-g"><div class="rv-bd"><div class="rv-bw"><div id="evb"></div><div id="bd"></div></div><div class="rv-ctl"><button class="btn ghost sm" id="b0" aria-label="Start">&#x23EE;</button><button class="btn ghost sm" id="b1" aria-label="Previous move">&#9664;</button><button class="btn ghost sm" id="bp" aria-label="Previous turning point">&#x21E4; TP</button><button class="btn ghost sm" id="bn" aria-label="Next turning point">TP &#x21E5;</button><button class="btn ghost sm" id="b2" aria-label="Next move">&#9654;</button><button class="btn ghost sm" id="b3" aria-label="End">&#x23ED;</button></div></div>
    <div class="rv-side"><div id="pg" class="rv-pg"></div><div id="cm"></div><div id="sum" class="rv-sum"></div>
     <div class="panel"><span class="k">Evaluation (tap to jump)</span><div id="egr"></div></div>
     <div class="panel"><span class="k">Clock profile: seconds per move</span><div id="cgr"></div><p class="sub sm" id="cnote"></p></div>
     <div class="panel"><span class="k">Moves</span><div class="rv-mv" id="mv"></div></div></div></div>`);
  hydrate(view);
  const evb = new EvalBar($('#evb'), { flip: userC === 'b' });
  const board = R.board = new Board($('#bd'), { orientation: orient, coords: true, movable: 'none', onMove: () => false }); board.setPosition(fens[0], { animate: false }); board.setLegal({});
  const me = R;
  /* ----- derived ----- */
  const loss = i => { const a = me.E[i], b = me.E[i + 1]; if (a == null || b == null) return null; return (moves[i].color === 'w' ? 1 : -1) * (cl(a) - cl(b)); };
  const kindOf = i => { const l = loss(i); if (l == null) return null; return moves[i].uci === me.B[i] || l <= 12 ? 'best' : l <= 45 ? 'good' : l < 60 ? 'good' : l < TP ? 'inaccuracy' : l < 300 ? 'mistake' : 'blunder'; };
  const sanOf = (i, uci) => { try { const t = new Chess(fens[i]), m = t.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' }); return m ? m.san : uci; } catch (_) { return uci || ''; } };
  const pick = (who, ev, i, vars) => { const arr = ((chars[who] || {}).lines || {})[ev] || ((chars[who] || {}).lines || {}).fail || []; return arr.length ? arr[i % arr.length].replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : ''; };
  function comment(i) { // move index i (played from position i), his moves only
    if (me.cm[i] !== undefined) return me.cm[i]; const l = loss(i); if (l == null) return undefined;
    if (moves[i].color !== userC) return me.cm[i] = l >= TP ? { who: 'Skipper', kind: 'gift', best: null, bsan: '', text: `${opp || 'Your opponent'} slipped with ${moves[i].san}: the evaluation swung ${(l / 100).toFixed(1)} your way. What does it allow? Look for it before the next move.` } : null;
    let c = null;
    if (l >= TP) {
      const best = me.B[i], bsan = sanOf(i, best), sgn = userC === 'w' ? 1 : -1, before = sgn * me.E[i], ph = i < 20 ? 'Morphy' : matDown(fens[i]) <= 14 ? 'Capablanca' : 'Kasparov';
      const bm = (() => { try { const t = new Chess(fens[i]), m = t.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: best[4] || 'q' }); return m; } catch (_) { return null; } })();
      const clkLeft = g.clk[i], secs = spent[i] != null ? Math.round(spent[i]) : 0;
      let who = ph, ev = 'fail';
      if (before >= 90000) { who = 'Leela'; ev = 'missed_mate'; }
      else if (clkLeft != null && clkLeft < 20) { who = 'Tempo'; ev = 'time_trouble'; }
      else if (before >= 200) { who = 'Carlsen'; ev = 'blunder_when_winning'; }
      else if (bm && (bm.captured || /[+#]/.test(bm.san))) { who = 'Tal'; ev = 'fail'; }
      const phz = i < 20 ? 'opening' : matDown(fens[i]) <= 14 ? 'endgame' : 'middlegame', mot = motifOf(bm, phz);
      c = { who, ev, best, bsan, loss: l, mot, kind: kindOf(i), text: (ev === 'fail' && contextLine(who, { motif: mot, played: moves[i].san, best: bsan, loss: l, i })) || pick(who, ev, i, { played: moves[i].san, move: bsan, eval: fmtEval(Math.abs(before) > 9000 ? 1000 : before), secs: ev === 'time_trouble' ? Math.round(clkLeft) : secs, game: 'vs ' + opp }) };
    } else c = null;
    return me.cm[i] = c;
  }
  const tps = () => { const a = []; for (let i = 0; i < n; i++) { const l = loss(i); if (l != null && l >= TP) a.push(i); } return a; };
  /* ----- render pieces ----- */
  const egr = () => {
    const W = 600, H = 120, mid = 60, x = i => (i / n) * W, y = v => mid - 54 * Math.tanh(cl(v) / 450);
    const pts = []; for (let i = 0; i <= n; i++) if (me.E[i] != null) pts.push([x(i), y(me.E[i])]);
    let d = ''; if (pts.length > 1) d = `M${pts[0][0]},${mid}L` + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + `L${pts[pts.length - 1][0].toFixed(1)},${mid}Z`;
    const dots = []; for (let i = 0; i < n; i++) { const l = loss(i); if (l != null && l >= TP) dots.push(`<circle class="tp ${moves[i].color === userC ? '' : 'o'}" cx="${x(i + 1).toFixed(1)}" cy="${y(me.E[i + 1]).toFixed(1)}" r="4.5"/>`); }
    const mk = Object.keys(matches).map(p => `<rect x="${x(+p) - 1}" y="${H - 5}" width="2.5" height="5" fill="var(--a)"/>`).join('');
    $('#egr').innerHTML = `<svg class="rv-gr" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evaluation graph, White above the line"><line class="ax" x1="0" x2="${W}" y1="${mid}" y2="${mid}"/><path class="ar" d="${d}"/>${dots.join('')}${mk}<line class="cur" id="egc" x1="${x(me.cur)}" x2="${x(me.cur)}" y1="0" y2="${H}"/><text x="4" y="11">WHITE</text><text x="4" y="${H - 4}">BLACK</text></svg>`;
    const s = $('#egr svg'); s.onclick = e => { const r = s.getBoundingClientRect(); me.go(Math.round(((e.clientX - r.left) / r.width) * n)); };
  };
  const cgr = () => {
    const mine_ = []; moves.forEach((m, i) => { if (spent[i] != null && m.color === userC) mine_.push(spent[i]); });
    if (!mine_.length) { $('#cgr').innerHTML = '<p class="sub">No clock data in this game.</p>'; $('#cnote').textContent = ''; return; }
    const srt = [...mine_].sort((a, b) => a - b), med = srt[Math.floor(srt.length / 2)], p95 = srt[Math.floor(srt.length * .95)] || 1, cap = Math.max(20, p95), lt = Math.max(15, med * 3);
    const W = 600, H = 100, bw = W / n; let bars = '', line = [];
    moves.forEach((m, i) => { const s = spent[i]; if (s == null) return; const mineM = m.color === userC, h = Math.min(1, s / cap) * (H - 12), k = kindOf(i), err = mineM && (k === 'mistake' || k === 'blunder');
      bars += `<rect class="ba ${mineM ? '' : 'o'} ${err ? 'e' : ''} ${mineM && s >= lt ? 'lt' : ''}" x="${(i * bw + .8).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${Math.max(1.5, bw - 1.6).toFixed(1)}" height="${h.toFixed(1)}" data-i="${i + 1}"><title>${m.san}: ${Math.round(s)}s</title></rect>`;
      if (mineM && g.clk[i] != null && tc.base) line.push(`${(i * bw + bw / 2).toFixed(1)},${(H - (g.clk[i] / tc.base) * (H - 12)).toFixed(1)}`); });
    $('#cgr').innerHTML = `<svg class="rv-gr" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Seconds spent per move">${bars}${line.length > 1 ? `<polyline class="cl" points="${line.join(' ')}"/>` : ''}</svg>`;
    $('#cgr svg').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); me.go(Math.round(((e.clientX - r.left) / r.width) * n)); };
    const longs = moves.map((m, i) => [i, spent[i]]).filter(([i, s]) => s != null && moves[i].color === userC && s >= lt), lerr = longs.filter(([i]) => { const k = kindOf(i); return k === 'mistake' || k === 'blunder'; }).length;
    $('#cnote').textContent = `Your median: ${Math.round(med)}s. Orange outline: long thinks (${Math.round(lt)}s+), ${longs.length} of them${me.E.length > n ? `, ${lerr} of those were mistakes or blunders` : ''}. Red: mistakes and blunders. Dashed green: your clock.`;
  };
  const mvl = () => {
    $('#mv').innerHTML = moves.map((m, i) => { const k = m.color === userC ? kindOf(i) : null, sym = k === 'blunder' ? '??' : k === 'mistake' ? '?' : k === 'inaccuracy' ? '?!' : '', mk = matches[i + 1] ? 'mk' : '';
      return (i % 2 === 0 ? `<i>${i / 2 + 1}.</i>` : '') + `<button type="button" data-p="${i + 1}" class="${i + 1 === me.cur ? 'on' : ''} ${k ? 'k-' + k : ''} ${mk}" style="--ac:var(--a)">${m.san}${sym}</button>`; }).join('');
    $('#mv').querySelectorAll('button').forEach(b => b.onclick = () => me.go(+b.dataset.p));
  };
  const sum = () => {
    const c = { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }; moves.forEach((m, i) => { if (m.color !== userC) return; const k = kindOf(i); if (k) c[k]++; });
    const T = tps().length, done = me.E.filter(x => x != null).length;
    $('#sum').innerHTML = done > 1 ? `<span style="color:var(--good)">${c.best} best</span><span>${c.good} good</span><span style="color:#e3a43b">${c.inaccuracy} inaccuracies</span><span style="color:var(--bad)">${c.mistake} mistakes</span><span style="color:var(--bad)">${c.blunder} blunders</span><span>${T} turning point${T === 1 ? '' : 's'}</span>${Object.keys(matches).length ? `<span style="color:var(--a)">In the masters' footsteps: moves ${Math.ceil(Math.min(...Object.keys(matches).map(Number)) / 2)}-${Math.ceil(Math.max(...Object.keys(matches).map(Number)) / 2)}</span>` : ''}` : '';
  };
  const cmPanel = () => {
    const i = me.cur, blocks = []; let arrow = null;
    const c0 = i < n ? comment(i) : null, c1 = i > 0 ? comment(i - 1) : null, m = matches[i];
    if (c0 && c0.kind === 'gift') blocks.push(`<div class="rv-cm" style="--ac:${accOf('Skipper')}">${avatar('Skipper', 'pleased')}<div><span class="kk">Turning point &middot; opponent error</span><p>${esc(c0.text)}</p></div></div>`);
    else if (c0) { blocks.push(`<div class="rv-cm" style="--ac:${accOf(c0.who)}">${avatar(c0.who, 'neutral')}<div><span class="kk">${c0.who} steps in &middot; ${c0.kind}</span><p>${esc(c0.text)}</p><p class="sub sm">You are about to play ${esc(moves[i].san)}. Better: <b>${esc(c0.bsan)}</b> (arrow).</p>${askBtn(c0.who)}</div></div>`); arrow = c0.best;
      if (i % 3 === 0) { const dg = disagreement({ bestIsAggressive: isAggressive(c0.bsan), seed: (i * 0.6180339) % 1 }); blocks.push(`<div class="rv-cm rv-dg"><div><span class="kk">The crew disagrees</span><p><b style="color:${accOf(dg.a)}">${dg.a}:</b> ${esc(dg.la)}<br><b style="color:${accOf(dg.b)}">${dg.b}:</b> ${esc(dg.lb)}</p><p class="sub sm">Engine verdict: <b>${esc(c0.bsan)}</b>. ${dg.winner} was right.</p></div>${avatar(dg.winner, 'excited', 'sm')}</div>`); } }
    else if (c1 && c1.kind !== 'gift') blocks.push(`<div class="rv-cm" style="--ac:${accOf(c1.who)}">${avatar(c1.who, 'neutral')}<div><span class="kk">${c1.who} &middot; ${c1.kind}</span><p>${esc(c1.text)}</p><button class="btn ghost sm" type="button" id="see">See the better move</button>${askBtn(c1.who)}</div></div>`);
    if (m) blocks.push(`<div class="rv-cm" style="--ac:${accOf(m[0])}">${avatar(m[0], 'pleased')}<div><span class="kk">${m[0]} &middot; this was in my game</span><p>${esc(masterLine(m, userC, i))}</p></div></div>`);
    if (!blocks.length) blocks.push(`<div class="rv-cm"><div><span class="kk">Tip</span><p class="sub">Step with the arrow keys or buttons. TP jumps between turning points (evaluation swings of ${TP}+ centipawns). A gold underline marks a position the masters reached.</p></div></div>`);
    $('#cm').innerHTML = blocks.join(''); hydrate($('#cm'));
    const see = $('#see'); if (see) see.onclick = () => me.go(i - 1);
    $('#cm').querySelectorAll('[data-ask]').forEach(b => b.onclick = () => { const k = c0 && c0.kind !== 'gift' ? i : i - 1, cc = comment(k); bond(b.dataset.ask, 1); openChat(b.dataset.ask, { fen: fens[k], note: `move ${Math.floor(k / 2) + 1}: Gerald played ${moves[k].san}${cc && cc.bsan ? ', engine preferred ' + cc.bsan : ''}`, master: m ? masterLine(m, userC, i) : '' }); });
    board.clearArrows(); if (arrow) board.showArrow(arrow.slice(0, 2), arrow.slice(2, 4), '#3FB37F');
  };
  const askBtn = w => hasKey() && CH[w] ? `<button class="btn ghost sm" type="button" data-ask="${w}">Ask ${w} why</button>` : '';
  const accOf = n_ => (CH[n_] || {}).acc || 'var(--a)';
  const progress = (txt, pct, stop) => { const e = $('#pg'); if (!e) return; e.innerHTML = txt ? `<span>${txt}</span><span class="bar"><i style="width:${pct}%"></i></span>${stop ? '<button class="btn ghost sm" id="stp" type="button">Stop</button>' : ''}` : ''; const s = $('#stp'); if (s) s.onclick = () => { me.tok++; getEngine().stop(); progress('Analysis stopped. Partial results shown.', 0, false); me.stopped = true; resume(); }; };
  const resume = () => { const e = $('#pg'); if (!e) return; const b = document.createElement('button'); b.className = 'btn ghost sm'; b.type = 'button'; b.textContent = 'Resume'; b.onclick = () => { me.stopped = false; analyse(); }; e.appendChild(b); };
  const refresh = () => { egr(); cgr(); mvl(); sum(); cmPanel(); evUpdate(); };
  const evUpdate = () => { const e = me.E[me.cur]; if (e == null) return; const mate = Math.abs(e) >= 90000 ? (e > 0 ? 1 : -1) * (100000 - Math.abs(e)) : undefined; evb.set(e, mate); };
  me.go = i => {
    i = Math.max(0, Math.min(n, i)); const old = me.cur; me.cur = i; Resume.patch('review', { ply: i }); const m = moves[i - 1];
    board.setPosition(fens[i], { animate: Math.abs(i - old) === 1, lastMove: m ? { from: m.from, to: m.to } : null, check: new Chess(fens[i]).in_check() });
    mvl(); cmPanel(); evUpdate(); const c = $('#egc'); if (c) { const x = (i / n) * 600; c.setAttribute('x1', x); c.setAttribute('x2', x); }
    const on = $('#mv button.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  };
  $('#b0').onclick = () => me.go(0); $('#b1').onclick = () => me.go(me.cur - 1); $('#b2').onclick = () => me.go(me.cur + 1); $('#b3').onclick = () => me.go(n);
  $('#bn').onclick = () => { const nx = tps().find(i => i > me.cur); if (nx != null) me.go(nx); };
  $('#bp').onclick = () => { const pv = tps().filter(i => i < me.cur).pop(); if (pv != null) me.go(pv); };
  document.removeEventListener('keydown', onKey); document.addEventListener('keydown', onKey);
  refresh(); { Resume.save('review', { ply: 0 }); const rs = Resume.consume('review'); if (rs && rs.ply > 0) me.go(rs.ply); }
  /* ----- analysis ----- */
  const eng = getEngine();
  async function analyse() {
    const tok = ++me.tok; const total = n + 1, have = () => me.E.filter(x => x != null).length;
    if (have() === total) { progress('', 0); return; }
    progress('Warming up Stockfish (first time only)...', 4, true);
    try { await eng.init(); } catch (e) { progress('The engine could not start in this browser.', 0); return; }
    for (let i = 0; i <= n; i++) {
      if (tok !== me.tok || me.dead) return; if (me.E[i] != null) continue;
      const t = new Chess(fens[i]);
      if (t.in_checkmate()) { me.E[i] = t.turn() === 'w' ? -100000 : 100000; me.B[i] = null; }
      else if (t.in_stalemate() || t.in_draw()) { me.E[i] = 0; me.B[i] = null; }
      else {
        const r = await eng.analyse(fens[i], { depth: DEPTH, multipv: 1, timeout: 30000, cancelled: () => tok !== me.tok || me.dead }).catch(() => null);
        if (tok !== me.tok || me.dead) return; if (!r || !r.lines.length) { me.E[i] = 0; me.B[i] = null; } else { me.E[i] = scoreWhite(r.lines[0], fens[i]); me.B[i] = r.bestmove; }
      }
      const h = have(); progress(`Analysing in your browser: ${h} of ${total} positions (depth ${DEPTH})`, Math.round(h / total * 100), true);
      if (h % 3 === 0 || h === total) { egr(); sum(); cgr(); mvl(); cmPanel(); } evUpdate();
    }
    if (tok !== me.tok) return;
    progress('', 0); cachePut(me.id, { E: me.E, B: me.B }); refresh();
  }
  analyse();
}
