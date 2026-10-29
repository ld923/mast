// "Start today's watch": one continuous 10-minute guided session built by the Coach session generator.
import { sessionSteps } from './coach.js';
import { esc, q, C, upd, day, TAP, stopCoach, bar, isDebug, css } from './coach-core.js';
import { avatar } from './ui.js';
import { saveLog, showLog } from './captain.js';
import * as Pr from './progress.js';
import { play as sfx } from './sound.js';
import { speak } from './voice.js';

export const watchDone = () => (C().watches || []).some(w => w.day === day());
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const pctf = (a, b) => b ? Math.round(100 * a / b) : 0;

/* one honest sentence from stored results; returns {text, who} */
export function progressSentence(cur, prior, leakPrior, lbl) {
  const ago = prior.length ? (Date.now() - prior[prior.length - 1].t) / 864e5 : 0;
  const when = prior.length === 1 ? 'your last watch' : ago >= 4 && ago <= 10 ? 'last week' : 'your earlier watches';
  const pw = prior.filter(w => w.winSecs != null && w.winN >= 3);
  if (cur.winSecs != null && cur.winN >= 3 && pw.length) {
    const d = avg(pw.map(w => w.winSecs)) - cur.winSecs;
    if (Math.abs(d) >= .3) return { who: 'Carlsen', text: `You decided ${Math.abs(d).toFixed(1)}s ${d > 0 ? 'faster' : 'slower'} than ${when} in winning positions.` };
    return { who: 'Carlsen', text: `Your decision time in winning positions held steady at ${cur.winSecs.toFixed(1)}s, the same as ${when}.` };
  }
  const lp = leakPrior.reduce((a, h) => ({ ok: a.ok + h.ok, n: a.n + h.n }), { ok: 0, n: 0 });
  if (cur.leak && cur.leak.n >= 3 && lp.n >= 5) {
    const a = pctf(cur.leak.ok, cur.leak.n), b = pctf(lp.ok, lp.n), d = a - b;
    return { who: 'Tal', text: d >= 5 ? `Your accuracy on ${lbl.toLowerCase()} is up to ${a}%, from ${b}% in your earlier drills.` : d <= -5 ? `Your accuracy on ${lbl.toLowerCase()} dipped to ${a}% from ${b}% in earlier drills; that is the one to keep drilling.` : `Your accuracy on ${lbl.toLowerCase()} is steady at ${a}% (earlier drills: ${b}%).` };
  }
  const pf = prior.filter(w => w.n >= 8);
  if (cur.n >= 8 && pf.length) {
    const a = pctf(cur.flags, cur.n), b = Math.round(100 * avg(pf.map(w => w.flags / w.n)));
    return { who: 'Kasparov', text: a < b ? `You ran out of time on ${a}% of positions, down from ${b}% before.` : a > b ? `You ran out of time on ${a}% of positions, up from ${b}% before.` : `You ran out of time on ${a}% of positions, the same as before.` };
  }
  if (!prior.length) return { who: 'Skipper', text: 'First watch logged. Next time I will compare.' };
  return { who: 'Skipper', text: `Watch logged. There is not enough comparable data yet to measure a change, so I will not guess.` };
}

