import { XMLParser } from "fast-xml-parser";
import JSZip from "jszip";
import {
  DeckSchema,
  SLIDE_H,
  SLIDE_W,
  type Deck,
  type Shadow,
  type Slide,
  type SlideElement,
} from "./slide-schema";
import {
  PPTY_DECK_SIDECAR_PATH,
  PPTY_IMAGE_PLACEHOLDER_TAG,
} from "./pptx-tags";
import { boxToPositionSize, uniformBorderRadius } from "./element-model";
import { fitFontToBox } from "./textMeasure";

// PPTX uses English Metric Units. 1 inch = 914400 EMU. PowerPoint stores
// font sizes as hundredths of a point and color values as 6-char hex
// without the leading `#`.
const EMU_PER_INCH = 914400;
const emuToIn = (emu: number): number => emu / EMU_PER_INCH;

// Caps so we never emit a deck that fails DeckSchema validation. The
// schema constraints live in slide-schema.ts; if those move, update here.
const MAX_SLIDES = 50;
const MAX_ELEMENTS_PER_SLIDE = 60;
const MAX_TEXT_LEN = 700;
const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 360;

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  // Keep tag values as strings. Without this, fast-xml-parser turns
  // numeric-looking text content into actual numbers — so a slide with a
  // big "1" / "2" / "3" run silently loses its text (the run becomes the
  // number `1`, our string extractor returns "", and the importer falls
  // through to the rect branch and renders an empty grey box).
  parseTagValue: false,
  trimValues: false,
  // Preserve element order for siblings — relevant for paragraph runs.
  preserveOrder: false,
  isArray: (name) => {
    // Force these to always be arrays so downstream code doesn't have to
    // sniff between "single object" vs "array of one". Names include the
    // XML namespace prefix (e.g. `p:sldId`, not `sldId`).
    return [
      "Relationship",
      "p:sldId",
      "p:sp",
      "p:pic",
      "p:graphicFrame",
      "p:grpSp",
      "p:cxnSp",
      "a:p",
      "a:r",
      "a:br",
    ].includes(name);
  },
});

type Rel = { id: string; target: string; type?: string };
type RelMap = Map<string, Rel>;

export type PptxImportResult = {
  deck: Deck;
  warnings: string[];
};

export async function importPptxFile(file: File | Blob): Promise<PptxImportResult> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  return importFromZip(zip, file instanceof File ? file.name : "Imported deck");
}

async function importFromZip(zip: JSZip, fallbackTitle: string): Promise<PptxImportResult> {
  const warnings: string[] = [];

  // Fast path: PPTX files we produced carry a JSON sidecar with the
  // original deck. Trust it for a lossless round-trip (charts, tables,
  // image slots, anything PPTX can't natively express). For foreign
  // decks the sidecar is absent and we fall through to OOXML parsing.
  const sidecar = await readText(zip, PPTY_DECK_SIDECAR_PATH);
  if (sidecar) {
    try {
      const parsed = DeckSchema.safeParse(JSON.parse(sidecar));
      if (parsed.success) {
        return { deck: parsed.data, warnings };
      }
    } catch {
      // Malformed sidecar — fall through to OOXML parsing rather than fail.
    }
  }

  const presentationXml = await readText(zip, "ppt/presentation.xml");
  if (!presentationXml) {
    throw new Error("Not a valid PPTX file: ppt/presentation.xml is missing.");
  }
  const presRels = await readRelsFor(zip, "ppt/presentation.xml");
  const presentation = PARSER.parse(presentationXml);
  const presNode = presentation["p:presentation"] ?? {};

  // Slide size — fall back to widescreen if absent or malformed.
  const sldSz = presNode["p:sldSz"];
  const pptW = sldSz?.["@_cx"] ? emuToIn(Number(sldSz["@_cx"])) : 13.333;
  const pptH = sldSz?.["@_cy"] ? emuToIn(Number(sldSz["@_cy"])) : 7.5;
  // Single uniform scale used for geometry, fontSize, and charSpacing. We
  // pick the tighter dimension so a non-16:9 source still fits inside our
  // 10×5.625 stage (slack appears as empty margin, never as cropped
  // content). For a standard 16:9 PPTX this comes out to 10/13.333 ≈ 0.75
  // and applies identically to X and Y.
  const scale = Math.min(SLIDE_W / pptW, SLIDE_H / pptH);

  // Map slide rId -> slide xml path
  const slideOrder: string[] = [];
  const slideIds = toArray(
    (presNode["p:sldIdLst"] as Record<string, unknown> | undefined)?.["p:sldId"],
  ) as Record<string, unknown>[];
  for (const sldId of slideIds) {
    const rIdRaw = sldId["@_r:id"] ?? sldId["@_id"];
    if (typeof rIdRaw !== "string") continue;
    const rel = presRels.get(rIdRaw);
    if (!rel) continue;
    slideOrder.push(resolvePath("ppt/presentation.xml", rel.target));
  }

  if (slideOrder.length === 0) {
    throw new Error("No slides found in PPTX file.");
  }
  if (slideOrder.length > MAX_SLIDES) {
    warnings.push(
      `PPTX has ${slideOrder.length} slides; the editor caps at ${MAX_SLIDES}. Extra slides were dropped.`,
    );
  }

  const slides: Slide[] = [];
  for (const slidePath of slideOrder.slice(0, MAX_SLIDES)) {
    const slide = await parseSlide(zip, slidePath, scale, warnings);
    if (slide) slides.push(slide);
  }

  if (slides.length === 0) {
    throw new Error("PPTX file contained no slides we could read.");
  }

  // Title is mostly metadata; reuse the first slide title if we caught one,
  // otherwise the filename.
  const title =
    slides.find((s) => s.title && s.title.trim().length > 0)?.title ??
    (fallbackTitle.replace(/\.pptx$/i, "").slice(0, 90) || "Imported deck");

  const deck: Deck = {
    title,
    description: "Imported from PPTX.",
    slides,
  };
  return { deck, warnings };
}

