import { photo } from './photo.js';
// Play the crew (#play, #play/tempo): opponent select, game vs in-browser Stockfish with each master's real opening repertoire.
import { Board } from './board2.js';
import { PressureClock } from './clock.js';
import { storm } from './drama.js';
import { Crew, fmtEval } from './crew.js';
import { play as sfx } from './sound.js';
import { figure, figCSS } from './figures.js';
import { CH } from './portraits.js';
import { outfitOf } from './crewstate.js';
import * as Pr from './progress.js';
import { store, avatar, hydrate, state, loadingState, errorState } from './ui.js';
import { getEngine, engineLoading, EvalBar, scoreWhite, fen4 } from './engine.js';
import { full, confetti, wash } from './fx.js';
import * as Resume from './resume.js';

const $ = s => document.querySelector(s), wait = ms => new Promise(r => setTimeout(r, ms));
import { loadJSON as j } from './data.js';
export const OPP = {
  Morphy: { elo: 1100, rep: 1, style: 'dev', bias: 'Develops fast, opens lines, hunts the king.' },
  Capablanca: { elo: 1250, rep: 1, style: 'simp', bias: 'Trades down when ahead and wins the endgame.' },
  Tal: { elo: 1350, rep: 1, style: 'attack', bias: 'Prefers checks, captures and sacrifices.' },
  Kasparov: { elo: 1550, rep: 1, style: 'active', bias: 'Active, central, always taking the initiative.' },
  Carlsen: { elo: 1600, rep: 1, style: 'quiet', bias: 'Quiet improving moves; squeezes until you crack.' },
  Leela: { elo: 1800, rep: 0, style: null, bias: 'Neural net. Engine from move one, no book.' },
  Tempo: { elo: null, rep: 0, style: null, bias: 'Full engine strength. Never rushed.' }
};
const TCS = [{ id: '3+2', s: 180, inc: 2 }, { id: '5+3', s: 300, inc: 3 }, { id: '10+5', s: 600, inc: 5 }];
const V = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const eloOf = n => n === 'Tempo' ? null : (store.get('oppelo', {}) || {})[n] || OPP[n].elo;
const recOf = n => (store.get('plrec', {}) || {})[n] || { w: 0, d: 0, l: 0 };
export const savedGames = () => store.get('games', []) || [];
let CHARS = null; const chars = () => CHARS || (CHARS = j('data/characters.json').then(x => x.characters));
let REP = null; const repertoire = () => REP || (REP = j('data/repertoire.json').catch(() => ({})));

