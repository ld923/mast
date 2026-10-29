// House ads for the creator's other projects. Lazy-loaded after first paint. Local-only memory, never over a clock.
import { store, avatar, hydrate } from './ui.js';
import { getAnim } from './fx.js';

const A = 'assets/ads/';
const m = (f, w, h) => [A + f, w, h];
/* Brand table. Robin is a neutral marketplace: never claim it guarantees, matches or promises prices. A brand with any REQUIRED field missing (name, sub, cta, icon, copy) is skipped: "robin" stays silent until filled in. */
export const BR = {
  brl: { name: 'BeatRouteLive', sub: 'Live music app for bands and DJs', url: 'https://beatroute.live', cta: 'Open the app', cta2: 'Open app', dom: 'beatroute.live', v: A + 'ad-brl', who: 'Tempo',
    icon: m('brl-icon.webp', 192, 192), hero: m('brl-logo-dark.webp', 600, 186), clip: A + 'clip-brl-idle.mp4', fit: 'cover',
    shots: ['shot-brl-home', 'shot-brl-bandmate', 'shot-brl-songs', 'shot-brl-library'].map(s => A + s + '.webp'),
    copy: ['Lost on time again? Keep the beat instead.', 'Blitz is fast. A set list is faster. Live music, no flag fall.', 'Tempo says: find a rhythm that is not 3 seconds a move.', 'Hung a rook at 0:04? Hang a gig poster.', 'Soundcheck your clock. Then your sound.'],
    sets: [['Live music for bands and DJs', 'BeatRouteLive is the live-music app built for bands and DJs.', 'Open app'], ['Built for bands and DJs', 'Meet BeatRouteLive, a live-music app for bands and DJs.', 'Learn more'], ['Your next gig starts here', 'BeatRouteLive: a live-music app for bands and DJs.', 'Visit site']],
    fu: ['Your band\'s next gig is waiting', 'BeatRouteLive is the live-music app for bands and DJs.', 'Open app'] },
  lispa: { name: 'Lispa Wellness', sub: 'Spa in Malta · opens 7 Nov 2026', url: 'https://lispa.com.mt', cta: 'Book a treatment', cta2: 'Book now', dom: 'lispa.com.mt', v: A + 'ad-lispa', who: 'Skipper',
    icon: m('lispa-logo.webp', 360, 305), hero: m('lispa-room.webp', 900, 507), fit: 'contain',
    shots: [A + 'shot-lispa-1.webp', A + 'lispa-room.webp'],
    copy: ['Hung your queen? Book a massage.', 'A spa day will not fix your rating. It will fix your shoulders.', 'Skipper prescribes calm: breathe out before you touch the clock.', 'Opening 7 Nov 2026 in Malta. Your next blunder can wait.', 'Zugzwang of the neck? There is a treatment for that.'],
    sets: [['Lispa Wellness, Malta', 'A new spa opens beneath 23 Boutique on Saturday 7 November 2026.', 'Learn more'], ['Return to yourself', 'Wellness, shaped by Malta. Opening Saturday 7 November.', 'Book now'], ['Opening 7 November', 'Lispa Wellness welcomes guests beneath 23 Boutique in Malta.', 'Visit site']],
    fu: ['Still thinking about 23 Boutique?', 'Lispa Wellness opens Saturday 7 November 2026, beneath it in Malta.', 'Book now'] },
  ldtv: { name: 'LDTV', sub: 'Live channels · concerts · radio', url: '', cta: 'Watch now (soon)', cta2: 'Coming soon', dom: 'LDTV', v: A + 'ad-ldtv', who: 'Tempo',
    icon: m('ldtv-icon.webp', 192, 192), hero: m('ldtv-banner.webp', 900, 472), clip: A + 'clip-ldtv-screen.mp4', fit: 'contain',
    shots: ['shot-ldtv-1', 'shot-ldtv-2', 'shot-ldtv-3'].map(s => A + s + '.webp'),
    copy: ['Flagged with a winning position? Watch something calmer.', 'Tonight on LDTV: anything but your clock.', 'Live channels, concerts and radio. No threefold repetition.', 'Channel 1: your endgame. Channel 2: literally anything else.', 'Zero replays of the blunder you just made.'],
    sets: [['Live channels and radio', 'LDTV brings live channels, concerts and radio together.', 'Coming soon'], ['Concerts on LDTV', 'Live channels, concerts and radio, all in one place.', 'Coming soon'], ['Meet LDTV', 'A home for live channels, concerts and radio.', 'Coming soon']],
    fu: ['Still curious about LDTV?', 'Live channels, concerts and radio. Coming soon.', 'Coming soon'] },
  n923: { name: 'Nine23', sub: 'Football shirts and moment prints', url: 'https://nine23.online', cta: 'Shop nine23.online', cta2: 'Shop now', dom: 'nine23.online', v: A + 'ad-n923',
    icon: m('n923-print-aguero.webp', 420, 594), hero: m('n923-play.webp', 900, 472), fit: 'contain',
    shots: [A + 'shot-n923-1.webp', A + 'shot-n923-2.webp'],
    copy: ['Frame the one game the sacrifice actually worked.', 'Look sharp while you resign a lost position.', 'Moments, framed. Unlike your pawn structure, these hold.', 'Dress like the crew: Tal would have worn the shirt.', 'Wear the game. Even the ones you lost on time.'],
    sets: [['Shirts and moment prints', 'Nine23 sells football shirts and moment prints.', 'Shop now'], ['Moments, framed.', 'Football moments turned into prints, from Nine23.', 'Shop now'], ['Wear the game', 'Football shirts and moment prints at nine23.online.', 'Visit site']],
    fu: ['Back for another look?', 'Football shirts and moment prints at nine23.online.', 'Shop now'] },
  vdk: { name: 'Van Der Kush', sub: 'Intelligent garden care', url: '', cta: 'Coming soon', cta2: 'Coming soon', dom: 'Van Der Kush', v: A + 'ad-vdk',
    icon: m('vdk-icon.webp', 192, 192), hero: m('vdk-lockup.webp', 600, 427), clip: A + 'clip-vdk-screen.mp4', fit: 'contain',
    shots: [A + 'shot-vdk-1.webp', A + 'shot-vdk-2.webp'],
    copy: ['Your pawns are wilting. Water something that grows back.', 'Intelligent garden care. Unlike your king, it never gets exposed.', 'Rotate your crops, not just your rooks.', 'Plants do not blunder on move 12.', 'Slow growth wins long games. Ask a gardener.'],
    sets: [['Intelligent garden care', 'Van Der Kush puts your whole garden on your phone.', 'Coming soon'], ['Track. Sense. Act.', 'Intelligent garden care from Van Der Kush.', 'Coming soon'], ['Your garden, on your phone', 'Van Der Kush: intelligent garden care. Coming soon.', 'Coming soon']],
    fu: ['Still thinking about your garden?', 'Van Der Kush: intelligent garden care. Coming soon.', 'Coming soon'] },
  dbox: { name: 'D BoxStation', sub: 'The past, played in the present', url: '', cta: 'Press START (soon)', cta2: 'Coming soon', dom: 'D BoxStation', v: A + 'ad-dbox',
    icon: m('dbox-icon.webp', 192, 192), hero: m('dbox-master.webp', 800, 571), clip: A + 'clip-dbox-screen.mp4', fit: 'contain',
    shots: [A + 'shot-dbox-1.webp', A + 'shot-dbox-2.webp'],
    copy: ['Your opening never looked this pixelated.', 'Press START on a new game. Takebacks not included.', 'Retro handhelds. Zero time scrambles.', 'Insert coin. Or just a better first move.', 'Game over? No. Continue? Yes.'],
    sets: [['Past, played in the present', 'D BoxStation is a retro handheld console. Coming soon.', 'Coming soon'], ['Retro handheld gaming', 'Press START on D BoxStation. Coming soon.', 'Coming soon'], ['Meet D BoxStation', 'The past, played in the present. Coming soon.', 'Coming soon']],
    fu: ['Ready to press START?', 'D BoxStation: the past, played in the present.', 'Coming soon'] },
  robin: { name: 'Robin', sub: "Malta's electronics and home shops in one app", url: '', cta: 'Coming soon', cta2: 'Coming soon', dom: 'Robin', v: null, who: null, color: '#e8521f',
    icon: m('robin-icon.webp', 192, 192), hero: m('robin-hero.webp', 800, 800), fit: 'cover', shots: [A + 'robin-card.webp'],
    copy: ['Comparing moves takes time. Comparing prices should not. Robin.', 'Every Malta shop on one board. You pick the best move.', 'Fork the shops, not your budget.', 'One search, every shop: a clean skewer of the price list.', 'Zwischenzug for shoppers: check Robin before you buy.'],
    sets: [['Malta\'s shops in one app', 'Robin searches Malta\'s electronics and home shops at once, so you can compare.', 'Coming soon'], ['Compare. Get alerted. Get it installed.', 'Compare shops, set price alerts, and book delivery with installation. Coming soon.', 'Coming soon'], ['One search for Malta', 'Robin: electronics and home shops, side by side. The shops compete, you choose.', 'Coming soon']],
    fu: ['Still comparing?', 'Robin: Malta\'s electronics and home shops in one app. Coming soon.', 'Coming soon'] },
};
export const BR_ORDER = ['brl', 'lispa', 'ldtv', 'n923', 'vdk', 'dbox', 'robin'];
const valid = k => { const b = BR[k]; return !!(b && b.name && b.sub && b.cta && b.icon && b.hero && Array.isArray(b.copy) && b.copy.length); };
const live = () => BR_ORDER.filter(valid);

