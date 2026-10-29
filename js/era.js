// Era scenes: layered inline SVG backdrops per character (master page, intro card, chat header). eraScene(name) -> SVG string.
const R = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const board = (x, y, s, a = '#d9c9a3', b = '#5b3b22') => R(64, i => `<rect x="${x + (i % 8) * s}" y="${y + (i >> 3) * s}" width="${s}" height="${s}" fill="${(i + (i >> 3)) % 2 ? b : a}"/>`);
const S = {
  Morphy: { cap: 'Café de la Régence, Paris 1858', g: ['#2a1608', '#120904'], body: () =>
    R(3, i => `<rect x="${40 + i * 120}" y="30" width="80" height="130" rx="40" fill="#3b2a1a" stroke="#c9a24b" stroke-width="3" opacity=".8"/><rect x="${48 + i * 120}" y="38" width="64" height="114" rx="32" fill="#6f5a3e" opacity=".35"/>`) +
    R(4, i => `<g class="era-flick" style="animation-delay:-${i * .7}s"><circle cx="${20 + i * 120}" cy="70" r="26" fill="#ffb347" opacity=".22"/><circle cx="${20 + i * 120}" cy="70" r="6" fill="#ffd27a"/></g>`) +
    `<rect y="180" width="400" height="60" fill="#1a0d05"/>` },
  Capablanca: { cap: 'Havana club, 1920s', g: ['#3a2a1a', '#1c140c'], body: () =>
    R(4, i => `<rect x="${20 + i * 100}" y="40" width="60" height="110" fill="#1e2f2a"/>` + R(9, k => `<rect x="${22 + i * 100}" y="${44 + k * 12}" width="56" height="6" fill="#5c7a64" opacity=".8"/>`)) +
    `<g transform="translate(200 18)"><g class="era-fan"><path d="M-70 0h140M0 -10v20" stroke="#2a1d10" stroke-width="7" stroke-linecap="round"/></g><circle r="8" fill="#c9a24b"/></g>` +
    `<path d="M0 0L60 240H0Z" fill="#ffe7b0" opacity=".08"/><rect y="185" width="400" height="55" fill="#2a1a0c"/>` },
  Tal: { cap: 'Riga, 1960', g: ['#2b2620', '#121010'], body: () =>
    `<g transform="translate(130 20)">${board(0, 0, 17, '#e8dfc8', '#4a3a28')}</g><rect x="126" y="16" width="144" height="144" fill="none" stroke="#2a1d10" stroke-width="6"/>` +
    R(5, i => `<rect x="${i * 85}" y="190" width="80" height="50" fill="#5b3b22" opacity="${.6 + (i % 2) * .2}"/>`) +
    R(3, i => `<ellipse class="era-smoke" style="animation-delay:-${i * 3}s" cx="${100 + i * 110}" cy="${110 + i * 15}" rx="120" ry="30" fill="#d8d0c0" opacity=".1"/>`) },
  Kasparov: { cap: 'Moscow, 1985 championship', g: ['#2a0c18', '#0c0408'], body: () =>
    `<g transform="translate(140 24)">${board(0, 0, 15, '#f2efe6', '#7a1e3c')}</g>` +
    R(3, i => `<path d="M${60 + i * 140} 0L${20 + i * 140} 240H${120 + i * 140}Z" fill="#fff4d8" opacity=".09"/>`) +
    `<rect y="176" width="400" height="64" fill="#3d0f22"/><path d="M0 176H400" stroke="#c9a24b" stroke-width="3"/>` },
  Carlsen: { cap: 'Modern tournament hall', g: ['#0c1a22', '#05090c'], body: () =>
    R(3, i => `<rect x="${24 + i * 128}" y="30" width="110" height="64" rx="4" fill="#0f2c2a" stroke="#3FB37F" stroke-width="2"/><path class="era-led" style="animation-delay:-${i}s" d="M${34 + i * 128} 80L${60 + i * 128} 60L${84 + i * 128} 70L${120 + i * 128} 44" stroke="#3FB37F" stroke-width="3" fill="none"/>`) +
    R(6, i => `<rect x="${10 + i * 66}" y="150" width="50" height="10" fill="#e6e9ec" opacity=".5"/>`) + `<rect y="190" width="400" height="50" fill="#0a1418"/>` },
  Leela: { cap: 'Server hall, 2018', g: ['#120c2e', '#05030f'], body: () =>
    R(6, i => `<rect x="${12 + i * 66}" y="30" width="48" height="190" fill="#0d0a22" stroke="#2a2260"/>` + R(10, k => `<circle class="era-led" style="animation-delay:-${(i * 7 + k) % 5}s" cx="${22 + i * 66 + (k % 3) * 12}" cy="${44 + k * 17}" r="2.2" fill="#7C6CFF"/>`)) +
    `<rect width="400" height="240" fill="url(#erav)" opacity=".5"/>` },
  Skipper: { cap: 'The yacht at sunset', g: ['#f29a5a', '#3a2a5a'], body: () =>
    `<circle cx="300" cy="150" r="46" fill="#ffd27a" opacity=".9"/><rect y="150" width="400" height="90" fill="#1d3550"/>` + R(5, i => `<path class="era-wave" d="M0 ${160 + i * 14}q50 -6 100 0t100 0t100 0t100 0" stroke="#ffb37a" stroke-opacity=".35" fill="none"/>`) +
    `<path d="M40 200h220l-30 26H70Z" fill="#f4efe6"/><path d="M150 196V60l70 136Z" fill="#fff" opacity=".9"/>` },
  Tempo: { cap: 'The studio', g: ['#1a1408', '#070503'], body: () =>
    R(8, i => `<rect x="${i * 50}" y="20" width="44" height="80" fill="#2a2010"/>` + R(4, k => `<path d="M${i * 50 + 4 + k * 10} 26v${60 - (i * 13 + k * 7) % 40}" stroke="#4a3a20" stroke-width="5"/>`)) +
    R(12, i => `<rect class="era-led" style="animation-delay:-${i * .23}s" x="${40 + i * 27}" y="${200 - (i * 37) % 70}" width="18" height="${(i * 37) % 70 + 6}" fill="#FFC857" opacity=".55"/>`) + `<rect y="206" width="400" height="34" fill="#140f05"/>` }
};
S.Gerald = S.Skipper;
export function eraScene(n) {
  const s = S[n]; if (!s) return '';
  return `<svg class="era" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><linearGradient id="eg-${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.g[0]}"/><stop offset="1" stop-color="${s.g[1]}"/></linearGradient><radialGradient id="erav"><stop offset=".4" stop-color="#7C6CFF" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="400" height="240" fill="url(#eg-${n})"/>${s.body()}<rect width="400" height="240" fill="#07111A" opacity=".52"/></svg>`;
}
export const eraCaption = n => (S[n] || {}).cap || '';
const CSS = `.era{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0}
html[data-anim=full] .era-flick{animation:eflk 2.6s ease-in-out infinite}@keyframes eflk{50%{opacity:.7}}
html[data-anim=full] .era-fan{animation:efan 4s linear infinite}@keyframes efan{to{transform:rotate(360deg)}}
html[data-anim=full] .era-smoke{animation:esmk 9s ease-in-out infinite}@keyframes esmk{50%{transform:translateX(30px);opacity:.18}}
html[data-anim=full] .era-led{animation:eled 2.4s ease-in-out infinite}@keyframes eled{50%{opacity:.25}}
@media(prefers-reduced-motion:reduce){.era *{animation:none!important}}
.intro .ifig.iph{width:150px;height:200px}.iph{position:relative;border-radius:var(--r-md);overflow:hidden}.iph .iphm{position:absolute;left:50%;top:50%;width:96px;height:96px;transform:translate(-50%,-50%);z-index:1}
.mhero.era-h{position:relative;overflow:hidden;border-radius:var(--r-lg);padding:18px;min-height:200px;display:flex;align-items:center;gap:18px}.mhero.era-h>*:not(.era){position:relative;z-index:1}
.mhero.era-h .mph{width:140px;height:140px;flex:none}.mhero.era-h .ecap{display:block;font-size:12px;opacity:.75;margin-top:4px}
@media(max-width:480px){.intro .ifig.iph{width:100px;height:150px}.mhero.era-h .mph{width:92px;height:92px}.mhero.era-h{gap:12px;padding:12px}}`;
if (!document.getElementById('mast-era-css')) { const s = document.createElement('style'); s.id = 'mast-era-css'; s.textContent = CSS; document.head.appendChild(s); }
