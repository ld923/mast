// Crew voices: Web Speech API (speechSynthesis) with per-character voice picks, plus recorded clips (IndexedDB or bundled) for Skipper and Tempo.
import { isMuted } from './sound.js';
const KEY = 'mast.voiceMode';
export const EVENTS = ['open', 'solve', 'fail', 'blunder_when_winning', 'time_trouble', 'beat_master', 'lose'];
export const CLIP_WHO = ['Skipper', 'Tempo'];
const KEYCAT = new Set(['intro', 'boss', 'result', 'secret']);
export const getMode = () => { try { return localStorage.getItem(KEY) || 'key'; } catch (_) { return 'key'; } };
export const setMode = m => { try { localStorage.setItem(KEY, m); } catch (_) { } if (m === 'off') stop(); };
const lang = v => (v.lang || '').toLowerCase().replace('_', '-');
const L = (...p) => v => p.some(x => lang(v).startsWith(x));
/* who: voice preference groups (first group with a free voice wins), then prosody */
const PROFILE = {
  Morphy: { pref: [L('en-us')], rate: .88, pitch: 1.05, vol: .9 },
  Capablanca: { pref: [L('es'), L('en-gb')], rate: .9, pitch: .9 },
  Tal: { pref: [L('ru', 'lv', 'uk', 'pl', 'cs'), L('en-gb')], rate: 1.12, pitch: 1.05 },
  Kasparov: { pref: [L('en-gb', 'en-au', 'en-in'), L('en')], rate: 1.1, pitch: .7 },
  Carlsen: { pref: [L('nb', 'no', 'nn'), L('en-us', 'en-ie', 'en-za')], rate: 1, pitch: .92 },
  Leela: { pref: [L('en-au', 'en-us'), L('en')], rate: 1, pitch: 1.55 },
  Skipper: { pref: [L('en-gb', 'en-us'), L('en')], rate: .95, pitch: .85 },
  Tempo: { pref: [L('en-us', 'en-au'), L('en')], rate: 1.15, pitch: 1.12 }
};
let voices = [], map = null;
const load = () => { try { voices = speechSynthesis.getVoices() || []; } catch (_) { voices = []; } map = null; };
if ('speechSynthesis' in window) { load(); try { speechSynthesis.addEventListener('voiceschanged', load); } catch (_) { } }
/* deterministic assignment; each character gets a distinct voice when the list allows */
export function voiceMap() {
  if (map) return map; map = {}; const used = new Set();
  const NOV = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph)\b/;
  const pool = voices.filter(v => !NOV.test(v.name)).sort((a, b) => (b.localService - a.localService) || (a.name < b.name ? -1 : 1));
  for (const who of Object.keys(PROFILE)) {
    let pick = null;
    for (const f of PROFILE[who].pref) { const c = pool.filter(f); pick = c.find(v => !used.has(v.name)) || null; if (pick) break; }
    if (!pick) pick = pool.filter(v => lang(v).startsWith('en')).find(v => !used.has(v.name)) || pool.find(v => !used.has(v.name)) || pool.find(v => lang(v).startsWith('en')) || pool[0] || null;
    if (pick) used.add(pick.name); map[who] = pick;
  }
  return map;
}
export const describe = () => Object.fromEntries(Object.entries(voiceMap()).map(([k, v]) => [k, v ? `${v.name} (${v.lang})` : 'default']));

/* ---- clips: IndexedDB (this device) + bundled index ---- */
let dbp = null;
const db = () => dbp || (dbp = new Promise((res, rej) => { try { const r = indexedDB.open('mast-voices', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }));
const tx = async (mode, f) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('clips', mode), s = t.objectStore('clips'), r = f(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
export const saveClip = (who, ev, blob) => tx('readwrite', s => s.put({ who, ev, type: blob.type, blob, t: Date.now() }, `${who}/${ev}/${Date.now()}`));
export const delClip = key => tx('readwrite', s => s.delete(key));
export async function listClips() { try { const d = await db(); return await new Promise((res, rej) => { const out = [], r = d.transaction('clips').objectStore('clips').openCursor(); r.onsuccess = () => { const c = r.result; if (c) { out.push({ key: c.key, ...c.value }); c.continue(); } else res(out); }; r.onerror = () => rej(r.error); }); } catch (_) { return []; } }
let IDX = null; const bundled = () => IDX || (IDX = fetch('data/voices.json').then(r => r.ok ? r.json() : {}).catch(() => ({})));
let cache = null; // who/ev -> [url|blob]
export const clipsChanged = () => { cache = null; };
async function clipsFor(who, ev) {
  if (!CLIP_WHO.includes(who)) return [];
  if (!cache) { cache = {}; for (const c of await listClips()) (cache[c.who + '/' + c.ev] ||= []).push(c.blob); const ix = await bundled(); for (const w of Object.keys(ix || {})) for (const e of Object.keys(ix[w] || {})) for (const f of ix[w][e]) (cache[w + '/' + e] ||= []).push(`assets/voices/${w}/${f}`); }
  return cache[who + '/' + ev] || [];
}
let audio = null, url = null;
export function stop() { try { speechSynthesis.cancel(); } catch (_) { } if (audio) { try { audio.pause(); } catch (_) { } audio = null; } if (url) { URL.revokeObjectURL(url); url = null; } }
export function playBlob(src) { stop(); const u = typeof src === 'string' ? src : (url = URL.createObjectURL(src)); audio = new Audio(u); return audio.play().catch(() => { }); }
const trim = (t, n) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); if (!n) return s; const m = s.match(/[^.!?]+[.!?]+(\s|$)/g); return m ? m.slice(0, n).join('').trim() : s.slice(0, 220); };
function say(who, text, force) {
  if (!('speechSynthesis' in window) || !text) return false; stop();
  const P = PROFILE[who] || PROFILE.Skipper, v = voiceMap()[who], u = new SpeechSynthesisUtterance(text);
  if (v) { u.voice = v; u.lang = v.lang; } u.rate = P.rate; u.pitch = P.pitch; u.volume = P.vol || 1;
  try { speechSynthesis.speak(u); return true; } catch (_) { return false; }
}
/* speak(who, text, cat, {event, sentences}); cat: intro|boss|result|secret (key moments) or bubble|chat (All only) */
export async function speak(who, text, cat = 'bubble', { event, sentences = 0 } = {}) {
  try {
    const m = getMode(); if (m === 'off' || isMuted() || document.hidden) return false;
    if (m === 'key' && !KEYCAT.has(cat)) return false;
    if (event) { const cl = await clipsFor(who, event); if (cl.length) { await playBlob(cl[Math.floor(Math.random() * cl.length)]); return true; } }
    return say(who, trim(text, sentences));
  } catch (_) { return false; }
}
const nm = () => { try { return JSON.parse(localStorage.getItem('mast.user.name')) || 'Gerald'; } catch (e) { return 'Gerald'; } };
export const test = (who, line) => { stop(); return say(who, line || `Ahoy ${nm()}. This is ${who}, ready for the watch.`, true); };
addEventListener('hashchange', stop); addEventListener('pagehide', stop);
try { window.__mastVoices = describe; } catch (_) { }
