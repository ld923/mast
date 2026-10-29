// Port-town vignettes for Voyage islands: dock, era buildings, the master on the dock, and their 'open' line.
import { miniSky } from './sky.js';
import { portrait } from './portraits.js';

const f1 = n => Math.round(n * 10) / 10;
// era palettes and roof styles per guide
const TOWN = {
  Morphy: { name: 'New Orleans, 1850s', cols: ['#e9b8a2', '#a9cbb4', '#f1d98f', '#c9a7c9'], roof: 'flat', iron: true, hill: '#5e7a5a' },
  Tal: { name: 'Riga, 1960s', cols: ['#c9553a', '#e8c07a', '#6f8f6a', '#d9cfb8'], roof: 'gable', spire: true, hill: '#3e5544' },
  Kasparov: { name: 'Baku, 1980s', cols: ['#d8bf92', '#c8a878', '#b89466', '#e2cfa6'], roof: 'flat', tower: true, hill: '#8a6e50' },
  Carlsen: { name: 'Lofoten, today', cols: ['#a83228', '#d9a03a', '#f2ede2', '#a83228'], roof: 'gable', mount: true, hill: '#4b5d6b' },
  Capablanca: { name: 'Havana, 1920s', cols: ['#4fb3c9', '#f2c14e', '#e86a5a', '#f4efe6'], roof: 'flat', dome: true, hill: '#5d8a58' },
  Leela: { name: 'The Lighthouse Quay', cols: ['#3a3f6a', '#5a5f9a', '#7C6CFF', '#c8c4ff'], roof: 'flat', light: true, hill: '#2a2f4a' }
};
let LINES = null;
const lines = () => LINES || (LINES = fetch('data/characters.json').then(r => r.json()).then(j => j.characters).catch(() => ({})));

function house(x, w, h, col, T, i) {
  const y = 150 - h, gable = T.roof === 'gable';
  let s = `<path d="M${x} 150V${y}H${x + w}V150Z" fill="${col}"/><path d="M${x + w - 6} 150V${y}H${x + w}V150Z" fill="#000" opacity=".15"/>`;
  if (gable) s += `<path d="M${x - 3} ${y}L${x + w / 2} ${y - w * .55}L${x + w + 3} ${y}Z" fill="${i % 2 ? '#3a2a24' : '#5a2a22'}"/>`;
  else s += `<path d="M${x - 3} ${y - 5}H${x + w + 3}V${y}H${x - 3}Z" fill="#fff" opacity=".5"/>`;
  const rows = Math.max(1, Math.floor((h - 18) / 18)), cols = Math.max(1, Math.floor(w / 16));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect x="${f1(x + 5 + c * (w - 10) / cols)}" y="${f1(y + 8 + r * 18)}" width="${f1((w - 10) / cols - 5)}" height="10" rx="1" fill="${T.light ? '#FFE9A0' : '#2a3442'}" opacity="${T.light ? .8 : .7}"/>`;
  if (T.iron && h > 40) s += `<path d="M${x + 2} ${y + 26}H${x + w - 2}" stroke="#222" stroke-width="2"/><path d="M${x + 2} ${y + 30}H${x + w - 2}" stroke="#222" stroke-width="1" stroke-dasharray="2 3"/>`;
  return s;
}
export function harbourSVG(who) {
  const T = TOWN[who] || TOWN.Morphy, sk = miniSky(600, 230, 150);
  let town = `<path d="M-10 150Q80 ${T.mount ? 30 : 110} 170 120Q260 ${T.mount ? 50 : 100} 360 118Q470 ${T.mount ? 20 : 104} 610 150Z" fill="${T.hill}" opacity=".9"/>`;
  const ws = [46, 38, 54, 34, 48, 40, 44], hs = [64, 48, 80, 42, 70, 56, 60];
  let x = 165;
  ws.forEach((w, i) => { town += house(x, w, hs[i], T.cols[i % T.cols.length], T, i); x += w + 4; });
  if (T.spire) town += `<path d="M118 150V70h20v80z" fill="#6f8f6a"/><path d="M114 70L128 10L142 70Z" fill="#3e5a4a"/>`;
  if (T.dome) town += `<path d="M104 150V96h46v54z" fill="#f4efe6"/><path d="M104 96a23 23 0 0 1 46 0z" fill="#c9a24b"/>`;
  if (T.tower) town += `<path d="M110 150V70a20 6 0 0 1 40 0V150z" fill="#c8a878"/><path d="M110 70a20 6 0 0 1 40 0" fill="#a08460"/>`;
  if (T.light) town += `<path d="M112 150L118 50H136L142 150Z" fill="#f4f0e8"/><rect x="118" y="36" width="18" height="14" fill="#FFE9A0"/><path d="M127 43L-20 20V66Z" fill="#fff6c8" opacity=".35" class="sc-beam" style="transform-origin:127px 43px"/>`;
  const P = portrait(who, 'pleased', 90).replace('<svg ', '<svg x="494" y="96" width="90" height="90" ');
  return `<svg class="harbour" viewBox="0 0 600 230" role="img" aria-label="${T.name} harbour"><defs>${sk.defs}</defs>${sk.body}${town}
   <path d="M-10 150H610V160H-10Z" fill="#000" opacity=".15"/>
   ${[40, 120, 200, 280, 360, 440, 520].map(px => `<path d="M${px} 186V230" stroke="#3a220c" stroke-width="10"/>`).join('')}
   <path d="M-10 182H610V196H-10Z" fill="#a87443"/><path d="M-10 182H610" stroke="#e6b06c" stroke-width="2"/><path d="M-10 196H610V204H-10Z" fill="#5c3517"/>
   <path d="M80 182v-14h10v14zM300 182v-14h10v14z" fill="#2a2420"/><path d="M85 168q30 6 40 14" stroke="#c9b48a" stroke-width="3" fill="none"/>
   <ellipse cx="539" cy="186" rx="34" ry="6" fill="#000" opacity=".3"/>${P}
   <text x="12" y="222" font-family="Osw,Arial Narrow,sans-serif" font-weight="700" font-size="13" letter-spacing="2" fill="#fff" opacity=".85">${T.name.toUpperCase()}</text></svg>`;
}
export async function renderHarbour(el, who) {
  el.innerHTML = harbourSVG(who);
  const L = await lines(), arr = (L[who] && L[who].lines && L[who].lines.open) || [];
  const line = arr.length ? arr[Math.floor(Date.now() / 864e5) % arr.length] : '';
  if (line && el.isConnected) el.insertAdjacentHTML('beforeend', `<p class="harb-line"><b>${who}:</b> “${line.replace(/[{}]/g, '')}”</p>`);
}