const Q = new URLSearchParams(location.search);
const DEV = { k: valid(Q.get('ad')) ? Q.get('ad') : '', f: Q.get('adfmt') || '' };
const DAY = () => new Date().toISOString().slice(0, 10), CAP = 3, FU_MS = 72 * 3600e3;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const anim = () => getAnim() === 'full', still = () => getAnim() === 'off';
const S = { n: 0, nat: 0, banner: null, timer: null, ref: 0, full: false, why: null, natDone: false, route: '' };

/* ---- state (local only) ---- */
const off = () => store.get('ads.off', false) === true;
const hidden = () => Date.now() < (store.get('ads.hide', 0) || 0);
const eng = () => store.get('ads.eng', {});
const engRecent = k => { const x = eng()[k]; return !!x && Date.now() - x < FU_MS; };
const markEng = k => { if (!BR[k]) return; const e = eng(); e[k] = Date.now(); store.set('ads.eng', e); };
const capGet = () => { const c = store.get('ads.cap', null); return c && c.d === DAY() ? c : { d: DAY(), n: {} }; };
const capped = k => (capGet().n[k] || 0) >= CAP;
const capBump = k => { const c = capGet(); c.n[k] = (c.n[k] || 0) + 1; store.set('ads.cap', c); };

/* ---- creative + brand rotation ---- */
function creative(k) {
  const b = BR[k], pro = (b.sets || []).map((c, i) => ({ id: 'p' + i, h: c[0], d: c[1], cta: c[2] })), fun = b.copy.map((h, i) => ({ id: 'g' + i, h })), fu = b.fu ? { id: 'f', h: b.fu[0], d: b.fu[1], cta: b.fu[2] } : null, dv = Q.get('adv');
  let pool = dv === 'play' ? fun : dv === 'pro' && pro.length ? pro : dv === 'fu' && fu ? [fu] : (fu && engRecent(k) && !DEV.k && Math.random() < .6) ? [fu] : (Math.random() < .6 && pro.length ? pro : fun);
  const last = store.get('ads.last.' + k, ''), alt = pool.filter(c => c.id !== last); if (alt.length) pool = alt;
  const c = pool[Math.floor(Math.random() * pool.length)]; store.set('ads.last.' + k, c.id);
  return { h: c.h, d: c.d || '', cta: c.cta || b.cta2 || b.cta, fu: c.id === 'f' };
}
function pick(avoid) {
  let k = DEV.k; const L = live();
  if (!k) {
    const ok = L.filter(q => q !== avoid && !capped(q)), e = ok.filter(engRecent);
    if (!ok.length) return null;
    if (e.length && Math.random() < .6) k = e[Math.floor(Math.random() * e.length)];
    else { let i = store.get('ads.rot', 0) || 0; for (let n = 0; n < L.length && !k; n++) { const q = L[i++ % L.length]; if (ok.includes(q)) k = q; } store.set('ads.rot', i % L.length); }
  }
  if (!k) return null; capBump(k); return { k, b: BR[k], ...creative(k) };
}

