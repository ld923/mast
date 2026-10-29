// Secrets: scenes, deck layer (ghost ship, bottle, parrot, Tempo cameo, hatch, seasons, rainbow), mini-games (drums, riddles, ghost game).
import { photo, photoSVG } from './photo.js';
import { CH } from './portraits.js';
import * as Pr from './progress.js';
import { play as sfx, playAt } from './sound.js';
import { full, getAnim, confetti, wash, buzz } from './fx.js';
import { Board } from './board2.js';
import { RIDDLES } from './riddles.js';
import { STORIES } from './stories.js';
let S, ST, save, find, cameo, ov, esc, qp, dbg, today; // bound by secrets.js (avoids an import cycle at load)
export function bind(core) { S = core; ({ ST, save, find, cameo, ov, esc, qp, dbg, today } = core); }
const f1 = n => Math.round(n * 10) / 10;
const pick = a => a[Math.floor(Math.random() * a.length)];
const dbgf = k => { const v = qp('sx'); return !!v && v.split(',').includes(k); };

export const CSS = `
.sx-ov{position:fixed;inset:0;z-index:9500;display:grid;place-items:center;background:rgba(3,8,14,.8);opacity:0;transition:opacity .25s;padding:14px;overflow:auto;-webkit-overflow-scrolling:touch}
.sx-ov.on{opacity:1}
.sx-box{position:relative;width:min(94vw,460px);max-height:92vh;overflow:auto;border-radius:20px;padding:18px 16px 16px;background:linear-gradient(180deg,#14283a,#0a1722);border:1px solid rgba(201,162,75,.45);box-shadow:0 18px 60px rgba(0,0,0,.6);color:var(--fg,#f2ead8);text-align:center}
.sx-box h2{margin:6px 0 4px}.sx-box p{margin:8px 0}.sx-box .k{display:block}
.sx-x{position:absolute;right:8px;top:8px;min-width:44px;min-height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:inherit;font-size:20px;cursor:pointer}
.sx-ph{display:inline-block;width:56px;height:56px;border-radius:50%;overflow:hidden;flex:none}.sx-ph .ph,.sx-ph img,.sx-ph svg{width:100%;height:100%}
.sx-ph.sil{display:grid;place-items:center;background:rgba(255,255,255,.05);color:#8fa3b5}.sx-sil{width:60%;height:60%}
.sx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.sx-card{display:flex;gap:12px;align-items:center;padding:12px;border-radius:16px;background:var(--glass,rgba(255,255,255,.04));border:1px dashed rgba(255,255,255,.18)}
.sx-card.on{border:1px solid var(--ac,#C9A24B);border-style:solid;background:linear-gradient(90deg,rgba(255,200,87,.08),transparent)}
.sx-card b{display:block}.sx-card p{margin:2px 0}
.sx-cam{position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));transform:translate(-50%,24px);z-index:9400;width:min(92vw,380px);display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:16px;background:#0c1b28;border:1px solid var(--ac,#C9A24B);box-shadow:0 10px 40px rgba(0,0,0,.55);opacity:0;transition:opacity .35s,transform .35s;cursor:pointer;color:#f2ead8}
.sx-cam.on{opacity:1;transform:translate(-50%,0)}.sx-cam p{margin:2px 0 0;font-size:14px;line-height:1.35}.sx-camp{width:52px;height:52px;border-radius:50%;overflow:hidden;flex:none;display:block}
.sx-dim{position:fixed;inset:0;z-index:8000;pointer-events:none;background:radial-gradient(ellipse at 50% 40%,rgba(0,0,0,.2),rgba(0,0,0,.78));opacity:0;transition:opacity 1.2s}
.sx-dim.on{opacity:1}
.sx-seat{position:fixed;right:10px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:8100;width:min(300px,84vw);padding:26px 16px 12px;border-radius:14px 14px 10px 10px;background:linear-gradient(180deg,#3a0f14,#6b1a22 55%,#2a080c);border:3px solid #b8892f;box-shadow:0 0 0 2px #5a3d10,0 14px 40px rgba(0,0,0,.7),inset 0 0 40px rgba(0,0,0,.5);color:#f6e8c8;opacity:0;transform:translateY(16px);transition:opacity .8s,transform .8s;cursor:pointer}
.sx-seat.on{opacity:1;transform:none}.sx-seat::before,.sx-seat::after{content:"";position:absolute;top:0;bottom:0;width:22%;background:repeating-linear-gradient(90deg,#7a1b25 0 7px,#5a1019 7px 14px);box-shadow:inset -6px 0 12px rgba(0,0,0,.5)}
.sx-seat::before{left:0;border-radius:10px 40% 40% 0}.sx-seat::after{right:0;border-radius:40% 10px 0 40%;transform:scaleX(-1)}
.sx-seat .in{position:relative;z-index:1;display:flex;gap:10px;align-items:center;padding:0 16%}.sx-seat .in p{font-size:13px;line-height:1.35;margin:0}.sx-seat .sx-camp{width:54px;height:54px}
.sx-seat .bal{position:absolute;left:0;right:0;top:0;height:16px;background:linear-gradient(180deg,#d8a93a,#8a6118);border-radius:10px 10px 0 0;z-index:2}
.sx-flash{position:fixed;inset:0;z-index:9600;background:#fff;pointer-events:none;opacity:0}
html[data-anim=full] .sx-flash.go{animation:sxflash .9s ease-out}@keyframes sxflash{0%{opacity:.95}8%{opacity:.1}16%{opacity:.8}100%{opacity:0}}
html[data-anim=full] .sx-burst{animation:sxburst .7s cubic-bezier(.2,1.4,.4,1)}@keyframes sxburst{from{transform:scale(.2) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
.sx-h{cursor:pointer;outline:none}.sx-h:focus-visible{outline:3px solid #FFC857;outline-offset:6px}
html[data-anim=full] .sx-bob{animation:sxbob 3.4s ease-in-out infinite}@keyframes sxbob{50%{transform:translateY(-10px) rotate(4deg)}}
html[data-anim=full] .sx-ghost{animation:sxdrift 110s linear infinite}@keyframes sxdrift{from{transform:translateX(-260px)}to{transform:translateX(var(--gw))}}
.sx-ghost{filter:drop-shadow(0 0 10px rgba(160,240,255,.7))}
html[data-anim=full] .sx-fall{animation:sxfall var(--d,9s) linear var(--dl,0s) infinite}@keyframes sxfall{from{transform:translateY(0)}to{transform:translateY(var(--fh,800px))}}
html[data-anim=full] .sx-flick{animation:sxflick 2.2s ease-in-out infinite}@keyframes sxflick{50%{opacity:.55}}
html[data-anim=full] .sx-tap{animation:sxtap .5s ease-in-out infinite}@keyframes sxtap{50%{transform:rotate(-14deg)}}
html[data-anim=full] .sx-zz{animation:sxzz 3s ease-in-out infinite}@keyframes sxzz{from{opacity:0;transform:translateY(8px)}50%{opacity:1}to{opacity:0;transform:translateY(-14px)}}
.sx-parrot.jig{animation:sxjig .5s ease}@keyframes sxjig{25%{transform:translate(var(--px),var(--py)) rotate(-8deg)}60%{transform:translate(var(--px),var(--py)) rotate(7deg)}}
.sx-bub{position:fixed;z-index:9300;max-width:min(78vw,300px);padding:10px 12px;border-radius:14px 14px 14px 2px;background:#fff6dc;color:#2a1a08;font-weight:600;font-size:14px;line-height:1.35;box-shadow:0 8px 24px rgba(0,0,0,.45);pointer-events:none;opacity:0;transition:opacity .25s}
.sx-bub.on{opacity:1}
.sx-ghostbox .mb{filter:grayscale(.55) hue-rotate(150deg) brightness(.95);opacity:.88}
.sx-ghostbox{background:linear-gradient(180deg,#0f2a35,#07141b);border-color:rgba(160,240,255,.5)}
.sx-bdw{width:min(82vw,380px);margin:8px auto 30px;position:relative}
.sx-btn{min-height:44px;padding:8px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:inherit;font:inherit;cursor:pointer}
.sx-btn.pri{background:#FFC857;color:#241606;border-color:#FFC857;font-weight:700}
.sx-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px}
.sx-pad{width:min(70vw,240px);height:min(70vw,240px);border-radius:50%;border:4px solid #FFC857;background:radial-gradient(circle at 40% 35%,#3a2a12,#120c05);color:#FFC857;font-size:22px;font-weight:700;touch-action:manipulation;cursor:pointer;margin:6px auto;display:grid;place-items:center;user-select:none}
.sx-pad.hit{background:radial-gradient(circle,#ffd978,#b8892f);color:#241606}
.sx-beats{display:flex;gap:10px;justify-content:center;margin:8px 0}.sx-beats i{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.14)}.sx-beats i.on{background:#FFC857;box-shadow:0 0 12px #FFC857}
.sx-meter{height:10px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden}.sx-meter i{display:block;height:100%;background:#FFC857;width:0}
.sx-sax{width:min(60vw,220px);border-radius:16px;border:2px solid #FFC857;cursor:pointer;display:block;margin:8px auto;box-shadow:0 0 30px rgba(255,200,87,.35)}
.sx-note{position:absolute;color:#FFC857;font-size:26px;pointer-events:none;opacity:0}
html[data-anim=full] .sx-note.go{animation:sxnote 2.4s ease-out forwards}@keyframes sxnote{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-120px) rotate(18deg)}}
.sx-env{position:relative;width:220px;height:150px;margin:14px auto;background:linear-gradient(135deg,#e6d6a8,#c9b378);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.5);cursor:pointer}
.sx-env::before{content:"";position:absolute;left:0;right:0;top:0;height:90px;background:linear-gradient(135deg,#d9c78f,#b8a468);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;transition:transform .6s}
.sx-env.open::before{transform:rotateX(180deg)}
.sx-seal{position:absolute;left:50%;top:68px;width:44px;height:44px;margin-left:-22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e0453a,#7a1410);box-shadow:0 2px 6px rgba(0,0,0,.5);z-index:2;display:grid;place-items:center;color:#f7d9a0;font-weight:700;transition:opacity .4s,transform .4s}
.sx-env.open .sx-seat{display:none}.sx-env.open .sx-seal{opacity:0;transform:scale(1.6)}
.sx-letter{background:#f6ebc9;color:#2a1a08;border-radius:8px;padding:14px;text-align:left;font-family:Georgia,serif;line-height:1.5;box-shadow:0 6px 18px rgba(0,0,0,.4)}
.sx-chest{width:200px;margin:8px auto;cursor:pointer;display:block}.sx-chest .lid{transform-origin:20px 80px;transition:transform .7s cubic-bezier(.3,1.5,.5,1)}.sx-chest.open .lid{transform:rotate(-64deg)}
.sx-sil{display:block}
`;

