import { photoSVG, PHV_DEF } from './photo.js';
// Mast deck scene: the home screen. Layered inline SVG (sky / far / sea / ship), hotspots, parallax, day/night + weather from sky.js.
import { skyParts, miniSky, timeOfDay, weather, lampLevel } from './sky.js';
import { figure, FIG_AR, figCSS } from './figures.js';
import { moodEx, outfitOf } from './crewstate.js';
const fig = (n, pose, x, y, h, o = {}) => figure(n, pose, moodEx(n), { outfit: outfitOf(n), ...o }).replace('<svg ', `<svg x="${f1(x - h * FIG_AR / 2)}" y="${f1(y)}" width="${f1(h * FIG_AR)}" height="${f1(h)}" `);
import { getAnim } from './fx.js';
import { store } from './ui.js';
import { streakNow } from './progress.js';
import * as SX from './secrets.js';

const f1 = n => Math.round(n * 10) / 10;
const CREW = [['Morphy', 'morphy'], ['Tal', 'tal'], ['Kasparov', 'kasparov'], ['Carlsen', 'carlsen'], ['Capablanca', 'capablanca']];
// two compositions: wide (desktop) and tall (phone)
const LAY = {
  wide: { W: 1600, H: 900, hz: 430, mast: 230, boom: [230, 170, 930, 285], light: [1175, 432, 1], isles: [[420, 1.1], [760, .55]], rail: 600, stan: 530, table: [800, 705, 1], crate: [400, 800, 1], barrel: [1085, 808, .95], wheel: [1330, 690, 1], skip: [1478, 482, 168], lantern: [318, 470, 1], fs: 22 },
  tall: { W: 900, H: 1500, hz: 560, mast: 92, boom: [92, 250, 600, 395], light: [700, 562, .9], isles: [[250, .9], [520, .45]], rail: 770, stan: 690, table: [380, 945, .95], crate: [175, 1280, 1.1], barrel: [460, 1345, 1.05], wheel: [735, 1300, .95], skip: [770, 1085, 150], lantern: [160, 450, .75], fs: 34 }
};

