/**
 * fillGrid(items, cols)
 *
 * Given a list of items and a column count, returns the list padded
 * with recycled items so the last row is always completely full.
 * Each filler item gets a `_fillerId` key so React won't complain
 * about duplicate keys, and `_isFiller: true` so the component can
 * render them with reduced opacity / pointer-events-none.
 *
 * If items.length is already a multiple of cols, or is 0, returns as-is.
 */
export function fillGrid(items, cols) {
  if (!items.length || items.length % cols === 0) return items;
  const remainder = items.length % cols;
  const needed    = cols - remainder;
  const fillers   = [];
  for (let i = 0; i < needed; i++) {
    // Cycle through existing items to pick fillers
    const source = items[i % items.length];
    fillers.push({ ...source, _fillerId: `filler_${i}_${source._id}`, _isFiller: true });
  }
  return [...items, ...fillers];
}
