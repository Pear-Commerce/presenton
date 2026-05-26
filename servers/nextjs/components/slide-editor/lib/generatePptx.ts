import PptxGenJS from "pptxgenjs";
import {
  SLIDE_H,
  SLIDE_W,
  type ChartElement,
  type Deck,
  type Shadow,
  type Slide,
  type SlideElement,
} from "../lib/slide-schema";
import JSZip from "jszip";
import { getElementDefinition } from "../lib/slide-elements";
import {
  PPTY_DECK_SIDECAR_PATH,
  PPTY_IMAGE_PLACEHOLDER_TAG,
} from "../lib/pptx-tags";
import { sanitizeSvgMarkup } from "../lib/svg-sanitize";
import {
  fitBulletsFontToBox,
  fitFontToBox,
  wrapTextElementLines,
} from "../lib/textMeasure";

const VALIGN = { top: "top", middle: "middle", bottom: "bottom" } as const;
export type PptxChartMode = "native" | "shapes";
export type GeneratePptxOptions = {
  chartMode?: PptxChartMode;
};

function transparencyPct(opacity?: number): number {
  if (opacity == null) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - opacity) * 100)));
}

function svgDataUri(svg: string): string {
  const sanitized = sanitizeSvgMarkup(svg);
  const encoded =
    typeof window === "undefined"
      ? Buffer.from(sanitized, "utf8").toString("base64")
      : window.btoa(
          Array.from(new TextEncoder().encode(sanitized), (byte) =>
            String.fromCharCode(byte),
          ).join(""),
        );
  return `data:image/svg+xml;base64,${encoded}`;
}

function pptxShadow(shadow?: Shadow | null): PptxGenJS.ShadowProps | undefined {
  if (!shadow) return undefined;
  const offset = Math.sqrt(shadow.offsetX ** 2 + shadow.offsetY ** 2) * 72;
  const angle = ((Math.atan2(shadow.offsetY, shadow.offsetX) * 180) / Math.PI + 360) % 360;
  return {
    type: "outer",
    color: shadow.color,
    opacity: shadow.opacity,
    blur: shadow.blur * 72,
    offset,
    angle,
  };
}

function uniformRadius(element: { rx?: number | null; radius?: { tl?: number | null; tr?: number | null; bl?: number | null; br?: number | null } | null }) {
  const radius = element.radius;
  if (!radius) return element.rx ?? 0;
  const values = [radius.tl, radius.tr, radius.bl, radius.br].map((value) => value ?? element.rx ?? 0);
  return values.every((value) => value === values[0]) ? values[0] : 0;
}

