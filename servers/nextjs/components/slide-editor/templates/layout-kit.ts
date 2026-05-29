import {
  type Deck,
  type Slide,
  type SlideElement,
  type TableCell,
} from "../lib/slide-schema";

const SANS = "Arial";

const INK = "172033";
const NAVY = "0B1F3A";
const DEEP = "071425";
const PAPER = "FFFFFF";
const MIST = "F4F7FB";
const LINE = "D7E0EC";
const MUTED = "66758D";
const BLUE = "3E78B2";
const CYAN = "5CC8D7";
const AMBER = "D4A24C";
const CORAL = "E46D5B";
const GREEN = "3FA773";
const LIME = "A4C957";
const LAVENDER = "8D7CF6";

const TOTAL = 12;

const GRID_SVG = `<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg">
  <rect width="900" height="520" rx="36" fill="#071425"/>
  <g fill="none" stroke="#5CC8D7" stroke-opacity="0.35" stroke-width="2">
    <path d="M90 92h720M90 204h720M90 316h720M90 428h720"/>
    <path d="M90 92v336M270 92v336M450 92v336M630 92v336M810 92v336"/>
  </g>
  <rect x="116" y="118" width="322" height="164" rx="24" fill="#3E78B2"/>
  <rect x="468" y="118" width="316" height="70" rx="22" fill="#D4A24C"/>
  <rect x="468" y="220" width="142" height="182" rx="22" fill="#E46D5B"/>
  <rect x="642" y="220" width="142" height="182" rx="22" fill="#A4C957"/>
  <circle cx="276" cy="202" r="34" fill="#FFFFFF" opacity="0.9"/>
</svg>`;

const EDITOR_SVG = `<svg viewBox="0 0 720 430" xmlns="http://www.w3.org/2000/svg">
  <rect width="720" height="430" rx="32" fill="#FFFFFF"/>
  <rect x="34" y="34" width="150" height="362" rx="18" fill="#EAF0F8"/>
  <rect x="210" y="34" width="322" height="362" rx="24" fill="#F4F7FB"/>
  <rect x="558" y="34" width="128" height="362" rx="18" fill="#172033"/>
  <rect x="246" y="80" width="250" height="80" rx="18" fill="#3E78B2"/>
  <rect x="246" y="188" width="112" height="166" rx="18" fill="#D4A24C"/>
  <rect x="384" y="188" width="112" height="166" rx="18" fill="#5CC8D7"/>
  <g fill="#FFFFFF" opacity="0.9">
    <rect x="584" y="76" width="76" height="10" rx="5"/>
    <rect x="584" y="112" width="52" height="10" rx="5"/>
    <rect x="584" y="148" width="66" height="10" rx="5"/>
  </g>
</svg>`;

const VECTOR_SVG = `<svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg">
  <rect width="360" height="260" rx="28" fill="#0B1F3A"/>
  <path d="M70 190 C104 76 164 76 196 190" fill="none" stroke="#5CC8D7" stroke-width="12" stroke-linecap="round"/>
  <path d="M190 160 H292" fill="none" stroke="#D4A24C" stroke-width="12" stroke-linecap="round"/>
  <path d="M252 120 L292 160 L252 200" fill="none" stroke="#D4A24C" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="#FFFFFF">
    <circle cx="70" cy="190" r="13"/>
    <circle cx="132" cy="88" r="13"/>
    <circle cx="196" cy="190" r="13"/>
    <circle cx="292" cy="160" r="15"/>
  </g>
</svg>`;

