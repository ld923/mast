// Phase 7: captain's log (end-of-session page + logbook), page flip, voyage unroll, compass needle, weekly postcard.
import { full } from './fx.js';
import { avatar, hydrate, store } from './ui.js';
import * as Pr from './progress.js';
import { ISLANDS, progress } from './voyage.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CSS = `
.clog{--ink:#3b2a1a;--ink2:#6b5238;position:relative;max-width:640px;margin:var(--s3) auto 0;padding:34px 34px 30px;color:var(--ink);border-radius:6px;font:400 15px/1.5 Georgia,'Times New Roman',serif;
 background:radial-gradient(ellipse at 30% 0,#f6e9c8,#e8d4a2 70%,#d9bf86);box-shadow:0 1px 0 #fff6 inset,0 18px 40px rgba(0,0,0,.45),0 0 0 1px #8a6a3a55;transform-origin:50% 0;backface-visibility:hidden}
.clog:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 27px,rgba(120,80,30,.12) 27px 28px),radial-gradient(ellipse at 50% 50%,transparent 60%,rgba(90,50,10,.25));mix-blend-mode:multiply}
.clog h2,.clog h3,.clog .cl-k{font-family:var(--f-log);color:var(--ink);letter-spacing:.06em;margin:0}
.clog h2{font-size:30px;font-weight:700}.clog .cl-d{font:italic 14px Georgia,serif;color:var(--ink2);margin:2px 0 14px}
.clog .cl-k{font-size:12.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink2);margin-bottom:3px}
.clog .cl-g{display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;margin:12px 0}
.clog .cl-g>div{position:relative;z-index:1}.clog .cl-big{font:700 30px var(--f-log);line-height:1.1}
.clog .cl-w{display:flex;gap:14px;align-items:center;position:relative;z-index:1;margin:10px 0}
.clog .cl-w svg{flex:none;width:132px;height:132px;border-radius:3px;box-shadow:0 0 0 2px #5a3d1c,0 4px 10px rgba(0,0,0,.35)}
.clog .cl-sign{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:12px;position:relative;z-index:1}
.clog .cl-sig{display:flex;align-items:center;gap:10px;font:italic 700 20px Georgia,serif;color:var(--ink)}.clog .cl-sig .av{width:44px;height:44px;flex:none}
.clog .cl-bar{height:8px;border-radius:4px;background:#5a3d1c33;position:relative;margin-top:4px}.clog .cl-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:#7a4a1a}.clog .cl-bar b{position:absolute;top:-3px;width:3px;height:14px;background:#a3241b;border-radius:2px}
.seal{flex:none;width:96px;height:96px;filter:drop-shadow(0 3px 4px rgba(60,10,5,.45));transform:rotate(-9deg)}
html[data-anim=full] .seal{animation:stamp .55s .35s cubic-bezier(.3,1.6,.5,1) both}
@keyframes stamp{from{opacity:0;transform:rotate(-30deg) scale(2.2)}to{opacity:1;transform:rotate(-9deg) scale(1)}}
.clog .row{position:relative;z-index:1}.clog .btn{font-family:Oswald,Inter,sans-serif}
.book{perspective:1800px}.book .clog{margin-top:var(--s2)}
html[data-anim=full] .clog.flip-out{animation:pgout .38s ease-in both;transform-origin:0 50%}
html[data-anim=full] .clog.flip-in{animation:pgin .42s ease-out both;transform-origin:0 50%}
@keyframes pgout{to{transform:rotateY(-95deg);opacity:.2;filter:brightness(.7)}}
@keyframes pgin{from{transform:rotateY(80deg);opacity:.2;filter:brightness(.7)}to{transform:none;opacity:1}}
.book .nav{display:flex;align-items:center;justify-content:center;gap:var(--s2);margin-top:var(--s2)}
.unroll{position:absolute;left:-4px;right:-4px;top:0;height:14px;z-index:3;border-radius:8px;pointer-events:none;background:linear-gradient(#fff3,#0000 40%,#0005),#c9a96a;box-shadow:0 6px 10px rgba(0,0,0,.4)}
#nav .needle{position:absolute;pointer-events:none;width:26px;height:26px;z-index:2;transition:transform .5s cubic-bezier(.34,1.4,.5,1),left .4s,top .4s;left:0;top:0}
#nav .needle svg{width:100%;height:100%;transition:transform .7s cubic-bezier(.3,1.5,.5,1)}
html[data-anim=off] #nav .needle,html[data-anim=off] #nav .needle svg{transition:none}
.pcw{max-width:460px;margin:var(--s3) auto 0}.pcw svg.pc{width:100%;height:auto;display:block;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.45)}
`;
let injected = false;
const css = () => { if (injected) return; injected = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };

/* ---------- mini board (static SVG from FEN) ---------- */
const GL = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
export function miniBoard(fen, { mark } = {}) {
  const rows = fen.split(' ')[0].split('/'); let sq = '', pc = '';
  rows.forEach((row, r) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) { f += +ch; continue; } const w = ch === ch.toUpperCase(); pc += `<text x="${f * 10 + 5}" y="${r * 10 + 8.2}" font-size="9" text-anchor="middle" fill="${w ? '#fff' : '#1a1410'}" stroke="${w ? '#1a1410' : '#fff'}" stroke-width=".35" paint-order="stroke">${GL[ch.toLowerCase()]}&#xFE0E;</text>`; f++; } });
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) sq += `<rect x="${f * 10}" y="${r * 10}" width="10" height="10" fill="${(r + f) % 2 ? '#8a5a2e' : '#e6cf9c'}"/>`;
  let mk = ''; if (mark) { const p = s => [(s.charCodeAt(0) - 97) * 10 + 5, (8 - +s[1]) * 10 + 5]; const [x1, y1] = p(mark.slice(0, 2)), [x2, y2] = p(mark.slice(2, 4)); mk = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2fa36b" stroke-width="2" stroke-linecap="round" opacity=".85"/><circle cx="${x2}" cy="${y2}" r="2.6" fill="#2fa36b" opacity=".85"/>`; }
  return `<svg viewBox="0 0 80 80" role="img" aria-label="Position of the worst moment">${sq}${pc}${mk}</svg>`;
}
export const gradeOf = (ok, n) => { const p = n ? ok / n : 0; return p >= .9 ? 'A' : p >= .75 ? 'B' : p >= .6 ? 'C' : p >= .4 ? 'D' : 'F'; };
const sealSVG = g => `<svg class="seal" viewBox="0 0 100 100" role="img" aria-label="Grade ${g}"><defs><radialGradient id="wx" cx=".35" cy=".3"><stop offset="0" stop-color="#e2574a"/><stop offset=".7" stop-color="#a3241b"/><stop offset="1" stop-color="#6e130d"/></radialGradient></defs>
 <path d="M50 4c8 0 11 6 18 7s12 5 12 13 6 11 6 19-5 12-5 19-2 14-10 16-13 7-21 7-13-4-21-7-12-8-12-16-6-11-5-19 5-11 6-19 4-13 12-13 11-7 18-7z" fill="url(#wx)"/>
 <circle cx="50" cy="50" r="31" fill="none" stroke="#00000033" stroke-width="2.5"/><circle cx="50" cy="50" r="28" fill="none" stroke="#ffffff22" stroke-width="1.5"/>
 <text x="50" y="64" text-anchor="middle" font-family="Cin,Georgia,serif" font-weight="700" font-size="44" fill="#5c0f09" stroke="#e8685a" stroke-width=".8" paint-order="stroke">${g}</text></svg>`;
const fmtD = d => new Date(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* entry: {t,mode,name,ok,n,avg,real,budget,best,worst:{fen,san,played,swing,mv},bestMv:{san,swing,secs},advisor,flags} */
export function logHTML(e, cls = '') {
  const g = gradeOf(e.ok, e.n), sw = v => (v / 100).toFixed(1), mx = Math.max(e.avg, e.real, e.budget || 0, 1) * 1.15;
  const w = e.worst, b = e.bestMv;
  return `<article class="clog ${cls}" aria-label="Captain's log, ${esc(e.name)} session, grade ${g}">
  <div class="cl-k">Captain's log</div><h2>${esc(e.name)} watch</h2><div class="cl-d">${fmtD(e.t)}</div>
  <div class="cl-g"><div><div class="cl-k">Score</div><div class="cl-big">${e.ok} of ${e.n}</div></div>
   <div><div class="cl-k">Best move</div>${b ? `<div class="cl-big" style="font-size:24px">${esc(b.san)}</div><div class="cl-d" style="margin:0">${b.swing >= 30 ? 'worth ' + sw(b.swing) + ' pawns, ' : ''}in ${b.secs.toFixed(1)}s</div>` : '<div class="cl-d" style="margin:0">None found this watch.</div>'}</div></div>
  <div class="cl-k">Worst moment</div>
  ${w ? `<div class="cl-w">${miniBoard(w.fen, { mark: w.mv })}<div>You played <b>${esc(w.played || 'a slip')}</b>.<br>Best was <b>${esc(w.san)}</b>${w.swing >= 30 ? `, a swing of ${sw(w.swing)} pawns` : ''}.</div></div>` : '<p style="margin:4px 0 10px;position:relative;z-index:1">Clean sailing. Not a single slip.</p>'}
  <div class="cl-k" style="position:relative;z-index:1">Decision time</div>
  <div style="position:relative;z-index:1;font-size:14px">${e.avg.toFixed(1)}s a move against your real median of ${e.real}s.</div>
  <div class="cl-bar" aria-hidden="true"><i style="width:${Math.min(100, e.avg / mx * 100)}%"></i><b style="left:${Math.min(98, e.real / mx * 100)}%"></b></div>
  ${e.ghosts != null ? `<div style="position:relative;z-index:1;font-size:14px;margin-top:6px">Ghosts beaten: <b>${e.ghosts}</b> this watch${e.gtot != null ? ` · ${e.gtot} all-time` : ''}.</div>` : ''}
  <div class="cl-sign"><div class="cl-sig">${avatar(e.advisor || 'Skipper', 'pleased')}<span>${esc(e.advisor || 'Skipper')}</span></div>${sealSVG(g)}</div>
  ${cls.includes('cl-live') ? '<div class="row" style="margin-top:14px"><button class="btn" id="d-again">Another session</button><a class="btn ghost" href="#today">Back to tonight</a></div>' : ''}</article>`;
}
export function saveLog(e) { const L = store.get('logs', []) || []; L.unshift(e); store.set('logs', L.slice(0, 30)); }
export const getLogs = () => store.get('logs', []) || [];
export function showLog(root, e) { css(); root.innerHTML = logHTML(e, 'cl-live'); hydrate(root); }

/* ---------- logbook: pages flip between sessions ---------- */
export function logbook(el) {
  css(); const L = getLogs(); let i = 0;
  if (!L.length) { el.innerHTML = ''; return false; }
  el.innerHTML = `<div class="book"><div id="bk-pg">${logHTML(L[0])}</div><div class="nav"><button class="btn ghost sm" id="bk-p" type="button">&larr; Newer</button><span class="sub" id="bk-n"></span><button class="btn ghost sm" id="bk-nx" type="button">Older &rarr;</button></div></div>`;
  hydrate(el); const pg = el.querySelector('#bk-pg'); let busy = false;
  const upd = () => { el.querySelector('#bk-n').textContent = `Page ${i + 1} of ${L.length}`; el.querySelector('#bk-p').disabled = i === 0; el.querySelector('#bk-nx').disabled = i === L.length - 1; };
  const go = async d => {
    const n = i + d; if (busy || n < 0 || n >= L.length) return; busy = true;
    const old = pg.firstElementChild; if (full()) { old.classList.add('flip-out'); await new Promise(r => setTimeout(r, 380)); }
    i = n; pg.innerHTML = logHTML(L[i], full() ? 'flip-in' : ''); hydrate(pg); upd(); busy = false;
  };
  el.querySelector('#bk-p').onclick = () => go(-1); el.querySelector('#bk-nx').onclick = () => go(1); upd(); return true;
}

/* ---------- voyage chart unrolls from a rolled top edge ---------- */
export function unroll(wrap) {
  if (!full() || !wrap || !wrap.animate) return; css();
  const ch = wrap.querySelector('.chart'); if (!ch) return;
  const host = ch.parentElement; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const r = document.createElement('div'); r.className = 'unroll'; host.appendChild(r);
  const D = 900, ease = 'cubic-bezier(.3,.7,.3,1)';
  ch.animate([{ clipPath: 'inset(0 0 100% 0)', transform: 'scaleY(.96)', transformOrigin: '50% 0' }, { clipPath: 'inset(0 0 0 0)', transform: 'none', transformOrigin: '50% 0' }], { duration: D, easing: ease });
  const h = ch.getBoundingClientRect().height;
  r.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${h - 14}px)`, opacity: 1, offset: .92 }, { transform: `translateY(${h - 14}px)`, opacity: 0 }], { duration: D + 150, easing: ease }).finished.then(() => r.remove(), () => r.remove());
}

/* ---------- nav compass needle ---------- */
export function compass(nav) {
  css(); let n = nav.querySelector('.needle');
  if (!n) { n = document.createElement('i'); n.className = 'needle'; n.setAttribute('aria-hidden', 'true');
    n.innerHTML = '<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="11.5" fill="#1b1409" stroke="#c9a24a" stroke-width="1.6"/><g class="nd"><path d="M13 3.5l3 9.5h-6z" fill="#e0483b"/><path d="M13 22.5l-3-9.5h6z" fill="#e8d9b0"/></g><circle cx="13" cy="13" r="1.6" fill="#c9a24a"/></svg>'; nav.appendChild(n); }
  if (!nav._rz) { nav._rz = 1; addEventListener('resize', () => compass(nav)); }
  const items = [...nav.querySelectorAll('a.item')], on = nav.querySelector('a.item.on'); if (!on) return;
  const nr = nav.getBoundingClientRect(), r = on.getBoundingClientRect(), vert = getComputedStyle(nav).flexDirection === 'column';
  const x = vert ? r.right - nr.left - 34 : r.left - nr.left + r.width / 2 - 13, y = vert ? r.top - nr.top + r.height / 2 - 13 : r.top - nr.top - 9;
  n.style.transform = `translate(${x}px,${y}px)`;
  n.querySelector('svg').style.transform = `rotate(${(items.indexOf(on) - (items.length - 1) / 2) * 38}deg)`;
}

/* ---------- weekly postcard ---------- */
const FONT_URLS = [['Cin', 'fonts/cinzel.ttf', 700], ['Osw', 'fonts/oswald-700.ttf', 700]];
const b64 = async u => { const buf = new Uint8Array(await (await fetch(u)).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192)); return btoa(s); };
async function fontCSS() { try { return (await Promise.all(FONT_URLS.map(async ([f, u, w]) => `@font-face{font-family:${f};font-weight:${w};src:url(data:font/ttf;base64,${await b64(u)})}`))).join(''); } catch (_) { return ''; } }
function weekXp() { const L = Pr.state().xpLog || {}; let t = 0; for (let k = 0; k < 7; k++) t += L[Pr.dayKey(-k)] || 0; return t; }
export function postcardData() {
  const R = Pr.rank(), cards = Pr.collected().map(Pr.cardById).filter(Boolean).sort((a, b) => b.rar - a.rar)[0] || null;
  return { rank: R.name, xp: weekXp(), total: R.xp, streak: Pr.streakNow(), card: cards, isl: ISLANDS.map(i => ({ ...i, p: progress(i) })) };
}
export function postcardSVG(d, quote, embed = '') {
  const sx = 900 / 700, S = (x, y) => [90 + x * sx * .98, 330 + y * sx * .98 * .9];
  const route = [[95, 700], ...d.isl.map(i => [i.x, i.y])].map(([x, y]) => S(x, y)), path = 'M' + route.map(p => p.map(v => v.toFixed(0)).join(' ')).join(' L');
  const done = d.isl.filter(i => i.p >= 100).length, lead = d.isl.filter(i => i.p > 0 && !i.locked).sort((a, b) => b.p - a.p)[0], shipAt = lead ? S(lead.x, lead.y) : route[0];
  const isl = d.isl.map(i => { const [x, y] = S(i.x, i.y); return `<g><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(i.r * 1.1).toFixed(0)}" fill="${i.p >= 100 ? '#4f8a5a' : '#b79a64'}" stroke="#3b2a1a" stroke-width="3" opacity="${i.locked ? .35 : 1}"/><text x="${x.toFixed(0)}" y="${(y + 7).toFixed(0)}" text-anchor="middle" font-family="Osw,Impact,sans-serif" font-size="22" fill="#2a1a0c">${i.p}%</text></g>`; }).join('');
  const lines = []; let cur = ''; String(quote.tip).split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > 40) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) lines.push(cur);
  const stat = (x, k, v) => `<text x="${x}" y="1160" text-anchor="middle" font-family="Cin,Georgia,serif" font-weight="700" font-size="58" fill="#3b2a1a">${esc(v)}</text><text x="${x}" y="1196" text-anchor="middle" font-family="Osw,Impact,sans-serif" font-size="22" letter-spacing="4" fill="#7a5a34">${k}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="pc" viewBox="0 0 1080 1350" width="1080" height="1350"><style>${embed}</style>
  <defs><radialGradient id="pb" cx=".4" cy=".2" r="1"><stop offset="0" stop-color="#f6e9c8"/><stop offset=".7" stop-color="#e8d4a2"/><stop offset="1" stop-color="#d2b57a"/></radialGradient></defs>
  <rect width="1080" height="1350" fill="url(#pb)"/><rect x="28" y="28" width="1024" height="1294" rx="10" fill="none" stroke="#7a5a34" stroke-width="4"/><rect x="42" y="42" width="996" height="1266" rx="6" fill="none" stroke="#7a5a34" stroke-width="1.5"/>
  <text x="540" y="140" text-anchor="middle" font-family="Cin,Georgia,serif" font-weight="700" font-size="76" letter-spacing="6" fill="#3b2a1a">VOYAGE RECAP</text>
  <text x="540" y="190" text-anchor="middle" font-family="Osw,Impact,sans-serif" font-size="26" letter-spacing="8" fill="#7a5a34">WEEK ENDING ${esc(new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' }).toUpperCase())}</text>
  <text x="540" y="262" text-anchor="middle" font-family="Cin,Georgia,serif" font-weight="700" font-size="46" fill="#a3241b">${esc(d.rank)}</text>
  <rect x="90" y="300" width="900" height="720" rx="14" fill="#cfe0dc" opacity=".55" stroke="#3b2a1a" stroke-width="3"/>
  <path d="${path}" fill="none" stroke="#a3241b" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round"/>${isl}
  <g transform="translate(${shipAt[0].toFixed(0)} ${(shipAt[1] - 70).toFixed(0)})"><path d="M-34 8h68l-14 22h-40z" fill="#5a3d1c" stroke="#2a1a0c" stroke-width="3"/><path d="M0 8V-60" stroke="#2a1a0c" stroke-width="4"/><path d="M4 -56c24 12 28 32 28 52H4z" fill="#f3ead2" stroke="#2a1a0c" stroke-width="3"/></g>
  <text x="540" y="1062" text-anchor="middle" font-family="Osw,Impact,sans-serif" font-size="24" letter-spacing="4" fill="#7a5a34">${done} OF 6 ISLANDS CONQUERED</text>
  ${stat(190, 'XP THIS WEEK', '+' + d.xp)}${stat(540, 'DAY STREAK', String(d.streak))}${stat(890, 'BEST CARD', d.card ? ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][d.card.rar] : 'None yet')}
  <line x1="120" y1="1226" x2="960" y2="1226" stroke="#7a5a34" stroke-width="1.5"/>
  ${lines.slice(0, 3).map((l, i) => `<text x="540" y="${1262 + i * 28}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="25" fill="#3b2a1a">${i === 0 ? '“' : ''}${esc(l)}${i === Math.min(lines.length, 3) - 1 ? '”' : ''}</text>`).join('')}
  <text x="960" y="1296" text-anchor="end" font-family="Cin,Georgia,serif" font-weight="700" font-size="22" fill="#7a5a34">${esc(quote.who)}</text></svg>`;
}
let TIPS = null; const tips = async () => TIPS || (TIPS = await fetch('data/tips.json').then(r => r.json()).catch(() => [{ who: 'Skipper', tip: 'Steady as she goes.' }]));
export async function postcard(ctx) {
  css(); const { render, topbar } = ctx, d = postcardData(), T = await tips(), quote = T[Math.floor(Math.random() * T.length)];
  render(`${topbar}<a class="back" href="#today">&larr; Back</a><span class="k">Weekly</span><h1 style="font-family:var(--f-log)">Voyage recap</h1>
   <div class="pcw">${postcardSVG(d, quote)}<div class="row mt2"><button class="btn" id="pc-dl" type="button">Download PNG</button><span class="sub sm" id="pc-st" role="status"></span></div></div>`);
  document.querySelector('#pc-dl').onclick = async () => {
    const st = document.querySelector('#pc-st'); st.textContent = 'Painting...';
    try {
      const svg = postcardSVG(d, quote, await fontCSS()), img = new Image(), u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = u; });
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; c.getContext('2d').drawImage(img, 0, 0, 1080, 1350); URL.revokeObjectURL(u);
      const blob = await new Promise(r => c.toBlob(r, 'image/png')), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'mast-voyage-recap.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      window.__lastPostcard = blob.size; st.textContent = 'Saved (' + Math.round(blob.size / 1024) + ' KB).';
    } catch (e) { st.textContent = 'Could not make the image.'; }
  };
}
