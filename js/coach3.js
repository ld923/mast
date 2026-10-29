// Coach part 3: real numbers (proof dashboard), goals, monthly crew report, live stats from synced games, hooks (same-mistake alerts, return nudge, briefing card).
import { esc, q, C, upd, data, css, bar, barsChart, lineChart, empty, crewSays, tagMove, MOTIF, isoWeek, fmtDay } from './coach-core.js';
import { parsePGNs } from './review.js';
import * as Sync from './sync.js';
import * as Pr from './progress.js';
import { gradeOf, saveLog } from './captain.js';
import { toast } from './prog-ui.js';
import { avatar } from './ui.js';

const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const tcParse = h => { const m = /^(\d+)(?:\+(\d+))?/.exec(h || ''); return m ? { base: +m[1], inc: +(m[2] || 0) } : { base: 0, inc: 0 }; };
export const tcLabel = t => t.base >= 60 ? (t.base / 60) + (t.inc ? '+' + t.inc : ' min') : t.base + 's';
const LOSS = r => ['checkmated', 'timeout', 'resigned', 'abandoned', 'lose'].includes(r);

/* per-game clock profile from a synced game: spent seconds for his moves, and budget breaks against the 3 / 6 / 15 rule */
const gcache = new Map();
export function gameClock(rec) {
  if (gcache.has(rec.link)) return gcache.get(rec.link);
  let out = null;
  try {
    const p = parsePGNs(rec.pgn)[0]; if (p && p.clk && p.clk.length >= 6) {
      const tc = tcParse(p.h.TimeControl), mineC = rec.white ? 0 : 1, rows = [];
      p.clk.forEach((c, i) => { if (i % 2 !== mineC) return; const pc = p.clk[i - 2]; const sp = pc != null ? Math.max(0, pc - c + tc.inc) : Math.max(0, tc.base - c); rows.push({ n: Math.floor(i / 2) + 1, s: sp }); });
      const b = r => r.n <= 10 ? 3 : 6, over = rows.filter(r => r.s > b(r)).length, hard = rows.filter(r => r.s > 15).length, mid = rows.filter(r => r.n >= 11 && r.n <= 20).map(r => r.s);
      out = { link: rec.link, t: rec.t, tc, res: rec.res, rows, over, hard, mid, moves: rows.length, white: rec.white, opp: rec.white ? p.h.Black : p.h.White };
    }
  } catch (_) { }
  gcache.set(rec.link, out); return out;
}
export function liveStats() {
  const G = Sync.S.games, clocks = G.map(gameClock).filter(Boolean), losses = G.filter(g => LOSS(g.res)), tl = losses.filter(g => g.res === 'timeout');
  const P = Sync.S.puzzles, win = P.filter(p => (p.eval || 0) >= 200);
  const mid = clocks.flatMap(c => c.mid), wk = Date.now() / 1000 - 7 * 86400;
  const slow = G.filter(g => g.t >= wk && tcParse((/\[TimeControl "([^"]+)"/.exec(g.pgn) || [])[1]).base >= 600);
  return { games: G.length, lossN: losses.length, timeLoss: losses.length >= 8 ? Math.round(100 * tl.length / losses.length) : null, blunderWin: P.length >= 6 ? Math.round(100 * win.length / P.length) : null, puzN: P.length, mid: mid.length >= 40 ? med(mid) : null, midN: mid.length, clocks, slow: slow.length, slowTC: slow.map(g => tcLabel(tcParse((/\[TimeControl "([^"]+)"/.exec(g.pgn) || [])[1]))) };
}
export async function recordRating() {
  await Sync.S.ready; const r = Sync.rating(); if (!r || !r.blitz) return;
  upd(c => { const a = c.rating || (c.rating = []), last = a[a.length - 1], t = r.t || Date.now(); if (!last || last.v !== r.blitz || t - last.t > 864e5) { a.push({ t, v: r.blitz }); if (a.length > 160) a.shift(); } });
}

/* ---------- goals ---------- */
const METRICS = {
  timeloss: { n: 'Losses on time', unit: '%', low: true, base: b => b.timeloss_pct, cur: L => L.timeLoss },
  blunderwin: { n: 'Errors from winning positions', unit: '%', low: true, base: b => b.blunderwin_pct, cur: L => L.blunderWin },
  sec1120: { n: 'Seconds per move, moves 11 to 20', unit: 's', low: true, base: b => b.sec1120, cur: L => L.mid },
  blitz: { n: 'Blitz rating', unit: '', low: false, base: () => null, cur: () => { const r = Sync.rating(); return r ? r.blitz : null; } }
};
export function goalProgress(g, L, B) {
  const m = METRICS[g.metric], cur = m.cur(L) ?? null, start = g.start ?? m.base(B) ?? cur, daysLeft = Math.ceil((new Date(g.by + 'T23:59:59') - Date.now()) / 864e5);
  let frac = null; if (cur != null && start != null && start !== g.target) frac = Math.max(0, Math.min(1, (m.low ? start - cur : cur - start) / (m.low ? start - g.target : g.target - start)));
  const done = cur != null && (m.low ? cur <= g.target : cur >= g.target);
  return { m, cur, start, frac, daysLeft, done };
}
const skipperLine = (g, p) => p.done ? 'Target reached. Set a harder one, Gerald.' : p.cur == null ? 'No live number yet. Sync some games and I will start counting.' : p.daysLeft < 0 ? 'Deadline passed. No shame: reset it and go again.' : p.frac >= .6 ? `Good pace. ${p.daysLeft} days left, keep the lamp lit.` : p.frac >= .25 ? `Moving. ${p.daysLeft} days left, a bit more every day.` : `Barely moved yet, ${p.daysLeft} days to go. Do tonight's session and we will see.`;

/* ---------- Proof dashboard ---------- */
export async function proofPage(ctx, root) {
  css(); await Sync.S.ready; await recordRating();
  const B = await data('baselines'), L = liveStats(), c = C(), asof = B.asof, bl = `Baseline ${asof}`;
  const tile = (title, cur, base, unit, low, note, nNeed) => {
    const has = cur != null, d = has && base != null ? cur - base : null, good = d != null && (low ? d < 0 : d > 0);
    return `<div class="co-tile"><span class="k">${title}</span><div class="big">${has ? (unit === 's' ? cur.toFixed(1) : Math.round(cur)) + unit : '<span style="font-size:15px">not enough data yet</span>'}</div>${d != null && Math.abs(d) >= .05 ? `<small style="color:${good ? '#3FB37F' : '#e0584a'}">${d > 0 ? '+' : ''}${unit === 's' ? d.toFixed(1) : Math.round(d)}${unit} vs baseline</small>` : ''}<small>${base != null ? `${bl}: ${unit === 's' ? base.toFixed(1) : base}${unit}. ` : ''}${note}</small>${has ? '' : `<small>${nNeed}</small>`}</div>`;
  };
  const rt = c.rating || [], r0 = rt[0], r1 = rt[rt.length - 1];
  const rtile = `<div class="co-tile"><span class="k">Blitz rating</span><div class="big">${r1 ? r1.v : '<span style="font-size:15px">not synced yet</span>'}</div>${rt.length >= 2 ? `<small style="color:${r1.v >= r0.v ? '#3FB37F' : '#e0584a'}">${r1.v - r0.v >= 0 ? '+' : ''}${r1.v - r0.v} since ${fmtDay(r0.t)}</small>` : '<small>One point stored so far; a trend needs a second sync on another day.</small>'}${rt.length >= 2 ? lineChart(rt.slice(-10).map(p => ({ x: fmtDay(p.t), y: p.v })), { w: 200, h: 70, fmt: v => Math.round(v) }) : ''}<small>A point is stored at each chess.com sync.</small></div>`;
  const ck = c.checkups || [], ins = c.instinct || [], eg = c.endgames || {}, mastered = Object.values(eg).filter(e => (e.days || []).length >= 2).length;
  const tiles = rtile +
    tile('Losses on time', L.timeLoss, B.timeloss_pct, '%', true, `Source: ${B.games.toLocaleString()} games. Live: your synced losses (${L.lossN}).`, `Needs 8 synced losses; you have ${L.lossN}.`) +
    tile('Errors made while winning', L.blunderWin, B.blunderwin_pct, '%', true, `Share of your key errors that came from a winning position. Live: ${L.puzN} analysed synced games.`, `Needs 6 analysed games; you have ${L.puzN}.`) +
    tile('Seconds per move, 11 to 20', L.mid, B.sec1120, 's', true, `Median. Live: ${L.midN} moves from synced games with clocks.`, `Needs 40 such moves; you have ${L.midN}.`) +
    `<div class="co-tile"><span class="k">Knowing vs speed gap</span><div class="big">${ck.length ? Math.round(ck[ck.length - 1].gap) + ' pts' : '<span style="font-size:15px">no check-up yet</span>'}</div><small>${ck.length ? `Last check-up ${fmtDay(ck[ck.length - 1].t)}. Smaller is better.` : 'Take the weekly check-up to start this line.'}</small></div>
     <div class="co-tile"><span class="k">First-instinct accuracy</span><div class="big">${ins.length ? Math.round(100 * ins[ins.length - 1].good / ins[ins.length - 1].n) + '%' : '<span style="font-size:15px">no sessions yet</span>'}</div><small>${ins.length} session${ins.length === 1 ? '' : 's'} logged.</small></div>
     <div class="co-tile"><span class="k">Endgames mastered</span><div class="big">${mastered}/30</div><small>Two successes on different days.</small></div>`;
  const trend = ck.length >= 2 ? `<div class="co-sec"><h2>Check-up trend</h2>${lineChart(ck.slice(-8).map(k => ({ x: fmtDay(k.t), y: k.gap })), { unit: '', fmt: v => Math.round(v), min: 0 })}<p class="sub sm">Gap between untimed and timed accuracy, in points. Falling is good.</p></div>` : '';
  // goals
  const goals = c.goals || [];
  const gh = goals.map(g => { const p = goalProgress(g, L, B); return `<div class="co-tile" style="grid-column:1/-1"><span class="k">By ${esc(g.by)}</span><b>${esc(p.m.n)}: ${p.m.low ? 'under' : 'reach'} ${g.target}${p.m.unit}</b>${p.frac != null ? bar(p.frac, p.done ? 'good' : '') : bar(0)}<small>${p.cur != null ? `Now ${p.m.unit === 's' ? p.cur.toFixed(1) : Math.round(p.cur)}${p.m.unit}, started at ${p.start != null ? (p.m.unit === 's' ? (+p.start).toFixed(1) : Math.round(p.start)) : '?'}${p.m.unit}. ` : ''}${p.daysLeft >= 0 ? p.daysLeft + ' days left.' : 'Past the deadline.'}</small><div class="co-says" style="margin:6px 0 0">${avatar('Skipper', p.done ? 'excited' : 'pleased', 'sm')}<p>${esc(skipperLine(g, p))}</p></div><button class="btn ghost sm" data-del="${esc(g.id)}" type="button" style="margin-top:6px">Remove</button></div>`; }).join('');
  const nextDec = (() => { const d = new Date(); return d.getFullYear() + '-12-31'; })();
  root.innerHTML = `<div class="co-wrap"><div class="co-sec" style="margin-top:8px"><h2>Your real numbers</h2><p class="sub">Nothing here is invented. Live figures come from chess.com games synced in this browser; baselines come from the ${B.games.toLocaleString()} games analysed on ${asof}.</p><div class="co-tiles">${tiles}</div></div>${trend}
   <div class="co-sec"><h2>Goals</h2>${goals.length ? `<div class="co-tiles">${gh}</div>` : empty('Skipper', 'pleased', 'No goals yet', 'A goal with a date works better than a wish. Try &ldquo;time-losses under 40% by 31 Dec&rdquo;.')}
    <form id="g-form" class="co-row" style="margin-top:12px"><label class="sub sm">Goal <select id="g-m" aria-label="Metric">${Object.entries(METRICS).map(([k, m]) => `<option value="${k}">${esc(m.n)}</option>`).join('')}</select></label>
     <label class="sub sm">Target <input id="g-t" type="number" step="any" required value="40" style="width:80px" aria-label="Target"></label>
     <label class="sub sm">By <input id="g-d" type="date" required value="${nextDec}" aria-label="Deadline"></label><button class="btn" type="submit">Set goal</button></form></div>
   <div class="co-sec"><h2>Monthly crew report</h2><div id="rep"></div></div></div>`;
  const form = q(root, '#g-form');
  form.onsubmit = e => { e.preventDefault(); const metric = q(root, '#g-m').value, m = METRICS[metric], t = parseFloat(q(root, '#g-t').value), by = q(root, '#g-d').value; if (!isFinite(t) || !by) return; const L2 = liveStats(); upd(c2 => { (c2.goals ||= []).push({ id: 'g' + Date.now(), metric, target: t, by, start: m.cur(L2) ?? m.base(B), startT: Date.now() }); }); proofPage(ctx, root); };
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { upd(c2 => { c2.goals = (c2.goals || []).filter(g => g.id !== b.dataset.del); }); proofPage(ctx, root); });
  q(root, '#rep').innerHTML = await reportHTML(L, B);
}

/* ---------- Monthly crew report: each master grades their own phase from real data ---------- */
async function reportHTML(L, B) {
  const c = C(), since = Date.now() - 30 * 864e5, M = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const within = a => (a || []).filter(x => x.t >= since);
  const lg = (Array.isArray(c.logsX) ? c.logsX : []);
  const rows = [];
  const grade = (who, phase, ok, n, ev, fix) => rows.push({ who, phase, g: n >= 3 ? gradeOf(ok, n) : null, ev: n >= 3 ? ev : `Not enough data yet (${n} of 3 needed). ${fix}` });
  const op = within((c.openings || {}).hist), k = op.reduce((a, x) => a + x.ok, 0), nn = op.reduce((a, x) => a + x.n, 0);
  grade('Morphy', 'Openings', k, nn, `${k} of ${nn} opening positions right in the trainer this month.`, 'Run the opening trainer.');
  const lk = within(c.leakHist), a2 = lk.reduce((a, x) => a + x.ok, 0), n2 = lk.reduce((a, x) => a + x.n, 0);
  grade('Kasparov', 'Middlegame', a2, n2, `${a2} of ${n2} leak-drill positions right this month.`, 'Pick a leak from the weakness map.');
  const eg = Object.values(c.endgames || {}), egM = eg.filter(e => (e.days || []).length >= 2).length, egT = within(c.egHist), e1 = egT.filter(x => x.ok).length;
  grade('Capablanca', 'Endgames', e1, egT.length, `${e1} of ${egT.length} endgame attempts met their goal; ${egM} of 30 mastered overall.`, 'Play an endgame on the island.');
  const ck = within(c.checkups), t1 = ck.length ? ck.reduce((a, x) => a + x.timed.ok, 0) : 0, t2 = ck.length ? ck.reduce((a, x) => a + x.timed.n, 0) : 0;
  grade('Tal', 'Tactics under the clock', t1, t2, `${t1} of ${t2} check-up positions right when timed.`, 'Take the weekly check-up.');
  const cv = within(c.cvHist), v1 = cv.filter(x => x.ok).length;
  grade('Carlsen', 'Converting wins', v1, cv.length, `${v1} of ${cv.length} won positions converted against the engine.`, 'Play a Convert the win position.');
  const ins = within(c.instinct), i1 = ins.reduce((a, x) => a + x.good, 0), i2 = ins.reduce((a, x) => a + x.n, 0);
  grade('Tempo', 'The clock', i1, i2, `First-instinct picks were good ${i1} of ${i2} times; ${L.mid != null ? 'moves 11 to 20 took a median ' + L.mid.toFixed(1) + 's.' : 'no live clock figure yet.'}`, 'Do a First instinct session.');
  const rt = c.rating || [], inM = rt.filter(p => p.t >= since), dr = inM.length >= 2 ? inM[inM.length - 1].v - inM[0].v : null;
  return `<article class="co-log" aria-label="Monthly crew report"><div class="k">Captain's log, ${esc(M)}</div><p>${dr == null ? 'The rating has no second reading this month yet.' : `Blitz rating moved ${dr >= 0 ? '+' : ''}${dr} over the month.`} ${L.slow ? `${L.slow} slower game${L.slow > 1 ? 's' : ''} this week.` : ''}</p>${rows.map(r => `<div class="co-says">${avatar(r.who, r.g && 'ABC'.includes(r.g) ? 'excited' : r.g ? 'disappointed' : 'neutral', 'sm')}<p><b>${esc(r.who)}, ${esc(r.phase)}: ${r.g ? 'Grade ' + r.g : 'no grade'}.</b> ${esc(r.ev)}</p></div>`).join('')}</article>`;
}

/* ---------- hooks ---------- */
const ADV = { hanging_piece: 'Kasparov', missed_fork: 'Tal', bad_trade_when_ahead: 'Carlsen', missed_capture: 'Tal', king_safety: 'Kasparov', pin_skewer: 'Tal', 'missed_promotion/passed_pawn': 'Capablanca', missed_check_mate: 'Tal', back_rank: 'Tal' };
export async function onSyncAlerts() {
  await Sync.S.ready; await recordRating(); const W = await data('weakness').catch(() => null); if (!W) return;
  const c = C(), seen = new Set(c.alerted || []), fresh = Sync.S.puzzles.filter(p => !seen.has(p.id));
  if (!fresh.length) return;
  const first = !c.alerted; // first ever run: record, do not spam
  const hist = {}; Sync.S.puzzles.filter(p => seen.has(p.id)).forEach(p => { const m = tagMove(p.fen, p.you_played, p.solution[0]); hist[m] = (hist[m] || 0) + 1; });
  const alerts = [];
  for (const p of fresh.slice().reverse()) {
    const m = tagMove(p.fen, p.you_played, p.solution[0]); const n = (W.overall[m] || 0) + (hist[m] || 0); hist[m] = (hist[m] || 0) + 1;
    if (m !== 'positional/other' && n >= 3) alerts.push({ p, m, n });
  }
  upd(c2 => { c2.alerted = [...(c2.alerted || []), ...fresh.map(p => p.id)].slice(-300); });
  if (first) return;
  for (const a of alerts.slice(0, 2)) {
    const who = ADV[a.m] || 'Skipper', label = MOTIF[a.m][0].toLowerCase();
    toast({ k: 'Same mistake again', title: MOTIF[a.m][0], line: `This is ${label} again: it is in your record ${a.n} times. Best was ${a.p.solution_san ? a.p.solution_san.replace(/^\d+\.(\.\.)?\s*/, '').split(' ')[0] : 'there'}.`, who });
    try { saveLog({ t: Date.now(), mode: 'coach', name: 'Same mistake again: ' + MOTIF[a.m][0], ok: 0, n: 1, avg: 0, real: 0, budget: 0, best: 0, worst: { fen: a.p.fen, san: (a.p.solution_san || '').replace(/^\d+\.(\.\.)?\s*/, '').split(' ')[0], played: a.p.you_played, swing: a.p.loss || 0, mv: a.p.solution[0] }, bestMv: null, advisor: who, flags: 0 }); } catch (_) { }
  }
}
export function visitNudge() {
  const c = C(), now = Date.now();
  if (c.lastVisit && now - c.lastVisit >= 3 * 864e5) { const d = Math.floor((now - c.lastVisit) / 864e5); setTimeout(() => toast({ k: 'Welcome back', title: 'The crew missed you', line: `${d} days since your last visit. A ten-minute session is all it takes to get the lamp lit again.`, who: 'Skipper' }), 1800); }
  upd(c2 => { c2.lastVisit = now; });
}
export function briefCoachHTML() {
  const c = C(), L = liveStats(), wk = isoWeek(), ch = (c.challenge || {})[wk] || {}, done = (c.sessions || []).some(s => s.day === Pr.dayKey());
  return `<div class="card wide" id="pg-coach"><span class="k">Coach</span><h2>${done ? 'Session done today' : "Today's session, 10 to 15 minutes"}</h2>
   <p class="sub">${L.games ? `<b>${L.slow} of 3</b> slow games this week (10 minutes or longer). At 10 minutes you score 60% against 51% at 3+2.` : 'Slow games (10 minutes or more) are where you score best: 60% against 51% at 3+2. Sync chess.com to count them.'}</p>
   ${bar(Math.min(1, L.slow / 3), L.slow >= 3 ? 'good' : '')}<div class="row mt1"><a class="btn" href="#coach/session">${done ? 'Another round' : 'Start the session'}</a><a class="btn ghost" href="#coach/challenge">${ch.gerald ? 'Weekly challenge: ' + ch.gerald.score + '/10' : 'Weekly challenge'}</a><a class="btn ghost" href="#coach">Coach</a></div></div>`;
}
