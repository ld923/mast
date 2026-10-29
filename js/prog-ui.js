import { photo } from './photo.js';
// Progression visuals: rank insignia, sail XP meter, HUD, toasts, ceremonies, chest, cards, collection, trophies, daily route, boss intro, Tempo arrival.
import * as Pr from './progress.js';
import { figure, figCSS } from './figures.js';
import { portrait, CH, OUTFITS } from './portraits.js';
import { getAnim, full, confetti, wash, buzz } from './fx.js';
import { play } from './sound.js';
import { store } from './ui.js';
import { unlocked as outfitUnlocked } from './crewstate.js';

const A = () => getAnim(), RM = () => A() !== 'full';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let uid = 0;
const CSS = `
.back+.k{display:block;margin-top:8px}
.hud{position:fixed;z-index:29;top:14px;right:64px;height:42px;display:flex;align-items:center;gap:4px;padding:0 6px;border-radius:var(--r-pill);border:1px solid var(--glass-b);background:var(--glass);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:var(--fg);text-decoration:none}
.hud a,.hud button{display:flex;align-items:center;gap:6px;color:inherit;text-decoration:none;background:none;border:0;cursor:pointer;padding:0 4px;height:100%;font:inherit}
.hud .hb svg{width:30px;height:30px;display:block}.hud .hs svg{width:22px;height:30px;display:block}
.hud .ht{display:flex;flex-direction:column;line-height:1.05}.hud .ht b{font:700 11px var(--f-disp);letter-spacing:.12em;text-transform:uppercase}.hud .ht i{font:500 10px var(--f-body);font-style:normal;color:var(--dim)}
.hud .hf{font:700 15px var(--f-disp);color:var(--a)}.hud .hf svg{width:16px;height:20px}
.hud .hc{color:var(--a);animation:pgpulse 1.6s ease-in-out infinite}.hud .hc svg{width:24px;height:22px}.hud .hc[hidden]{display:none}
@keyframes pgpulse{50%{transform:scale(1.15);filter:drop-shadow(0 0 6px var(--a))}}
@media(max-width:560px){.hud{right:62px;top:12px}.hud .ht{display:none}}
@media(min-width:821px){.hud{right:68px}}
.sail .sl-bg{fill:rgba(255,255,255,.1)}.sail .sl-ln{fill:none;stroke:var(--a);stroke-width:1.4;stroke-linejoin:round}.sail .sl-w{fill:var(--a);opacity:.92}.sail .sl-mast{stroke:var(--fg);stroke-width:1.6;opacity:.7;fill:none;stroke-linecap:round}
.sail .sl-fill{transition:transform 1s var(--ease)}
.sail .sl-b{transform-box:fill-box;transform-origin:0 100%}
html[data-anim=full] .sail .sl-b{animation:slb 3.2s ease-in-out infinite alternate}html[data-anim=full] .sail .sl-w{animation:slw 2.4s linear infinite}
@keyframes slb{from{transform:scaleX(.94) skewY(0)}to{transform:scaleX(1.06) skewY(-2deg)}}@keyframes slw{to{transform:translateX(-20px)}}
.pgt{position:fixed;z-index:56;left:50%;top:14px;transform:translate(-50%,-140%);max-width:min(420px,92vw);display:flex;gap:10px;align-items:center;padding:10px 16px 10px 10px;border-radius:var(--r-lg);background:var(--bg);border:1px solid var(--ac,var(--a));box-shadow:var(--shadow),0 0 22px color-mix(in srgb,var(--ac,var(--a)) 40%,transparent);pointer-events:none;transition:transform .5s var(--ease)}
.pgt.on{transform:translate(-50%,0)}.pgt .av,.pgt .pa{width:46px;height:46px;flex:none;border-radius:50%;overflow:hidden}.pgt .pa svg{width:100%;height:100%}
.pgt .k{display:block;font:700 11px var(--f-disp);letter-spacing:.2em;text-transform:uppercase;color:var(--ac,var(--a))}.pgt b{display:block;font:700 17px var(--f-disp);letter-spacing:.05em}.pgt p{margin:0;font-size:13px;color:var(--dim)}
.pgt .pcard{width:74px;flex:none}
.xpf{position:fixed;z-index:56;top:62px;right:76px;font:700 16px var(--f-disp);letter-spacing:.06em;color:var(--a);text-shadow:0 0 12px rgba(0,0,0,.6);pointer-events:none;animation:xpf 1.5s ease-out forwards}
@keyframes xpf{from{opacity:0;transform:translateY(8px)}15%{opacity:1}to{opacity:0;transform:translateY(-22px)}}
.pgo{position:fixed;inset:0;z-index:58;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse at 50% 40%,rgba(10,26,40,.9),rgba(3,8,13,.96));overflow:auto;animation:ifade .35s}
.pgo .box{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;max-width:min(560px,94vw)}
.pgo .btn,.tspot .btn{align-self:center}
.pgo h2{font:700 clamp(30px,8vw,52px) var(--f-disp);letter-spacing:.06em;text-transform:uppercase;margin:0;color:var(--a)}.pgo .sub{color:var(--dim)}
.rk-ins{width:min(46vw,200px);height:min(46vw,200px)}.rk-ins svg{width:100%;height:100%}
html[data-anim=full] .rk-ins{animation:rkin 1.1s cubic-bezier(.2,1.4,.4,1) both}@keyframes rkin{from{transform:scale(.2) rotate(-200deg);opacity:0}to{transform:none;opacity:1}}
.rk-row{display:flex;align-items:flex-end;gap:14px}.rk-fig{width:90px;height:206px}.rk-fig svg{width:100%;height:100%}
html[data-anim=full] .rk-glow{position:absolute;inset:-30% -10%;background:conic-gradient(from 0deg,transparent,rgba(255,200,87,.18),transparent 30%,rgba(255,200,87,.18),transparent 60%,rgba(255,200,87,.18),transparent);animation:rkspin 8s linear infinite;pointer-events:none;border-radius:50%;z-index:-1}@keyframes rkspin{to{transform:rotate(360deg)}}
.chest{width:min(60vw,230px);cursor:pointer;margin-top:36px}.chest svg{width:100%;display:block;overflow:visible}
.chest .lid{transform-box:fill-box;transform-origin:0 100%;transition:transform .7s cubic-bezier(.3,1.5,.5,1)}.chest.open .lid{transform:rotate(-68deg)}
.chest .gl{opacity:0;transition:opacity .6s}.chest.open .gl{opacity:1}
html[data-anim=full] .chest:not(.open){animation:chwob 1.4s ease-in-out infinite}@keyframes chwob{0%,100%{transform:rotate(0)}30%{transform:rotate(-2.5deg)}60%{transform:rotate(2.5deg)}}
.rw{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:90px}
.rw .it{min-width:104px;max-width:150px;padding:10px 12px;border-radius:var(--r-md);background:var(--glass);border:1px solid var(--glass-b);font-size:13px;opacity:0}
.rw .it b{display:block;font:700 20px var(--f-disp);color:var(--a)}.rw .it .pcard{width:96px;margin:0 auto 4px}
html[data-anim=full] .rw .it{animation:itfly .8s cubic-bezier(.2,1.2,.4,1) both;animation-delay:var(--d)}html:not([data-anim=full]) .rw .it{opacity:1}
@keyframes itfly{from{opacity:0;transform:translateY(120px) scale(.2)}to{opacity:1;transform:none}}
.route{list-style:none;margin:8px 0 0;padding:0;display:flex;align-items:flex-start;gap:0}
.route li{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;text-align:center}
.route li:not(:last-child)::after{content:"";position:absolute;top:19px;left:calc(50% + 22px);right:calc(-50% + 22px);border-top:3px dotted var(--glass-b)}
.route li.done:not(:last-child)::after{border-top-color:var(--a);border-top-style:solid}
.route .dot{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font:700 12px var(--f-disp);color:var(--fg);text-decoration:none;background:conic-gradient(var(--a) calc(var(--p)*1%),var(--glass-b) 0);position:relative;cursor:pointer}
.route .dot::before{content:"";position:absolute;inset:4px;border-radius:50%;background:var(--bg)}.route .dot span{position:relative}
.route li.done .dot{background:var(--a);color:var(--on-a)}.route li.done .dot::before{display:none}
.route .lb{font:700 10px var(--f-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}
.route button.dot{border:0;padding:0}.route .chd.rdy .dot{animation:pgpulse 1.4s ease-in-out infinite;background:var(--a)}.route .chd.rdy .dot::before{display:none}.route .chd.opn{opacity:.55}
.pgrank{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.pgrank .rk-ins{width:64px;height:64px;animation:none}.pgrank .sail{width:36px;height:48px}.pgrank h3{margin:0;font:700 22px var(--f-disp);letter-spacing:.08em;text-transform:uppercase}
.pgrank .row2{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.pcard{--ac:#C9A24B;position:relative;display:flex;flex-direction:column;gap:5px;padding:8px 8px 9px;border-radius:12px;color:#17110a;background:linear-gradient(160deg,#f2e3b4,#d8c183);border:3px solid var(--rc,#9a7b4f);box-shadow:0 4px 16px rgba(0,0,0,.35);font-family:var(--f-body);min-width:0;text-align:left}
.pcard.r1{--rc:#4f9a6a}.pcard.r2{--rc:#3f7fd0}.pcard.r3{--rc:#a24fd0}.pcard.r4{--rc:#e0a31b;box-shadow:0 4px 22px rgba(255,200,87,.55);background:linear-gradient(160deg,#fff0b8,#e5be5c)}
.pcard .pc-h{display:flex;justify-content:space-between;font:700 9px var(--f-disp);letter-spacing:.14em;text-transform:uppercase}.pcard .pc-h i{font-style:normal;color:var(--rc)}
.pcard .pc-pt{display:flex;align-items:center;gap:6px}.pcard .pc-pt .pa{width:34px;height:34px;border-radius:50%;overflow:hidden;flex:none;border:2px solid var(--ac)}.pcard .pc-pt .pa svg{width:100%;height:100%}
.pcard .pc-g{font:700 12px var(--f-disp);letter-spacing:.04em;line-height:1.1}.pcard .pc-y{font-size:10px;opacity:.75}
.pcard svg.bd{width:100%;height:auto;display:block;border-radius:4px;border:1px solid rgba(0,0,0,.4)}
.pcard.lock{background:var(--glass);color:var(--dim);border:2px dashed var(--glass-b);box-shadow:none;align-items:center;justify-content:center;min-height:200px;text-align:center}
html[data-anim=full] .pcard.flip{animation:cflip .9s cubic-bezier(.2,.9,.3,1) both}@keyframes cflip{from{transform:perspective(600px) rotateY(-180deg) scale(.6);opacity:0}}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:var(--s2)}
@media(max-width:480px){.cgrid{grid-template-columns:repeat(2,1fr);gap:10px}}
.shelf svg{width:100%;height:auto;display:block}.shelf .lb{font:700 11px var(--f-disp);letter-spacing:.1em;text-transform:uppercase;fill:var(--dim)}.shelf .gh{opacity:.2}
.agrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:var(--s2)}
.ach{display:flex;gap:12px;align-items:center;padding:12px;border-radius:var(--r-md);background:var(--glass);border:1px solid var(--glass-b)}.ach.lk{opacity:.5}
.ach .pa{width:42px;height:42px;border-radius:50%;overflow:hidden;flex:none;filter:none}.ach.lk .pa{filter:grayscale(1)}.ach .pa svg{width:100%;height:100%}.ach b{display:block;font:700 15px var(--f-disp);letter-spacing:.05em}.ach span{font-size:12px;color:var(--dim)}
.boss{display:flex;align-items:flex-end;gap:16px;padding:18px 20px;border-radius:var(--r-lg);border:2px solid #c23b2e;background:linear-gradient(135deg,rgba(194,59,46,.28),rgba(8,12,18,.92));box-shadow:0 0 40px rgba(194,59,46,.4);max-width:min(560px,94vw);text-align:left}
.boss .bf{width:110px;height:252px;flex:none}.boss .bf svg{width:100%;height:100%}.boss .tag{display:inline-block;background:#c23b2e;color:#fff;font:700 12px var(--f-disp);letter-spacing:.3em;padding:3px 10px;border-radius:4px}
.boss h2{color:#fff;font-size:clamp(26px,7vw,40px);margin:.2em 0 0}.boss p{margin:.2em 0}
.hp{display:flex;gap:4px;margin:8px 0}.hp i{flex:1;height:14px;border-radius:3px;background:#c23b2e;box-shadow:0 0 8px rgba(194,59,46,.7);transition:background .4s,box-shadow .4s,transform .3s}.hp i.x{background:rgba(255,255,255,.12);box-shadow:none;transform:scaleY(.6)}
.hearts{font:700 16px var(--f-disp);letter-spacing:.2em;color:#ff6b5e}
@media(max-width:480px){.boss{padding:12px;gap:8px}.boss .bf{width:84px;height:192px}}
.bhud{display:flex;flex-direction:column;gap:6px;margin-bottom:var(--s1);padding:10px 12px;border-radius:var(--r-md);border:1px solid #c23b2e;background:rgba(194,59,46,.12)}.bhud b{font:700 14px var(--f-disp);letter-spacing:.14em;text-transform:uppercase}.bhud .hp{margin:2px 0}
.storm{position:absolute;inset:8px;z-index:6;overflow:hidden;border-radius:20px;pointer-events:none}
.storm .cl{position:absolute;width:70%;height:42%;border-radius:50%;background:radial-gradient(ellipse,#14202c 30%,rgba(20,32,44,0) 70%);filter:blur(6px);transition:transform 2.4s ease-out,opacity 2s}
.storm .dk{position:absolute;inset:0;background:#02060b;opacity:0;transition:opacity 2.4s}
.storm .fl{position:absolute;inset:0;background:#dfeaff;opacity:0}
html[data-anim=full] .storm .fl{animation:flash 2.6s steps(1) 1.2s 2}@keyframes flash{0%,100%{opacity:0}5%{opacity:.7}9%{opacity:0}14%{opacity:.5}18%{opacity:0}}
.storm .rn{position:absolute;inset:-20%;background:repeating-linear-gradient(105deg,transparent 0 9px,rgba(200,220,255,.22) 9px 10px);opacity:0;transition:opacity 1.5s}html[data-anim=full] .storm.go .rn{animation:rain .35s linear infinite}@keyframes rain{to{transform:translate(-30px,60px)}}
.tspot{position:fixed;inset:0;z-index:58;display:grid;place-items:center;background:radial-gradient(ellipse 28% 52% at 50% 52%,rgba(255,220,140,.22),#01030a 72%);animation:ifade .6s}
.tspot .box{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:16px;max-width:92vw}.tspot .tf{width:150px;height:343px}.tspot .tf svg{width:100%;height:100%;filter:drop-shadow(0 0 28px rgba(255,200,87,.55))}
.tspot h2{font:700 clamp(28px,7vw,44px) var(--f-disp);letter-spacing:.18em;text-transform:uppercase;color:var(--a);margin:0}.tspot q{font-size:18px;font-style:italic;max-width:30ch;quotes:none}
@media(max-height:640px){.tspot .tf{width:96px;height:220px}}
.isle.rise{animation:irise 2.4s cubic-bezier(.2,.9,.3,1) both}@keyframes irise{from{opacity:0;transform:translateY(60px) scale(.2)}60%{opacity:1}to{transform:none}}
.isle .flag{animation:fplant .9s cubic-bezier(.3,1.5,.5,1) both;transform-box:fill-box;transform-origin:50% 100%}@keyframes fplant{from{transform:translateY(-30px) scaleY(.1);opacity:0}}
.ofit.spin{animation:ospin 1.4s cubic-bezier(.2,.9,.3,1) both}@keyframes ospin{0%{transform:perspective(500px) rotateY(0) scale(1)}50%{transform:perspective(500px) rotateY(540deg) scale(1.12);box-shadow:0 0 36px var(--ac,var(--a))}100%{transform:perspective(500px) rotateY(720deg) scale(1)}}
html[data-anim=off] .hud *,html[data-anim=off] .pgo *,html[data-anim=off] .pgt,html[data-anim=off] .tspot *,html[data-anim=off] .storm *{animation:none!important;transition:none!important}
html[data-anim=reduced] .hud *,html[data-anim=reduced] .pgo *{animation-duration:.01ms!important}`;
const ensureCss = () => { if (!document.getElementById('mast-prog-css')) { const s = document.createElement('style'); s.id = 'mast-prog-css'; s.textContent = CSS; document.head.appendChild(s); } };