// ── Slide parsing ───────────────────────────────────────────────────────

async function parseSlide(
  zip: JSZip,
  slidePath: string,
  scale: number,
  warnings: string[],
): Promise<Slide | null> {
  const xml = await readText(zip, slidePath);
  if (!xml) return null;
  const rels = await readRelsFor(zip, slidePath);
  const parsed = PARSER.parse(xml);
  const sld = parsed["p:sld"];
  if (!sld) return null;

  const cSld = sld["p:cSld"] ?? {};
  const background = parseSlideBackground(cSld["p:bg"]);
  const spTree = cSld["p:spTree"] ?? {};

  const elements: SlideElement[] = [];

  const sps = toArray(spTree["p:sp"]);
  for (const sp of sps) {
    if (elements.length >= MAX_ELEMENTS_PER_SLIDE) break;
    const el = await spToElement(sp, scale);
    if (el) elements.push(el);
  }

  const pics = toArray(spTree["p:pic"]);
  for (const pic of pics) {
    if (elements.length >= MAX_ELEMENTS_PER_SLIDE) break;
    const el = await picToElement(pic, scale, zip, rels, slidePath);
    if (el) elements.push(el);
  }

  if (spTree["p:graphicFrame"]) {
    warnings.push(
      `Slide ${slidePath.split("/").pop()}: tables/charts/graphic frames are not yet imported.`,
    );
  }
  if (spTree["p:grpSp"]) {
    warnings.push(
      `Slide ${slidePath.split("/").pop()}: grouped shapes were skipped.`,
    );
  }

  if (elements.length === 0) {
    // The DeckSchema requires at least one element per slide. Add an
    // invisible 1x1 rect so the slide still validates.
    elements.push({
      type: "rectangle",
      ...boxToPositionSize({ x: 0, y: 0, w: 0.1, h: 0.1 }),
      fill: { color: background },
      opacity: 0,
    });
  }

  return {
    background,
    elements,
    title: undefined,
  };
}

function parseSlideBackground(bg: unknown): string {
  if (!bg || typeof bg !== "object") return "FFFFFF";
  const bgPr = (bg as Record<string, unknown>)["p:bgPr"];
  if (!bgPr || typeof bgPr !== "object") return "FFFFFF";
  const solid = (bgPr as Record<string, unknown>)["a:solidFill"];
  const color = extractSolidColor(solid);
  return color ?? "FFFFFF";
}

// ── Shape → element ────────────────────────────────────────────────────

