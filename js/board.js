const G = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const FILES = 'abcdefgh';
// Renders the board into el. state: {game, flip, last:[from,to], sel, targets:[{to,cap}]}
export function drawBoard(el, st, onSquare) {
  el.className = 'board'; el.innerHTML = '';
  const ranks = st.flip ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  const files = st.flip ? [...FILES].reverse() : [...FILES];
  ranks.forEach((r, ri) => files.forEach((f, fi) => {
    const sq = f + r, d = document.createElement('div');
    d.className = 'sq ' + ((FILES.indexOf(f) + r) % 2 ? 'l' : 'd');
    if (st.last && st.last.includes(sq)) d.classList.add('last');
    if (st.sel === sq) d.classList.add('sel');
    const t = st.targets && st.targets.find(x => x.to === sq);
    if (t) d.classList.add('tgt', ...(t.cap ? ['cap'] : []));
    const p = st.game.get(sq);
    if (p) d.innerHTML = `<span class="p ${p.color}">${G[p.type]}︎</span>`;
    if (fi === 0) d.insertAdjacentHTML('beforeend', `<span class="co" style="left:auto;right:3px;top:1px;bottom:auto">${r}</span>`);
    if (ri === 7) d.insertAdjacentHTML('beforeend', `<span class="co">${f}</span>`);
    d.onclick = () => onSquare(sq);
    el.appendChild(d);
  }));
}
