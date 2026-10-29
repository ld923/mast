// Drills: Convert / Blitz tactics / Middlegame tempo. 10-position sessions, PressureClock per move, Leitner spaced repetition.
import { smoothTake } from './secrets.js';
import { Board } from './board2.js';
import { PressureClock, ghostFor } from './clock.js';
import { replayRun, noteMiss, clearMiss } from './replay.js';
import * as Resume from './resume.js';
import { play } from './sound.js';
import { Crew, advisorFor, fmtEval } from './crew.js';
import { store, hydrate } from './ui.js';
import * as Sync from './sync.js';
import { bumpIsland } from './voyage.js';
import * as Pr from './progress.js';
import { setBusy } from './prog-ui.js';
import { storm, closeCall, getClockStyle } from './drama.js';
import { introUp } from './crewstate.js';
import { cctFlash, cctRecord } from './coach-core.js';
import { showLog, saveLog, gradeOf } from './captain.js';
import { getAnim, full, buzz, burst, confetti, shake, floatAt, wash, combo, countUp, countAll, sparkAt, sprayAt } from './fx.js';

import { loadJSON as j } from './data.js';
const SIZE = 10, DAYS = { 1: 0, 2: 2, 3: 5, 4: 14 };
const MODES = {
  convert: { name: 'Convert', k: 'Winning, so finish it', blurb: 'You were winning here and let it slip. Find the move before the clock.', budget: 8, isl: 'Carlsen' },
  blitz: { name: 'Blitz tactics', k: 'Full lines', blurb: 'Solve the whole line. Replies are played for you. 8 seconds a move.', budget: 8, isl: 'Tal' },
  tempo: { name: 'Middlegame tempo', k: 'Decent now beats perfect late', blurb: 'Middlegame positions on a strict 6 second clock. You burn 6.3s a move here, and long thinks go wrong more often.', budget: 6, isl: 'Kasparov' }
};
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
let cache = null, live = null;
const rnd = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };

async function data() {
  await Sync.S.ready; const fresh = Sync.latestPuzzles().map(x => ({ id: x.id, fen: x.fen, sol: x.solution, san: x.solution_san.replace(/^\d+\.(\.\.)?\s*/, '').split(' ')[0], played: x.you_played, ev: x.eval, phase: x.phase, themes: x.themes || [], src: x.source, swing: x.loss, kind: 'bt' }));
  if (cache) { cache.blitz = [...fresh, ...cache.base.T]; cache.tempo = [...cache.blitz, ...cache.base.C].filter(x => x.phase === 'middlegame'); return cache; }
  const [cv, bt, ch] = await Promise.all([j('data/convert.json'), j('data/blitz_tactics.json'), j('data/characters.json')]);
  const C = cv.map(x => ({ id: x.id, fen: x.fen, sol: [x.best_uci], san: x.best_san, played: x.played_san, ev: x.before, phase: x.phase, themes: [], src: x.src, swing: x.loss, kind: 'cv' }));
  const T = bt.map(x => ({ id: x.id, fen: x.fen, sol: x.solution, san: x.solution_san.replace(/^\d+\.(\.\.)?\s*/, '').split(' ')[0], played: x.you_played, ev: x.eval, phase: x.phase, themes: x.themes || [], src: x.source, swing: x.gap, kind: 'bt' }));
  return cache = { convert: C, blitz: [...fresh, ...T], tempo: [...fresh, ...T, ...C].filter(x => x.phase === 'middlegame'), lines: ch.characters, base: { T, C } };
}
/* ---- Leitner boxes: {key:{box,due}} ---- */
const keyOf = (m, p) => m + ':' + p.id;
const boxes = () => store.get('leitner', {}) || {};
function pick(mode, pool) {
  const B = boxes(), now = Date.now();
  const due = pool.filter(p => B[keyOf(mode, p)] && B[keyOf(mode, p)].due <= now).sort((a, b) => B[keyOf(mode, a)].box - B[keyOf(mode, b)].box);
  const fresh = rnd(pool.filter(p => !B[keyOf(mode, p)]));
  return [...due, ...fresh].slice(0, SIZE);
}
const dueCount = (mode, pool) => { const B = boxes(), now = Date.now(); return pool.filter(p => B[keyOf(mode, p)] && B[keyOf(mode, p)].due <= now).length; };
function record(mode, p, ok) {
  const B = boxes(), k = keyOf(mode, p), box = ok ? Math.min(4, (B[k] ? B[k].box : 0) + 1) : 1;
  B[k] = { box, due: ok ? Date.now() + DAYS[box] * 864e5 : 0 }; store.set('leitner', B);
  if (ok) bumpIsland(MODES[mode].isl);
}