const EXPORT_SVG = `<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg">
  <rect width="720" height="420" rx="30" fill="#071425"/>
  <g fill="#FFFFFF" opacity="0.96">
    <rect x="70" y="70" width="150" height="210" rx="18"/>
    <rect x="284" y="70" width="150" height="210" rx="18"/>
    <rect x="498" y="70" width="150" height="210" rx="18"/>
  </g>
  <g fill="#EAF0F8">
    <rect x="94" y="104" width="102" height="12" rx="6"/>
    <rect x="308" y="104" width="102" height="12" rx="6"/>
    <rect x="522" y="104" width="102" height="12" rx="6"/>
  </g>
  <g fill="#3E78B2">
    <rect x="94" y="142" width="102" height="54" rx="12"/>
    <rect x="308" y="142" width="102" height="54" rx="12"/>
    <rect x="522" y="142" width="102" height="54" rx="12"/>
  </g>
  <path d="M220 318h278" stroke="#D4A24C" stroke-width="12" stroke-linecap="round"/>
  <path d="M462 282l42 36-42 36" fill="none" stroke="#D4A24C" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

type TextEl = Extract<SlideElement, { type: "text" }>;
type TextListEl = Extract<SlideElement, { type: "text-list" }>;
type RectEl = Extract<SlideElement, { type: "rectangle" }>;
type EllipseEl = Extract<SlideElement, { type: "ellipse" }>;
type GroupEl = Extract<SlideElement, { type: "group" }>;
type ContainerEl = Extract<SlideElement, { type: "container" }>;
type GridEl = Extract<SlideElement, { type: "grid" }>;
type FlexEl = Extract<SlideElement, { type: "flex" }>;
type SvgEl = Extract<SlideElement, { type: "svg" }>;
type ImageEl = Extract<SlideElement, { type: "image" }>;
type ChartEl = Extract<SlideElement, { type: "chart" }>;
type TableEl = Extract<SlideElement, { type: "table" }>;

type Align = "left" | "center" | "right";
type VAlign = "top" | "middle" | "bottom";

function radius(value = 0.12) {
  return { tl: value, tr: value, bl: value, br: value };
}

function text({
  x,
  y,
  w,
  h,
  value,
  size = 12,
  color = INK,
  bold,
  italic,
  lineHeight,
  letterSpacing,
  align,
  valign,
  opacity,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  align?: Align;
  valign?: VAlign;
  opacity?: number;
}): TextEl {
  return {
    type: "text",
    position: { x, y },
    size: { width: w, height: h },
    runs: [{ text: value }],
    font: {
      family: SANS,
      size,
      color,
      bold,
      italic,
      lineHeight,
      letterSpacing,
    },
    alignment: align || valign ? { horizontal: align, vertical: valign } : undefined,
    opacity,
  };
}

function bullets({
  x,
  y,
  w,
  h,
  items,
  size = 12,
  color = INK,
  marker = "bullet",
  lineHeight = 1.25,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  items: string[];
  size?: number;
  color?: string;
  marker?: "bullet" | "number" | "none";
  lineHeight?: number;
}): TextListEl {
  return {
    type: "text-list",
    position: { x, y },
    size: { width: w, height: h },
    marker,
    items: items.map((item) => ({ type: "text", text: item })),
    font: { family: SANS, size, color, lineHeight },
  };
}

function rect({
  x,
  y,
  w,
  h,
  fill,
  opacity,
  stroke,
  r,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  opacity?: number;
  stroke?: { color: string; width: number };
  r?: number;
}): RectEl {
  return {
    type: "rectangle",
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: fill, opacity },
    stroke,
    borderRadius: r != null ? radius(r) : undefined,
  };
}

function ellipse({
  x,
  y,
  w,
  h,
  fill,
  opacity,
  stroke,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  opacity?: number;
  stroke?: { color: string; width: number };
}): EllipseEl {
  return {
    type: "ellipse",
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: fill, opacity },
    stroke,
  };
}

function group(
  x: number,
  y: number,
  w: number,
  h: number,
  children: SlideElement[],
): GroupEl {
  return {
    type: "group",
    position: { x, y },
    size: { width: w, height: h },
    children,
  };
}

function containerCard({
  x,
  y,
  w,
  h,
  fill = PAPER,
  stroke = LINE,
  children,
  r = 0.16,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  children: SlideElement[];
  r?: number;
}): ContainerEl {
  return {
    type: "container",
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: fill },
    stroke: { color: stroke, width: 0.75 },
    borderRadius: radius(r),
    child: group(0, 0, w, h, children),
  };
}

function svg(x: number, y: number, w: number, h: number, markup: string, name: string): SvgEl {
  return {
    type: "svg",
    position: { x, y },
    size: { width: w, height: h },
    svg: markup,
    name,
  };
}

function image(x: number, y: number, w: number, h: number, name: string): ImageEl {
  return {
    type: "image",
    position: { x, y },
    size: { width: w, height: h },
    fit: "cover",
    name,
    borderRadius: radius(0.16),
  };
}

function chart({
  x,
  y,
  w,
  h,
  type,
  title,
  color,
  data,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "bar" | "line" | "donut";
  title: string;
  color: string;
  data: Array<{ label: string; value: number; color?: string }>;
}): ChartEl {
  return {
    type: "chart",
    position: { x, y },
    size: { width: w, height: h },
    chartType: type,
    title,
    color,
    axisColor: "91A2B8",
    labelColor: MUTED,
    showValues: true,
    data,
  };
}

function cell(textValue: string, fill = PAPER, color = INK, bold = false): TableCell {
  return {
    text: textValue,
    fill: { color: fill },
    stroke: { color: LINE, width: 0.5 },
    font: { color, bold },
  };
}

function table({
  x,
  y,
  w,
  h,
  columns,
  rows,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  columns: string[];
  rows: string[][];
}): TableEl {
  return {
    type: "table",
    position: { x, y },
    size: { width: w, height: h },
    font: { family: SANS, size: 9, color: INK },
    columns: columns.map((item) => cell(item, NAVY, PAPER, true)),
    rows: rows.map((row) => row.map((item) => cell(item))),
  };
}

function footer(num: number, onDark: boolean, prompt: string): SlideElement[] {
  const color = onDark ? "C9D6E6" : MUTED;
  return [
    text({
      x: 0.55,
      y: 5.18,
      w: 6.8,
      h: 0.22,
      value: `Try: ${prompt}`,
      size: 8.5,
      color,
      bold: true,
    }),
    text({
      x: 8.78,
      y: 5.18,
      w: 0.7,
      h: 0.22,
      value: `${String(num).padStart(2, "0")}/${String(TOTAL).padStart(2, "0")}`,
      size: 8.5,
      color,
      align: "right",
      letterSpacing: 120,
    }),
  ];
}

function header({
  num,
  label,
  title,
  body,
  onDark = false,
}: {
  num: number;
  label: string;
  title: string;
  body: string;
  onDark?: boolean;
}): SlideElement[] {
  const primary = onDark ? PAPER : INK;
  const secondary = onDark ? "CAD6E7" : MUTED;
  return [
    rect({ x: 0.55, y: 0.48, w: 0.48, h: 0.06, fill: onDark ? CYAN : BLUE }),
    text({
      x: 0.55,
      y: 0.65,
      w: 3.2,
      h: 0.22,
      value: `FEATURE ${String(num).padStart(2, "0")} | ${label}`,
      size: 8.5,
      color: onDark ? CYAN : BLUE,
      bold: true,
      letterSpacing: 220,
    }),
    text({
      x: 0.55,
      y: 0.96,
      w: 6.5,
      h: 0.54,
      value: title,
      size: 24,
      color: primary,
      bold: true,
      lineHeight: 1.05,
    }),
    text({
      x: 0.58,
      y: 1.48,
      w: 6.6,
      h: 0.42,
      value: body,
      size: 11,
      color: secondary,
      lineHeight: 1.25,
    }),
  ];
}

function slide({
  num,
  title,
  label,
  body,
  background = MIST,
  onDark = false,
  prompt,
  elements,
}: {
  num: number;
  title: string;
  label: string;
  body: string;
  background?: string;
  onDark?: boolean;
  prompt: string;
  elements: SlideElement[];
}): Slide {
  return {
    title,
    background,
    elements: [
      ...header({ num, label, title, body, onDark }),
      ...elements,
      ...footer(num, onDark, prompt),
    ],
  };
}

function metricCard(title: string, value: string, accent: string): GroupEl {
  return group(0, 0, 2.05, 1.08, [
    rect({ x: 0, y: 0, w: 2.05, h: 1.08, fill: PAPER, stroke: { color: LINE, width: 0.65 }, r: 0.13 }),
    rect({ x: 0, y: 0, w: 0.07, h: 1.08, fill: accent, r: 0.03 }),
    text({ x: 0.22, y: 0.18, w: 1.6, h: 0.42, value, size: 25, color: INK, bold: true }),
    text({ x: 0.24, y: 0.72, w: 1.45, h: 0.18, value: title, size: 7.5, color: MUTED, bold: true, letterSpacing: 160 }),
  ]);
}

function miniFeature(title: string, body: string, accent: string): GroupEl {
  return group(0, 0, 2.55, 1.34, [
    rect({ x: 0, y: 0, w: 2.55, h: 1.34, fill: PAPER, stroke: { color: LINE, width: 0.65 }, r: 0.14 }),
    ellipse({ x: 0.22, y: 0.2, w: 0.32, h: 0.32, fill: accent }),
    text({ x: 0.66, y: 0.18, w: 1.55, h: 0.25, value: title, size: 12, color: INK, bold: true }),
    text({ x: 0.66, y: 0.52, w: 1.65, h: 0.46, value: body, size: 8.5, color: MUTED, lineHeight: 1.22 }),
  ]);
}

function stageDot(x: number, y: number, fill: string, label: string): SlideElement[] {
  return [
    ellipse({ x, y, w: 0.48, h: 0.48, fill }),
    text({
      x: x,
      y: y + 0.09,
      w: 0.48,
      h: 0.2,
      value: label,
      size: 10,
      color: PAPER,
      bold: true,
      align: "center",
    }),
  ];
}

const slide1 = {
  title: "Editor Showcase",
  background: DEEP,
  elements: [
    svg(5.72, 0.52, 3.78, 2.2, EDITOR_SVG, "Editor canvas overview"),
    rect({ x: 0.55, y: 0.52, w: 0.58, h: 0.07, fill: CYAN }),
    text({
      x: 0.55,
      y: 0.72,
      w: 4.2,
      h: 0.24,
      value: "PRESENTON EDITOR SHOWCASE",
      size: 9.5,
      color: CYAN,
      bold: true,
      letterSpacing: 260,
    }),
    text({
      x: 0.55,
      y: 1.12,
      w: 5.0,
      h: 1.55,
      value: "A live deck that teaches the editor by being editable.",
      size: 35,
      color: PAPER,
      bold: true,
      lineHeight: 1.08,
    }),
    text({
      x: 0.58,
      y: 2.88,
      w: 4.7,
      h: 0.7,
      value: "Every slide is a feature lab: select nested items, edit text inline, inspect layouts, update data, upload images, and export with confidence.",
      size: 12.5,
      color: "C9D6E6",
      lineHeight: 1.35,
    }),
    {
      type: "grid",
      position: { x: 0.58, y: 3.88 },
      size: { width: 8.9, height: 0.92 },
      columns: 4,
      gap: 0.18,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: [
        miniFeature("Select", "Click a leaf object inside any layout.", CYAN),
        miniFeature("Edit", "Double-click text, charts, tables, and SVG.", AMBER),
        miniFeature("Layout", "Tune flex, grid, repeaters, and padding.", CORAL),
        miniFeature("Export", "Keep the same model across outputs.", LIME),
      ],
    } satisfies GridEl,
    ...footer(1, true, "click through the deck, then edit any nested child object"),
  ],
} satisfies Slide;

const slide2 = slide({
  num: 2,
  title: "Typed objects, not pixels",
  label: "Schema",
  body: "The deck is made from exact typed elements. The editor, inspector, canvas, and export all read the same object model.",
  prompt: "open the drawer and inspect any object as source-of-truth data",
  elements: [
    svg(6.58, 0.72, 2.65, 1.58, GRID_SVG, "Schema grid diagram"),
    {
      type: "grid",
      position: { x: 0.72, y: 2.15 },
      size: { width: 5.55, height: 2.15 },
      columns: 2,
      gap: 0.18,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: [
        miniFeature("Text", "Runs, fonts, wrapping, alignment.", BLUE),
        miniFeature("Shapes", "Fills, strokes, radius, opacity.", CORAL),
        miniFeature("Data", "Charts and tables stay editable.", GREEN),
        miniFeature("Layouts", "Flex, grid, containers, repeaters.", AMBER),
      ],
    } satisfies GridEl,
    table({
      x: 6.56,
      y: 2.42,
      w: 2.75,
      h: 1.52,
      columns: ["Layer", "Reads"],
      rows: [
        ["Canvas", "SlideElement"],
        ["Inspector", "SlideElement"],
        ["Export", "SlideElement"],
      ],
    }),
  ],
});

const slide3 = slide({
  num: 3,
  title: "Flex layouts that breathe",
  label: "Adaptive Flex",
  body: "Flex rows and columns distribute space, respect gaps, and keep child content editable after layout resolution.",
  prompt: "select a card inside the flex row and edit its title without selecting the whole row",
  elements: [
    {
      type: "flex",
      position: { x: 0.72, y: 2.05 },
      size: { width: 8.55, height: 2.22 },
      direction: "row",
      gap: 0.22,
      alignItems: "stretch",
      justifyContent: "stretch",
      padding: { top: 0.08, right: 0.08, bottom: 0.08, left: 0.08 },
      children: [
        containerCard({
          x: 0,
          y: 0,
          w: 2.2,
          h: 2.0,
          fill: NAVY,
          stroke: NAVY,
          children: [
            text({ x: 0.22, y: 0.24, w: 1.65, h: 0.22, value: "BASIS", size: 8, color: CYAN, bold: true, letterSpacing: 180 }),
            text({ x: 0.22, y: 0.58, w: 1.65, h: 0.62, value: "Fixed start width", size: 19, color: PAPER, bold: true, lineHeight: 1.1 }),
            text({ x: 0.22, y: 1.45, w: 1.55, h: 0.28, value: "basis: 2.2", size: 9, color: "C9D6E6" }),
          ],
        }),
        {
          ...containerCard({
            x: 0,
            y: 0,
            w: 2.2,
            h: 2.0,
            fill: PAPER,
            children: [
              text({ x: 0.24, y: 0.24, w: 1.7, h: 0.22, value: "GROW", size: 8, color: GREEN, bold: true, letterSpacing: 180 }),
              text({ x: 0.24, y: 0.58, w: 1.7, h: 0.56, value: "Middle area expands", size: 18, color: INK, bold: true, lineHeight: 1.12 }),
              bullets({ x: 0.24, y: 1.28, w: 1.55, h: 0.42, items: ["grow: 2", "stretch height"], size: 8.5, color: MUTED }),
            ],
          }),
          layout: { grow: 2, basis: 2.2 },
        },
        {
          ...containerCard({
            x: 0,
            y: 0,
            w: 2.2,
            h: 2.0,
            fill: "FFF8EB",
            stroke: "F1D6A1",
            children: [
              text({ x: 0.24, y: 0.24, w: 1.7, h: 0.22, value: "ALIGN", size: 8, color: AMBER, bold: true, letterSpacing: 180 }),
              text({ x: 0.24, y: 0.58, w: 1.7, h: 0.64, value: "Child content remains live", size: 18, color: INK, bold: true, lineHeight: 1.12 }),
              text({ x: 0.24, y: 1.48, w: 1.55, h: 0.2, value: "select inner text", size: 8.5, color: MUTED }),
            ],
          }),
          layout: { grow: 1, basis: 2.2 },
        },
      ],
    } satisfies FlexEl,
    text({ x: 0.95, y: 4.55, w: 8.0, h: 0.3, value: "The row owns placement. Each child still owns content, style, and data.", size: 11, color: MUTED, align: "center" }),
  ],
});

const slide4 = slide({
  num: 4,
  title: "Grid with real spans",
  label: "Adaptive Grid",
  body: "Grid placement supports columns, rows, gaps, item alignment, and child spans for dashboard-grade slide composition.",
  prompt: "select one grid tile and change its text or color from the toolbar",
  elements: [
    {
      type: "grid",
      position: { x: 0.72, y: 2.02 },
      size: { width: 8.55, height: 2.65 },
      columns: 4,
      rows: 2,
      gap: 0.18,
      alignItems: "stretch",
      justifyItems: "stretch",
      padding: { top: 0.04, right: 0.04, bottom: 0.04, left: 0.04 },
      children: [
        {
          ...containerCard({
            x: 0,
            y: 0,
            w: 4.1,
            h: 1.15,
            fill: NAVY,
            stroke: NAVY,
            children: [
              text({ x: 0.26, y: 0.22, w: 2.8, h: 0.24, value: "SPAN 2 COLUMNS", size: 8, color: CYAN, bold: true, letterSpacing: 170 }),
              text({ x: 0.26, y: 0.54, w: 3.2, h: 0.32, value: "Hero tile", size: 20, color: PAPER, bold: true }),
            ],
          }),
          layout: { columnSpan: 2 },
        },
        metricCard("NESTED CHART", "62%", GREEN),
        metricCard("LIVE DATA", "8", AMBER),
        metricCard("ALIGN SELF", "C", LAVENDER),
        {
          ...containerCard({
            x: 0,
            y: 0,
            w: 4.1,
            h: 1.15,
            fill: PAPER,
            children: [
              text({ x: 0.26, y: 0.22, w: 2.9, h: 0.24, value: "SPAN 2 COLUMNS", size: 8, color: CORAL, bold: true, letterSpacing: 170 }),
              text({ x: 0.26, y: 0.56, w: 3.25, h: 0.3, value: "Narrative and proof together", size: 18, color: INK, bold: true }),
            ],
          }),
          layout: { columnSpan: 2 },
        },
      ],
    } satisfies GridEl,
  ],
});

const slide5 = slide({
  num: 5,
  title: "Nested containers stay editable",
  label: "Selection Paths",
  body: "Containers can hold groups, text, charts, images, and shapes. The editor now routes selection to the exact nested source item.",
  prompt: "click the chart, title, or bullet list inside the card and edit only that child",
  elements: [
    containerCard({
      x: 0.72,
      y: 2.0,
      w: 5.2,
      h: 2.62,
      fill: PAPER,
      children: [
        rect({ x: 0.24, y: 0.26, w: 0.48, h: 0.06, fill: CORAL }),
        text({ x: 0.24, y: 0.48, w: 2.8, h: 0.32, value: "Nested launch card", size: 20, color: INK, bold: true }),
        bullets({
          x: 0.24,
          y: 0.98,
          w: 2.22,
          h: 0.82,
          items: ["Container background", "Group composition", "Child editing"],
          size: 10,
          color: MUTED,
        }),
        chart({
          x: 2.78,
          y: 0.5,
          w: 2.0,
          h: 1.35,
          type: "donut",
          title: "Edit target",
          color: BLUE,
          data: [
            { label: "Text", value: 34, color: BLUE },
            { label: "Data", value: 28, color: AMBER },
            { label: "Media", value: 38, color: CORAL },
          ],
        }),
        rect({ x: 0.24, y: 2.08, w: 4.62, h: 0.01, fill: LINE }),
        text({ x: 0.24, y: 2.22, w: 4.1, h: 0.18, value: "One parent. Many directly editable children.", size: 9.5, color: MUTED }),
      ],
    }),
    containerCard({
      x: 6.22,
      y: 2.0,
      w: 3.05,
      h: 2.62,
      fill: NAVY,
      stroke: NAVY,
      children: [
        text({ x: 0.28, y: 0.3, w: 2.3, h: 0.26, value: "What changed", size: 9, color: CYAN, bold: true, letterSpacing: 180 }),
        text({ x: 0.28, y: 0.72, w: 2.25, h: 0.82, value: "Selection follows source paths.", size: 21, color: PAPER, bold: true, lineHeight: 1.1 }),
        text({ x: 0.28, y: 1.8, w: 2.28, h: 0.48, value: "The inspector and inline editor update the child, not a duplicate adapter.", size: 10.5, color: "C9D6E6", lineHeight: 1.25 }),
      ],
    }),
  ],
});

const slide6 = slide({
  num: 6,
  title: "Inline text feels immediate",
  label: "Text Studio",
  body: "Text, bullet lists, and rich typography can be edited directly on the canvas while preserving export-friendly text boxes.",
  prompt: "double-click the headline or bullet list, type, then click away",
  elements: [
    containerCard({
      x: 0.72,
      y: 2.0,
      w: 4.2,
      h: 2.64,
      fill: PAPER,
      children: [
        text({ x: 0.3, y: 0.3, w: 3.25, h: 0.88, value: "The quickest path from idea to polished slide.", size: 25, color: INK, bold: true, lineHeight: 1.1 }),
        text({ x: 0.3, y: 1.42, w: 3.35, h: 0.64, value: "The DOM overlay and PPTX export both shrink and wrap text with the same intent.", size: 11, color: MUTED, lineHeight: 1.35 }),
        rect({ x: 0.3, y: 2.25, w: 0.42, h: 0.05, fill: CORAL }),
      ],
    }),
    containerCard({
      x: 5.2,
      y: 2.0,
      w: 4.05,
      h: 2.64,
      fill: "FFF8EB",
      stroke: "F1D6A1",
      children: [
        text({ x: 0.3, y: 0.28, w: 2.8, h: 0.26, value: "BULLET TARGET", size: 8.5, color: AMBER, bold: true, letterSpacing: 170 }),
        bullets({
          x: 0.34,
          y: 0.78,
          w: 3.2,
          h: 1.38,
          items: ["Direct inline editing", "Toolbar font controls", "Overflow checks in the inspector", "Clean export behavior"],
          size: 13,
          color: INK,
          lineHeight: 1.2,
        }),
      ],
    }),
  ],
});

const slide7 = slide({
  num: 7,
  title: "Data is part of the canvas",
  label: "Charts And Tables",
  body: "Charts and tables are first-class editor objects. They can sit alone or inside layout containers and remain editable.",
  prompt: "double-click the chart or table, then update the data in place",
  elements: [
    {
      type: "grid",
      position: { x: 0.72, y: 2.0 },
      size: { width: 8.55, height: 2.64 },
      columns: 2,
      gap: 0.28,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: [
        chart({
          x: 0,
          y: 0,
          w: 4.05,
          h: 2.45,
          type: "line",
          title: "Editor adoption",
          color: BLUE,
          data: [
            { label: "Mon", value: 22 },
            { label: "Tue", value: 39 },
            { label: "Wed", value: 48 },
            { label: "Thu", value: 72 },
            { label: "Fri", value: 88 },
          ],
        }),
        table({
          x: 0,
          y: 0,
          w: 4.05,
          h: 2.45,
          columns: ["Object", "Action", "Status"],
          rows: [
            ["Chart", "Inline edit", "Live"],
            ["Table", "Cell select", "Live"],
            ["Export", "Native", "Ready"],
            ["Schema", "Typed", "Ready"],
          ],
        }),
      ],
    } satisfies GridEl,
  ],
});

const slide8 = slide({
  num: 8,
  title: "Media and vectors are editable",
  label: "Visual Assets",
  body: "Images, SVG, and shapes share the same selection model, so visual work stays inside the editor instead of a separate design tool.",
  prompt: "select the image placeholder to upload, then select the SVG to edit markup",
  elements: [
    image(0.72, 2.0, 3.05, 2.58, "Upload target"),
    containerCard({
      x: 4.05,
      y: 2.0,
      w: 2.42,
      h: 2.58,
      fill: NAVY,
      stroke: NAVY,
      children: [
        svg(0.34, 0.34, 1.74, 1.25, VECTOR_SVG, "Editable SVG target"),
        text({ x: 0.28, y: 1.84, w: 1.88, h: 0.26, value: "SVG target", size: 13, color: PAPER, bold: true, align: "center" }),
      ],
    }),
    containerCard({
      x: 6.78,
      y: 2.0,
      w: 2.48,
      h: 2.58,
      fill: PAPER,
      children: [
        rect({ x: 0.42, y: 0.38, w: 1.05, h: 0.62, fill: AMBER, stroke: { color: NAVY, width: 0.6 }, r: 0.12 }),
        ellipse({ x: 1.1, y: 0.92, w: 0.78, h: 0.78, fill: CYAN, stroke: { color: BLUE, width: 0.6 } }),
        rect({ x: 0.56, y: 1.56, w: 1.32, h: 0.08, fill: CORAL, r: 0.04 }),
        text({ x: 0.28, y: 1.94, w: 1.88, h: 0.28, value: "Shape toolbar", size: 13, color: INK, bold: true, align: "center" }),
      ],
    }),
  ],
});

const slide9 = slide({
  num: 9,
  title: "Repeaters remove busywork",
  label: "List And Grid Views",
  body: "List-view and grid-view generate repeated visual structures from a single template item. Great for steps, dots, ratings, and small multiples.",
  prompt: "select any repeated dot or step; the source template updates the pattern",
  elements: [
    text({ x: 0.72, y: 2.05, w: 2.6, h: 0.28, value: "List-view timeline", size: 14, color: INK, bold: true }),
    {
      type: "list-view",
      position: { x: 0.72, y: 2.55 },
      size: { width: 8.55, height: 0.82 },
      direction: "row",
      gap: 0.18,
      alignItems: "center",
      justifyContent: "stretch",
      count: 5,
      item: group(0, 0, 1.55, 0.64, [
        rect({ x: 0, y: 0.26, w: 1.2, h: 0.07, fill: LINE, r: 0.03 }),
        ellipse({ x: 0, y: 0.08, w: 0.38, h: 0.38, fill: BLUE }),
        text({ x: 0.5, y: 0.12, w: 0.74, h: 0.18, value: "STEP", size: 8, color: MUTED, bold: true, letterSpacing: 120 }),
      ]),
    },
    text({ x: 0.72, y: 3.76, w: 2.6, h: 0.28, value: "Grid-view signal field", size: 14, color: INK, bold: true }),
    {
      type: "grid-view",
      position: { x: 0.72, y: 4.18 },
      size: { width: 4.05, height: 0.52 },
      columns: 12,
      rows: 2,
      gap: 0.08,
      alignItems: "center",
      justifyItems: "center",
      count: 24,
      item: {
        type: "ellipse",
        size: { width: 0.12, height: 0.12 },
        fill: { color: LIME },
        opacity: 0.85,
      },
    },
    text({ x: 5.25, y: 3.96, w: 3.75, h: 0.55, value: "Repeaters are not screenshots. They are live generated elements with editable template children.", size: 12, color: MUTED, lineHeight: 1.3 }),
  ],
});

const slide10 = slide({
  num: 10,
  title: "Toolbars follow the selected object",
  label: "Inspector UX",
  body: "The workspace toolbar and side inspector now read the resolved selected element while writing back to the real source path.",
  prompt: "select each object below and watch the toolbar change to its controls",
  elements: [
    {
      type: "flex",
      position: { x: 0.72, y: 2.0 },
      size: { width: 8.55, height: 2.62 },
      direction: "row",
      gap: 0.22,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          x: 0,
          y: 0,
          w: 2.0,
          h: 2.4,
          fill: PAPER,
          children: [
            text({ x: 0.22, y: 0.25, w: 1.4, h: 0.22, value: "TEXT", size: 8, color: BLUE, bold: true, letterSpacing: 160 }),
            text({ x: 0.22, y: 0.7, w: 1.46, h: 0.72, value: "Font, color, alignment", size: 19, color: INK, bold: true, lineHeight: 1.08 }),
            rect({ x: 0.22, y: 1.92, w: 1.12, h: 0.07, fill: BLUE, r: 0.03 }),
          ],
        }),
        containerCard({
          x: 0,
          y: 0,
          w: 2.0,
          h: 2.4,
          fill: "FFF8EB",
          stroke: "F1D6A1",
          children: [
            text({ x: 0.22, y: 0.25, w: 1.4, h: 0.22, value: "SHAPE", size: 8, color: AMBER, bold: true, letterSpacing: 160 }),
            rect({ x: 0.34, y: 0.72, w: 1.1, h: 0.68, fill: AMBER, stroke: { color: NAVY, width: 0.5 }, r: 0.15 }),
            text({ x: 0.22, y: 1.75, w: 1.48, h: 0.28, value: "Fill + stroke", size: 12, color: INK, bold: true, align: "center" }),
          ],
        }),
        containerCard({
          x: 0,
          y: 0,
          w: 2.0,
          h: 2.4,
          fill: NAVY,
          stroke: NAVY,
          children: [
            text({ x: 0.22, y: 0.25, w: 1.4, h: 0.22, value: "TABLE", size: 8, color: CYAN, bold: true, letterSpacing: 160 }),
            table({ x: 0.22, y: 0.68, w: 1.48, h: 1.04, columns: ["A", "B"], rows: [["1", "2"], ["3", "4"]] }),
            text({ x: 0.22, y: 1.9, w: 1.48, h: 0.2, value: "Cell controls", size: 10, color: "C9D6E6", align: "center" }),
          ],
        }),
        containerCard({
          x: 0,
          y: 0,
          w: 2.0,
          h: 2.4,
          fill: PAPER,
          children: [
            text({ x: 0.22, y: 0.25, w: 1.4, h: 0.22, value: "CHART", size: 8, color: GREEN, bold: true, letterSpacing: 160 }),
            chart({ x: 0.22, y: 0.64, w: 1.48, h: 1.1, type: "bar", title: "Mix", color: GREEN, data: [{ label: "A", value: 34 }, { label: "B", value: 52 }, { label: "C", value: 27 }] }),
          ],
        }),
      ],
    } satisfies FlexEl,
  ],
});

const slide11 = slide({
  num: 11,
  title: "Export without losing intent",
  label: "Output",
  body: "The same resolved layout feeds presentation mode, PPTX, PDF, and export screenshots, so the deck stays consistent after editing.",
  background: DEEP,
  onDark: true,
  prompt: "change text or data, then export to verify the same structure travels with it",
  elements: [
    svg(5.94, 0.76, 3.28, 1.9, EXPORT_SVG, "Export pipeline"),
    {
      type: "grid",
      position: { x: 0.72, y: 2.18 },
      size: { width: 8.52, height: 2.24 },
      columns: 3,
      gap: 0.22,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: [
        miniFeature("Native PPTX", "Editable text, charts, shapes, and tables.", CYAN),
        miniFeature("PDF / Raster", "Rendered from the same slide surface.", AMBER),
        miniFeature("Keynote path", "Export options preserve the model first.", LIME),
      ],
    } satisfies GridEl,
    text({ x: 1.02, y: 4.55, w: 7.6, h: 0.28, value: "Layout resolution happens once, then every renderer follows it.", size: 11, color: "C9D6E6", align: "center" }),
  ],
});

const slide12 = {
  title: "Everything is editable",
  background: MIST,
  elements: [
    ...header({
      num: 12,
      label: "Start Here Again",
      title: "Use this deck as the editor tour.",
      body: "It is a showcase, a test fixture, and a teaching deck in one. Every visible object is a real editor element.",
    }),
    {
      type: "grid",
      position: { x: 0.72, y: 2.0 },
      size: { width: 5.8, height: 2.62 },
      columns: 2,
      gap: 0.2,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: [
        metricCard("LAYOUT TYPES", "6", BLUE),
        metricCard("OBJECT TYPES", "9", CORAL),
        metricCard("LIVE EDITING", "ON", GREEN),
        metricCard("EXPORT PATHS", "3", AMBER),
      ],
    } satisfies GridEl,
    containerCard({
      x: 6.85,
      y: 2.0,
      w: 2.42,
      h: 2.62,
      fill: NAVY,
      stroke: NAVY,
      children: [
        ...stageDot(0.42, 0.42, CYAN, "1"),
        ...stageDot(1.48, 0.42, AMBER, "2"),
        ...stageDot(0.42, 1.34, CORAL, "3"),
        ...stageDot(1.48, 1.34, LIME, "4"),
        text({ x: 0.3, y: 2.18, w: 1.82, h: 0.22, value: "Make a slide. Edit deeply. Export cleanly.", size: 8.5, color: "C9D6E6", align: "center" }),
      ],
    }),
    ...footer(12, false, "duplicate a slide, change the layout, and keep editing inside it"),
  ],
} satisfies Slide;

export const layoutKitDeck: Deck = {
  title: "Presenton Editor Showcase",
  description:
    "A guided deck where each slide demonstrates one editor capability with real editable elements.",
  theme: {
    background: MIST,
    surface: PAPER,
    primary: NAVY,
    secondary: BLUE,
    accent: AMBER,
    text: INK,
    muted: MUTED,
  },
  slides: [
    slide1,
    slide2,
    slide3,
    slide4,
    slide5,
    slide6,
    slide7,
    slide8,
    slide9,
    slide10,
    slide11,
    slide12,
  ],
};
