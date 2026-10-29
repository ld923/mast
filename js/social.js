// Relationships: per-character affinity, levels, birthdays/anniversaries, crew disagreements.
import { store, getName } from './ui.js';
import { CH } from './portraits.js';
export const LEVELS = [['Stranger', 0], ['Acquaintance', 8], ['Student', 25], ['Protégé', 60]];
const get = () => store.get('affinity', {}) || {};
export const affinity = n => get()[n] || 0;
export function bond(n, pts = 1) { if (!CH[n]) return; const a = get(); a[n] = (a[n] || 0) + pts; store.set('affinity', a); }
export const level = n => { const v = affinity(n); let i = 0; LEVELS.forEach(([, t], k) => { if (v >= t) i = k; }); const nx = LEVELS[i + 1]; return { i, name: LEVELS[i][0], v, next: nx ? nx[0] : null, to: nx ? nx[1] : null }; };
export const BIRTHDAY = { Tal: [11, 9], Capablanca: [11, 19], Morphy: [6, 22], Kasparov: [4, 13], Carlsen: [11, 30], Leela: [1, 9] };
const BLINE = {
  Tal: 'Today I am a year older, my friend, and still I cannot resist a sacrifice. Come, celebrate with a combination.',
  Capablanca: 'My birthday. In Havana we would have played under the fans until dawn. Today, one clean ending is my gift.',
  Morphy: 'The twenty-second of June. A gentleman marks the day quietly, sir. Develop your pieces and I shall be content.',
  Kasparov: 'Thirteenth of April! A day for initiative. Do not waste it on passive moves.',
  Carlsen: 'Birthday. Not a big deal. Play a long game, grind it out, that is the present.',
  Leela: 'January 2018: my first commit. I have played many games since. I still learn from every one.'
};
const GREET = [
  n => `Ah, ${getName()}. Back again.`,
  () => `Good to see you on deck, ${getName()}.`,
  () => `${getName()}! I saved a position for you.`,
  () => 'My protégé. The crew talks about your progress.'
];
export const greeting = n => GREET[level(n).i](n);
/* special deck line for a birthday or a PGN game anniversary (data: [{name, date:'YYYY.MM.DD', white, black, event}]) */
export function rareMoment(games = [], now = new Date()) {
  const m = now.getMonth() + 1, d = now.getDate();
  for (const [n, [bm, bd]] of Object.entries(BIRTHDAY)) if (bm === m && bd === d) return { who: n, kind: 'birthday', line: BLINE[n] };
  const mm = String(m).padStart(2, '0'), dd = String(d).padStart(2, '0');
  const g = games.find(x => x.date && x.date.slice(5) === `${mm}.${dd}`);
  if (g) return { who: g.m, kind: 'anniversary', line: `On this day in ${g.date.slice(0, 4)}: ${g.white} v ${g.black}, ${g.event}. I remember every move.` };
  return null;
}
/* two masters disagree; the engine verdict settles it. pick from the move type: sacrifice/attack vs simplify/trade */
const STANCE = {
  Tal: ['Sacrifice! Throw the piece in.', 'attack'], Kasparov: ['Attack now, before he consolidates!', 'attack'], Morphy: ['Open the lines, sir!', 'attack'],
  Capablanca: ['Simplify. Trade and win the ending.', 'quiet'], Carlsen: ['Just improve a piece. No need to force it.', 'quiet'], Leela: ['Keep the tension. The evaluation prefers patience.', 'quiet']
};
export function disagreement({ bestIsAggressive, seed = Math.random() }) {
  const att = ['Tal', 'Kasparov', 'Morphy'], qu = ['Capablanca', 'Carlsen'];
  const a = att[Math.floor(seed * att.length)], b = qu[Math.floor(seed * 7) % qu.length];
  return { a, la: STANCE[a][0], b, lb: STANCE[b][0], winner: bestIsAggressive ? a : b, loser: bestIsAggressive ? b : a };
}
export const isAggressive = san => /x|\+/.test(san || '');