const CSS = `
.pl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:var(--s2);margin-top:var(--s3)}
.pl-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:var(--s2) var(--s2) var(--s2);border-radius:var(--r-lg);background:var(--glass);border:1px solid var(--glass-b);cursor:pointer;text-align:center;color:inherit;font:inherit;transition:border-color .25s,background .25s,transform .25s var(--ease)}
.pl-card:hover{border-color:var(--ac,var(--a));background:var(--glass-h)}
.pl-card.on{border-color:var(--ac,var(--a));box-shadow:0 0 0 2px color-mix(in srgb,var(--ac,var(--a)) 45%,transparent),0 0 24px color-mix(in srgb,var(--ac,var(--a)) 30%,transparent)}
.pl-card .pl-fig{height:150px;display:flex;align-items:flex-end;justify-content:center}.pl-card .pl-ph .ph{width:120px;height:120px;margin:0 auto 14px}@media(max-width:560px){.pl-card .pl-ph .ph{width:96px;height:96px}}.pl-card .pl-fig .fig{height:150px;width:auto}
.pl-card b{font:700 15px var(--f-disp);letter-spacing:.14em;text-transform:uppercase}.pl-card .elo{font:600 12px var(--f-disp);letter-spacing:.1em;color:var(--ac,var(--a))}
.pl-card .sub{font-size:11.5px;line-height:1.3;color:var(--dim);min-height:2.6em}.pl-card .rec{font-size:11px;color:var(--dim);letter-spacing:.08em}
.pl-card.lock .pl-fig{filter:brightness(.38) grayscale(1) blur(1.5px)}.pl-card.lock .pl-fig .ph{border-radius:50%}.pl-card.lock .lk{font-size:26px;top:50%;left:50%;right:auto;transform:translate(-50%,-70%);z-index:2;filter:none}.pl-card.lock{cursor:default}.pl-card .lk{position:absolute;top:8px;right:10px;font-size:15px}
.pl-card.boss{grid-column:1/-1;flex-direction:row;justify-content:center;gap:var(--s3);text-align:left}.pl-card .tx{display:flex;flex-direction:column;align-items:center;gap:2px}.pl-card.boss .tx{align-items:flex-start;max-width:340px}
.pl-cfg{margin-top:var(--s3);display:flex;flex-direction:column;gap:var(--s2);padding:var(--s3);border-radius:var(--r-lg);background:var(--glass);border:1px solid var(--glass-b)}
.pl-note{display:flex;gap:var(--s2);align-items:center;font-size:13px;color:var(--dim);padding:8px 12px;border-radius:var(--r-md);border:1px solid var(--glass-b);background:var(--glass-h)}
.pl-top{display:grid;grid-template-columns:1fr 1fr;gap:var(--s2);align-items:center}
.pl-p{display:flex;align-items:center;gap:8px;min-width:0}.pl-p.me{justify-content:flex-end}.pl-p .nm{display:flex;flex-direction:column;min-width:0;font:700 13px var(--f-disp);letter-spacing:.1em;text-transform:uppercase}
.pl-p .nm small{font:500 11px var(--f-body,inherit);letter-spacing:.04em;color:var(--dim);text-transform:none}.pl-p .pclk{width:84px;flex:none}
.pl-p.turn .pclk{filter:drop-shadow(0 0 8px color-mix(in srgb,var(--a) 55%,transparent))}
.pl-bw{display:flex;gap:6px;margin-top:6px}.pl-bw #bd{flex:1;min-width:0}
.pl-mv{display:flex;flex-wrap:wrap;gap:2px 8px;max-height:150px;overflow:auto;font:600 13px var(--f-body,inherit);color:var(--dim)}.pl-mv b{color:var(--fg);font-weight:700}.pl-mv i{font-style:normal;opacity:.6}
.pl-ov{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:16px;background:rgba(4,10,16,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.pl-box{width:min(420px,100%);max-height:calc(100dvh - 32px);overflow:auto;display:flex;flex-direction:column;align-items:center;gap:var(--s1);text-align:center;padding:var(--s3);border-radius:var(--r-lg);background:var(--glass-h);border:1px solid var(--glass-b);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.pl-box .fig{height:170px;width:auto}.pl-box h2{margin:0}.pl-box q{font-style:italic;color:var(--fg);display:block;max-width:34ch}
.pl-box .row{justify-content:center;flex-wrap:wrap}.pl-box .xp{font:700 20px var(--f-disp);letter-spacing:.1em;color:var(--a)}
@media(max-width:560px){.pl-grid{grid-template-columns:repeat(2,1fr)}.pl-card .pl-fig,.pl-card .pl-fig .fig{height:118px}.pl-p .pclk{width:66px}.pl-av{display:none}.pl-p{gap:6px}.pl-card.boss{flex-direction:column;text-align:center}.pl-card.boss .tx{align-items:center}.pl-p .nm small{display:none}}
html[data-anim=off] .pl-card{transition:none}
.pl-h{margin:0;font-size:clamp(22px,3vw,34px)}@media(max-height:820px),(max-width:560px){.pl-h{display:none}}`;
function css() { if (document.getElementById('mast-play-css')) return; const s = document.createElement('style'); s.id = 'mast-play-css'; s.textContent = CSS; document.head.appendChild(s); }

