// In-browser Stockfish 18 (lite, single-threaded WASM, no SharedArrayBuffer needed). One shared worker, lazy loaded, queued requests.
// const e = getEngine(); await e.init(); await e.analyse(fen,{depth:12,multipv:3}) -> {lines:[{pv:[uci],score:{cp|mate},depth}],bestmove,depth}
//   await e.best(fen,{elo:1200,movetime:400}) -> uci;  e.stop();  scoreWhite(res.lines[0], fen) -> cp from White's side (mate = +-100000-ish)
import { loadingState } from './ui.js';
const URL_JS = new URL('../vendor/stockfish/stockfish-18-lite-single.js', import.meta.url).href;
export const ENGINE_VERSION = 'Stockfish 18 (stockfish.js 18.0.5, lite single-thread WASM)';

/* 4-field FEN with python-chess semantics (en passant only when a legal ep capture exists): the key used by repertoire.json and the master index */
export const fen4 = g => { const p = g.fen().split(' '); let ep = p[3]; if (ep !== '-' && !g.moves({ verbose: true }).some(m => m.flags.includes('e'))) ep = '-'; return p.slice(0, 3).join(' ') + ' ' + ep; };
export const scoreWhite = (line, fen) => {
  if (!line) return 0; const s = line.score || {}, sign = fen.split(' ')[1] === 'b' ? -1 : 1;
  return sign * (s.mate != null ? (s.mate > 0 ? 100000 - s.mate : -100000 - s.mate) : (s.cp || 0));
};

export class Engine {
  constructor() { this.w = null; this.ready = null; this.cur = null; this.q = Promise.resolve(); this.opts = {}; this.gen = 0; this.listeners = new Set(); }
  init() {
    if (this.ready) return this.ready;
    this.ready = new Promise((res, rej) => {
      let w; try { w = new Worker(URL_JS); } catch (e) { this.ready = null; return rej(e); }
      this.w = w; let st = 0; const t = setTimeout(() => { this.ready = null; try { w.terminate(); } catch (_) { } this.w = null; rej(new Error('engine load timeout')); }, 45000);
      w.onerror = e => { clearTimeout(t); this.ready = null; this.w = null; rej(new Error('engine failed to load')); };
      w.onmessage = e => {
        const l = typeof e.data === 'string' ? e.data : '';
        if (st === 0 && l.startsWith('uciok')) { st = 1; w.postMessage('setoption name Hash value 32'); w.postMessage('isready'); }
        else if (st === 1 && l.startsWith('readyok')) { st = 2; clearTimeout(t); w.onmessage = e2 => this._line(e2.data); res(this); }
      };
      w.postMessage('uci');
    });
    return this.ready;
  }
  _line(l) { if (typeof l !== 'string') return; const c = this.cur; if (c) c.onLine(l); }
  _set(name, v) { const k = name; if (this.opts[k] === v) return; this.opts[k] = v; this.w.postMessage(`setoption name ${name} value ${v}`); }
  _run(fen, { depth, movetime, multipv = 1, elo, skill, timeout }) {
    return new Promise(async (resolve, reject) => {
      try { await this.init(); } catch (e) { return reject(e); }
      const w = this.w, my = this.gen;
      if (skill != null || elo != null) {
        if (elo != null && elo >= 1350) { this._set('Skill Level', 20); this._set('UCI_LimitStrength', 'true'); this._set('UCI_Elo', Math.min(3190, Math.round(elo))); }
        else { this._set('UCI_LimitStrength', 'false'); this._set('Skill Level', skill != null ? skill : Math.max(0, Math.min(10, Math.round(((elo || 1100) - 800) / 55)))); }
      } else { this._set('UCI_LimitStrength', 'false'); this._set('Skill Level', 20); }
      this._set('MultiPV', multipv);
      const lines = {}; let top = 0, dep = 0, done = false, timer = 0, killer = 0;
      const finish = (bm) => {
        if (done) return; done = true; clearTimeout(timer); clearTimeout(killer); this.cur = null;
        const arr = Object.keys(lines).map(Number).sort((a, b) => a - b).map(k => lines[k]);
        resolve({ lines: arr, bestmove: bm && bm !== '(none)' ? bm : (arr[0] && arr[0].pv[0]) || null, depth: dep });
      };
      this.cur = {
        stop: () => { w.postMessage('stop'); },
        onLine: l => {
          if (l.startsWith('info') && l.includes(' pv ')) {
            const m = /multipv (\d+)/.exec(l), k = m ? +m[1] : 1, d = /depth (\d+)/.exec(l), sc = /score (cp|mate) (-?\d+)/.exec(l), pv = l.split(' pv ')[1].trim().split(/\s+/);
            if (!sc) return; if (d) dep = Math.max(dep, +d[1]);
            lines[k] = { pv, score: sc[1] === 'cp' ? { cp: +sc[2] } : { mate: +sc[2] }, depth: d ? +d[1] : 0 }; top = Math.max(top, k);
            if (l.includes('lowerbound') || l.includes('upperbound')) lines[k].bound = true;
          } else if (l.startsWith('bestmove')) finish(l.split(/\s+/)[1]);
        }
      };
      w.postMessage('ucinewgame'); w.postMessage('position fen ' + fen);
      w.postMessage(movetime ? `go movetime ${Math.round(movetime)}` : `go depth ${depth || 12}`);
      const limit = timeout || (movetime ? movetime + 8000 : 40000);
      timer = setTimeout(() => { if (done) return; w.postMessage('stop'); killer = setTimeout(() => { if (done) return; this._reset(); finish(null); }, 3000); }, limit);
    });
  }
  _reset() { try { this.w.terminate(); } catch (_) { } this.w = null; this.ready = null; this.opts = {}; this.gen++; }
  /* queued: one search at a time */
  analyse(fen, o = {}) { const p = this.q.then(() => o.cancelled && o.cancelled() ? { lines: [], bestmove: null, depth: 0, cancelled: true } : this._run(fen, o)); this.q = p.catch(() => { }); return p; }
  async best(fen, o = {}) { const r = await this.analyse(fen, { movetime: 500, ...o, multipv: o.multipv || 1 }); return r.bestmove; }
  stop() { if (this.cur) this.cur.stop(); }
}
let shared = null;
export const getEngine = () => shared || (shared = new Engine());