/* ---------- props (local coordinates) ---------- */
const WOOD = (id, a, b, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
function defs(u) {
  return WOOD(u + 'mast', '#5a3a1e', '#d39c5c', '#4a2e16') + WOOD(u + 'brl', '#4f2f17', '#b77a40', '#3d230f') + WOOD(u + 'ped', '#3d2410', '#9a6232', '#2e1a0b') +
    `<linearGradient id="${u}deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4f2b"/><stop offset=".5" stop-color="#a87443"/><stop offset="1" stop-color="#c48d52"/></linearGradient>
    <linearGradient id="${u}cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6b06c"/><stop offset=".4" stop-color="#a86a34"/><stop offset="1" stop-color="#5c3517"/></linearGradient>
    <linearGradient id="${u}bulk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3519"/><stop offset="1" stop-color="#2c180a"/></linearGradient>
    <radialGradient id="${u}brass" cx=".35" cy=".3"><stop offset="0" stop-color="#fff2c0"/><stop offset=".45" stop-color="#d9a640"/><stop offset="1" stop-color="#7a5414"/></radialGradient>
    <linearGradient id="${u}sail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3df"/><stop offset=".6" stop-color="#e2d3b0"/><stop offset="1" stop-color="#a8977a"/></linearGradient>
    <linearGradient id="${u}parch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e7bf"/><stop offset=".55" stop-color="#e2c98e"/><stop offset="1" stop-color="#b89a5e"/></linearGradient>
    <linearGradient id="${u}top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58a50"/><stop offset="1" stop-color="#8a5629"/></linearGradient>
    <radialGradient id="${u}glow"><stop offset="0" stop-color="#FFC857" stop-opacity=".75"/><stop offset=".35" stop-color="#FF9F3A" stop-opacity=".28"/><stop offset="1" stop-color="#FF9F3A" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6c8" stop-opacity=".85"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient>
    <linearGradient id="${u}tower" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfc8bc"/><stop offset=".5" stop-color="#fffaf0"/><stop offset="1" stop-color="#9a948a"/></linearGradient>
    <radialGradient id="${u}shad"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
}
const shadow = (u, rx, ry, y = 0) => `<ellipse cx="0" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${u}shad)"/>`;

function wheel(u) {
  let sp = '';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + .2, c = Math.cos(a), s = Math.sin(a);
    sp += `<path d="M${f1(c * 20)} ${f1(s * 20)}L${f1(c * 112)} ${f1(s * 112)}" stroke="#5c3517" stroke-width="10"/><path d="M${f1(c * 20)} ${f1(s * 20)}L${f1(c * 108)} ${f1(s * 108)}" stroke="#c88a4a" stroke-width="4"/>
     <path d="M${f1(c * 122)} ${f1(s * 122)}L${f1(c * 150)} ${f1(s * 150)}" stroke="#4a2a12" stroke-width="15" stroke-linecap="round"/><path d="M${f1(c * 124)} ${f1(s * 124)}L${f1(c * 146)} ${f1(s * 146)}" stroke="#d9a062" stroke-width="5" stroke-linecap="round"/>`;
  }
  return `${shadow(u, 120, 22, 250)}<path d="M-26 40L26 40L44 250L-44 250Z" fill="url(#${u}ped)"/><path d="M-50 236h100v16h-100z" fill="#2e1a0b"/><rect x="-30" y="80" width="60" height="10" fill="url(#${u}brass)"/>
   <g class="sc-wheel"><circle r="112" fill="none" stroke="#3e220c" stroke-width="22"/><circle r="112" fill="none" stroke="url(#${u}cap)" stroke-width="16"/><circle r="112" fill="none" stroke="#f0c486" stroke-width="2" stroke-dasharray="40 30" opacity=".55"/>
   <circle r="94" fill="none" stroke="#5c3517" stroke-width="5"/>${sp}<circle r="24" fill="url(#${u}brass)"/><circle r="9" fill="#5a3a12"/></g>`;
}
function table(u) {
  const BL = [-118, -30], BR = [118, -30], FR = [152, 26], FL = [-152, 26];
  const P = (a, b) => [BL[0] + (BR[0] - BL[0]) * a + ((FL[0] + (FR[0] - FL[0]) * a) - (BL[0] + (BR[0] - BL[0]) * a)) * b, BL[1] + (FL[1] - BL[1]) * b];
  let sq = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const pts = [P(c / 8, r / 8), P((c + 1) / 8, r / 8), P((c + 1) / 8, (r + 1) / 8), P(c / 8, (r + 1) / 8)];
    sq += `<path d="M${pts.map(p => p.map(f1).join(' ')).join('L')}Z" fill="${(r + c) % 2 ? '#5f7d8f' : '#dfd3b0'}"/>`;
  }
  const pc = (c, r, kind, white) => {
    const [x, y] = P((c + .5) / 8, (r + .5) / 8), s = .75 + r / 8 * .45, f = white ? '#f6efdc' : '#2a2320', e = white ? '#b5a888' : '#0d0a09', h = white ? '#fff' : '#6a5a50';
    const body = { p: 'M-7 0h14l-3-8q4-4 0-9a5 5 0 1 0-8 0q-4 5 0 9z', k: 'M-9 0h18l-4-16q5-3 1-7h-3v-4h3v-3h-3v-3h-2v3h-3v3h3v4h-3q-4 4 1 7z', r: 'M-9 0h18l-3-17h4v-7h-4v3h-3v-3h-3v3h-3v-3h-4v7h4z', n: 'M-9 0h18l-2-10q2-12-9-15l-2-3-2 4q-5 4-6 10l5 1 4-3-6 10z' }[kind];
    return `<g transform="translate(${f1(x)} ${f1(y + 2)}) scale(${f1(s * 100) / 100})"><ellipse cx="0" cy="1" rx="11" ry="3" fill="#000" opacity=".3"/><path d="${body}" fill="${f}" stroke="${e}" stroke-width="1.2"/><path d="M-3 -6v-6" stroke="${h}" stroke-width="2" opacity=".5" stroke-linecap="round"/></g>`;
  };
  const pieces = [[6, 7, 'k', 1], [5, 6, 'p', 1], [6, 6, 'p', 1], [3, 5, 'r', 1], [1, 1, 'k', 0], [2, 2, 'n', 0], [4, 3, 'p', 0], [5, 3, 'p', 1]].sort((a, b) => a[1] - b[1]);
  return `${shadow(u, 210, 34, 175)}<path d="M-16 40h32l8 128h-48z" fill="url(#${u}ped)"/><path d="M-90 170q90-22 180 0l-14 8q-76-16-152 0z" fill="#3a2210"/>
   <ellipse cx="0" cy="14" rx="196" ry="56" fill="#4a2a12"/><ellipse cx="0" cy="0" rx="196" ry="56" fill="url(#${u}top)"/><ellipse cx="0" cy="-2" rx="184" ry="50" fill="none" stroke="#e7b475" stroke-opacity=".5" stroke-width="2"/>
   <path d="M${[BL, BR, FR, FL].map(p => p.join(' ')).join('L')}Z" fill="#3a2210" transform="translate(0 4)"/>${sq}<path d="M${[BL, BR, FR, FL].map(p => p.join(' ')).join('L')}Z" fill="none" stroke="#2a1608" stroke-width="3"/>
   ${pieces.map(p => pc(...p)).join('')}`;
}
function crate(u) {
  return `${shadow(u, 130, 24, 64)}<path d="M-95 -50h190v112h-190z" fill="#8f5f33"/><path d="M-95 -50l30-30h190l-30 30z" fill="#b98049"/><path d="M95 -50l30-30v112l-30 30z" fill="#6a4321"/>
   <path d="M-95 -14h190M-95 22h190M95 -14l30-30M95 22l30-30" stroke="#5e3a1a" stroke-width="2"/><path d="M-95 -50h14v112h-14zM81 -50h14v112h-14z" fill="#6e4524"/><path d="M-92 60l184-108" stroke="#6e4524" stroke-width="10"/>
   <text x="0" y="40" text-anchor="middle" font-family="Osw,Arial Narrow,sans-serif" font-weight="700" font-size="20" letter-spacing="4" fill="#2c1a0a" opacity=".45">CHARTS · N.O.</text>
   <g transform="translate(10 -70) rotate(-9)"><path d="M-80 -16h160a16 16 0 0 1 0 32h-160z" fill="url(#${u}parch)"/><ellipse cx="-80" cy="0" rx="9" ry="16" fill="#e9d7a6"/><path d="M-80 -6a6 6 0 1 1 0 10" stroke="#a88a52" stroke-width="2" fill="none"/>
    <path d="M-10 -16h12v32h-12z" fill="#b8352a"/><path d="M-4 16l-8 22M-2 16l9 20" stroke="#b8352a" stroke-width="4" stroke-linecap="round"/></g>
   <g transform="translate(-40 -60) rotate(4)"><path d="M0 0h70l-6 66h-70z" fill="url(#${u}parch)" opacity=".95"/><path d="M8 50q14-26 26-14t26-26" stroke="#b8352a" stroke-width="2" stroke-dasharray="4 4" fill="none"/><circle cx="58" cy="12" r="5" fill="none" stroke="#6b4a1e" stroke-width="1.5"/></g>`;
}
function barrel(u) {
  return `${shadow(u, 100, 22, 92)}<path d="M-70 -86Q-90 0 -70 88L70 88Q90 0 70 -86Z" fill="url(#${u}brl)"/>
   <path d="M-36 -88Q-44 0 -36 88M0 -88V88M36 -88Q44 0 36 88" stroke="#3a210d" stroke-width="2" opacity=".6" fill="none"/>
   <path d="M-80 -52Q0 -40 80 -52M-82 52Q0 64 82 52" stroke="#2a2420" stroke-width="10" fill="none"/><path d="M-80 -55Q0 -43 80 -55M-82 49Q0 61 82 49" stroke="#7d7268" stroke-width="2" fill="none"/>
   <ellipse cy="-86" rx="70" ry="18" fill="#c58f58"/><ellipse cy="-86" rx="60" ry="13" fill="none" stroke="#7a4b22" stroke-width="2"/>
   <g transform="translate(-6 -100)"><path d="M-58 4l78 -20l50 20l-78 22z" fill="#efe2bf"/><path d="M-58 4l78 -20l50 20l-78 22z" fill="#5c241a" transform="translate(0 -10)"/><path d="M-58 -6v10l78 22v-10z" fill="#e9dcb6"/><path d="M20 26v-10l50-20v10z" fill="#d8c79a"/>
    <path d="M-30 -2l58 -14" stroke="#d9a640" stroke-width="2"/><text transform="translate(2 4) rotate(-8) skewX(30) scale(1 .5)" text-anchor="middle" font-family="Osw,Arial Narrow,sans-serif" font-weight="700" font-size="22" fill="#e5b84f">LOG</text>
    <path d="M14 20q4 18 -4 34" stroke="#c23b2e" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
}
function lantern(u, lamp, streak) {
  const sb = Math.min(1, streak / 30), lg = Math.min(1, .25 + lamp * .75 + sb * .4); // longer streak, brighter lantern
  return `<circle r="${f1(170 * (1 + sb * .45))}" fill="url(#${u}glow)" class="sc-glow" style="--o:${f1(lg)}" pointer-events="none"/>
   <path d="M0 -80V-46" stroke="#2a2420" stroke-width="3"/><circle cy="-84" r="7" fill="none" stroke="#2a2420" stroke-width="3"/>
   <path d="M-22 -30L0 -48L22 -30Z" fill="#2c2a28"/><path d="M-26 -32h52v8h-52z" fill="url(#${u}brass)"/>
   <rect x="-20" y="-24" width="40" height="52" rx="4" fill="#FFD27A" opacity="${f1(Math.min(1, .35 + lamp * .5 + sb * .3))}"/><path d="M-20 -24v52M20 -24v52M0 -24v52" stroke="#2c2a28" stroke-width="3"/>
   <ellipse class="sc-flame" cx="0" cy="6" rx="${f1(6 + sb * 2)}" ry="${f1(11 + sb * 5)}" fill="#FFF3C4"/><path d="M-26 28h52v8h-52z" fill="url(#${u}brass)"/><path d="M-18 36h36l-6 8h-24z" fill="#2c2a28"/>
   <g transform="translate(0 68)"><rect x="-46" y="-14" width="92" height="30" rx="6" fill="url(#${u}brass)" stroke="#5a3d10" stroke-width="2"/><text y="7" text-anchor="middle" font-family="Osw,Arial Narrow,sans-serif" font-weight="700" font-size="18" letter-spacing="2" fill="#3a2608">${streak} DAY${streak === 1 ? '' : 'S'}</text></g>`;
}
function lighthouse(u, night) {
  return `<path d="M-150 2Q-110 -26 -60 -30Q-20 -54 30 -40Q90 -34 150 2Z" fill="#203040" opacity=".9"/><path d="M-150 2Q-80 -12 -30 -18Q40 -24 150 2Z" fill="#132230"/>
   <path d="M-12 -40L-8 -140H8L12 -40Z" fill="url(#${u}tower)"/><path d="M-11 -64h22v-16h-22zM-9 -104h18v-14h-18z" fill="#c23b2e" opacity=".9"/>
   <path d="M-14 -140h28v6h-28z" fill="#2a2a2a"/><rect x="-7" y="-156" width="14" height="16" fill="#FFE9A0" class="sc-lamp"/><path d="M-10 -156L0 -168L10 -156Z" fill="#2a2a2a"/>
   <g class="sc-beam" style="transform-origin:0 -148px"><path d="M0 -148L520 -186L520 -110Z" fill="url(#${u}beam)" opacity="${night ? .9 : .4}"/></g>
   <g class="sc-beam b2" style="transform-origin:0 -148px"><path d="M0 -148L-520 -186L-520 -110Z" fill="url(#${u}beam)" transform="scale(-1 1) translate(0 0)" opacity="0"/></g>`;
}
function hs(key, href, label, hit, inner, x, y, s = 1) {
  const [hx, hy, hw, hh] = hit;
  return `<g class="hs" data-k="${key}" data-href="${href}" tabindex="0" role="link" aria-label="${label}" transform="translate(${f1(x)} ${f1(y)}) scale(${s})">${inner}<rect class="hit" x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="18"/></g>`;
}
function chip(key, label, x, y, fs, cls = '') {
  const w = label.length * fs * .56 + fs * 1.4, h = fs * 1.9;
  return `<g class="chip ${cls}" data-k="${key}" transform="translate(${f1(x)} ${f1(y)})"><rect x="${f1(-w / 2)}" y="${f1(-h)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="#07111A" fill-opacity=".82" stroke="#FFC857" stroke-opacity=".7" stroke-width="1.5"/><text y="${f1(-h * .32)}" text-anchor="middle" font-family="Osw,Arial Narrow,sans-serif" font-weight="700" font-size="${fs}" letter-spacing="${f1(fs * .08)}" fill="#FFC857">${label.toUpperCase()}</text></g>`;
}
const wheelHit = (wx, wy, ws, sx, sy, ss) => { const top = Math.min(-160, (sy - ss / 2 - wy) / ws), right = Math.max(160, (sx - wx + ss / 2) / ws); return [-160, f1(top), f1(right + 160), f1(255 - top)]; };
const nest = (svg, x, y, s) => svg.replace('<svg ', `<svg x="${f1(x - s / 2)}" y="${f1(y - s / 2)}" width="${s}" height="${s}" `);