/* ================= visit state ================= */
let V = {};
const hr = () => new Date().getHours();
export function season() {
  const o = qp('date'); let m, d;
  if (o && /^\d{1,2}-\d{1,2}$/.test(o)) { [m, d] = o.split('-').map(Number); } else { const n = new Date(); m = n.getMonth() + 1; d = n.getDate(); }
  return m === 11 && d === 9 ? 'riga' : m === 6 && d === 22 ? 'nola' : m === 11 && d === 19 ? 'havana' : null;
}
export function onVisit() {
  ST.visits = (ST.visits || 0) + 1;
  const tdy = today(), pending = ST.bottle.date === tdy && ST.bottle.pending;
  let bottle = pending;
  if (!bottle && ST.bottle.date !== tdy && ST.bottle.solved.length < RIDDLES.length && (Math.random() < 1 / 6 || dbgf('bottle'))) { ST.bottle.date = tdy; ST.bottle.pending = true; bottle = true; }
  V = { ghost: hr() === 0 || qp('time') === 'midnight' || dbgf('ghost'), season: season(), bottle, cameo: (Math.random() < 1 / 8 || dbgf('cameo')) ? pick(['nap', 'eat', 'drum']) : null,
    parrot: (ST.c.drills || 0) >= 100 || dbgf('parrot'), rainbow: ST.rainbow === tdy || dbgf('rainbow') };
  save();
  if (V.season && find('seasons', { silent: true })) setTimeout(() => cameo({ who: 'Skipper', k: 'The calendar remembers', line: 'The crew has dressed the deck for the day. Somebody remembered.', ms: 6500 }), 1500);
  S.maybeHint();
  return V;
}

