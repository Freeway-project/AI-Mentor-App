/** Append a cache-busting query param so the browser reloads images/videos after replace. */
export function withCacheBust(url: string): string {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}`;
}
