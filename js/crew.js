// Live crew panel: Skipper (player) + advisors. The phase advisor leans in; events change expressions and show a speech bubble.
// new Crew(el, linesJson).setAdvisor(name); .react(event, {who, ex, vars}); .silent(name, ex, ms); .think(on)
import { CH } from './portraits.js';
import { bond } from './social.js';
import { openChat, hasKey } from './chat.js';
import { photo } from './photo.js';
import { blinkHTML, celebrate, getAnim } from './fx.js';
import { figure, figCSS } from './figures.js';
import { insignia } from './prog-ui.js';
import { rankIdx } from './progress.js';
import { bubbleHook as SXb } from './secrets.js';
import { speak } from './voice.js';
import { recordCrew, moodEx, outfitOf, introOnce } from './crewstate.js';
let CHAT = null; const chatter = () => CHAT || (CHAT = fetch('data/characters.json').then(r => r.json()).then(j => j.chatter || []).catch(() => []));
const ORDER = ['Skipper', 'Morphy', 'Kasparov', 'Capablanca', 'Tal', 'Carlsen', 'Leela', 'Tempo'];
const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const CSS = `
.crew{position:relative;margin-top:var(--s2);padding:var(--s2);border-radius:var(--r-lg);background:var(--glass);border:1px solid var(--glass-b)}
.crew .faces{display:flex;align-items:flex-end;gap:10px;min-height:92px}
.crew .f{position:relative;flex:none;width:52px;height:52px;border-radius:50%;border:2px solid var(--glass-b);opacity:.75;transform-origin:50% 100%;transition:transform .35s var(--ease),opacity .3s,border-color .3s,box-shadow .3s}
.crew .f.me{margin-right:auto;opacity:1;border-color:var(--ac)}
.crew .f.adv{width:84px;height:84px;opacity:1;border-color:var(--ac);box-shadow:0 0 0 3px color-mix(in srgb,var(--ac) 35%,transparent),0 0 22px color-mix(in srgb,var(--ac) 50%,transparent);transform:scale(1.06)}
.crew .f.act{opacity:1;border-color:var(--ac)}
.crew .f.tempo{display:none}.crew .f.tempo.act{display:block;animation:drum .22s ease-in-out 8}
@keyframes drum{50%{transform:translateY(-4px) rotate(-4deg)}}
.crew .bub{margin-top:var(--s1);min-height:62px;padding:10px 14px;border-radius:var(--r-md);background:var(--glass-h);border:1px solid var(--glass-b);border-left:3px solid var(--ac);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:.0;transform:translateY(4px);transition:opacity .25s,transform .25s}
.crew .bub.on{opacity:1;transform:none}
.crew .bub .kk{display:block;font:700 12px var(--f-disp);letter-spacing:.2em;text-transform:uppercase;color:var(--ac);margin-bottom:2px}
.crew .bub p{margin:0;color:var(--fg);font-size:14px;line-height:1.35}
.crew .stg{position:absolute;right:10px;top:6px;width:62px;height:142px;pointer-events:none}
.crew .stg .fw{position:absolute;inset:0;transition:transform .4s var(--ease),opacity .4s}.crew .stg svg{width:100%;height:100%}
.crew .stg .fw.in{transform:translateX(-60px);opacity:0}.crew .stg .fw.out{transform:translateX(50px);opacity:0}
.crew .faces{padding-right:72px;min-height:136px}
.crew .chat{position:absolute;left:var(--s2);right:84px;top:var(--s2);min-height:84px;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:6px 10px;border-radius:var(--r-md);background:var(--glass-h);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;pointer-events:none;transition:opacity .3s;z-index:3}
.crew .chat.on{opacity:1}.crew .chat p{margin:0;font-size:13px;line-height:1.3;opacity:.35;transition:opacity .3s}.crew .chat p.on{opacity:1}.crew .chat b{font:700 11px var(--f-disp);letter-spacing:.14em;text-transform:uppercase;margin-right:6px}
.crew .f.walk{animation:wkin .4s var(--ease)}@keyframes wkin{from{transform:translateX(-40px);opacity:0}}
@media(max-width:820px),(max-height:880px){.crew .stg{display:none}.crew .faces{padding-right:0}.crew .chat{left:4px;right:4px;top:2px;bottom:2px;min-height:0}
.crew{margin-top:6px;padding:6px 8px;border-radius:var(--r-md)}.crew .f{width:44px;height:44px}.crew .f.adv{width:54px;height:54px}.crew .faces{min-height:0;gap:8px;align-items:center}
 .crew .f:not(.me):not(.adv):not(.act):not([data-n=Leela]){display:none}
 .crew .bub{position:absolute;left:0;right:0;bottom:calc(100% + 6px);margin:0;min-height:0;padding:8px 12px;pointer-events:none;z-index:8}.crew .bub p{font-size:13px}}
@media(prefers-reduced-motion:reduce){.crew .f,.crew .bub{transition:none}.crew .f.tempo.act{animation:none}.crew .f.adv{transform:none}}`;
const ex2 = e => ({ neutral: 'pleased', happy: 'pleased' }[e] || e);