let token = 0;
export async function watchScreen({ render, topbar }) {
  css(); stopCoach(); const my = ++token, dbg = isDebug();
  render(`${topbar}<a class="back" href="#today">&larr; Back to deck</a><div class="co-wrap co-sec" id="w-root" style="margin-top:8px"><div class="co-empty"><div><b>Building today's watch</b><p>Choosing segments from your weakest areas.</p></div></div></div>`);
  const R = q(document, '#w-root'); let gen; try { gen = await sessionSteps({ watch: true }); } catch (e) { R.innerHTML = `<div class="co-empty"><div><b>Could not build the watch</b><p>${esc(String(e && e.message || e))}</p></div></div>`; return; }
  if (my !== token || !R.isConnected) return;
  const steps = gen.steps, tot = steps.reduce((a, s) => a + s.mins, 0), t0 = Date.now(), already = watchDone();
  R.innerHTML = `<div class="co-hud" style="gap:12px"><b style="white-space:nowrap">Today's watch</b><span id="w-time" style="flex:1;text-align:right;text-transform:none;letter-spacing:0"></span></div><div id="w-bar" role="progressbar" aria-label="Watch progress" aria-valuemin="0" aria-valuemax="100"></div><div id="w-seg" class="co-sec" style="margin-top:10px"></div>`;
  let segDone = 0, segStart = t0, segMins = 0, ticker;
  const frac = () => { const within = segMins ? Math.min(.95, (Date.now() - segStart) / 60000 / segMins) : 0; return Math.min(1, (segDone + within * segMins) / tot); };
  const tick = () => { if (!R.isConnected) { clearInterval(ticker); return; } const el = (Date.now() - t0) / 1000, f = frac(); q(R, '#w-time').textContent = `${mmss(el)} elapsed · about ${Math.max(0, Math.ceil(tot - el / 60))} min left`; q(R, '#w-bar').innerHTML = bar(f); q(R, '#w-bar').setAttribute('aria-valuenow', Math.round(f * 100)); };
  tick(); ticker = setInterval(tick, 1000);
  const S = q(R, '#w-seg'), out = [], winRes = [], allRes = []; let leakRes = null;
  const alive = () => my === token && R.isConnected;
  for (let i = 0; i < steps.length; i++) {
    if (!alive()) return; const st = steps[i]; segMins = st.mins; segStart = Date.now();
    // segment intro card
    S.innerHTML = `<div class="card" style="padding:18px"><div class="co-says" style="align-items:center">${avatar(st.who, 'pleased', 'lg')}<p><span class="k">Segment ${i + 1} of ${steps.length} · ${st.mins} min</span><br><b style="font-size:20px">${esc(st.k)}</b><br>${esc(st.who)}: ${esc(st.why)}</p></div><div class="row" style="margin-top:12px"><button class="btn" id="w-go" type="button">Start now</button><span class="sub sm" id="w-auto"></span></div></div>`;
    speak(st.who, st.why, 'intro');
    await new Promise(res => { let n = dbg ? 1 : 5; const go = () => { clearInterval(iv); res(); }; const iv = setInterval(() => { if (!alive()) return go(); const a = q(S, '#w-auto'); if (a) a.textContent = `Starting in ${n}s`; if (--n < 0) go(); }, 1000); const b = q(S, '#w-go'); if (b) b.onclick = go; });
    if (!alive()) return; segStart = Date.now();
    S.innerHTML = `<div class="co-hud"><span style="flex:1;text-transform:none;letter-spacing:0">${i + 1}/${steps.length} · ${esc(st.k)}</span><button class="btn ghost sm" id="w-skip" type="button">Skip segment</button></div><div id="w-b" class="co-sec" style="margin-top:8px"></div>`;
    const body = q(S, '#w-b'), mine = []; let skipped = false; q(S, '#w-skip').onclick = () => { skipped = true; stopCoach(); };
    TAP.f = r => { mine.push(r); };
    let r; try { r = await st.run(body); } catch (e) { r = { n: 0, ok: 0 }; } finally { TAP.f = null; }
    if (!alive()) return;
    allRes.push(...mine); if (st.win) winRes.push(...mine); if (st.motif) leakRes = r;
    out.push({ k: st.k, ok: r.ok || 0, n: r.n || 0, skipped }); segDone += st.mins;
  }
  clearInterval(ticker); tick();
  // ---- store + compute ----
  const ok = out.reduce((a, s) => a + s.ok, 0), n = out.reduce((a, s) => a + s.n, 0);
  const wsecs = winRes.filter(x => !x.flagged && isFinite(x.secs)).map(x => x.secs);
  const cur = { t: Date.now(), day: day(), ok, n, flags: allRes.filter(x => x.flagged).length, winSecs: wsecs.length >= 3 ? avg(wsecs) : null, winN: wsecs.length, leak: leakRes && leakRes.n ? { motif: gen.top, ok: leakRes.ok, n: leakRes.n } : null, mins: Math.round((Date.now() - t0) / 6000) / 10 };
  const prior = (C().watches || []).filter(w => w.t < t0), leakPrior = (C().leakHist || []).filter(h => h.motif === gen.top && h.t < t0);
  const sent = progressSentence(cur, prior, leakPrior, gen.lbl);
  upd(c => { (c.watches ||= []).push(cur); c.watches = c.watches.slice(-60); (c.sessions ||= []).push({ t: cur.t, day: cur.day, ok, n, watch: 1 }); c.sessions = c.sessions.slice(-120); });
  try { Pr.addXp(40, 'coach session'); Pr.onSession({ mode: 'coach', ok, n, avg: avg(allRes.map(x => x.secs)) || 0, flags: cur.flags }); } catch (_) { }
  sfx('success');
  const miss = allRes.find(x => !x.ok && x.fen), good = allRes.filter(x => x.ok).sort((a, b) => a.secs - b.secs)[0], med = null; try { const x = await fetch('data/extra.json').then(r => r.json()); med = x.clock.seconds_per_move_by_bucket['11-20'].median; } catch (_) { }
  const entry = { t: cur.t, mode: 'coach', name: "Today's", ok, n, avg: avg(allRes.map(x => x.secs)) || 0, real: med || 0, budget: 0, best: 0, worst: miss ? { fen: miss.fen, san: miss.bestSan, played: miss.played || '', swing: 0, mv: miss.best } : null, bestMv: good ? { san: good.bestSan, swing: 0, secs: good.secs } : null, advisor: sent.who, flags: cur.flags };
  try { saveLog(entry); } catch (_) { }
  speak(sent.who, sent.text, 'result');
  R.innerHTML = `<div class="card" style="text-align:center;padding:22px 16px"><span class="k">Watch complete${already ? ' (extra round)' : ''} · ${mmss((Date.now() - t0) / 1000)}</span><div style="display:flex;justify-content:center;margin:12px 0">${avatar(sent.who, 'excited', 'lg')}</div><h1 id="w-sentence" style="font-size:clamp(22px,6vw,34px);line-height:1.2;margin:0 auto;max-width:28ch">${esc(sent.text)}</h1><p class="sub mt1">${ok} of ${n} across ${out.filter(s => s.n).length} segments: ${out.map(s => `${esc(s.k)} ${s.n ? s.ok + '/' + s.n : s.skipped ? 'skipped' : 'no data'}`).join(' · ')}.</p><div class="row" style="justify-content:center;margin-top:12px"><a class="btn" href="#today">Back to deck</a><a class="btn ghost" href="#watch" id="w-again">Extra round</a></div></div><div id="w-log" style="margin-top:16px"></div>`;
  q(R, '#w-again').onclick = e => { e.preventDefault(); watchScreen({ render, topbar }); };
  try { showLog(q(R, '#w-log'), entry); } catch (_) { }
}
