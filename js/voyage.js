// Voyage: illustrated SVG sea chart. Islands = skills; progress from localStorage counters.
import { store, avatar, icon } from './ui.js';
import { full, countAll } from './fx.js';
import * as Pr from './progress.js';
import { unroll } from './captain.js';
import { boatName, homePort, esc as sxEsc } from './secrets.js';
const lockd = i => i.locked && !(Pr.tempoUnlocked() && !Pr.tempoPending());
let seq = false;

export const ISLANDS = [
  { id: 'openings', name: "Openings Reef", who: 'Morphy', src: 'Morphy', x: 170, y: 585, r: 44, goal: 20, blurb: 'Develop fast, open lines, never leave the king in the centre.' },
  { id: 'tactics', name: "Tactics Isles", who: 'Tal', src: 'Tal', x: 450, y: 600, r: 48, goal: 20, blurb: 'Sacrifices, forks and forcing play. Solve Tal puzzles to fill the chart.' },
  { id: 'middle', name: "The Middlegame Narrows", who: 'Kasparov', src: 'Kasparov', x: 540, y: 440, r: 52, goal: 20, blurb: 'Your weakest water. Most of your blunders happen here.' },
  { id: 'grind', name: "Grinder's Bank", who: 'Carlsen', src: 'Carlsen', x: 230, y: 385, r: 46, goal: 20, blurb: 'Squeeze small edges and keep converting.' },
  { id: 'endgame', name: "Endgame Strait", who: 'Capablanca', src: 'Capablanca', x: 470, y: 262, r: 46, goal: 20, blurb: 'Simple, clean technique. Convert the won positions.' },
  { id: 'leela', name: "Leela's Lighthouse", who: 'Leela', href: '#drills', x: 160, y: 205, r: 34, goal: 20, blurb: 'The engine light. Drills show where the truth is.' },
  { id: 'tempo', name: "Tempo's Rock", who: 'Tempo', x: 500, y: 92, r: 38, goal: 1, locked: true, blurb: 'Final boss. Charts say: conquer all six islands to find the way in.' }
];
export const href = i => lockd(i) ? null : (i.href || `#puzzles/${i.src}`);
export const progress = i => {
  const n = (store.get('prog', {}) || {})[i.id] || 0;
  return Math.min(100, Math.round(n / i.goal * 100));
};
// called by app when a master puzzle is solved
export function bumpIsland(src) {
  const i = ISLANDS.find(x => x.src === src); if (!i) return;
  const p = store.get('prog', {}) || {}; p[i.id] = (p[i.id] || 0) + 1; store.set('prog', p);
}

