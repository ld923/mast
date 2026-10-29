const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
export function md(src) {
  const out = []; let list = false, para = [];
  const flush = () => { if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`); para = []; };
  const close = () => { if (list) out.push('</ul>'); list = false; };
  for (const line of src.split('\n')) {
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) { flush(); close(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); }
    else if ((m = line.match(/^\s*[-*]\s+(.*)/))) { flush(); if (!list) out.push('<ul>'); list = true; out.push(`<li>${inline(m[1])}</li>`); }
    else if (!line.trim()) { flush(); close(); }
    else para.push(line.trim());
  }
  flush(); close();
  return out.join('\n');
}