/* ---- calm-screen rule: never over a clock ---- */
const parts = () => location.hash.slice(1).split('/');
function calm() {
  const [r, sub] = parts(); if (!r || document.hidden) return false;
  if (['today', 'voyage', 'masters', 'secrets', 'collection', 'trophies'].includes(r)) return !sub || r !== 'today' || true;
  if (r === 'review' || r === 'coach') return !sub;       // list / hub only, not a game review or a coach drill
  return false;                                           // drills, puzzles, play, watch, boss, studio, chat: never
}
const busy = () => !!($('.pclock, .pc-ring, [data-clock-running]') || document.querySelector('[role=dialog][aria-modal=true]:not(.ad-full)') || $('.co-more'));
const ok = () => !off() && !S.full && calm() && !busy();

const link = (b, cls, inner, label) => b.url ? `<a class="${cls}" href="${esc(b.url)}" target="_blank" rel="noopener sponsored"${label ? ` aria-label="${esc(label)}"` : ''}>${inner}</a>` : `<span class="${cls} soon">${inner}</span>`;
const img = (a, alt = '', cls = '') => `<img${cls ? ` class="${cls}"` : ''} src="${a[0]}" width="${a[1]}" height="${a[2]}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const kick = () => `<span class="ad-k">Sponsored · House ad</span>`;
const chip = () => `<button type="button" class="ad-why" data-why aria-label="Why am I seeing this ad?"><i aria-hidden="true">i</i></button>`;
const presenter = (b, k) => b.who ? `<span class="ad-pres" aria-hidden="true">${avatar(b.who, 'smile', 'ad-av')}<em>${esc(b.who)} presents</em></span>` : '';
const root = () => { let r = $('#ads'); if (!r) { r = document.createElement('div'); r.id = 'ads'; document.body.appendChild(r); } return r; };
let cssP = null; const css = () => cssP || (cssP = new Promise(res => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/ads.css'; l.onload = l.onerror = res; document.head.appendChild(l); }));

/* ---- banner ---- */
function killBanner() { clearTimeout(S.timer); S.timer = null; const el = S.banner; S.banner = null; if (el) { el.classList.add('out'); setTimeout(() => el.remove(), anim() ? 260 : 0); } }
function fillBanner(el, a) {
  const b = a.b; el.dataset.adk = a.k; el.className = `ad-banner ad-${a.k}`; if (b.color) el.style.setProperty('--a', b.color);
  el.innerHTML = `<span class="ad-ic">${img(b.icon, '')}</span><span class="ad-tx">${kick()}<b>${esc(a.h)}</b>${presenter(b, a.k)}</span>${link(b, 'ad-cta', esc(a.cta))}${chip()}<button type="button" class="ad-x" aria-label="Close ad">&times;</button>`;
  hydrate(el);
}
async function banner(force) {
  if (!force && (!ok() || hidden() || S.banner || S.natDone)) return; if (force && off()) return;
  const a = pick(); if (!a) return; await css(); killBanner(); S.ref = 0;
  const el = document.createElement('aside'); el.setAttribute('aria-label', 'Advertisement'); fillBanner(el, a); root().appendChild(el); S.banner = el;
  const next = last => { S.timer = setTimeout(() => { if (!el.isConnected) return; if (!ok() || S.ref >= 2) { killBanner(); return; } S.ref++; const n = pick(last); if (!n) { killBanner(); return; } fillBanner(el, n); next(n.k); }, +Q.get('adrefms') || 45000); };
  next(a.k);
}

/* ---- native card (Review list, Coach hub) ---- */
function media(b) {
  const tiles = [];
  if (b.clip && anim()) tiles.push(`<span class="ad-frame clip"><video muted loop playsinline preload="none" data-src="${b.clip}" poster="${b.v ? b.v + '-11-p.webp' : ''}" aria-hidden="true"></video></span>`);
  (b.shots || []).forEach((s, i) => tiles.push(`<span class="ad-frame ${b.fit || 'contain'}"><img src="${s}" alt="${esc(b.name)} screen ${i + 1}" loading="lazy" decoding="async"></span>`));
  return `<div class="ad-strip" tabindex="0" role="group" aria-label="${esc(b.name)} screens">${tiles.join('')}</div>`;
}
function nativeHTML(a) {
  const b = a.b;
  return `<section class="card ad-native ad-${a.k}" data-adk="${a.k}" aria-label="Advertisement"><div class="ad-nh"><span class="ad-ic">${img(b.icon, '')}</span><div class="ad-nw"><b>${esc(b.name)}</b>${kick()}</div>${chip()}</div>
   ${media(b)}<p class="ad-hl">${esc(a.h)}</p><p class="ad-sub">${esc(a.d || b.sub)}</p>${presenter(b, a.k)}${link(b, 'ad-cta wide', esc(a.cta))}</section>`;
}
function wireMedia(el) {
  const vs = [...el.querySelectorAll('video[data-src]')]; if (!vs.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && anim() && !document.hidden) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => { }); } else { try { v.pause(); } catch (x) { } } }), { threshold: .5 });
  vs.forEach(v => io.observe(v));
  new MutationObserver(() => { if (!el.isConnected) { io.disconnect(); vs.forEach(v => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (x) { } }); } }).observe(document.body, { childList: true, subtree: true });
}
function place(card) {
  const [r, sub] = parts(); const v = $('#view'); if (!v) return false;
  if (r === 'review' && !sub) { const l = $('.rv-list', v); if (!l) return false; l.after(card); return true; }
  if (r === 'coach' && !sub) { const h = $('.co-hub', v); if (!h) return false; const c = h.children[3] || h.lastElementChild; card.style.gridColumn = '1/-1'; h.insertBefore(card, c); return true; }
  if (DEV.f === 'native') { v.appendChild(card); return true; }
  return false;
}
async function native(force) {
  if (!force && (!ok() || S.natDone || hidden() || ((store.get('ads.nat', {}).d === DAY() ? store.get('ads.nat').n : 0) >= 4))) return;
  const [r, sub] = parts(); if (!force && !((r === 'review' || r === 'coach') && !sub)) return;
  let tries = 0; const go = async () => {
    if (!force && !ok()) return; if (S.route !== location.hash) return;
    const probe = document.createElement('div'); if (!place(probe)) { if (++tries < 14) setTimeout(go, 250); return; } probe.remove();
    const a = pick(); if (!a) return; await css(); const t = document.createElement('div'); t.innerHTML = nativeHTML(a); const card = t.firstElementChild;
    if (!place(card)) return; S.natDone = true; S.nat++; killBanner(); const n = store.get('ads.nat', {}); store.set('ads.nat', { d: DAY(), n: (n.d === DAY() ? n.n : 0) + 1 });
    hydrate(card); wireMedia(card);
  }; go();
}

/* ---- interstitial: once a day, 2nd calm view, never mid-session ---- */
const T = s => `0:${String(Math.max(0, Math.ceil(s))).padStart(2, '0')}`;
async function interstitial(force) {
  if (off() || S.full || (!force && !ok())) return; const a = pick(); if (!a) return; await css();
  const b = a.b, prev = document.activeElement, rm = !anim(), poster = b.v ? b.v + '-916-p.webp' : '';
  S.full = true; killBanner();
  const el = document.createElement('div'); el.className = `ad-full ad-${a.k}`; el.dataset.adk = a.k; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Sponsored break');
  el.innerHTML = `<div class="ad-stage"><div class="ad-vid"${poster ? ` style="background-image:url(${poster})"` : ''}></div><div class="ad-fade"></div>
   <div class="ad-ftop">${kick()}<span class="ad-time" role="timer" aria-label="Ad time left">${T(15)}</span><span class="grow"></span>${chip()}</div>
   <div class="ad-fbot"><div class="ad-fcard"><span class="ad-ic">${img(b.icon, '')}</span><div class="ad-nw"><b>${esc(b.name)}</b><small>${esc(a.h)}</small></div>${link(b, 'ad-cta', esc(a.cta))}</div>
   ${presenter(b, a.k)}<div class="ad-skiprow"><button type="button" class="ad-skip" aria-disabled="true">Skip in 5</button></div></div><div class="ad-prog" aria-hidden="true"><i></i></div></div>`;
  root().appendChild(el); hydrate(el);
  const stage = $('.ad-vid', el), sk = $('.ad-skip', el), bar = $('.ad-prog i', el), tm = $('.ad-time', el); let open = false, vd = null;
  if (!rm && b.v) { vd = document.createElement('video'); vd.muted = true; vd.playsInline = true; vd.preload = 'none'; vd.setAttribute('aria-hidden', 'true'); vd.src = b.v + '-916.mp4'; stage.appendChild(vd); vd.play().catch(() => { }); }
  const done = () => { clearInterval(S.tick); S.esc = null; S.trap = null; if (vd) { try { vd.pause(); vd.removeAttribute('src'); vd.load(); } catch (x) { } vd.remove(); } el.classList.add('out'); setTimeout(() => el.remove(), rm ? 0 : 220); S.full = false; try { if (prev && prev.focus && document.contains(prev)) prev.focus(); } catch (x) { } };
  S.esc = () => { if (open) done(); };
  S.trap = e => { const f = [...el.querySelectorAll('button:not([disabled]),a[href]')]; if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } };
  sk.focus(); const T0 = Date.now(), DUR = 15000;
  S.tick = setInterval(() => {
    if (!calm() && !force) { done(); return; }      // user navigated onto a clock screen: leave at once
    const e = Date.now() - T0; bar.style.transform = `scaleX(${Math.min(1, e / DUR)})`; tm.textContent = T((DUR - e) / 1000);
    if (e < 5000) sk.textContent = `Skip in ${Math.ceil((5000 - e) / 1000)}`; else if (!open) { open = true; markEng(a.k); sk.setAttribute('aria-disabled', 'false'); sk.textContent = 'Skip ad'; sk.focus(); }
    if (e >= DUR) done();
  }, 250);
  sk.onclick = () => { if (open) done(); };
}

/* ---- why chip ---- */
function reasons(k) {
  const r = []; if (k && engRecent(k)) r.push('You recently interacted with this advertiser.');
  r.push('You opened Mast on a calm screen, never during a clock.', 'This is a house ad: one of the creator\'s own projects, picked by rotation.', 'Nothing about you leaves this device. Frequency and memory are stored locally.');
  return r.slice(0, 3);
}
function why(k) {
  if (S.why) return; const prev = document.activeElement, el = document.createElement('div'); el.className = 'ad-whybg'; S.why = el;
  el.innerHTML = `<div class="ad-whybox" role="dialog" aria-modal="true" aria-label="Why am I seeing this ad?"><span class="ad-k">Why am I seeing this ad?</span><h3>Three honest reasons</h3><ol>${reasons(k).map(t => `<li>${esc(t)}</li>`).join('')}</ol>
   <div class="ad-whyrow"><button type="button" class="btn ghost sm" data-rep>Seen it too often</button><button type="button" class="btn ghost sm" data-h24>Hide ads for 24h</button><button type="button" class="btn sm" data-ok>Close</button></div><p class="sub sm" role="status" aria-live="polite"></p></div>`;
  document.body.appendChild(el); if (k) markEng(k);
  const close = () => { el.remove(); S.why = null; try { prev && prev.focus && prev.focus(); } catch (x) { } };
  S.whyClose = close; $('[data-ok]', el).onclick = close; el.onclick = e => { if (e.target === el) close(); };
  $('[data-rep]', el).onclick = () => { $('p', el).textContent = 'Noted. Stored on this device only.'; };
  $('[data-h24]', el).onclick = () => { hide24(); close(); }; $('[data-ok]', el).focus();
}
function hide24() { store.set('ads.hide', Date.now() + 24 * 3600e3); killBanner(); paint(); }

/* ---- settings ---- */
function paint() {
  const m = $('#menu'); if (!m) return; m.querySelectorAll('[data-ad]').forEach(b => b.classList.toggle('on', (b.dataset.ad === '1') === !off()));
  const h = $('#ads-hide'); if (h) { h.textContent = hidden() ? 'Ads hidden until ' + new Date(store.get('ads.hide', 0)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (tap to undo)' : 'Hide ads for 24h'; }
}
function bind() {
  const m = $('#menu'); if (!m) return;
  m.querySelectorAll('[data-ad]').forEach(b => b.onclick = e => { e.stopPropagation(); store.set('ads.off', b.dataset.ad === '0'); if (off()) { killBanner(); $('#ads .ad-native,.ad-native')?.remove(); const f = $('#ads .ad-full'); if (f) { f.remove(); S.full = false; clearInterval(S.tick); S.esc = S.trap = null; } } paint(); });
  const h = $('#ads-hide'); if (h) h.onclick = e => { e.stopPropagation(); if (hidden()) { store.set('ads.hide', 0); paint(); } else hide24(); };
  const g = $('#gear'); if (g) g.addEventListener('click', paint); paint();
}

/* ---- view-change driver ---- */
function onView() {
  S.n++; S.natDone = false; S.route = location.hash; clearTimeout(S.timer); killBanner(); S.timer = null;
  const w = $('.ad-native'); if (w) w.remove();
  if (S.full) { if (!calm() && S.esc) { /* tick() ends it */ } return; }
  if (off() || !calm() || DEV.f) return;
  const [r, sub] = parts();
  if (S.n >= 2 && store.get('ads.day', '') !== DAY() && !hidden() && !S.dayDone) { S.dayDone = true; store.set('ads.day', DAY()); S.timer = setTimeout(() => interstitial(), 900); return; }
  if ((r === 'review' || r === 'coach') && !sub) native();
  if (hidden() || S.natDone) return;
  if (Math.random() < .5) S.timer = setTimeout(() => { if (!S.natDone) banner(); }, 3000 + Math.random() * 2000);
}
function devRun() {
  if (!DEV.f || off()) return; const f = DEV.f;
  setTimeout(() => { S.route = location.hash; if (f === 'banner') banner(true); else if (f === 'full') interstitial(true); else if (f === 'native') native(true); }, 700);
}
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[rel~=sponsored]'); if (a) { const x = a.closest('[data-adk]'); if (x) markEng(x.dataset.adk); return; }
  const w = e.target.closest && e.target.closest('[data-why]'); if (w) { const x = w.closest('[data-adk]'); why(x ? x.dataset.adk : null); return; }
  const c = e.target.closest && e.target.closest('.ad-x'); if (c) killBanner(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Tab' && S.full && S.trap && !S.why) { S.trap(e); return; }
  if (e.key !== 'Escape') return; if (S.why) { S.whyClose(); e.stopPropagation(); return; } if (S.esc) S.esc();
}, true);
addEventListener('hashchange', onView);
document.addEventListener('visibilitychange', () => { if (document.hidden) killBanner(); });
window.__mastAds = { BR, valid, live, state: () => ({ ...S, banner: !!S.banner, cap: capGet(), eng: eng() }), interstitial, banner, native };
bind(); onView(); devRun();