/* ---------- build ---------- */
let uid = 0;
export function deckSVG(kind, { streak = 0, drill = 'Convert', asp = 0 } = {}) {
  let L = LAY[kind];
  // phones: widen/narrow the canvas to the container's aspect so the whole deck fits with no cropping
  if (kind === 'tall' && asp) { const W2 = Math.max(840, Math.min(1000, Math.round(1500 * asp))), d = W2 - 900, X = (a, k) => [a[0] + d * k, ...a.slice(1)];
    L = { ...L, W: W2, boom: [92, 250, 600 + d / 2, 395], light: X(L.light, 1), isles: [L.isles[0], [L.isles[1][0] + d / 2, L.isles[1][1]]], table: X(L.table, .5), barrel: X(L.barrel, .5), wheel: X(L.wheel, 1), skip: X(L.skip, 1) }; }
  const { W, H, hz, fs } = L, u = 'dk' + (uid++), t = timeOfDay(), w = weather(), lamp = lampLevel(t), B = 80;
  const S = skyParts({ W, H, hz, t, w }), X = SX.deckParts(kind, L, u);
  const night = t === 'night' || t === 'dusk' || w === 'storm';
  const [ix, is] = L.isles[0], tempo = (t === 'night') ? `<g aria-hidden="true" opacity=".9">${fig('Tempo', 'celebrate', ix - 44 * is, hz - 58 * is - 52 * is, 52 * is, { sil: true })}</g>` : '';
  // far layer: islands + lighthouse
  const far = L.isles.map(([x, s]) => `<path transform="translate(${x} ${hz}) scale(${s} ${s * .8})" d="M-200 1Q-150 -30 -90 -36Q-40 -70 10 -52Q70 -64 120 -30Q170 -18 210 1Z" fill="${S.pal.far[0]}" opacity=".85"/><path transform="translate(${x + 40} ${hz}) scale(${s * .7} ${s * .5})" d="M-200 1Q-120 -40 -40 -30Q60 -60 210 1Z" fill="${S.pal.far[1]}" opacity=".6"/>`).join('');
  const [lx, ly, ls] = L.light;
  const far2 = tempo;
  const lh = hs('leela', '#masters/leela', "Leela's lighthouse", [-70, -200, 140, 210], lighthouse(u, night), lx, ly, ls);
  // ship: deck planks to a vanishing point, bulwark + caprail, stanchions, lifelines
  const vx = W / 2, R = L.rail, Hb = H + B;
  let planks = ''; for (let i = -14; i <= 14; i++) { const xb = vx + i * (W / 9), xt = vx + i * (W / 30); planks += `M${f1(xt)} ${R + 40}L${f1(xb)} ${Hb}`; }
  let seams = ''; for (let k = 1; k < 6; k++) { const y = R + 40 + Math.pow(k / 6, 1.6) * (Hb - R - 40); seams += `M${-B} ${f1(y)}H${W + B}`; }
  let stan = ''; for (let x = -40; x < W + 60; x += kind === 'wide' ? 160 : 150) stan += `<path d="M${x} ${R}V${L.stan}" stroke="#c9ccd0" stroke-width="5"/><circle cx="${x}" cy="${L.stan}" r="5" fill="#e8eaee"/>`;
  const [bx0, by0, bx1, by1] = L.boom, M = L.mast;
  const ship = `<path d="M${-B} ${R + 40}H${W + B}V${Hb}H${-B}Z" fill="url(#${u}deck)"/><path d="${planks}" stroke="#4a2c14" stroke-width="2.4" opacity=".55"/><path d="${seams}" stroke="#4a2c14" stroke-width="1.5" opacity=".25"/>
   <path d="M${-B} ${R + 40}H${W + B}V${R + 64}H${-B}Z" fill="#000" opacity=".18"/>
   <path d="M${-B} ${R}H${W + B}V${R + 42}H${-B}Z" fill="url(#${u}bulk)"/><path d="M${-B} ${R - 12}H${W + B}V${R + 6}H${-B}Z" fill="url(#${u}cap)"/><path d="M${-B} ${R - 12}H${W + B}" stroke="#ffd49a" stroke-width="2" opacity=".6"/>
   ${stan}<path d="M${-B} ${L.stan + 4}H${W + B}M${-B} ${f1((L.stan + R) / 2)}H${W + B}" stroke="#d6d9de" stroke-width="2" opacity=".75"/>
   <path d="M${M + 6} -${B}L-30 ${R - 10}M${M + 14} -${B}L${M + 300} ${R - 10}M${M + 10} -${B}L${M - 120} ${R - 10}" stroke="#2a2420" stroke-width="2.5" opacity=".8"/>
   <path d="M${M - 22} ${Hb}L${M - 16} -${B}H${M + 16}L${M + 22} ${Hb}Z" fill="url(#${u}mast)"/><path d="M${M - 19} ${R - 60}h38v14h-38zM${M - 18} ${by0 + 30}h36v12h-36z" fill="url(#${u}brass)"/>
   <path d="M${bx1} ${by1}L${bx1 + 40} -${B}M${bx1 - 10} ${by1}L${bx1 - 40} ${R - 10}" stroke="#2a2420" stroke-width="2" opacity=".7"/>
   <path d="M${bx0} ${by0}L${bx1} ${by1}" stroke="#3a220c" stroke-width="30" stroke-linecap="round"/><path d="M${bx0} ${by0 - 6}L${bx1} ${by1 - 4}" stroke="#c88a4a" stroke-width="8" stroke-linecap="round" opacity=".7"/>
   <path d="M${bx0 + 10} ${by0 - 14}Q${(bx0 + bx1) / 2} ${(by0 + by1) / 2 - 70} ${bx1 - 30} ${by1 - 18}L${bx1 - 30} ${by1 - 8}Q${(bx0 + bx1) / 2} ${(by0 + by1) / 2 - 18} ${bx0 + 10} ${by0 + 2}Z" fill="url(#${u}sail)"/>
   ${[.25, .45, .65, .85].map(k => { const x = bx0 + (bx1 - bx0) * k, y = by0 + (by1 - by0) * k; return `<path d="M${f1(x)} ${f1(y - 48 + k * 26)}V${f1(y + 6)}" stroke="#7a5a3a" stroke-width="4"/>`; }).join('')}`;
  const [tx, ty, ts] = L.table;
  // crew v2: two seated at the table (behind it), three leaning on the rail, Skipper at the helm
  const tall = kind === 'tall', SEAT = [['Tal', -138], ['Capablanca', 138]], RAIL = [['Morphy', tall ? 92 : 540], ['Kasparov', tall ? 252 : 1010], ['Carlsen', tall ? 650 + L.W - 900 : 1185]];
  const CID = n => n.toLowerCase(), cpos = {};
  const sitH = 300 * ts, railH = tall ? 330 : 300;
  const seated = SEAT.map(([n, ox]) => { const x = tx + ox * ts, top = ty - 30 * ts - .6 * sitH, w = sitH * FIG_AR; cpos[n] = [x, top];
    return hs('c-' + CID(n), '#masters/' + CID(n), `${n}, crew page`, [-w / 2, 0, w, sitH * .62], fig(n, 'sit', 0, 0, sitH), x, top); }).join('');
  const leaners = RAIL.map(([n, x]) => { const top = R - 6 - .507 * railH, w = railH * FIG_AR; cpos[n] = [x, top];
    return hs('c-' + CID(n), '#masters/' + CID(n), `${n}, crew page`, [-w / 2, 0, w, railH], fig(n, 'lean', 0, 0, railH), x, top); }).join('');
  const [cx, cy, cs] = L.crate, [rx, ry, rs] = L.barrel, [wx, wy, ws] = L.wheel, [sx, sy, ss] = L.skip, [nx, ny, nsc] = L.lantern;
  const props =
    `<path d="M${M + 16} ${ny - 90}H${nx}" stroke="#2a2420" stroke-width="6" stroke-linecap="round"/>` +
    leaners + seated +
    hs('table', '#drills/convert', `Chess table: today's drill, ${drill}`, tall ? [-180, -10, 360, 180] : [-200, -60, 400, 240], table(u), tx, ty, ts) +
    hs('chart', '#voyage', 'Sea chart: the Voyage', [-110, -110, 250, 190], crate(u), cx, cy, cs) +
    hs('log', '#review', "Ship's log: Review", [-95, -140, 190, 240], barrel(u), rx, ry, rs) +
    hs('wheel', '#play', 'Ship’s wheel: take the helm, Play', tall ? [-130, -236, 290, 400] : [-160, -236, 320, 400], `${fig('Skipper', 'helm', 0, -72 - .463 * 330, 330)}${wheel(u)}`, wx, wy, ws) +
    hs('lantern', '#drills', `Lantern: ${streak} day streak, drills`, [-60, -100, 120, 200], lantern(u, lamp, streak), nx, ny, nsc);
  const tint = S.pal.tint[1] ? `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${S.pal.tint[0]}" opacity="${S.pal.tint[1]}" pointer-events="none"/>` : '';
  // lantern light pool sits above the tint so it reads as a light source at night
  const pool = `<g pointer-events="none" transform="translate(${nx} ${ny})"><circle r="${f1(210 * nsc)}" fill="url(#${u}glow)" class="sc-glow" style="--o:${f1(lamp * .8)}"/></g>`;
  // keep every label (and its photo bubble) inside the frame on the narrow composition
  const clx = (l, x) => tall ? Math.max(Math.max(l.length * fs * .28 + fs * .7, fs * 1.7 + 4) + 18, Math.min(W - Math.max(l.length * fs * .28 + fs * .7, fs * 1.7 + 4) - 18, x)) : x;
  const ch = (k, l, x, y, c) => chip(k, l, clx(l, x), y, fs, c);
  const chips = ch('table', "Today's drill", tx, ty - 205 * ts) + Object.entries(cpos).map(([n, [x, y]]) => `<g class="chip cm cmp" data-k="c-${CID(n)}">${photoSVG(n, f1(clx(n, x)), f1(y - fs * 4), fs * 1.7, moodEx(n))}</g>` + ch('c-' + CID(n), n, x, y - 4, 'cm')).join('') +
    ch('chart', 'Voyage chart', cx + 10 * cs, cy - 110 * cs) + ch('log', "Ship's log", rx, ry - 145 * rs) + ch('wheel', 'Take the helm', wx, wy - 236 * ws - 6) +
    ch('lantern', `Streak · ${streak}`, nx + 10, ny - 105 * nsc) + ch('leela', "Leela's light", lx, ly - 175 * ls);
  return `<svg class="deck t-${t} w-${w}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="The ship's deck. ${t}, ${w}.">
   <defs>${S.defs}${defs(u)}${PHV_DEF}</defs>
   <g class="L" data-d=".08">${S.sky}</g><g class="L" data-d=".2">${far}${far2}${lh}${X.back}</g><g class="L" data-d=".32">${S.sea}${X.sea}</g>
   <g class="L" data-d="1"><g class="sc-roll">${ship}${props}${X.ship}</g></g>
   <g class="L" data-d="1" pointer-events="none">${S.veil}${tint}${pool}${S.rain}${X.over}</g>
   <g class="L chips" data-d="1" pointer-events="none">${chips}</g></svg>`;
}

