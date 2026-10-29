// Coach (#coach): hub + Diagnose, Clock habits, Thinking, today's session, weekly challenge. Openings/endgames in coach2.js, numbers in coach3.js.
import { esc, q, C, upd, day, data, css, runSet, reg, stopCoach, eng, verify, errorPool, toUci, sanOf, shuffle, rngOf, hashStr, isoWeek, fmtDay, barsChart, lineChart, bar, empty, crewSays, tagMove, MOTIF, cpStm, getCCT, setCCT, cctAcc, cctChance, isDebug } from './coach-core.js';
import { speak } from './voice.js';
import { openingsPage, endgamesPage, convertPage, endgameAct, openingAct, convertAct } from './coach2.js';
import { proofPage, liveStats, tcLabel } from './coach3.js';
import * as Sync from './sync.js';
import * as Pr from './progress.js';
import { avatar } from './ui.js';
import { play as sfx } from './sound.js';

export { stopCoach };
const xp = (n, why) => { try { Pr.addXp(n, why); } catch (_) { } };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const engErr = '<div class="co-empty"><div><b>The engine room is dark.</b><p>The in-browser engine did not load (offline on first visit, or blocked). Open Coach once with a connection and it will be cached.</p></div></div>';

/* ---------- top leak ---------- */
async function leakTable() {
  const W = await data('weakness'); await Sync.S.ready; const cut = new Date(Date.now() - 90 * 864e5), cm = cut.getFullYear() + '-' + String(cut.getMonth() + 1).padStart(2, '0');
  const r90 = {}; Object.entries(W.by_month).forEach(([m, o]) => { if (m >= cm) Object.entries(o).forEach(([k, n]) => { r90[k] = (r90[k] || 0) + n; }); });
  const live = {}; Sync.S.puzzles.forEach(p => { const m = tagMove(p.fen, p.you_played, p.solution[0]); live[m] = (live[m] || 0) + 1; });
  const rows = Object.keys(MOTIF).map(k => ({ k, all: W.overall[k] || 0, r90: r90[k] || 0, live: live[k] || 0 })).sort((a, b) => b.all - a.all);
  return { rows, W, cm, liveN: Sync.S.puzzles.length };
}
const topLeak = async () => { const t = await leakTable(); const c = t.rows.filter(r => r.k !== 'positional/other' && r.k !== 'back_rank').sort((a, b) => (b.r90 + b.live * 2) - (a.r90 + a.live * 2) || b.all - a.all); return c[0].k; };

