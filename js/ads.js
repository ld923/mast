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
  gaffer: { name: 'The Gaffer', sub: 'Your FPL assistant manager', url: '', cta: 'Coming soon', cta2: 'Coming soon', dom: 'The Gaffer', v: null, who: 'Tempo', color: '#00A86B',
    icon: m('gaffer-icon.webp', 192, 192), hero: m('gaffer-logo.webp', 900, 330), fit: 'cover',
    shots: ['shot-gaffer-panel', 'shot-gaffer-league', 'shot-gaffer-week', 'shot-gaffer-multiverse'].map(s => A + s + '.webp'),
    copy: ['Captained the wrong piece again? Let the Gaffer pick your FPL captain.', 'Blunders on the board, blunders in FPL. The Gaffer fixes one of them.', 'From the same crew: your Fantasy Premier League assistant manager.', 'Tal sacrifices queens. The Gaffer never sacrifices your bench.', 'Win chance 60%. Shame your blitz isn\'t.'],
    sets: [['Your FPL assistant manager', 'The Gaffer plans your transfers, captain and bench every gameweek.', 'Coming soon'], ['Head to head with your mates', 'Win chances, projected points and a crew of pundit managers.', 'Coming soon']] },
  robin: { name: 'Robin', sub: "Malta's electronics and home shops in one app", url: '', cta: 'Coming soon', cta2: 'Coming soon', dom: 'Robin', v: null, who: null, color: '#e8521f',
    icon: m('robin-icon.webp', 192, 192), hero: m('robin-hero.webp', 800, 800), fit: 'cover', shots: ['shot-robin-home', 'shot-robin-compare', 'shot-robin-cats', 'robin-card'].map(s => A + s + '.webp'),
    copy: ['Comparing moves takes time. Comparing prices should not. Robin.', 'Every Malta shop on one board. You pick the best move.', 'Fork the shops, not your budget.', 'One search, every shop: a clean skewer of the price list.', 'Zwischenzug for shoppers: check Robin before you buy.'],
    sets: [['Malta\'s shops in one app', 'Robin searches Malta\'s electronics and home shops at once, so you can compare.', 'Coming soon'], ['Compare. Get alerted. Get it installed.', 'Compare shops, set price alerts, and book delivery with installation. Coming soon.', 'Coming soon'], ['One search for Malta', 'Robin: electronics and home shops, side by side. The shops compete, you choose.', 'Coming soon']],
    fu: ['Still comparing?', 'Robin: Malta\'s electronics and home shops in one app. Coming soon.', 'Coming soon'] },
};
const GOAL = { brl: 'Get bands and DJs to open the app', lispa: 'Bookings ahead of the 7 Nov 2026 opening', n923: 'Visits to the shirt and print shop', ldtv: 'Awareness (coming soon)', vdk: 'Awareness (coming soon)', dbox: 'Awareness (coming soon)', robin: 'Awareness (coming soon)', gaffer: 'Awareness (coming soon)' };
['brl', 'lispa', 'n923'].forEach(k => { BR[k].live = !!BR[k].url; }); Object.keys(GOAL).forEach(k => { BR[k].goal = GOAL[k]; if (!BR[k].live) BR[k].live = false; });
export const BR_ORDER = ['brl', 'lispa', 'ldtv', 'n923', 'vdk', 'dbox', 'robin', 'gaffer'];
const valid = k => { const b = BR[k]; return !!(b && b.name && b.sub && b.cta && b.icon && b.hero && Array.isArray(b.copy) && b.copy.length); };
const live = () => BR_ORDER.filter(valid);

