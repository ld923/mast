// Mast sky: time of day, weather-from-form and the shared sky/sea painter used by the deck, the cabin porthole and harbours.
// Debug overrides: ?time=dawn|day|golden|dusk|night  &weather=calm|fair|cloudy|storm
import { store } from './ui.js';

export const TIMES = ['dawn', 'day', 'golden', 'dusk', 'night'];
export const WEATHERS = ['calm', 'fair', 'cloudy', 'storm'];
const q = k => { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } };

export function timeOfDay(d = new Date()) {
  const f = q('time'); if (TIMES.includes(f)) return f;
  const h = d.getHours() + d.getMinutes() / 60;
  return h < 5 ? 'night' : h < 7.5 ? 'dawn' : h < 17 ? 'day' : h < 19.5 ? 'golden' : h < 21 ? 'dusk' : 'night';
}
/* form: last 20 puzzle results (mast.pz, 0/1) plus the most recent 30 drill Leitner boxes (box>1 = passed last time) */
export function formValue() {
  const pz = (store.get('pz', []) || []).slice(-20);
  const lt = Object.values(store.get('leitner', {}) || {}).slice(-30).map(b => (b && b.box > 1) ? 1 : 0);
  const all = [...pz, ...lt];
  return all.length < 3 ? null : all.reduce((a, b) => a + b, 0) / all.length;
}
export function weather() {
  const f = q('weather'); if (WEATHERS.includes(f)) return f;
  const v = formValue(); if (v == null) return 'fair';
  return v >= .75 ? 'calm' : v >= .55 ? 'fair' : v >= .35 ? 'cloudy' : 'storm';
}
export const WEATHER_WORD = { calm: 'Calm seas', fair: 'Fair wind', cloudy: 'Choppy water', storm: 'Heavy weather' };

/* palettes: sky stops top→horizon, sea horizon→deep, light tint over the ship, star opacity */
export const PAL = {
  dawn: { sky: ['#26345f', '#7d5684', '#ec9c80', '#ffd9a8'], sea: ['#d6a39a', '#5a6283', '#1c2846'], sun: { c: '#fff0cc', g: '#ffb08a', x: .2, y: .9, r: 30 }, tint: ['#ff8f70', .1], stars: .2, haze: '#f6bf9f', far: ['#7a6688', '#a98597'], cloud: ['#ffd8c4', '#c88b98'], lamp: .35 },
  day: { sky: ['#2370b8', '#4f9fdb', '#9fd0ef', '#e2f2f7'], sea: ['#8fcfdc', '#2b89a6', '#0c425e'], sun: { c: '#fffdf0', g: '#fff1b8', x: .8, y: .2, r: 28 }, tint: ['#fff', 0], stars: 0, haze: '#d3ebf3', far: ['#5d8ea6', '#9cc4d4'], cloud: ['#ffffff', '#b9cfdf'], lamp: .12 },
  golden: { sky: ['#2c4479', '#8f6880', '#ee9858', '#ffd77c'], sea: ['#f6bd6a', '#a9603f', '#24294a'], sun: { c: '#fff0b0', g: '#ffad42', x: .64, y: .84, r: 40 }, tint: ['#ff9940', .12], stars: 0, haze: '#fbc67e', far: ['#7a4f62', '#c58a72'], cloud: ['#ffe0b0', '#c97b6a'], lamp: .3 },
  dusk: { sky: ['#0b1340', '#33275e', '#9a4469', '#ee7a5a'], sea: ['#c0687a', '#3b2b51', '#0c122d'], sun: { c: '#ffb07a', g: '#ff6a50', x: .42, y: 1.03, r: 40 }, tint: ['#30195a', .3], stars: .55, haze: '#c46877', far: ['#2b2246', '#5a3a5e'], cloud: ['#d58a8e', '#4e3462'], lamp: .7 },
  night: { sky: ['#02050e', '#061127', '#0c203e', '#173456'], sea: ['#2b4c6d', '#0b2135', '#030a15'], moon: { x: .72, y: .2, r: 24 }, tint: ['#05102c', .42], stars: 1, haze: '#1d3a5c', far: ['#0a1828', '#13283e'], cloud: ['#2c4262', '#101c30'], lamp: 1 }
};
const WX = {
  calm: { n: 2, veil: 0, chop: .5, caps: 0 },
  fair: { n: 4, veil: 0, chop: 1, caps: .2 },
  cloudy: { n: 7, veil: .22, chop: 1.6, caps: .5, grey: '#8d98a4' },
  storm: { n: 10, veil: .5, chop: 2.4, caps: .9, grey: '#3e4854', rain: true }
};
export const lampLevel = t => PAL[t].lamp;

