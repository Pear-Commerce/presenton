import {
  layout,
  layoutWithLines,
  prepare,
  prepareWithSegments,
} from "@chenglou/pretext";
import type { BulletsElement, TextElement } from "./slide-schema";

// Reference DPI used across the editor (`PX_PER_IN` in editorUtils). Keep
// in sync — if that changes, this should too.
const PX_PER_INCH = 96;
const PT_TO_PX = PX_PER_INCH / 72;
const DEFAULT_LINE_HEIGHT = 1.15;

// Konva's text fontFamily falls back through "Arial, Helvetica, sans-serif";
// the first family is what actually drives wrapping, so that's what we
// measure against.
function defaultFontFace(face: string | null | undefined): string {
  return face && face.trim() ? face : "Arial";
}

// Build a CSS font shorthand string for Pretext. Order matters: style
// then weight then size/family — the form the browser's canvas API
// accepts. Bold glyphs are wider than regular; without including the
// weight, Pretext samples the regular face and wrap math comes out wrong
// for bold headlines.
//
// The font family chain (`<requested>, Helvetica, sans-serif`) mirrors
// what the DOM renderer in `fontStyle` uses. Canvas's font shorthand
// honors fallback chains, so when the requested family isn't loaded,
// Pretext and the actual DOM render resolve to the same fallback — keep
// the chain in sync with `domStyles.ts` if either side changes.
function fontShorthand(fontSizePx: number, spec: FontFaceSpec): string {
  const parts: string[] = [];
  if (spec.italic) parts.push("italic");
  if (spec.bold) parts.push("bold");
  parts.push(`${fontSizePx}px`);
  parts.push(`${defaultFontFace(spec.fontFace)}, Helvetica, sans-serif`);
  return parts.join(" ");
}

type FontFaceSpec = {
  fontFace?: string | null;
  bold?: boolean | null;
  italic?: boolean | null;
};

/**
 * Everything needed to measure one block of text against a width:
 * the content, font family, size in pt, style flags, line-height
 * multiplier, character spacing in hundredths-of-a-point, and the box
 * width in inches.
 */
export type TextLayoutSpec = FontFaceSpec & {
  text: string;
  fontSize: number;
  lineHeight?: number | null;
  charSpacing?: number | null;
  /** Box width in inches. */
  w: number;
};

/**
 * Measures the rendered height of a text block in inches. Pure
 * arithmetic — no DOM reflow. Returns `null` if Pretext is unavailable
 * (SSR before fonts have been sampled).
 */
export function measureTextHeightInches(spec: TextLayoutSpec): number | null {
  if (typeof window === "undefined") return null;
  const fontSizePx = spec.fontSize * PT_TO_PX;
  const lhMul = spec.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const lineHeightPx = fontSizePx * lhMul;
  const widthPx = spec.w * PX_PER_INCH;
  const letterSpacingPx = ((spec.charSpacing ?? 0) / 100) * PT_TO_PX;
  try {
    const prepared = prepare(spec.text, fontShorthand(fontSizePx, spec), {
      letterSpacing: letterSpacingPx || undefined,
    });
    const { height } = layout(prepared, widthPx, lineHeightPx);
    return height / PX_PER_INCH;
  } catch {
    return null;
  }
}

// Small fudge so we don't flag elements that match their box within
// sub-pixel rounding noise.
const OVERFLOW_TOLERANCE_IN = 0.01;

export function textElementOverflows(el: TextElement): boolean {
  const measured = measureTextHeightInches(el);
  if (measured == null) return false;
  return measured > el.h + OVERFLOW_TOLERANCE_IN;
}

// Pretext samples canvas font metrics, the DOM uses CSS line boxes.
// They agree to within a sub-pixel for matched fonts, but rounding can
// still tip a fully-measured line into clipping at the box edge. A
// 0.04" (~4px @ 96dpi) safety gap shrinks one notch tighter than strictly
// required so the rendered text always has a hair of breathing room.
const FIT_SAFETY_GAP_IN = 0.04;

/**
 * Returns a fontSize that makes `spec.text` fit inside a box of `spec.w`
 * × `heightInches`, by binary-searching downward from `spec.fontSize`.
 * Returns the original size if it already fits, or if Pretext is
 * unavailable. Floor: 6pt (the schema minimum). Never grows the font.
 */