/* ---------- mount: routing, chips, parallax, refresh ---------- */
let active = null, P = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, sy: 0, base: null };
const isTall = el => (el.clientWidth || innerWidth) < 700;
export function mountDeck(el, data) {
  figCSS(); SX.onVisit();
  // phones: scene fills edge to edge and exactly the space between header and bottom nav
  const fit = () => { if (!el.isConnected) return removeEventListener('resize', fit); const nv = document.getElementById('nav'); if (!matchMedia('(max-width:820px)').matches || !nv) { el.style.height = ''; return; } const top = el.getBoundingClientRect().top + scrollY, vh = (visualViewport ? visualViewport.height : innerHeight); el.style.height = Math.max(120, Math.round(vh - top - nv.getBoundingClientRect().height)) + 'px'; };
  const draw = () => { el.dataset.kind = isTall(el) ? 'tall' : 'wide'; fit(); const asp = el.clientHeight ? el.clientWidth / el.clientHeight : 0; el.dataset.asp = asp.toFixed(2); el.innerHTML = deckSVG(el.dataset.kind, { ...data, asp }); el.dataset.t = timeOfDay(); el.dataset.w = weather(); wire(); };
  const wire = () => {
    const svg = el.querySelector('svg'); active = { el, svg, layers: [...svg.querySelectorAll('.L')].map(g => [g, +g.dataset.d]) };
    const show = (k, on) => svg.querySelectorAll(`.chip[data-k="${k}"]`).forEach(c => c.classList.toggle('on', on));
    // phones: first tap highlights + labels a hotspot, second tap goes
    const phone = () => matchMedia('(max-width:480px)').matches; let sel = null;
    const clear = () => { if (sel) { show(sel.dataset.k, false); sel.classList.remove('sel'); sel = null; } };
    svg.addEventListener('click', e => { if (!e.target.closest('.hs, .sx-h')) clear(); });
    svg.querySelectorAll('.hs').forEach(h => {
      const nav = () => { location.hash = h.dataset.href; }, go = h.dataset.k === 'log' ? () => SX.barrelTap(nav) : nav;
      h.addEventListener('click', e => { if (phone() && sel !== h) { e.stopPropagation(); clear(); sel = h; h.classList.add('sel'); show(h.dataset.k, true); return; } go(); });
      h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      h.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(h.dataset.k, true); }); h.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && sel !== h) show(h.dataset.k, false); });
      h.addEventListener('focus', () => show(h.dataset.k, true)); h.addEventListener('blur', () => show(h.dataset.k, false));
    });
    SX.wireDeck(svg); apply(true);
  };
  draw(); addEventListener('resize', fit); requestAnimationFrame(fit); document.fonts && document.fonts.ready.then(fit);
  const rd = () => { if (!el.isConnected) return document.removeEventListener('mast:deckredraw', rd); draw(); }; document.addEventListener('mast:deckredraw', rd);
  let rt = 0; const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!el.isConnected) return ro.disconnect(); fit(); const k = isTall(el) ? 'tall' : 'wide'; if (k !== el.dataset.kind || (k === 'tall' && el.clientHeight && Math.abs(el.clientWidth / el.clientHeight - el.dataset.asp) > .02)) draw(); }, 150); });
  ro.observe(el);
  const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); if (timeOfDay() !== el.dataset.t) draw(); }, 5 * 60e3);
  listen();
  return { weather: weather(), time: timeOfDay() };
}
function apply(now) {
  if (!active || !active.el.isConnected) { active = null; return; }
  const on = getAnim() === 'full';
  if (!on) { P.tx = P.ty = 0; }
  const k = now || !on ? 1 : .08;
  P.x += (P.tx - P.x) * k; P.y += (P.ty - P.y) * k;
  const sc = on ? Math.min(60, P.sy) : 0;
  for (const [g, d] of active.layers) g.style.transform = (P.x || P.y || sc) ? `translate(${f1(-P.x * d * 22)}px,${f1(-P.y * d * 14 + sc * (1 - d) * .5)}px)` : '';
  if (Math.abs(P.tx - P.x) > .002 || Math.abs(P.ty - P.y) > .002) P.raf = requestAnimationFrame(() => apply(false)); else P.raf = 0;
}
const kick = () => { if (!P.raf && active) P.raf = requestAnimationFrame(() => apply(false)); };
let listening = false;
function listen() {
  if (listening) return; listening = true;
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || !active || getAnim() !== 'full') return; P.tx = e.clientX / innerWidth * 2 - 1; P.ty = e.clientY / innerHeight * 2 - 1; kick(); }, { passive: true });
  addEventListener('scroll', () => { P.sy = scrollY; if (active) kick(); }, { passive: true });
  // tilt: only where no permission prompt is needed (Android Chrome); iOS-style requestPermission is skipped
  if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', e => {
      if (!active || getAnim() !== 'full' || e.gamma == null) return;
      if (!P.base) P.base = [e.gamma, e.beta];
      P.base[0] += (e.gamma - P.base[0]) * .01; P.base[1] += (e.beta - P.base[1]) * .01; // slowly re-centre
      P.tx = Math.max(-1, Math.min(1, (e.gamma - P.base[0]) / 20)); P.ty = Math.max(-1, Math.min(1, (e.beta - P.base[1]) / 20)); kick();
    }, { passive: true });
  }
}
export const streakCount = () => streakNow(); // 'mast.progress.streak' is written by progress.js