/* ---------- activities (shared by pages and the session) ---------- */
export async function leakAct(root, { motif, n = 6 } = {}) {
  const L = await data('leaks'); const ex = (L[motif] ? L[motif].ex : []).map(e => ({ fen: e.fen, uci: toUci(e.fen, e.best), played: e.played, id: 'l' + e.link + e.fen })).filter(e => e.uci);
  const live = Sync.S.puzzles.filter(p => tagMove(p.fen, p.you_played, p.solution[0]) === motif).map(p => ({ fen: p.fen, uci: p.solution[0], played: p.you_played, id: p.id }));
  const cand = [...shuffle(live), ...shuffle(ex)], items = []; let tried = 0, drop = 0, dead = false; const h = reg({ stop() { dead = true; } });
  try {
    for (const c of cand) {
      if (dead || items.length >= n || tried >= 22) break; tried++;
      root.innerHTML = `<div class="co-empty">${avatar('Kasparov', 'thinking', 'lg')}<div><b>Checking positions with the engine</b><p>Tags from the data are heuristic. I only show positions where Stockfish agrees there is one clearly best move. ${items.length} of ${n} ready (${tried} checked).</p></div></div>`;
      let v = null; try { v = await verify(c.fen, c.uci); } catch (e) { root.innerHTML = engErr; return { title: MOTIF[motif][0], ok: 0, n: 0 }; }
      if (v) items.push({ id: c.id, fen: c.fen, sol: [v.uci], san: sanOf(c.fen, v.uci), played: c.played, kind: 'leak', note: MOTIF[motif][1] }); else drop++;
    }
  } finally { }
  if (dead) return { title: MOTIF[motif][0], ok: 0, n: 0 };
  if (items.length < 3) { root.innerHTML = empty('Kasparov', 'neutral', 'Not enough clean examples yet', `The engine rejected ${drop} of ${tried} examples tagged <i>${esc(MOTIF[motif][0])}</i> as unclear. Try another leak, or sync more games.`); return { title: MOTIF[motif][0], ok: 0, n: 0 }; }
  const run = runSet(root, items, { timed: 0, cct: true, ghost: 4 }); const res = await run.promise; const ok = res.filter(r => r.ok).length;
  upd(c => { (c.leakHist ||= []).push({ t: Date.now(), motif, ok, n: res.length }); c.leakHist = c.leakHist.slice(-100); }); xp(ok * 2, 'coach');
  return { title: MOTIF[motif][0], ok, n: res.length, dropped: drop };
}
async function evalAfter(e, fen, u) { const g = new Chess(fen); g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); if (g.in_checkmate()) return -10000; if (g.in_draw() || g.in_stalemate()) return 0; const r = await e.analyse(g.fen(), { depth: 8, timeout: 6000 }); return r.lines.length ? cpStm(r.lines[0]) : 0; }
export async function instinctAct(root, { n = 8 } = {}) {
  const P = await errorPool(Sync); const items = shuffle([...shuffle(P.tactic).slice(0, Math.ceil(n * .6)), ...shuffle(P.convert).slice(0, n), ...shuffle(P.recent).slice(0, 2)]).slice(0, n);
  const run = runSet(root, items, { instinct: true, cct: false }); const res = await run.promise; if (!res.length) return { title: 'First instinct', ok: 0, n: 0 };
  let judged = true; try { const e = await eng(); for (const r of res) { if (r.firstBest) { r.good = true; continue; } if (!r.first) { r.good = false; continue; } const a = await evalAfter(e, r.fen, r.first), b = await evalAfter(e, r.fen, r.best); r.good = a - b <= 60; } } catch (_) { judged = false; res.forEach(r => { r.good = !!r.firstBest; }); }
  const good = res.filter(r => r.good).length, best = res.filter(r => r.firstBest).length, fin = res.filter(r => r.ok).length, changed = res.filter(r => r.changed).length, improved = res.filter(r => r.changed && r.ok && !r.firstBest).length, worse = res.filter(r => r.changed && r.firstBest && !r.ok).length;
  upd(c => { (c.instinct ||= []).push({ t: Date.now(), n: res.length, best, good, final: fin, changed, improved, worse, judged }); c.instinct = c.instinct.slice(-60); }); xp(good * 2, 'coach');
  return { title: 'First instinct', ok: good, n: res.length, best, fin, changed, improved, worse };
}
export async function threatAct(root, { n = 5 } = {}) {
  const P = await errorPool(null), pool = shuffle(P.bundled), items = []; let dead = false, tried = 0; const h = reg({ stop() { dead = true; } });
  let e; try { e = await eng(); } catch (_) { root.innerHTML = engErr; return { title: "What's the threat?", ok: 0, n: 0 }; }
  for (const p of pool) {
    if (dead || items.length >= n || tried++ > 26) break; const g = new Chess(p.fen); if (g.in_check()) continue;
    const f2 = p.fen.replace(/ [wb] /, g.turn() === 'w' ? ' b ' : ' w ').replace(/ [a-h][36] /, ' - '); let g2; try { g2 = new Chess(f2); if (!g2.moves().length) continue; } catch (_) { continue; }
    root.innerHTML = `<div class="co-empty">${avatar('Tal', 'thinking', 'lg')}<div><b>Finding real threats</b><p>Asking the engine what the other side would do with an extra move. ${items.length} of ${n}.</p></div></div>`;
    const r = await e.analyse(f2, { depth: 10, multipv: 2, timeout: 9000 }); if (!r.lines.length) continue; const a = r.lines[0], b = r.lines[1];
    if (cpStm(a) < 150 || (b && cpStm(a) - cpStm(b) < 100)) continue; items.push({ id: 'th' + p.id, fen: f2, sol: [a.pv[0]], san: sanOf(f2, a.pv[0]), kind: 'threat', note: 'This was the threat. Spotting it first is half of defending.' });
  }
  if (dead) return { title: "What's the threat?", ok: 0, n: 0 };
  if (items.length < 2) { root.innerHTML = empty('Tal', 'neutral', 'No clear threats found', 'The engine could not find positions with one obvious threat this time. Try again.'); return { title: "What's the threat?", ok: 0, n: 0 }; }
  const run = runSet(root, items, { timed: 0, prompt: (side) => `<b>The ${side === 'White' ? 'White' : 'Black'} pieces are about to move in this picture, but it is really <u>your</u> turn.</b> What is ${side} threatening? Play the move ${side} would play next if you did nothing.` }); const res = await run.promise; const ok = res.filter(r => r.ok).length;
  upd(c => { (c.threat ||= []).push({ t: Date.now(), ok, n: res.length }); c.threat = c.threat.slice(-60); }); xp(ok * 2, 'coach'); return { title: "What's the threat?", ok, n: res.length };
}
const BL = [[0, ''], [1, 'Level 1: a few pieces, 3 seconds'], [2, 'Level 2: middle positions, 3 seconds'], [3, 'Level 3: 2 seconds'], [4, 'Level 4: 1 second']];
const blLevel = () => (C().blind || {}).level || 1;
export async function blindAct(root, { n = 5, level = blLevel() } = {}) {
  const P = await errorPool(null), cnt = f => f.split(' ')[0].replace(/[^a-zA-Z]/g, '').length, lim = level === 1 ? 8 : level === 2 ? 16 : 32;
  const items = shuffle(P.bundled.filter(p => cnt(p.fen) <= lim && (level === 1 ? cnt(p.fen) >= 3 : true))).slice(0, n).map(p => ({ ...p, kind: 'blind' }));
  if (items.length < 2) { root.innerHTML = empty('Capablanca', 'neutral', 'No positions', 'Nothing to show.'); return { title: 'Blindfold', ok: 0, n: 0 }; }
  const run = runSet(root, items, { timed: 0, vanish: [0, 3000, 3000, 2000, 1000][level] }); const res = await run.promise; const ok = res.filter(r => r.ok).length;
  upd(c => { const b = c.blind ||= { level: 1, hist: [] }; b.hist.push({ t: Date.now(), level, ok, n: res.length }); b.hist = b.hist.slice(-40); if (res.length >= 4 && ok >= res.length - 1 && level === b.level && b.level < 4) b.level++; }); xp(ok * 2, 'coach'); return { title: 'Blindfold level ' + level, ok, n: res.length };
}

