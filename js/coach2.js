// Coach part 2: openings (repertoire builder, trainer from his own games, masters' openings) and endgames (Capablanca's island, convert the win).
import { Board } from './board2.js';
import { fen4 } from './engine.js';
import { esc, q, C, upd, day, data, css, runSet, vsEngine, reg, eng, toUci, sanOf, shuffle, bar, empty, crewSays, cpStm } from './coach-core.js';
import { avatar } from './ui.js';
import * as Pr from './progress.js';
import { bumpIsland } from './voyage.js';
import { play as sfx } from './sound.js';

const xp = (n, why) => { try { Pr.addXp(n, why); } catch (_) { } };
const DAYS = { 1: 0, 2: 1, 3: 4, 4: 12 };

/* ---------- study stepper: walk a SAN line with Morphy's notes, master stats and an engine check ---------- */
let REP = null;
async function masterStats(f4) { REP ||= await data('data/repertoire').catch(() => ({})); const out = []; for (const m of Object.keys(REP)) { const t = (REP[m].tree || {})[f4]; if (t) out.push({ m, mv: t.slice(0, 2) }); } return out; }
export function study(root, line, { orient = 'white', who = 'Morphy' } = {}) {
  const moves = line.moves.split(/\s+/), g0 = new Chess(), fens = [g0.fen()], sans = [];
  const g = new Chess(); moves.forEach(m => { const r = g.move(m); sans.push(r.san); fens.push(g.fen()); });
  let i = 0;
  root.innerHTML = `<div class="co-run"><div class="co-bw"><div class="co-bd" id="s-bd"></div></div><div class="co-row" id="s-c"><button class="btn ghost sm" id="s-0" type="button" aria-label="Start">&#9198;</button><button class="btn ghost sm" id="s-b" type="button" aria-label="Back">&#9664;</button><button class="btn sm" id="s-f" type="button">Next move</button><button class="btn ghost sm" id="s-e" type="button">Ask the engine</button></div><div class="co-info" id="s-i" aria-live="polite"></div></div>`;
  const board = new Board(q(root, '#s-bd'), { orientation: orient, coords: true, movable: 'none', onMove: () => false }); board.setLegal({});
  const info = q(root, '#s-i'); let tok = 0;
  const san = k => { const n = Math.floor(k / 2) + 1; return (k % 2 === 0 ? n + '. ' : n + '... ') + sans[k]; };
  async function show(k, anim = true) {
    i = Math.max(0, Math.min(moves.length, k)); const my = ++tok;
    board.setPosition(fens[i], { animate: anim, lastMove: null });
    const prev = i ? san(i - 1) : 'Start'; const note = line.notes && line.notes[i];
    info.innerHTML = `<p><b>${i ? esc(prev) : 'Starting position'}</b> <span class="sub sm">${i}/${moves.length}</span></p>${note ? `<div class="co-says" style="margin:4px 0">${avatar(who, 'pleased', 'sm')}<p><b>${esc(who)}:</b> ${esc(note)}</p></div>` : ''}${i === 0 ? `<p class="sub">${esc(line.idea || '')}</p>` : ''}<p class="sub sm" id="s-m"></p><p class="sub sm" id="s-ev"></p>`;
    if (i < moves.length) { try { const g1 = new Chess(fens[i]); const f4 = fen4(g1); const ms = await masterStats(f4); if (my !== tok) return; const el = q(root, '#s-m'); if (el && ms.length) el.textContent = 'Masters here: ' + ms.map(x => `${x.m} plays ${sanOf(fens[i], x.mv[0][0])} (${x.mv[0][1]} games, ${Math.round(x.mv[0][2] * 100)}%)`).join('; ') + '.'; } catch (_) { } }
  }
  q(root, '#s-0').onclick = () => show(0, false); q(root, '#s-b').onclick = () => show(i - 1); q(root, '#s-f').onclick = () => { show(i + 1); sfx('move'); };
  q(root, '#s-e').onclick = async () => { const my = tok, ev = q(root, '#s-ev'); ev.textContent = 'Asking the engine...'; try { const e = await eng(), r = await e.analyse(fens[i], { depth: 12, multipv: 1, timeout: 15000 }); if (my !== tok) return; const l = r.lines[0], w = fens[i].split(' ')[1] === 'w' ? 1 : -1, s = l.score, v = s.mate != null ? 'mate in ' + Math.abs(s.mate) : ((w * s.cp) / 100 >= 0 ? '+' : '') + ((w * s.cp) / 100).toFixed(1); ev.textContent = `Engine (depth ${l.depth}): ${v} for White; best here is ${sanOf(fens[i], l.pv[0])}.`; } catch (_) { ev.textContent = 'The engine is not available right now.'; } };
  show(0, false);
  return reg({ stop() { tok++; try { board.destroy(); } catch (_) { } } });
}