/* designed loading state: crew tip while the 7 MB engine downloads (cached after first load) */
export async function engineLoading(el, line = 'Waking the engine room...') {
  const e = getEngine(); if (e.ready && e.w) { try { await e.ready; return e; } catch (_) { } }
  if (el) el.innerHTML = loadingState(line);
  await e.init(); return e;
}

/* ---------- eval bar (vertical, Gaffer style) ---------- */
const CSS = `.evb{position:relative;width:22px;min-height:120px;border-radius:6px;overflow:hidden;background:#1b2530;border:1px solid var(--glass-b,#345);flex:none;align-self:stretch;font:700 10px var(--f-disp,sans-serif)}
.evb .w{position:absolute;left:0;right:0;bottom:0;background:#e9eef2;transition:height .5s cubic-bezier(.2,.8,.2,1)}
.evb.flip .w{bottom:auto;top:0}
.evb .mid{position:absolute;left:0;right:0;top:50%;height:1px;background:var(--a,#C9A24B);opacity:.6}
.evb .n{position:absolute;left:0;right:0;text-align:center;padding:2px 0;letter-spacing:.02em;font-variant-numeric:tabular-nums}
.evb .n.t{top:0;color:#e9eef2}.evb .n.b{bottom:0;color:#1b2530}
.evb.flip .n.t{top:auto;bottom:0}.evb.flip .n.b{bottom:auto;top:0}
html[data-anim=off] .evb .w,html[data-anim=reduced] .evb .w{transition:none}`;
export class EvalBar {
  constructor(el, { flip = false } = {}) {
    if (!document.getElementById('mast-evb-css')) { const s = document.createElement('style'); s.id = 'mast-evb-css'; s.textContent = CSS; document.head.appendChild(s); }
    this.el = el; el.classList.add('evb'); el.classList.toggle('flip', !!flip); el.setAttribute('role', 'img');
    el.innerHTML = '<div class="w"></div><div class="mid"></div><span class="n t"></span><span class="n b"></span>'; this.set(0);
  }
  /* cp from White's side; mate: pass cp>=90000 style or opts.mate (+/- moves) */
  set(cp, mate) {
    const f = mate != null ? (mate > 0 ? 1 : 0) : 1 / (1 + Math.exp(-cp / 220)), pct = Math.max(3, Math.min(97, f * 100));
    this.el.querySelector('.w').style.height = pct + '%';
    const txt = mate != null ? 'M' + Math.abs(mate) : Math.abs(cp) >= 90000 ? 'M' : (Math.abs(cp) / 100).toFixed(1);
    const white = (mate != null ? mate > 0 : cp >= 0), t = this.el.querySelector('.n.t'), b = this.el.querySelector('.n.b');
    t.textContent = white ? '' : txt; b.textContent = white ? txt : '';
    this.el.setAttribute('aria-label', `Evaluation ${white ? 'White' : 'Black'} ${txt}`);
  }
}