/* ---------- pages ---------- */
function actUI(box, act, again) { // after an activity: crew line + again
  return async () => { const r = await act(); if (!box.isConnected) return; const ra = q(box, '#r-a'); if (ra) ra.remove(); if (r.n) { const g = r.ok / r.n; box.insertAdjacentHTML('beforeend', `<div class="co-sec">${crewSays(g >= .7 ? 'Skipper' : 'Capablanca', g >= .7 ? 'excited' : 'pleased', `${r.ok} of ${r.n}${r.changed != null ? `. You changed your mind ${r.changed} time${r.changed === 1 ? '' : 's'}: it helped ${r.improved}, hurt ${r.worse}.` : '.'}`)}<button class="btn" id="co-again" type="button">Go again</button></div>`); q(box, '#co-again').onclick = again; } };
}
async function checkupPage(ctx, B) {
  const ck = C().checkups || [], last = ck[ck.length - 1], dbg = isDebug(), N = dbg ? 4 : 20;
  B.innerHTML = `<p class="sub">Twenty positions from your own errors and puzzles. First <b>untimed</b>, no answers shown. Then the <b>same twenty, shuffled, at 8 seconds each</b>. The gap between the two scores is the gap between what you know and what you can do on the clock.${dbg ? ' <b>(debug: 4 positions)</b>' : ''}</p>
   ${last ? `<div class="co-tiles"><div class="co-tile"><span class="k">Last check-up, ${fmtDay(last.t)}</span><div class="big">${Math.round(last.gap)} pts</div><small>${pct(last.untimed.ok, last.untimed.n)}% untimed, ${pct(last.timed.ok, last.timed.n)}% timed</small></div></div>` : ''}
   ${ck.length >= 2 ? `<h3 class="mt2">Gap history</h3>${lineChart(ck.slice(-8).map(k => ({ x: fmtDay(k.t), y: k.gap })), { min: 0, fmt: v => Math.round(v) })}` : ck.length === 1 ? empty('Skipper', 'pleased', 'One check-up on file', 'Do it again next week and the trend line appears.') : ''}
   <div class="co-row mt2"><button class="btn" id="ck-go" type="button">${last ? 'Take this week\'s check-up' : 'Start the check-up'}</button></div><div id="ck-run" class="co-sec"></div>`;
  q(B, '#ck-go').onclick = async () => {
    q(B, '#ck-go').style.display = 'none'; const R = q(B, '#ck-run'); const P = await errorPool(Sync); const rec = shuffle(P.recent).slice(0, Math.floor(N / 5)), rest = N - rec.length;
    const items = shuffle([...shuffle(P.convert).slice(0, Math.ceil(rest / 2)), ...shuffle(P.tactic).slice(0, Math.floor(rest / 2)), ...rec]).slice(0, N);
    R.innerHTML = `<h3>Part 1 of 2: untimed</h3><div id="ck-a"></div>`; const r1 = await runSet(q(R, '#ck-a'), items, { timed: 0, silent: true }).promise; if (!R.isConnected || r1.length < items.length) return;
    R.innerHTML = `<h3>Part 2 of 2: the same ${N}, shuffled, 8 seconds each</h3><div id="ck-b"></div>`; const r2 = await runSet(q(R, '#ck-b'), shuffle(items), { timed: 8, silent: true }).promise; if (!R.isConnected || r2.length < items.length) return;
    const A = { ok: r1.filter(r => r.ok).length, n: r1.length, avg: r1.reduce((a, r) => a + r.secs, 0) / r1.length }, T = { ok: r2.filter(r => r.ok).length, n: r2.length, avg: r2.reduce((a, r) => a + r.secs, 0) / r2.length }, gap = 100 * (A.ok / A.n - T.ok / T.n);
    upd(c => { (c.checkups ||= []).push({ t: Date.now(), untimed: A, timed: T, gap }); c.checkups = c.checkups.slice(-30); }); xp(25, 'coach');
    const byId = new Map(r2.map(r => [r.id + r.fen, r])), knew = r1.filter(r => r.ok && !(byId.get(r.id + r.fen) || {}).ok).slice(0, 5);
    const who = gap >= 20 ? 'Tempo' : A.ok / A.n < .5 ? 'Capablanca' : 'Skipper', say = gap >= 20 ? `You found ${pct(A.ok, A.n)}% with time and only ${pct(T.ok, T.n)}% on the clock. You know more than you show. That is a speed problem, not a knowledge problem: First instinct and the move budget are your tools.` : gap > 8 ? `A modest gap of ${Math.round(gap)} points. The clock costs you a little. Keep the 3 / 6 / 15 second rule.` : A.ok / A.n < .5 ? `Even untimed you found ${pct(A.ok, A.n)}%. The gap is small because the knowledge is the limit. Work the weakness map.` : `Almost no gap. Your speed matches your knowledge. Good sign.`;
    R.innerHTML = `<h2>Result</h2>${barsChart([{ label: 'Untimed', v: 100 * A.ok / A.n }, { label: 'Timed (8s)', v: 100 * T.ok / T.n, cls: 'alt' }], { h: 140 })}<div class="co-tiles"><div class="co-tile"><span class="k">Knowing vs speed gap</span><div class="big">${Math.round(gap)} pts</div><small>${A.ok}/${A.n} untimed, ${T.ok}/${T.n} timed. Average ${A.avg.toFixed(1)}s untimed, ${T.avg.toFixed(1)}s timed.</small></div></div>${crewSays(who, gap >= 20 ? 'excited' : 'pleased', say)}
     ${knew.length ? `<h3 class="mt2">Found untimed, missed on the clock</h3><ul class="sub">${knew.map(r => `<li>Best was <b>${esc(r.bestSan)}</b></li>`).join('')}</ul>` : ''}<button class="btn" id="ck-done" type="button">Done</button>`; q(R, '#ck-done').onclick = () => { location.hash = '#coach'; };
  };
}
async function leaksPage(ctx, B, motif) {
  if (motif) { B.innerHTML = '<div id="lk-run"></div>'; const R = q(B, '#lk-run'), go = actUI(R, () => leakAct(R, { motif }), () => leaksPage(ctx, B, motif)); return go(); }
  const t = await leakTable(), max = Math.max(...t.rows.map(r => r.all), 1);
  B.innerHTML = `<p class="sub">From ${t.W.total_records.toLocaleString()} of your analysed errors across ${new Set(Object.keys(t.W.by_month)).size} months with games. Tags come from simple rules and are <b>heuristic and noisy</b>: <i>hanging pieces</i> especially is inflated. Every drill position is re-checked by the engine before you see it.</p>
   <div class="co-row sub sm"><span>Bar: all-time. Gold mark: since ${t.cm} (about 90 days). Live: errors found in your synced games (${t.liveN} analysed).</span></div>
   ${t.rows.map(r => `<div class="co-leak"><span class="nm">${esc(MOTIF[r.k][0])} <span class="sub sm">${r.all.toLocaleString()} all-time &middot; ${r.r90} in 90 days &middot; ${r.live} live</span></span>${r.k === 'positional/other' ? '<span class="sub sm">not drillable</span>' : `<a class="btn sm" href="#coach/leaks/${encodeURIComponent(r.k)}">Drill</a>`}<div style="grid-column:1/-1;position:relative">${bar(r.all / max)}${r.r90 ? `<i style="position:absolute;top:-3px;bottom:-3px;width:3px;background:#C9A24B;left:${Math.min(98, r.r90 / Math.max(1, r.all) * 100)}%;border-radius:2px" aria-hidden="true"></i>` : ''}</div><p>${esc(MOTIF[r.k][1])}</p></div>`).join('')}
   ${t.liveN < 5 ? empty('Skipper', 'pleased', 'Live tags are still thin', 'Sync chess.com in Settings and let the engine look over your latest games. New errors will be tagged here as they arrive.') : ''}`;
}
async function instinctPage(ctx, B) {
  const H = C().instinct || [];
  B.innerHTML = `<p class="sub">You have <b>3 seconds</b> to pick a move. Then you get unlimited time to verify: check, capture, threat. Change it or keep it. The point is to learn how often your first instinct is already good, so you can trust it when the clock is short.</p>
   <h3 class="mt2">Instinct accuracy</h3>${H.length >= 3 ? lineChart(H.slice(-10).map(h => ({ x: fmtDay(h.t), y: 100 * h.good / h.n })), { unit: '%', min: 0, max: 100 }) + `<p class="sub sm">Share of first picks that were the best move or within 0.6 pawns of it. Across ${H.length} sessions you changed your mind ${H.reduce((a, h) => a + h.changed, 0)} times: ${H.reduce((a, h) => a + h.improved, 0)} helped, ${H.reduce((a, h) => a + h.worse, 0)} hurt.</p>` : empty('Skipper', 'pleased', 'Not enough data yet', `The trend needs 3 sessions; you have ${H.length}. Each is about 8 positions and 3 minutes.`)}
   <div class="co-row mt2"><button class="btn" id="in-go" type="button">Start (8 positions)</button></div><div id="in-run" class="co-sec"></div>`;
  q(B, '#in-go').onclick = () => { q(B, '#in-go').style.display = 'none'; const R = q(B, '#in-run'); actUI(R, () => instinctAct(R), () => instinctPage(ctx, B))(); };
}
async function clockPage(ctx, B) {
  const L = liveStats(); const M = await data('baselines');
  const rows = L.clocks.slice().sort((a, b) => b.t - a.t).slice(0, 10), tot = rows.reduce((a, r) => a + r.over, 0), hard = rows.reduce((a, r) => a + r.hard, 0);
  const spark = r => { const w = 200, h = 30, n = Math.min(r.rows.length, 40), bw = w / n; return `<svg viewBox="0 0 ${w} ${h}" width="200" height="30" role="img" aria-label="Seconds per move for each of your moves, red where over budget">${r.rows.slice(0, n).map((m, k) => { const hh = Math.min(h, m.s / 20 * h), over = m.s > (m.n <= 10 ? 3 : 6); return `<rect x="${(k * bw).toFixed(1)}" y="${(h - hh).toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${Math.max(1, hh).toFixed(1)}" fill="${m.s > 15 ? '#e0584a' : over ? '#C9A24B' : '#5aa7d6'}"/>`; }).join('')}</svg>`; };
  B.innerHTML = `<div class="co-tiles"><div class="co-tile"><span class="k">Opening</span><div class="big">3s</div><small>Moves 1 to 10. Your median is 3.1s: good. Play the pattern.</small></div><div class="co-tile"><span class="k">Middlegame</span><div class="big">6s</div><small>Moves 11 to 30, at most 6s. Your median for moves 11 to 20 is ${M.sec1120}s and your mean is 10.6s: the long thinks are the problem.</small></div><div class="co-tile"><span class="k">Never</span><div class="big">15s</div><small>No move over 15 seconds on a blitz clock. After a long think your error rate is 14.6%, against 10.4% after a normal one.</small></div></div>
   <h3 class="mt2">Slow games</h3><p class="sub">${L.games ? `<b>${L.slow} of 3</b> games at 10 minutes or longer in the last 7 days${L.slowTC.length ? ' (' + [...new Set(L.slowTC)].join(', ') + ')' : ''}.` : 'No synced games yet.'} Your record at 10 minutes is ${M.tc_score['10+0'].pct}% over ${M.tc_score['10+0'].n} games, against ${M.tc_score['3+2'].pct}% at 3+2 over ${M.tc_score['3+2'].n}.</p>${bar(Math.min(1, L.slow / 3), L.slow >= 3 ? 'good' : '')}
   <h3 class="mt2">Post-game clock profile</h3>${rows.length ? `<p class="sub">Your latest synced games. Bars are seconds per move (up to 20s): blue within budget, gold over the 3 / 6 second line, red over 15s. <b>${tot}</b> budget breaks in these ${rows.length} games, <b>${hard}</b> of them over 15s.</p>${rows.map(r => `<div class="co-leak" style="grid-template-columns:1fr auto"><span class="nm">${esc(r.opp || 'opponent')} <span class="sub sm">${fmtDay(r.t * 1000)} &middot; ${tcLabel(r.tc)} &middot; ${esc(r.res)}</span></span><span class="sub sm">${r.over} breaks, ${r.hard} over 15s</span><div style="grid-column:1/-1">${spark(r)}</div></div>`).join('')}` : empty('Tempo', 'neutral', 'No clocks to read yet', 'Sync your chess.com games (Settings > Chess.com sync). Only games with clock times can be profiled. The bundled history is summarised above.')}`;
}
function thinkingPage(ctx, B) {
  const T = C().threat || [], bl = C().blind || { level: 1, hist: [] }, acc = cctAcc();
  B.innerHTML = `<div class="co-sec" style="margin-top:0"><h2>Blunder check (CCT)</h2><p class="sub">Before each move in the Drills, the board flashes a one-second prompt: how many <b>checks</b>, <b>captures</b> and <b>threats</b> there are. It fades out as your accuracy improves: ${acc == null ? 'it always shows until 10 drill results are logged' : `your recent accuracy is ${Math.round(acc * 100)}%, so it shows about ${Math.round(cctChance() * 100)}% of the time`}.</p><div class="seg"><button data-cct="1" class="${getCCT() ? 'on' : ''}" type="button">CCT on</button><button data-cct="0" class="${getCCT() ? '' : 'on'}" type="button">CCT off</button></div></div>
   <div class="co-sec"><h2>What's the threat?</h2><p class="sub">The engine finds the move the other side would play if you passed. Find it first. ${T.length ? `Last session: ${T[T.length - 1].ok} of ${T[T.length - 1].n}.` : ''}</p><button class="btn" id="th-go" type="button">Start (5 positions)</button><div id="th-run" class="co-sec"></div></div>
   <div class="co-sec"><h2>Blindfold</h2><p class="sub">Study the position. The pieces vanish. Play the best move from memory. ${esc(BL[bl.level][1])}. Score 4 of 5 to climb a level (${bl.level} of 4).</p><button class="btn" id="bl-go" type="button">Start level ${bl.level}</button><div id="bl-run" class="co-sec"></div></div>`;
  B.querySelectorAll('[data-cct]').forEach(b => b.onclick = () => { setCCT(b.dataset.cct === '1'); thinkingPage(ctx, B); });
  q(B, '#th-go').onclick = () => { q(B, '#th-go').style.display = 'none'; const R = q(B, '#th-run'); actUI(R, () => threatAct(R), () => thinkingPage(ctx, B))(); };
  q(B, '#bl-go').onclick = () => { q(B, '#bl-go').style.display = 'none'; const R = q(B, '#bl-run'); actUI(R, () => blindAct(R), () => thinkingPage(ctx, B))(); };
}