/* ---------- live game handle (for cleanup) ---------- */
let G = null; export const gameHandle = () => G;
export function stopPlay() {
  if (!G) return; const g = G; G = null; g.over = true; g.dead = true;
  try { g.clkM.destroy(); g.clkO.destroy(); } catch (_) { } try { g.stm.destroy(); } catch (_) { } try { g.board.destroy(); } catch (_) { } try { g.crew.destroy(); } catch (_) { }
  getEngine().stop(); document.querySelectorAll('.pl-ov').forEach(o => o.remove());
}
const modal = html => { const o = document.createElement('div'); o.className = 'pl-ov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.innerHTML = `<div class="pl-box">${html}</div>`; document.body.appendChild(o); return o; };

/* ---------- select screen ---------- */
export async function playScreen(ctx, arg) {
  css(); stopPlay(); const { render, topbar, D } = ctx; figCSS();
  { const rs = !arg && Resume.consume('play'); if (rs && OPP[rs.opp] && TCS.find(t => t.id === rs.tc)) return startGame(ctx, { opp: rs.opp, tc: TCS.find(t => t.id === rs.tc), color: rs.color, lines: await chars().catch(() => ({})), resume: rs }); }
  const pick = arg && OPP[arg[0].toUpperCase() + arg.slice(1)] ? arg[0].toUpperCase() + arg.slice(1) : null;
  const tempoOK = Pr.tempoUnlocked();
  if (arg === 'tempo' && !tempoOK) {
    render(`${topbar}<span class="k">Final boss</span><h1>Tempo</h1>${state({ who: 'Tempo', ex: 'pleased', title: "Tempo's Rock is still under the horizon", line: 'Conquer all six island bosses on the Voyage chart and his rock rises from the sea.', slot: true, action: '<a class="btn" href="#voyage">To the chart</a>' })}`); return;
  }
  const lines = await chars().catch(() => ({}));
  const names = ['Morphy', 'Capablanca', 'Tal', 'Kasparov', 'Carlsen', 'Leela', 'Tempo'];
  let sel = pick || null, tc = store.get('pltc', '3+2'), col = store.get('plcol', 'random');
  const card = n => {
    const o = OPP[n], lock = n === 'Tempo' && !tempoOK, e = eloOf(n), r = recOf(n), tl = (lines[n] || {}).tagline || '';
    return `<button type="button" class="pl-card ${n === 'Tempo' ? 'boss' : ''} ${lock ? 'lock' : ''}" data-n="${n}" style="--ac:${CH[n].acc}" ${lock ? 'aria-disabled="true"' : ''} aria-label="${n}${lock ? ', locked' : ''}">
      ${lock ? '<span class="lk" aria-hidden="true">\u{1F512}</span>' : ''}<div class="pl-fig pl-ph">${photo(n, n === 'Tempo' ? 'char' : 'pleased')}</div>
      <div class="tx"><b>${n}</b><span class="elo">${e ? '~' + e : 'Full strength'}</span><span class="sub">${lock ? "Locked: conquer all six islands." : (tl || o.bias)}</span><span class="rec">W${r.w} D${r.d} L${r.l}</span></div></button>`;
  };
  render(`${topbar}<span class="k">Helm</span><h1>Play the crew</h1><p class="sub mt1">Pick an opponent. Each plays their real opening repertoire, then the engine takes over. The rating adapts after every game.</p>
   <div class="pl-grid">${names.map(card).join('')}</div><div id="cfg"></div>`);
  const cfg = $('#cfg');
  const paintCfg = () => {
    view_cards(); if (!sel) { cfg.innerHTML = ''; return; }
    cfg.innerHTML = `<div class="pl-cfg"><div class="row tight">${avatar(sel)}<div><b>${sel}</b><br><span class="sub sm">${OPP[sel].bias}</span></div></div>
      <span class="k">Time control</span><div class="chips">${TCS.map(t => `<button type="button" class="chip ${t.id === tc ? 'on' : ''}" data-tc="${t.id}">${t.id}</button>`).join('')}</div>
      ${tc === '10+5' ? `<div class="pl-note">${avatar('Carlsen')}<span>Slower games build skill. At 10+5 you have time to find the plan and catch your own blunders. That is where rating comes from.</span></div>` : ''}
      <span class="k">Your colour</span><div class="chips">${['white', 'random', 'black'].map(c => `<button type="button" class="chip ${c === col ? 'on' : ''}" data-col="${c}">${c}</button>`).join('')}</div>
      <div class="row"><button class="btn" id="go">Start game</button></div></div>`;
    hydrate(cfg);
    cfg.querySelectorAll('[data-tc]').forEach(b => b.onclick = () => { tc = b.dataset.tc; store.set('pltc', tc); paintCfg(); });
    cfg.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { col = b.dataset.col; store.set('plcol', col); paintCfg(); });
    $('#go').onclick = () => startGame(ctx, { opp: sel, tc: TCS.find(t => t.id === tc), color: col === 'random' ? (Math.random() < .5 ? 'white' : 'black') : col, lines });
  };
  const view_cards = () => document.querySelectorAll('.pl-card').forEach(c => c.classList.toggle('on', c.dataset.n === sel));
  document.querySelectorAll('.pl-card').forEach(c => c.onclick = () => { if (c.classList.contains('lock')) { location.hash = 'voyage'; return; } sel = c.dataset.n; paintCfg(); cfg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  paintCfg(); if (pick) cfg.scrollIntoView({ block: 'nearest' });
}

/* ---------- move feature scoring (personality) ---------- */
function feat(g, uci) {
  const turnW = g.turn() === 'w', m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' }); if (!m) return null;
  const f = { from: m.from, to: m.to, piece: m.piece, cap: !!m.captured, capv: V[m.captured] || 0, mv: V[m.piece], chk: g.in_check(), flags: m.flags, white: turnW };
  f.sac = g.moves({ verbose: true }).some(x => x.to === m.to && x.captured) && f.mv > f.capv + 0.5; g.undo(); return f;
}
const BIAS = {
  dev: (f, c) => (c.ply < 24 ? ((f.piece === 'n' || f.piece === 'b') && f.from[1] === (f.white ? '1' : '8') ? 2 : 0) + (/[kq]/.test(f.flags) ? 2 : 0) + (f.piece === 'p' && 'de'.includes(f.to[0]) ? .8 : 0) : 0) + (f.chk ? .5 : 0) + (f.piece !== 'p' && !f.cap ? .2 : 0),
  attack: f => (f.chk ? 2 : 0) + (f.cap ? 1.5 : 0) + (f.sac ? 2.5 : 0),
  simp: (f, c) => c.ahead && f.cap && f.capv >= f.mv ? 2.2 : (c.ahead && f.cap ? .8 : 0),
  quiet: f => (!f.cap && !f.chk ? 1.2 : 0) + (f.piece !== 'p' && f.piece !== 'k' ? .4 : 0),
  active: f => (['d4', 'e4', 'd5', 'e5'].includes(f.to) ? 1.1 : /^[c-f][3-6]$/.test(f.to) ? .6 : 0) + (f.chk ? .7 : 0) + (f.cap ? .5 : 0)
};

/* ---------- the game ---------- */
async function startGame(ctx, { opp, tc, color, lines, resume }) {
  const { render, topbar } = ctx; css(); stopPlay();
  render(`${topbar}${loadingState('Waking the engine room...')}`);
  const eng = getEngine();
  try { await eng.init(); } catch (e) { render(`${topbar}${errorState('The engine would not start. Is this browser blocking web workers?')}`); const b = $('#retry-load'); if (b) b.onclick = () => startGame(ctx, { opp, tc, color, lines }); return; }
  const rep = OPP[opp].rep ? await repertoire() : {}, elo = eloOf(opp), userW = color === 'white', O = OPP[opp];
  if (opp === 'Tempo') await tempoIntro(lines);
  const acc = CH[opp].acc;
  render(`${topbar}<h1 class="pl-h">Vs ${opp}</h1><div class="pz"><div>
    <div class="pl-top"><div class="pl-p opp" id="po"><span class="pl-av">${avatar(opp)}</span><div class="nm">${opp}<small>${elo ? '~' + elo : 'Full strength'}</small></div><div id="clk-o"></div></div>
     <div class="pl-p me" id="pm"><div id="clk-m"></div><div class="nm">You<small>${tc.id}</small></div></div></div>
    <div class="pl-bw"><div id="evb" hidden></div><div id="bd"></div></div><div id="crew"></div></div>
   <div class="side"><div class="panel"><div class="status" id="pst"></div><div class="row tight"><button class="btn ghost sm" id="rs" type="button">Resign</button><button class="btn ghost sm" id="evt" type="button" aria-pressed="false">Show eval</button></div></div>
    <div class="panel"><span class="k">Moves</span><div class="pl-mv" id="mv"></div></div></div></div>`);
  hydrate(view$());
  const g = new Chess(), moves = [], clk = [];
  const c = { dead: false, over: false, board: null, crew: null, stm: null, clkM: null, clkO: null };
  G = c; Object.assign(c, { g });
  const evb = new EvalBar($('#evb'), { flip: !userW }); let evOn = false;
  $('#evt').onclick = e => { evOn = !evOn; $('#evb').hidden = !evOn; e.currentTarget.setAttribute('aria-pressed', evOn); e.currentTarget.textContent = evOn ? 'Hide eval' : 'Show eval'; };
  const legal = () => { const m = {}; g.moves({ verbose: true }).forEach(x => (m[x.from] ??= []).push(x.to)); return m; };
  const userColor = userW ? 'w' : 'b', uciOf = m => m.from + m.to + (m.promotion || '');
  const b = c.board = new Board($('#bd'), { orientation: color, coords: true, onMove: (from, to, promo) => {
    if (c.over || c.dead || g.turn() !== userColor || c.busy) return false;
    const m = g.move({ from, to, promotion: promo || 'q' }); if (!m) return false;
    setTimeout(() => afterMove(m, 'user'), 0); return true;
  } });
  b.setPosition(g.fen(), { animate: false }); b.setLegal({}); b.setTurn(color, false);
  const crew = c.crew = new Crew($('#crew'), lines); crew.setAdvisor(opp);
  const stm = c.stm = storm(b);
  const mkClk = (el, own) => new PressureClock(el, { seconds: tc.s, increment: tc.inc, glass: false, onState: own ? s => stm.set(s) : () => { }, onFlag: () => end(own ? (userW ? '0-1' : '1-0') : (userW ? '1-0' : '0-1'), 'time') });
  const clkM = c.clkM = mkClk($('#clk-m'), true), clkO = c.clkO = mkClk($('#clk-o'), false);
  const status = t => { const e = $('#pst'); if (e) e.textContent = t; };
  const turnUI = () => { $('#pm').classList.toggle('turn', g.turn() === userColor); $('#po').classList.toggle('turn', g.turn() !== userColor); };
  let lastReact = 0, trouble = false, endg = false, book = !!(O.rep && rep[opp]), userEval = null /* user persp, position now */, prevUserEval = null, anaTok = 0;
  const react = (ev, o = {}) => { if (c.dead) return; const now = Date.now(); if (!o.force && now - lastReact < 9000) return; lastReact = now; crew.react(ev, { who: opp, ex: 'pleased', ...o }); };
  const sanList = () => { const mv = $('#mv'); if (!mv) return; mv.innerHTML = moves.map((m, i) => (i % 2 === 0 ? `<i>${i / 2 + 1}.</i>` : '') + `<b>${m.san}</b>`).join(' '); mv.scrollTop = 9e5; };
  const matDown = () => { let n = 0; g.board().forEach(r => r.forEach(p => { if (p && p.type !== 'p' && p.type !== 'k') n += V[p.type]; })); return n; };

  function afterMove(m, by) {
    const ply = moves.length; moves.push({ san: m.san, uci: uciOf(m) });
    document.dispatchEvent(new CustomEvent('mast:playmove', { detail: { opp, color, sans: moves.map(x => x.san), by } }));
    const mover = by === 'user' ? clkM : clkO, other = by === 'user' ? clkO : clkM;
    mover.pause(); if (ply >= 1) mover.addTime(tc.inc); clk.push(Math.round(mover.remaining() * 10) / 10);
    sfx(g.in_check() ? 'check' : m.captured ? 'capture' : 'move'); sanList();
    if (by === 'opp') b.setPosition(g.fen(), { animate: true, lastMove: { from: m.from, to: m.to }, check: g.in_check() });
    else b.setPosition(g.fen(), { animate: false, lastMove: { from: m.from, to: m.to }, check: g.in_check() });
    if (g.in_checkmate()) { b.checkmate(); return end(by === 'user' ? (userW ? '1-0' : '0-1') : (userW ? '0-1' : '1-0'), 'checkmate'); }
    if (g.in_stalemate()) return end('1/2-1/2', 'stalemate');
    if (g.in_draw()) return end('1/2-1/2', g.in_threefold_repetition() ? 'repetition' : g.insufficient_material() ? 'insufficient material' : '50-move rule');
    if (moves.length >= 1) other.start(); turnUI();
    if (!endg && matDown() <= 14 && moves.length > 20) { endg = true; react('endgame'); }
    Resume.save('play', { opp, tc: tc.id, color, uci: moves.map(x => x.uci), clk: clk.slice(), clkM: clkM.remaining(), clkO: clkO.remaining() });
    if (by === 'user') { b.setLegal({}); b.setTurn(userW ? 'black' : 'white', false); status(opp + ' is thinking...'); judgeAndReply(m); }
    else { b.setLegal(legal()); b.setTurn(color, true); status('Your move.'); background(); }
  }
  /* idle-time analysis of the position the user faces: eval before their move, best reply, "only move" detection */
  async function background() {
    const tok = ++anaTok, fen = g.fen(); c.ana = null;
    const r = await eng.analyse(fen, { depth: 9, multipv: 2, timeout: 8000, cancelled: () => c.dead || tok !== anaTok }).catch(() => null);
    if (!r || !r.lines.length || c.dead || tok !== anaTok) return;
    const w = scoreWhite(r.lines[0], fen), u = userW ? w : -w; c.ana = { best: r.bestmove, u, only: r.lines[1] ? (r.lines[0].score.cp != null && r.lines[1].score.cp != null && r.lines[0].score.cp - r.lines[1].score.cp >= 130) : false, bestSan: sanOf(fen, r.bestmove) };
    evb.set(w, r.lines[0].score.mate != null ? (w > 0 ? Math.abs(r.lines[0].score.mate) : -Math.abs(r.lines[0].score.mate)) : undefined);
    if (prevUserEval != null && u - prevUserEval >= 150 && prevUserEval <= -100) react('blunder_when_winning', { ex: 'disappointed', vars: { eval: fmtEval(prevUserEval) } });
    userEval = u;
  }
  const sanOf = (fen, uci) => { try { const t = new Chess(fen), m = t.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' }); return m ? m.san : uci; } catch (_) { return uci || ''; } };
  async function judgeAndReply(userMove) {
    const t0 = performance.now(), ana = c.ana; c.busy = true; let res = null, uci = null, fromBook = false;
    const fenNow = g.fen();
    if (book) { uci = bookMove(); if (uci) { fromBook = true; await wait(450 + Math.random() * 900); } else { book = false; } }
    if (c.dead || c.over) return;
    const rem = clkO.remaining(), elo_ = opp === 'Tempo' ? null : eloOf(opp);
    {
      const mt = fromBook ? 0 : Math.round(Math.max(120, Math.min(opp === 'Tempo' ? 2000 : 1300, rem * 1000 / (opp === 'Tempo' ? 22 : 35))) * (rem < 8 ? .3 : 1));
      if (fromBook) res = await eng.analyse(fenNow, { depth: 8, multipv: 1, timeout: 6000, cancelled: () => c.dead }).catch(() => null);
      else res = await eng.analyse(fenNow, { movetime: mt, multipv: O.style ? 3 : 1, elo: elo_ ?? undefined, cancelled: () => c.dead }).catch(() => null);
    }
    if (c.dead || c.over) return;
    // judge the user's move from the eval of the position after it
    if (res && res.lines.length) {
      const wAfterUser = scoreWhite(res.lines[0], fenNow), u = userW ? wAfterUser : -wAfterUser; // eval of position after user's move, White persp -> user persp
      evb.set(wAfterUser, res.lines[0].score.mate != null ? (wAfterUser > 0 ? Math.abs(res.lines[0].score.mate) : -Math.abs(res.lines[0].score.mate)) : undefined);
      if (ana && ana.u != null) {
        const swing = u - ana.u, played = userMove.san, move = ana.bestSan || '...';
        if (swing <= -150 && userMove.from + userMove.to !== (ana.best || '').slice(0, 4)) { react('fail', { ex: 'excited', vars: { played, move, eval: fmtEval(u) }, force: swing <= -300 }); crew.silent('Skipper', 'disappointed', 2800); }
        else if (ana.only && uciOf(userMove) === ana.best) { react('solve', { ex: 'excited', vars: { move: played }, force: true }); crew.silent('Skipper', 'pleased', 2500); sfx('success'); }
      }
      prevUserEval = u; userEval = u;
    }
    if (!uci) uci = res ? pickEngine(res, fenNow) : null;
    if (!uci) { const ms = g.moves({ verbose: true }); const m = ms[Math.floor(Math.random() * ms.length)]; uci = m.from + m.to + (m.promotion || ''); }
    // human-ish pacing
    const spent = performance.now() - t0, floor = fromBook ? 0 : 350; if (spent < floor) await wait(floor - spent);
    if (c.dead || c.over) return; c.busy = false;
    const m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' });
    if (!m) { c.busy = false; return; }
    if (!trouble && clkM.remaining() < 10 && moves.length > 8) { trouble = true; react('time_trouble', { who: opp, ex: 'pleased', vars: { secs: Math.ceil(clkM.remaining()) }, force: true }); }
    afterMove(m, 'opp');
  }
  function bookMove() {
    const t = (rep[opp] || {}).tree || {}, e = t[fen4(g)]; if (!e || !e.length) return null;
    const tot = e.reduce((a, x) => a + x[1], 0); let r = Math.random() * tot, pick = e[0][0];
    for (const [u, n] of e) { r -= n; if (r <= 0) { pick = u; break; } }
    return g.moves({ verbose: true }).some(m => m.from + m.to + (m.promotion || '') === pick) ? pick : null;
  }
  function pickEngine(res, fen) {
    const ls = res.lines.filter(l => l.pv && l.pv[0]);
    if (!ls.length) return res.bestmove;
    if (!O.style || ls.length < 2) return res.bestmove || ls[0].pv[0];
    const top = ls[0].score.cp != null ? ls[0].score.cp : (ls[0].score.mate > 0 ? 9999 : -9999), margin = opp === 'Tal' ? 70 : 40;
    const cand = ls.filter(l => (l.score.cp != null ? l.score.cp : (l.score.mate > 0 ? 9999 : -9999)) >= top - margin).map(l => l.pv[0]);
    if (res.bestmove && !cand.includes(res.bestmove)) cand.push(res.bestmove);
    const ctx_ = { ply: moves.length, ahead: top >= 80 };
    let best = null, bs = -9;
    for (const u of cand) { const f = feat(g, u); if (!f) continue; const s = (BIAS[O.style](f, ctx_) || 0) + (u === res.bestmove ? 1.2 : 0) + Math.random() * .5; if (s > bs) { bs = s; best = u; }
      if (opp === 'Tal' && f.sac && u === best) c.salute = true; }
    if (c.salute) { c.salute = false; react('sacrifice', { who: 'Tal', ex: 'excited' }); }
    return best || res.bestmove;
  }
  /* ---------- end ---------- */
  async function end(result, reason) {
    if (c.over) return; c.over = true; Resume.clear('play'); clkM.pause(); clkO.pause(); eng.stop(); stm.set('calm'); b.setLegal({}); b.setTurn(color, false); document.body.classList.remove('critical', 'hb');
    const win = result === (userW ? '1-0' : '0-1'), draw = result === '1/2-1/2', score = win ? 1 : draw ? .5 : 0;
    status(win ? 'You won.' : draw ? 'Drawn.' : 'You lost.');
    // rating, record, xp
    const E = store.get('oppelo', {}) || {}, R = store.get('plrec', {}) || {}, rec = R[opp] = R[opp] || { w: 0, d: 0, l: 0 };
    if (opp !== 'Tempo') { const e0 = eloOf(opp); E[opp] = Math.max(800, Math.min(2800, e0 + (win ? 50 : draw ? 0 : -50))); store.set('oppelo', E); }
    rec[win ? 'w' : draw ? 'd' : 'l']++; store.set('plrec', R);
    const bonus = win ? (opp === 'Tempo' ? 200 : 30 + Math.round(((eloOf(opp) || 2000) - 1000) / 40)) : draw ? 12 : 5;
    let xp = 0; try { xp = Pr.addXp(bonus, 'game') || 0; Pr.onSession({ mode: 'play', ok: win ? 1 : 0, n: 1, avg: 0, flags: 0, best: 0, storm: false }); xp += 25; } catch (_) { }
    if (win && opp === 'Tempo') store.set('tempoBeaten', Date.now());
    // save pgn
    const id = 'g' + Date.now().toString(36), now = new Date(), pad = n => String(n).padStart(2, '0'), d = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
    const hdr = (k, v) => `[${k} "${v}"]`, wn = userW ? 'Skipper' : opp, bn = userW ? opp : 'Skipper';
    const clkS = s => { const t = Math.max(0, s); return `${Math.floor(t / 3600)}:${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t % 60))}.${Math.floor((t % 1) * 10)}`; };
    const body = moves.map((m, i) => `${i % 2 === 0 ? (i / 2 + 1) + '. ' : ''}${m.san} {[%clk ${clkS(clk[i] ?? 0)}]}`).join(' ');
    const pgn = [hdr('Event', 'Mast: play the crew'), hdr('Site', 'Mast'), hdr('Date', d), hdr('White', wn), hdr('Black', bn), hdr('Result', result), hdr('TimeControl', `${tc.s}+${tc.inc}`), hdr('Termination', reason), hdr('Opponent', opp), hdr('OppElo', String(eloOf(opp) || 'max')), hdr('SkipperColor', color)].join('\n') + '\n\n' + body + ' ' + result;
    const L = savedGames(); L.unshift({ id, t: Date.now(), opp, color, tc: tc.id, result, reason, pgn }); store.set('games', L.slice(0, 40));
    document.dispatchEvent(new CustomEvent('mast:playend', { detail: { opp, color, win, draw, result, reason, id, sans: moves.map(x => x.san) } }));
    // outcome sounds + lines
    sfx(win ? 'brilliant' : draw ? 'move' : 'fail'); if (win && full()) { confetti(opp === 'Tempo' ? 3 : 1); if (opp === 'Tempo') wash(); }
    const oLines = ((lines[opp] || {}).lines) || {};
    let quote = '';
    if (opp === 'Tempo') quote = win ? pickOne(oLines.lose) : pickOne(oLines.beat_master);
    else if (win) quote = pickOne((lines.Skipper || { lines: {} }).lines.solve || []).replace(/\{(\w+)\}/g, (_, k) => k === 'move' ? (moves[moves.length - 1] || {}).san || '' : '');
    else quote = pickOne(oLines.solve || []).replace(/\{(\w+)\}/g, (_, k) => k === 'move' ? (moves[moves.length - 1] || {}).san || '' : '');
    crew.silent(opp, win ? 'disappointed' : 'excited', 5000); crew.silent('Skipper', win ? 'excited' : 'disappointed', 5000);
    await wait(win || draw || reason !== 'checkmate' ? 500 : 1100); if (c.dead) return;
    const head = win ? `You beat ${opp}` : draw ? `Drawn with ${opp}` : `${opp} wins`;
    const o = modal(`<span class="k">${reason}</span><div class="pl-ph" style="width:120px;height:120px;margin:8px auto">${photo(opp, win ? 'disappointed' : 'excited')}</div><h2>${head}</h2><q>${esc(quote)}</q>
      <div class="xp">+${xp} XP</div><p class="sub sm">${opp === 'Tempo' ? '' : `${opp} now plays around ~${eloOf(opp)}. `}Saved to your log.</p>
      <div class="row"><a class="btn" href="#review/c-${id}" id="rv">Review this game</a><button class="btn ghost" id="rm" type="button">Rematch</button><a class="btn ghost" href="#play">Opponents</a></div><button class="btn ghost sm" id="cl" type="button">Close</button>`);
    o.querySelector('#rm').onclick = () => { o.remove(); startGame(ctx, { opp, tc, color: color === 'white' ? 'black' : 'white', lines }); };
    o.querySelector('#cl').onclick = () => o.remove(); o.querySelector('#rv').focus();
  }
  $('#rs').onclick = e => { const bt = e.currentTarget; if (c.over || bt.style.display === "none") return; const box = document.createElement('span'); box.className = 'row tight'; box.setAttribute('role', 'group'); box.innerHTML = '<b style="align-self:center">Resign?</b><button class="btn sm" type="button" data-y>Yes</button><button class="btn ghost sm" type="button" data-n>No</button>'; bt.style.display = "none"; bt.after(box); box.querySelector('[data-y]').onclick = () => { box.remove(); end(userW ? '0-1' : '1-0', 'resignation'); }; box.querySelector('[data-n]').onclick = () => { box.remove(); bt.style.display = ""; bt.focus(); }; box.querySelector('[data-n]').focus(); };
  if (resume && Array.isArray(resume.uci) && resume.uci.length) { // restore a game in progress: silent replay, then hand the move to whoever has it
    let okAll = true; for (const u of resume.uci) { const m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' }); if (!m) { okAll = false; break; } moves.push({ san: m.san, uci: u }); }
    if (okAll && !g.game_over()) {
      (resume.clk || []).forEach(x => clk.push(x)); const last = g.history({ verbose: true }).pop();
      const setC = (cl, v) => { cl.ms = Math.max(1, v) * 1000; cl.total = Math.max(tc.s, v); cl._render(true); }; setC(clkM, resume.clkM); setC(clkO, resume.clkO);
      b.setPosition(g.fen(), { animate: false, lastMove: last ? { from: last.from, to: last.to } : null, check: g.in_check() }); sanList(); book = false;
      Resume.save('play', { opp, tc: tc.id, color, uci: resume.uci, clk: clk.slice(), clkM: resume.clkM, clkO: resume.clkO });
      turnUI(); react('open', { force: true, ex: 'pleased' });
      if (g.turn() === userColor) { status('Your move. Game resumed.'); b.setLegal(legal()); b.setTurn(color, true); clkM.start(); background(); }
      else { status(opp + ' is thinking...'); b.setLegal({}); b.setTurn(userW ? 'black' : 'white', false); clkO.start(); judgeAndReply({ san: '', from: '', to: '' }); }
      return;
    }
    while (moves.length) { moves.pop(); } g.reset(); Resume.clear('play');
  }
  // go
  turnUI(); status(userW ? 'Your move.' : opp + ' opens...');
  react('open', { force: true, ex: 'pleased' });
  if (userW) { b.setLegal(legal()); b.setTurn(color, true); background(); }
  else judgeAndReplyOpening();
  async function judgeAndReplyOpening() { c.busy = true; await wait(900); const fakeMove = { san: '', from: '', to: '' }; c.ana = null; await judgeAndReply(fakeMove); }
}
const view$ = () => document.querySelector('#view');
const esc = s => String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pickOne = a => a && a.length ? a[Math.floor(Math.random() * a.length)] : '';

async function tempoIntro(lines) {
  const open = (((lines.Tempo || {}).lines) || {}).open || ['Yo. Sit down, relax.'];
  sfx('drums'); return new Promise(res => {
    const o = modal(`<span class="k">The final boss</span><div class="pl-ph" style="width:120px;height:120px;margin:8px auto">${photo('Tempo', 'char')}</div><h2>Tempo</h2><q>${esc(pickOne(open))}</q><p class="sub sm">Full engine strength. He will not rush. Neither should you.</p><div class="row"><button class="btn" id="tp" type="button">Take your seat</button></div>`);
    const b = o.querySelector('#tp'); b.onclick = () => { o.remove(); res(); }; b.focus();
  });
}