// Blends `fg` over `bg` at the given opacity (Porter-Duff "over" with both
// alphas = 1). Used to bake text opacity into a solid color, because Google
// Slides ignores <a:alpha> inside text-run color elements (it only honors
// alpha on shape fills). PowerPoint renders both correctly, but baking gets us
// consistent output across PPT, Google Slides, and Keynote.
function blendHex(fg: string, bg: string, opacity: number): string {
  const a = Math.max(0, Math.min(1, opacity));
  const parse = (h: string) => [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
  const [fr, fg_, fb] = parse(fg);
  const [br, bg_, bb] = parse(bg);
  const mix = (f: number, b: number) => Math.round(b + (f - b) * a);
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return toHex(mix(fr, br)) + toHex(mix(fg_, bg_)) + toHex(mix(fb, bb));
}

function addChartElement(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  el: ChartElement,
): void {
  const axisColor = el.axisColor ?? "9AA7BD";
  const labelColor = el.labelColor ?? "6A7894";
  const chartType =
    el.chartType === "donut"
      ? pptx.ChartType.doughnut
      : el.chartType === "line"
        ? pptx.ChartType.line
        : pptx.ChartType.bar;
  const labels = el.data.map((datum) => datum.label);
  const values = el.data.map((datum) => datum.value);
  const chartColors = el.data.map((datum) => datum.color ?? el.color);
  const isDonut = el.chartType === "donut";
  const data: PptxGenJS.OptsChartData[] = [
    {
      name: el.title ?? "Series",
      labels,
      values,
    },
  ];
  const options: PptxGenJS.IChartOpts = {
    x: el.x,
    y: el.y,
    w: el.w,
    h: el.h,
    altText: el.title ?? "Chart",
    barDir: "col",
    barGapWidthPct: 70,
    chartArea: {
      fill: { color: "FFFFFF", transparency: transparencyPct(el.opacity ?? 0.92) },
      border: { color: axisColor, pt: 0.25 },
      roundedCorners: true,
    },
    chartColors,
    dataLabelColor: labelColor,
    dataLabelFontFace: "Arial",
    dataLabelFontSize: isDonut ? 7 : 6.5,
    dataLabelPosition: isDonut ? "bestFit" : "outEnd",
    holeSize: 62,
    lineDataSymbol: "circle",
    lineDataSymbolSize: 5,
    lineSize: 2,
    lineSmooth: false,
    plotArea: {
      fill: { transparency: 100 },
      border: { type: "none" },
    },
    showLabel: isDonut,
    showLegend: isDonut,
    showTitle: Boolean(el.title),
    showValue: el.showValues ?? false,
    title: el.title ?? undefined,
    titleBold: true,
    titleColor: labelColor,
    titleFontFace: "Arial",
    titleFontSize: 9,
    valAxisHidden: isDonut,
    catAxisHidden: isDonut,
    valAxisLabelColor: labelColor,
    catAxisLabelColor: labelColor,
    valAxisLabelFontFace: "Arial",
    catAxisLabelFontFace: "Arial",
    valAxisLabelFontSize: 7,
    catAxisLabelFontSize: 7,
    valAxisLineColor: axisColor,
    catAxisLineColor: axisColor,
    valAxisLineSize: 0.75,
    catAxisLineSize: 0.75,
    valGridLine: { color: axisColor, size: 0.5, style: "dot" },
    legendColor: labelColor,
    legendFontFace: "Arial",
    legendFontSize: 7,
    legendPos: "r",
  };

  s.addChart(chartType, data, options);
}

function chartMax(el: ChartElement): number {
  return Math.max(1, ...el.data.map((datum) => datum.value));
}

function normalizeAngle(angle: number): number {
  const normalized = Math.round(angle % 360);
  return normalized < 0 ? normalized + 360 : normalized;
}

function addLineSegment(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  width = 1.5,
): void {
  const x = Math.min(from.x, to.x);
  const y = Math.min(from.y, to.y);
  const w = Math.abs(to.x - from.x);
  const h = Math.abs(to.y - from.y);
  const rises = to.y < from.y;

  s.addShape(pptx.ShapeType.line, {
    x,
    y,
    w,
    h,
    flipV: rises,
    line: { color, width },
  });
}

function addChartShell(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  el: ChartElement,
): { x: number; y: number; w: number; h: number } {
  const axisColor = el.axisColor ?? "9AA7BD";
  const labelColor = el.labelColor ?? "6A7894";
  const titleH = el.title ? 0.28 : 0.08;
  const pad = 0.14;
  const labelBand = el.chartType === "donut" ? 0 : 0.22;

  s.addShape(pptx.ShapeType.roundRect, {
    x: el.x,
    y: el.y,
    w: el.w,
    h: el.h,
    rectRadius: 0.04,
    fill: { color: "FFFFFF", transparency: transparencyPct(el.opacity ?? 0.92) },
    line: { color: axisColor, transparency: 65, width: 0.75 },
  });

  if (el.title) {
    s.addText(el.title, {
      x: el.x + pad,
      y: el.y + 0.08,
      w: el.w - pad * 2,
      h: 0.18,
      fontFace: "Arial",
      fontSize: 9,
      bold: true,
      color: labelColor,
      margin: 0,
      fit: "shrink",
    });
  }

  return {
    x: el.x + pad,
    y: el.y + pad + titleH,
    w: Math.max(0.2, el.w - pad * 2),
    h: Math.max(0.2, el.h - pad * 2 - titleH - labelBand),
  };
}

function addBarShapeChart(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  el: ChartElement,
  plot: { x: number; y: number; w: number; h: number },
): void {
  const axisColor = el.axisColor ?? "9AA7BD";
  const labelColor = el.labelColor ?? "6A7894";
  const max = chartMax(el);
  const gap = Math.min(0.1, plot.w / Math.max(12, el.data.length * 4));
  const barW = Math.max(0.08, (plot.w - gap * (el.data.length - 1)) / el.data.length);

  s.addShape(pptx.ShapeType.line, {
    x: plot.x,
    y: plot.y + plot.h,
    w: plot.w,
    h: 0,
    line: { color: axisColor, width: 0.75 },
  });
  s.addShape(pptx.ShapeType.line, {
    x: plot.x,
    y: plot.y,
    w: 0,
    h: plot.h,
    line: { color: axisColor, width: 0.75 },
  });

  el.data.forEach((datum, index) => {
    const h = (datum.value / max) * (plot.h * 0.82);
    const x = plot.x + index * (barW + gap);
    const y = plot.y + plot.h - h;
    s.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: barW,
      h,
      fill: { color: datum.color ?? el.color },
      line: { type: "none" },
    });
    if (el.showValues) {
      s.addText(String(datum.value), {
        x,
        y: Math.max(plot.y, y - 0.16),
        w: barW,
        h: 0.13,
        fontFace: "Arial",
        fontSize: 6.5,
        color: labelColor,
        align: "center",
        margin: 0,
        fit: "shrink",
      });
    }
    s.addText(datum.label, {
      x: x - 0.03,
      y: plot.y + plot.h + 0.04,
      w: barW + 0.06,
      h: 0.14,
      fontFace: "Arial",
      fontSize: 5.5,
      color: labelColor,
      align: "center",
      margin: 0,
      fit: "shrink",
    });
  });
}

