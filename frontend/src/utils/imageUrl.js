/**
 * Normalize image paths from the database.
 *   "assets/products/x.jpg"   →  "/assets/products/x.jpg"
 *   "./assets/products/x.jpg" →  "/assets/products/x.jpg"
 *   "/assets/products/x.jpg"  →  unchanged
 *   "http://..."              →  unchanged
 *   null / undefined          →  fallback
 */
export function imgUrl(path, fallback = '/assets/products/1.png') {
  if (!path || typeof path !== 'string' || !path.trim()) return fallback;
  const p = path.trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('./')) return p.slice(1);
  if (p.startsWith('/'))  return p;
  return '/' + p;
}