const W = 700, H = 760;
const rng = s => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const f = n => Math.round(n * 10) / 10;
function blob(cx, cy, r, seed, k = 1, n = 11, jag = 0.32) {
  const R = rng(seed), pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * k * (1 - jag / 2 + R() * jag); pts.push([cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * .85]); }
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${f(m(pts[0], pts[1])[0])} ${f(m(pts[0], pts[1])[1])}`;
  for (let i = 1; i <= n; i++) { const p = pts[i % n], q = m(p, pts[(i + 1) % n]); d += `Q${f(p[0])} ${f(p[1])} ${f(q[0])} ${f(q[1])}`; }
  return d + 'Z';
}
function curve(pts) { // catmull-rom -> cubic
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
const wrap = n => { const w = n.split(' '), out = []; let c = ''; w.forEach(x => { if ((c + ' ' + x).trim().length > 15 && c) { out.push(c); c = x; } else c = (c + ' ' + x).trim(); }); out.push(c); return out; };

function rose(cx, cy, r) {
  const pt = (a, k) => `${f(cx + Math.sin(a) * r * k)} ${f(cy - Math.cos(a) * r * k)}`;
  let s = `<circle class="c-ink" cx="${cx}" cy="${cy}" r="${r}"/><circle class="c-ink" cx="${cx}" cy="${cy}" r="${r * .72}" stroke-dasharray="2 4"/>`;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, long = i % 2 === 0, k = long ? 1.18 : .8, w = Math.PI / 12;
    s += `<path class="${long ? 'c-fill' : 'c-ink'}" d="M${pt(a, k)}L${pt(a + w, .2)}L${cx} ${cy}L${pt(a - w, .2)}Z" ${long ? 'opacity=".85"' : ''}/>`;
  }
  return s + `<text x="${cx}" y="${cy - r * 1.32}" text-anchor="middle" font-size="16">N</text>`;
}

function islandSVG(i, seed, rise) {
  const pct = progress(i), cx = i.x, cy = i.y;
  const lab = wrap(i.name);
  let g = '';
  if (i.id === 'tempo' && !lockd(i)) g += '';
  if (i.id === 'tempo') {
    const R = rng(7), pts = [];
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, rr = i.r * (k % 2 ? .62 : 1.05 + R() * .15); pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr * .9)}`); }
    g += `<circle class="glow" cx="${cx}" cy="${cy}" r="${i.r * 1.9}" fill="url(#amb)"/>
      <path class="c-land" d="M${pts.join('L')}Z"/><path class="c-ink" d="M${cx - 8} ${cy + 2}v-8a8 8 0 0 1 16 0v8M${cx - 11} ${cy + 2}h22v14h-22z"/>`;
  } else {
    g += `<path class="c-cont" d="${blob(cx, cy, i.r, seed, 1.25)}"/><path class="c-land" d="${blob(cx, cy, i.r, seed)}"/><path class="c-cont" d="${blob(cx, cy, i.r, seed, .62, 9, .2)}"/>`;
    if (i.id === 'leela') g += `<path class="beam" style="transform-origin:${cx}px ${cy - 14}px" d="M${cx} ${cy - 14}L${cx + 170} ${cy - 40}L${cx + 170} ${cy + 12}Z"/><path class="c-ink" d="M${cx - 7} ${cy + 14}l3-26h8l3 26zM${cx - 5} ${cy - 12}h10l-5-8z"/><path class="c-ink" d="M${cx + 8} ${cy - 18}l26-9M${cx + 8} ${cy - 16}l26 5" opacity=".6"/>`;
    else g += `<path class="c-ink" d="M${cx - 14} ${cy + 8}l6-12 6 8 6-14 8 18z"/>`; // little peaks
  }
  if (Pr.isConquered(i.id)) g += `<g class="flag"><path d="M${cx + 16} ${cy + 6}V${cy - 30}" stroke="#2a2420" stroke-width="3" fill="none"/><path d="M${cx + 17} ${cy - 30}l22 7-22 8z" fill="#c23b2e" stroke="#2a2420" stroke-width="1.5"/></g>`;
  const ty = cy + i.r * .85 + 22;
  g += lab.map((t, k) => `<text class="nm" x="${cx}" y="${ty + k * 20}" text-anchor="middle">${t}</text>`).join('');
  g += lockd(i) ? `<text class="pct" x="${cx}" y="${cy - i.r - 8}" text-anchor="middle">LOCKED</text>`
    : `<text class="pct" x="${cx}" y="${cy - i.r * 1.1 - 6}" text-anchor="middle">${pct}%</text>`;
  return `<g class="isle ${lockd(i) ? 'rock' : ''}${rise && i.id === 'tempo' ? ' rise' : ''}" data-id="${i.id}" tabindex="0" role="button" aria-label="${i.name}, ${lockd(i) ? 'locked' : Pr.isConquered(i.id) ? 'conquered' : pct + ' percent'}">${g}</g>`;
}

