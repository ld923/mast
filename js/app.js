import { Board } from './board2.js';
import { play as sfx, ambient, ambientOn } from './sound.js';
import { mountDeck, cabinSVG, streakCount } from './scene.js';
import { weather as wxNow, WEATHER_WORD, timeOfDay } from './sky.js';
import { Crew, advisorFor, fmtEval } from './crew.js';
import { figure, figCSS } from './figures.js';
import { CH } from './portraits.js';
import { mood, moodEx, outfitOf, setOutfit, outfitPicker, introOnce } from './crewstate.js';
import { drills as drillsScreen, stopDrills } from './drills.js';
import { md } from './md.js';
import { store, getTheme, setTheme, loadIcons, icon, avatar, hydrate, state, loadingState, errorState } from './ui.js';
import { renderVoyage, bumpIsland } from './voyage.js';
import * as Pr from './progress.js';
import { initProgressUI, setBusy, briefHTML, wireBrief, collection as collectionView, trophies as trophiesView, skipperBadge, outfitReveal, bossIntro, bossHud, bossResult } from './prog-ui.js';
import { PressureClock } from './clock.js';
import { storm, getClockStyle, setClockStyle } from './drama.js';
import { postcard as postcardView, logbook, compass as navCompass } from './captain.js';
import { BOARD_THEMES, unlockedThemes, getBoardTheme, setBoardTheme, getBoardView, setBoardView, getRipples, setRipples } from './board2.js';
import { playScreen, stopPlay } from './play.js';
import { reviewScreen, stopReview } from './review.js';
import { chatScreen, getKey, setKey, testKey, hasKey } from './chat.js';
import { photo } from './photo.js';
import { eraScene, eraCaption } from './era.js';
import { level, greeting, rareMoment, LEVELS, affinity, disagreement, isAggressive } from './social.js';
import { initPWA, mountInstallUI, briefInstallCard } from './pwa.js';
import * as Sync from './sync.js';
import { initSecrets, secretsView, wireBackstory } from './secrets.js';
import { coachScreen, stopCoach } from './coach.js';
import { getCCT, setCCT } from './coach-core.js';
import { onSyncAlerts, visitNudge, briefCoachHTML } from './coach3.js';
import { watchScreen, watchDone } from './watch.js';
import { studioScreen } from './voice-studio.js';
import { getMode as getVoiceMode, setMode as setVoiceMode, test as voiceTest, describe as voiceDescribe } from './voice.js';
import { initFx, setAnim, getAnim, setHaptics, getHaptics, full, countAll } from './fx.js';

const $ = s => document.querySelector(s);
const view = $('#view');
const j = u => fetch(u).then(r => r.ok ? r.json() : Promise.reject(u));
const MASTERS = ['Tal', 'Capablanca', 'Morphy', 'Carlsen', 'Kasparov'];
const ROUTES = [['today', 'Today'], ['drills', 'Drills'], ['puzzles', 'Puzzles'], ['coach', 'Coach'], ['voyage', 'Voyage'], ['masters', 'Crew'], ['review', 'Review'], ['play', 'Play']];
const MORE = ['voyage', 'review'];
const WM = '<b>MA<i>S</i>T</b>';
const LOGO = '<svg class="mk" viewBox="0 0 64 64" fill="#C9A24B" aria-hidden="true"><path d="M31 3h2v15h-2z"/><path class="s1" d="M34 5c7 3 11 8 12 13H34z"/><path class="s2" d="M29 8c-4 3-7 6-8 10h8z" opacity=".55"/><path d="M14 20h6v4h4v-4h6v4h4v-4h6v4h4v-4h6v8l-5 3 2 18h4v7H13v-7h4l2-18-5-3z"/></svg>';