export function fitFontToBox(
  spec: TextLayoutSpec,
  heightInches: number,
): number {
  if (typeof window === "undefined") return spec.fontSize;
  const target = Math.max(0.05, heightInches - FIT_SAFETY_GAP_IN);
  const measure = (size: number) =>
    measureTextHeightInches({ ...spec, fontSize: size });
  const startH = measure(spec.fontSize);
  if (startH == null || startH <= target) return spec.fontSize;

  // Binary search between 6pt and the requested size. ~6 iterations get
  // us within 0.5pt of the largest size that fits.
  let lo = 6;
  let hi = spec.fontSize;
  for (let i = 0; i < 8 && hi - lo > 0.5; i += 1) {
    const mid = (lo + hi) / 2;
    const h = measure(mid);
    if (h == null) return mid;
    if (h <= target) lo = mid;
    else hi = mid;
  }
  return Math.max(6, lo);
}

/**
 * Returns the total rendered height (inches) for a bullets element,
 * summing each item's wrapped height + per-item gap. Pretext only sees
 * the item text — we shave a bullet-marker gutter off the wrap width so
 * the math matches the actual `<ul>` render (CSS list marker sits
 * outside the text width). Returns `null` if Pretext can't run.
 */
function measureBulletsHeightInches(
  el: BulletsElement,
  fontSizePt: number,
): number | null {
  // Roughly 1em reserved for the marker glyph + a touch of breathing
  // room. Mirrors `paddingLeft: "1.1em"` in BulletsDomElement.
  const bulletGutterIn = (fontSizePt * 0.9) / 72;
  const innerWidth = Math.max(0.1, el.w - bulletGutterIn);
  const gap = el.itemGap ?? 0.05;
  let total = 0;
  for (let i = 0; i < el.items.length; i += 1) {
    const h = measureTextHeightInches({
      text: el.items[i],
      fontFace: el.fontFace,
      fontSize: fontSizePt,
      lineHeight: el.lineSpacingMultiple,
      charSpacing: null,
      w: innerWidth,
    });
    if (h == null) return null;
    total += h;
    if (i < el.items.length - 1) total += gap;
  }
  return total;
}

/**
 * Shrink-to-fit for bullets. Same idea as `fitFontToBox` but the height
 * calculation includes per-item gaps and a bullet-marker gutter on the
 * wrap width. Returns the authored `fontSize` if it already fits or if
 * Pretext is unavailable. Never grows.
 */
export function fitBulletsFontToBox(el: BulletsElement): number {
  if (typeof window === "undefined") return el.fontSize;
  const target = Math.max(0.05, el.h - FIT_SAFETY_GAP_IN);
  const startH = measureBulletsHeightInches(el, el.fontSize);
  if (startH == null || startH <= target) return el.fontSize;

  let lo = 6;
  let hi = el.fontSize;
  for (let i = 0; i < 8 && hi - lo > 0.5; i += 1) {
    const mid = (lo + hi) / 2;
    const h = measureBulletsHeightInches(el, mid);
    if (h == null) return mid;
    if (h <= target) lo = mid;
    else hi = mid;
  }
  return Math.max(6, lo);
}

/**
 * Returns the text broken into the lines Pretext would render at the
 * element's authored size. Used to pre-wrap text for PPTX export so the
 * exported deck doesn't depend on PowerPoint's wrap engine — which has
 * subtly different glyph metrics and routinely pushes a word onto a new
 * line, blowing past the box.
 *
 * Returns `[el.text]` (a single chunk) if Pretext can't run.
 */
export function wrapTextElementLines(el: TextElement): string[] {
  if (typeof window === "undefined") return [el.text];
  const fontSizePx = el.fontSize * PT_TO_PX;
  const lhMul = el.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const lineHeightPx = fontSizePx * lhMul;
  const widthPx = el.w * PX_PER_INCH;
  const letterSpacingPx = ((el.charSpacing ?? 0) / 100) * PT_TO_PX;
  try {
    const prepared = prepareWithSegments(el.text, fontShorthand(fontSizePx, el), {
      letterSpacing: letterSpacingPx || undefined,
    });
    const { lines } = layoutWithLines(prepared, widthPx, lineHeightPx);
    if (!lines.length) return [el.text];
    return lines.map((line) => line.text);
  } catch {
    return [el.text];
  }
}