function addLineShapeChart(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  el: ChartElement,
  plot: { x: number; y: number; w: number; h: number },
): void {
  const axisColor = el.axisColor ?? "9AA7BD";
  const labelColor = el.labelColor ?? "6A7894";
  const max = chartMax(el);

  s.addShape(pptx.ShapeType.line, {
    x: plot.x,
    y: plot.y + plot.h,
    w: plot.w,
    h: 0,
    line: { color: axisColor, width: 0.75 },
  });
  s.addShape(pptx.ShapeType.line, {
    x: plot.x,
    y: plot.y,
    w: 0,
    h: plot.h,
    line: { color: axisColor, width: 0.75 },
  });

  const points = el.data.map((datum, index) => ({
    x: plot.x + (el.data.length === 1 ? plot.w / 2 : (index / (el.data.length - 1)) * plot.w),
    y: plot.y + plot.h - (datum.value / max) * (plot.h * 0.82),
    datum,
  }));

  points.slice(1).forEach((point, index) => {
    addLineSegment(pptx, s, points[index], point, el.color, 1.5);
  });
  points.forEach((point) => {
    s.addShape(pptx.ShapeType.ellipse, {
      x: point.x - 0.035,
      y: point.y - 0.035,
      w: 0.07,
      h: 0.07,
      fill: { color: point.datum.color ?? el.color },
      line: { color: "FFFFFF", width: 0.5 },
    });
    if (el.showValues) {
      s.addText(String(point.datum.value), {
        x: point.x - 0.14,
        y: Math.max(plot.y, point.y - 0.17),
        w: 0.28,
        h: 0.12,
        fontFace: "Arial",
        fontSize: 6,
        color: labelColor,
        align: "center",
        margin: 0,
        fit: "shrink",
      });
    }
    s.addText(point.datum.label, {
      x: point.x - 0.17,
      y: plot.y + plot.h + 0.04,
      w: 0.34,
      h: 0.14,
      fontFace: "Arial",
      fontSize: 5.5,
      color: labelColor,
      align: "center",
      margin: 0,
      fit: "shrink",
    });
  });
}