/* ---------- today's session ---------- */
export async function sessionSteps({ watch = false } = {}) {
  const top = await topLeak(), due = Object.values((C().openings || {}).box || {}).filter(b => b.due <= Date.now()).length, lbl = MOTIF[top][0], dbg = isDebug();
  const W = { k: 'First instinct', mins: watch ? 2 : 3, who: 'Kasparov', why: 'Three seconds to pick, then time to verify: it is the habit that stops rushed blunders.', run: r => instinctAct(r, { n: dbg ? 2 : watch ? 5 : 6 }) };
  const L = { k: 'Your leak: ' + lbl.toLowerCase(), mins: 3, who: 'Tal', why: `${lbl} is the mistake that costs you most in your recent games, so we drill exactly that.`, motif: top, run: r => leakAct(r, { motif: top, n: dbg ? 3 : 5 }) };
  const V = { k: 'Finish the win', mins: 2, who: 'Carlsen', why: 'These are positions you were winning and let slip; decide fast and decide right.', win: true, run: async r => { const P = await errorPool(null); const items = shuffle(P.convert).slice(0, dbg ? 3 : 5); const res = await runSet(r, items, { timed: 0, cct: true, ghost: 4 }).promise; const ok = res.filter(x => x.ok).length; return { title: 'Finish the win', ok, n: res.length }; } };
  const E = { k: 'Endgame practice', mins: watch ? 3 : 4, who: 'Capablanca', why: 'Endgames are where a calm technique turns a small edge into a full point.', run: r => endgameAct(r) };
  if (watch) return { steps: [W, L, V, E], top, lbl };
  return { top, lbl, steps: [W, L, E,
    { k: "What's the threat?", mins: 2, who: 'Leela', why: 'Ask what the opponent threatens before you move.', run: r => threatAct(r, { n: dbg ? 2 : 4 }) },
    due ? { k: 'Opening trainer', mins: 2, who: 'Morphy', why: 'Your own opening errors, on a spaced schedule.', run: r => openingAct(r, { n: dbg ? 2 : 5 }) } : { k: 'Blindfold', mins: 2, who: 'Leela', why: 'See the board without the pieces.', run: r => blindAct(r, { n: dbg ? 2 : 3 }) }] };
}
async function sessionPage(ctx, B) {
  const { steps } = await sessionSteps();
  const tot = steps.reduce((a, s) => a + s.mins, 0), done = (C().sessions || []).some(s => s.day === day());
  B.innerHTML = `<p class="sub">About ${tot} minutes, built from your weak spots. Works offline once the engine has loaded once. ${done ? 'You already finished a session today; this is a bonus round.' : ''}</p><ol class="sub">${steps.map(s => `<li><b>${esc(s.k)}</b>, about ${s.mins} min</li>`).join('')}</ol><button class="btn" id="ss-go" type="button">Start the session</button><div id="ss" class="co-sec"></div>`;
  q(B, '#ss-go').onclick = async () => {
    q(B, '#ss-go').style.display = 'none'; const S = q(B, '#ss'), out = []; let skipped = false;
    for (let i = 0; i < steps.length; i++) {
      if (!S.isConnected) return; const st = steps[i];
      S.innerHTML = `<div class="co-hud"><span>Step ${i + 1} of ${steps.length}</span><span style="flex:1;text-transform:none;letter-spacing:0">${esc(st.k)}, about ${st.mins} min</span><button class="btn ghost sm" id="ss-skip" type="button">Skip step</button></div>${bar(i / steps.length)}<div id="ss-b" class="co-sec" style="margin-top:8px"></div>`;
      const body = q(S, '#ss-b'); q(S, '#ss-skip').onclick = () => { skipped = true; stopCoach(); }; skipped = false;
      let r; try { r = await st.run(body); } catch (e) { r = { n: 0, ok: 0 }; } if (!S.isConnected) return;
      out.push({ k: st.k, ok: r.ok || 0, n: r.n || 0, skipped }); if (!skipped && r.n) { await new Promise(res => { body.insertAdjacentHTML('beforeend', '<div class="co-row" style="margin-top:12px"><button class="btn" id="ss-next" type="button">Next step</button></div>'); q(body, '#ss-next').onclick = res; }); }
    }
    const ok = out.reduce((a, s) => a + s.ok, 0), n = out.reduce((a, s) => a + s.n, 0); upd(c => { (c.sessions ||= []).push({ t: Date.now(), day: day(), ok, n }); c.sessions = c.sessions.slice(-120); }); xp(40, 'coach session'); sfx('success'); speak('Skipper', `${ok} of ${n} across ${out.filter(s => s.n).length} steps. Well sailed, Gerald.`, 'result');
    S.innerHTML = `<h2>Session complete</h2>${crewSays('Skipper', 'excited', `${ok} of ${n} across ${out.filter(s => s.n).length} steps. Well sailed, Gerald. See you tomorrow.`)}<ul class="sub">${out.map(s => `<li>${esc(s.k)}: ${s.n ? `${s.ok}/${s.n}` : s.skipped ? 'skipped' : 'no data'}</li>`).join('')}</ul><a class="btn" href="#coach">Back to Coach</a>`;
  };
}

