import { SLIDE_H } from "./lib/slide-schema";
import { getElementLabel } from "./registry";

export const PX_PER_IN = 96;
export const PT_TO_PX = 96 / 72;
export const STAGE_W = 960;
export const EXPORT_W = 1600;
export const EXPORT_H = EXPORT_W * (SLIDE_H / 10);

export function withHash(color: string) {
  return color.startsWith("#") ? color : `#${color}`;
}

export function withoutHash(color: string) {
  return color.replace("#", "").toUpperCase();
}

export function filenameFromTitle(
  title: string,
  suffix = "",
  extension = "pptx",
) {
  const slug =
    title.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "") ||
    "editable-deck";
  return `${slug}${suffix}.${extension}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function truncateWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

export function kindLabel(kind: string) {
  return getElementLabel(kind);
}