function addDonutShapeChart(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  el: ChartElement,
  plot: { x: number; y: number; w: number; h: number },
): void {
  const labelColor = el.labelColor ?? "6A7894";
  const total = Math.max(1, el.data.reduce((sum, datum) => sum + datum.value, 0));
  const size = Math.min(plot.w * 0.52, plot.h * 0.95);
  const donutX = plot.x;
  const donutY = plot.y + Math.max(0, (plot.h - size) / 2);

  if (el.data.length === 1) {
    s.addShape(pptx.ShapeType.donut, {
      x: donutX,
      y: donutY,
      w: size,
      h: size,
      fill: { color: el.data[0]?.color ?? el.color },
      line: { type: "none" },
    });
  } else {
    let start = -90;
    el.data.forEach((datum) => {
      const sweep = Math.max(1, (datum.value / total) * 360);
      s.addShape(pptx.ShapeType.blockArc, {
        x: donutX,
        y: donutY,
        w: size,
        h: size,
        angleRange: [normalizeAngle(start), normalizeAngle(start + sweep)],
        arcThicknessRatio: 0.46,
        fill: { color: datum.color ?? el.color },
        line: { color: "FFFFFF", transparency: 35, width: 0.4 },
      });
      start += sweep;
    });
  }

  s.addText(String(total), {
    x: donutX + size * 0.25,
    y: donutY + size * 0.38,
    w: size * 0.5,
    h: size * 0.2,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color: el.color,
    align: "center",
    margin: 0,
    fit: "shrink",
  });

  el.data.forEach((datum, index) => {
    const y = plot.y + index * Math.min(0.24, plot.h / Math.max(1, el.data.length));
    s.addShape(pptx.ShapeType.rect, {
      x: donutX + size + 0.16,
      y,
      w: 0.1,
      h: 0.1,
      fill: { color: datum.color ?? el.color },
      line: { type: "none" },
    });
    s.addText(`${datum.label}${el.showValues ? ` ${datum.value}` : ""}`, {
      x: donutX + size + 0.3,
      y: y - 0.02,
      w: Math.max(0.2, plot.x + plot.w - (donutX + size + 0.3)),
      h: 0.16,
      fontFace: "Arial",
      fontSize: 7,
      color: labelColor,
      margin: 0,
      fit: "shrink",
    });
  });
}

function addChartShapeElement(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  el: ChartElement,
): void {
  const plot = addChartShell(pptx, s, el);

  if (el.chartType === "bar") {
    addBarShapeChart(pptx, s, el, plot);
    return;
  }
  if (el.chartType === "line") {
    addLineShapeChart(pptx, s, el, plot);
    return;
  }
  addDonutShapeChart(pptx, s, el, plot);
}

function addTableElement(
  s: PptxGenJS.Slide,
  el: Extract<SlideElement, { kind: "table" }>,
): void {
  const rows = el.rows;
  const cols = Math.max(1, ...rows.map((row) => row.length));
  const rowH = el.h / rows.length;
  const colW = el.w / cols;
  const fill = el.fill ?? "FFFFFF";
  const tableRows: PptxGenJS.TableRow[] = rows.map((row, rowIndex) =>
    Array.from({ length: cols }).map((_, colIndex) => {
      const isHeader = rowIndex === 0;
      const cellStyle = el.cellStyles?.[rowIndex]?.[colIndex];
      return {
        text: row[colIndex] ?? "",
        options: {
          bold: cellStyle?.bold ?? isHeader,
          border: { color: cellStyle?.borderColor ?? el.borderColor, pt: 0.5 },
          color: cellStyle?.textColor ?? (isHeader ? el.headerTextColor : el.textColor),
          fill: {
            color: cellStyle?.fill ?? (isHeader ? el.headerFill : fill),
            transparency: transparencyPct(el.opacity ?? undefined),
          },
          fontFace: el.fontFace ?? "Arial",
          fontSize: el.fontSize,
          fit: "shrink",
          margin: [0.05, 0.08, 0.05, 0.08],
          valign: "middle",
          align: colIndex === 0 ? "left" : "center",
        },
      };
    }),
  );

  const tableOptions: PptxGenJS.TableProps & {
    rotate?: number;
    shadow?: PptxGenJS.ShadowProps;
  } = {
    x: el.x,
    y: el.y,
    w: el.w,
    h: el.h,
    rotate: el.rotation ?? undefined,
    shadow: pptxShadow(el.shadow),
    border: { color: el.borderColor, pt: 0.5 },
    colW: Array.from({ length: cols }, () => colW),
    fill: { color: fill, transparency: transparencyPct(el.opacity ?? undefined) },
    fontFace: el.fontFace ?? "Arial",
    fontSize: el.fontSize,
    margin: [0.05, 0.08, 0.05, 0.08],
    rowH: Array.from({ length: rows.length }, () => rowH),
  };
  s.addTable(tableRows, tableOptions);
}