/* ---------- weekly challenge: Skipper vs Tempo ---------- */
const TALK = { win: ['Fine. Enjoy it. I was warming up.', 'You got lucky. I do not lose twice.', 'That score will not survive next week.'], lose: ['Is that all? I played that half asleep.', 'Gerald, Gerald. The clock is not your friend.', 'You had the answers. You just did not trust them.'], tie: ['A tie. I will break it next week.', 'Equal scores. Neither of us blinks.'], wait: ['Show me a score and I will beat it.', 'I am not worried. Not even a little.'] };
async function challengePage(ctx, B) {
  const wk = isoWeek(), c = C(), W = (c.challenge || {})[wk] || {}, who = c.who || 'gerald';
  const P = await errorPool(null), pool = [...P.convert, ...P.tactic].sort((a, b) => a.id < b.id ? -1 : 1), r = rngOf(hashStr(wk)), items = shuffle(pool, r).slice(0, 10);
  const g = W.gerald, t = W.tempo, line = a => a[Math.floor(Math.random() * a.length)];
  const talk = g && t ? line(g.score > t.score ? TALK.win : g.score < t.score ? TALK.lose : TALK.tie) : line(TALK.wait);
  B.innerHTML = `<p class="sub">Week ${wk}. The same ten positions for everyone this week, 12 seconds a move. Gerald and Tempo play on their own devices; scores are stored on the device that played.</p>
   <div class="co-tiles"><div class="co-tile"><span class="k">Skipper (Gerald)</span><div class="big">${g ? g.score + '/10' : '-'}</div><small>${g ? 'Played ' + fmtDay(g.t) : "Gerald's score: set when Gerald plays."}</small></div><div class="co-tile"><span class="k">Tempo</span><div class="big">${t ? t.score + '/10' : '-'}</div><small>${t ? 'Played ' + fmtDay(t.t) : "Tempo's score: set when Tempo plays."}</small></div></div>
   <div class="co-says">${avatar('Tempo', 'excited', 'sm')}<p><b>Tempo:</b> ${esc(talk)}</p></div>
   <div class="co-row"><span class="sub sm">Playing as</span><div class="seg"><button data-w="gerald" class="${who === 'gerald' ? 'on' : ''}" type="button">Gerald</button><button data-w="tempo" class="${who === 'tempo' ? 'on' : ''}" type="button">Tempo</button></div><button class="btn" id="ch-go" type="button">${(who === 'gerald' ? g : t) ? 'Play again (keeps the better score)' : 'Play the ten'}</button></div><div id="ch-run" class="co-sec"></div>`;
  B.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { upd(x => { x.who = b.dataset.w; }); challengePage(ctx, B); });
  q(B, '#ch-go').onclick = async () => {
    q(B, '#ch-go').style.display = 'none'; const R = q(B, '#ch-run'); const res = await runSet(R, items, { timed: 12 }).promise; if (!R.isConnected || res.length < items.length) return; const score = res.filter(x => x.ok).length, secs = res.reduce((a, x) => a + x.secs, 0);
    upd(x => { const w = ((x.challenge ||= {})[wk] ||= {}); const cur = w[who]; if (!cur || score > cur.score) w[who] = { score, secs, t: Date.now() }; }); xp(who === 'gerald' ? score * 2 : 0, 'coach'); challengePage(ctx, B);
  };
}

