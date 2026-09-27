const warmed = new Set<string>();
const pending = new Set<HTMLImageElement>();

/**
 * Fetches and (where supported) decodes images ahead of time so they paint
 * instantly when they enter the DOM. Safe to call repeatedly: each URL is only
 * warmed once. Browser-only; a no-op during SSR.
 */
export function preloadImages(urls: Iterable<string>): void {
  if (typeof window === "undefined") return;

  for (const url of urls) {
    if (!url || warmed.has(url)) continue;
    warmed.add(url);

    const image = new Image();
    image.decoding = "async";
    image.onload = image.onerror = () => pending.delete(image);
    pending.add(image);
    image.src = url;
    // decode() forces the bitmap to be ready before it is actually shown.
    if (typeof image.decode === "function") {
      void image.decode().catch(() => {});
    }
  }
}