export function renderVoyage(el, { navigate } = {}) {
  const rise = Pr.tempoUnlocked() && !Pr.tempoPending() && Pr.takeRise();
  const seaRings = ISLANDS.filter(i => !i.locked).map((i, n) => [1.7, 2.2, 2.8].map((k, j) => `<path class="c-sea" d="${blob(i.x, i.y, i.r, 50 + n * 3 + j, k, 12, .22)}"/>`).join('')).join('');
  const rhumbs = (cx, cy) => Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8; return `<line class="c-rhumb" x1="${cx}" y1="${cy}" x2="${f(cx + Math.sin(a) * 1100)}" y2="${f(cy - Math.cos(a) * 1100)}"/>`; }).join('');
  const waves = Array.from({ length: 11 }, (_, r) => `<path class="${r % 2 ? 'w2' : 'w1'}" d="M${-120 + (r * 23) % 60} ${50 + r * 66}${'q15 -7 30 0t30 0'.repeat(16)}"/>`).join('');
  const route = [[95, 700], ...ISLANDS.map(i => [i.x, i.y])];
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="Sea chart of your skills">
   <defs><clipPath id="cp"><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="20"/></clipPath>
    <linearGradient id="beamg" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#FFC857" stop-opacity=".75"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></linearGradient><radialGradient id="amb"><stop offset="0" stop-color="#FFC857" stop-opacity=".55"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></radialGradient></defs>
   <g clip-path="url(#cp)">${rhumbs(615, 690)}${rhumbs(110, 140)}<g class="waves">${waves}</g>${seaRings}
    <path class="c-route" d="${curve(route)}"/>
    ${ISLANDS.map((i, n) => islandSVG(i, 11 + n * 17, rise)).join('')}
    ${(() => { const hp = homePort(); return hp ? `<g class="isle" data-id="homeport" tabindex="0" role="button" aria-label="${sxEsc(hp.name)}, a secret island"><path class="c-cont" d="${blob(628, 300, 30, 77, 1.25)}"/><path class="c-land" d="${blob(628, 300, 30, 77)}"/><path class="c-ink" d="M618 306l5-10 5 7 5-12 6 15z"/><text class="nm" x="628" y="${300 + 26 + 20}" text-anchor="middle">${sxEsc(hp.name)}</text></g>` : ''; })()}
    ${rose(615, 690, 42)}</g>
   <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="20" fill="none" class="c-ink" opacity=".5"/>
   <g class="ship" transform="translate(95 700)"><g class="ship-b"><path class="wake" d="M-16 11q-10 3-24 1M-12 14q-9 3-20 3"/><path class="c-fill" d="M-14 2h28l-6 9h-16z"/><path class="c-ink" d="M0 2V-26"/><path class="c-fill" d="M2 -24c9 5 11 13 11 22H2z" opacity=".9"/><path class="c-fill" d="M-2 -18c-6 4-9 9-9 16h9z" opacity=".5"/></g>${boatName() ? `<text y="-32" text-anchor="middle" font-size="11" class="nm">${sxEsc(boatName())}</text>` : ''}</g>
   <text x="95" y="738" text-anchor="middle" font-size="15">GERALD · START</text>
  </svg>`;
  el.innerHTML = `<div class="chartwrap">${svg}<aside class="panel detail" id="vdetail" aria-live="polite"></aside></div>`;
  unroll(el.querySelector('.chartwrap'));
  const det = el.querySelector('#vdetail');
  /* ship sails along the route in proportion to total progress; after drills it glides on from where it last was */
  const rt = el.querySelector('.c-route'), ship = el.querySelector('.ship'), L = rt.getTotalLength();
  const live = ISLANDS.filter(i => !i.locked), frac = Math.min(1, live.reduce((a, i) => a + progress(i), 0) / (100 * live.length));
  const put = f => { const pt = rt.getPointAtLength(L * f); ship.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`); };
  const prev = Math.min(frac, store.get('ship', 0) || 0); store.set('ship', frac); put(prev);
  if (frac > prev && full()) { const t0 = performance.now() + 500, dur = 2400, step = t => { if (!el.isConnected) return; const k = Math.max(0, Math.min(1, (t - t0) / dur)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; put(prev + (frac - prev) * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); } else put(frac);
  const show = id => {
    if (id === 'homeport') { const hp = homePort(); if (!hp) return; el.querySelectorAll('.isle').forEach(n => n.classList.toggle('sel', n.dataset.id === id)); det.innerHTML = `<div class="row tight">${avatar('Skipper', 'pleased')}<div><span class="k">Secret island</span><h2>${sxEsc(hp.name)}</h2></div></div><p>Seven days in a row and the charts reveal home. Not a drill in sight. Just a quiet harbour.</p>`; return; }
    const i = ISLANDS.find(x => x.id === id), pct = progress(i);
    el.querySelectorAll('.isle').forEach(n => n.classList.toggle('sel', n.dataset.id === id));
    det.innerHTML = `<div class="row tight">${avatar(i.who, lockd(i) ? 'smug' : 'neutral')}<div><span class="k">${i.id === 'tempo' ? 'Final boss' : Pr.isConquered(i.id) ? 'Conquered' : 'Port of call'}</span><h2>${i.name}</h2></div></div>
     <p>${i.blurb}</p>
     ${i.id === 'tempo' && !lockd(i) ? `<p>He is waiting. All six islands are yours.</p><a class="btn mt1" href="#play/tempo">Face Tempo</a>` : lockd(i) ? `<p class="led" style="font-size:28px">Locked</p><p class="sm">${Pr.conqueredCount()} of 6 islands conquered.</p>` : `<div class="led big">${pct}%</div><div class="pbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><p class="sm">Guide: ${i.who}. ${i.id === 'leela' ? 'Opens the drills.' : 'Solve ' + i.goal + ' ' + i.who + ' puzzles to complete.'}</p>
     ${pct > 0 ? '<div class="harb" id="harb"></div>' : ''}
     <a class="btn mt1" href="${href(i)}">${i.id === 'leela' ? 'Open drills' : 'Set sail'}</a>
     ${Pr.BOSSES[i.id] ? (Pr.isConquered(i.id) ? '<p class="sm mt1"><b>Boss beaten.</b> Flag planted.</p>' : Pr.bossReady(i.id) ? `<a class="btn mt1" style="background:#c23b2e;color:#fff" href="#puzzles/boss-${i.id}">Challenge the boss</a>` : `<p class="sm mt1">Boss unlocks at 50% (${Math.ceil(i.goal / 2)} solves).</p>`) : ''}`}`;
    countAll(det);
    const hb = det.querySelector('#harb'); if (hb) import('./harbour.js').then(m => m.renderHarbour(hb, i.who)).catch(() => { });
  };
  el.querySelectorAll('.isle').forEach(n => {
    n.onclick = () => show(n.dataset.id);
    n.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(n.dataset.id); } };
  });
  show('middle');
  if (Pr.tempoPending() && !seq) { seq = true; import('./prog-ui.js').then(u => u.tempoSequence(el)).catch(console.error).then(() => { seq = false; Pr.tempoSeen(); if (el.isConnected) renderVoyage(el, { navigate }); }); }
}