async function spToElement(
  sp: Record<string, unknown>,
  scale: number,
): Promise<SlideElement | null> {
  const xfrm = pickXfrm(sp);
  if (!xfrm) return null;
  const box = boxFromXfrm(xfrm, scale);
  if (!box) return null;

  // Round-trip image placeholders: shapes tagged with our sentinel
  // `objectName` come back as `image` elements with no `data`, so the
  // editor renders the placeholder UI and double-click-to-upload works
  // just like it does on the original template.
  const nvSpPr = sp["p:nvSpPr"] as Record<string, unknown> | undefined;
  const cNvPr = nvSpPr?.["p:cNvPr"] as Record<string, unknown> | undefined;
  const objectName = cNvPr?.["@_name"];
  const spPr = sp["p:spPr"] as Record<string, unknown> | undefined;
  const shadow = extractShadow(spPr, scale);
  if (objectName === PPTY_IMAGE_PLACEHOLDER_TAG) {
    const nameAttr =
      typeof cNvPr?.["@_descr"] === "string" ? (cNvPr["@_descr"] as string) : undefined;
    return {
      type: "image",
      ...boxToPositionSize(box),
      fit: "cover",
      name: nameAttr,
      shadow,
    };
  }

  const txBody = sp["p:txBody"] as Record<string, unknown> | undefined;
  const prstGeom = spPr?.["a:prstGeom"] as Record<string, unknown> | undefined;
  const geomKind = prstGeom?.["@_prst"];

  // Text shape — has runs with content.
  const text = txBody ? extractTextBody(txBody) : null;
  if (text && text.text.trim().length > 0) {
    const fill = extractFill(spPr) ?? "00000000";
    // Scale fontSize and charSpacing by the same factor as geometry (so
    // wrapping matches the source) and by `fontScale` from normAutofit
    // (PPT's shrink-text-on-overflow factor — without this, a box authored
    // at 18pt that PPT actually renders at 9pt overflows our preview).
    const fontMul = scale * text.fontScale;
    const fontFace = text.fontFace ?? "Arial";
    const rawSize = (text.fontSize ?? 14) * fontMul;
    const trimmedText = text.text.slice(0, MAX_TEXT_LEN);
    const charSpacing =
      text.charSpacing != null ? text.charSpacing * fontMul : undefined;
    // Final shrink-to-fit. PPT measures glyphs with its own metrics; our
    // preview uses the browser's. Even after scaling, a label authored to
    // fit can still wrap or overflow here. Mirror PPT's autofit behavior
    // for every imported text element so the preview holds the shape the
    // source designer chose.
    const fittedSize = fitFontToBox(
      {
        text: trimmedText,
        fontFace,
        fontSize: rawSize,
        bold: text.bold,
        italic: text.italic,
        lineHeight: text.lineHeight,
        charSpacing,
        w: box.w,
      },
      box.h,
    );
    return {
      type: "text",
      ...boxToPositionSize(box),
      runs: [{ text: trimmedText }],
      font: {
        family: fontFace,
        size: clampFontSize(fittedSize),
        color: text.color ?? "1A1A1A",
        bold: text.bold || undefined,
        italic: text.italic || undefined,
        letterSpacing: charSpacing,
        lineHeight: text.lineHeight ?? undefined,
      },
      alignment: {
        horizontal: text.align ?? undefined,
        vertical: text.valign ?? undefined,
      },
      shadow,
      opacity: fill === "00000000" ? undefined : undefined,
    };
  }

  // Geometry shape.
  const fill = extractFill(spPr) ?? "DDE5F0";
  if (isEllipseGeom(geomKind, box)) {
    return {
      type: "ellipse",
      ...boxToPositionSize(box),
      fill: { color: fill },
      shadow,
    };
  }
  // Default to rect (covers rect, roundRect, and other rectilinear primitives).
  return {
    type: "rectangle",
    ...boxToPositionSize(box),
    fill: { color: fill },
    borderRadius:
      geomKind === "roundRect" ? uniformBorderRadius(0.08) : undefined,
    shadow,
  };
}

// OOXML preset names PowerPoint and friends use for round shapes. The
// canonical name is "ellipse"; Apple and some Office variants emit
// "oval", and a few exporters use "circle". `wedgeEllipseCallout` is
// included so call-out badges land as ellipses too.
const ELLIPSE_GEOM_PRESETS = new Set([
  "ellipse",
  "oval",
  "circle",
  "wedgeEllipseCallout",
]);