const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const f1 = n => Math.round(n * 10) / 10;
let UID = 0;

/* cloud: a cluster of lobes with a shaded underside */
function cloud(x, y, s, top, under, op) {
  const lobes = [[-60, 0, 46, 22], [-20, -16, 42, 30], [26, -10, 48, 28], [66, 4, 36, 18], [0, 6, 90, 20]];
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * 100) / 100})" opacity="${op}">
   ${lobes.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy + 6}" rx="${rx}" ry="${ry}" fill="${under}"/>`).join('')}
   ${lobes.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx * .94}" ry="${ry * .9}" fill="${top}"/>`).join('')}</g>`;
}

/* skyParts: returns svg fragments. W,H = box; hz = horizon y. Everything painted with 80u bleed so parallax never shows an edge. */
export function skyParts({ W, H, hz, t = timeOfDay(), w = weather(), small = false }) {
  const p = PAL[t], x = WX[w], id = 'sk' + (UID++), r = rng(7 + W + hz), B = 80;
  const storm = w === 'storm';
  const sky0 = storm ? mix(p.sky, x.grey, .55) : w === 'cloudy' ? mix(p.sky, x.grey, .25) : p.sky;
  const defs = `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1">${sky0.map((c, i) => `<stop offset="${(i / (sky0.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>
   <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1">${p.sea.map((c, i) => `<stop offset="${[0, .35, 1][i]}" stop-color="${storm ? mix([c], x.grey, .4)[0] : c}"/>`).join('')}</linearGradient>
   <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.haze}" stop-opacity="0"/><stop offset="1" stop-color="${p.haze}" stop-opacity="${storm ? .3 : .75}"/></linearGradient>
   <radialGradient id="${id}g"><stop offset="0" stop-color="${p.sun ? p.sun.g : '#cfe0ff'}" stop-opacity="${p.sun ? .85 : .35}"/><stop offset="1" stop-color="${p.sun ? p.sun.g : '#cfe0ff'}" stop-opacity="0"/></radialGradient>`;
  let sky = `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${hz + B + 2}" fill="url(#${id}s)"/>`;
  // stars
  if (p.stars && !storm) {
    let st = ''; const n = small ? 24 : 70;
    for (let i = 0; i < n; i++) { const sx = r() * (W + B) - B / 2, sy = Math.pow(r(), 1.6) * hz * .85, sr = r() < .1 ? 1.8 : r() * .9 + .5; st += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${f1(sr * (small ? .7 : 1))}" fill="#fff" opacity="${f1((.35 + r() * .6) * p.stars)}"${i % 6 === 0 ? ` class="sc-tw" style="animation-delay:-${f1(r() * 4)}s"` : ''}/>`; }
    sky += `<g>${st}</g>`;
  }
  // sun / moon
  const sunVis = !storm;
  if (p.sun && sunVis) {
    const sx = W * p.sun.x, sy = hz * p.sun.y, sr = p.sun.r * (small ? .6 : 1);
    sky += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${sr * 5}" fill="url(#${id}g)"/><circle cx="${f1(sx)}" cy="${f1(sy)}" r="${sr}" fill="${p.sun.c}"/>`;
  }
  if (p.moon && sunVis) {
    const mx = W * p.moon.x, my = hz * p.moon.y, mr = p.moon.r * (small ? .6 : 1);
    sky += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="${mr * 4}" fill="url(#${id}g)"/><circle cx="${f1(mx)}" cy="${f1(my)}" r="${mr}" fill="#f4f0dc"/><circle cx="${f1(mx + mr * .38)}" cy="${f1(my - mr * .2)}" r="${f1(mr * .86)}" fill="${sky0[1]}" opacity=".93"/>`;
  }
  // clouds (drift layer)
  const ct = storm ? '#5b6672' : w === 'cloudy' ? mix([p.cloud[0]], '#9aa4ae', .45)[0] : p.cloud[0];
  const cu = storm ? '#2f3842' : w === 'cloudy' ? mix([p.cloud[1]], '#6c7682', .4)[0] : p.cloud[1];
  let cl = ''; const n = small ? Math.ceil(x.n / 2) : x.n;
  for (let i = 0; i < n; i++) {
    const cx = (i + .5) / n * (W + 200) - 100 + (r() - .5) * 120, cy = hz * (.12 + r() * (storm ? .55 : .5)), s = (small ? .45 : 1) * (.7 + r() * .8) * (storm ? 1.5 : 1);
    cl += cloud(cx, cy, s, ct, cu, storm ? .95 : .8 + r() * .2);
  }
  sky += `<g class="sc-cloud">${cl}</g><rect x="${-B}" y="${hz * .55}" width="${W + 2 * B}" height="${hz * .45 + 2}" fill="url(#${id}h)"/>`;

  // sea: gradient, glitter path under the light, wave rows (seamless loop)
  let sea = `<rect x="${-B}" y="${hz}" width="${W + 2 * B}" height="${H - hz + B}" fill="url(#${id}w)"/>`;
  const L = p.sun && sunVis ? { x: W * p.sun.x, c: p.sun.c } : p.moon && sunVis ? { x: W * p.moon.x, c: '#e8eefc' } : null;
  if (L) {
    let gl = '';
    for (let i = 0; i < (small ? 10 : 22); i++) { const k = i / 22, gy = hz + 3 + Math.pow(k, 1.5) * (H - hz) * .9, gw = 8 + k * 70 * (small ? .5 : 1) * r(); gl += `<rect x="${f1(L.x - gw / 2 + (r() - .5) * k * 60)}" y="${f1(gy)}" width="${f1(gw)}" height="${f1(1.2 + k * 3)}" rx="2" fill="${L.c}" opacity="${f1(.75 - k * .5)}"/>`; }
    sea += `<g class="sc-glint">${gl}</g>`;
  }
  const rows = small ? 3 : 5;
  for (let j = 0; j < rows; j++) {
    const k = (j + 1) / rows, y = hz + Math.pow(k, 1.7) * (H - hz) * .95, P = 60 + k * 120, a = (2 + k * 6) * x.chop, sw = .8 + k * 2;
    let d = ''; for (let xx = -B - P; xx < W + B + P; xx += P) d += `M${f1(xx)} ${f1(y)}q${f1(P / 4)} ${f1(-a)} ${f1(P / 2)} 0`;
    const cap = x.caps > .3 && j > 0 ? `<path d="${d}" stroke="#fff" stroke-opacity="${f1(x.caps * .35)}" stroke-width="${f1(sw * .6)}" fill="none" transform="translate(${f1(P / 5)} ${f1(-a * .4)})"/>` : '';
    sea += `<g class="sc-wave" style="--p:${f1(P)}px;animation-duration:${f1((14 - k * 6) / Math.max(.6, x.chop * .6))}s"><path d="${d}" stroke="${t === 'night' ? '#8fb3d6' : '#ffffff'}" stroke-opacity="${f1(.12 + k * .16)}" stroke-width="${f1(sw)}" fill="none" stroke-linecap="round"/>${cap}</g>`;
  }
  // weather veil + flash + "dark UI at daytime" dim (CSS-driven so theme switches apply live)
  let veil = x.veil ? `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="${x.grey}" opacity="${x.veil * .5}" pointer-events="none"/>` : '';
  if (storm) veil += `<rect class="sc-flash" x="${-B}" y="${-B}" width="${W + 2 * B}" height="${hz + B}" fill="#e8f0ff" opacity="0" pointer-events="none"/>`;
  veil += `<rect class="sc-dim" x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="#04101e" pointer-events="none"/>`;
  let rain = '';
  if (x.rain) {
    let d1 = '', d2 = ''; const rr = rng(99);
    for (let i = 0; i < (small ? 30 : 90); i++) { const rx = rr() * (W + 2 * B) - B, ry = rr() * H, l = 18 + rr() * 26; { const sg = `M${f1(rx)} ${f1(ry)}l${f1(-l * .22)} ${f1(l)}M${f1(rx + H * .22)} ${f1(ry - H)}l${f1(-l * .22)} ${f1(l)}`; if (i % 2) d1 += sg; else d2 += sg; } }
    rain = `<g pointer-events="none" stroke="#cfe0f0" stroke-linecap="round"><path class="sc-rain" style="--h:${H}px" d="${d1}" stroke-width="1.6" stroke-opacity=".45"/><path class="sc-rain s2" style="--h:${H}px" d="${d2}" stroke-width="1.1" stroke-opacity=".3"/></g>`;
  }
  return { defs, sky, sea, veil, rain, pal: p, t, w, id };
}
/* crude hex mixing (palettes only) */
function hx(c) { c = c.replace('#', ''); if (c.length === 3) c = c.replace(/./g, m => m + m); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); }
export function mix(arr, to, k) { const b = hx(to); return arr.map(c => { const a = hx(c); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); }); }
/* a standalone little sky+sea svg (porthole, harbour backgrounds) */
export function miniSky(W, H, hz, opts = {}) {
  const s = skyParts({ W, H, hz, small: true, ...opts });
  return { defs: s.defs, body: s.sky + s.sea + s.veil + s.rain, pal: s.pal, t: s.t, w: s.w };
}