/* ================= deck layer ================= */
const hs = (key, label, x, y, sc, inner, hit, extra = '') => `<g class="sx-h ${extra}" data-sx="${key}" tabindex="0" role="button" aria-label="${label}" transform="translate(${f1(x)} ${f1(y)}) scale(${f1(sc)})">${inner}<rect x="${hit[0]}" y="${hit[1]}" width="${hit[2]}" height="${hit[3]}" fill="transparent"/></g>`;
const ghostShip = `<g opacity=".5" fill="#d8f2f8"><path d="M-64 0H62L50 15H-50Z"/><path d="M-3 -96V0" stroke="#d8f2f8" stroke-width="3"/><path d="M-1 -92Q44 -58 42 -10L-1 -10Z" opacity=".85"/><path d="M-6 -82Q-42 -52 -40 -10L-6 -10Z" opacity=".7"/><path d="M-1 -92v-12l16 5-16 6" opacity=".9"/><path d="M-44 -10l4 7 5-7 5 7 5-7 5 7 5-7 5 7 5-7 5 7 5-7 5 7 5-7 4 7" fill="none" stroke="#d8f2f8" stroke-width="1.6" opacity=".6"/></g><ellipse cx="0" cy="22" rx="70" ry="5" fill="#bfeaf2" opacity=".18"/>`;
const bottleSVG = `<g><ellipse cy="20" rx="34" ry="6" fill="#000" opacity=".2"/><g transform="rotate(-24)"><path d="M-12 -2q-6 8-6 18q0 12 12 12h24q12 0 12-12q0-10-6-18l-6-5v-14h-14v14z" fill="rgba(170,225,240,.45)" stroke="#d6f1f8" stroke-width="2.2"/><rect x="-6" y="-28" width="14" height="9" rx="2" fill="#b7814a"/><path d="M-2 8h12v22h-12z" fill="#efe1b8" opacity=".9"/><path d="M0 12h8M0 17h8M0 22h6" stroke="#8a6a3a" stroke-width="1.2"/></g></g>`;
const parrotSVG = `<g><path d="M-2 -6l-14 30l5 -2l4 4l5 -26z" fill="#2e7bd0"/><path d="M-4 -8l-6 28l4 -2z" fill="#d6432f"/><ellipse cx="2" cy="-16" rx="10" ry="15" fill="#3fae4f"/><ellipse cx="5" cy="-12" rx="6" ry="10" fill="#ffd64a" opacity=".75"/><path d="M-8 -22q-8 6 -4 18q8 -2 10 -14z" fill="#d6432f"/><path d="M-6 -20q-6 5 -3 14q6 -2 7 -11z" fill="#2e7bd0"/><circle cx="6" cy="-36" r="8" fill="#3fae4f"/><circle cx="8" cy="-38" r="2.6" fill="#fff"/><circle cx="8.8" cy="-38" r="1.3" fill="#111"/><path d="M12 -39q8 1 6 8q-3 -1 -4 -3q-3 0 -5 -1z" fill="#ffa63a"/><path d="M0 0v4M5 0v4" stroke="#6a4a22" stroke-width="2"/></g>`;
const hatchSVG = `<g><ellipse cx="0" cy="24" rx="84" ry="14" fill="#000" opacity=".25"/><path d="M-70 -6l12 -34h116l12 34z" fill="#9a6a38"/><path d="M-70 -6h140v34h-140z" fill="#7a4f28"/><path d="M-70 -6h140M-70 8h140M-70 20h140" stroke="#4a2c14" stroke-width="2" opacity=".6"/><path d="M-46 -40v34M0 -40v34M46 -40v34" stroke="#4a2c14" stroke-width="2" opacity=".5"/><circle cx="0" cy="12" r="9" fill="none" stroke="#d9a640" stroke-width="3.4"/><circle cx="0" cy="3" r="3" fill="#d9a640"/></g>`;
function cameoSVG(prop, s) {
  const r = 40, face = photoSVG('Tempo', 0, 0, r, 'char');
  const icon = prop === 'nap' ? `<g class="sx-zz" fill="#cfe3ff" font-family="Osw,sans-serif" font-weight="700"><text x="34" y="-34" font-size="22">z</text><text x="46" y="-52" font-size="28">Z</text></g>`
    : prop === 'eat' ? `<g transform="translate(34 30)"><circle r="12" fill="#d6432f"/><path d="M0 -12q2 -9 9 -10" stroke="#3a7a2a" stroke-width="3" fill="none"/><circle cx="-4" cy="-3" r="3" fill="#fff" opacity=".4"/><path d="M-12 -2q-6 4 -2 8" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/></g>`
      : `<g transform="translate(0 44)"><g class="sx-tap" style="transform-origin:-20px 0"><path d="M-44 -8L-8 6" stroke="#e9d9b0" stroke-width="5" stroke-linecap="round"/></g><path d="M44 -8L8 6" stroke="#e9d9b0" stroke-width="5" stroke-linecap="round"/><ellipse cx="0" cy="8" rx="30" ry="7" fill="#3a2a12" stroke="#FFC857" stroke-width="2"/></g>`;
  return `<g>${face}${icon}</g>`;
}
function snow(W, H, hz) {
  let g = ''; for (let i = 0; i < 34; i++) { const x = (i * 97) % W, y = (i * 61) % (H * .5), r = 2 + (i % 4); g += `<circle class="sx-fall" cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85" style="--d:${7 + (i % 6)}s;--dl:-${(i % 9)}s;--fh:${H * .6}px"/>`; }
  return g;
}
function strung(W, y0, sag, n, mk) {
  let g = `<path d="M-20 ${y0}Q${W / 2} ${y0 + sag * 2} ${W + 20} ${y0}" stroke="#2a2420" stroke-width="3" fill="none"/>`;
  for (let i = 1; i <= n; i++) { const t = i / (n + 1), x = (1 - t) * (1 - t) * -20 + 2 * t * (1 - t) * (W / 2) + t * t * (W + 20), y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * (y0 + sag * 2) + t * t * y0; g += mk(x, y, i); }
  return g;
}
export function deckParts(kind, L, u) {
  const tall = kind === 'tall', { W, H, hz } = L, R = L.rail, s = tall ? 2.1 : 1, sx = a => f1(a);
  const o = { back: '', sea: '', ship: '', over: '' };
  if (V.rainbow) { const cx = W * (tall ? .5 : .42), cy = hz + 30, rr = tall ? 360 : 520; o.back += `<g pointer-events="none" opacity=".5">${['#e0443a', '#f2913b', '#f6d84a', '#5ab85a', '#4aa0e0', '#7a5cd0'].map((c, i) => `<path d="M${cx - rr + i * 13} ${cy}A${rr - i * 13} ${rr - i * 13} 0 0 1 ${cx + rr - i * 13} ${cy}" fill="none" stroke="${c}" stroke-width="14"/>`).join('')}</g>`; }
  if (V.ghost) { const gy = hz + 6 * s; o.sea += `<g class="sx-ghost" style="--gw:${W + 500}px;${getAnim() === 'full' ? '' : `transform:translateX(${sx(W * .42)}px)`}"><g class="sx-h" data-sx="ghost" tabindex="0" role="button" aria-label="A ghost ship on the horizon" transform="translate(0 ${sx(gy)}) scale(${sx(s * 1.1)})">${ghostShip}<rect x="-110" y="-120" width="220" height="150" fill="transparent"/></g></g>`; }
  if (V.bottle) { const bx = tall ? W / 2 : W * .6, by = hz + (tall ? 15 : 62); o.sea += hs('bottle', 'A bottle floating on the water', bx, by, tall ? 1.5 : 1.35, `<g class="sx-bob">${bottleSVG}</g>`, [-60, -50, 120, 100]); }
  const pr = tall ? [W - 80, R - 14, 2.8] : [840, R - 14, 1.8];
  if (V.parrot) o.ship += hs('parrot', 'A parrot on the rail', pr[0], pr[1], pr[2], `<g class="sx-parrotg">${parrotSVG}</g>`, [-26, -52, 54, 60]);
  if (V.cameo) { const cx = tall ? W * .433 : 700, sc = .9; o.ship += hs('cameo', 'Tempo, relaxing on the rail', cx, R - 44 * sc - 8, sc, cameoSVG(V.cameo), [-48, -48, 96, 96]); }
  const hx = tall ? [235, 1420, 1] : [150, 812, 1]; o.ship += hs('hatch', 'A hatch cover in the deck', hx[0], hx[1], hx[2], hatchSVG, [-76, -44, 152, 76]);
  const bn = S.boatName();
  if (bn) { const fs = tall ? 30 : 26, cx = tall ? W / 2 : 800, len = Math.min(bn.length * fs * .66, tall ? 220 : 300); o.ship += `<text x="${cx}" y="${R + (tall ? 34 : 30)}" text-anchor="middle" font-family="Osw,Arial Narrow,sans-serif" font-weight="700" font-size="${fs}" letter-spacing="3" fill="#f0d27a" stroke="#4a3208" stroke-width=".8" textLength="${f1(len)}" lengthAdjust="spacingAndGlyphs" pointer-events="none">${esc(bn.toUpperCase())}</text>`; }
  if (ST.smooth) o.over += `<g pointer-events="none"><rect x="${W / 2 - 150}" y="${hz + 30}" width="300" height="${tall ? 52 : 40}" rx="${tall ? 26 : 20}" fill="#07111A" fill-opacity=".72" stroke="#FFC857" stroke-opacity=".7"/><text x="${W / 2}" y="${hz + 30 + (tall ? 34 : 27)}" text-anchor="middle" font-size="${tall ? 26 : 20}" fill="#FFC857" font-family="Osw,sans-serif" letter-spacing="2">SMOOTH SAILING · NEXT DRILL +1s</text></g>`;
  if (V.season === 'riga') o.over += `<g pointer-events="none">${snow(W, H, hz)}<path d="M-40 ${R - 14}H${W + 40}" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".9"/></g>`;
  if (V.season === 'nola') o.over += `<g pointer-events="none">${strung(W, hz * .55, 40, tall ? 6 : 10, (x, y, i) => { const c = ['#e8453c', '#f2a93b', '#7cc6a4', '#a78bfa', '#4fb0e8'][i % 5]; return `<g transform="translate(${f1(x)} ${f1(y)})"><circle class="sx-flick" r="${tall ? 52 : 36}" fill="${c}" opacity=".28" style="animation-delay:-${i * .4}s"/><path d="M0 0v10" stroke="#2a2420" stroke-width="2"/><rect x="-10" y="10" width="20" height="26" rx="6" fill="${c}"/><rect x="-10" y="10" width="20" height="26" rx="6" fill="#fff" opacity=".25"/></g>`; })}</g>`;
  if (V.season === 'havana') o.over += `<g pointer-events="none">${strung(W, hz * .5, 36, tall ? 9 : 16, (x, y, i) => `<path d="M${f1(x - 14)} ${f1(y)}L${f1(x + 14)} ${f1(y)}L${f1(x)} ${f1(y + 40)}Z" fill="${['#cf1f2f', '#ffffff', '#1c4aa3'][i % 3]}" stroke="#2a2420" stroke-width="1"/>`)}</g>`;
  return o;
}
const ACT = {
  bottle: () => openBottle(), ghost: () => openGhost(), hatch: () => openDrums(), parrot: h => squawk(h),
  cameo: h => { if (find('cameo', { silent: true })) buzz && buzz(10); cameo({ who: 'Tempo', k: 'Tempo, off duty', line: { nap: 'Five more minutes. And do not tell Skipper.', eat: 'Snack break. Even final bosses eat.', drum: 'Working on the fills. Do not you dare time me.' }[V.cameo] || 'Hm?', ms: 5000 }); }
};
export function wireDeck(svg) {
  svg.querySelectorAll('.sx-h').forEach(h => {
    const go = e => { e.stopPropagation(); const k = h.dataset.sx; (ACT[k] || (() => { }))(h); };
    h.addEventListener('click', go); h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
  });
}
const redraw = () => document.dispatchEvent(new CustomEvent('mast:deckredraw'));