function isEllipseGeom(
  geomKind: unknown,
  box: { w: number; h: number },
): boolean {
  if (typeof geomKind !== "string") return false;
  if (ELLIPSE_GEOM_PRESETS.has(geomKind)) return true;
  // `roundRect` with a near-square aspect is almost always a designer
  // drawing a circular badge — promote to ellipse so it doesn't render
  // as a chunky rounded rectangle.
  if (geomKind === "roundRect") {
    const aspect = box.w / box.h;
    if (aspect > 0.92 && aspect < 1.08) return true;
  }
  return false;
}

// ── Picture → image ────────────────────────────────────────────────────

async function picToElement(
  pic: Record<string, unknown>,
  scale: number,
  zip: JSZip,
  rels: RelMap,
  slidePath: string,
): Promise<SlideElement | null> {
  const xfrm = pickXfrm(pic);
  if (!xfrm) return null;
  const box = boxFromXfrm(xfrm, scale);
  if (!box) return null;
  const spPr = pic["p:spPr"] as Record<string, unknown> | undefined;
  const shadow = extractShadow(spPr, scale);

  const blipFill = pic["p:blipFill"] as Record<string, unknown> | undefined;
  const blip = blipFill?.["a:blip"] as Record<string, unknown> | undefined;
  const rEmbed = blip?.["@_r:embed"];
  if (typeof rEmbed !== "string") return null;
  const rel = rels.get(rEmbed);
  if (!rel) return null;

  const mediaPath = resolvePath(slidePath, rel.target);
  const ext = mediaPath.split(".").pop()?.toLowerCase() ?? "png";
  const mime = mimeForExt(ext);
  const bytes = await zip.file(mediaPath)?.async("base64");
  if (!bytes) return null;

  return {
    type: "image",
    ...boxToPositionSize(box),
    data: `data:${mime};base64,${bytes}`,
    name: nameFromNvProps(pic) ?? undefined,
    shadow,
    fit: "cover",
  };
}

// ── Helpers: geometry ──────────────────────────────────────────────────

function pickXfrm(node: Record<string, unknown>): Record<string, unknown> | null {
  const spPr = node["p:spPr"] as Record<string, unknown> | undefined;
  const xfrm = spPr?.["a:xfrm"] as Record<string, unknown> | undefined;
  return xfrm ?? null;
}

function boxFromXfrm(
  xfrm: Record<string, unknown>,
  scale: number,
): { x: number; y: number; w: number; h: number } | null {
  const off = xfrm["a:off"] as Record<string, unknown> | undefined;
  const ext = xfrm["a:ext"] as Record<string, unknown> | undefined;
  if (!off || !ext) return null;
  const xEmu = Number(off["@_x"] ?? 0);
  const yEmu = Number(off["@_y"] ?? 0);
  const cxEmu = Number(ext["@_cx"] ?? 0);
  const cyEmu = Number(ext["@_cy"] ?? 0);
  if (cxEmu <= 0 || cyEmu <= 0) return null;

  let x = emuToIn(xEmu) * scale;
  let y = emuToIn(yEmu) * scale;
  let w = emuToIn(cxEmu) * scale;
  let h = emuToIn(cyEmu) * scale;

  // Clamp inside slide bounds the schema accepts.
  x = clamp(x, 0, SLIDE_W);
  y = clamp(y, 0, SLIDE_H);
  w = clamp(w, 0.01, SLIDE_W);
  h = clamp(h, 0.01, SLIDE_H);
  return { x, y, w, h };
}

// ── Helpers: color/fill ────────────────────────────────────────────────

function extractFill(spPr: Record<string, unknown> | undefined): string | null {
  if (!spPr) return null;
  return extractSolidColor(spPr["a:solidFill"]) ?? null;
}

function extractSolidColor(solid: unknown): string | null {
  if (!solid || typeof solid !== "object") return null;
  const node = solid as Record<string, unknown>;
  const srgb = node["a:srgbClr"];
  if (srgb && typeof srgb === "object") {
    const val = (srgb as Record<string, unknown>)["@_val"];
    if (typeof val === "string" && /^[0-9A-Fa-f]{6}$/.test(val)) return val.toUpperCase();
  }
  // Theme colors (scheme/sys) — not yet resolved against the slide master.
  return null;
}