const Q = new URLSearchParams(location.search);
const DEV = { k: valid(Q.get('ad')) ? Q.get('ad') : '', f: Q.get('adfmt') || '' };
const OPEN = Date.UTC(2026, 10, 7), daysTo = () => Math.max(0, Math.ceil((OPEN - Date.now()) / 864e5));
const tagUrl = (u, m) => { try { const x = new URL(u); x.searchParams.set('utm_source', 'mast'); x.searchParams.set('utm_medium', m || 'toast'); x.searchParams.set('utm_campaign', 'house'); return x.toString(); } catch (e) { return u; } };
const LOGK = 'adlog';
const alog = (k, ev, fmt) => { if (!BR[k]) return; const l = store.get(LOGK, []); l.push({ t: Date.now(), k, ev, f: fmt }); store.set(LOGK, l.slice(-400)); };
const DAY = () => new Date().toISOString().slice(0, 10), CAP = 3, FU_MS = 72 * 3600e3, FULL_GAP = 7 * 864e5;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const anim = () => getAnim() === 'full', still = () => getAnim() === 'off';
const S = { fail: 0, sess: 0, n: 0, banner: null, timer: null, full: false, why: null, route: '', watched: false };

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
  if (k === 'lispa') { const n = daysTo(); return { h: n > 0 ? `Opens in ${n} day${n === 1 ? '' : 's'} · Book a treatment` : 'Now open · Book a treatment', d: '', cta: b.cta2 || b.cta, fu: false }; }
  return { h: c.h, d: c.d || '', cta: c.cta || b.cta2 || b.cta, fu: c.id === 'f' };
}
function pick(avoid, liveOnly) {
  let k = DEV.k; const L = live().filter(q => !liveOnly || BR[q].live);
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

const link = (b, cls, inner, label, med) => b.url && b.live ? `<a class="${cls}" data-med="${med || 'toast'}" href="${esc(tagUrl(b.url, med))}" target="_blank" rel="noopener sponsored"${label ? ` aria-label="${esc(label)}"` : ''}>${inner}</a>` : `<span class="${cls} soon">${inner}</span>`;
const img = (a, alt = '', cls = '') => `<img${cls ? ` class="${cls}"` : ''} src="${a[0]}" width="${a[1]}" height="${a[2]}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const kick = () => `<span class="ad-k">Sponsored · House ad</span>`;
const chip = () => `<button type="button" class="ad-why" data-why aria-label="Why am I seeing this ad?"><i aria-hidden="true">i</i></button>`;
const presenter = (b, k) => b.who ? `<span class="ad-pres" aria-hidden="true">${avatar(b.who, 'smile', 'ad-av')}<em>${esc(b.who)} presents</em></span>` : '';
const root = () => { let r = $('#ads'); if (!r) { r = document.createElement('div'); r.id = 'ads'; document.body.appendChild(r); } return r; };
let cssP = null; const css = () => cssP || (cssP = new Promise(res => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/ads.css'; l.onload = l.onerror = res; document.head.appendChild(l); }));

/* ---- toast: one small pop-up at a time, auto-dismisses ---- */
function killBanner(why) { clearTimeout(S.timer); S.timer = null; const el = S.banner; S.banner = null; if (el) { if (why !== 'x') alog(el.dataset.adk, 'dismissed', 'toast-auto'); el.classList.add('out'); setTimeout(() => el.remove(), anim() ? 260 : 0); } }
function fillToast(el, a) {
  const b = a.b, shot = (b.shots || [])[0];
  el.dataset.adk = a.k; el.className = `ad-toast ad-${a.k}`; if (b.color) el.style.setProperty('--a', b.color);
  el.innerHTML = `<div class="ad-tb" tabindex="0" role="button" aria-expanded="false" aria-label="${esc(b.name)}: ${esc(a.h)}. Show preview"><span class="ad-ic">${img(b.icon, '')}</span><span class="ad-tx"><b>${esc(b.name)}</b><span class="ad-line">${esc(a.h)}</span></span></div>
   <button type="button" class="ad-x" aria-label="Close ad">&times;</button>
   <div class="ad-trow"><span class="ad-k">Sponsored</span><span class="grow"></span>${chip()}${link(b, 'ad-cta', esc(a.cta), '', 'toast')}</div>
   ${shot ? `<div class="ad-prev"><img src="${shot}" alt="${esc(b.name)} preview" loading="lazy" decoding="async"></div>` : ''}`;
  hydrate(el);
  const tb = $('.ad-tb', el), arm = () => { clearTimeout(S.timer); S.timer = setTimeout(() => killBanner('auto'), +Q.get('adms') || 8000); };
  const tog = () => { if (!shot) return; const o = el.classList.toggle('exp'); tb.setAttribute('aria-expanded', o); if (o) clearTimeout(S.timer); else arm(); };
  tb.onclick = tog; tb.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } };
  el.addEventListener('pointerenter', () => clearTimeout(S.timer)); el.addEventListener('pointerleave', () => { if (!el.classList.contains('exp') && S.banner === el) arm(); });
  arm();
}
const tday = () => { const c = store.get('ads.tday', null); return c && c.d === DAY() ? c.n : 0; };
const TOAST_ROUTES = ['review', 'coach', 'collection', 'trophies', 'masters', 'secrets', 'voyage'];
async function toast(force) {
  if (force && off()) return;
  if (!force) { const [r, sub] = parts(); if (!ok() || hidden() || S.banner || S.sess >= 1 || tday() >= 2 || Date.now() - S.fail < 60000 || sub || !TOAST_ROUTES.includes(r)) return; }
  const a = pick(null, !DEV.k); if (!a) return; if (!force) { S.sess++; store.set('ads.tday', { d: DAY(), n: tday() + 1 }); }
  alog(a.k, 'shown', 'toast'); await css(); killBanner();
  const el = document.createElement('aside'); el.setAttribute('aria-label', 'Advertisement'); fillToast(el, a); root().appendChild(el); S.banner = el;
}

/* ---- sponsor chips: tiny static labels, never over a board or clock ---- */
const TAIL = { brl: 'live music, no flag fall', lispa: 'relax, it\'s only a pawn', ldtv: 'tune in, it is live', n923: 'good paper, good notes', vdk: 'steady hands, steady moves', dbox: 'good things come in boxes', robin: 'every shop on one map', gaffer: 'captain your week' };
const SLOT = { streak: ['brl', 'Streak powered by BeatRouteLive'], log: ['n923', 'Log paper by Nine23'], chart: ['robin', 'Charts by Robin · every shop on one map'], eval: ['ldtv', 'Analysis brought to you by LDTV'], crew: ['n923', 'Crew kit by Nine23'], opp: ['gaffer', 'Match sponsored by The Gaffer'] };
const RX = /^(watch|drill|round|session) (complete|over)/i;
const slotFor = () => {
  const [r, sub] = parts(), v = $('#view'); if (!v) return null;
  if (r === 'today' || r === 'watch' || r === 'drills') { const k = [...v.querySelectorAll('.k')].find(e => RX.test(e.textContent.trim())); if (k) { if (/^watch/i.test(k.textContent.trim())) S.watched = true; return ['streak', k.closest('.card') || k.parentElement, 'in']; } }
  const lg = $('.clog .cl-d', v); if (lg) return ['log', lg, 'after'];
  if (r === 'voyage' && !sub) { const s = $('h1 + .sub', v); if (s) return ['chart', s, 'after']; }
  if (r === 'masters' && !sub) { const s = $('h1 + .sub', v); if (s) return ['crew', s, 'after']; }
  if (r === 'play' && !sub) { const s = $('h1 + .sub', v); if (s) return ['opp', s, 'after']; }
  if (r === 'review' && sub) { const h = $('h1', v); if (h) return ['eval', $('h1 + .sub', v) || h, 'after']; }
  return null;
};
const chipEl = (k, text) => { const b = BR[k]; return `<button type="button" class="ad-chip ad-${k}" data-why data-adk="${k}" aria-label="Sponsored: ${esc(text)}. Why am I seeing this?"><span class="ad-ci">${img(b.icon, '')}</span><span>${esc(text)}</span>${b.live ? '' : '<em class="ad-soon">coming soon</em>'}</button>`; };
async function chips() {
  document.querySelectorAll('.ad-chip').forEach(c => { if (!c.isConnected || !c.closest('#view, .ad-deckfo')) c.remove(); });
  if (off() || hidden() || document.hidden || busy()) { document.querySelectorAll('#view .ad-chip').forEach(c => c.remove()); return; }
  const s = slotFor(); if (!s) return; const [slot, el, mode] = s; if ((mode === 'in' ? el : el.parentElement || el).querySelector('.ad-chip, .ad-chipw')) return;
  const pref = SLOT[slot], L = live(); let k = DEV.k || (pref && L.includes(pref[0]) ? pref[0] : L[0]); if (!k || !BR[k] || !valid(k)) return;
  const text = (!DEV.k || DEV.k === (pref || [])[0]) && pref && k === pref[0] ? pref[1] : `Sponsored by ${BR[k].name}: ${TAIL[k] || BR[k].sub}`;
  await css(); const w = document.createElement('div'); w.className = 'ad-chipw'; w.innerHTML = chipEl(k, text);
  if (mode === 'in') el.appendChild(w); else el.after(w); alog(k, 'shown', 'chip');
}
/* deck: a painted sponsor board that rotates brands */
let boardT = null;
function boardSVG(k, tall) {
  const b = BR[k], t = (TAIL[k] ? `${b.name}: ${TAIL[k]}` : b.name), W = 380, x = tall ? 400 : 1100, y = tall ? 60 : 50;
  const cut = s => s.length > 34 ? s.slice(0, 33) + '…' : s;
  return `<g class="ad-board" data-adk="${k}" transform="translate(${x} ${y}) scale(1.35)" role="img" aria-label="Sponsor board: ${esc(t)}"><rect width="${W}" height="64" rx="8" fill="#3b2a1a" stroke="#C9A24B" stroke-width="3" opacity=".94"/><rect x="8" y="8" width="48" height="48" rx="8" fill="#fff" opacity=".92"/><image href="${b.icon[0]}" x="10" y="10" width="44" height="44" preserveAspectRatio="xMidYMid meet"/><text x="68" y="26" font-size="13" fill="#C9A24B" font-family="inherit" letter-spacing="2">PRESENTED BY${b.live ? '' : ' · COMING SOON'}</text><text x="68" y="48" font-size="19" fill="#f7ebcf" font-family="inherit">${esc(cut(t))}</text></g>`;
}
function deck() {
  clearInterval(boardT); boardT = null; const svg = $('#deck svg.deck'); if (!svg) return;
  const old = svg.querySelector('.ad-board'); if (off() || hidden()) { old && old.remove(); return; }
  const L = live(), tall = svg.getAttribute('viewBox').split(' ')[3] > svg.getAttribute('viewBox').split(' ')[2];
  let i = DEV.k ? L.indexOf(DEV.k) : (store.get('ads.board', 0) || 0) % L.length; if (i < 0) i = 0;
  const put = () => { if (!svg.isConnected || off() || hidden() || document.hidden) return; const k = L[i % L.length]; const g = svg.querySelector('.ad-board'); const n = document.createElementNS('http://www.w3.org/2000/svg', 'g'); n.innerHTML = boardSVG(k, tall); const nb = n.firstChild; nb.style.cssText = 'opacity:0;transition:opacity .6s'; (g ? g.replaceWith(nb) : svg.appendChild(nb)); requestAnimationFrame(() => requestAnimationFrame(() => { nb.style.opacity = 1; })); if (!DEV.k) store.set('ads.board', ++i % L.length); alog(k, 'shown', 'board'); };
  put(); if (L.length > 1 && !DEV.k) boardT = setInterval(put, 25000);
}

/* ---- interstitial: at most once per 3 days, on the deck right after a finished watch ---- */
const T = s => `0:${String(Math.max(0, Math.ceil(s))).padStart(2, '0')}`;
async function interstitial(force) {
  if (off() || S.full || (!force && !ok())) return; const a = pick(null, !DEV.k); if (!a) return; await css(); alog(a.k, 'shown', 'full');
  const b = a.b, prev = document.activeElement, rm = !anim(), poster = b.v ? b.v + '-916-p.webp' : '';
  S.full = true; killBanner();
  const el = document.createElement('div'); el.className = `ad-full ad-${a.k}`; el.dataset.adk = a.k; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Sponsored break');
  el.innerHTML = `<div class="ad-stage"><div class="ad-vid"${poster ? ` style="background-image:url(${poster})"` : ''}></div><div class="ad-fade"></div>
   <div class="ad-ftop">${kick()}<span class="ad-time" role="timer" aria-label="Ad time left">${T(15)}</span><span class="grow"></span>${chip()}</div>
   <div class="ad-fbot"><div class="ad-fcard"><span class="ad-ic">${img(b.icon, '')}</span><div class="ad-nw"><b>${esc(b.name)}</b><small>${esc(a.h)}</small></div>${link(b, 'ad-cta', esc(a.cta), '', 'full')}</div>
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
  sk.onclick = () => { if (open) { alog(a.k, 'dismissed', 'full'); done(); } };
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
function hide24() { store.set('ads.hide', Date.now() + 24 * 3600e3); killBanner(); document.querySelectorAll('.ad-chipw,.ad-board').forEach(n => n.remove()); clearInterval(boardT); paint(); }

/* ---- settings ---- */
function logTable() {
  let box = $('#ads-log'); if (!box) { const h = $('#ads-hide'); if (!h) return; box = document.createElement('div'); box.id = 'ads-log'; h.closest('.row').after(box); }
  const l = store.get(LOGK, []), t = {}; l.forEach(e => { const r = t[e.k] || (t[e.k] = { shown: 0, tapped: 0, dismissed: 0 }); r[e.ev]++; });
  const rows = Object.keys(t).map(k => `<tr><td>${esc(BR[k] ? BR[k].name : k)}</td><td>${t[k].shown}</td><td>${t[k].tapped}</td><td>${t[k].dismissed}</td></tr>`).join('');
  box.innerHTML = `<table class="ad-logt"><caption>Ad log (this device only)</caption><thead><tr><th>Brand</th><th>Shown</th><th>Tapped</th><th>Closed</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Nothing yet</td></tr>'}</tbody></table><button type="button" class="btn ghost sm" id="ads-logclr">Clear log</button>`;
  $('#ads-logclr', box).onclick = e => { e.stopPropagation(); store.set(LOGK, []); logTable(); };
}
function paint() {
  const m = $('#menu'); if (!m) return; logTable(); m.querySelectorAll('[data-ad]').forEach(b => b.classList.toggle('on', (b.dataset.ad === '1') === !off()));
  const h = $('#ads-hide'); if (h) { h.textContent = hidden() ? 'Ads hidden until ' + new Date(store.get('ads.hide', 0)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (tap to undo)' : 'Hide ads for 24h'; }
}
function bind() {
  const m = $('#menu'); if (!m) return;
  m.querySelectorAll('[data-ad]').forEach(b => b.onclick = e => { e.stopPropagation(); store.set('ads.off', b.dataset.ad === '0'); if (off()) { killBanner(); document.querySelectorAll('.ad-chipw,.ad-board').forEach(n => n.remove()); clearInterval(boardT); const f = $('#ads .ad-full'); if (f) { f.remove(); S.full = false; clearInterval(S.tick); S.esc = S.trap = null; } } paint(); if (!off()) refresh(); });
  const h = $('#ads-hide'); if (h) h.onclick = e => { e.stopPropagation(); if (hidden()) { store.set('ads.hide', 0); paint(); refresh(); } else hide24(); };
  const g = $('#gear'); if (g) g.addEventListener('click', paint); paint();
}

/* ---- view-change driver ---- */
const refresh = () => { chips(); deck(); };
let mo = null, mt = 0; const FAILRX = /\b(wrong|incorrect|not quite|blundered|you lose|you lost|checkmated|out of time|flagged|game over|resigned|time'?s up)\b/i;
function watchView() { const v = $('#view'); if (!v || mo) return; mo = new MutationObserver(() => { if (FAILRX.test(v.innerText || '')) S.fail = Date.now(); clearTimeout(mt); mt = setTimeout(chips, 250); }); mo.observe(v, { childList: true, subtree: true }); }
function onView() {
  S.n++; S.route = location.hash; clearTimeout(S.timer); killBanner(); S.timer = null; watchView();
  setTimeout(refresh, 400); setTimeout(refresh, 1500);
  if (S.full) return;
  if (off() || DEV.f) return;
  const [r] = parts();
  if (r === 'today' && S.watched && !hidden() && Date.now() - (store.get('ads.full', 0) || 0) > FULL_GAP) { S.watched = false; store.set('ads.full', Date.now()); S.timer = setTimeout(() => interstitial(), 1200); return; }
  if (hidden() || !calm() || Date.now() - S.fail < 60000) return;
  if (Math.random() < .5) S.timer = setTimeout(() => toast(), 3000 + Math.random() * 2000);
}
function devRun() {
  if (!DEV.f || off()) return; const f = DEV.f;
  setTimeout(() => { S.route = location.hash; if (f === 'toast' || f === 'banner' || f === 'native') toast(true); else if (f === 'full') interstitial(true); else if (f === 'chip') refresh(); }, 700);
}
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[rel~=sponsored]'); if (a) { const x = a.closest('[data-adk]'); if (x) { markEng(x.dataset.adk); alog(x.dataset.adk, 'tapped', a.dataset.med || 'toast'); } return; }
  const w = e.target.closest && e.target.closest('[data-why]'); if (w) { const x = w.closest('[data-adk]'); why(x ? x.dataset.adk : null); return; }
  const c = e.target.closest && e.target.closest('.ad-x'); if (c) { const t = c.closest('.ad-toast'); if (t) alog(t.dataset.adk, 'dismissed', 'toast'); killBanner('x'); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Tab' && S.full && S.trap && !S.why) { S.trap(e); return; }
  if (e.key !== 'Escape') return; if (S.why) { S.whyClose(); e.stopPropagation(); return; } if (S.esc) S.esc();
}, true);
addEventListener('hashchange', onView);
document.addEventListener('visibilitychange', () => { if (document.hidden) killBanner(); });
window.__mastAds = { BR, valid, live, state: () => ({ ...S, banner: !!S.banner, cap: capGet(), eng: eng() }), interstitial, toast, chips, deck };
bind(); onView(); devRun();