/* ---------- Leitner for the opening trainer ---------- */
const boxes = () => (C().openings || {}).box || {};
function pickOpen(pool, n) { const B = boxes(), now = Date.now(); const due = pool.filter(p => B[p.id] && B[p.id].due <= now).sort((a, b) => B[a.id].box - B[b.id].box), fresh = shuffle(pool.filter(p => !B[p.id])); return [...due, ...fresh].slice(0, n); }
function recOpen(results) { upd(c => { const o = c.openings ||= { box: {}, hist: [] }; results.forEach(r => { const k = r.id, b = o.box[k] ? o.box[k].box : 0, nb = r.ok ? Math.min(4, b + 1) : 1; o.box[k] = { box: nb, due: r.ok ? Date.now() + DAYS[nb] * 864e5 : 0 }; }); o.hist.push({ t: Date.now(), ok: results.filter(r => r.ok).length, n: results.length }); o.hist = o.hist.slice(-60); }); }
export async function openingAct(root, { n = 8 } = {}) {
  const oe = await data('opening_errors'); const items = pickOpen(oe.map(r => ({ id: r.id, fen: r.fen, sol: [toUci(r.fen, r.best)], san: r.best, played: r.played, note: `From your game on ${r.date}, move ${Math.ceil(r.ply / 2)} (${r.tc || '?'} clock). That slip cost ${(r.loss / 100).toFixed(1)} pawns.`, kind: 'opening' })).filter(x => x.sol[0]), n);
  if (!items.length) return { title: 'Opening trainer', ok: 0, n: 0 };
  const run = runSet(root, items, { timed: 0, cct: false }); const res = await run.promise; recOpen(res); xp(res.filter(r => r.ok).length * 2, 'coach');
  return { title: 'Opening trainer', ok: res.filter(r => r.ok).length, n: res.length };
}