export function stopDrills() { if (live) { live.stop(); live = null; } document.body.classList.remove('critical'); }

function launch(root, mode, D2, clk, resume) {
  const h = { stopped: false, inner: null, rp: null, stop() { this.stopped = true; this.rp && this.rp.stop(); this.inner && this.inner.stop(); } };
  const go = () => { if (!h.stopped) h.inner = session(root, mode, D2, clk, resume); };
  if (resume) go(); else { h.rp = replayRun(root); h.rp.promise.then(go); }
  return h;
}
export async function drills(ctx, arg) {
  stopDrills();
  const { render, topbar, D } = ctx, D2 = await data();
  const clk = D.extra.clock;
  render(`${topbar}<span class="k">Training</span><h1>Drills</h1>
   <div class="grid g-modes mt2">${Object.entries(MODES).map(([id, m]) => `<div class="card link mode" data-m="${id}" tabindex="0" role="button"><span class="k">${m.k}</span><h2>${m.name}</h2><p>${m.blurb}</p><span class="sub sm">${D2[id].length.toLocaleString()} positions, ${dueCount(id, D2[id])} due</span></div>`).join('')}</div>
   <div id="sess"></div>`);
  const sess = document.querySelector('#sess');
  const go = (id, resume) => { document.querySelectorAll('.mode').forEach(c => c.classList.toggle('on', c.dataset.m === id)); stopDrills(); live = launch(sess, id, D2, clk, resume); sess.scrollIntoView({ behavior: full() ? 'smooth' : 'auto', block: 'start' }); };
  document.querySelectorAll('.mode').forEach(c => { c.onclick = () => go(c.dataset.m); c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(c.dataset.m); } }; });
  const rs = Resume.consume('drill');
  if (rs && MODES[rs.mode]) go(rs.mode, rs); else if (MODES[arg]) go(arg);
}

