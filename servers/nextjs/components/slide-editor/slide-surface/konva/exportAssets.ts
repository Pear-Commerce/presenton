import type { Deck } from "../../lib/slide-schema";
import { sanitizeSvgMarkup } from "../../lib/svg-sanitize";

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizeSvgMarkup(svg))}`;
}

export function loadKonvaImage(src: string): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
    if (image.complete) resolve(image);
  });
  imageCache.set(src, promise);
  return promise;
}

export async function waitForDeckExportAssets(deck: Deck): Promise<void> {
  const sources = collectDeckAssetSources(deck);
  if (sources.length === 0) return;
  await Promise.all(sources.map((source) => loadKonvaImage(source)));
}

function collectDeckAssetSources(deck: Deck): string[] {
  const sources = new Set<string>();
  for (const slide of deck.slides) {
    for (const element of slide.elements) {
      if (element.type === "image" && element.data) sources.add(element.data);
      if (element.type === "svg") sources.add(svgToDataUri(element.svg));
    }
  }
  return [...sources];
}