/* ---------- shell: nav, settings, splash ---------- */
function buildShell() {
  $('#nav').innerHTML = `<a class="brand" href="#today">${LOGO}${WM}</a>` +
    ROUTES.map(([id, l]) => `<a class="item" data-r="${id}" ${MORE.includes(id) ? 'data-more="1" ' : ''}href="#${id}">${icon(id)}<span>${l}</span></a>`).join('') + `<a class="item more-btn" data-r="more" href="#more" role="button" aria-haspopup="dialog" aria-label="More: Voyage, Review">${icon('more')}<span>More</span></a>`;
  $('#nav .more-btn').onclick = e => { e.preventDefault(); if ($('.co-more')) return; const bg = document.createElement('div'), sh = document.createElement('div'); bg.className = 'co-more-bg'; sh.className = 'co-more'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'More'); sh.innerHTML = MORE.map(id => `<a href="#${id}">${icon(id)}<span>${ROUTES.find(r => r[0] === id)[1]}</span></a>`).join(''); const close = () => { bg.remove(); sh.remove(); }; bg.onclick = close; sh.onclick = close; document.body.append(bg, sh); sh.querySelector('a').focus(); };
  $('#gear').innerHTML = icon('settings');
  const menu = $('#menu'), gear = $('#gear');
  const paint = () => {
    menu.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === getTheme()));
    menu.querySelectorAll('[data-a]').forEach(b => b.classList.toggle('on', b.dataset.a === getAnim()));
    menu.querySelectorAll('[data-h]').forEach(b => b.classList.toggle('on', (b.dataset.h === '1') === getHaptics()));
    menu.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', (b.dataset.s === '1') === ambientOn()));
    menu.querySelectorAll('[data-bv]').forEach(b => b.classList.toggle('on', b.dataset.bv === getBoardView()));
    menu.querySelectorAll('[data-rp]').forEach(b => b.classList.toggle('on', (b.dataset.rp === '1') === getRipples()));
    menu.querySelectorAll('[data-cv]').forEach(b => b.classList.toggle('on', b.dataset.cv === getVoiceMode()));
    menu.querySelectorAll('[data-cs]').forEach(b => b.classList.toggle('on', b.dataset.cs === getClockStyle()));
    menu.querySelectorAll('[data-cct]').forEach(b => b.classList.toggle('on', (b.dataset.cct === '1') === getCCT()));
    const un = unlockedThemes(), cur = getBoardTheme(), SW = { night: ['#B98F66', '#17314B', '#7a5230'], teak: ['#d3a86b', '#8a5a2e', '#9b6b3a'], chart: ['#ecdcb2', '#c7ad78', '#6b5a3a'], havana: ['#d9b48a', '#5a2a1c', '#7b2f1f'], riga: ['#f4f9fd', '#9dbad3', '#cfe0ee'] };
    $('#bthemes').innerHTML = BOARD_THEMES.map(([id, n]) => { const lock = !un.includes(id); return `<button type="button" data-bt="${id}" class="${id === cur ? 'on' : ''}" ${lock ? 'disabled' : ''} title="${n}${lock ? ' (locked: find it in a chest)' : ''}" aria-label="${n}${lock ? ', locked' : ''}"><span class="sw" style="--l:${SW[id][0]};--d:${SW[id][1]};--f:${SW[id][2]}"></span>${lock ? '<span class="lk">\u{1F512}</span>' : ''}</button>`; }).join('');
    $('#bthemes').querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { setBoardTheme(b.dataset.bt); paint(); });
  };
  menu.querySelectorAll('[data-bv]').forEach(b => b.onclick = () => { setBoardView(b.dataset.bv); paint(); });
  menu.querySelectorAll('[data-rp]').forEach(b => b.onclick = () => { setRipples(b.dataset.rp === '1'); paint(); });
  menu.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => { setVoiceMode(b.dataset.cv); paint(); });
  menu.querySelectorAll('[data-vt]').forEach(b => b.onclick = () => { voiceTest(b.dataset.vt); });
  menu.querySelectorAll('[data-cct]').forEach(b => b.onclick = () => { setCCT(b.dataset.cct === '1'); paint(); });
  menu.querySelectorAll('[data-cs]').forEach(b => b.onclick = () => { setClockStyle(b.dataset.cs); paint(); });
  menu.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { setAnim(b.dataset.a); paint(); });
  menu.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { setHaptics(b.dataset.h === '1'); paint(); if (b.dataset.h === '1' && navigator.vibrate) navigator.vibrate(15); });
  menu.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { ambient(b.dataset.s === '1', wxNow()); paint(); });
  gear.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; gear.setAttribute('aria-expanded', String(!menu.hidden)); paint(); };
  menu.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { setTheme(b.dataset.t); paint(); });
  document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) { menu.hidden = true; gear.setAttribute('aria-expanded', 'false'); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') menu.hidden = true; });
  const ki = $('#apikey'), km = $('#keymsg'), note = km ? km.textContent : '';
  if (ki) { ki.value = getKey(); ki.onchange = () => { setKey(ki.value); if (km) km.textContent = ki.value ? 'Saved on this device. ' + note : note; }; ki.onclick = e => e.stopPropagation(); }
  const kt = $('#keytest'); if (kt) kt.onclick = async e => { e.stopPropagation(); const k = ki.value.trim(); if (!k) { km.textContent = 'Paste a key first.'; return; } setKey(k); km.textContent = 'Testing...'; try { const r = await testKey(k); km.textContent = r.ok ? 'Key works. The crew can talk.' : 'Key rejected: ' + r.msg; } catch (er) { km.textContent = 'Could not reach the API (offline?).'; } };
  setTheme(getTheme()); mountInstallUI($('#pwa-box')); Sync.mountSyncUI($('#sync-box'));
  const sp = $('#splash'); if (sp) setTimeout(() => sp.remove(), 1250);
}

let D = null;
async function load() {
  const [personas, stats, me, extra] = await Promise.all([j('data/personas.json'), j('data/stats.json'), j('data/puzzles_me.json'), j('data/extra.json')]);
  const sets = { me };
  const avail = await j('data/sources.json');
  await Promise.all(avail.map(m => j(`data/puzzles_${m}.json`).then(x => { if (x.length) sets[m] = x; })));
  await Sync.S.ready; D = { personas, stats, sets, extra, baseMe: me }; D.sets.me = [...Sync.latestPuzzles(), ...me]; Pr.setData(D);
}
const rnd = (a, seed) => { // seeded daily shuffle
  a = [...a]; let s = seed; const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a;
};
const daySeed = () => Math.floor(Date.now() / 864e5);
const persona = n => D.personas.find(p => p.name === n) || { name: n };
let pzState = { src: 'me', list: null, i: 0 };
const render = html => { view.innerHTML = html; hydrate(view); countAll(view); };
const topbar = `<div class="m-top">${LOGO}${WM}</div>`;

