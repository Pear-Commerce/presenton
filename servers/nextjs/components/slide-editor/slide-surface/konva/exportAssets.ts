import type { Deck } from "../../lib/slide-schema";
import {
  collectDeckImageSources,
  isRemoteImageSource,
  resolveImageSourceForExport,
  walkSlideElements,
} from "../../lib/image-export";
import { sanitizeSvgMarkup } from "../../lib/svg-sanitize";

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizeSvgMarkup(svg))}`;
}

export function loadKonvaImage(src: string): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = resolveImageSourceForExport(src).then((resolvedSrc) => {
    const imageSrc = resolvedSrc ?? src;
    return new Promise<HTMLImageElement | null>((resolve) => {
      let settled = false;
      const done = (image: HTMLImageElement | null) => {
        if (settled) return;
        settled = true;
        resolve(image);
      };

      const image = new window.Image();
      if (isRemoteImageSource(imageSrc)) image.crossOrigin = "anonymous";
      image.onload = () => done(image);
      image.onerror = () => done(null);
      image.src = imageSrc;
      if (image.complete) done(image);
    });
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
  const sources = new Set<string>(collectDeckImageSources(deck));
  for (const slide of deck.slides) {
    walkSlideElements(slide.elements, (element) => {
      if (element.type === "svg") sources.add(svgToDataUri(element.svg));
    });
  }
  return [...sources];
}
