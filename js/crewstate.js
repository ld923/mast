import { photo } from './photo.js';
import { eraScene } from './era.js';
// Crew state: moods from Gerald's recent results per master, solved counts -> outfit unlocks, selected outfit, intro cards.
import { store, seen, markSeen } from './ui.js';
import { CH, OUTFITS } from './portraits.js';
import { figure, figCSS } from './figures.js';
import { getAnim } from './fx.js';
import { swapOutfit as SXo } from './secrets.js';

const MASTERS = ['Morphy', 'Kasparov', 'Capablanca', 'Tal', 'Carlsen'];
const OK = new Set(['solve', 'sacrifice']), BAD = new Set(['fail', 'missed_mate', 'blunder_when_winning']);
/* record a result for the advisor of this position (called from Crew.react) */
export function recordCrew(adv, event) {
  const ok = OK.has(event) ? 1 : BAD.has(event) ? 0 : null; if (ok == null || !adv) return;
  const r = store.get('crewres', {}) || {}; r[adv] = [...(r[adv] || []), ok].slice(-10); store.set('crewres', r);
  if (ok) { const c = store.get('crewsolved', {}) || {}; c[adv] = (c[adv] || 0) + 1; c._all = (c._all || 0) + 1; store.set('crewsolved', c); }
}
export function mood(n) {
  const a = (store.get('crewres', {}) || {})[n] || []; if (a.length < 4) return 'neutral';
  const p = a.reduce((s, x) => s + x, 0) / a.length; return p >= .7 ? 'pleased' : p < .4 ? 'disappointed' : 'neutral';
}
export const moodEx = n => ({ pleased: 'excited', neutral: 'pleased', disappointed: 'disappointed' })[mood(n)];
/* unlocks: masters by drills solved with them advising; Skipper/Tempo/Leela by all drills solved */
export const TH = n => MASTERS.includes(n) ? [0, 10, 30] : [0, 25, 75];
export const solvedFor = n => { const c = store.get('crewsolved', {}) || {}; return (MASTERS.includes(n) ? c[n] : c._all) || 0; };
export const unlocked = n => TH(n).map(t => solvedFor(n) >= t);
export const outfitOf = n => { const sw = SXo(n); if (sw != null) return sw; const i = (store.get('outfit', {}) || {})[n] | 0; return unlocked(n)[i] ? i : 0; };
export function setOutfit(n, i) { if (!unlocked(n)[i]) return false; const o = store.get('outfit', {}) || {}; o[n] = i; store.set('outfit', o); return true; }
export function outfitPicker(n) {
  const u = unlocked(n), cur = outfitOf(n), th = TH(n), who = MASTERS.includes(n) ? `with ${n} advising` : 'in total';
  return `<div class="outfits" role="radiogroup" aria-label="Outfits">${OUTFITS[n].map((o, i) => `<button class="ofit${i === cur ? ' on' : ''}${u[i] ? '' : ' lock'}" data-i="${i}" role="radio" aria-checked="${i === cur}" ${u[i] ? '' : 'aria-disabled="true"'}>
   <span class="ofig">${figure(n, 'stand', 'pleased', { outfit: i })}</span><b>${o.n}</b><span class="sub sm">${u[i] ? (i === cur ? 'Wearing' : 'Wear') : `Locked: solve ${th[i]} drills ${who} (${solvedFor(n)}/${th[i]})`}</span></button>`).join('')}</div>`;
}
const ERA = { Skipper: 'Now, at the helm', Tempo: 'Waiting at the end of the voyage', Tal: 'Riga, 1960', Capablanca: 'Havana, 1921', Morphy: 'New Orleans, 1858', Carlsen: 'The 2010s', Kasparov: 'Moscow, 1985', Leela: 'The neural era, 2018' };
/* cinematic intro, once per character. Resolves when dismissed. */
export const introUp = () => !!document.querySelector('.intro:not(.out)');
export function introOnce(n) {
  if (!CH[n] || seen('intro.' + n)) return Promise.resolve(false);
  markSeen('intro.' + n); figCSS();
  const c = CH[n], el = document.createElement('div');
  el.className = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', c.nick); el.tabIndex = -1;
  el.style.setProperty('--ac', c.acc);
  el.innerHTML = `<div class="ic"><div class="ifig iph era-${n.toLowerCase()}">${eraScene(n)}<span class="iphm">${photo(n, n === 'Tempo' || n === 'Skipper' ? 'char' : 'pleased')}</span></div><div class="itx"><span class="k">${ERA[n] || ''}</span><h2>${c.nick}</h2><p class="sub">${n === 'Tempo' ? c.insp : n === 'Skipper' ? c.insp : 'Inspired by ' + c.insp}</p><p class="iq">“${c.tag}”</p><span class="sub sm">Tap to continue</span></div></div>`;
  document.body.appendChild(el); el.focus({ preventScroll: true }); document.dispatchEvent(new CustomEvent('mast:intro', { detail: 'open' }));
  return new Promise(res => {
    const close = () => { if (!el.isConnected) return; el.classList.add('out'); document.dispatchEvent(new CustomEvent('mast:intro', { detail: 'close' })); setTimeout(() => el.remove(), getAnim() === 'off' ? 0 : 300); res(true); };
    el.addEventListener('click', close); el.addEventListener('keydown', close); setTimeout(close, 3000);
  });
}
