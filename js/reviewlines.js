// Context-aware review comments: chosen by phase + motif of the better move, filled with real values.
// motif: 'mate' | 'check' | 'capture' | 'promo' | 'castle' | 'develop' | 'quiet'
export function motifOf(bm, phase) {
  if (!bm) return 'quiet';
  if (/#/.test(bm.san)) return 'mate';
  if (bm.promotion) return 'promo';
  if (/O-O/.test(bm.san)) return 'castle';
  if (bm.captured) return 'capture';
  if (/\+/.test(bm.san)) return 'check';
  if (phase === 'opening' && /[NB]/.test(bm.piece.toUpperCase()) && /[18]$/.test(bm.from)) return 'develop';
  return 'quiet';
}
const T = {
  Morphy: {
    develop: ['{best} brings a new piece into play, sir; {played} does not. Development first.', 'Count your developed pieces after {played}. {best} adds one; that is the whole secret of the opening.'],
    castle: ['{best}, sir: the king to safety and a rook to the centre in one move. {played} leaves both waiting.'],
    capture: ['{best} takes what was offered. In the opening, free material taken with tempo is simply good chess, sir.'],
    check: ['{best}+ with tempo, sir, and the lines open. {played} gives him time.'],
    quiet: ['{played} costs {loss} pawns of advantage. {best} was the move that kept the pieces working together.'],
    mate: ['Mate was there with {best}, sir. Look for it before anything else.'], promo: ['{best} and the pawn crowns. A gentleman does not refuse a queen.']
  },
  Kasparov: {
    capture: ['{best}! The material was there and you missed it. {played} hands back {loss}.', 'You must calculate captures first! {best} wins, {played} drifts.'],
    check: ['{best}+ and the initiative is yours! {played} lets him breathe.'],
    quiet: ['{played} is passive. {best} keeps the pressure; a {loss} swing in one move is the price of passivity.', 'This was the critical moment. {best}, not {played}. Initiative!'],
    develop: ['Bring the pieces! {best} instead of {played}.'], castle: ['{best} now, and then we attack. {played} wastes the moment.'],
    mate: ['{best} is mate! You had it!'], promo: ['{best}: promote and the game is over.']
  },
  Capablanca: {
    capture: ['{best} simply wins material. In the ending one clean capture is worth more than any plan.', 'Take with {best}. Simple. {played} gives back {loss} for nothing.'],
    check: ['{best}+ drives the king where you want it. In endings, the checks that gain a tempo are the important ones.'],
    promo: ['{best}, and the pawn queens. Count the moves first; the count favoured you here.'],
    quiet: ['{played} loses {loss}. {best} keeps the king active and the pawns where they belong.', 'In this ending the king is a fighting piece. {best} uses it; {played} does not.'],
    mate: ['{best} mates. Even in the ending, look for the direct finish.'], castle: ['{best}. Safety first, then the plan.'], develop: ['{best}. Bring the last piece in, then simplify.']
  },
  Tal: {
    capture: ['{best}! Into the forest, my friend: the capture opens everything. {played} was too polite.'],
    check: ['{best}+! Checks first, my friend. {played} let the king sleep.'],
    mate: ['{best} and it is mate! The forest was very short tonight.'],
    quiet: ['{played}? The position wanted {best}. Sometimes the quiet move is the most dangerous one.'],
    develop: ['{best}, and every piece joins the party.'], castle: ['{best}, then we sacrifice. {played} is neither.'], promo: ['{best}: a new queen. Magic is mostly arithmetic.']
  }
};
export function contextLine(who, { motif, played, best, loss, i = 0 }) {
  const bank = T[who]; if (!bank) return null;
  const arr = bank[motif] || bank.quiet; const s = arr[i % arr.length];
  return s.replace('{played}', played).replace(/\{best\}\+?/g, m => best + (m.endsWith('+') && !/[+#]$/.test(best) ? '+' : '')).replace('{loss}', (loss / 100).toFixed(1));
}
