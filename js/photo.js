// Photo portraits: one path for every face in the app. photo(name, ex) -> HTML; photoSVG(name, x, y, r) -> <image> for inline SVG.
// Missing files (tempo.jpg until the creator adds it) fall back to the SVG portrait from portraits.js automatically.
import { portrait, CH } from './portraits.js';
const FILE = { Tal: 'tal', Capablanca: 'capablanca', Morphy: 'morphy', Leela: 'leela', Carlsen: 'carlsen', Kasparov: 'kasparov', Skipper: 'skipper', Tempo: 'tempo', Gerald: 'skipper' };
const MISSING = new Set();
const norm = ex => ({ neutral: 'pleased', happy: 'excited', sad: 'disappointed', worried: 'disappointed', celebrate: 'excited', boss: 'excited' }[ex] || ex || 'pleased');
export const photoSrc = (n, ex) => { const f = FILE[n]; if (!f) return null; const e = norm(ex); let k = f; if (e === 'char' && (n === 'Tempo' || n === 'Skipper')) return `assets/portraits/${f}_character.jpg`; if (n === 'Skipper' && e === 'excited') k = 'skipper_sax'; if (n === 'Tempo') k = e === 'excited' || e === 'boss' ? 'tempo_boss' : e === 'thinking' || e === 'disappointed' ? 'tempo_serious' : 'tempo'; const p = `assets/portraits/${k}.jpg`; return MISSING.has(p) ? null : p; };
const svgFallback = (n, ex, size = 96) => { try { return CH[n] ? portrait(n, norm(ex), size) : ''; } catch (e) { return ''; } };
export function photo(n, ex = 'pleased', cls = '') {
  const e = norm(ex), src = photoSrc(n, e), acc = (CH[n] || {}).acc || '#C9A24B';
  const inner = src ? `<img class="phi" src="${src}" alt="" decoding="async" draggable="false" data-pn="${n}" data-pe="${e}">` : `<span class="phs">${svgFallback(n, e)}</span>`;
  return `<span class="ph m-${e} ${cls}" style="--ac:${acc}" data-pn="${n}">${inner}</span>`;
}
/* inside an SVG: circular medallion centred at x,y */
let cid = 0;
export function photoSVG(n, x, y, r, ex = 'pleased') {
  const src = photoSrc(n, ex), id = 'phc' + (cid++), acc = (CH[n] || {}).acc || '#C9A24B';
  const img = src ? `<image class="phi" data-pn="${n}" data-pe="${norm(ex)}" href="${src}" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})" style="filter:var(--ph-grade)"/>`
    : svgFallback(n, ex, 64).replace('<svg ', `<svg x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" `);
  return `<g class="phg" transform="translate(${x} ${y})"><clipPath id="${id}"><circle r="${r}"/></clipPath><circle r="${r + 3}" fill="#07111A"/>${img}<circle r="${r}" fill="url(#phv)" pointer-events="none"/><circle r="${r + 1.5}" fill="none" stroke="${acc}" stroke-width="3"/></g>`;
}
export const PHV_DEF = '<radialGradient id="phv"><stop offset=".6" stop-color="#07111A" stop-opacity="0"/><stop offset="1" stop-color="#07111A" stop-opacity=".55"/></radialGradient>';
/* any photo that fails to load (e.g. tempo.jpg not added yet) swaps to the SVG portrait */
addEventListener('error', ev => {
  const t = ev.target; if (!t || !t.classList || !t.classList.contains('phi')) return;
  const src = t.getAttribute('src') || t.getAttribute('href'); if (src) MISSING.add(src);
  const n = t.dataset.pn, e = t.dataset.pe;
  if (t.tagName.toLowerCase() === 'img') { const s = document.createElement('span'); s.className = 'phs'; s.innerHTML = svgFallback(n, e); t.replaceWith(s); }
  else { const r = +t.getAttribute('width') / 2; const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = svgFallback(n, e, 64).replace('<svg ', `<svg x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" `); t.replaceWith(g); }
}, true);
const CSS = `:root{--ph-grade:saturate(.82) contrast(1.06) brightness(.94) sepia(.14) hue-rotate(-6deg)}
.ph{position:relative;display:block;width:100%;height:100%;border-radius:50%;overflow:hidden;background:#0b1a26;--mr:var(--ac);box-shadow:0 0 0 2px var(--ac),0 0 0 4px color-mix(in srgb,var(--mr) 70%,transparent);transition:box-shadow .4s,transform .4s}
.ph .phi,.ph .phs,.ph .phs svg{width:100%;height:100%;display:block;object-fit:cover;object-position:50% 28%;filter:var(--ph-grade)}
.ph::after{content:"";position:absolute;inset:0;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 50% 42%,transparent 55%,rgba(7,17,26,.55) 100%),linear-gradient(180deg,rgba(255,200,87,.06),rgba(23,49,75,.18))}
.ph.m-pleased{--mr:#FFC857}.ph.m-disappointed{--mr:#a5525a;transform:rotate(-3deg) scale(.97)}.ph.m-disappointed .phi{filter:var(--ph-grade) saturate(.7) brightness(.85)}
.ph.m-excited{--mr:color-mix(in srgb,var(--ac) 60%,#fff)}.ph.m-thinking{--mr:#7C6CFF}
html[data-anim=full] .ph.m-excited{animation:phx 1s ease-in-out 3}
html[data-anim=full] .ph.m-thinking{animation:pht 3.2s ease-in-out infinite}
html:not([data-anim=off]) .ph.m-pleased{transform:rotate(1.5deg)}
@keyframes phx{50%{transform:scale(1.06);box-shadow:0 0 0 2px var(--ac),0 0 0 6px var(--mr),0 0 18px var(--mr)}}
@keyframes pht{50%{box-shadow:0 0 0 2px var(--ac),0 0 0 6px color-mix(in srgb,#7C6CFF 40%,transparent),0 0 14px #7C6CFF;transform:rotate(-2deg)}}
@media(prefers-reduced-motion:reduce){.ph{animation:none!important;transition:none}}
.av>.ph,.pv>.ph,.pa>.ph{width:100%;height:100%}`;
if (!document.getElementById('mast-ph-css')) { const s = document.createElement('style'); s.id = 'mast-ph-css'; s.textContent = CSS; document.head.appendChild(s); }