/* ================= barrel: three quick taps ================= */
let bt = [], btT = 0;
export function barrelTap(go) {
  const n = performance.now(); bt = bt.filter(t => n - t < 1300); bt.push(n); clearTimeout(btT);
  if (bt.length >= 3) { bt = []; saxReveal(); return; }
  btT = setTimeout(() => { bt = []; go(); }, 380);
}

/* ================= sax ================= */
export function saxReveal() {
  const m = ov('sx-saxov', `<div class="sx-box"><button class="sx-x" data-x aria-label="Close">&times;</button><span class="k">Under the deck</span><h2>Something golden</h2><p class="sub">Skipper's old friend was wedged behind the barrel. Tap it.</p>
   <div style="position:relative"><img class="sx-sax" id="sx-sx" src="assets/portraits/skipper_sax.jpg" alt="Skipper's gold saxophone. Tap to play." tabindex="0" role="button"></div><p id="sx-st" class="sub sm" aria-live="polite"></p></div>`);
  const img = m.el.querySelector('#sx-sx'), st = m.el.querySelector('#sx-st'), box = m.el.querySelector('.sx-box');
  const go = () => {
    sfx('saxriff'); buzz && buzz([10, 30, 10]);
    if (full()) for (let i = 0; i < 5; i++) { const n = document.createElement('span'); n.className = 'sx-note go'; n.textContent = ['♪', '♫', '♪', '♫', '♪'][i]; n.style.left = (20 + i * 15) + '%'; n.style.bottom = '30%'; n.style.animationDelay = (i * .25) + 's'; img.parentNode.appendChild(n); setTimeout(() => n.remove(), 3200); }
    S.setSmooth(); const first = find('sax', { silent: true });
    st.textContent = 'The sea settles. Smooth Sailing: your next drill session gets one extra second on every position.'; if (first) setTimeout(() => cameo({ who: 'Skipper', k: 'Secret found', line: 'Sax Under Deck. Smooth Sailing is yours.', ms: 5000 }), 600);
    redraw();
  };
  img.addEventListener('click', go); img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
}