export const advisorFor = ({ mode, phase, themes = [] } = {}) =>
  mode === 'convert' ? 'Carlsen'
    : themes.some(t => t === 'sacrifice' || String(t).startsWith('mate')) ? 'Tal'
      : { opening: 'Morphy', middlegame: 'Kasparov', endgame: 'Capablanca' }[phase] || 'Kasparov';
export const fmtEval = n => (Math.abs(n) / 100).toFixed(1);

export class Crew {
  constructor(el, lines) {
    if (!document.getElementById('mast-crew-css')) { const s = document.createElement('style'); s.id = 'mast-crew-css'; s.textContent = CSS; document.head.appendChild(s); }
    this.el = el; this.lines = lines || {}; this.adv = null; this.timers = {}; this.bt = 0;
    el.classList.add('crew');
    el.innerHTML = `<div class="faces">${ORDER.map(n => `<div class="f ${n === 'Skipper' ? 'me' : n === 'Tempo' ? 'tempo' : ''}" data-n="${n}" style="--ac:${CH[n].acc}" title="${n}"><div class="pv"></div><div class="ov"></div></div>`).join('')}</div><div class="bub" role="status" aria-live="polite"></div>`;
    this.f = {}; el.querySelectorAll('.f').forEach(f => { this.f[f.dataset.n] = f; this._paint(f.dataset.n, moodEx(f.dataset.n)); });
    const me = el.querySelector('.f.me'); if (me) me.insertAdjacentHTML('beforeend', `<span class="rkb" aria-hidden="true" style="position:absolute;right:-7px;bottom:-5px;width:22px;height:22px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))">${insignia(rankIdx(), 22)}</span>`);
    this.bub = el.querySelector('.bub'); figCSS();
    this.stg = document.createElement('div'); this.stg.className = 'stg'; this.stg.setAttribute('aria-hidden', 'true'); el.appendChild(this.stg);
    this.chat = document.createElement('div'); this.chat.className = 'chat'; this.chat.setAttribute('aria-live', 'polite'); el.appendChild(this.chat);
    this.ct = 0; this.chatOn = false; this.board = null;
    if (hasKey()) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost sm crew-ask'; b.style.cssText = 'position:absolute;right:8px;bottom:6px;z-index:4;font-size:12px;padding:4px 10px'; b.textContent = 'Ask about this position'; b.onclick = () => { const n = this.adv || 'Skipper'; openChat(n, { fen: this.board && this.board.fen, note: 'from a training position' }); }; el.appendChild(b); this.askBtn = b; }
  }
  _paint(n, ex) { this.f[n].querySelector('.pv').innerHTML = photo(n, ex2(ex)); this.f[n].dataset.ex = ex; }
  cheer(n, o) {
    celebrate(this.f[n], n, o);
    if (n === this.adv && getAnim() === 'full' && this.stg.firstChild) { const w = this.stg.lastChild; w.innerHTML = figure(n, 'celebrate', 'excited', { outfit: outfitOf(n) }); clearTimeout(this.cel); this.cel = setTimeout(() => { if (w.isConnected) w.innerHTML = figure(n, 'stand', moodEx(n), { outfit: outfitOf(n) }); }, 1600); }
  }
  setAdvisor(n) {
    if (this.adv && this.f[this.adv]) this.f[this.adv].classList.remove('adv');
    const prev = this.adv; this.adv = n; if (this.f[n]) this.f[n].classList.add('adv');
    if (this.askBtn) this.askBtn.textContent = `Ask ${n} about this position`;
    if (prev === n) return;
    introOnce(n);
    const a = getAnim(), anim = a !== 'off' && !RM() && prev;
    this.stg.querySelectorAll('.fw').forEach(w => { if (anim) { w.classList.add('out'); setTimeout(() => w.remove(), 420); } else w.remove(); });
    const w = document.createElement('div'); w.className = 'fw' + (anim ? ' in' : '');
    w.innerHTML = figure(n, anim && a === 'full' ? 'walk' : 'stand', moodEx(n), { outfit: outfitOf(n) }); this.stg.appendChild(w);
    if (anim) { requestAnimationFrame(() => requestAnimationFrame(() => w.classList.remove('in'))); setTimeout(() => { if (w.isConnected) w.innerHTML = figure(n, 'stand', moodEx(n), { outfit: outfitOf(n) }); }, 420);
      const f = this.f[n]; if (f) { f.classList.remove('walk'); void f.offsetWidth; f.classList.add('walk'); } }
  }
  /* change a face for a while (ms; 0 = hold) */
  silent(n, ex, ms = 2500) {
    const f = this.f[n]; if (!f) return; this._paint(n, ex); f.classList.add('act');
    clearTimeout(this.timers[n]);
    if (ms) this.timers[n] = setTimeout(() => this.rest(n), ms);
  }
  rest(n) { const f = this.f[n]; if (!f) return; f.classList.remove('act'); this._paint(n, moodEx(n)); }
  think(on) { if (on) this.silent('Leela', 'thinking', 0); else this.rest('Leela'); this.chatOn = !!on; if (on) this._sched(); else clearTimeout(this.ct); }
  /* chatter: while the clock runs, every 20-40s two crew exchange a pair of lines (inside the panel, never over the board) */
  _sched() { clearTimeout(this.ct); this.ct = setTimeout(() => this._chat(), 20000 + Math.random() * 20000); }
  async _chat(force) {
    if (!this.el.isConnected || (!this.chatOn && !force)) return;
    const list = await chatter();
    if (list.length && !this.bub.classList.contains('on') && !this.chat.classList.contains('on')) {
      const [a, la, b, lb] = list[Math.floor(Math.random() * list.length)];
      const ln = (w, t) => `<p><b style="color:${(CH[w] || {}).acc}">${(CH[w] || {}).nick || w}</b><span></span></p>`;
      this.chat.innerHTML = ln(a) + ln(b); const ps = this.chat.querySelectorAll('p'); ps[0].lastChild.textContent = la; ps[1].lastChild.textContent = lb;
      this.chat.classList.add('on'); ps[0].classList.add('on');
      this.ct2 = setTimeout(() => { ps[0].classList.remove('on'); ps[1].classList.add('on'); this.ct2 = setTimeout(() => this.chat.classList.remove('on'), 3400); }, 3200);
    }
    if (this.chatOn) this._sched();
  }
  /* two masters argue; the verdict lands when the position is solved (react 'solve') */
  disagree(dg) {
    if (!this.el.isConnected || !dg) return; this.dg = dg;
    const ln = w => `<p><b style="color:${(CH[w] || {}).acc}">${w}</b><span></span></p>`;
    this.chat.innerHTML = ln(dg.a) + ln(dg.b); const ps = this.chat.querySelectorAll('p'); ps[0].lastChild.textContent = dg.la; ps[1].lastChild.textContent = dg.lb;
    this.chat.classList.add('on'); ps[0].classList.add('on'); this.silent(dg.a, 'excited', 3000);
    clearTimeout(this.ct2); this.ct2 = setTimeout(() => { ps[0].classList.remove('on'); ps[1].classList.add('on'); this.silent(dg.b, 'thinking', 3000); this.ct2 = setTimeout(() => this.chat.classList.remove('on'), 3400); }, 3000);
  }
  line(who, event, vars = {}) {
    const bank = (this.lines[who] && this.lines[who].lines) || {}, arr = bank[event] || bank.fail || [];
    if (!arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)].replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  }
  /* event: speaker changes expression and says a line; bubble auto-dismisses after 4s */
  react(event, { who = this.adv, ex = 'pleased', vars = {}, line } = {}) {
    if (!who || !this.f[who]) return;
    recordCrew(this.adv, event); if (event === "solve" && this.adv) bond(this.adv, 1); if (this.chat.classList.contains('on')) { clearTimeout(this.ct2); this.chat.classList.remove('on'); }
    let txt = line || this.line(who, event, vars); ({ who, txt } = SXb(who, txt)); if (!this.f[who]) return; this.silent(who, ex, 4200);
    if (this.dg && (event === 'solve' || event === 'fail')) { const d = this.dg; this.dg = null; if (event === 'solve') { this.silent(d.winner, 'pleased', 5000); this.silent(d.loser, 'disappointed', 5000); txt = `${txt} (Engine verdict: ${d.winner} was right, ${d.loser} was not.)`; } }
    if (!txt) return;
    speak(who, txt, 'bubble', { event });
    this.bub.style.setProperty('--ac', CH[who].acc);
    this.bub.innerHTML = `<span class="kk">${CH[who].nick}</span><p></p>`; this.bub.querySelector('p').textContent = txt;
    requestAnimationFrame(() => this.bub.classList.add('on'));
    clearTimeout(this.bt); this.bt = setTimeout(() => this.bub.classList.remove('on'), 4000);
  }
  destroy() { Object.values(this.timers).forEach(clearTimeout); clearTimeout(this.bt); clearTimeout(this.ct); clearTimeout(this.ct2); clearTimeout(this.cel); this.chatOn = false; }
}
