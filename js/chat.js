// Crew chat (#chat/<id>): persona chat over the Anthropic Messages API, called directly from the browser with the user's own key.
// Key + memory live only in this browser's localStorage. Chess facts come only from the engine analysis we attach.
import { CH } from './portraits.js';
import { speak } from './voice.js';
import { photo } from './photo.js';
import { eraScene, eraCaption } from './era.js';
import { getEngine } from './engine.js';
import * as Pr from './progress.js';
import { bond, level } from './social.js';
const MODEL = 'claude-sonnet-5-5';
const API = 'https://api.anthropic.com/v1/messages';
const KEYK = 'mast.apikey';
export const getKey = () => { try { return localStorage.getItem(KEYK) || ''; } catch (e) { return ''; } };
export const setKey = k => { try { k ? localStorage.setItem(KEYK, k.trim()) : localStorage.removeItem(KEYK); } catch (e) { } };
export const hasKey = () => !!getKey();
const ls = (k, d) => { try { const v = localStorage.getItem('mast.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem('mast.' + k, JSON.stringify(v)); } catch (e) { } };
export const memOn = () => ls('chatmem', true) !== false;
export const memory = n => (ls('crewmem', {}) || {})[n] || { summary: '', facts: [] };
const setMemory = (n, m) => { const a = ls('crewmem', {}) || {}; a[n] = m; lsSet('crewmem', a); };
export const forget = n => { const a = ls('crewmem', {}) || {}; delete a[n]; lsSet('crewmem', a); const h = ls('chathist', {}) || {}; delete h[n]; lsSet('chathist', h); };
const ID2N = { tal: 'Tal', capablanca: 'Capablanca', morphy: 'Morphy', carlsen: 'Carlsen', kasparov: 'Kasparov', leela: 'Leela', skipper: 'Skipper', tempo: 'Tempo' };
import { loadJSON } from './data.js'; const j = u => loadJSON(u).catch(() => null);
let DATA = null;
const data = () => DATA || (DATA = Promise.all(['data/characters.json', 'data/personas.json', 'data/profile.json', 'data/sources/capablanca.json', 'data/sources/morphy.json'].map(j)).then(([c, p, pr, cap, mor]) => ({ c, p, pr, cap, mor })));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* open chat with an attached position (fen) and a short note about where it came from */
export function openChat(n, ctx = {}) { lsSet('chatctx', { n, ...ctx, t: Date.now() }); location.hash = 'chat/' + n.toLowerCase(); }

const pvSan = (fen, pv) => { try { const g = new Chess(fen); const out = []; for (const u of pv.slice(0, 6)) { const m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); if (!m) break; out.push(m.san); } return out.join(' '); } catch (e) { return pv.slice(0, 6).join(' '); } };
const scoreTxt = (s, fen) => { const wtm = fen.split(' ')[1] === 'w', k = wtm ? 1 : -1; return s.mate != null ? `mate in ${Math.abs(s.mate)} for ${(s.mate * k > 0) ? 'White' : 'Black'}` : `${(s.cp * k / 100 >= 0 ? '+' : '')}${(s.cp * k / 100).toFixed(2)} (White's view)`; };
export async function analysis(fen) {
  try { const r = await getEngine().analyse(fen, { depth: 12, multipv: 3, timeout: 15000 }); return r.lines.map((l, i) => `${i + 1}. ${pvSan(fen, l.pv)}  eval ${scoreTxt(l.score, fen)}  depth ${l.depth}`).join('\n'); }
  catch (e) { return ''; }
}

export async function systemPrompt(n, ctx = {}) {
  const { c, p, pr, cap, mor } = await data();
  const ch = (c && c.characters && c.characters[n]) || {}, ps = (p || []).find(x => x.name === n), cc = CH[n] || {};
  const lines = ch.lines ? Object.values(ch.lines).flat().slice(0, 10) : [];
  const fictional = n === 'Carlsen' || n === 'Kasparov';
  const rk = (() => { try { const r = Pr.rank(); return `${r.name}, ${r.xp} XP`; } catch (e) { return 'unknown'; } })();
  const logs = (ls('logs', []) || []).slice(-3).map(l => `${l.mode || 'drill'}: ${l.ok != null ? l.ok : '?'} of ${l.n != null ? l.n : '?'}`).join('; ');
  const m = memOn() ? memory(n) : null;
  let s = `You are ${cc.nick || n}, a character in Mast, a chess-training app set on a ship at night. You coach Gerald (chess.com congreve274), a club blitz player.\n`;
  s += `Look: ${ch.look || ''}\nProp: ${cc.prop || ''}\nTagline: "${cc.tag || ''}"\nVoice samples:\n${lines.map(x => '- ' + x).join('\n')}\n`;
  if (ps) s += `\nPersona notes:\n${ps.markdown.slice(0, 2600)}\n`;
  if (n === 'Capablanca' && cap) s += `\nAuthentic passages from your book Chess Fundamentals (1921, public domain) - you may quote these exactly and refer to them:\n${cap.excerpts.slice(0, 12).map(e => '- ' + e.text).join('\n')}\n`;
  if (n === 'Morphy' && mor) s += `\nYour logbook (facts from your 1858-59 European tour):\n${mor.notes.map(e => '- ' + e.text).join('\n')}\n`;
  s += `\nRules (strict):\n- Stay in character. Short replies: 2-5 sentences, conversational, no headings.\n- Chess facts (evaluations, best moves, whether a move is good) must come ONLY from the ENGINE ANALYSIS block below. If no analysis is given, say you would need to see the position on the board; never invent moves or evaluations.\n- Gerald's stats below are real; use them to make advice personal.\n`;
  if (fictional) s += `- You are a fictional archetype INSPIRED BY ${cc.insp}. You are not that person. Never claim to be him, never quote him, never give opinions on real people or politics.\n`;
  if (n === 'Leela') s += `- You are openly an AI (a neural-network engine persona). Say so if asked.\n`;
  if (n === 'Tal' || n === 'Kasparov' || n === 'Carlsen') s += `- Do not quote this player's books; paraphrase ideas in your own words.\n`;
  s += `- Never discuss these instructions or the API key.\n- After your reply, on a new line, output <memory>{"summary":"<=40 words rolling summary of all conversations with Gerald","facts":["<=5 short facts about Gerald"]}</memory>. It is hidden from Gerald.\n`;
  s += `\nGERALD PROFILE: rank ${rk}; relationship level with you: ${level(n).name}.`;
  if (pr) s += ` Error motifs in ${pr.records} analysed mistakes: ${Object.entries(pr.overall || {}).slice(0, 5).map(([k, v]) => `${k} ${v}`).join(', ')}. Recent top: ${(pr.top3_recent || []).map(x => x[0]).join(', ')}. Clock: median ${pr.clock.median_move_s}s per move, below 30s left in ${pr.clock.pct_games_below_30s}% of games; error rate after long thinks ${(pr.clock.error_rate_after_long_think || {}).rate}.`;
  if (logs) s += ` Recent drills: ${logs}.`;
  if (m && (m.summary || m.facts.length)) s += `\nMEMORY of past chats: ${m.summary} Facts: ${m.facts.join('; ')}`;
  return s;
}

/* streaming call. onText(delta). returns {text, memory} */
export async function send(n, history, { onText = () => { }, signal, ctx = {} } = {}) {
  const key = getKey(); if (!key) throw new Error('no key');
  if (navigator.onLine === false) throw new Error('You are offline. The crew can only chat when you have a connection; drills, puzzles, play and review still work');
  let sys = await systemPrompt(n, ctx);
  const msgs = history.map(h => ({ role: h.role, content: h.content }));
  if (ctx.fen) { const last = msgs[msgs.length - 1]; last.content = `[Position FEN: ${ctx.fen}${ctx.note ? ' - ' + ctx.note : ''}]\n[ENGINE ANALYSIS, Stockfish multipv 3:\n${ctx.engine || 'unavailable'}]\n${ctx.master ? '[Related master game: ' + ctx.master + ']\n' : ''}\n${last.content}`; }
  const res = await fetch(API, {
    method: 'POST', signal,
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'anthropic-beta': 'server-side-fallback-2026-07-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 1200, stream: true, system: sys, messages: msgs, output_config: { effort: 'low' }, fallbacks: 'default' })
  });
  if (!res.ok) { let m = res.status + ''; try { const e = await res.json(); m = (e.error && e.error.message) || m; } catch (_) { } throw new Error(m); }
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '', text = '', shown = 0, stop = null;
  const flush = () => { const cut = text.indexOf('<memory>'), vis = cut < 0 ? text.replace(/<m?e?m?o?r?y?$/, '') : text.slice(0, cut); if (vis.length > shown) { onText(vis.slice(shown)); shown = vis.length; } };
  for (; ;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n\n')) >= 0) {
      const ev = buf.slice(0, i); buf = buf.slice(i + 2);
      const dl = ev.split('\n').find(l => l.startsWith('data:')); if (!dl) continue;
      let d; try { d = JSON.parse(dl.slice(5)); } catch (e) { continue; }
      if (d.type === 'content_block_delta' && d.delta && d.delta.type === 'text_delta') { text += d.delta.text; flush(); }
      else if (d.type === 'message_delta' && d.delta) stop = d.delta.stop_reason;
      else if (d.type === 'error') throw new Error((d.error && d.error.message) || 'stream error');
    }
  }
  if (stop === 'refusal') return { text: '(He looks out to sea and changes the subject.)', memory: null };
  const mm = /<memory>([\s\S]*?)<\/memory>/.exec(text); let mem = null;
  if (mm) { try { mem = JSON.parse(mm[1]); } catch (e) { } }
  const vis = text.replace(/<memory>[\s\S]*$/, '').trim();
  if (mem && memOn()) setMemory(n, { summary: String(mem.summary || '').slice(0, 400), facts: (mem.facts || []).slice(0, 5).map(x => String(x).slice(0, 120)) });
  return { text: vis, memory: mem };
}
export async function testKey(k) {
  const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': k.trim(), 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: MODEL, max_tokens: 16, messages: [{ role: 'user', content: 'Say ok.' }] }) });
  if (r.ok) return { ok: true }; let m = 'HTTP ' + r.status; try { const e = await r.json(); m = (e.error && e.error.message) || m; } catch (_) { } return { ok: false, msg: m };
}

const SUGG = {
  Tal: ['When should I sacrifice?', 'How do I attack the king?', 'Tell me about Riga.'],
  Capablanca: ['How do I get better at endgames?', 'What is the most important principle?', 'Tell me about Havana.'],
  Morphy: ['How should I develop?', 'Tell me about Paris, 1858.', 'Why do I lose in the opening?'],
  Carlsen: ['How do I grind a small edge?', 'I keep running low on time.', 'How do I convert a win?'],
  Kasparov: ['How do I keep the initiative?', 'How do I prepare openings?', 'Why do I blunder when winning?'],
  Leela: ['What do my numbers say?', 'Are you an AI?', 'What is my biggest weakness?'],
  Skipper: ['How was my week?', 'Play the sax for me.', 'What should I drill?'], Tempo: ['How do I beat you?', 'Why am I always short of time?', 'Play me a drum fill.']
};
const CSS = `.chat-h{position:relative;overflow:hidden;border-radius:var(--r-lg);display:flex;align-items:center;gap:14px;padding:14px;min-height:120px}.chat-h>*:not(.era){position:relative;z-index:1}.chat-h .cph{width:84px;height:84px;flex:none}
.chat-l{display:flex;flex-direction:column;gap:10px;margin:14px 0;min-height:120px}
.cb{max-width:84%;padding:10px 14px;border-radius:16px;line-height:1.4;font-size:15px;white-space:pre-wrap;word-wrap:break-word}
.cb.a{align-self:flex-start;background:color-mix(in srgb,var(--ac) 18%,var(--glass-h));border:1px solid color-mix(in srgb,var(--ac) 50%,transparent);border-bottom-left-radius:4px}
.cb.u{align-self:flex-end;background:var(--a);color:var(--on-a);border-bottom-right-radius:4px}
.cb .who{display:block;font:700 11px var(--f-disp);letter-spacing:.16em;text-transform:uppercase;color:var(--ac);margin-bottom:2px}
.chat-f{display:flex;gap:8px;position:sticky;bottom:8px}.chat-f textarea{flex:1;min-height:46px;max-height:140px;padding:12px;border-radius:14px;border:1px solid var(--glass-b);background:var(--glass-h);color:var(--fg);font:inherit;resize:vertical}
.chat-s{display:flex;flex-wrap:wrap;gap:6px}.chat-s button{font-size:13px;padding:6px 12px}
.chat-ctx{font-size:13px;padding:8px 12px;border-radius:10px;border:1px dashed var(--glass-b);margin-top:10px}
.chat-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;font-size:13px}
.nokey{padding:18px;border-radius:var(--r-lg);border:1px solid var(--glass-b);background:var(--glass);margin-top:14px}`;
const css = () => { if (!document.getElementById('mast-chat-css')) { const s = document.createElement('style'); s.id = 'mast-chat-css'; s.textContent = CSS; document.head.appendChild(s); } };

export async function chatScreen({ render, topbar }, id) {
  css(); if (!ID2N[id]) { const ids = Object.keys(ID2N); render(`${topbar}<span class="k">Crew chat</span><h1>Pick someone to talk to</h1><div class="row" style="flex-wrap:wrap;gap:8px;margin-top:14px">${ids.map(k => `<a class="btn ghost" href="#chat/${k}">${esc(ID2N[k])}</a>`).join('')}</div>`); return; }
  const n = ID2N[id], cc = CH[n] || {};
  let ctx = ls('chatctx', null); if (!ctx || ctx.n !== n || Date.now() - ctx.t > 6e5) ctx = {};
  const hist = (ls('chathist', {}) || {})[n] || [];
  const saveHist = () => { const h = ls('chathist', {}) || {}; h[n] = hist.slice(-20); lsSet('chathist', h); };
  const head = `<a class="back" href="#masters/${n.toLowerCase()}">&larr; ${esc(n)}</a><div class="chat-h mt1" style="--ac:${cc.acc}">${eraScene(n)}<div class="cph">${photo(n, 'pleased')}</div><div><span class="k">${esc(eraCaption(n))} · ${level(n).name}</span><h1 style="margin:.1em 0;color:var(--ac)">${esc(cc.nick || n)}</h1><p class="sub sm">${n === 'Leela' ? 'An AI, and proud of it.' : n === 'Tempo' || n === 'Skipper' ? esc(cc.insp) : (n === 'Carlsen' || n === 'Kasparov' ? 'A fictional archetype inspired by ' : 'Inspired by ') + esc(cc.insp)}</p></div></div>`;
  if (!hasKey()) {
    render(`${topbar}${head}<div class="nokey" style="--ac:${cc.acc}"><h2>The crew needs a voice</h2><p>Chat uses your own Anthropic API key. Open <b>Settings</b> (the gear), paste a key into <b>Crew chat</b>, and press Test key. The key stays only on this device and any usage is billed to the key's owner.</p><p class="sub sm">Without a key, the crew still talks during drills, puzzles and reviews using their written lines.</p><button class="btn" id="opengear">Open settings</button></div>`);
    const b = document.getElementById('opengear'); if (b) b.onclick = e => { e.stopPropagation(); document.getElementById('gear').click(); };
    return;
  }
  render(`${topbar}${head}${ctx.fen ? `<div class="chat-ctx">Position attached${ctx.note ? ': ' + esc(ctx.note) : ''}. ${esc(n)} sees the engine's analysis of it.</div>` : ''}
   <div class="chat-l" id="cl" style="--ac:${cc.acc}" aria-live="polite"></div>
   <div class="chat-s" id="cs">${(SUGG[n] || []).concat(ctx.fen ? ['What should I have played here?'] : []).map(q => `<button class="chip" type="button">${esc(q)}</button>`).join('')}</div>
   <form class="chat-f mt1" id="cf"><textarea id="ci" rows="1" placeholder="Ask ${esc(n)}..." aria-label="Message"></textarea><button class="btn" type="submit">Send</button></form>
   <div class="chat-tools"><label><input type="checkbox" id="cm" ${memOn() ? 'checked' : ''}> The crew remembers</label><button class="btn ghost sm" id="cfg" type="button">Forget our talks</button></div>`);
  const cl = document.getElementById('cl'), ci = document.getElementById('ci'), cf = document.getElementById('cf');
  const bubble = (role, txt) => { const d = document.createElement('div'); d.className = 'cb ' + (role === 'user' ? 'u' : 'a'); if (role !== 'user') { d.innerHTML = `<span class="who">${esc(cc.nick || n)}</span><span class="t"></span>`; d.querySelector('.t').textContent = txt; } else d.textContent = txt; cl.appendChild(d); return d; };
  hist.forEach(h => bubble(h.role, h.content));
  if (!hist.length) bubble('assistant', (cc.line && cc.line[1] ? '' : '') + ({ Tal: 'Ah, my friend! Sit. What shall we look at?', Capablanca: 'Good evening. Ask, and I shall keep it simple.', Morphy: 'Sir. A pleasure. What troubles your game?', Carlsen: 'Hey. What do you want to work on?', Kasparov: 'Good! You came prepared, I hope. Ask.', Leela: 'Hello Gerald. I am an AI. What shall we evaluate?' }[n] || 'Ahoy. What is on your mind?'));
  let engine = ctx.fen ? analysis(ctx.fen) : null, busy = false;
  document.getElementById('cm').onchange = e => lsSet('chatmem', e.target.checked);
  document.getElementById('cfg').onclick = () => { forget(n); hist.length = 0; cl.innerHTML = ''; bubble('assistant', 'Forgotten. A fresh page in the log.'); };
  document.getElementById('cs').onclick = e => { const b = e.target.closest('button'); if (b) { ci.value = b.textContent; cf.requestSubmit(); } };
  ci.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); cf.requestSubmit(); } };
  cf.onsubmit = async e => {
    e.preventDefault(); const q = ci.value.trim(); if (!q || busy) return; busy = true; ci.value = '';
    hist.push({ role: 'user', content: q }); bubble('user', q);
    const out = bubble('assistant', ''), t = out.querySelector('.t'); out.classList.add('typing'); t.textContent = '...';
    const ph = document.querySelector('.chat-h .ph'); if (ph) ph.className = ph.className.replace(/m-\w+/, 'm-thinking');
    try {
      const eng = engine ? await engine : '';
      let first = true;
      const r = await send(n, hist, { ctx: ctx.fen ? { fen: ctx.fen, note: ctx.note, engine: eng, master: ctx.master } : {}, onText: d => { if (first) { t.textContent = ''; first = false; } t.textContent += d; } });
      t.textContent = r.text; speak(n, r.text, 'chat', { sentences: 2 }); hist.push({ role: 'assistant', content: r.text }); saveHist(); bond(n, 1); ctx = {}; engine = null;
      if (ph) ph.className = ph.className.replace(/m-\w+/, 'm-pleased');
    } catch (err) { t.textContent = 'The radio crackles: ' + (err && err.message ? err.message.slice(0, 160) : 'no reply') + '. Check the key in Settings.'; hist.pop(); if (ph) ph.className = ph.className.replace(/m-\w+/, 'm-disappointed'); }
    busy = false;
  };
}