/* ================= game scenes ================= */
const dimOn = () => { const d = document.createElement('div'); d.className = 'sx-dim'; document.body.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on'))); return () => { d.classList.remove('on'); setTimeout(() => d.remove(), 1400); }; };
export function operaScene() {
  if (!find('opera', { silent: true })) return; S.css(); sfx('aria');
  const off = dimOn(), el = document.createElement('div'); el.className = 'sx-seat'; el.setAttribute('role', 'status');
  el.innerHTML = `<span class="bal"></span><div class="in"><span class="sx-camp">${photo('Morphy', 'excited')}</span><p><b>Box seat, Paris, 1858.</b> Bravo, sir. You are playing from my score. The finale is rather good. Play on.</p></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  const end = () => { off(); el.classList.remove('on'); setTimeout(() => el.remove(), 900); }; el.addEventListener('click', end); setTimeout(end, 9000);
  setTimeout(() => import('./prog-ui.js').then(u => u.toast({ k: 'Secret found', title: 'A Night at the Opera', line: '150 XP and a box seat', who: 'Morphy' })), 1500);
}
export function bongScene() { if (!find('bongcloud', { silent: true })) return; sfx('brilliant'); cameo({ who: 'Carlsen', k: 'He breaks character', line: 'Okay. Respect.', ms: 7000 }); setTimeout(() => import('./prog-ui.js').then(u => u.toast({ k: 'Secret found', title: 'Okay. Respect.', line: '60 XP', who: 'Carlsen' })), 2200); }
export function englundScene() { if (!find('englund', { silent: true })) return; sfx('move'); cameo({ who: 'Morphy', k: 'A raised eyebrow', line: 'Sir... again?', ms: 7000 }); setTimeout(() => import('./prog-ui.js').then(u => u.toast({ k: 'Secret found', title: 'Sir... Again?', line: '60 XP', who: 'Morphy' })), 2200); }
export async function immortalScene(d, sac) {
  const white = d.color === 'white', first = !ST.found.immortal, yr = new Date().getFullYear();
  const card = { id: 'imm:' + (d.id || Date.now()), m: 'Tal', fen: sac.fen, move: sac.uci, year: String(yr), white: white ? 'Skipper' : d.opp, black: white ? d.opp : 'Skipper', event: 'The Immortal', rar: 4, themes: ['sacrifice'], phase: 'middlegame' };
  find('immortal', { silent: true }); Pr.mintCard(card, 'immortal');
  if (!first) { cameo({ who: 'Tal', k: 'Another immortal', line: 'The queen goes again, and again it wins. Card added to your collection.', ms: 6500 }); return; }
  const u = await import('./prog-ui.js'); S.css(); sfx('thunder');
  const fl = document.createElement('div'); fl.className = 'sx-flash go'; document.body.appendChild(fl); setTimeout(() => fl.remove(), 1200);
  if (full()) { confetti(2); wash(); }
  setTimeout(() => ov('sx-imm', `<div class="sx-box"><button class="sx-x" data-x aria-label="Close">&times;</button><div class="sx-burst"><div class="sx-ph" style="width:96px;height:96px">${photo('Tal', 'excited')}</div></div><span class="k">Tal bursts in</span><h2>The Immortal</h2>
    <p>You gave up the queen and still won the game. Into the dark forest, my friend, and out the other side. This one is yours, from your own game.</p><div style="max-width:200px;margin:8px auto">${u.cardHTML(card, { flip: true })}</div><div class="sx-row"><button class="sx-btn pri" data-x>Magnificent</button><a class="sx-btn" href="#collection/Tal" data-x>See collection</a></div></div>`), 1300);
}
export function sealedLetter(msg) {
  S.css(); const m = ov('sx-letterov', `<div class="sx-box"><button class="sx-x" data-x aria-label="Close">&times;</button><span class="k">A sealed letter</span><h2>From Tempo</h2><p class="sub">He left it for the one who finally beat him. Tap the seal.</p>
   <div class="sx-env" id="sx-env" tabindex="0" role="button" aria-label="Break the seal"><span class="sx-seal">T</span></div><div id="sx-lt"></div></div>`);
  const env = m.el.querySelector('#sx-env'), go = () => { if (env.classList.contains('open')) return; env.classList.add('open'); sfx('success'); const lt = m.el.querySelector('#sx-lt'); lt.innerHTML = `<div class="sx-letter">${esc(msg).replace(/\n/g, '<br>')}<div style="text-align:right;margin-top:8px"><i>Tempo</i></div></div>`; env.style.display = 'none'; };
  env.addEventListener('click', go); env.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
}
export function treasureChest(blitz, reward) {
  S.css(); const m = ov('sx-chestov', `<div class="sx-box"><button class="sx-x" data-x aria-label="Close">&times;</button><span class="k">Blitz ${esc(blitz)} reached</span><h2>A treasure chest</h2>
   <svg class="sx-chest" id="sx-ch" viewBox="0 0 120 100" role="button" tabindex="0" aria-label="Open the chest"><rect x="14" y="44" width="92" height="46" rx="6" fill="#7a4f28" stroke="#3a210d" stroke-width="3"/><path d="M14 62h92" stroke="#d9a640" stroke-width="4"/><g class="lid"><path d="M14 44q0 -30 46 -30t46 30z" fill="#9a6a38" stroke="#3a210d" stroke-width="3"/><path d="M60 14v30" stroke="#d9a640" stroke-width="4"/></g><rect x="52" y="54" width="16" height="16" rx="3" fill="#d9a640" stroke="#3a210d" stroke-width="2"/></svg>
   <div id="sx-rw"><p class="sub">Tap the chest.</p></div></div>`);
  const ch = m.el.querySelector('#sx-ch'), go = () => { if (ch.classList.contains('open')) return; ch.classList.add('open'); sfx('fanfare'); if (full()) confetti(2); m.el.querySelector('#sx-rw').innerHTML = `<div class="sx-letter" style="text-align:center">${esc(reward).replace(/\n/g, '<br>')}</div>`; };
  ch.addEventListener('click', go); ch.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
}
export function konamiScene() { sfx('fanfare'); cameo({ who: 'Tempo', k: 'Old code', line: 'The crew has traded voices and outfits. It lasts until this time tomorrow.', ms: 7000 }); redraw(); }
export function rainbowScene() { sfx('fanfare'); if (full()) { confetti(2); wash(); } cameo({ who: 'Skipper', k: 'After the storm', line: 'Five in a row through heavy weather. Look at that sky.', ms: 7000 }); redraw(); }
export function parrotArrived() { if (ST.parrotSeen) return; ST.parrotSeen = 1; save(); setTimeout(() => cameo({ who: 'Skipper', k: 'Visitor', line: 'Something has landed on the rail. Take a look when you are back on deck.', ms: 6500 }), 1200); }

/* ================= parrot ================= */
let CV = null;
async function blunders() { if (CV) return CV; try { const d = await (await fetch('data/convert.json')).json(); CV = d.filter(x => x.played_san && x.best_san && x.loss > 150).sort((a, b) => b.loss - a.loss).slice(0, 60); } catch (_) { CV = []; } return CV; }
async function squawk(h) {
  S.css(); sfx('squawk'); buzz && buzz([15, 20, 15]); h.classList.remove('jig'); void h.getBoundingClientRect(); const L = await blunders(); const b = L.length ? pick(L) : null;
  find('parrot', { silent: true });
  const txt = b ? `SQUAWK! ${b.played_san} in the ${b.phase}! ${b.loss >= 900 ? 'That threw the game away.' : 'That cost ' + (b.loss / 100).toFixed(1) + ' pawns.'} ${b.best_san} was the move!` : 'SQUAWK! Mind the weather!';
  const r = h.getBoundingClientRect(), el = document.createElement('div'); el.className = 'sx-bub'; el.textContent = txt; el.setAttribute('role', 'status'); document.body.appendChild(el);
  const w = el.offsetWidth, hh = el.offsetHeight; el.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px'; el.style.top = Math.max(8, r.top - hh - 8) + 'px';
  requestAnimationFrame(() => el.classList.add('on')); setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 300); }, 4800);
}

/* ================= April Fools ================= */
export function aprilFools(d) {
  if (!S.aprilFlag() || !d || !d.board) return; const b = d.board; if (!b.pcsEl) return;
  const pcs = [...b.pcsEl.querySelectorAll('.pc')].filter(e => e.dataset.k && e.dataset.k[1] !== 'k');
  const byC = { w: [], b: [] }; pcs.forEach(e => (byC[e.dataset.k[0]] = byC[e.dataset.k[0]] || []).push(e));
  const side = byC.w.length > 1 ? byC.w : byC.b; if (side.length < 2) return;
  const a = side[0], c = side.find(e => e.dataset.k !== a.dataset.k) || side[1]; if (a === c) return;
  ST.afool = today(); ST.forceApril = false; save();
  const ta = a.style.transform, tc = c.style.transform; a.style.transform = tc; c.style.transform = ta;
  let back = false; const root = b.root, undo = () => { if (back) return; back = true; a.style.transform = ta; c.style.transform = tc; root.removeEventListener('pointerdown', undo, true); document.removeEventListener('keydown', undo, true);
    find('aprilfools', { silent: true }); sfx('success'); cameo({ who: 'Tal', k: 'April Fools', line: 'Ha! I swapped two of your pieces for a moment. They are back where they belong. The position was never harmed.', ms: 7000 }); };
  root.addEventListener('pointerdown', undo, true); document.addEventListener('keydown', undo, true); setTimeout(undo, 14000);
}

/* ================= hidden backstories ================= */
export function wireBackstory(root, name) {
  if (!STORIES[name]) return; const el = root.querySelector('.mph'); if (!el) return; let n = 0, t = 0;
  el.addEventListener('click', () => { const now = performance.now(); if (now - t > 2500) n = 0; t = now; n++; if (n >= 7) { n = 0; showStory(name); } });
}
export function showStory(name) {
  const s = STORIES[name]; if (!s) return; S.css(); const first = !ST.stories[name]; ST.stories[name] = Date.now(); save();
  const ff = find('backstory', { silent: true }); if (first && !ff) try { Pr.addXp(40, 'secret'); } catch (_) { }
  sfx('move'); ov('sx-story', `<div class="sx-box" style="text-align:left"><button class="sx-x" data-x aria-label="Close">&times;</button><div style="display:flex;gap:12px;align-items:center"><span class="sx-ph">${photo(name, 'pleased')}</span><div><span class="k">${esc((CH[name] || {}).nick || name)}</span><h2 style="margin:0">${esc(s.title)}</h2></div></div>
   <p style="line-height:1.6;margin-top:12px">${esc(s.text)}</p><p class="sub sm">Written for the app. ${Object.keys(ST.stories).length} of 5 backstories heard.</p></div>`);
  if (ff || first) setTimeout(() => import('./prog-ui.js').then(u => u.toast({ k: 'Secret found', title: 'Hidden Backstories', line: first ? '40 XP' : '', who: name })), 1200);
}

/* ================= message in a bottle ================= */
function openBottle() {
  const r = RIDDLES.find(x => !ST.bottle.solved.includes(x.id)); if (!r) return; S.css(); sfx('move');
  const m = ov('sx-bottle', `<div class="sx-box"><button class="sx-x" data-x aria-label="Close">&times;</button><span class="k">A message in a bottle</span><h2>Riddle ${ST.bottle.solved.length + 1} of ${RIDDLES.length}</h2>
   <p style="font-family:Georgia,serif;font-size:17px;line-height:1.5">${esc(r.q)}</p><div class="sx-bdw"><div id="sx-bd"></div></div><p id="sx-bs" class="sub" role="status" aria-live="polite">White to move. Find the move.</p><div class="sx-row"><button class="sx-btn" data-x>Put the bottle back</button></div></div>`, { onClose: () => { try { b.destroy(); } catch (_) { } } });
  const g = new Chess(r.fen), st = m.el.querySelector('#sx-bs'); let solved = false;
  const legal = () => { const mm = {}; g.moves({ verbose: true }).forEach(x => (mm[x.from] ??= []).push(x.to)); return mm; };
  const norm = s => s.replace(/[+#]/g, '');
  const b = new Board(m.el.querySelector('#sx-bd'), { orientation: g.turn() === 'w' ? 'white' : 'black', coords: true, onMove: (from, to, promo) => {
    if (solved) return false; const mv = g.move({ from, to, promotion: promo || 'q' }); if (!mv) return false;
    const ok = r.ans.some(a => norm(a) === norm(mv.san)) || (r.ans[0].endsWith('#') && g.in_checkmate());
    if (!ok) { g.undo(); st.textContent = 'Not quite. The bottle rattles. Look again.'; sfx('fail'); return false; }
    solved = true; sfx('success'); st.textContent = `Yes: ${mv.san}. ${r.n}. A rare card washes up with the tide.`;
    setTimeout(() => { b.setPosition(g.fen(), { animate: false }); b.setLegal({}); }, 0);
    ST.bottle.solved.push(r.id); ST.bottle.pending = false; save(); find('bottle', { silent: true });
    const card = { id: 'btl:' + r.id, m: 'Skipper', fen: r.fen, move: r.uci, year: String(new Date().getFullYear()), white: 'Message in a bottle', black: 'No. ' + r.id.slice(1), event: r.n, rar: r.id === 'r12' ? 3 : 2, themes: [], phase: 'middlegame' };
    Pr.mintCard(card, 'bottle'); try { Pr.addXp(25, 'secret'); } catch (_) { } redraw(); if (full()) confetti(1); return true;
  } });
  b.setPosition(g.fen(), { animate: false }); b.setLegal(legal()); b.setTurn(g.turn() === 'w' ? 'white' : 'black', true);
}

/* ================= ghost ship ================= */
async function openGhost() {
  S.css(); let pgn = ''; try { pgn = await (await fetch('data/ghost.pgn')).text(); } catch (_) { }
  const g0 = new Chess(); if (!pgn || !g0.load_pgn(pgn)) { cameo({ who: 'Tal', k: 'The ghost', line: 'The ship sailed on before I could read the log.', ms: 4000 }); return; }
  const hist = g0.history({ verbose: true }), H = g0.header ? g0.header() : {}, t = new Chess(), fens = [t.fen()]; hist.forEach(m => { t.move(m); fens.push(t.fen()); });
  find('ghost', { silent: false }); sfx('thunder');
  let i = 0, timer = 0, playing = full(); const m = ov('sx-ghostov', `<div class="sx-box sx-ghostbox"><button class="sx-x" data-x aria-label="Close">&times;</button><span class="k">The ghost ship plays</span><h2>${esc((H.White || 'Tal').split(',')[0])} v ${esc((H.Black || '').split(',')[0])}</h2><p class="sub sm">${esc(H.Site || '')}, ${esc((H.Date || '').slice(0, 4))}. A real game, replayed from the deep.</p>
   <div class="sx-bdw"><div id="sx-gb"></div></div><p id="sx-gt" class="sub" aria-live="polite"></p><div class="sx-row"><button class="sx-btn" id="sx-p0" aria-label="Previous move">&lsaquo;</button><button class="sx-btn pri" id="sx-pp"></button><button class="sx-btn" id="sx-p1" aria-label="Next move">&rsaquo;</button></div></div>`, { onClose: () => { clearInterval(timer); try { b.destroy(); } catch (_) { } } });
  const b = new Board(m.el.querySelector('#sx-gb'), { orientation: 'white', coords: true, movable: 'none', onMove: () => false }), $ = s => m.el.querySelector(s);
  const show = (anim = true) => { b.setPosition(fens[i], { animate: anim && full(), lastMove: i ? { from: hist[i - 1].from, to: hist[i - 1].to } : null }); $('#sx-gt').textContent = i ? `${Math.ceil(i / 2)}${i % 2 ? '.' : '...'} ${hist[i - 1].san}` : 'Start position'; if (i === hist.length) { clearInterval(timer); playing = false; setP(); } };
  const setP = () => { $('#sx-pp').textContent = playing ? 'Pause' : 'Play'; };
  const tick = () => { if (i < hist.length) { i++; show(); } };
  const start = () => { clearInterval(timer); if (playing) timer = setInterval(tick, 1900); setP(); };
  $('#sx-pp').onclick = () => { playing = !playing; if (playing && i >= hist.length) i = 0; start(); }; $('#sx-p0').onclick = () => { playing = false; start(); if (i > 0) { i--; show(); } }; $('#sx-p1').onclick = () => { playing = false; start(); tick(); };
  b.setLegal({}); show(false); start();
}

/* ================= Tempo's drum kit ================= */
function openDrums() {
  S.css(); const BPM = 96, beat = 60000 / BPM, DUR = 30000, COUNT = 4; let raf = 0, sched = 0, running = false, t0 = 0, taps = [], hits = 0;
  const best = ST.drumBest || 0;
  const m = ov('sx-drumov', `<div class="sx-box"><button class="sx-x" data-x aria-label="Close">&times;</button><div class="sx-ph" style="width:76px;height:76px">${photo('Tempo', 'pleased')}</div><span class="k">The hold</span><h2>Tempo's drum kit</h2>
   <p class="sub" id="sx-dm">"Keep a steady tempo. Tap on every beat. Thirty seconds. I will know." ${best ? `Best steadiness: ${best}%.` : ''}</p>
   <div class="sx-beats" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="sx-meter" aria-hidden="true"><i id="sx-mt"></i></div>
   <button class="sx-pad" id="sx-pad" type="button" aria-label="Tap on the beat (or press Space)">START</button><div id="sx-dr"></div></div>`, { onClose: () => { running = false; cancelAnimationFrame(raf); clearInterval(sched); document.removeEventListener('keydown', kd, true); } });
  const pad = m.el.querySelector('#sx-pad'), dots = [...m.el.querySelectorAll('.sx-beats i')], mt = m.el.querySelector('#sx-mt'), msg = m.el.querySelector('#sx-dm'); let nextB = 0, bi = 0;
  const kit = i => { const b4 = ((i % 4) + 4) % 4; return [['kick', 'hat'], ['snare', 'hat'], ['kick', 'hat'], ['snare', 'hat']][b4]; };
  const schedule = () => { // lookahead: schedule beats up to 160ms ahead on the page clock
    const now = performance.now(); while (nextB < now + 160) { const dt = (nextB - now) / 1000, [a, c] = kit(bi); playAt(a, dt); playAt(c, dt); playAt('hat', dt + beat / 2000); nextB += beat; bi++; }
  };
  const frame = () => { if (!running) return; const e = performance.now() - t0, bn = Math.floor(e / beat); dots.forEach((d, k) => d.classList.toggle('on', ((bn % 4) + 4) % 4 === k && e >= 0)); mt.style.width = Math.max(0, Math.min(100, (e - COUNT * beat) / DUR * 100)) + '%';
    if (e < COUNT * beat) msg.textContent = 'Count in: ' + (COUNT - bn); else if (e < COUNT * beat + DUR) msg.textContent = 'Keep it steady.';
    if (e >= COUNT * beat + DUR) return finish(); raf = requestAnimationFrame(frame); };
  const tap = ts => { if (!running) return; const e = ts - t0 - COUNT * beat; pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 80); sfx('rim'); if (e < -beat / 2 || e > DUR) return; const near = Math.round(e / beat) * beat, dev = e - near; taps.push(dev); };
  const kd = e => { if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (!running) start(); else tap(performance.now()); } };
  document.addEventListener('keydown', kd, true);
  const start = () => { if (running) return; running = true; taps = []; hits = 0; bi = 0; t0 = performance.now() + 250; nextB = t0; pad.textContent = 'TAP'; m.el.querySelector('#sx-dr').innerHTML = ''; schedule(); sched = setInterval(schedule, 40); raf = requestAnimationFrame(frame); };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); if (!running) start(); else tap(e.timeStamp || performance.now()); });
  function finish() {
    running = false; cancelAnimationFrame(raf); clearInterval(sched); pad.textContent = 'AGAIN';
    const n = taps.length, mean = n ? taps.reduce((a, d) => a + Math.abs(d), 0) / n : 999, steady = n < 8 ? 0 : Math.max(0, Math.round(100 - mean / 1.2)), total = Math.round(DUR / beat);
    const line = steady >= 85 ? 'Metronome. I would hire you.' : steady >= 60 ? 'Decent. The pulse is there. You rush the fills when you get excited.' : n < 8 ? 'You barely played. It is fine. Nobody sees the drummer.' : 'You are playing to the clock instead of the beat. Breathe. Again?';
    if (steady > (ST.drumBest || 0)) { ST.drumBest = steady; save(); }
    if (n >= 12) { const first = find('drums', { silent: true }); try { if (!first) Pr.addXp(Math.round(steady / 4), 'secret'); } catch (_) { } if (first) setTimeout(() => import('./prog-ui.js').then(u => u.toast({ k: 'Secret found', title: "The Drum Kit in the Hold", line: '100 XP and a steady hand', who: 'Tempo' })), 700); }
    m.el.querySelector('#sx-dr').innerHTML = `<p class="led" style="font-size:2em;margin:6px 0">${steady}%</p><p>Steadiness. Average miss ${Math.round(mean === 999 ? 0 : mean)} ms, ${n} taps for ${total} beats.</p><p>"${esc(line)}" <i>Tempo</i></p>`;
    msg.textContent = 'Tap AGAIN to go again.';
  }
}

/* ================= debug ================= */
export function debugSecret(id, a) {
  S.css();
  switch (id) {
    case 'sax': return saxReveal();
    case 'bottle': ST.bottle = { date: today(), pending: true, solved: ST.bottle.solved }; save(); V.bottle = true; redraw(); return openBottle();
    case 'ghost': V.ghost = true; redraw(); return openGhost();
    case 'drums': return openDrums();
    case 'parrot': V.parrot = true; redraw(); setTimeout(() => { const h = document.querySelector('[data-sx=parrot]'); if (h) squawk(h); }, 300); return;
    case 'cameo': V.cameo = a || 'drum'; redraw(); return;
    case 'seasons': V.season = a || 'riga'; redraw(); find('seasons', { silent: true }); return;
    case 'rainbow': ST.rainbow = today(); save(); V.rainbow = true; find('rainbow', { silent: true }); return rainbowScene();
    case 'konami': return S.startSwap();
    case 'backstory': return showStory(a || 'Morphy');
    case 'opera': ST.found.opera && delete ST.found.opera; return operaScene();
    case 'immortal': { const t = new Chess(); ['e4', 'e5', 'Qh5', 'Nc6'].forEach(s => t.move(s)); return immortalScene({ id: 'dbg' + Date.now(), color: 'white', opp: 'Tal' }, { fen: t.fen(), uci: 'h5f7' }); }
    case 'bongcloud': return bongScene();
    case 'englund': return englundScene();
    case 'horse': document.dispatchEvent(new CustomEvent('mast:promo', { detail: { piece: 'n' } })); return;
    case 'numbers': return S.numberNod(a || 'game');
    case 'aprilfools': ST.forceApril = true; ST.afool = ''; save(); return;
    case 'sealed': return sealedLetter(a || 'Test letter. Well played. -T');
    case 'chest': return treasureChest(a || 1100, 'A test reward.');
    default: console.warn('unknown secret', id);
  }
}