/* ---------- Captain's cabin: Review backdrop. Porthole shows the same sky/weather. ---------- */
export function cabinSVG() {
  const u = 'cb' + (uid++), t = timeOfDay(), lamp = lampLevel(t), ms = miniSky(260, 260, 150, { t });
  let boards = ''; for (let x = 0; x < 1700; x += 92) boards += `<path d="M${x} 0V720" stroke="#2a160a" stroke-width="3" opacity=".6"/><path d="M${x + 3} 0V720" stroke="#c88a50" stroke-width="1" opacity=".18"/>`;
  let rh = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; rh += `M0 0L${f1(Math.cos(a) * 200)} ${f1(Math.sin(a) * 130)}`; }
  let lines = ''; for (let i = 0; i < 7; i++) lines += `M${-150 + i * 3} ${-40 + i * 13}h120M${30 + i * 3} ${-44 + i * 13}h118`;
  return `<svg class="cabin t-${t}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs(u)}${ms.defs}
   <linearGradient id="${u}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a170b"/><stop offset=".5" stop-color="#5a341a"/><stop offset="1" stop-color="#3a2210"/></linearGradient>
   <radialGradient id="${u}warm" cx=".5" cy=".2" r=".8"><stop offset="0" stop-color="#ffb347" stop-opacity="${f1(.3 + lamp * .2)}"/><stop offset=".6" stop-color="#ff8a2a" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
   <clipPath id="${u}port"><circle cx="0" cy="0" r="118"/></clipPath></defs>
   <rect width="1600" height="900" fill="url(#${u}wall)"/>${boards}
   <path d="M0 0H1600V60Q800 120 0 60Z" fill="#1c0e05"/><path d="M0 60Q800 120 1600 60" stroke="#8a5629" stroke-width="6" fill="none"/>
   <g transform="translate(330 300) rotate(-3)"><path d="M-220 -150h440v300h-440z" fill="url(#${u}parch)"/><path d="M-220 -150h440v300h-440z" fill="none" stroke="#6b4a1e" stroke-width="3"/>
    <path d="${rh}" stroke="#6b4a1e" stroke-width="1" opacity=".35"/><path d="M-200 60Q-150 0 -90 30T20 -10Q80 -60 140 -20T210 -40V140H-200Z" fill="#c9ad74" opacity=".7"/><path d="M-60 -100Q0 -40 60 10T170 90" stroke="#b8352a" stroke-width="3" stroke-dasharray="8 7" fill="none"/>
    <circle cx="-150" cy="-90" r="34" fill="none" stroke="#6b4a1e" stroke-width="2"/><path d="M-150 -130V-50M-190 -90H-110" stroke="#6b4a1e" stroke-width="2"/><circle cx="-210" cy="-140" r="6" fill="#8a8a8a"/><circle cx="210" cy="-140" r="6" fill="#8a8a8a"/></g>
   <g transform="translate(1180 320)"><circle r="150" fill="#2a170b"/><circle r="140" fill="url(#${u}brass)"/><circle r="122" fill="#3a2608"/>
    <g clip-path="url(#${u}port)"><g transform="translate(-130 -130)">${ms.body}</g></g><circle r="118" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="10"/><path d="M-70 -80Q-20 -110 40 -100" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<circle cx="${f1(Math.cos(a) * 131)}" cy="${f1(Math.sin(a) * 131)}" r="6" fill="#7a5414"/>`; }).join('')}</g>
   <g transform="translate(800 230)">${lantern(u, lamp, 0).replace(/<g transform="translate\(0 68\)">.*?<\/g>/, '')}</g><path d="M800 60V150" stroke="#2a2420" stroke-width="3"/>
   <path d="M-40 700H1640L1700 900H-100Z" fill="#6a3d1c"/><path d="M-40 700H1640V728H-40Z" fill="url(#${u}cap)"/>
   <g transform="translate(560 780) rotate(-4)"><path d="M-170 -40Q-90 -60 0 -44Q90 -60 170 -40L176 40Q90 26 0 44Q-90 26 -176 40Z" fill="#f2e6c6"/><path d="M0 -44V44" stroke="#b9a676" stroke-width="3"/><path d="${lines}" stroke="#6b5a3e" stroke-width="2" opacity=".55"/><path d="M-176 40Q-90 26 0 44Q90 26 176 40l4 10Q90 38 0 56Q-90 38 -180 50Z" fill="#5c241a"/></g>
   <g transform="translate(860 760)"><ellipse rx="34" ry="10" cy="30" fill="#000" opacity=".3"/><path d="M-26 -10h52v40h-52z" fill="#1a2430"/><ellipse rx="26" ry="8" cy="-10" fill="#2e3c4c"/><path d="M6 -14Q40 -120 110 -170Q60 -90 14 -12Z" fill="#f4efe2"/><path d="M8 -14Q50 -100 110 -170" stroke="#b9b2a0" stroke-width="2" fill="none"/></g>
   <rect width="1600" height="900" fill="url(#${u}warm)"/></svg>`;
}