export async function openingsPage(ctx, root, sub) {
  css(); const O = await data('openings'); let tab = sub || 'repertoire', side = 'white', cur = null, rt = null;
  const tabs = [['repertoire', 'My repertoire'], ['trainer', 'Trainer'], ['masters', "Masters' openings"]];
  const stop = () => { if (rt) { rt.stop(); rt = null; } };
  const head = () => `<div class="co-tabs" role="tablist">${tabs.map(([k, l]) => `<button class="btn ghost sm ${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}" data-t="${k}" type="button">${l}</button>`).join('')}</div><div id="o-body" class="co-sec" style="margin-top:14px"></div>`;
  const paint = () => { stop(); root.innerHTML = head(); root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; cur = null; paint(); }); const B = q(root, '#o-body'); ({ repertoire: rep, trainer: trainer, masters: masters }[tab])(B); };
  function rep(B) {
    if (cur) { const L = cur; B.innerHTML = `<button class="btn ghost sm" id="o-back" type="button">&larr; All lines</button><h2 style="margin:10px 0 2px">${esc(L.name)}</h2><p class="sub">${esc(L.vs)}</p><div id="o-st"></div><div class="co-row" style="margin-top:12px"><button class="btn" id="o-test" type="button">Test me on this line</button></div><div id="o-tst"></div>`;
      let st = study(q(B, '#o-st'), L, { orient: side, who: 'Morphy' }); q(B, '#o-back').onclick = () => { cur = null; paint(); };
      q(B, '#o-test').onclick = async () => { st.stop(); q(B, '#o-st').innerHTML = ''; const mv = L.moves.split(/\s+/), g = new Chess(), items = []; mv.forEach((m, k) => { const mine = (side === 'white') === (k % 2 === 0), fen = g.fen(), r = g.move(m); if (mine) items.push({ id: `${side}:${L.name}:${k}`, fen, sol: [r.from + r.to + (r.promotion || '')], san: r.san, note: L.notes && L.notes[k + 1], kind: 'rep' }); });
        const run = runSet(q(B, '#o-tst'), items, { timed: 0 }); rt = run; const res = await run.promise; recOpen(res); const ok = res.filter(r => r.ok).length; q(B, '#o-tst').innerHTML = `${crewSays('Morphy', ok === res.length ? 'excited' : 'pleased', `${ok} of ${res.length} moves from memory. ${ok === res.length ? 'Word perfect.' : 'Run it again until every move is automatic.'}`)}<button class="btn" id="o-again" type="button">Again</button>`; q(B, '#o-again').onclick = () => paint(); xp(ok, 'coach'); }; return; }
    const lines = O[side]; B.innerHTML = `<div class="co-row"><button class="btn ghost sm ${side === 'white' ? 'on' : ''}" data-s="white" type="button">As White</button><button class="btn ghost sm ${side === 'black' ? 'on' : ''}" data-s="black" type="button">As Black</button></div>
     ${crewSays('Morphy', 'pleased', side === 'white' ? 'Your records back the London and your Chigorin: about 62% over 108 games for the Chigorin, 67% for the accelerated London. Build on them rather than starting again. Lines come from standard theory I checked for legality; use <i>Ask the engine</i> to see the numbers.' : 'As Black you score 46% with 1...g6 and 39% against 1.d4, so I suggest simple, sound systems: the Caro-Kann against 1.e4 and the Slav against 1.d4. Bishop out before the pawn chain locks it in.')}
     <div class="co-opts">${lines.map((l, k) => `<button class="btn ghost" data-l="${k}" type="button"><b>${esc(l.name)}</b><br><span class="sub sm">${l.n} plies. ${esc(l.vs)}</span></button>`).join('')}</div>`;
    B.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { side = b.dataset.s; paint(); }); B.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { cur = lines[+b.dataset.l]; paint(); });
  }
  async function trainer(B) {
    const oe = await data('opening_errors'), bx = boxes(), now = Date.now(), due = oe.filter(r => bx[r.id] && bx[r.id].due <= now).length, seen = Object.keys(bx).length, h = (C().openings || {}).hist || [];
    B.innerHTML = `<h2>Opening trainer</h2><p class="sub">${oe.length} positions from <b>your own games</b> where you went wrong in the first 12 moves. They come back on a spaced schedule (Leitner): missed ones tomorrow, known ones later. ${seen} seen, ${due} due now.</p>${h.length ? `<p class="sub sm">Last session: ${h[h.length - 1].ok} of ${h[h.length - 1].n}.</p>` : ''}<div class="co-row"><button class="btn" id="o-go" type="button">Train 8 positions</button></div><div id="o-run" style="margin-top:12px"></div>`;
    q(B, '#o-go').onclick = async () => { q(B, '#o-go').disabled = true; const r = await openingAct(q(B, '#o-run')); q(B, '#o-run').innerHTML = crewSays('Morphy', r.ok >= r.n * .7 ? 'excited' : 'pleased', `${r.ok} of ${r.n}. Each miss returns tomorrow.`) + '<button class="btn" id="o-more" type="button">Another eight</button>'; q(B, '#o-more').onclick = () => paint(); };
  }
  function masters(B) {
    let ms = null; const names = ['Morphy', 'Carlsen', 'Kasparov', 'Tal', 'Capablanca'];
    const lessons = O.lessons;
    B.innerHTML = `<h2>Lessons, played through</h2><div class="co-opts">${lessons.map((l, k) => `<button class="btn ghost" data-ls="${k}" type="button"><b>${esc(l.title)}</b><br><span class="sub sm">${esc(l.master)}. ${esc(l.src)}</span></button>`).join('')}</div><div id="o-ls"></div>
     <h2 class="mt2" style="margin-top:22px">Walk a master's repertoire</h2><p class="sub">Pick a master, then play the other side's moves on the board. When the master's bundled games contain your position, you see what they played and how it scored.</p><div class="co-row">${['Tal', 'Capablanca', 'Morphy', 'Carlsen', 'Kasparov'].map(n => `<button class="btn ghost sm" data-m="${n}" type="button">${n}</button>`).join('')}</div><div id="o-mb"></div>`;
    B.querySelectorAll('[data-ls]').forEach(b => b.onclick = () => { stop(); const l = lessons[+b.dataset.ls]; q(B, '#o-ls').innerHTML = `<h3 style="margin-top:14px">${esc(l.title)}</h3><div id="o-lsb"></div>`; rt = study(q(B, '#o-lsb'), l, { orient: 'white', who: l.master }); q(B, '#o-ls').scrollIntoView({ block: 'nearest' }); });
    B.querySelectorAll('[data-m]').forEach(b => b.onclick = async () => { stop(); const m = b.dataset.m; REP ||= await data('data/repertoire'); const T = REP[m] || {}, tree = T.tree || {}; const box = q(B, '#o-mb'); let col = 'white';
      const start = () => { box.innerHTML = `<div class="co-row" style="margin:10px 0"><button class="btn ghost sm ${col === 'white' ? 'on' : ''}" data-c="white" type="button">${m} as White</button><button class="btn ghost sm ${col === 'black' ? 'on' : ''}" data-c="black" type="button">${m} as Black</button><span class="sub sm">${(T.games || 0).toLocaleString()} games</span></div><div class="co-bw"><div class="co-bd" id="mb-bd"></div></div><div class="co-info" id="mb-i"></div>`;
        const g = new Chess(), bd = new Board(q(box, '#mb-bd'), { orientation: col, coords: true, movable: 'both', onMove: (f, t, p) => { const r = g.move({ from: f, to: t, promotion: p || 'q' }); if (!r) return false; sfx('move'); setTimeout(upd1, 0); return true; } });
        const legal = () => { const mm = {}; g.moves({ verbose: true }).forEach(x => (mm[x.from] ??= []).push(x.to)); return mm; };
        function upd1() { bd.setPosition(g.fen(), { animate: false, check: g.in_check() }); bd.setLegal(legal()); bd.setTurn(g.turn() === 'w' ? 'white' : 'black', true); const t = tree[fen4(g)], mine = (g.turn() === 'w') === (col === 'white'); const el = q(box, '#mb-i');
          el.innerHTML = t ? `<p><b>${m} here:</b></p>` + t.map(([u, n, s]) => `<button class="btn ghost sm" data-u="${u}" type="button">${esc(sanOf(g.fen(), u))}: ${n} game${n > 1 ? 's' : ''}, ${Math.round(s * 100)}% score</button>`).join(' ') : `<p class="sub">${mine ? `${m} has no bundled data for this position (only the first 8 plies, positions seen twice or more).` : `Your move for the opponent. Play anything.`}</p>`;
          el.querySelectorAll('[data-u]').forEach(x => x.onclick = () => { const u = x.dataset.u; g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); sfx('move'); upd1(); }); }
        box.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { try { bd.destroy(); } catch (_) { } col = x.dataset.c; start(); }); upd1(); rt = reg({ stop() { try { bd.destroy(); } catch (_) { } } }); };
      start(); });
  }
  paint();
}