/* ---------- hub + router ---------- */
export async function coachScreen(ctx) {
  css(); stopCoach(); await Sync.S.ready; const { render, topbar } = ctx, parts = location.hash.slice(1).split('/'), sub = parts[1] || '', arg = decodeURIComponent(parts[2] || '');
  const T = { checkup: ['Diagnose', 'Weekly check-up', checkupPage], leaks: ['Diagnose', 'Weakness map', (c, B) => leaksPage(c, B, arg)], instinct: ['Clock habits', 'First instinct', instinctPage], clock: ['Clock habits', 'Move budget', clockPage], openings: ['Openings', 'Repertoire and trainer', (c, B) => openingsPage(c, B, arg)], endgames: ['Capablanca\'s island', 'Endgames', endgamesPage], convert: ['Carlsen\'s school', 'Convert the win', convertPage], thinking: ['Thinking', 'Thinking drills', thinkingPage], proof: ['Proof', 'Your real numbers', proofPage], session: ['Motivation', "Today's session", sessionPage], challenge: ['Motivation', 'Skipper vs Tempo', challengePage] };
  if (T[sub]) { const [k, title, fn] = T[sub]; render(`${topbar}<a class="back" href="#coach">&larr; Coach</a><span class="k">${esc(k)}</span><h1>${esc(title)}</h1><div class="co-wrap co-sec" id="co-body" style="margin-top:12px"></div>`); try { await fn(ctx, q(document, '#co-body')); } catch (e) { console.warn('coach page', e); q(document, '#co-body').innerHTML = empty('Skipper', 'worried', 'Something went wrong', esc(String(e && e.message || e))); } return; }
  const c = C(), L = liveStats(), ck = c.checkups || [], lastCk = ck[ck.length - 1], ins = c.instinct || [], eg = c.endgames || {}, mast = Object.values(eg).filter(e => e.days.length >= 2).length, wk = (c.challenge || {})[isoWeek()] || {}, done = (c.sessions || []).some(s => s.day === day());
  const tile = (href, k, h, p) => `<a class="card link" href="#coach/${href}"><span class="k">${k}</span><h3>${h}</h3><p>${p}</p></a>`;
  render(`${topbar}<span class="k">Training that fixes what the numbers show</span><h1>Coach</h1><p class="sub mt1">Every figure here comes from your real games. Where there is not enough data yet, it says so.</p>
   <div class="co-hub"><a class="card link" href="#coach/session" style="grid-column:1/-1"><span class="k">Motivation</span><h3>${done ? 'Session done. Another round?' : "Today's session"}</h3><p>10 to 15 minutes built from your weakest areas. Works offline. ${L.games ? `Slow games this week: ${L.slow} of 3.` : ''}</p></a>
   ${tile('challenge', 'Weekly', 'Skipper vs Tempo', wk.gerald ? `Your score: ${wk.gerald.score}/10. ${wk.tempo ? 'Tempo: ' + wk.tempo.score + '/10.' : "Tempo's score: set when Tempo plays."}` : 'Ten shared positions this week. Beat the creator.')}
   ${tile('checkup', 'Diagnose', 'Weekly check-up', lastCk ? `Last gap: ${Math.round(lastCk.gap)} points (${pct(lastCk.untimed.ok, lastCk.untimed.n)}% untimed, ${pct(lastCk.timed.ok, lastCk.timed.n)}% timed).` : 'Twenty positions, untimed then timed. See the gap between knowing and doing.')}
   ${tile('leaks', 'Diagnose', 'Weakness map', 'Your top leaks, all-time and the last 90 days, each with an engine-checked drill.')}
   ${tile('instinct', 'Clock habits', 'First instinct', ins.length ? `Last session: ${ins[ins.length - 1].good} of ${ins[ins.length - 1].n} good first picks.` : '3 seconds to pick, then time to verify.')}
   ${tile('clock', 'Clock habits', 'Move budget', 'The 3 / 6 / 15 second rule, budget breaks per game, and the slow-game counter.')}
   ${tile('openings', 'Openings', 'Repertoire and trainer', 'London and Chigorin as White, Caro-Kann and Slav as Black, your own opening errors on a spaced schedule, masters played through.')}
   ${tile('endgames', 'Capablanca\'s island', 'Endgames', `${mast} of 30 mastered. Play them against the engine.`)}
   ${tile('convert', 'Carlsen\'s school', 'Convert the win', '150 won positions from your games. Win them against full-strength Stockfish.')}
   ${tile('thinking', 'Thinking', 'Threats, CCT, blindfold', "What's the threat? A blunder-check prompt in drills, and blindfold levels.")}
   ${tile('proof', 'Proof', 'Your real numbers', 'Rating, time losses, errors when winning, seconds per move, goals and the monthly crew report.')}</div>`);
}
