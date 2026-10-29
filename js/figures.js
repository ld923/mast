// Mast full-body figures: figure(name, pose, ex, opt) -> SVG string. Head comes from portraits.js (same rig), body is
// flat-shaded limbs + era clothing per outfit. Poses: stand, helm, lean, sit, celebrate, walk. ~5.5-6 heads tall.
// opt: {outfit:i, sil:true (night silhouette), cls}
import { portrait, OUTFITS, outfitIdx, CH } from './portraits.js';

let uid = 0;
const f1 = n => Math.round(n * 10) / 10;
const P2 = p => p.map(([x, y]) => f1(x) + ' ' + f1(y)).join('L');
/* a limb: dark under-stroke, base colour shifted left = right-side shadow band */
const limb = (pts, w, c, d) => `<path d="M${P2(pts)}" stroke="${d}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${P2(pts.map(([x, y]) => [x - w * .12, y]))}" stroke="${c}" stroke-width="${f1(w * .74)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const BASE = { sh: [[35, 90], [85, 90]], el: [[29, 138], [91, 138]], ha: [[31, 184], [89, 184]], hp: [[49, 192], [71, 192]], kn: [[47, 274], [73, 274]], ft: [[46, 352], [74, 352]], dy: 0, rot: 0 };
const POSE = {
  stand: {},
  helm: { el: [[22, 128], [98, 128]], ha: [[38, 150], [82, 150]] },
  lean: { el: [[17, 134], [103, 134]], ha: [[5, 168], [115, 168]], kn: [[55, 272], [64, 272]], ft: [[70, 352], [47, 350]], rot: -3 },
  sit: { dy: 44, sh: [[35, 134], [85, 134]], el: [[25, 186], [95, 186]], ha: [[45, 206], [75, 206]], hp: [[48, 236], [72, 236]], kn: [[40, 254], [80, 254]], ft: [[40, 340], [80, 340]] },
  celebrate: { el: [[20, 54], [100, 54]], ha: [[15, 6], [105, 6]], kn: [[40, 272], [80, 272]], ft: [[31, 352], [89, 352]] },
  walk: { el: [[27, 136], [94, 134]], ha: [[42, 178], [101, 174]], kn: [[44, 266], [77, 278]], ft: [[39, 346], [84, 356]], rot: 2 }
};
export const POSES = Object.keys(POSE);
const pose = p => ({ ...BASE, ...(POSE[p] || {}) });

/* default looks: base outfit specs (alt specs live in portraits.js OUTFITS) */
const spec = (name, i) => { const k = i == null ? outfitIdx(name) : i; return (OUTFITS[name] || [])[k] || (OUTFITS[name] || [])[0]; };

function leela(J, O, id, ex) {
  const g = { pleased: .9, disappointed: .45, excited: 1.3, thinking: .75 }[ex] || .9, gl = O.glow, lt = O.lt;
  const head = [60, 40], hip = [60, 200], tail = [60, 300];
  const N = [head, ...J.sh, ...J.el, ...J.ha, [60, 130], hip, [44, 250], [76, 250], tail];
  const E = [[0, 1], [0, 2], [1, 2], [1, 3], [3, 5], [2, 4], [4, 6], [1, 7], [2, 7], [7, 8], [8, 9], [8, 10], [9, 11], [10, 11], [9, 10], [0, 7]];
  return `<defs><radialGradient id="${id}o"><stop offset="0" stop-color="#fff" stop-opacity="${f1(.8 * g)}"/><stop offset=".35" stop-color="${lt}" stop-opacity="${f1(.55 * g)}"/><stop offset="1" stop-color="${gl}" stop-opacity="0"/></radialGradient></defs>
   <ellipse cx="60" cy="356" rx="34" ry="6" fill="${gl}" opacity=".35"/>
   <g class="fl"><ellipse cx="60" cy="160" rx="${f1(70 + g * 14)}" ry="${f1(150 + g * 16)}" fill="url(#${id}o)"/>
   <path d="M36 92Q60 80 84 92L78 200Q70 260 60 304Q50 260 42 200Z" fill="${gl}" opacity=".28"/>
   <circle cx="60" cy="40" r="24" fill="${gl}" opacity=".35"/>
   <g stroke="${lt}" stroke-width="2.4" stroke-opacity=".85" stroke-linecap="round">${E.map(([a, b]) => `<line x1="${f1(N[a][0])}" y1="${f1(N[a][1])}" x2="${f1(N[b][0])}" y2="${f1(N[b][1])}"/>`).join('')}</g>
   ${N.map(([x, y], i) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${i ? (ex === 'excited' ? 6 : 4.6) : 9}" fill="#fff"/>`).join('')}
   ${ex === 'thinking' ? `<circle cx="60" cy="40" r="20" fill="none" stroke="#fff" stroke-opacity=".5"/>` : ''}</g>`;
}

export function figure(name, poseName = 'stand', ex = 'pleased', opt = {}) {
  const id = 'fg' + (uid++), J = pose(poseName), O = spec(name, opt.outfit), dy = J.dy;
  if (poseName === 'celebrate') ex = 'excited';
  let body = '', defs = '';
  if (name === 'Leela') body = leela(J, O, id, ex);
  else {
    const H = portrait(name, ex, 200, { head: true, outfit: opt.outfit }), P = H.P, sk = P.sk;
    defs = H.defs;
    const s = .68, chin = 132 + (86 + P.h - 132) * 1.1, cy = 70 + dy;
    const S = J.sh[0][1] - 6, Hy = J.hp[0][1], pad = O.pads ? 3 : 0;
    const jk = O.jk, jd = O.jkD, tr = O.tr, td = O.trD;
    defs += `<linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${jk}"/><stop offset=".5" stop-color="${jk}"/><stop offset="1" stop-color="${jd}"/></linearGradient>`;
    const torsoD = `M${29 - pad} ${S + 5}Q60 ${S - 7} ${91 + pad} ${S + 5}L93 ${S + 42}Q90 ${f1((S + Hy) / 2 + 22)} 86 ${Hy + 5}H34Q30 ${f1((S + Hy) / 2 + 22)} 27 ${S + 42}Z`;
    const legW = 21, shinW = 18;
    // legs: back to front
    let legs = '';
    for (const i of [0, 1]) {
      const hp = J.hp[i], kn = J.kn[i], ft = J.ft[i];
      if (O.shorts) {
        const kk = lerp(hp, kn, .82);
        legs += limb([kn, ft], 13, sk[1], sk[2]) + limb([hp, kk], legW + 2, tr, td);
      } else legs += limb([hp, kn, ft], legW, tr, td) + (O.kind === 'track' ? `<path d="M${P2([hp, kn, ft].map(([x, y]) => [x + (i ? 6 : -6), y]))}" stroke="#fff" stroke-width="2" fill="none" opacity=".9"/>` : '');
      const sx = ft[0] + (i ? 3 : -3);
      legs += `<ellipse cx="${f1(sx)}" cy="${f1(ft[1] + 3)}" rx="12" ry="6" fill="${O.shoe}"/><path d="M${f1(sx - 11)} ${f1(ft[1] + 6)}h22" stroke="#000" stroke-opacity=".35" stroke-width="2"/>`;
    }
    if (poseName === 'sit') legs = `<path d="M24 ${Hy - 4}h72v12H24zM28 ${Hy + 8}v100M92 ${Hy + 8}v100" stroke="#4a2c14" stroke-width="5" fill="#6b4423"/>` + legs;
    // coat tails / long coat over the thighs
    const tails = O.long ? `<path d="M30 ${Hy - 6}Q26 ${Hy + 40} 28 ${Hy + 76}Q44 ${Hy + 82} 54 ${Hy + 74}L58 ${Hy}ZM90 ${Hy - 6}Q94 ${Hy + 40} 92 ${Hy + 76}Q76 ${Hy + 82} 66 ${Hy + 74}L62 ${Hy}Z" fill="${jk}"/><path d="M90 ${Hy - 6}Q94 ${Hy + 40} 92 ${Hy + 76}Q80 ${Hy + 80} 74 ${Hy + 76}L78 ${Hy}Z" fill="${jd}" opacity=".8"/>` : '';
    const cloak = O.cloak ? `<path d="M30 ${S}Q8 ${S + 120} 4 ${Hy + 96}H116Q112 ${S + 120} 90 ${S}Z" fill="${O.cloak}"/><path d="M8 ${Hy + 92}Q10 ${S + 120} 28 ${S + 20}L22 ${Hy + 92}ZM112 ${Hy + 92}Q110 ${S + 120} 92 ${S + 20}L98 ${Hy + 92}Z" fill="${O.lining}"/>` : '';
    // torso + clothing details
    let up = `<path d="${torsoD}" fill="url(#${id}t)"/>`;
    const V = (d, c) => `<path d="M50 ${S - 2}L60 ${S + d}L70 ${S - 2}Z" fill="${c}"/>`;
    const tie = O.tie ? (O.bow ? `<path d="M52 ${S + 3}l8 4 8-4v8l-8-4-8 4z" fill="${O.tie}"/>` : `<path d="M57 ${S + 2}h6l2 5-3 30-2 4-2-4-3-30z" fill="${O.tie}"/>`) : '';
    const btn = c => [S + 52, S + 66].map(y => `<circle cx="${O.kind === 'suit' ? 63 : 60}" cy="${y}" r="2.2" fill="${c}"/>`).join('');
    if (O.kind === 'shirt') up += `<path d="M50 ${S - 2}L60 ${S + 26}L70 ${S - 2}Z" fill="${sk[1]}"/><path d="M47 ${S - 3}L60 ${S + 26}L52 ${S + 4}ZM73 ${S - 3}L60 ${S + 26}L68 ${S + 4}Z" fill="#fff" opacity=".75"/><path d="M60 ${S + 28}V${Hy}" stroke="${jd}" stroke-width="1.5"/>` + [S + 40, S + 60, S + 80].map(y => `<circle cx="61.5" cy="${y}" r="1.6" fill="${jd}"/>`).join('');
    if (O.kind === 'open') up = `<path d="${torsoD}" fill="${O.sh}"/><path d="M50 ${S - 1}Q60 ${S + 9} 70 ${S - 1}" stroke="#d6d4cc" stroke-width="3" fill="none"/><path d="M${29} ${S + 5}Q40 ${S - 3} 49 ${S - 2}L53 ${Hy + 5}H34Q30 ${f1((S + Hy) / 2 + 22)} 27 ${S + 42}Z" fill="${jk}"/><path d="M91 ${S + 5}Q80 ${S - 3} 71 ${S - 2}L67 ${Hy + 5}H86Q90 ${f1((S + Hy) / 2 + 22)} 93 ${S + 42}Z" fill="${jd}"/>`;
    if (O.kind === 'jacket') up += `<path d="M48 ${S - 6}Q60 ${S + 4} 72 ${S - 6}L74 ${S + 4}Q60 ${S + 12} 46 ${S + 4}Z" fill="${jd}"/><path d="M60 ${S + 8}V${Hy + 4}" stroke="${jd}" stroke-width="2.4"/><path d="M36 ${S + 70}h14M70 ${S + 70}h14" stroke="${jd}" stroke-width="2"/>`;
    if (O.kind === 'suit') up += V(46, O.sh) + (O.vest ? `<path d="M50 ${S + 18}L60 ${S + 46}L70 ${S + 18}L72 ${S + 70}H48Z" fill="${O.vest}"/>` : '') + tie + `<path d="M46 ${S - 4}L60 ${S + 48}L52 ${S + 54}L42 ${S + 10}ZM74 ${S - 4}L60 ${S + 48}L68 ${S + 54}L78 ${S + 10}Z" fill="#000" opacity=".2"/>` + btn(O.brass ? '#E2C46A' : jd) + (O.hk ? `<path d="M70 ${S + 26}h10l-2 4h-6z" fill="#fff"/><path d="M71 ${S + 26}l2-4 2 4 2-4 2 4" fill="#fff"/>` : '');
    if (O.kind === 'hoodie') up += `<path d="M42 ${S - 2}Q60 ${S + 18} 78 ${S - 2}Q72 ${S - 12} 60 ${S - 10}Q48 ${S - 12} 42 ${S - 2}Z" fill="${jd}"/><path d="M54 ${S + 6}v24M66 ${S + 6}v24" stroke="#e8eef2" stroke-width="2" stroke-linecap="round"/><path d="M42 ${Hy - 36}H78L82 ${Hy - 6}H38Z" fill="${jd}" opacity=".55"/>`;
    if (O.kind === 'track') up += `<path d="M48 ${S - 6}Q60 ${S + 2} 72 ${S - 6}V${S + 2}Q60 ${S + 8} 48 ${S + 2}Z" fill="${jd}"/><path d="M60 ${S + 4}V${Hy + 4}" stroke="#fff" stroke-width="1.6" opacity=".8"/>`;
    if (O.kind === 'sweater') up += `<path d="M50 ${S - 3}L60 ${S + 8}L70 ${S - 3}" fill="${O.sh}"/><path d="M50 ${S - 3}Q60 ${S + 10} 70 ${S - 3}" stroke="${jd}" stroke-width="4" fill="none"/><path d="M34 ${Hy - 2}H86" stroke="${jd}" stroke-width="7"/>`;
    // arms
    const arm = i => {
      const a = [J.sh[i], J.el[i], J.ha[i]];
      const aw = 15 + (O.pads ? 1.5 : 0);
      let s2 = O.roll ? limb([J.el[i], J.ha[i]], 12, sk[1], sk[2]) + limb([J.sh[i], lerp(J.sh[i], J.el[i], 1.08)], aw, jk, jd) : limb(a, aw, jk, jd);
      if (O.kind === 'track') s2 += `<path d="M${P2(a.map(([x, y]) => [x + (i ? 5 : -5), y]))}" stroke="#fff" stroke-width="2" fill="none" opacity=".9"/>`;
      if (!O.roll) { const c = lerp(J.el[i], J.ha[i], .86); s2 += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${O.sh && O.kind === 'suit' ? 6.4 : 0}" fill="${O.sh || jk}"/>`; }
      const [hx, hy] = J.ha[i];
      return s2 + `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="7" fill="${sk[1]}"/><path d="M${f1(hx + 2)} ${f1(hy - 5)}a6 6 0 0 1 2 9" stroke="${sk[2]}" stroke-width="2" fill="none"/>`;
    };
    // props in hands
    let prop = '';
    const dirv = i => { const [ex2, ey2] = J.el[i], [hx, hy] = J.ha[i], l = Math.hypot(hx - ex2, hy - ey2) || 1; return [(hx - ex2) / l, (hy - ey2) / l]; };
    if (name === 'Tempo') for (const i of [0, 1]) { const [hx, hy] = J.ha[i], [dx, dy2] = dirv(i); prop += `<path d="M${f1(hx - dx * 6)} ${f1(hy - dy2 * 6)}L${f1(hx + dx * 34)} ${f1(hy + dy2 * 34)}" stroke="#7a5a32" stroke-width="4.4" stroke-linecap="round"/><path d="M${f1(hx - dx * 6)} ${f1(hy - dy2 * 6)}L${f1(hx + dx * 34)} ${f1(hy + dy2 * 34)}" stroke="#EACB96" stroke-width="2.6" stroke-linecap="round"/>`; }
    if (name === 'Tal' && poseName !== 'celebrate') { const [hx, hy] = J.ha[1]; prop += `<path d="M${hx - 2} ${hy - 4}l10 -6" stroke="#F4F2EC" stroke-width="2.6" stroke-linecap="round"/><circle cx="${hx + 8}" cy="${hy - 10}" r="1.6" fill="#ff7a2d"/><path class="smk" d="M${hx + 9} ${hy - 14}q-5-6 0-11t0-11" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>`; }
    if (name === 'Carlsen') { const [hx, hy] = J.ha[1]; prop += `<rect x="${hx - 1}" y="${hy - 16}" width="10" height="19" rx="2" fill="#2fbf71"/><rect x="${hx - 1}" y="${hy - 10}" width="10" height="5" fill="#0d3b25"/><rect x="${hx}" y="${hy - 17.5}" width="8" height="2" fill="#c9d0d4"/>`; }
    if (name === 'Kasparov') { const [wx, wy] = lerp(J.el[0], J.ha[0], .8); prop += `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="4.2" fill="#E2C46A" stroke="#8a6a20" stroke-width="1.2"/>`; }
    const hx = 60 - 100 * s, hy = cy - chin * s, nw = P.nw * s;
    const neck = `<path d="M${f1(60 - nw)} ${cy - 14}V${S + 2}Q60 ${S + 8} ${f1(60 + nw)} ${S + 2}V${cy - 14}Z" fill="${sk[1]}"/><path d="M${f1(60 - nw)} ${cy - 6}Q60 ${cy + 2} ${f1(60 + nw)} ${cy - 6}V${cy - 14}H${f1(60 - nw)}Z" fill="${sk[2]}" opacity=".7"/>`;
    const phones = name === 'Tempo' ? `<path d="M44 ${S + 2}Q60 ${S + 16} 76 ${S + 2}" stroke="#1f2026" stroke-width="4" fill="none"/><ellipse cx="44" cy="${S + 1}" rx="6" ry="7" fill="#26272e"/><ellipse cx="76" cy="${S + 1}" rx="6" ry="7" fill="#26272e"/>` : '';
    const head = `<g transform="translate(${f1(hx)} ${f1(hy)}) scale(${s})">${H.head}</g>`;
    body = `<ellipse cx="60" cy="358" rx="${poseName === 'celebrate' ? 40 : 34}" ry="6" fill="#000" opacity=".22"/>${cloak}${legs}${tails}${up}${arm(0)}${arm(1)}${neck}${phones}${head}${prop}`;
  }
  const fx = opt.sil ? `<filter id="${id}k"><feColorMatrix type="matrix" values="0 0 0 0 .03 0 0 0 0 .05 0 0 0 0 .09 0 0 0 1 0"/></filter>` : '';
  const tilt = J.rot ? ` transform="rotate(${J.rot} 60 360)"` : '';
  return `<svg class="fig fig-${poseName} ${opt.cls || ''}" viewBox="-30 -40 180 410" role="img" aria-label="${CH[name] ? CH[name].nick : name}"><defs>${defs}${fx}</defs><g${tilt}${opt.sil ? ` filter="url(#${id}k)"` : ''}><g class="fb">${body}</g></g></svg>`;
}

/* figure box helpers: viewBox is 180x410, feet at y=360 (400/410 down), centred */
export const FIG_AR = 180 / 410;
export const FIG_FOOT = 400 / 410;
export const FIG_CSS = `.fig{overflow:visible}.fig .fb{transform-box:fill-box;transform-origin:50% 100%}
.fig-walk .fb{animation:fwalk .4s ease-in-out infinite}.fig .fl{animation:ffloat 3.2s ease-in-out infinite}
.fig-celebrate .fb{animation:fjump .5s ease-out 3}
@keyframes fwalk{50%{transform:translateY(-3%) rotate(1deg)}}@keyframes ffloat{50%{transform:translateY(-10px)}}@keyframes fjump{40%{transform:translateY(-6%)}}
:root[data-anim=off] .fig .fb,:root[data-anim=off] .fig .fl,:root[data-anim=reduced] .fig .fb,:root[data-anim=reduced] .fig .fl{animation:none}
@media(prefers-reduced-motion:reduce){.fig .fb,.fig .fl{animation:none}}`;
export function figCSS() { if (document.getElementById('mast-fig-css')) return; const s = document.createElement('style'); s.id = 'mast-fig-css'; s.textContent = FIG_CSS; document.head.appendChild(s); }