/* ---------- Ship's instruments ---------- */
const PH = { opening: -90, middlegame: 0, endgame: 90 };
function compass(weak) {
  const ticks = Array.from({ length: 24 }, (_, k) => { const a = k * 15 * Math.PI / 180, l = k % 6 === 0 ? 12 : 6; return `<path class="i-tick" d="M${100 + Math.sin(a) * 88} ${100 - Math.cos(a) * 88}L${100 + Math.sin(a) * (88 - l)} ${100 - Math.cos(a) * (88 - l)}"/>`; }).join('');
  const lab = (t, x, y, hot) => `<text class="i-txt ${hot ? 'i-hot' : ''}" x="${x}" y="${y}" ${hot ? 'style="fill:var(--a)"' : ''}>${t}</text>`;
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Compass pointing to ${weak}"><circle class="i-ring" cx="100" cy="100" r="94"/><circle class="i-ring" cx="100" cy="100" r="62" stroke-dasharray="2 5"/>${ticks}
   ${lab('MIDDLE', 100, 36, weak === 'middlegame')}${lab('OPENING', 38, 104, weak === 'opening')}${lab('ENDGAME', 163, 104, weak === 'endgame')}
   <g class="needle" id="needle" style="transform:rotate(-45deg)" data-a="${PH[weak]}"><path class="i-needle" d="M100 44L109 100H91z"/><path class="i-needle2" d="M100 156L109 100H91z"/></g><circle class="i-pin" cx="100" cy="100" r="6"/></svg>`;
}
function barometer(v) {
  const a = -80 + v * 160, arc = (r, a0, a1) => { const p = x => `${100 + Math.sin(x * Math.PI / 180) * r} ${112 - Math.cos(x * Math.PI / 180) * r}`; return `M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}`; };
  return `<svg viewBox="0 0 200 130" role="img" aria-label="Form barometer"><path d="${arc(84, -80, 80)}" class="i-ring" stroke-width="10" stroke-linecap="round"/>
   <path d="${arc(84, -80, -27)}" fill="none" stroke="var(--bad)" stroke-width="10" stroke-linecap="round" opacity=".7"/><path d="${arc(84, 27, 80)}" fill="none" stroke="var(--good)" stroke-width="10" stroke-linecap="round" opacity=".8"/>
   <text class="i-txt" x="20" y="124">STORM</text><text class="i-txt" x="180" y="124">FAIR</text>
   <g style="transform-origin:100px 112px;transform:rotate(${a}deg);transition:transform 1.4s var(--ease)"><path class="i-needle" d="M100 40L106 112H94z" style="fill:var(--a)"/></g><circle class="i-pin" cx="100" cy="112" r="6"/></svg>`;
}
function wake(rating) {
  return `<svg viewBox="0 0 200 130" role="img" aria-label="Rating wake trail"><path d="M10 100H190" class="i-tick" stroke-dasharray="2 6"/><path d="M10 100C50 100 70 100 112 70" stroke="var(--glass-b)" stroke-width="2" fill="none" stroke-dasharray="3 5"/>
   <circle cx="112" cy="70" r="16" fill="var(--a)" opacity=".18"/><circle cx="112" cy="70" r="7" fill="var(--a)"/><text class="i-txt" x="112" y="48" style="fill:var(--a);font-size:18px">${rating}</text><text class="i-txt" x="100" y="124">LOGGING STARTS TODAY</text></svg>`;
}
const formVal = () => { const h = store.get('pz', []) || []; const l = h.slice(-20); return l.length < 3 ? .5 : l.reduce((a, b) => a + b, 0) / l.length; };
const formWord = v => v < .34 ? 'Stormy' : v < .67 ? 'Steady' : 'Set fair';

/* ---------- Today ---------- */
function today() {
  const h = new Date().getHours(), g = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
  const c = D.extra.clock, set = rnd(D.sets.me, daySeed()).slice(0, 10);
  const ms = MASTERS.filter(m => D.sets[m]);
  const dr = D.extra.drills, dk = 'convert', drillName = 'Convert when winning';
  let lp = null, lesson = `<p>Master puzzles are still being prepared. Check back soon.</p>`;
  if (ms.length) {
    const m = ms[daySeed() % ms.length]; lp = { m, p: rnd(D.sets[m], daySeed())[0] };
    lesson = `<div class="row tight">${avatar(m)}<div><b>${m}</b><br><span class="sub sm">${lp.p.phase}, ${gameLine(lp.p)}</span></div></div><p>${themeLine(lp.p)}</p>`;
  }
  const ph = D.extra.phases, weak = Object.keys(ph).sort((a, b) => ph[b] - ph[a])[0];
  const fv = formVal(), rt = Sync.rating();
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const wx = wxNow(), tod = timeOfDay();
  render(`${topbar}
  <header class="bcast deck-hd"><div><div class="k"><span class="live"></span>On deck · ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })} · ${WEATHER_WORD[wx]}</div>
   <h1>${g} <em>watch</em>, Gerald</h1></div><span class="row"><button class="btn ghost" id="brief-open" aria-haspopup="dialog" aria-controls="brief">Captain's briefing</button></span></header>
  <a class="watch-cta${watchDone() ? ' done' : ''}" id="watch-cta" href="#watch">${watchDone() ? 'Watch complete ✓ · extra round?' : "START TODAY'S WATCH · 10 min"}</a>
  <div class="deckwrap" id="deck"></div>
  <p class="sub sm deck-hint">Tap the table for today's drill, the chart for the voyage, the wheel to play, a crew member to meet them.</p>
  <div class="sheet-bg" id="brief-bg" hidden></div>
  <section class="sheet" id="brief" role="dialog" aria-modal="true" aria-label="Captain's briefing" hidden>
   <div class="sheet-h"><div><span class="k">Captain's briefing</span><h2>Tonight's <em>session</em></h2></div><button class="btn ghost" id="brief-close" aria-label="Close briefing">Close</button></div>
  <div class="grid g-today">
   ${briefHTML()}${briefCoachHTML()}
   <div class="card link" id="c-drill"><span class="k">Drill of the day</span><h2>${drillName}</h2><p>${dr[dk].toLocaleString()} positions drawn from your own games. One focused round beats ten random ones.</p><a class="btn" href="#drills/convert">Start 10 positions</a></div>
   <div class="card"><span class="k">Your puzzle set</span><h2>10 from your blunders</h2><p>Positions where a better move was there. ${D.sets.me.length} logged so far.</p><button class="btn" id="go-set">Start set</button></div>
   <div class="card"><span class="k">Crew lesson</span><h2>${lp ? 'One from ' + lp.m : 'Coming soon'}</h2>${lesson}${lp ? '<button class="btn" id="go-lesson">Try it</button>' : ''}</div>
   <div class="card wide"><span class="k">Ship's instruments</span>
    <div class="instr">
     <div class="inst">${compass(weak)}<span class="k">Weakest water</span><b>${cap(weak)}</b></div>
     <div class="inst">${barometer(fv)}<span class="k">Form</span><b>${formWord(fv)}</b></div>
     <div class="inst">${wake(rt ? rt.blitz : 1017)}<span class="k">Rating · Blitz</span><b>${rt ? rt.blitz : 1017}</b>${rt ? `<span class="sub sm">updated ${Sync.ago(rt.t)}</span>` : ''}</div>
    </div>
    <p class="sm">Compass: ${Object.entries(ph).map(([k, v]) => `${k} ${v}`).join(', ')} blunder positions. Barometer: your last ${Math.min(20, (store.get('pz', []) || []).length) || 'few'} puzzles.</p></div>
   <div class="card wide"><span class="k">Clock check</span>
    <div class="tiles mt1">
     <div class="tile"><span class="led">${c.seconds_per_move_by_bucket['11-20'].median}s</span><span class="k">Median move, 11 to 20</span></div>
     <div class="tile"><span class="led bad">${c.avg_clock_left['30']}s</span><span class="k">Avg clock at move 30</span></div>
     <div class="tile"><span class="led bad">${Math.round(c.pct_games_below_30s)}%</span><span class="k">Games under 30s</span></div>
     <div class="tile"><span class="led">${Math.round(c.error_rate_on_long_think_move.rate * 100)}% <small style="font-size:.5em">v ${Math.round(c.error_rate_on_normal_move.rate * 100)}%</small></span><span class="k">Long-think errors</span></div>
    </div></div>
  </div></section>`);
  mountDeck($('#deck'), { streak: streakCount(), drill: drillName });
  deckMoment();
  if (ambientOn()) ambient(true, wx);
  const sh = $('#brief'), bg = $('#brief-bg'), opener = $('#brief-open'); wireBrief(sh); briefInstallCard(sh);
  const openB = on => { if (on) { sh.hidden = bg.hidden = false; requestAnimationFrame(() => { sh.classList.add('on'); bg.classList.add('on'); const n = $('#needle'); if (n) n.style.transform = `rotate(${n.dataset.a}deg)`; }); $('#brief-close').focus(); }
    else { sh.classList.remove('on'); bg.classList.remove('on'); setTimeout(() => { if (!sh.classList.contains('on')) sh.hidden = bg.hidden = true; }, 320); opener.focus(); } };
  opener.onclick = () => openB(true); $('#brief-close').onclick = () => openB(false); bg.onclick = () => openB(false);
  sh.onkeydown = e => { if (e.key === 'Escape') openB(false); };
  $('#c-drill').onclick = e => { if (e.target.tagName !== 'A') location.hash = 'drills/convert'; };
  $('#go-set').onclick = () => { pzState = { src: 'me', list: set, i: 0 }; location.hash = 'puzzles'; };
  if (lp) $('#go-lesson').onclick = () => { pzState = { src: lp.m, list: [lp.p], i: 0 }; location.hash = 'puzzles'; };
}
const gameLine = p => { const s = p.source || {}; return s.White ? `${s.White} vs ${s.Black}, ${(s.Date || '').slice(0, 4)}` : ''; };
const THEMES = {
  capture: 'a capture changes the balance', quiet: 'a quiet move does the job rather than a capture or check',
  fork: 'a fork wins material', pin: 'a pin decides it', check: 'a forcing check leads the way', mate: 'it ends in mate',
  sacrifice: 'a sacrifice opens the position', promotion: 'a pawn is about to promote'
};
const themeLine = p => 'Theme: ' + ((p.themes || []).map(t => THEMES[t] || t).join('; ') || 'tactics') + '.';

/* ---------- Puzzles (existing board.js) ---------- */
const failedPz = new Set(); let bossClk = null;
document.addEventListener('mast:intro', e => { if (bossClk) e.detail === 'open' ? bossClk.pause() : bossClk.start(); }); // intro cards freeze the boss clock
function killBossClk() { if (bossClk) { bossClk.destroy(); bossClk = null; } setBusy(false); }
function puzzles(arg) {
  if (arg === 'daily') { const M = Pr.daily().master; pzState = M.m ? { src: M.m, list: [M.p], i: 0, daily: 1 } : { src: 'me', list: null, i: 0 }; arg = null; }
  else if (arg && arg.startsWith('boss-')) return bossStart(arg.slice(5));
  if (arg && arg !== pzState.src) {
    if (!D.sets[arg]) {
      return render(`${topbar}<a class="back" href="#voyage">&larr; Back to the chart</a>${state({ who: arg, ex: 'neutral', title: 'Charts not ready', line: `${arg}'s puzzles are still being drawn up. Try your own games meanwhile.`, action: '<a class="btn" href="#puzzles">Your puzzles</a>' })}`);
    }
    pzState = { src: arg, list: null, i: 0 };
  }
  const srcs = ['me', ...MASTERS.filter(m => D.sets[m])];
  const st = pzState;
  if (!st.list) st.list = rnd(D.sets[st.src], daySeed() + st.i).slice(0, 200);
  const label = s => s === 'me' ? 'My games' : s;
  render(`${topbar}<h1>${st.boss ? 'Boss: ' + Pr.BOSSES[st.boss.id].name : 'Puzzles'}</h1>
  ${st.boss ? '' : `<div class="chips mt2">${srcs.map(s => `<button class="chip ${s === st.src ? 'on' : ''}" data-s="${s}">${label(s)}</button>`).join('')}</div>`}
  <div class="pz"><div><div id="bd"></div><div id="crew"></div></div><div class="side">${st.boss ? '<div id="bhud"></div><div id="bclk" style="max-width:120px"></div>' : ''}<div class="panel" id="info"></div><div id="res"></div></div></div>`);
  view.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { pzState = { src: b.dataset.s, list: null, i: 0 }; puzzles(); });
  start();
}
function recordResult(src, ok) {
  const h = store.get('pz', []) || []; h.push(ok ? 1 : 0); store.set('pz', h.slice(-50));
  if (ok && src !== 'me') bumpIsland(src);
}
let pzBoard = null, pzCrew = null;
async function start() {
  const st = pzState, pz = st.list[st.i % st.list.length];
  if (pzBoard) { try { pzBoard.destroy(); } catch (e) { } pzBoard = null; } if (pzCrew) pzCrew.destroy();
  const g = new Chess(pz.fen), flip = g.turn() === 'b';
  let k = 0, busy = false, done = false;
  const bd = $('#bd'), info = $('#info'), res = $('#res');
  if (!bd) return;
  const side = flip ? 'Black' : 'White';
  const bs = st.boss, psrc = pz.__m || st.src, pkey = Pr.pid(psrc, pz);
  const bh = () => { const h = $('#bhud'); if (h && bs) h.innerHTML = bossHud(Pr.BOSSES[bs.id].name, bs.hp, bs.lives); };
  killBossClk(); bh();
  const setInfo = (t, c = '') => info.innerHTML = `<div class="status ${c}">${t}</div><div class="sub">${bs ? 'Boss position' : 'Puzzle ' + (st.i % st.list.length + 1) + ' of ' + st.list.length}, ${pz.phase}</div>`;
  setInfo(`${side} to move. Find the best move.`);
  res.innerHTML = '';
  const uci = m => m.from + m.to + (m.promotion || '');
  const legal = () => { const m = {}; g.moves({ verbose: true }).forEach(x => (m[x.from] ??= []).push(x.to)); return m; };
  const san = pz.solution_san.replace(/^\d+\.(\.\.)?\s*/, '').split(' ')[0];
  const sync = (lm, anim) => { b.setPosition(g.fen(), { animate: anim, lastMove: lm, check: g.in_check() }); b.setLegal(legal()); b.setTurn(g.turn() === 'w' ? 'white' : 'black', true); };
  const b = pzBoard = new Board(bd, { orientation: flip ? 'black' : 'white', coords: true, onMove: (from, to, promo) => {
    if (done || busy) return false;
    const m = g.move({ from, to, promotion: promo || 'q' }); if (!m) return false;
    if (uci(m) !== pz.solution[k]) { g.undo(); setTimeout(() => finish(false, m.san), 0); return false; }
    if (m.promotion === 'n') document.dispatchEvent(new CustomEvent('mast:promo', { detail: { piece: 'n' } }));
    sfx(g.in_check() ? 'check' : m.captured ? 'capture' : 'move'); k++;
    const mt = g.in_checkmate(); if (mt) b.checkmate();
    if (k >= pz.solution.length) { setTimeout(() => finish(true, m.san), mt ? 1100 : 200); return true; }
    busy = true;
    setTimeout(() => { if (!pzBoard) return; const o = pz.solution[k], r = g.move({ from: o.slice(0, 2), to: o.slice(2, 4), promotion: o[4] }); sfx(r.captured ? 'capture' : 'move'); k++; busy = false; sync({ from: r.from, to: r.to }, true); if (k >= pz.solution.length) finish(true, m.san); }, 450);
    return true;
  } });
  sync(null, false);
  let lines = {}; try { lines = (await pzLines()).characters; } catch (e) { }
  if (pzBoard !== b) return;
  const crew = pzCrew = new Crew($('#crew'), lines), adv = advisorFor({ phase: pz.phase, themes: pz.themes });
  crew.board = b; try { const sol = pz.solution && pz.solution[0], t = new Chess(pz.fen), mv = sol && t.move({ from: sol.slice(0, 2), to: sol.slice(2, 4), promotion: sol[4] }); if (mv && Math.random() < .4) setTimeout(() => crew.disagree(disagreement({ bestIsAggressive: isAggressive(mv.san) })), 1200); } catch (e) { }
  crew.setAdvisor(adv); crew.think(true); if ((pz.themes || []).includes('sacrifice')) crew.silent('Tal', 'excited', 2200);
  if (bs) { const stm = storm(b); bossClk = new PressureClock($('#bclk'), { seconds: Pr.BOSS_CLOCK, onState: s2 => stm.set(s2), onFlag: () => finish(false, '(flag)') }); bossClk.start(); setBusy(true); }
  let hinted = false; const hb = document.createElement('button'); hb.className = 'btn ghost sm'; hb.type = 'button'; let used = false; try { used = sessionStorage.getItem('mast.hint.pz') === '1'; } catch (e) { }
  hb.textContent = used ? 'Spyglass used' : 'Spyglass'; hb.disabled = used; info.after(hb);
  hb.onclick = () => { if (done || hb.disabled) return; hinted = true; hb.disabled = true; hb.textContent = 'Spyglass used'; try { sessionStorage.setItem('mast.hint.pz', '1'); } catch (e) { } b.spyglass(pz.solution[k].slice(0, 2)); };
  function finish(ok, played) {
    if (done) return; done = true; killBossClk(); hb.remove(); b.setLegal({}); recordResult(psrc, ok);
    document.dispatchEvent(new CustomEvent('mast:puzzle', { detail: { ok, pz, hinted } }));
    if (ok && !hinted && !failedPz.has(pkey)) Pr.onPuzzle({ src: psrc, pz, sac: (pz.themes || []).includes('sacrifice'), boss: !!bs }); else if (!ok) failedPz.add(pkey);
    if (bs) { if (ok) bs.hp--; else { bs.lives--; st.list.push(pz); } bh(); } crew.think(false); sfx(ok ? 'success' : 'fail');
    const mate = (pz.themes || []).some(t => String(t).startsWith('mate')), sac = (pz.themes || []).includes('sacrifice');
    const vars = { move: san, played, secs: '', eval: fmtEval(pz.eval || 0), game: gameLine(pz) };
    if (ok) { if (sac) sfx('brilliant'); crew.react(sac ? 'sacrifice' : 'solve', { who: sac ? 'Tal' : adv, ex: 'excited', vars }); crew.silent('Skipper', 'pleased', 2500); }
    else { crew.react(mate ? 'missed_mate' : 'fail', { who: mate ? 'Leela' : adv, ex: 'disappointed', vars }); crew.silent('Skipper', 'disappointed', 3000); const u = pz.solution[k]; b.showArrow(u.slice(0, 2), u.slice(2, 4), '#3FB37F'); }
    setInfo(ok ? 'Solved.' : 'Not quite.', ok ? 'ok' : 'bad');
    const advP = persona(adv), mine = st.src === 'me';
    const hint = ok ? 'Well found. ' : `The best move was <b>${san}</b>. `;
    res.innerHTML = `<div class="panel advisor">${avatar(advP.name, ok ? 'happy' : 'neutral')}<div><b>${advP.name}</b><div class="sub sm">${advP.owns ? 'Owns ' + advP.owns : ''}</div>
      <p style="margin:.5rem 0 0">${hint}${themeLine(pz)} This is a ${pz.phase} position.</p>
      ${mine ? `<p class="sub">In your game you played <b>${pz.you_played}</b>. ${pz.source && pz.source.Link ? `<a href="${pz.source.Link}" target="_blank" rel="noopener">View the game</a>` : ''}</p>` : `<p class="sub">From ${gameLine(pz)}</p>`}
      <p class="sub sm">Line: ${pz.solution_san}</p></div></div>
      <div class="row mt2">${ok || bs ? '' : '<button class="btn ghost" id="retry">Try again</button>'}<button class="btn" id="next">${bs ? (bs.hp === 0 || bs.lives === 0 ? 'Finish' : 'Next position') : 'Next puzzle'}</button></div>`;
    hydrate(res);
    $('#next').onclick = () => { if (bs) { if (bs.hp === 0 || bs.lives === 0) return bossEnd(bs); st.i++; return start(); } if (st.daily) pzState = { src: st.src, list: null, i: 0 }; else st.i++; start(); };
    if (!ok && !bs) $('#retry').onclick = start;
  }
}
async function bossStart(id) {
  const B = Pr.BOSSES[id]; if (!B || !Pr.bossReady(id)) { location.hash = 'voyage'; return; }
  const list = Pr.bossSet(id); if (!list.length) { location.hash = 'voyage'; return; }
  render(`${topbar}${loadingState('The boss is sizing you up...')}`);
  if (!await bossIntro(id)) { location.hash = 'voyage'; return; }
  pzState = { src: B.src || list[0].__m, list, i: 0, boss: { id, hp: list.length, lives: 2 } };
  puzzles();
}
async function bossEnd(bs) {
  const won = bs.hp === 0; killBossClk(); pzState = { src: 'me', list: null, i: 0 }; if (won) Pr.bossWin(bs.id);
  location.hash = 'voyage'; await bossResult(bs.id, won);
}
let _pl = null; const pzLines = () => _pl || (_pl = j('data/characters.json'));

/* ---------- Crew ---------- */
function masters(id) {
  const p = id && D.personas.find(x => x.id === id);
  const ps = k => D.stats[k] || {};
  if (p) {
    const s = ps(p.name), kv = [['Games', s.games], ['Score', s.score_pct != null ? s.score_pct + '%' : null], ['Avg length', s.avg_length_moves ? s.avg_length_moves + ' moves' : null]].filter(x => x[1] != null);
    render(`${topbar}<a class="back" href="#masters">&larr; All crew</a>
    <div class="mhero era-h mt2" style="--ac:${(CH[p.name] || {}).acc}">${eraScene(p.name)}<div class="mph" style="position:relative">${photo(p.name, moodEx(p.name))}${p.name === 'Skipper' ? skipperBadge() : ''}</div><div><span class="k">Mood: ${mood(p.name)} · ${level(p.name).name}</span><h1>${p.full}${p.ai ? '<span class="tag">AI</span>' : ''}</h1><p class="sub">${p.title}</p><span class="ecap">${eraCaption(p.name)}</span><p class="sub sm" style="margin:.4em 0">“${greeting(p.name)}”</p><a class="btn sm" href="#chat/${p.id}">Chat with ${p.name}${hasKey() ? '' : ' (needs key)'}</a></div></div>
    ${relBlock(p)}
    <div class="tiles kv">${kv.map(([k, v]) => `<div class="tile"><span class="led">${typeof v === 'number' ? v.toLocaleString() : v}</span><span class="k">${k}</span></div>`).join('')}</div>
    <div class="md">${md(p.markdown.replace(/^#\s.*\n/, ''))}</div>
    <span class="k">Outfits</span><div id="ofits" style="--ac:${(CH[p.name] || {}).acc}">${outfitPicker(p.name)}</div>`);
    figCSS(); introOnce(p.name); outfitReveal(view, p.name); wireFav(p.name); wireBackstory(view, p.name);
    const box = view.querySelector('#ofits');
    box.addEventListener('click', e => { const b = e.target.closest('.ofit'); if (!b || !setOutfit(p.name, +b.dataset.i)) return; box.innerHTML = outfitPicker(p.name); });
    return;
  }
  render(`${topbar}<span class="k">Your advisors</span><h1>The Crew</h1><p class="sub mt1">Each one owns a part of the game.</p><div class="row mt2"><a class="btn ghost" href="#collection">Collection</a><a class="btn ghost" href="#trophies">Trophies</a><a class="btn ghost" href="#secrets">Secrets</a></div><div class="grid g-crew">${D.personas.map(p => `
   <div class="card link mcard" data-id="${p.id}" tabindex="0" role="link"><div class="row tight">${avatar(p.name)}<div><h3>${p.name}${p.ai ? '<span class="tag">AI</span>' : ''}</h3><span class="sub sm">${p.title}</span></div></div>
   <p>Owns ${p.owns}</p>${p.default ? '<span class="k">Default advisor</span>' : ''}</div>`).join('')}</div>`);
  view.querySelectorAll('.mcard').forEach(c => { const go = () => location.hash = 'masters/' + c.dataset.id; c.onclick = go; c.onkeydown = e => { if (e.key === 'Enter') go(); }; });
}

/* relationship: level bar, sources (real words), favourite game, stories */
let SRC = null; const sources = () => SRC || (SRC = Promise.all(['data/sources/capablanca.json', 'data/sources/morphy.json', 'data/favourites.json'].map(u => j(u).catch(() => null))).then(([cap, mor, fav]) => ({ cap, mor, fav })));
sources();
const STORY = { Tal: 'In Riga they say I learned chess in a hospital bed. Sick or well, I always preferred the board that had fire on it.', Kasparov: 'A young man in Baku once told me he studied openings by candlelight. Preparation is a form of courage. (A fictional archetype speaking.)', Carlsen: 'I lose plenty of blitz games. The trick is not to care, and then to care a lot about the next one. (A fictional archetype speaking.)', Leela: 'I learned from zero: no human games, only self-play. Millions of games where I lost to myself first.', Skipper: 'The sax came aboard before the chess set did. Good nights get a tune.', Tempo: 'Every drummer knows: you are never late if you never rush.' };
const qcard = (t, src) => `<blockquote class="qcard"><p>${t.replace(/</g, '&lt;')}</p><cite>${src}</cite></blockquote>`;
function relBlock(p) {
  const L = level(p.name), v = affinity(p.name), S = SRC && SRC.then ? null : null;
  const pct = L.to ? Math.min(100, Math.round(v / L.to * 100)) : 100;
  let h = `<div class="rel mt2" style="--ac:${(CH[p.name] || {}).acc}"><span class="k">Relationship · ${L.name}${L.next ? ` (next: ${L.next})` : ''}</span><span class="bar"><i style="width:${pct}%"></i></span><p class="sub sm">Grows with chats, sessions with ${p.name} as advisor and solves in their part of the game. Student unlocks their favourite game; Protégé unlocks a personal story.</p></div><div id="relx"></div>`;
  return h;
}
async function wireFav(n) {
  const box = $('#relx'); if (!box) return; const { cap, mor, fav } = await sources(); const L = level(n); let h = '';
  if (n === 'Capablanca' && cap) { const ex = cap.excerpts, k = new Date().getDate(); h += `<span class="k mt2">From Chess Fundamentals (1921)</span><div class="qgrid">${[0, 1, 2].map(o => ex[(k + o * 7) % ex.length]).map(e => qcard(e.text, `From <i>Chess Fundamentals</i> (1921), ${e.chapter}. Project Gutenberg #${cap.ebook}.`)).join('')}</div>`; }
  if (n === 'Morphy' && mor) h += `<span class="k mt2">Morphy's logbook</span><p class="sub sm">${mor.label}</p><div class="qgrid">${mor.notes.slice(0, L.i >= 3 ? 7 : 3).map(e => qcard(e.text, `${e.place}, ${e.year} · written for Mast`)).join('')}</div>`;
  const f = fav && fav[n];
  if (f) h += L.i >= 2 ? `<span class="k mt2">Favourite game</span><div class="card fav"><b>${f.white} v ${f.black}</b><span class="sub sm"> ${f.event}, ${f.date.slice(0, 4)} · ${f.result}</span><div class="row mt1"><button class="btn ghost sm" id="favgo" type="button">Play it through</button></div><div id="favb" hidden><div id="favbd" style="max-width:420px"></div><div class="row mt1"><button class="btn ghost sm" id="fv0" type="button" aria-label="Previous">&#9664;</button><button class="btn ghost sm" id="fv1" type="button" aria-label="Next">&#9654;</button><span class="sub sm" id="fvt"></span></div><p class="sub sm" id="fvc"></p></div></div>` : `<p class="sub sm mt1">Favourite game: unlocks at Student.</p>`;
  if (STORY[n]) h += L.i >= 3 ? qcard(STORY[n], `${n}, a personal story`) : '<p class="sub sm">Personal story: unlocks at Protégé.</p>';
  box.innerHTML = h;
  const go = $('#favgo'); if (!go) return;
  go.onclick = () => {
    $('#favb').hidden = false; go.hidden = true; const g = new Chess(); g.load_pgn(f.moves.replace(/\d+\.\.\./g, '')); const hist = g.history({ verbose: true }); const t = new Chess(); const fens = [t.fen()]; hist.forEach(m => { t.move(m); fens.push(t.fen()); });
    const me = f.black.includes(n === 'Carlsen' ? 'Carlsen' : n) ? 'black' : 'white';
    const bd = new Board($('#favbd'), { orientation: me, coords: true, movable: 'none', onMove: () => false }); let i = 0;
    const NOTE = { 0: `${n}: watch how every piece joins in.`, 10: `${n}: here the plan becomes clear.`, [Math.max(1, hist.length - 4)]: `${n}: and now the finish.` };
    const show = () => { bd.setPosition(fens[i], { animate: true }); $('#fvt').textContent = i ? `${Math.ceil(i / 2)}${i % 2 ? '.' : '...'} ${hist[i - 1].san}` : 'Start'; if (NOTE[i]) $('#fvc').textContent = NOTE[i]; };
    show(); $('#fv0').onclick = () => { if (i > 0) { i--; show(); } }; $('#fv1').onclick = () => { if (i < fens.length - 1) { i++; show(); } };
  };
}

/* ---------- Voyage + placeholders ---------- */
function voyage() {
  render(`${topbar}<span class="k">Sea chart</span><h1>The Voyage</h1><p class="sub mt1">Seven waypoints from Openings Reef to Tempo's Rock. Tap an island.</p><div id="chart"></div>`);
  renderVoyage($('#chart'), {});
  hydrate(view);
}
const soon = (title, kicker, who, ex, line) => () => render(`${topbar}<span class="k">${kicker}</span><h1>${title}</h1>
  ${state({ who, ex, title: 'Coming next', line, slot: true, action: '<a class="btn ghost" href="#today">Back to tonight</a>' })}`);
const drills = arg => drillsScreen({ render, topbar, D }, arg);
const review = arg => reviewScreen({ render, topbar, D }, arg);
const play = arg => playScreen({ render, topbar, D }, arg);
const chat = arg => chatScreen({ render, topbar }, arg);

/* ---------- Router ---------- */
async function route() {
  const [r, arg] = (location.hash.slice(1) || 'today').split('/');
  document.querySelectorAll('#nav .item').forEach(a => a.classList.toggle('on', (a.dataset.r === 'more' && MORE.includes(r)) || a.dataset.r === (r === 'collection' || r === 'trophies' || r === 'secrets' ? 'masters' : r === 'postcard' ? 'today' : r)));
  navCompass($('#nav'));
  if (!D) {
    render(`${topbar}${loadingState()}`);
    try { await load(); } catch (e) { render(`${topbar}${errorState()}`); const b = $('#retry-load'); if (b) b.onclick = route; return; }
  }
  const run = async () => {
    stopDrills(); if (r !== 'play') stopPlay(); if (r !== 'review') stopReview(); if (pzBoard && r !== 'puzzles') { try { pzBoard.destroy(); } catch (e) { } pzBoard = null; if (pzCrew) pzCrew.destroy(); }
    if (r !== 'puzzles') killBossClk(); stopCoach();
    window.scrollTo(0, 0); view.classList.remove('in-cabin');
    await ({ today, drills, puzzles, voyage, masters, review, play, chat, coach: () => coachScreen({ render, topbar, D }), watch: () => { watchScreen({ render, topbar }); }, studio: () => studioScreen({ render, topbar }), postcard: () => postcardView({ render, topbar }), collection: a => collectionView({ render, topbar }, a), trophies: () => trophiesView({ render, topbar }), secrets: () => secretsView({ render, topbar }) }[r] || today)(arg);
  };
  const vt = full() && routed && document.startViewTransition;
  if (vt) { try { await document.startViewTransition(run).updateCallbackDone; } catch (e) { } }
  else { await run(); if (full() && routed && view.animate) view.animate([{ opacity: 0, transform: 'translateY(12px) scale(.992)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
  routed = true;
}
let routed = false;
async function deckMoment() {
  const el = $('#deck'); if (!el) return; let games = [];
  try { const I = await j('data/favourites.json'); games = Object.entries(I).map(([m, g]) => ({ m, ...g })); } catch (e) { }
  const rm = rareMoment(games); if (!rm || !el.isConnected) return;
  const d = document.createElement('div'); d.className = 'rare'; d.style.setProperty('--ac', (CH[rm.who] || {}).acc);
  d.innerHTML = `<span class="rph">${photo(rm.who, 'excited')}</span><div><span class="k">${rm.kind === 'birthday' ? 'A birthday on deck' : 'An anniversary'}</span><p></p></div>`; d.querySelector('p').textContent = rm.line;
  el.parentNode.insertBefore(d, el.nextSibling);
}
await loadIcons([...ROUTES.map(r => r[0]), 'settings', 'more']);
buildShell(); initFx(); initProgressUI(); await initSecrets();
addEventListener('hashchange', route);
initPWA();
Sync.S.ready.then(() => { const rr = Sync.rating(); window.__syncKey = Sync.S.puzzles.length + '|' + (rr ? rr.blitz : ''); });
addEventListener('mast:sync', () => { if (!D) return; D.sets.me = [...Sync.latestPuzzles(), ...D.baseMe]; const h = location.hash, rr = Sync.rating(), key = Sync.S.puzzles.length + '|' + (rr ? rr.blitz : ''); if (key !== window.__syncKey) { const first = window.__syncKey === undefined; window.__syncKey = key; if (!first && (h === '' || h === '#today')) route(); } });
Sync.maybeAutoSync(); visitNudge(); addEventListener('mast:sync', () => { onSyncAlerts().catch(() => { }); }); onSyncAlerts().catch(() => { });
route();