/* ---------- queue: nothing interrupts a running clock ---------- */
const Q = []; let busy = false, running = false;
export function setBusy(b) { busy = !!b; if (!b) pump(); }
const later = fn => { Q.push(fn); pump(); };
async function pump() { if (running || busy || !Q.length) return; running = true; try { await Q.shift()(); } catch (e) { console.error(e); } running = false; pump(); }
const wait = ms => new Promise(r => setTimeout(r, RM() ? Math.min(ms, 400) : ms));

/* ---------- insignia ---------- */
export function insignia(i, size = 48) {
  const id = 'in' + uid++, tier = i <= 1 ? ['#8a5a2b', '#d9a066'] : i <= 3 ? ['#7f8a97', '#e8eef5'] : ['#b8892e', '#ffd978'], [d, l] = tier;
  const anchor = (s, y) => `<g transform="translate(24 ${y}) scale(${s}) translate(-24 -24)" fill="none" stroke="${l}" stroke-width="3" stroke-linecap="round"><circle cx="24" cy="10" r="3.4"/><path d="M24 13.5V38M17 19H31M10 29q1 10 14 10t14-10M10 29l-3 3M38 29l3 3"/></g>`;
  const chev = n => Array.from({ length: n }, (_, k) => `<path d="M13 ${30 + k * 5}l11 5 11-5" fill="none" stroke="${l}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const bars = [2, 3, 4, 4, 5][i - 4], stars = i === 6 ? 1 : i === 7 ? 2 : i === 8 ? 3 : 0;
  const st = (x, y) => `<path transform="translate(${x} ${y})" d="M0 -5.5L1.6 -1.7 5.7 -1.5 2.5 1 3.6 5 0 2.8 -3.6 5 -2.5 1 -5.7 -1.5 -1.6 -1.7Z" fill="${l}"/>`;
  let em = '';
  if (i <= 3) em = i === 0 ? anchor(1.05, 24) : anchor(.62, 17) + chev(i);
  else {
    em = Array.from({ length: bars }, (_, k) => `<rect x="11" y="${36 - k * 6.4}" width="26" height="3.6" rx="1.2" fill="${l}"/>`).join('') + `<path d="M11 ${36 - (bars - 1) * 6.4 - 4}h26" stroke="none"/>` + (i >= 5 ? `<circle cx="24" cy="${36 - (bars - 1) * 6.4 - 1.8}" r="0"/>` : '');
    const sy = 36 - (bars - 1) * 6.4 - 9; em += stars ? Array.from({ length: stars }, (_, k) => st(24 + (k - (stars - 1) / 2) * 11, sy)).join('') : st(24, sy);
  }
  return `<svg viewBox="0 0 48 48" role="img" aria-label="${Pr.RANKS[i].n} insignia"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
   <circle cx="24" cy="24" r="22.5" fill="#0f2338" stroke="url(#${id})" stroke-width="3"/><circle cx="24" cy="24" r="18.5" fill="none" stroke="${d}" stroke-width="1" stroke-dasharray="2 2.4" opacity=".85"/>${i === 8 ? `<circle cx="24" cy="24" r="21" fill="none" stroke="${l}" stroke-width="1" opacity=".6"/>` : ''}${em}</svg>`;
}
export function sail(frac) {
  const id = 'sl' + uid++, d = 'M9 4C35 13 38 33 36 46H9Z';
  return `<svg class="sail" viewBox="0 0 40 52" aria-hidden="true"><g class="sl-b"><path class="sl-bg" d="${d}"/><clipPath id="${id}"><path d="${d}"/></clipPath>
   <g clip-path="url(#${id})"><g class="sl-fill" style="transform:translateY(${((1 - Math.max(0, Math.min(1, frac))) * 44).toFixed(1)}px)"><path class="sl-w" d="M-20 6q5-3 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0V60H-20Z"/></g></g><path class="sl-ln" d="${d}"/></g><path class="sl-mast" d="M9 1V51M4 47H39"/></svg>`;
}
const flame = n => `<svg viewBox="0 0 16 20" aria-hidden="true"><path d="M8 1c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10Z" fill="${n ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.4" opacity="${n ? 1 : .5}"/></svg>`;
const chestIcon = `<svg viewBox="0 0 30 26" aria-hidden="true"><path d="M3 11h24v13H3z" fill="#8a5a2b" stroke="#3a2608" stroke-width="1.5"/><path d="M3 11q0-8 12-8t12 8z" fill="#a8702f" stroke="#3a2608" stroke-width="1.5"/><path d="M3 15h24" stroke="#ffd978" stroke-width="2"/><rect x="12.5" y="13" width="5" height="6" rx="1" fill="#ffd978" stroke="#3a2608"/></svg>`;

/* ---------- HUD ---------- */
let hud = null;
function hudHTML() {
  const r = Pr.rank(), s = Pr.streakNow(), c = Pr.chestCount();
  return `<a class="hb" href="#trophies" aria-label="${r.name}, ${r.xp} XP${r.next ? ', next ' + r.next : ''}">${insignia(r.i, 30)}<span class="hs">${sail(r.frac)}</span><span class="ht"><b>${r.name}</b><i>${r.next ? r.xp - r.base + ' / ' + (r.to - r.base) + ' XP' : r.xp + ' XP'}</i></span></a>
   <a class="hf" href="#drills" aria-label="${s} day streak" title="${s} day streak">${flame(s)}<span>${s}</span></a><button class="hc" id="hud-chest" aria-label="Open treasure chest" ${c ? '' : 'hidden'}>${chestIcon}</button>`;
}
function updateHud() { if (!hud) return; hud.innerHTML = hudHTML(); hud.querySelector('#hud-chest').onclick = () => later(() => chestScene()); }
export function initProgressUI() {
  ensureCss(); if (hud) return;
  hud = document.createElement('div'); hud.className = 'hud'; hud.setAttribute('role', 'group'); hud.setAttribute('aria-label', 'Rank and streak'); document.body.appendChild(hud); updateHud();
  Pr.on((t, d) => {
    if (t === 'xp') { updateHud(); if (!document.hidden) { const x = document.createElement('div'); x.className = 'xpf'; x.textContent = '+' + d.n + ' XP'; document.body.appendChild(x); setTimeout(() => x.remove(), 1600); } }
    else if (t === 'streak' || t === 'dailyprog') updateHud();
    else if (t === 'rank') later(() => rankUp(d.to));
    else if (t === 'ach') { later(() => toast({ k: 'Achievement', title: d.a.n, line: d.a.line, who: d.a.who })); }
    else if (t === 'card') later(() => toast({ k: d.via === 'chest' ? 'Card from the chest' : 'New position card', card: d.card, title: d.card.white + ' v ' + d.card.black + (d.card.year ? ', ' + d.card.year : ''), line: Pr.RARITY[d.card.rar] + ' · ' + d.card.m, who: d.card.m }));
    else if (t === 'daily') { updateHud(); later(() => toast({ k: 'Daily voyage complete', title: 'A chest washes aboard', line: 'Tap the chest in the corner to open it.', who: 'Skipper' })); }
    else if (t === 'conquer') later(() => toast({ k: 'Island conquered', title: Pr.BOSSES[d.id].isle, line: 'Your flag is planted.', who: Pr.BOSSES[d.id].who }));
    else if (t === 'tempo') later(() => toast({ k: 'Storm on the horizon', title: "Tempo's Rock", line: 'Open the Voyage chart. Something is coming.', who: 'Tempo' }));
    if (t === 'chestopen') updateHud();
  });
}

/* ---------- toast ---------- */
export function toast({ k, title, line, who, card }) {
  return new Promise(res => {
    const el = document.createElement('div'); el.className = 'pgt'; el.setAttribute('role', 'status'); el.style.setProperty('--ac', (CH[who] || {}).acc || 'var(--a)');
    el.innerHTML = (card ? cardHTML(card, { flip: true }) : `<span class="pa">${CH[who] ? photo(who, 'excited') : ''}</span>`) + `<div><span class="k">${esc(k)}</span><b>${esc(title)}</b><p>${esc(line || '')}</p></div>`;
    document.body.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on'))); play('success'); buzz(12);
    setTimeout(() => { el.classList.remove('on'); setTimeout(() => { el.remove(); res(); }, 450); }, 3600);
  });
}

/* ---------- overlay helper ---------- */
function overlay(cls, html, { esc: escClose = true } = {}) {
  figCSS(); const el = document.createElement('div'); el.className = cls; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.tabIndex = -1; el.innerHTML = html;
  const prev = document.activeElement; document.body.appendChild(el); el.focus({ preventScroll: true });
  let done; const p = new Promise(r => done = r);
  const close = v => { if (!el.isConnected) return; el.remove(); if (prev && prev.focus) try { prev.focus({ preventScroll: true }); } catch (e) { } done(v); };
  if (escClose) el.addEventListener('keydown', e => { if (e.key === 'Escape') close(false); });
  return { el, close, p };
}

/* ---------- rank-up ceremony ---------- */
function rankUp(to) {
  const R = Pr.RANKS[to];
  const o = overlay('pgo', `<div class="box"><div class="rk-glow"></div><span class="k">Promoted</span><div class="rk-row"><div class="rk-ins">${insignia(to, 200)}</div><div class="rk-fig">${figure('Skipper', full() ? 'celebrate' : 'stand', 'excited')}</div></div>
   <h2>${R.n}</h2><p class="sub">${to < Pr.RANKS.length - 1 ? 'Next: ' + Pr.RANKS[to + 1].n + ' at ' + Pr.RANKS[to + 1].xp + ' XP' : 'The highest rank on the chart.'}</p><button class="btn" id="rk-ok">Aye aye</button></div>`);
  play('brilliant'); buzz([20, 40, 20]); if (full()) { confetti(2); wash(); setTimeout(() => confetti(1), 900); }
  o.el.querySelector('#rk-ok').onclick = () => o.close(true); o.el.querySelector('#rk-ok').focus();
  return o.p;
}

/* ---------- chest ---------- */
function chestSVG() {
  return `<svg viewBox="0 0 200 170" aria-hidden="true"><defs><radialGradient id="chg"><stop offset="0" stop-color="#fff3c4"/><stop offset=".4" stop-color="#ffc857" stop-opacity=".7"/><stop offset="1" stop-color="#ffc857" stop-opacity="0"/></radialGradient></defs>
   <ellipse cx="100" cy="158" rx="80" ry="8" fill="rgba(0,0,0,.35)"/><circle class="gl" cx="100" cy="80" r="110" fill="url(#chg)"/>
   <path d="M30 80h140v70H30z" fill="#7a4c1f" stroke="#2f1c08" stroke-width="4"/><path d="M30 104h140M30 128h140" stroke="#5a3513" stroke-width="2"/><path d="M30 80h140v14H30z" fill="#d8a43c" stroke="#2f1c08" stroke-width="3"/><path d="M52 80v70M148 80v70" stroke="#d8a43c" stroke-width="9"/>
   <path d="M30 80V70q0-4 4-4h132q4 0 4 4v10z" fill="#5a3513" opacity="0"/>
   <g class="lid"><path d="M30 80V58Q30 22 100 22T170 58V80Z" fill="#9a6428" stroke="#2f1c08" stroke-width="4"/><path d="M52 80V36M148 80V36" stroke="#d8a43c" stroke-width="9" opacity=".95"/><path d="M30 66h140" stroke="#d8a43c" stroke-width="5"/></g>
   <rect x="88" y="84" width="24" height="26" rx="4" fill="#ffd978" stroke="#2f1c08" stroke-width="3"/><circle cx="100" cy="95" r="3.5" fill="#2f1c08"/></svg>`;
}
const THEME_NAME = { teak: 'Teak deck board', chart: 'Sea-chart board', havana: 'Havana marble board', riga: 'Riga steel board' };
function rewardHTML(R) {
  return R.map((r, k) => {
    const d = `style="--d:${0.5 + k * .35}s"`;
    if (r.t === 'xp') return `<div class="it" ${d}><b>+${r.v}</b>XP</div>`;
    if (r.t === 'theme') return `<div class="it" ${d}><b>${esc(r.id)}</b>${THEME_NAME[r.id]} unlocked</div>`;
    if (r.t === 'outfit') return `<div class="it" ${d}><b>+${r.v}</b>${esc(r.who)} outfit progress</div>`;
    const c = Pr.cardById(r.id); return `<div class="it" ${d}>${c ? cardHTML(c) : ''}New position card</div>`;
  }).join('');
}
function chestScene() {
  if (!Pr.chestCount()) return Promise.resolve();
  const o = overlay('pgo', `<div class="box"><span class="k">Treasure</span><h2>Chest</h2><div class="chest" id="ch" role="button" tabindex="0" aria-label="Open the chest">${chestSVG()}</div><div class="rw" id="rw" aria-live="polite"></div><button class="btn" id="ch-go">Open</button></div>`);
  const ch = o.el.querySelector('#ch'), go = o.el.querySelector('#ch-go'), rw = o.el.querySelector('#rw'); let opened = false;
  const open = () => {
    if (opened) { o.close(true); if (Pr.chestCount()) later(() => chestScene()); return; }
    opened = true; const R = Pr.openChest(); if (!R) return o.close(); play('brilliant'); buzz([15, 30, 15]);
    ch.classList.add('open'); if (full()) { confetti(1); wash(); }
    setTimeout(() => { rw.innerHTML = rewardHTML(R); go.textContent = Pr.chestCount() ? 'Next chest' : 'Done'; go.focus(); }, full() ? 500 : 0);
    go.textContent = '...';
  };
  go.onclick = open; ch.onclick = () => { if (!opened) open(); }; ch.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && !opened) { e.preventDefault(); open(); } };
  go.focus(); return o.p;
}
export const openChestScene = () => later(() => chestScene());

/* ---------- cards ---------- */
const GL = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
function boardSVG(fen, mv) {
  const rows = fen.split(' ')[0].split('/'), sq = 12; let s = '';
  const hl = mv ? [mv.slice(0, 2), mv.slice(2, 4)] : [];
  rows.forEach((row, r) => { let c = 0; for (const ch of row) { if (/\d/.test(ch)) { c += +ch; continue; } c++; } });
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const name = 'abcdefgh'[c] + (8 - r); s += `<rect x="${c * sq}" y="${r * sq}" width="${sq}" height="${sq}" fill="${hl.includes(name) ? '#e6c35a' : (r + c) % 2 ? '#7b8f9a' : '#e9dcb4'}"/>`; }
  rows.forEach((row, r) => { let c = 0; for (const ch of row) { if (/\d/.test(ch)) { c += +ch; continue; } const w = ch === ch.toUpperCase(); s += `<text x="${c * sq + sq / 2}" y="${r * sq + sq * .82}" text-anchor="middle" font-size="${sq * 1.0}" fill="${w ? '#fffdf6' : '#1a1410'}" stroke="${w ? '#1a1410' : '#fffdf6'}" stroke-width=".5" paint-order="stroke" font-family="'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans',sans-serif">${GL[ch.toLowerCase()]}︎</text>`; c++; } });
  return `<svg class="bd" viewBox="0 0 96 96" role="img" aria-label="Position diagram">${s}</svg>`;
}
export function cardHTML(c, { flip = false } = {}) {
  const A = (CH[c.m] || {}).acc || '#C9A24B';
  return `<div class="pcard r${c.rar}${flip && full() ? ' flip' : ''}" style="--ac:${A}" data-id="${c.id}"><div class="pc-h"><i>${Pr.RARITY[c.rar]}</i><span>${esc(c.m)}</span></div>
   <div class="pc-pt"><span class="pa">${photo(c.m, 'pleased')}</span><div><div class="pc-g">${esc(c.white)} v ${esc(c.black)}</div><div class="pc-y">${esc(c.event)} ${esc(c.year)}</div></div></div>${boardSVG(c.fen, c.move)}</div>`;
}
export function collection(ctx, arg) {
  const { render, topbar } = ctx, all = [...Pr.allCards(), ...Pr.customCards()], got = new Set(Pr.collected()), masters = [...new Set(all.map(c => c.m))];
  const f = masters.includes(arg) ? arg : '', mine = all.filter(c => got.has(c.id) && (!f || c.m === f)).sort((a, b) => Pr.state().cards[b.id].t - Pr.state().cards[a.id].t);
  const tot = all.filter(c => !f || c.m === f).length, count = m => all.filter(c => got.has(c.id) && c.m === m).length;
  const cnt = { Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0 }; mine.forEach(c => cnt[Pr.RARITY[c.rar]]++);
  render(`${topbar}<a class="back" href="#masters">&larr; Crew</a><span class="k">Position cards</span><h1>Collection</h1>
   <p class="sub mt1">Solve a master puzzle to collect its card. Rarity is how few positions in the whole set share its pattern. ${got.size} of ${all.length} collected.</p>
   <div class="chips mt2"><a class="chip ${f ? '' : 'on'}" href="#collection">All ${got.size}</a>${masters.map(m => `<a class="chip ${f === m ? 'on' : ''}" href="#collection/${m}">${m} ${count(m)}</a>`).join('')}<a class="chip" href="#trophies">Trophies</a></div>
   <p class="sub sm mt1">${Object.entries(cnt).filter(e => e[1]).map(e => e[1] + ' ' + e[0]).join(' · ') || 'No cards yet.'}</p>
   <div class="cgrid" id="cg"></div><div class="row mt2"><button class="btn ghost" id="cmore" hidden>Show more</button></div>`);
  const g = document.getElementById('cg'), more = document.getElementById('cmore'); let n = 0;
  const add = () => { g.insertAdjacentHTML('beforeend', mine.slice(n, n + 48).map(c => cardHTML(c)).join('')); n += 48; more.hidden = n >= mine.length; };
  if (!mine.length) g.innerHTML = `<div class="pcard lock"><b>?</b><span>${tot - mine.length} positions waiting${f ? ' with ' + f : ''}. Solve a ${f || 'master'} puzzle.</span></div>`; else { add(); g.insertAdjacentHTML('beforeend', `<div class="pcard lock"><b>?</b><span>${tot - mine.length} to find</span></div>`); more.onclick = add; }
}

/* ---------- trophies ---------- */
const cup = (c, s = 1) => `<g transform="scale(${s})"><path d="M-17 -34h34v16q0 18-17 22q-17-4-17-22z" fill="${c}" stroke="#2f1c08" stroke-width="2.4"/><path d="M-17 -30q-14 0-14 10t15 12M17 -30q14 0 14 10t-15 12" fill="none" stroke="${c}" stroke-width="4"/><path d="M-4 4h8v12h-8zM-14 16h28v7h-28z" fill="${c}" stroke="#2f1c08" stroke-width="2.4"/><path d="M-9 -28v14" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></g>`;
const medal = (c, t) => `<g><path d="M-11 -34l7 22h8l7-22z" fill="#c23b2e" stroke="#2f1c08" stroke-width="2"/><circle cy="2" r="17" fill="${c}" stroke="#2f1c08" stroke-width="2.4"/><circle cy="2" r="11.5" fill="none" stroke="#fff" stroke-opacity=".5"/><text y="9" text-anchor="middle" font-family="Osw,Arial Narrow,sans-serif" font-weight="700" font-size="19" fill="#2f1c08">${t}</text></g>`;
const bottle = `<g><path d="M-30 -6q-6 8-6 18q0 12 12 12h72q12 0 12-12q0-10-6-18l-20-8v-14h-44v14z" transform="translate(0 -14) scale(.9)" fill="rgba(160,220,240,.25)" stroke="#bfe3f0" stroke-width="2.4"/><path d="M-26 8q10-5 20 0t20 0t20 0t20 0" fill="none" stroke="#6fb7d4" stroke-width="3" transform="translate(0 6)"/><path d="M0 -4V-28M-20 6h40l-6 7h-28z" fill="#e9dcb4" stroke="#2f1c08" stroke-width="2" transform="translate(0 4)"/><path d="M2 -26c8 4 10 12 10 20H2z" fill="#fff" stroke="#2f1c08" stroke-width="1.5" transform="translate(0 6)"/><rect x="-14" y="-52" width="28" height="12" rx="3" fill="#a8702f" stroke="#2f1c08" stroke-width="2" transform="translate(0 -4)"/></g>`;
export function trophyList() {
  const S = Pr.state(), cq = Pr.conqueredCount();
  const isl = Pr.ISLAND_IDS.map(id => ({ id, row: 0, name: Pr.BOSSES[id].who, ok: Pr.isConquered(id), draw: () => cup(CH[Pr.BOSSES[id].who].acc) }));
  return [...isl,
    { id: 's3', row: 1, name: '3-day streak', ok: S.streak.best >= 3, draw: () => medal('#cd7f32', '3') }, { id: 's7', row: 1, name: '7-day streak', ok: S.streak.best >= 7, draw: () => medal('#c0c8d0', '7') },
    { id: 's30', row: 1, name: '30-day streak', ok: S.streak.best >= 30, draw: () => medal('#ffd978', '30') }, { id: 'd7', row: 1, name: '7 daily voyages', ok: S.dailyDone >= 7, draw: () => medal('#6fb7d4', 'D') },
    { id: 'c25', row: 1, name: '25 cards', ok: Pr.collected().length >= 25, draw: () => medal('#a24fd0', 'C') },
    { id: 'rank', row: 2, name: 'Captain’s cup', ok: Pr.rankIdx() >= 6, draw: () => cup('#ffd978', 1.25) }, { id: 'bottle', row: 2, name: 'Voyage complete', ok: cq === Pr.ISLAND_IDS.length, draw: () => bottle }];
}
function shelfSVG() {
  const T = trophyList(), rows = [[], [], []]; T.forEach(t => rows[t.row].push(t));
  let s = '<defs><linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6428"/><stop offset="1" stop-color="#5a3513"/></linearGradient></defs><rect x="4" y="4" width="692" height="362" rx="14" fill="rgba(60,34,12,.35)" stroke="#5a3513" stroke-width="5"/>';
  rows.forEach((row, r) => {
    const y = 104 + r * 116; s += `<rect x="8" y="${y}" width="684" height="12" fill="url(#wd)"/><rect x="8" y="${y + 12}" width="684" height="5" fill="rgba(0,0,0,.35)"/>`;
    row.forEach((t, k) => { const x = 700 / (row.length + 1) * (k + 1); s += `<g transform="translate(${x} ${y - 6})" class="${t.ok ? '' : 'gh'}"><title>${esc(t.name)}${t.ok ? '' : ' (not yet)'}</title>${t.ok ? t.draw() : `<g style="filter:grayscale(1)">${t.draw()}</g>`}<text class="lb" y="30" text-anchor="middle" font-size="13" ${t.ok ? 'style="fill:var(--fg)"' : ''}>${esc(t.name)}</text></g>`; });
  });
  return `<svg viewBox="0 0 700 370" role="img" aria-label="Trophy cabinet, ${T.filter(t => t.ok).length} of ${T.length} earned">${s}</svg>`;
}
export function trophies(ctx) {
  const { render, topbar } = ctx, S = Pr.state(), n = Object.keys(S.ach).length;
  render(`${topbar}<a class="back" href="#masters">&larr; Crew</a><span class="k">Trophy cabinet</span><h1>Trophies</h1>
   <div class="panel mt2"><div class="pgrank">${briefRank()}</div></div>
   <div class="shelf mt2">${shelfSVG()}</div>
   <div class="row mt2"><a class="btn ghost" href="#collection">Position cards (${Pr.collected().length})</a></div>
   <h2 class="mt3">Achievements <span class="sub">${n} of ${Pr.ACH.length}</span></h2>
   <div class="agrid">${Pr.ACH.map(a => `<div class="ach ${S.ach[a.id] ? '' : 'lk'}"><span class="pa">${photo(a.who, S.ach[a.id] ? 'excited' : 'pleased')}</span><div><b>${esc(a.n)}</b><span>${esc(a.d)}${S.ach[a.id] ? ' · ' + new Date(S.ach[a.id]).toLocaleDateString() : ''}</span></div></div>`).join('')}</div>`);
}

/* ---------- briefing: rank + daily voyage ---------- */
function briefRank() {
  const r = Pr.rank(), s = Pr.streakNow();
  return `<div class="rk-ins">${insignia(r.i, 64)}</div>${sail(r.frac)}<div><span class="k">Rank</span><h3>${r.name}</h3><span class="sub sm">${r.next ? `${r.xp - r.base} of ${r.to - r.base} XP to ${r.next}` : 'Top rank reached'} · ${r.xp} XP total</span>
   <div class="row2"><span class="chip">${s} day streak</span><span class="chip">${Pr.collected().length} cards</span><span class="chip">${Pr.conqueredCount()} of 6 islands</span></div></div>`;
}
export function dailyHTML() {
  const d = Pr.daily(), c = Pr.chestCount(), st = d.stops;
  const stop = s => `<li class="${s.done ? 'done' : ''}"><a class="dot" href="${s.href}" style="--p:${Math.round(s.have / s.need * 100)}" aria-label="${s.label}, ${s.have} of ${s.need}${s.done ? ', done' : ''}"><span>${s.done ? '✓' : s.have + '/' + s.need}</span></a><span class="lb">${s.label}</span></li>`;
  const ch = d.chest ? (c ? 'rdy' : 'opn') : '';
  return `<span class="k">Daily voyage</span><h2>${d.done ? 'All four stops reached' : 'Four stops today'}</h2>
   <ol class="route">${st.map(stop).join('')}<li class="chd ${ch}"><button class="dot" id="dly-chest" style="--p:0" ${c ? '' : 'disabled'} aria-label="${c ? 'Open the chest' : d.chest ? 'Chest opened' : 'Chest, finish all four stops'}"><span>${chestIcon}</span></button><span class="lb">${c ? 'Open chest' : d.chest ? 'Opened' : 'Chest'}</span></li></ol>`;
}
export function briefHTML() {
  return `<div class="card wide" id="pg-rank"><div class="pgrank">${briefRank()}</div><div class="row mt1"><a class="btn ghost" href="#collection">Collection</a><a class="btn ghost" href="#trophies">Trophies</a><a class="btn ghost" href="#postcard">Voyage recap</a></div></div>
   <div class="card wide" id="pg-daily">${dailyHTML()}</div>`;
}
export function wireBrief(root) {
  const b = root.querySelector('#dly-chest'); if (b) b.onclick = () => openChestScene();
  Pr.on(t => { if (!root.isConnected) return; if (['dailyprog', 'daily', 'xp', 'chestopen', 'streak'].includes(t)) { const r = root.querySelector('#pg-rank .pgrank'), d = root.querySelector('#pg-daily'); if (r) r.innerHTML = briefRank(); if (d) { d.innerHTML = dailyHTML(); const bb = d.querySelector('#dly-chest'); if (bb) bb.onclick = () => openChestScene(); } } });
}
export const skipperBadge = () => `<span class="rbadge" style="position:absolute;right:-6px;bottom:30%;width:44px;height:44px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))">${insignia(Pr.rankIdx(), 44)}</span>`;

/* ---------- boss intro ---------- */
export function bossIntro(id) {
  const B = Pr.BOSSES[id], acc = (CH[B.who] || {}).acc || '#c23b2e';
  const o = overlay('pgo', `<div class="box" style="--ac:${acc}"><div class="boss" style="--ac:${acc}"><div class="bf">${figure(B.who, 'stand', 'excited', {})}</div><div><span class="tag">BOSS</span><h2>${esc(B.name)}</h2><p class="sub">${esc(B.title)}</p>
   <div class="hp" role="img" aria-label="Boss health: 5 positions">${'<i></i>'.repeat(5)}</div><p class="sub sm">5 hard positions · ${Pr.BOSS_CLOCK}s each · 2 lives. Each position you solve breaks a segment.</p><p class="hearts">♥ ♥</p></div></div>
   <div class="row"><button class="btn" id="bs-go">Fight</button><button class="btn ghost" id="bs-no">Not yet</button></div></div>`);
  play('drums'); const go = o.el.querySelector('#bs-go'); go.onclick = () => o.close(true); o.el.querySelector('#bs-no').onclick = () => o.close(false); go.focus();
  return o.p;
}
export const bossHud = (name, hp, lives) => `<div class="bhud"><b>Boss: ${esc(name)}</b><div class="hp" role="img" aria-label="Boss health ${hp} of 5">${Array.from({ length: 5 }, (_, k) => `<i class="${k < hp ? '' : 'x'}"></i>`).join('')}</div><span class="hearts" aria-label="${lives} lives">${'♥ '.repeat(lives)}${'♡ '.repeat(2 - lives)}</span></div>`;
export function bossResult(id, won) {
  const B = Pr.BOSSES[id];
  const o = overlay('pgo', `<div class="box"><span class="k">${won ? 'Island conquered' : 'Defeated'}</span><h2>${won ? esc(B.isle) : 'The tide turns'}</h2><div class="rk-fig" style="width:100px;height:230px">${figure(won ? 'Skipper' : B.who, won ? 'celebrate' : 'stand', won ? 'excited' : 'pleased')}</div>
   <p class="sub">${won ? 'Your flag is planted and a chest has washed aboard.' : esc(B.name) + ' holds the water for now. Practise and come back.'}</p><button class="btn" id="br-ok">${won ? 'To the chart' : 'Back to the chart'}</button></div>`);
  if (won) { play('brilliant'); if (full()) { confetti(2); wash(); } } else play('fail');
  o.el.querySelector('#br-ok').onclick = () => o.close(true); o.el.querySelector('#br-ok').focus(); return o.p;
}

/* ---------- Tempo's arrival ---------- */
let TL = null; const tempoLines = () => TL || (TL = fetch('data/characters.json').then(r => r.json()).then(j => j.characters.Tempo.lines.open).catch(() => ["Yo. Sit down, relax."]));
export async function tempoSequence(chartEl) {
  const wrap = chartEl.querySelector('.chartwrap') || chartEl; wrap.style.position = 'relative'; const lines = await tempoLines();
  const st = document.createElement('div'); st.className = 'storm'; st.setAttribute('aria-hidden', 'true');
  st.innerHTML = '<div class="dk"></div>' + [[-10, 4, -90], [30, 2, 90], [50, 30, -90], [-20, 46, 90], [24, 58, -90]].map(([x, y, d]) => `<div class="cl" style="left:${x}%;top:${y}%;transform:translateX(${d}%);opacity:0"></div>`).join('') + '<div class="rn"></div><div class="fl"></div>';
  wrap.appendChild(st); st.scrollIntoView({ block: 'center', behavior: full() ? 'smooth' : 'auto' });
  await wait(300); const full_ = full(); play('drums');
  st.querySelector('.dk').style.opacity = '.72'; st.querySelectorAll('.cl').forEach(c => { c.style.transform = 'none'; c.style.opacity = '.95'; }); st.classList.add('go'); st.querySelector('.rn').style.opacity = '1';
  await wait(full_ ? 2600 : 600);
  const o = overlay('tspot', `<div class="box"><span class="k">The final boss</span><div class="tf" style="width:140px;height:140px;margin:8px auto">${photo('Tempo', 'char')}</div><h2>Tempo</h2><q>${esc(lines[Math.floor(Math.random() * lines.length)])}</q><p class="sub sm">All six islands are yours. His rock rises from the sea.</p><button class="btn" id="tp-ok">Continue</button></div>`);
  buzz([30, 60, 30]); const ok = o.el.querySelector('#tp-ok'); ok.onclick = () => o.close(true); ok.focus(); await o.p;
  st.style.transition = 'opacity 1.2s'; st.style.opacity = '0'; await wait(1100); st.remove(); Pr.tempoSeen();
}

/* ---------- outfit reveal on the master page ---------- */
export function outfitReveal(root, name) {
  const seenKey = store.get('outfitseen', {}) || {}, now = outfitUnlocked(name).filter(Boolean).length, prev = seenKey[name] ?? 1;
  seenKey[name] = now; store.set('outfitseen', seenKey);
  if (now <= prev) return;
  const idx = outfitUnlocked(name).map((u, i) => u ? i : -1).filter(i => i >= prev); // newly unlocked outfit indices
  const b = root.querySelector('.ofit[data-i="' + idx[0] + '"]'); if (b && full()) { b.classList.add('spin'); play('success'); }
  later(() => toast({ k: 'Outfit unlocked', title: (OUTFITS[name][idx[0]] || {}).n || 'New outfit', line: 'Pick it below.', who: name }));
}
