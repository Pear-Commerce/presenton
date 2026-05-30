import { XMLParser } from "fast-xml-parser";
import JSZip from "jszip";
import {
  DeckSchema,
  SLIDE_H,
  SLIDE_W,
  type Deck,
  type Fill,
  type Shadow,
  type Slide,
  type SlideElement,
  type Stroke,
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

const ORDERED_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: false,
  preserveOrder: true,
});

type Rel = { id: string; target: string; type?: string };
type RelMap = Map<string, Rel>;
type ThemeColorMap = Record<string, string>;
type OrderedXmlNode = Record<string, unknown>;
type OrderedSlideTreeItem = {
  kind: "sp" | "pic" | "cxnSp" | "graphicFrame" | "grpSp";
  node: Record<string, unknown>;
  children?: OrderedSlideTreeItem[];
};
type GeometryTransform = {
  offsetX: number;
  offsetY: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

const DEFAULT_THEME_COLORS: ThemeColorMap = {
  accent1: "4F81BD",
  accent2: "C0504D",
  accent3: "9BBB59",
  accent4: "8064A2",
  accent5: "4BACC6",
  accent6: "F79646",
  bg1: "FFFFFF",
  bg2: "EEECE1",
  dk1: "000000",
  dk2: "1F497D",
  folHlink: "800080",
  hlink: "0000FF",
  lt1: "FFFFFF",
  lt2: "EEECE1",
  tx1: "000000",
  tx2: "1F497D",
};
const IDENTITY_TRANSFORM: GeometryTransform = {
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

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
  const themeColors = await readThemeColors(zip);

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
    const slide = await parseSlide(zip, slidePath, scale, warnings, themeColors);
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
  themeColors: ThemeColorMap,
): Promise<Slide | null> {
  const xml = await readText(zip, slidePath);
  if (!xml) return null;
  const rels = await readRelsFor(zip, slidePath);
  const parsed = PARSER.parse(xml);
  const sld = parsed["p:sld"];
  if (!sld) return null;

  const cSld = sld["p:cSld"] ?? {};
  const background = parseSlideBackground(cSld["p:bg"], themeColors);
  const spTree = cSld["p:spTree"] ?? {};

  const elements: SlideElement[] = [];

  const orderedItems = orderedSlideTreeItems(xml);
  if (orderedItems.length > 0) {
    await appendOrderedElements({
      elements,
      items: orderedItems,
      rels,
      scale,
      slidePath,
      themeColors,
      transform: IDENTITY_TRANSFORM,
      warnings,
      zip,
    });
  } else {
    const sps = toArray(spTree["p:sp"]);
    for (const sp of sps) {
      if (elements.length >= MAX_ELEMENTS_PER_SLIDE) break;
      const el = await spToElement(
        sp,
        scale,
        themeColors,
        IDENTITY_TRANSFORM,
        zip,
        rels,
        slidePath,
      );
      if (el) elements.push(el);
    }

    const pics = toArray(spTree["p:pic"]);
    for (const pic of pics) {
      if (elements.length >= MAX_ELEMENTS_PER_SLIDE) break;
      const el = await picToElement(
        pic,
        scale,
        zip,
        rels,
        slidePath,
        themeColors,
        IDENTITY_TRANSFORM,
      );
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

function parseSlideBackground(bg: unknown, themeColors: ThemeColorMap): string {
  if (!bg || typeof bg !== "object") return "FFFFFF";
  const bgPr = (bg as Record<string, unknown>)["p:bgPr"];
  if (!bgPr || typeof bgPr !== "object") return "FFFFFF";
  const solid = (bgPr as Record<string, unknown>)["a:solidFill"];
  const color = extractSolidColor(solid, themeColors);
  return color ?? "FFFFFF";
}

async function appendOrderedElements({
  elements,
  items,
  rels,
  scale,
  slidePath,
  themeColors,
  transform,
  warnings,
  zip,
}: {
  elements: SlideElement[];
  items: OrderedSlideTreeItem[];
  rels: RelMap;
  scale: number;
  slidePath: string;
  themeColors: ThemeColorMap;
  transform: GeometryTransform;
  warnings: string[];
  zip: JSZip;
}) {
  let warnedGraphicFrame = false;
  for (const item of items) {
    if (elements.length >= MAX_ELEMENTS_PER_SLIDE) break;
    if (item.kind === "sp") {
      const el = await spToElement(
        item.node,
        scale,
        themeColors,
        transform,
        zip,
        rels,
        slidePath,
      );
      if (el) elements.push(el);
    } else if (item.kind === "pic") {
      const el = await picToElement(
        item.node,
        scale,
        zip,
        rels,
        slidePath,
        themeColors,
        transform,
      );
      if (el) elements.push(el);
    } else if (item.kind === "cxnSp") {
      const el = cxnSpToElement(item.node, scale, themeColors, transform);
      if (el) elements.push(el);
    } else if (item.kind === "grpSp") {
      await appendOrderedElements({
        elements,
        items: item.children ?? [],
        rels,
        scale,
        slidePath,
        themeColors,
        transform: groupChildTransform(item.node, transform),
        warnings,
        zip,
      });
    } else if (item.kind === "graphicFrame" && !warnedGraphicFrame) {
      warnedGraphicFrame = true;
      warnings.push(
        `Slide ${slidePath.split("/").pop()}: tables/charts/graphic frames are not yet imported.`,
      );
    }
  }
}

// ── Shape → element ────────────────────────────────────────────────────

async function spToElement(
  sp: Record<string, unknown>,
  scale: number,
  themeColors: ThemeColorMap,
  transform: GeometryTransform,
  zip: JSZip,
  rels: RelMap,
  slidePath: string,
): Promise<SlideElement | null> {
  const xfrm = pickXfrm(sp);
  if (!xfrm) return null;
  const box = boxFromXfrm(xfrm, scale, transform);
  if (!box) return null;
  const rotation = rotationFromXfrm(xfrm, transform);

  // Round-trip image placeholders: shapes tagged with our sentinel
  // `objectName` come back as `image` elements with no `data`, so the
  // editor renders the placeholder UI and double-click-to-upload works
  // just like it does on the original template.
  const nvSpPr = sp["p:nvSpPr"] as Record<string, unknown> | undefined;
  const cNvPr = nvSpPr?.["p:cNvPr"] as Record<string, unknown> | undefined;
  const objectName = cNvPr?.["@_name"];
  const spPr = sp["p:spPr"] as Record<string, unknown> | undefined;
  const shadow = extractShadow(spPr, scale, themeColors);
  if (objectName === PPTY_IMAGE_PLACEHOLDER_TAG) {
    const nameAttr =
      typeof cNvPr?.["@_descr"] === "string" ? (cNvPr["@_descr"] as string) : undefined;
    return {
      type: "image",
      ...boxToPositionSize(box),
      rotation,
      fit: "cover",
      name: nameAttr,
      shadow,
    };
  }

  const txBody = sp["p:txBody"] as Record<string, unknown> | undefined;
  const prstGeom = spPr?.["a:prstGeom"] as Record<string, unknown> | undefined;
  const geomKind = prstGeom?.["@_prst"];
  const blipFill = spPr?.["a:blipFill"];
  if (blipFill && !txBody) {
    return blipFillToImageElement(
      blipFill,
      box,
      zip,
      rels,
      slidePath,
      shadow,
      nameFromNvProps(sp),
      rotation,
    );
  }

  // Text shape — has runs with content.
  const text = txBody ? extractTextBody(txBody, themeColors) : null;
  if (text && text.text.trim().length > 0) {
    // Scale fontSize and charSpacing by the same factor as geometry (so
    // wrapping matches the source) and by `fontScale` from normAutofit
    // (PPT's shrink-text-on-overflow factor — without this, a box authored
    // at 18pt that PPT actually renders at 9pt overflows our preview).
    const fontMul = scale * text.fontScale;
    const fontFace = text.fontFace ?? "Arial";
    const rawSize = (text.fontSize ?? 14) * fontMul;
    const trimmedText = text.text.slice(0, MAX_TEXT_LEN);
    const preserveSize = isPageNumberLabel(trimmedText);
    const charSpacing =
      text.charSpacing != null ? text.charSpacing * fontMul : undefined;
    // Final shrink-to-fit. PPT measures glyphs with its own metrics; our
    // preview uses the browser's. Even after scaling, a label authored to
    // fit can still wrap or overflow here. Mirror PPT's autofit behavior
    // for every imported text element so the preview holds the shape the
    // source designer chose.
    const fittedSize = preserveSize
      ? rawSize
      : fitFontToBox(
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
      rotation,
      runs: [{ text: trimmedText }],
      font: {
        family: fontFace,
        size: clampFontSize(fittedSize),
        color: text.color ?? "1A1A1A",
        bold: text.bold || undefined,
        italic: text.italic || undefined,
        letterSpacing: charSpacing,
        lineHeight: text.lineHeight ?? undefined,
        wrap: preserveSize ? "none" : undefined,
      },
      alignment: {
        horizontal: text.align ?? undefined,
        vertical: text.valign ?? undefined,
      },
      shadow,
    };
  }

  // Geometry shape.
  const fill = extractFill(spPr, themeColors);
  const stroke = extractStroke(spPr, themeColors);
  if (!fill && !stroke) return null;
  if (!fill && stroke && (box.h <= 0.05 || box.w <= 0.05)) {
    return {
      type: "line",
      ...boxToPositionSize(box),
      rotation,
      stroke,
      shadow,
    };
  }
  if (isEllipseGeom(geomKind, box)) {
    return {
      type: "ellipse",
      ...boxToPositionSize(box),
      rotation,
      fill: fill ?? transparentFill(),
      stroke,
      shadow,
    };
  }
  // Default to rect (covers rect, roundRect, and other rectilinear primitives).
  return {
    type: "rectangle",
    ...boxToPositionSize(box),
    rotation,
    fill: fill ?? transparentFill(),
    stroke,
    borderRadius: borderRadiusForShape(spPr, geomKind, box),
    shadow,
  };
}

function cxnSpToElement(
  cxnSp: Record<string, unknown>,
  scale: number,
  themeColors: ThemeColorMap,
  transform: GeometryTransform,
): SlideElement | null {
  const xfrm = pickXfrm(cxnSp);
  if (!xfrm) return null;
  const box = boxFromXfrm(xfrm, scale, transform);
  if (!box) return null;
  const rotation = rotationFromXfrm(xfrm, transform);
  const spPr = cxnSp["p:spPr"] as Record<string, unknown> | undefined;
  const stroke = extractStroke(spPr, themeColors);
  if (!stroke) return null;
  return {
    type: "line",
    ...boxToPositionSize(box),
    rotation,
    stroke,
    shadow: extractShadow(spPr, scale, themeColors),
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

function borderRadiusForShape(
  spPr: Record<string, unknown> | undefined,
  geomKind: unknown,
  box: { w: number; h: number },
) {
  if (geomKind === "roundRect" || isRoundedCustomGeometry(spPr)) {
    return uniformBorderRadius(clamp(Math.min(box.w, box.h) / 2, 0, 0.5));
  }
  return undefined;
}

function isRoundedCustomGeometry(
  spPr: Record<string, unknown> | undefined,
): boolean {
  const custGeom = spPr?.["a:custGeom"] as Record<string, unknown> | undefined;
  const pathLst = custGeom?.["a:pathLst"] as Record<string, unknown> | undefined;
  const path = firstRecord(pathLst?.["a:path"]);
  const curves = toArray(path?.["a:cubicBezTo"]);
  return curves.length === 4;
}

// ── Picture → image ────────────────────────────────────────────────────

async function picToElement(
  pic: Record<string, unknown>,
  scale: number,
  zip: JSZip,
  rels: RelMap,
  slidePath: string,
  themeColors: ThemeColorMap,
  transform: GeometryTransform,
): Promise<SlideElement | null> {
  const xfrm = pickXfrm(pic);
  if (!xfrm) return null;
  const box = boxFromXfrm(xfrm, scale, transform);
  if (!box) return null;
  const rotation = rotationFromXfrm(xfrm, transform);
  const spPr = pic["p:spPr"] as Record<string, unknown> | undefined;
  const shadow = extractShadow(spPr, scale, themeColors);

  const blipFill = pic["p:blipFill"] as Record<string, unknown> | undefined;
  return blipFillToImageElement(
    blipFill,
    box,
    zip,
    rels,
    slidePath,
    shadow,
    nameFromNvProps(pic),
    rotation,
  );
}

async function blipFillToImageElement(
  blipFill: unknown,
  box: { x: number; y: number; w: number; h: number },
  zip: JSZip,
  rels: RelMap,
  slidePath: string,
  shadow: Shadow | undefined,
  name: string | null,
  rotation: number | undefined,
): Promise<SlideElement | null> {
  if (!blipFill || typeof blipFill !== "object") return null;
  const blip = (blipFill as Record<string, unknown>)["a:blip"] as
    | Record<string, unknown>
    | undefined;
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
    rotation,
    data: `data:${mime};base64,${bytes}`,
    name: name ?? undefined,
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
  transform: GeometryTransform,
): { x: number; y: number; w: number; h: number } | null {
  const off = xfrm["a:off"] as Record<string, unknown> | undefined;
  const ext = xfrm["a:ext"] as Record<string, unknown> | undefined;
  if (!off || !ext) return null;
  const rawXEmu = Number(off["@_x"] ?? 0);
  const rawYEmu = Number(off["@_y"] ?? 0);
  const rawCxEmu = Number(ext["@_cx"] ?? 0);
  const rawCyEmu = Number(ext["@_cy"] ?? 0);
  if (rawCxEmu <= 0 && rawCyEmu <= 0) return null;

  const xEmu = transform.offsetX + rawXEmu * transform.scaleX;
  const yEmu = transform.offsetY + rawYEmu * transform.scaleY;
  const cxEmu = rawCxEmu * transform.scaleX;
  const cyEmu = rawCyEmu * transform.scaleY;

  let x = emuToIn(xEmu) * scale;
  let y = emuToIn(yEmu) * scale;
  let w = emuToIn(cxEmu) * scale;
  let h = emuToIn(cyEmu) * scale;
  const rotation = normalizeRotation(transform.rotation + xfrmRotation(xfrm));

  if (Math.abs(rotation) >= 0.01) {
    const radians = (rotation * Math.PI) / 180;
    const halfW = w / 2;
    const halfH = h / 2;
    const centerX = x + halfW;
    const centerY = y + halfH;
    const rotatedHalfX = Math.cos(radians) * halfW - Math.sin(radians) * halfH;
    const rotatedHalfY = Math.sin(radians) * halfW + Math.cos(radians) * halfH;
    x = centerX - rotatedHalfX;
    y = centerY - rotatedHalfY;
  }

  // Clamp inside slide bounds the schema accepts.
  x = clamp(x, 0, SLIDE_W);
  y = clamp(y, 0, SLIDE_H);
  w = clamp(w, 0.01, SLIDE_W);
  h = clamp(h, 0.01, SLIDE_H);
  return { x, y, w, h };
}

function rotationFromXfrm(
  xfrm: Record<string, unknown>,
  transform: GeometryTransform,
): number | undefined {
  const rotation = normalizeRotation(transform.rotation + xfrmRotation(xfrm));
  return Math.abs(rotation) < 0.01 ? undefined : round(rotation);
}

function groupChildTransform(
  group: Record<string, unknown>,
  parent: GeometryTransform,
): GeometryTransform {
  const grpSpPr = group["p:grpSpPr"] as Record<string, unknown> | undefined;
  const xfrm = grpSpPr?.["a:xfrm"] as Record<string, unknown> | undefined;
  if (!xfrm) return parent;

  const off = xfrm["a:off"] as Record<string, unknown> | undefined;
  const ext = xfrm["a:ext"] as Record<string, unknown> | undefined;
  const chOff = xfrm["a:chOff"] as Record<string, unknown> | undefined;
  const chExt = xfrm["a:chExt"] as Record<string, unknown> | undefined;
  if (!off || !ext || !chExt) return parent;

  const offX = Number(off["@_x"] ?? 0);
  const offY = Number(off["@_y"] ?? 0);
  const extX = Number(ext["@_cx"] ?? 0);
  const extY = Number(ext["@_cy"] ?? 0);
  const chOffX = Number(chOff?.["@_x"] ?? 0);
  const chOffY = Number(chOff?.["@_y"] ?? 0);
  const chExtX = Number(chExt["@_cx"] ?? 0);
  const chExtY = Number(chExt["@_cy"] ?? 0);
  if (extX <= 0 || extY <= 0 || chExtX <= 0 || chExtY <= 0) return parent;

  const scaleX = parent.scaleX * (extX / chExtX);
  const scaleY = parent.scaleY * (extY / chExtY);
  return {
    offsetX: parent.offsetX + offX * parent.scaleX - chOffX * scaleX,
    offsetY: parent.offsetY + offY * parent.scaleY - chOffY * scaleY,
    rotation: normalizeRotation(parent.rotation + xfrmRotation(xfrm)),
    scaleX,
    scaleY,
  };
}

function xfrmRotation(xfrm: Record<string, unknown>): number {
  const raw = Number(xfrm["@_rot"] ?? 0);
  return Number.isFinite(raw) ? raw / 60000 : 0;
}

function normalizeRotation(rotation: number): number {
  let next = rotation;
  while (next > 360) next -= 360;
  while (next < -360) next += 360;
  return next;
}

// ── Helpers: color/fill ────────────────────────────────────────────────

function extractFill(
  spPr: Record<string, unknown> | undefined,
  themeColors: ThemeColorMap,
): Fill | null {
  if (!spPr) return null;
  if ("a:noFill" in spPr) return null;
  const solid = spPr["a:solidFill"];
  const color = extractSolidColor(solid, themeColors);
  if (!color) return null;
  const alpha =
    solid && typeof solid === "object"
      ? extractColorAlpha(solid as Record<string, unknown>)
      : null;
  return alpha == null ? { color } : { color, opacity: alpha };
}

function extractStroke(
  spPr: Record<string, unknown> | undefined,
  themeColors: ThemeColorMap,
): Stroke | undefined {
  const ln = spPr?.["a:ln"] as Record<string, unknown> | undefined;
  if (!ln || "a:noFill" in ln) return undefined;
  const color = extractSolidColor(ln["a:solidFill"], themeColors);
  if (!color) return undefined;
  const widthRaw = Number(ln["@_w"]);
  const solid = ln["a:solidFill"];
  return {
    color,
    opacity:
      solid && typeof solid === "object"
        ? extractColorAlpha(solid as Record<string, unknown>)
        : undefined,
    width: Number.isFinite(widthRaw) && widthRaw > 0 ? widthRaw / 12700 : 0.75,
  };
}

function transparentFill(): Fill {
  return { color: "000000", opacity: 0 };
}

function extractSolidColor(
  solid: unknown,
  themeColors: ThemeColorMap,
): string | null {
  if (!solid || typeof solid !== "object") return null;
  const node = solid as Record<string, unknown>;
  const srgb = node["a:srgbClr"];
  if (srgb && typeof srgb === "object") {
    const val = (srgb as Record<string, unknown>)["@_val"];
    if (typeof val === "string" && /^[0-9A-Fa-f]{6}$/.test(val)) return val.toUpperCase();
  }
  const scheme = node["a:schemeClr"];
  if (scheme && typeof scheme === "object") {
    const val = (scheme as Record<string, unknown>)["@_val"];
    if (typeof val === "string") return themeColors[val] ?? null;
  }
  const sys = node["a:sysClr"];
  if (sys && typeof sys === "object") {
    const val = (sys as Record<string, unknown>)["@_lastClr"];
    if (typeof val === "string" && /^[0-9A-Fa-f]{6}$/.test(val)) return val.toUpperCase();
  }
  return null;
}

function extractShadow(
  spPr: Record<string, unknown> | undefined,
  scale: number,
  themeColors: ThemeColorMap,
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
    color: extractSolidColor(outer, themeColors) ?? "000000",
    blur: clamp(Number.isFinite(blurRaw) ? emuToIn(blurRaw) * scale : 0, 0, 100),
    opacity: clamp(extractColorAlpha(outer) ?? 0.35, 0, 1),
    offsetX: clamp(Math.cos(radians) * dist, -2, 2),
    offsetY: clamp(Math.sin(radians) * dist, -2, 2),
  };
}

function extractColorAlpha(node: Record<string, unknown>): number | null {
  const colorNode =
    (node["a:srgbClr"] as Record<string, unknown> | undefined) ??
    (node["a:schemeClr"] as Record<string, unknown> | undefined) ??
    (node["a:sysClr"] as Record<string, unknown> | undefined);
  if (!colorNode || typeof colorNode !== "object") return null;
  const alpha = colorNode["a:alpha"];
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

function extractTextBody(
  txBody: Record<string, unknown>,
  themeColors: ThemeColorMap,
): TextExtract {
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
    const defRPr = pPr?.["a:defRPr"] as Record<string, unknown> | undefined;
    const lineParts: string[] = [];
    for (const r of runs) {
      const rPr = r["a:rPr"] as Record<string, unknown> | undefined;
      const t = r["a:t"];
      const text = typeof t === "string" ? t : extractTextNode(t);
      if (!text) continue;
      lineParts.push(text);

      if (fontFace == null) {
        const latin = (rPr?.["a:latin"] ?? defRPr?.["a:latin"]) as
          | Record<string, unknown>
          | undefined;
        const typeface = latin?.["@_typeface"];
        if (typeof typeface === "string") fontFace = typeface;
      }
      if (fontSize == null && (rPr?.["@_sz"] ?? defRPr?.["@_sz"]) != null) {
        fontSize = Number(rPr?.["@_sz"] ?? defRPr?.["@_sz"]) / 100;
      }
      if (bold == null && (rPr?.["@_b"] ?? defRPr?.["@_b"]) != null) {
        const value = rPr?.["@_b"] ?? defRPr?.["@_b"];
        bold = value === "1" || value === "true";
      }
      if (italic == null && (rPr?.["@_i"] ?? defRPr?.["@_i"]) != null) {
        const value = rPr?.["@_i"] ?? defRPr?.["@_i"];
        italic = value === "1" || value === "true";
      }
      if (color == null) {
        const fill = (rPr?.["a:solidFill"] ??
          rPr?.["a:fontFill"] ??
          defRPr?.["a:solidFill"] ??
          defRPr?.["a:fontFill"]) as unknown;
        const extracted = extractSolidColor(fill, themeColors);
        if (extracted) color = extracted;
      }
      if (charSpacing == null && (rPr?.["@_spc"] ?? defRPr?.["@_spc"]) != null) {
        charSpacing = Number(rPr?.["@_spc"] ?? defRPr?.["@_spc"]);
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

function isPageNumberLabel(text: string) {
  return /^\/\d+$/.test(text.trim());
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

// ── Helpers: ordered slide tree ────────────────────────────────────────

function orderedSlideTreeItems(xml: string): OrderedSlideTreeItem[] {
  try {
    const parsed = ORDERED_PARSER.parse(xml) as OrderedXmlNode[];
    const slide = findOrderedChildren(parsed, "p:sld");
    const cSld = findOrderedChildren(slide, "p:cSld");
    const spTree = findOrderedChildren(cSld, "p:spTree");
    return orderedItemsFromNodes(spTree);
  } catch {
    return [];
  }
}

function orderedItemsFromNodes(nodes: OrderedXmlNode[]): OrderedSlideTreeItem[] {
  const items: OrderedSlideTreeItem[] = [];

  for (const entry of nodes) {
    const key = orderedElementKey(entry);
    if (
      key !== "p:sp" &&
      key !== "p:pic" &&
      key !== "p:cxnSp" &&
      key !== "p:graphicFrame" &&
      key !== "p:grpSp"
    ) {
      continue;
    }
    const node = orderedElementToPlain(entry);
    const item: OrderedSlideTreeItem = {
      kind: key.replace("p:", "") as OrderedSlideTreeItem["kind"],
      node:
        node && typeof node === "object"
          ? (node as Record<string, unknown>)
          : {},
    };
    if (key === "p:grpSp") {
      item.children = orderedItemsFromNodes(orderedElementChildren(entry, key));
    }
    items.push(item);
  }

  return items;
}

function findOrderedChildren(
  nodes: unknown,
  key: string,
): OrderedXmlNode[] {
  if (!Array.isArray(nodes)) return [];
  const found = nodes.find(
    (node): node is OrderedXmlNode =>
      !!node && typeof node === "object" && key in node,
  );
  const children = found?.[key];
  return Array.isArray(children) ? (children as OrderedXmlNode[]) : [];
}

function orderedElementChildren(
  node: OrderedXmlNode,
  key: string,
): OrderedXmlNode[] {
  const children = node[key];
  return Array.isArray(children) ? (children as OrderedXmlNode[]) : [];
}

function orderedElementKey(node: OrderedXmlNode): string | null {
  return Object.keys(node).find((key) => key !== ":@" && key !== "#text") ?? null;
}

function orderedElementToPlain(node: OrderedXmlNode): unknown {
  const key = orderedElementKey(node);
  if (!key) return orderedAttrs(node);
  const attrs = orderedAttrs(node);
  const value = orderedValueToPlain(node[key]);
  if (typeof value === "object" && value != null) {
    return { ...value, ...attrs };
  }
  return Object.keys(attrs).length > 0 ? { "#text": value, ...attrs } : value;
}

function orderedValueToPlain(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  let text = "";
  const out: Record<string, unknown> = {};
  for (const child of value) {
    if (!child || typeof child !== "object") continue;
    const childNode = child as OrderedXmlNode;
    const textValue = childNode["#text"];
    if (typeof textValue === "string") {
      text += textValue;
      continue;
    }

    const key = orderedElementKey(childNode);
    if (!key) continue;
    const plain = orderedElementToPlain(childNode);
    appendOrderedValue(out, key, plain);
  }

  return Object.keys(out).length > 0 ? out : text;
}

function appendOrderedValue(
  out: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  const current = out[key];
  if (current == null) {
    out[key] = value;
  } else if (Array.isArray(current)) {
    current.push(value);
  } else {
    out[key] = [current, value];
  }
}

function orderedAttrs(node: OrderedXmlNode): Record<string, unknown> {
  const attrs = node[":@"];
  return attrs && typeof attrs === "object"
    ? (attrs as Record<string, unknown>)
    : {};
}

// ── Helpers: rels & paths ──────────────────────────────────────────────

async function readThemeColors(zip: JSZip): Promise<ThemeColorMap> {
  const colors: ThemeColorMap = { ...DEFAULT_THEME_COLORS };
  const xml = await readText(zip, "ppt/theme/theme1.xml");
  if (!xml) return colors;

  try {
    const parsed = PARSER.parse(xml);
    const scheme =
      parsed["a:theme"]?.["a:themeElements"]?.["a:clrScheme"] ?? {};
    for (const key of Object.keys(DEFAULT_THEME_COLORS)) {
      const node = scheme[key];
      const color = extractThemeSchemeColor(node);
      if (color) colors[key] = color;
    }
    colors.tx1 = colors.dk1;
    colors.tx2 = colors.dk2;
    colors.bg1 = colors.lt1;
    colors.bg2 = colors.lt2;
  } catch {
    return colors;
  }

  return colors;
}

function extractThemeSchemeColor(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const themeNode = node as Record<string, unknown>;
  const srgb = themeNode["a:srgbClr"];
  if (srgb && typeof srgb === "object") {
    const value = (srgb as Record<string, unknown>)["@_val"];
    if (typeof value === "string" && /^[0-9A-Fa-f]{6}$/.test(value)) {
      return value.toUpperCase();
    }
  }
  const sys = themeNode["a:sysClr"];
  if (sys && typeof sys === "object") {
    const value = (sys as Record<string, unknown>)["@_lastClr"];
    if (typeof value === "string" && /^[0-9A-Fa-f]{6}$/.test(value)) {
      return value.toUpperCase();
    }
  }
  return null;
}

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

function firstRecord(value: unknown): Record<string, unknown> | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first && typeof first === "object"
    ? (first as Record<string, unknown>)
    : undefined;
}

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

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
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
  const nv = (node["p:nvPicPr"] ?? node["p:nvSpPr"]) as
    | Record<string, unknown>
    | undefined;
  const cNv = nv?.["p:cNvPr"] as Record<string, unknown> | undefined;
  const name = cNv?.["@_name"];
  return typeof name === "string" ? name : null;
}