function extractShadow(
  spPr: Record<string, unknown> | undefined,
  scale: number,
): Shadow | undefined {
  if (!spPr) return undefined;
  const effectLst = spPr["a:effectLst"] as Record<string, unknown> | undefined;
  const outer = effectLst?.["a:outerShdw"] as Record<string, unknown> | undefined;
  if (!outer) return undefined;

  const blurRaw = Number(outer["@_blurRad"] ?? 0);
  const distRaw = Number(outer["@_dist"] ?? 0);
  const dirRaw = Number(outer["@_dir"] ?? 2700000);
  const degrees = Number.isFinite(dirRaw) ? dirRaw / 60000 : 45;
  const radians = (degrees * Math.PI) / 180;
  const dist = Number.isFinite(distRaw) ? emuToIn(distRaw) * scale : 0;

  return {
    color: extractSolidColor(outer) ?? "000000",
    blur: clamp(Number.isFinite(blurRaw) ? emuToIn(blurRaw) * scale : 0, 0, 100),
    opacity: clamp(extractColorAlpha(outer) ?? 0.35, 0, 1),
    offsetX: clamp(Math.cos(radians) * dist, -2, 2),
    offsetY: clamp(Math.sin(radians) * dist, -2, 2),
  };
}

function extractColorAlpha(node: Record<string, unknown>): number | null {
  const srgb = node["a:srgbClr"];
  if (!srgb || typeof srgb !== "object") return null;
  const alpha = (srgb as Record<string, unknown>)["a:alpha"];
  if (!alpha || typeof alpha !== "object") return null;
  const val = (alpha as Record<string, unknown>)["@_val"];
  if (typeof val !== "string") return null;
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed / 100000 : null;
}

// ── Helpers: text body ─────────────────────────────────────────────────

type TextExtract = {
  text: string;
  fontFace?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  charSpacing?: number;
  lineHeight?: number;
  // Multiplier from <a:bodyPr><a:normAutofit fontScale="..."/> — PPT's
  // shrink-text-on-overflow factor in ten-thousandths of a percent (so
  // 50000 → 0.5). 1 when absent. Without applying this our import renders
  // at the authored pt even when PPT shrinks the actual glyphs.
  fontScale: number;
};

function extractTextBody(txBody: Record<string, unknown>): TextExtract {
  const bodyPr = txBody["a:bodyPr"] as Record<string, unknown> | undefined;
  const anchor = bodyPr?.["@_anchor"];
  const valign =
    anchor === "ctr" ? "middle" : anchor === "b" ? "bottom" : undefined;

  const normAutofit = bodyPr?.["a:normAutofit"] as
    | Record<string, unknown>
    | undefined;
  let fontScale = 1;
  if (normAutofit) {
    const raw = normAutofit["@_fontScale"];
    if (typeof raw === "string") {
      const val = Number(raw);
      if (Number.isFinite(val) && val > 0) fontScale = val / 100_000;
    }
  }

  const paragraphs = toArray(txBody["a:p"]) as Record<string, unknown>[];
  const lines: string[] = [];

  // We carry forward formatting from the first non-empty run we see and
  // treat that as the element's overall formatting. PPTX supports per-run
  // formatting; our schema doesn't, so we collapse.
  let fontFace: string | undefined;
  let fontSize: number | undefined;
  let bold: boolean | undefined;
  let italic: boolean | undefined;
  let color: string | undefined;
  let align: "left" | "center" | "right" | undefined;
  let charSpacing: number | undefined;
  let lineHeight: number | undefined;

  for (const p of paragraphs) {
    const pPr = p["a:pPr"] as Record<string, unknown> | undefined;
    const algn = pPr?.["@_algn"];
    if (align == null) {
      if (algn === "ctr") align = "center";
      else if (algn === "r") align = "right";
      else if (algn === "l" || algn == null) align = align ?? undefined;
    }
    if (lineHeight == null) {
      const lnSpc = pPr?.["a:lnSpc"] as Record<string, unknown> | undefined;
      const spcPct = lnSpc?.["a:spcPct"] as Record<string, unknown> | undefined;
      const pctVal = spcPct?.["@_val"];
      if (typeof pctVal === "string") {
        // pPr lnSpc spcPct uses thousandths of a percent in some versions
        // and direct percent in others. Try both — sane ranges only.
        const raw = Number(pctVal);
        const mul = raw > 1000 ? raw / 100000 : raw / 100;
        if (mul >= 0.8 && mul <= 2.2) lineHeight = mul;
      }
    }

    const runs = toArray(p["a:r"]) as Record<string, unknown>[];
    const lineParts: string[] = [];
    for (const r of runs) {
      const rPr = r["a:rPr"] as Record<string, unknown> | undefined;
      const t = r["a:t"];
      const text = typeof t === "string" ? t : extractTextNode(t);
      if (!text) continue;
      lineParts.push(text);

      if (fontFace == null) {
        const latin = rPr?.["a:latin"] as Record<string, unknown> | undefined;
        const typeface = latin?.["@_typeface"];
        if (typeof typeface === "string") fontFace = typeface;
      }
      if (fontSize == null && rPr?.["@_sz"] != null) {
        fontSize = Number(rPr["@_sz"]) / 100;
      }
      if (bold == null && rPr?.["@_b"] != null) {
        bold = rPr["@_b"] === "1" || rPr["@_b"] === "true";
      }
      if (italic == null && rPr?.["@_i"] != null) {
        italic = rPr["@_i"] === "1" || rPr["@_i"] === "true";
      }
      if (color == null) {
        const fill = (rPr?.["a:solidFill"] ?? rPr?.["a:fontFill"]) as unknown;
        const extracted = extractSolidColor(fill);
        if (extracted) color = extracted;
      }
      if (charSpacing == null && rPr?.["@_spc"] != null) {
        charSpacing = Number(rPr["@_spc"]);
      }
    }
    // Honor empty paragraphs (`<a:br/>` or empty `<a:p/>`) as blank lines.
    lines.push(lineParts.join(""));
  }

  return {
    text: lines.join("\n").trim(),
    fontFace,
    fontSize,
    bold,
    italic,
    color,
    align,
    valign,
    charSpacing,
    lineHeight,
    fontScale,
  };
}

