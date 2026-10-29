// Shared UI helpers: storage, theme, icons, avatars, states
import { blinkHTML } from './fx.js';
export const store = {
  get(k, d) { try { const v = localStorage.getItem('mast.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mast.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
};

export const getName = () => { const n = String(store.get('user.name', '') || '').trim(); if (n) return n; const u = String(store.get('sync.user', 'congreve274') || '').trim(); return u && u !== 'congreve274' ? u : 'Gerald'; };
export const setName = v => store.set('user.name', String(v || '').trim().slice(0, 30));

/* ---- theme: 'auto' | 'dark' | 'light' (sunset) ---- */
export const getTheme = () => { try { return localStorage.getItem('mast.theme') || 'auto'; } catch (e) { return 'auto'; } };
export function setTheme(t) {
  const r = document.documentElement;
  if (t === 'dark' || t === 'light') r.dataset.theme = t; else delete r.dataset.theme;
  try { t === 'auto' ? localStorage.removeItem('mast.theme') : localStorage.setItem('mast.theme', t); } catch (e) { }
  const dark = t === 'dark' || (t === 'auto' && !matchMedia('(prefers-color-scheme: light)').matches);
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#07111A' : '#F7EBCF';
}

/* ---- icons: fetch SVGs once, inline so they inherit currentColor ---- */
const ICONS = {};
export async function loadIcons(names) {
  await Promise.all(names.map(async n => {
    try { const t = await (await fetch(`assets/icons/${n}.svg`)).text(); ICONS[n] = t; } catch (e) { ICONS[n] = ''; }
  }));
}
export const icon = n => ICONS[n] || '';

/* ---- avatars: initials placeholder, upgraded to portraits.js when it exists ---- */
const INITIALS = { Tal: 'MT', Capablanca: 'JC', Morphy: 'PM', Carlsen: 'MC', Kasparov: 'GK', Leela: 'L0', Skipper: 'SK', Gerald: 'G' };
export const initials = n => INITIALS[n] || String(n).slice(0, 2).toUpperCase();
let P = null;
const portraits = () => P || (P = import('./photo.js').catch(() => null));
export const avatar = (name, ex = 'neutral', cls = '') =>
  `<span class="av ${cls}" data-av="${name}" data-ex="${ex}" aria-hidden="true">${initials(name)}</span>`;
export async function hydrate(root = document) {
  const els = [...root.querySelectorAll('[data-av]:not([data-done])')];
  if (!els.length) return;
  const m = await portraits(); if (!m || !m.photo) return;
  for (const el of els) {
    const ex = { neutral: 'pleased', happy: 'excited', sad: 'disappointed' }[el.dataset.ex] || el.dataset.ex;
    try { el.innerHTML = m.photo(el.dataset.av, ex); el.dataset.done = 1; } catch (e) { }
  }
}

/* ---- designed states: character + line ---- */
export function state({ who = 'Skipper', ex = 'neutral', title = '', line = '', loading = false, action = '', slot = false }) {
  return `<div class="state">${loading ? '<div class="spin" role="status" aria-label="Loading"></div>' : ''}
   ${slot ? `<div class="slot">${avatar(who, ex, 'xl')}</div>` : avatar(who, ex, 'lg')}
   ${title ? `<h2>${title}</h2>` : ''}<p class="line">${line}</p>${action}</div>`;
}
let TIPS = []; import('./data.js').then(m => m.loadJSON('data/tips.json')).then(t => { TIPS = t; }).catch(() => { });
const FALLBACK = { who: 'Skipper', tip: 'Steady as she goes. A decent move now beats a perfect one late.' };
export const loadingState = (line = 'Scanning the horizon… pulling your games.') => {
  const t = TIPS.length ? TIPS[Math.floor(Math.random() * TIPS.length)] : FALLBACK;
  return `<div class="state tipstate"><div class="spin" role="status" aria-label="Loading"></div>${avatar(t.who, 'thinking', 'lg')}<p class="line">${line}</p><p class="tip"><b>${t.who}:</b> ${t.tip.replace(/</g, '&lt;')}</p></div>`;
};
export const errorState = (line = 'Fog on the radio. The charts did not come through.') =>
  state({ who: 'Skipper', ex: 'worried', title: 'Lost signal', line, action: '<button class="btn" id="retry-load">Try again</button>' });

/* ---- one-time flags (intro cards etc.) ---- */
export const seen = k => !!(store.get('seen', {}) || {})[k];
export const markSeen = k => { const s = store.get('seen', {}) || {}; s[k] = 1; store.set('seen', s); };