/* ---------- Capablanca's island: endgames vs the engine ---------- */
const CAP = { eg04: 40, eg05: 40, eg23: 50, eg25: 50, eg12: 40, eg16: 30 }, HOLD = { eg17: 25 };
let QUOTES = null;
export async function quoteFor(name) {
  QUOTES ||= (await data('data/sources/capablanca')).excerpts; const k = ['queen', 'rook', 'bishop', 'knight', 'pawn', 'king', 'opposition'].find(w => name.toLowerCase().includes(w)); const pool = QUOTES.filter(e => e.phase === 'Endgame' && (!k || e.text.toLowerCase().includes(k))); let a = pool.length ? pool : QUOTES.filter(e => e.phase === 'Endgame'); const sh = a.filter(e => (e.words || 99) <= 70); if (sh.length) a = sh;
  const e = a[Math.floor(Math.random() * a.length)]; return `<blockquote class="co-says" style="display:block"><p>&ldquo;${esc(e.text)}&rdquo;</p><p class="sub sm">Capablanca, <i>Chess Fundamentals</i> (1921), ${esc(e.chapter)}</p></blockquote>`;
}
const egState = id => (C().endgames || {})[id] || { days: [], tries: 0 };
export const egMastered = id => egState(id).days.length >= 2;
export async function endgameAct(root, { id } = {}) {
  const E = await data('endgames'); let e = E.find(x => x.id === id); if (!e) { const todo = E.filter(x => !egMastered(x.id) && !egState(x.id).days.includes(day())); e = (todo.length ? todo : E).slice().sort((a, b) => egState(a.id).days.length - egState(b.id).days.length || a.difficulty - b.difficulty)[0]; }
  root.innerHTML = `<div class="co-says">${avatar('Capablanca', 'pleased', 'sm')}<p><b>${esc(e.name)}.</b> ${esc(e.note)}</p></div><div id="eg-b"></div><div id="eg-q"></div>`;
  const run = vsEngine(q(root, '#eg-b'), { fen: e.fen, goal: e.goal, cap: CAP[e.id] || 30, holdN: HOLD[e.id] || 20, ms: 250 }); const res = await run.promise; if (res.reason === 'stopped') return { title: e.name, ok: 0, n: 0 };
  const was = egMastered(e.id); upd(c => { const s = (c.endgames ||= {})[e.id] ||= { days: [], tries: 0 }; s.tries++; if (res.ok && !s.days.includes(day())) s.days.push(day()); (c.egHist ||= []).push({ t: Date.now(), id: e.id, ok: res.ok }); c.egHist = c.egHist.slice(-200); });
  if (res.ok) { xp(egMastered(e.id) && !was ? 30 : 10, 'coach'); try { bumpIsland('Capablanca'); } catch (_) { } }
  root.insertAdjacentHTML('afterbegin', ''); q(root, '#eg-q').innerHTML = `${res.ok ? await quoteFor(e.name) : ''}<p class="sub">${egMastered(e.id) ? 'Mastered: two successes on different days.' : res.ok ? 'One success. Do it again on another day to master it.' : 'Try again; the position is the same every time.'}</p>`;
  return { title: e.name, ok: res.ok ? 1 : 0, n: 1, id: e.id };
}
export async function endgamesPage(ctx, root) {
  css(); const E = await data('endgames');
  const draw = () => { const m = E.filter(e => egMastered(e.id)).length; root.innerHTML = `<div class="co-wrap"><p class="sub">Thirty endings every club player should know. You play the side to move against the engine at full strength. <b>Win</b>: checkmate or promote into a won position within the move limit. <b>Draw</b>: hold for 20 moves or reach a drawn ending. A position is <b>mastered</b> with two successes on different days.</p>${bar(m / 30, 'good')}<p class="sub sm">${m} of 30 mastered.</p>
    <div class="co-tiles" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">${E.map(e => { const s = egState(e.id); return `<button class="co-tile" data-e="${e.id}" type="button" style="text-align:left;cursor:pointer;color:inherit;font:inherit"><span class="k">${e.goal === 'win' ? 'Win' : 'Draw'} &middot; level ${e.difficulty}</span><b style="display:block;margin:2px 0">${esc(e.name)}</b><small>${s.days.length >= 2 ? '&#10003; Mastered' : s.days.length + ' of 2 days'}${s.tries ? ', ' + s.tries + ' tries' : ''}</small></button>`; }).join('')}</div><div id="eg-play" class="co-sec"></div></div>`;
    root.querySelectorAll('[data-e]').forEach(b => b.onclick = async () => { const box = q(root, '#eg-play'); box.scrollIntoView({ block: 'start' }); const r = await endgameAct(box, { id: b.dataset.e }); if (r.n) { box.insertAdjacentHTML('beforeend', '<div class="co-row" style="margin-top:10px"><button class="btn" id="eg-back" type="button">Back to the island</button></div>'); q(box, '#eg-back').onclick = draw; } }); };
  draw();
}