function session(root, mode, D2, clk, resume) {
  const M0 = MODES[mode], M = smoothTake() ? { ...M0, budget: M0.budget + 1 } : M0;
  let list = null; if (resume && Array.isArray(resume.ids)) { const byId = new Map(D2[mode].map(x => [String(x.id), x])); list = resume.ids.map(id => byId.get(String(id))).filter(Boolean); if (list.length !== resume.ids.length) list = null; }
  const resumed = !!list; if (!list) list = pick(mode, D2[mode]);
  const S = { i: resumed ? Math.min(resume.i || 0, list.length - 1) : 0, ghosts: 0, ok: resumed ? resume.ok || 0 : 0, streak: resumed ? resume.streak || 0 : 0, best: resumed ? resume.best || 0 : 0, times: [], stopped: false, flags: 0, mrun: 0, srun: 0, armed: false, storm: false }, timers = new Set();
  const later = (f, ms) => { const t = setTimeout(() => { timers.delete(t); if (!S.stopped) f(); }, ms); timers.add(t); };
  root.innerHTML = `<div class="dr"><div class="dr-hud"><div class="tile"><span class="led" id="d-n">1/${list.length}</span><span class="k">Position</span></div>
   <div class="tile"><span class="led" id="d-s">0</span><span class="k">Score</span></div><div class="tile"><span class="led" id="d-st">0</span><span class="k">Streak</span></div></div>
   <div class="pz"><div class="bcol" style="position:relative"><div id="d-bd"></div><div class="combo" id="d-cb"></div><div id="d-crew"></div></div>
   <div class="side"><div class="dr-clk"><div id="d-clock"></div><div class="panel" id="d-info"></div><button class="btn ghost sm" id="d-hint" type="button">Spyglass</button></div><div id="d-res"></div></div></div></div>`;
  const $ = s => root.querySelector(s);
  const crew = new Crew($('#d-crew'), D2.lines), board = new Board($('#d-bd'), { orientation: 'white', coords: true, onMove: (f, t, pr) => onMove(f, t, pr) }); crew.board = board;
  const mq = matchMedia('(max-width:820px)'), clockEl = $('#d-clock');
  const place = () => { if (mq.matches) $('.dr-hud').appendChild(clockEl); else $('.dr-clk').prepend(clockEl); };
  place(); mq.addEventListener('change', place); S.mqOff = () => mq.removeEventListener('change', place);
  const sqEl = sq => board.sqEls && board.sqEls[sq];
  const hud = () => { $('#d-n').textContent = `${Math.min(S.i + 1, list.length)}/${list.length}`; countUp($('#d-s'), S.ok, 450); countUp($('#d-st'), S.streak, 450); combo($('#d-cb'), S.streak); };
  let p, g, k, t0, locked, spent = 0, tTrouble, clock, ended, heldAt = 0;
  const stormer = storm(board);
  clock = new PressureClock($('#d-clock'), { seconds: M.budget, glass: getClockStyle() === 'glass', onState: st => stormer.set(st), onFlag: () => miss('flag') });
  let hinted = false, fen0 = '', left = 9, gh = 6;
  const info = (t, c = '') => $('#d-info').innerHTML = `<div class="status ${c}">${t}</div><div class="sub">${M.name}, ${p ? p.phase : ''}${p && p.kind === 'bt' ? ', move ' + (Math.floor(Math.min(k, p.sol.length - 1) / 2) + 1) + ' of ' + Math.ceil(p.sol.length / 2) : ''}</div>`;
  const legal = () => { const m = {}; g.moves({ verbose: true }).forEach(x => (m[x.from] ??= []).push(x.to)); return m; };
  const col = () => g.turn() === 'w' ? 'white' : 'black';
  const sync = (lm, anim) => { board.setPosition(g.fen(), { animate: anim, lastMove: lm, check: g.in_check() }); board.setLegal(legal()); board.setTurn(col(), true); };
  /* an intro card over the board freezes the clock; it resumes (and t0 shifts) when the card closes */
  const holdOn = () => { if (heldAt || locked || ended || !clock.run) return; heldAt = performance.now(); clock.pause(); };
  const holdOff = () => { if (!heldAt) return; t0 += performance.now() - heldAt; heldAt = 0; if (!locked && !ended && !S.stopped) clock.start(); };
  const onIntro = e => e.detail === 'open' ? holdOn() : holdOff();
  document.addEventListener('mast:intro', onIntro); S.introOff = () => { document.removeEventListener('mast:intro', onIntro); setBusy(false); };
  const ownMove = () => { // arm the clock for the player's next move
    locked = false; spent = 0; tTrouble = false; heldAt = 0; t0 = performance.now(); clock.reset(M.budget); gh = ghostFor(p.themes, mode === 'convert' || p.kind === 'cv', M.budget); clock.setGhost(gh); clock.start(); crew.think(true); setBusy(true); if (introUp()) holdOn();
    clearInterval(S.poll); S.poll = setInterval(() => { if (!locked && !tTrouble && clock.remaining() < 3) { tTrouble = true; crew.react('time_trouble', { who: 'Tempo', ex: 'thinking', vars: { secs: (M.budget - clock.remaining()).toFixed(1) } }); play('tick'); } }, 150);
  };
  const stopClock = () => { stormer.calm(); left = clock.remaining(); clearInterval(S.poll); if (heldAt) { t0 += performance.now() - heldAt; heldAt = 0; } setBusy(false); spent = (performance.now() - t0) / 1000; clock.pause(); crew.think(false); document.body.classList.remove('critical'); locked = true; };
  const vars = (played) => ({ move: p.san, played: played || p.played, secs: (spent || 0).toFixed(1), eval: fmtEval(p.ev), game: p.src && p.src.White ? `${p.src.White} vs ${p.src.Black}` : 'your game' });

  function load() {
    p = list[S.i]; g = new Chess(p.fen); hinted = false; k = 0; ended = false; board.clearArrows();
    if ((g.turn() === 'w') !== (board.orient === 'white')) board.flip();
    const adv = advisorFor({ mode, phase: p.phase, themes: p.themes }); crew.setAdvisor(adv);
    if (p.themes.includes('sacrifice')) crew.silent('Tal', 'excited', 2200);
    if (p.phase === 'endgame') crew.react('endgame', { who: 'Capablanca', ex: 'pleased', vars: vars() });
    $('#d-res').innerHTML = ''; hud(); sync(null, false); cctFlash($('#d-bd'), p.fen); info(`${g.turn() === 'w' ? 'White' : 'Black'} to move.`); ownMove();
    Resume.save('drill', { mode, ids: list.map(x => x.id), i: S.i, ok: S.ok, streak: S.streak, best: S.best });
    document.dispatchEvent(new CustomEvent('mast:drillload', { detail: { board, p } }));
  }
  function onMove(from, to, promo) {
    if (locked || S.stopped) return false;
    fen0 = g.fen(); const m = g.move({ from, to, promotion: promo || 'q' }); if (!m) return false;
    const u = m.from + m.to + (m.promotion || ''), want = p.sol[k];
    stopClock();
    if (u === want && m.promotion === 'n') document.dispatchEvent(new CustomEvent('mast:promo', { detail: { piece: 'n' } }));
    if (u !== want) { g.undo(); setTimeout(() => miss('wrong', m.san, m.to), 0); return false; }
    play(g.in_check() ? 'check' : m.captured ? 'capture' : 'move'); if (m.captured) sprayAt(sqEl(m.to));
    S.times.push(spent); k++;
    const sac = (VAL[m.piece] - (m.captured ? VAL[m.captured] : 0)) >= 2 && g.moves({ verbose: true }).some(x => x.to === m.to && x.captured);
    const mate = g.in_checkmate(); if (mate) board.checkmate();
    if (k >= p.sol.length) { later(() => solved(m, sac), mate ? 1100 : 200); return true; }
    later(() => { const o = p.sol[k], r = g.move({ from: o.slice(0, 2), to: o.slice(2, 4), promotion: o[4] }); play(r.captured ? 'capture' : 'move'); if (r.captured) sprayAt(sqEl(r.to)); k++; sync({ from: r.from, to: r.to }, true);
      if (k >= p.sol.length) { later(() => solved(m, sac), 350); return; } // line ends on the opponent's reply
      info('Your move.'); ownMove(); }, 450);
    return true;
  }
  function solved(m, sac) {
    if (ended) return;
    if (left < 1 && !S.rp && !g.in_checkmate()) { S.rp = true; closeCall(board, { fenBefore: fen0, fenAfter: g.fen(), mv: m, crew, secs: spent.toFixed(1) }).then(() => { if (!S.stopped) solved(m, sac); }); return; }
    S.rp = false; ended = true; S.ok++; S.streak++; S.best = Math.max(S.best, S.streak); if (!hinted) { record(mode, p, true); clearMiss('d:' + mode + ':' + p.id); }
    if (!hinted && (!S.bestMv || (p.swing || 0) + (sac ? 50 : 0) > S.bestMv.score)) S.bestMv = { san: p.san, swing: p.swing || 0, secs: spent, score: (p.swing || 0) + (sac ? 50 : 0) };
    S.mrun = 0; S.srun++; if (!hinted) cctRecord(true); if (S.armed && S.srun >= 3) S.storm = true;
    if (!hinted) Pr.onDrillSolve({ mode, id: p.id, spent, budget: M.budget, streak: S.streak, sac });
    document.dispatchEvent(new CustomEvent('mast:drill', { detail: { ok: true, mode, p } }));
    const fast = spent <= M.budget - 3;
    play('success'); if (sac || fast) setTimeout(() => play('brilliant'), 250);
    if (sac) { crew.react('sacrifice', { who: 'Tal', ex: 'excited', vars: vars() }); } else crew.react('solve', { ex: 'excited', vars: vars() });
    crew.silent('Skipper', sac || fast ? 'excited' : 'pleased', 2500);
    const el = sqEl(m.to); sparkAt(el || $('#d-bd')); if (p.swing >= 30) floatAt(el, '+' + fmtEval(p.swing), 'pos'); buzz(15);
    crew.cheer(sac ? 'Tal' : crew.adv); if (sac || fast || S.streak % 5 === 0) crew.cheer('Skipper', { sound: false });
    if (S.streak >= 5 && S.streak % 5 === 0) { confetti(S.streak >= 10 ? 2 : 1); wash(); }
    const beat = !hinted && spent <= gh; if (beat) { S.ghosts++; Pr.onGhost(); clock.ghostBeat(); if (getAnim() !== 'off') { try { floatAt(el || $('#d-bd'), 'Beat the ghost', 'pos'); } catch (_) { } } }
    info(`Solved in ${spent.toFixed(1)}s.${beat ? ` Beat the ghost (${gh}s) · ${S.ghosts} this watch.` : ''}`, 'ok'); hud(); next(true, `Played ${p.san}.${sac ? ' A sacrifice, nicely done.' : ''}`);
  }
  function miss(why, playedSan, toSq) {
    if (ended) return; ended = true; if (!locked) stopClock();
    if (!S.worst || (p.swing || 0) >= S.worst.swing) S.worst = { fen: p.fen, san: p.san, played: p.played, swing: p.swing || 0, mv: p.sol[0] };
    S.streak = 0; cctRecord(false); record(mode, p, false); noteMiss({ k: 'd:' + mode + ':' + p.id, fen: p.fen, sol: p.sol, san: p.san, played: p.played, link: p.src && p.src.Link || '' }); S.srun = 0; S.mrun++; if (S.mrun >= 3) S.armed = true; if (why === 'flag') S.flags++; Pr.onDrillMiss({ mode }); document.dispatchEvent(new CustomEvent('mast:drill', { detail: { ok: false, mode, p, played: playedSan } })); play('fail'); buzz([20, 40, 20]); shake($('.dr'));
    const mate = p.themes.some(t => String(t).startsWith('mate'));
    const ev = mode === 'convert' ? 'blunder_when_winning' : mate ? 'missed_mate' : 'fail';
    crew.react(ev, { who: mate && mode !== 'convert' ? 'Leela' : crew.adv, ex: 'disappointed', vars: vars(playedSan) });
    crew.silent('Skipper', 'disappointed', 3000);
    const u = p.sol[k] || p.sol[0], gg = new Chess(p.fen); for (let q = 0; q < k; q++) gg.move({ from: p.sol[q].slice(0, 2), to: p.sol[q].slice(2, 4), promotion: p.sol[q][4] });
    board.setPosition(gg.fen(), { animate: false }); board.setLegal({}); board.showArrow(u.slice(0, 2), u.slice(2, 4), '#3FB37F');
    if (p.swing >= 30) floatAt(sqEl(toSq || u.slice(2, 4)), '\u2212' + fmtEval(p.swing), 'neg');
    info(why === 'flag' ? 'Flag. Out of time.' : 'Not quite.', 'bad'); hud();
    next(false, `${why === 'flag' ? 'Time ran out. ' : ''}Best was <b>${p.san}</b>. In your game you played <b>${p.played}</b>.`);
  }
  function next(ok, msg) {
    const last = S.i + 1 >= list.length;
    $('#d-res').innerHTML = `<div class="panel"><p>${msg}</p>${ok && p.played ? `<p class="sub sm">In your game you played <b>${p.played}</b>.</p>` : ''}<div class="row mt2"><button class="btn" id="d-next">${last ? 'See results' : 'Next position'}</button></div></div>`;
    const b = $('#d-next'); b.onclick = () => { S.i++; last ? summary() : load(); }; b.focus({ preventScroll: true });
  }
  function summary() {
    S.mqOff && S.mqOff(); S.introOff && S.introOff(); clock.destroy(); crew.destroy(); stormer.destroy(); board.destroy();
    const avg = S.times.length ? S.times.reduce((a, b) => a + b, 0) / S.times.length : 0;
    const real = mode === 'tempo' ? clk.seconds_per_move_by_bucket['11-20'].median : clk.median_move_s;
    const entry = { t: Date.now(), mode, name: M.name, ok: S.ok, n: list.length, avg, real, budget: M.budget, best: S.best, worst: S.worst || null, bestMv: S.bestMv || null, advisor: crew.adv || 'Skipper', flags: S.flags, ghosts: S.ghosts, gtot: Pr.ghostTotal() };
    Resume.clear('drill');
    saveLog(entry); showLog(root, entry);
    if (S.ok >= 8) { wash(); confetti(1); } buzz(15);
    root.querySelector('#d-again').onclick = () => { stopDrills(); live = launch(root, mode, D2, clk); };
    S.stopped = true; S.done = true;
    Pr.onSession({ mode, ok: S.ok, n: list.length, avg, flags: S.flags, best: S.best, storm: S.storm });
    document.dispatchEvent(new CustomEvent('mast:drillend', { detail: { mode } }));
  }
  if (!list.length) { root.innerHTML = '<div class="state"><p class="line">Nothing to drill here yet.</p></div>'; return { stop() { } }; }
  const hb = $('#d-hint');
  hb.onclick = () => { if (S.hintUsed || locked || ended || S.stopped) return; S.hintUsed = hinted = true; board.spyglass(p.sol[k].slice(0, 2)); hb.disabled = true; hb.textContent = 'Spyglass used'; play('tick'); };
  const onMate = () => { crew.cheer(crew.adv); sparkAt($('#d-bd')); }; $('#d-bd').addEventListener('mast:mate', onMate);
  hydrate(root); load();
  return { stop() { S.stopped = true; S.mqOff && S.mqOff(); S.introOff && S.introOff(); timers.forEach(clearTimeout); clearInterval(S.poll); if (!S.done) { clock.destroy(); crew.destroy(); stormer.destroy(); try { board.destroy(); } catch (_) { } } } };
}
