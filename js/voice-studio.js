// Voice studio (#studio): record clips for Skipper / Tempo per event with MediaRecorder; saved in IndexedDB on this device.
import { EVENTS, CLIP_WHO, listClips, saveClip, delClip, playBlob, clipsChanged, stop } from './voice.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
const PROMPT = { open: 'when a drill or session opens', solve: 'right answer', fail: 'wrong answer', blunder_when_winning: 'threw away a winning position', time_trouble: 'clock running low', beat_master: 'beat a master', lose: 'lost a game' };
export async function studioScreen({ render, topbar }) {
  let who = CLIP_WHO[0], rec = null, pending = null, msg = '';
  const draw = async () => {
    const clips = (await listClips()).filter(c => c.who === who);
    render(`${topbar}<a class="back" href="#today">&larr; Back</a><span class="k">Settings</span><h1>Voice studio</h1>
    <p class="sub mt1">Record your own lines for the crew. A recorded clip plays instead of the synthetic voice for that character and event, on this device. The microphone is only requested when you press Record.</p>
    <div class="seg" style="margin:12px 0">${CLIP_WHO.map(w => `<button type="button" data-w="${w}" class="${w === who ? 'on' : ''}">${w}</button>`).join('')}</div>
    <p class="sub sm" id="vs-msg" role="status" aria-live="polite">${esc(msg)}</p>
    <div class="vs-list">${EVENTS.map(ev => { const mine = clips.filter(c => c.ev === ev); return `<div class="card vs-row" data-ev="${ev}" style="margin-bottom:8px"><div class="row tight" style="flex-wrap:wrap;gap:8px;align-items:center"><div style="flex:1;min-width:150px"><b>${ev.replace(/_/g, ' ')}</b><br><span class="sub sm">${esc(PROMPT[ev])} · ${mine.length} saved</span></div>
      <button class="btn sm" type="button" data-rec="${ev}">${rec && rec.ev === ev ? 'Stop' : 'Record'}</button>
      ${pending && pending.ev === ev ? `<button class="btn ghost sm" type="button" data-pp>Preview</button><button class="btn sm" type="button" data-ps>Save</button><button class="btn ghost sm" type="button" data-pd>Discard</button>` : ''}</div>
      ${mine.map(c => `<div class="row tight" style="margin-top:6px;gap:8px"><button class="btn ghost sm" type="button" data-pl="${esc(c.key)}">Play</button><button class="btn ghost sm" type="button" data-dl="${esc(c.key)}">Delete</button><span class="sub sm">${new Date(c.t).toLocaleDateString()}</span></div>`).join('')}</div>`; }).join('')}</div>
    <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap"><button class="btn" id="vs-ex" type="button">Export my clips</button></div>
    <p class="sub sm mt1">Export downloads one JSON file with all clips on this device. Send it to the app's maintainer to bundle into <code>assets/voices/</code> so the clips also play on other devices.</p>`);
    const root = document.getElementById('view'), m = t => { msg = t; const e = root.querySelector('#vs-msg'); if (e) e.textContent = t; };
    root.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { if (rec) return; who = b.dataset.w; pending = null; msg = ''; draw(); });
    root.querySelectorAll('[data-rec]').forEach(b => b.onclick = async () => {
      const ev = b.dataset.rec;
      if (rec) { rec.mr.stop(); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') { m('Recording is not available in this browser or context (it needs HTTPS or localhost and a microphone).'); return; }
      let st; try { st = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { m(e && e.name === 'NotFoundError' ? 'No microphone found on this device.' : 'Microphone access was denied or blocked. Allow it in the browser site settings and try again.'); return; }
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      let mr; try { mr = new MediaRecorder(st, type ? { mimeType: type } : undefined); } catch (e) { st.getTracks().forEach(t => t.stop()); m('Could not start the recorder: ' + (e.message || e)); return; }
      const chunks = []; mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = () => { st.getTracks().forEach(t => t.stop()); clearTimeout(rec && rec.to); const blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/webm' }); rec = null; pending = blob.size ? { ev, blob } : null; msg = blob.size ? 'Recorded. Preview it, then save or discard.' : 'Nothing was recorded.'; draw(); };
      rec = { mr, ev, to: setTimeout(() => { try { mr.stop(); } catch (_) { } }, 15000) }; mr.start(); m('Recording... press Stop when done (15 seconds max).'); b.textContent = 'Stop';
    });
    const pp = root.querySelector('[data-pp]'); if (pp) pp.onclick = () => playBlob(pending.blob);
    const ps = root.querySelector('[data-ps]'); if (ps) ps.onclick = async () => { try { await saveClip(who, pending.ev, pending.blob); clipsChanged(); pending = null; msg = 'Saved on this device.'; } catch (e) { msg = 'Could not save (storage blocked?).'; } draw(); };
    const pd = root.querySelector('[data-pd]'); if (pd) pd.onclick = () => { pending = null; msg = ''; draw(); };
    const bykey = Object.fromEntries(clips.map(c => [c.key, c]));
    root.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => playBlob(bykey[b.dataset.pl].blob));
    root.querySelectorAll('[data-dl]').forEach(b => b.onclick = async () => { await delClip(b.dataset.dl); clipsChanged(); draw(); });
    root.querySelector('#vs-ex').onclick = async () => {
      const all = await listClips(); if (!all.length) { m('No clips to export yet.'); return; }
      const out = { app: 'mast-voices', version: 1, exported: new Date().toISOString(), clips: [] };
      for (const c of all) out.clips.push({ who: c.who, event: c.ev, mime: c.type, t: c.t, b64: await b64(c.blob) });
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' })); a.download = 'mast-voice-clips.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); m(`Exported ${all.length} clip(s).`);
    };
  };
  stop(); await draw();
}
