import type { Deck, SlideElement } from "./slide-schema";

const resolvedImageCache = new Map<string, Promise<string | null>>();

export function walkSlideElements(
  elements: SlideElement[],
  visitor: (element: SlideElement) => void,
): void {
  for (const element of elements) {
    visitor(element);
    if (element.type === "container") {
      if (element.child) walkSlideElements([element.child], visitor);
    } else if (
      element.type === "flex" ||
      element.type === "grid" ||
      element.type === "group"
    ) {
      walkSlideElements(element.children, visitor);
    } else if (
      element.type === "list-view" ||
      element.type === "grid-view"
    ) {
      walkSlideElements([element.item], visitor);
    }
  }
}

export function collectDeckImageSources(deck: Deck): string[] {
  const sources = new Set<string>();
  for (const slide of deck.slides) {
    if (slide.backgroundImage?.data) sources.add(slide.backgroundImage.data);
    walkSlideElements(slide.elements, (element) => {
      if (element.type === "image" && element.data) sources.add(element.data);
    });
  }
  return [...sources];
}

export function isRemoteImageSource(src: string): boolean {
  try {
    const url = new URL(
      src,
      typeof window === "undefined" ? "http://localhost" : window.location.href,
    );
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function shouldResolveImageSource(src: string): boolean {
  const value = src.trim().toLowerCase();
  return Boolean(value) && !value.startsWith("data:");
}

export async function resolveImageSourceForExport(
  src: string,
): Promise<string | null> {
  if (!shouldResolveImageSource(src) || typeof fetch === "undefined") {
    return src;
  }
  const cached = resolvedImageCache.get(src);
  if (cached) return cached;

  const promise = fetchImageAsDataUri(src);
  resolvedImageCache.set(src, promise);
  return promise;
}

export async function embedDeckImageData(deck: Deck): Promise<Deck> {
  const next = cloneDeck(deck);
  const updates: Array<Promise<void>> = [];

  for (const slide of next.slides) {
    if (slide.backgroundImage?.data) {
      updates.push(
        resolveImageSourceForExport(slide.backgroundImage.data).then((data) => {
          if (data && slide.backgroundImage) slide.backgroundImage.data = data;
        }),
      );
    }

    walkSlideElements(slide.elements, (element) => {
      if (element.type !== "image" || !element.data) return;
      updates.push(
        resolveImageSourceForExport(element.data).then((data) => {
          if (data) element.data = data;
        }),
      );
    });
  }

  await Promise.all(updates);
  return next;
}

function cloneDeck(deck: Deck): Deck {
  if (typeof structuredClone === "function") return structuredClone(deck);
  return JSON.parse(JSON.stringify(deck)) as Deck;
}

async function fetchImageAsDataUri(src: string): Promise<string | null> {
  try {
    const response = await fetch(src, {
      credentials: isRemoteImageSource(src) ? "omit" : "same-origin",
    });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (blob.type && !blob.type.toLowerCase().startsWith("image/")) {
      return null;
    }
    return await blobToDataUri(blob);
  } catch {
    return null;
  }
}

function blobToDataUri(blob: Blob): Promise<string | null> {
  if (typeof FileReader === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