function extractTextNode(t: unknown): string {
  if (t == null) return "";
  if (typeof t === "string") return t;
  // Numeric/boolean runs are possible if any other parsing path leaves
  // them un-stringified. Coerce so the text isn't silently dropped.
  if (typeof t === "number" || typeof t === "boolean") return String(t);
  if (typeof t === "object") {
    const node = t as Record<string, unknown>;
    const inner = node["#text"];
    if (typeof inner === "string") return inner;
    if (typeof inner === "number" || typeof inner === "boolean")
      return String(inner);
  }
  return "";
}

// ── Helpers: rels & paths ──────────────────────────────────────────────

async function readRelsFor(zip: JSZip, partPath: string): Promise<RelMap> {
  const dir = partPath.replace(/[^/]+$/, "");
  const name = partPath.split("/").pop() ?? "";
  const relsPath = `${dir}_rels/${name}.rels`;
  const xml = await readText(zip, relsPath);
  if (!xml) return new Map();
  const parsed = PARSER.parse(xml);
  const rels = toArray(parsed.Relationships?.Relationship);
  const map: RelMap = new Map();
  for (const r of rels) {
    const id = r["@_Id"];
    const target = r["@_Target"];
    if (typeof id === "string" && typeof target === "string") {
      map.set(id, { id, target, type: r["@_Type"] });
    }
  }
  return map;
}

async function readText(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  return entry.async("string");
}

function resolvePath(base: string, rel: string): string {
  // `rel` may start with "../" or be absolute. Resolve against the part's
  // directory but treat a leading "/" as root-relative.
  if (rel.startsWith("/")) return rel.slice(1);
  const segments = base.split("/");
  segments.pop(); // drop filename
  for (const part of rel.split("/")) {
    if (part === "..") segments.pop();
    else if (part !== ".") segments.push(part);
  }
  return segments.join("/");
}

// ── Helpers: misc ───────────────────────────────────────────────────────

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function clampFontSize(n: number): number {
  return clamp(Math.round(n), MIN_FONT_SIZE, MAX_FONT_SIZE);
}

function mimeForExt(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function nameFromNvProps(node: Record<string, unknown>): string | null {
  const nv = node["p:nvPicPr"] as Record<string, unknown> | undefined;
  const cNv = nv?.["p:cNvPr"] as Record<string, unknown> | undefined;
  const name = cNv?.["@_name"];
  return typeof name === "string" ? name : null;
}