function addElement(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  el: SlideElement,
  bg: string,
  options: Required<GeneratePptxOptions>,
): void {
  const renderer = getElementDefinition(el.kind).export.pptx;

  if (renderer === "rect" && el.kind === "rect") {
    const rx = uniformRadius(el);
    const rounded = rx > 0;
    const shape = rounded ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;
    const opts: PptxGenJS.ShapeProps = {
      x: el.x,
      y: el.y,
      w: el.w,
      h: el.h,
      rotate: el.rotation ?? undefined,
      shadow: pptxShadow(el.shadow),
      fill: {
        color: el.fill,
        transparency: transparencyPct(el.opacity ?? undefined),
      },
      line: el.line
        ? { color: el.line.color, width: el.line.width }
        : { type: "none" },
    };
    if (rounded) {
      // pptxgenjs rectRadius is a fraction of the shorter side / 2.
      opts.rectRadius = Math.min(0.5, rx / Math.min(el.w, el.h));
    }
    s.addShape(shape, opts);
    return;
  }

  if (renderer === "ellipse" && el.kind === "ellipse") {
    s.addShape(pptx.ShapeType.ellipse, {
      x: el.x,
      y: el.y,
      w: el.w,
      h: el.h,
      rotate: el.rotation ?? undefined,
      shadow: pptxShadow(el.shadow),
      fill: {
        color: el.fill,
        transparency: transparencyPct(el.opacity ?? undefined),
      },
      line: el.line
        ? { color: el.line.color, width: el.line.width }
        : { type: "none" },
    });
    return;
  }

  if (renderer === "text" && el.kind === "text") {
    const color =
      el.opacity != null && el.opacity < 1
        ? blendHex(el.color, bg, el.opacity)
        : el.color;
    // Pre-fit fontSize and pre-wrap lines on our side. Same Pretext-based
    // computation the editor preview uses, so a 36pt headline that gets
    // shrunk to 29pt in the preview also lands at 29pt in the export.
    // Without this, PPT did its own shrinking via `fit: shrink` with its
    // own metrics, and the two views diverged. `wrap: false` keeps PPT
    // from rewrapping; `fit: shrink` stays as a sub-character safety net.
    const effectiveFontSize = fitFontToBox(el, el.h);
    const lines = wrapTextElementLines({ ...el, fontSize: effectiveFontSize });
    s.addText(lines.join("\n"), {
      x: el.x,
      y: el.y,
      w: el.w,
      h: el.h,
      rotate: el.rotation ?? undefined,
      shadow: pptxShadow(el.shadow),
      fontFace: el.fontFace ?? "Arial",
      fontSize: effectiveFontSize,
      bold: el.bold ?? undefined,
      italic: el.italic ?? undefined,
      color,
      align: el.align ?? "left",
      valign: VALIGN[el.valign ?? "top"],
      // Spec uses hundredths-of-a-point (matches OOXML's `spc` unit and our
      // CSS letter-spacing math). pptxgenjs takes points directly, so divide.
      charSpacing: el.charSpacing != null ? el.charSpacing / 100 : undefined,
      // Use absolute line height in points (= multiplier × fontSize) so PPTX
      // matches CSS's `line-height: X` (also a multiplier of fontSize).
      lineSpacing: (el.lineHeight ?? 1.15) * effectiveFontSize,
      // Zero the text-frame inset so coordinates match the React preview
      // (which has no padding inside its boxes).
      margin: 0,
      wrap: false,
      fit: "shrink",
    });
    return;
  }

  if (renderer === "chart" && el.kind === "chart") {
    if (options.chartMode === "shapes") addChartShapeElement(pptx, s, el);
    else addChartElement(pptx, s, el);
    return;
  }

  if (renderer === "table" && el.kind === "table") {
    addTableElement(s, el);
    return;
  }

  if (renderer === "image" && el.kind === "image") {
    if (el.data) {
      s.addImage({
        data: el.data,
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        rotate: el.rotation ?? undefined,
        shadow: pptxShadow(el.shadow),
        sizing:
          el.fit === "cover"
            ? { type: "cover", w: el.w, h: el.h }
            : el.fit === "fill"
              ? undefined
              : { type: "contain", w: el.w, h: el.h },
        transparency: transparencyPct(el.opacity ?? undefined),
      });
    } else {
      // Empty image slot. We tag the exported shape with a sentinel
      // `objectName` so a round-trip back through our importer can restore
      // it as an `image` element (with double-click-to-upload) instead of
      // a plain rect. Fill explicitly set to none — pptxgenjs's
      // `{ transparency: 100 }` writes a black srgbClr with alpha=0, which
      // other readers (including ours, pre-fix) interpret as solid black.
      s.addShape(pptx.ShapeType.rect, {
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        rotate: el.rotation ?? undefined,
        shadow: pptxShadow(el.shadow),
        fill: { type: "none" },
        line: { color: "7D89A3", width: 0.75, dashType: "dash" },
        objectName: PPTY_IMAGE_PLACEHOLDER_TAG,
      });
    }
    return;
  }

  if (renderer === "svg" && el.kind === "svg") {
    s.addImage({
      data: svgDataUri(el.svg),
      x: el.x,
      y: el.y,
      w: el.w,
      h: el.h,
      rotate: el.rotation ?? undefined,
      shadow: pptxShadow(el.shadow),
      transparency: transparencyPct(el.opacity ?? undefined),
    });
    return;
  }

  if (renderer !== "bullets" || el.kind !== "bullets") return;

  // Same Pretext-measured shrink the editor preview applies, so bullet
  // lists that fit visually in the editor also fit in the exported
  // PPTX. Without this, PPT renders at the declared size and tall lists
  // overflow the box.
  const effectiveFontSize = fitBulletsFontToBox(el);
  const runs = el.items.map((t) => ({
    text: t,
    options: {
      bullet: {
        code: "2022", // BULLET (smaller dot — matches the React preview)
        indent: 12,
        color: el.bulletColor ?? el.color,
      },
    },
  }));
  s.addText(runs, {
    x: el.x,
    y: el.y,
    w: el.w,
    h: el.h,
    fontFace: el.fontFace ?? "Arial",
    fontSize: effectiveFontSize,
    color: el.color,
    valign: "top",
    paraSpaceAfter: (el.itemGap ?? 0.05) * 72,
    paraSpaceBefore: 0,
    lineSpacing: (el.lineSpacingMultiple ?? 1.3) * effectiveFontSize,
    margin: 0,
  });
}

