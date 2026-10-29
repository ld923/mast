/* shared memoised JSON loader: one network fetch per path */
const M = new Map();
export function loadJSON(path) {
  if (!M.has(path)) M.set(path, fetch(path).then(r => r.ok ? r.json() : Promise.reject(path)).catch(e => { M.delete(path); throw e; }));
  return M.get(path);
}
