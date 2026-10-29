// Keyboard play: type SAN/UCI into a small move box on any board; Space/H shortcuts. Never fires inside text inputs.
import { activeBoard } from './board2.js';
import { seen, markSeen } from './ui.js';
const CSS = '#kbm{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(18,26,38,.96);border:1px solid rgba(201,162,75,.6);box-shadow:0 8px 28px rgba(0,0,0,.45);color:#F2E8D0;font:13px system-ui,sans-serif}#kbm input{width:9ch;font:700 18px ui-monospace,Menlo,Consolas,monospace;background:#0c131d;color:#FFE9A8;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:6px 8px}#kbm input:focus{outline:2px solid #FFC857}#kbm small{opacity:.7}#kbm.bad input{border-color:#FF5A4E}#kbm .er{color:#FF8A80;max-width:24ch}#kbt{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:70;padding:9px 14px;border-radius:99px;background:rgba(18,26,38,.95);border:1px solid rgba(201,162,75,.55);color:#F2E8D0;font:600 13px system-ui,sans-serif}';
const editable = t => t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable);
let box = null;
function style() { if (!document.getElementById('kb-css')) { const s = document.createElement('style'); s.id = 'kb-css'; s.textContent = CSS; document.head.appendChild(s); } }
function close() { if (box) { box.remove(); box = null; } }
function open(seed) {
  const b = activeBoard(); if (!b) return false;
  if (box) { box.querySelector('input').focus(); return true; }
  style(); box = document.createElement('form'); box.id = 'kbm'; box.setAttribute('aria-label', 'Type a move'); box.autocomplete = 'off';
  box.innerHTML = '<input type="text" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Move in SAN or UCI, for example Nf3 or e2e4" placeholder="e4"><small>Enter to play · Esc to cancel</small><span class="er" role="alert"></span>';
  const inp = box.querySelector('input'), er = box.querySelector('.er');
  inp.value = seed || '';
  box.onsubmit = e => { e.preventDefault(); const bd = activeBoard(); if (!bd) { close(); return; } const err = bd.typeMove(inp.value); if (err) { box.classList.add('bad'); er.textContent = err; } else close(); };
  inp.oninput = () => { box.classList.remove('bad'); er.textContent = ''; };
  inp.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  inp.onblur = () => setTimeout(() => { if (box && !inp.value) close(); }, 150);
  document.body.appendChild(box); inp.focus(); return true;
}
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || editable(e.target)) return;
  const k = e.key;
  if (k === ' ') { // watch intro card: Space starts the segment; Space also closes a crew intro
    const go = document.querySelector('#w-go'), intro = document.querySelector('.intro:not(.out)');
    if (intro) { e.preventDefault(); intro.click(); } else if (go && go.isConnected) { e.preventDefault(); go.click(); }
    return;
  }
  if (k === 'H') { const h = document.querySelector('#d-hint:not(:disabled)') || [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Spyglass' && !x.disabled); if (h) { e.preventDefault(); h.click(); } return; }
  if (k === '/') { if (open('')) e.preventDefault(); return; }
  if (k.length === 1 && /[a-hKQRBNOxX0-9]/.test(k) && !document.querySelector('.promo, .pl-ov, .intro:not(.out)')) { if (open(k)) e.preventDefault(); }
});
/* one-time desktop tip */
function tip() {
  try { if (seen('tip.kb') || !matchMedia('(hover:hover) and (pointer:fine)').matches || innerWidth < 900) return; } catch (_) { return; }
  if (!activeBoard()) return; markSeen('tip.kb'); style();
  const t = document.createElement('div'); t.id = 'kbt'; t.setAttribute('role', 'status'); t.textContent = 'Tip: type your moves (e4, Nf3, O-O). Press / to open the box, Shift+H for the spyglass.'; document.body.appendChild(t); setTimeout(() => t.remove(), 7000);
}
export function kbTip() { [1500, 4000].forEach(ms => setTimeout(tip, ms)); }
addEventListener('hashchange', () => { close(); kbTip(); });