function loadImageNaturalSize(
  src: string,
): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function addSlide(
  pptx: PptxGenJS,
  slide: Slide,
  options: Required<GeneratePptxOptions>,
): Promise<void> {
  const s = pptx.addSlide();
  s.background = { color: slide.background };
  if (slide.backgroundImage) {
    const fit = slide.backgroundImage.fit ?? "cover";
    // pptxgenjs computes cover/contain srcRect using addImage's `w`/`h` as
    // the natural image size. If we pass slide dims for both, the ratio is
    // 1:1 and the crop collapses to fill. Decode natural dims so cover and
    // contain produce the right srcRect.
    const natural =
      fit === "fill"
        ? null
        : await loadImageNaturalSize(slide.backgroundImage.data);
    const imgW = natural?.w ? natural.w / 96 : SLIDE_W;
    const imgH = natural?.h ? natural.h / 96 : SLIDE_H;
    s.addImage({
      data: slide.backgroundImage.data,
      x: 0,
      y: 0,
      w: imgW,
      h: imgH,
      sizing:
        fit === "cover"
          ? { type: "cover", w: SLIDE_W, h: SLIDE_H }
          : fit === "contain"
            ? { type: "contain", w: SLIDE_W, h: SLIDE_H }
            : undefined,
      transparency: transparencyPct(slide.backgroundImage.opacity ?? undefined),
    });
  }
  for (const el of slide.elements) addElement(pptx, s, el, slide.background, options);
}

export async function generatePptx(
  deck: Deck,
  filename = "presentation.pptx",
  options: GeneratePptxOptions = {},
) {
  const resolvedOptions: Required<GeneratePptxOptions> = {
    chartMode: options.chartMode ?? "native",
  };
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PPTY_16x9", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "PPTY_16x9";

  for (const slide of deck.slides) await addSlide(pptx, slide, resolvedOptions);

  // Build the PPTX in-memory, then reopen it as a zip and drop our deck
  // JSON sidecar alongside `ppt/`. PowerPoint ignores files outside the
  // Content Types manifest, so the file stays a valid `.pptx` for any
  // reader — and our importer reads the sidecar first for a lossless
  // round-trip (charts, tables, image slots, anything PPTX can't express
  // natively).
  const buffer = (await pptx.write({
    outputType: "arraybuffer",
  })) as ArrayBuffer;
  const zip = await JSZip.loadAsync(buffer);
  zip.file(PPTY_DECK_SIDECAR_PATH, JSON.stringify(deck));
  const finalBlob = await zip.generateAsync({ type: "blob" });

  triggerDownload(finalBlob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke a tick so the click has finished propagating in all
  // browsers before the URL becomes invalid.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