/* ---------- Convert the win ---------- */
export async function convertAct(root, { id } = {}) {
  const P = await data('convert_engine'), H = C().convert || {}; let p = P.find(x => x.id === id); if (!p) p = shuffle(P.filter(x => !(H[x.id] && H[x.id].wins)))[0] || shuffle(P)[0];
  const g = new Chess(p.fen); root.innerHTML = `<div class="co-says">${avatar('Carlsen', 'pleased', 'sm')}<p><b>Convert the win.</b> You are ${g.turn() === 'w' ? 'White' : 'Black'} and clearly better (about +${(p.before / 100).toFixed(1)} on the engine's count). The engine defends at full strength. Trade down, keep it simple, finish.</p></div><div id="cv-b"></div>`;
  const run = vsEngine(q(root, '#cv-b'), { fen: p.fen, goal: 'win', cap: 60, resign: true, ms: 300 }); const res = await run.promise; if (res.reason === 'stopped') return { title: 'Convert', ok: 0, n: 0 };
  upd(c => { const s = (c.convert ||= {})[p.id] ||= { wins: 0, tries: 0 }; s.tries++; if (res.ok) s.wins++; (c.cvHist ||= []).push({ t: Date.now(), id: p.id, ok: res.ok }); c.cvHist = c.cvHist.slice(-200); }); if (res.ok) xp(10, 'coach');
  return { title: 'Convert the win', ok: res.ok ? 1 : 0, n: 1, id: p.id };
}
export async function convertPage(ctx, root) {
  css(); const P = await data('convert_engine');
  const draw = () => { const H = C().convert || {}, won = P.filter(p => H[p.id] && H[p.id].wins).length, tried = P.filter(p => H[p.id]).length;
    root.innerHTML = `<div class="co-wrap"><p class="sub">150 positions from your own games where you were winning by 3 pawns or more. Play them out against the engine at full strength. Success is a win: checkmate, or the engine's evaluation collapsing for three moves in a row (it would resign).</p>${bar(won / P.length, 'good')}<p class="sub sm">${won} converted, ${tried - won} still open, ${P.length - tried} untouched.</p><div class="co-row"><button class="btn" id="cv-go" type="button">Play a random position</button></div><div id="cv-play" class="co-sec"></div></div>`;
    q(root, '#cv-go').onclick = async () => { q(root, '#cv-go').disabled = true; const box = q(root, '#cv-play'); const r = await convertAct(box); if (r.n) { box.insertAdjacentHTML('beforeend', `${crewSays(r.ok ? 'Carlsen' : 'Skipper', r.ok ? 'excited' : 'disappointed', r.ok ? 'Converted. That is how you win a won game.' : 'It slipped. Same position next time; look for the simplest winning plan.')}<button class="btn" id="cv-n" type="button">Another</button>`); q(box, '#cv-n').onclick = draw; } else draw(); }; };
  draw();
}
