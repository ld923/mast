// PWA: service worker registration + update toast, install prompt (Chromium) / iOS instructions, standalone detection, offline helper.
import { store } from './ui.js';

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const online = () => navigator.onLine !== false;
let deferred = null; const subs = new Set();
const fire = () => subs.forEach(f => { try { f(); } catch (_) { } });
export const onInstallChange = f => { subs.add(f); return () => subs.delete(f); };
export const canInstall = () => !!deferred && !isStandalone();

addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; fire(); });
addEventListener('appinstalled', () => { deferred = null; store.set('pwa.installed', true); fire(); });
matchMedia('(display-mode: standalone)').addEventListener?.('change', fire);

export async function promptInstall() {
  if (!deferred) return 'unavailable';
  deferred.prompt(); const r = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' })); deferred = null; fire(); return r.outcome;
}
const IOS_HELP = 'On iPhone or iPad: tap Share, then "Add to Home Screen".';
const GENERIC_HELP = 'Your browser did not offer an install button. In Chrome or Edge, open the browser menu and choose "Install Mast" (or "Apps", then "Install this site as an app").';

/* settings box */
export function mountInstallUI(box) {
  if (!box) return;
  const paint = () => {
    if (isStandalone()) { box.innerHTML = '<p class="sub sm" style="margin:4px 0 0">Installed. You are running Mast as an app.</p>'; return; }
    if (canInstall()) { box.innerHTML = '<button class="btn sm" type="button" id="pwa-install">Install Mast</button><p class="sub sm" style="margin:6px 0 0;line-height:1.4">Opens like an app and works offline.</p>'; box.querySelector('#pwa-install').onclick = e => { e.stopPropagation(); promptInstall(); }; return; }
    box.innerHTML = `<p class="sub sm" style="margin:4px 0 0;line-height:1.4">${isIOS() ? IOS_HELP : GENERIC_HELP}</p>`;
  };
  paint(); onInstallChange(paint);
}

/* once in the briefing */
export function briefInstallCard(sheet) {
  if (!sheet || isStandalone() || store.get('pwa.briefShown', false)) return;
  if (!canInstall() && !isIOS()) return;
  const host = sheet.querySelector('.g-today'); if (!host) return;
  const c = document.createElement('div'); c.className = 'card'; c.id = 'brief-install';
  c.innerHTML = `<span class="k">Keep Mast on deck</span><h2>Install Mast</h2><p>${canInstall() ? 'Add it to your home screen or desktop. It opens full screen and works offline.' : IOS_HELP}</p>${canInstall() ? '<button class="btn" type="button" id="bi-go">Install Mast</button> ' : ''}<button class="btn ghost" type="button" id="bi-no">Not now</button>`;
  host.prepend(c); store.set('pwa.briefShown', true);
  const go = c.querySelector('#bi-go'); if (go) go.onclick = async () => { await promptInstall(); c.remove(); };
  c.querySelector('#bi-no').onclick = () => c.remove();
}

/* service worker + update toast */
const CSS = `.upd{position:fixed;z-index:70;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translate(-50%,160%);max-width:min(440px,92vw);display:flex;gap:12px;align-items:center;padding:10px 12px 10px 16px;border-radius:var(--r-lg);background:var(--bg);border:1px solid var(--brass);box-shadow:var(--shadow);color:var(--fg);transition:transform .45s var(--ease)}
.upd.on{transform:translate(-50%,0)}.upd .k{display:block;font:700 11px var(--f-disp);letter-spacing:.2em;text-transform:uppercase;color:var(--a)}.upd b{display:block;font:700 16px var(--f-disp);letter-spacing:.04em}`;
function updateToast(reg) {
  if (document.querySelector('.upd')) return;
  if (!document.getElementById('upd-css')) { const s = document.createElement('style'); s.id = 'upd-css'; s.textContent = CSS; document.head.appendChild(s); }
  const el = document.createElement('div'); el.className = 'upd'; el.setAttribute('role', 'status');
  el.innerHTML = '<div><span class="k">Gaffer</span><b>New version ready</b></div><button class="btn sm" type="button">Refresh</button>';
  document.body.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  el.querySelector('button').onclick = () => { const w = reg.waiting; if (w) w.postMessage('skip'); else location.reload(); };
}
export function initPWA() {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading || !window.__hadController) return; reloading = true; location.reload(); });
  window.__hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => {
    setTimeout(() => { const c = navigator.connection || {}; if (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")) return; navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage("warm")).catch(() => { }); }, 30000);
    const check = () => { if (reg.waiting && navigator.serviceWorker.controller) updateToast(reg); };
    check();
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') check(); }); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => { }); });
    setInterval(() => reg.update().catch(() => { }), 3600e3);
    window.__swReg = reg;
  }).catch(() => { });
}
