import type {
  ChartElement,
  Deck,
  Slide,
  SlideElement,
  TableCell,
} from "../lib/slide-schema";

const SANS = "Arial";

const INK = "101827";
const NAVY = "071425";
const BLUE = "2563A8";
const TEAL = "2CB9A8";
const GREEN = "2E9E61";
const AMBER = "D4A24C";
const RED = "D45246";
const VIOLET = "7762D6";
const PAPER = "FFFFFF";
const MIST = "F3F7FB";
const LINE = "D8E2EF";
const MUTED = "65758B";
const SOFT_BLUE = "E9F2FC";
const SOFT_GREEN = "EAF7F1";
const SOFT_AMBER = "FFF6E3";
const SOFT_RED = "FCEDEB";

const TOTAL = 8;

type TextEl = Extract<SlideElement, { type: "text" }>;
type TextListEl = Extract<SlideElement, { type: "text-list" }>;
type RectEl = Extract<SlideElement, { type: "rectangle" }>;
type EllipseEl = Extract<SlideElement, { type: "ellipse" }>;
type GroupEl = Extract<SlideElement, { type: "group" }>;
type ContainerEl = Extract<SlideElement, { type: "container" }>;
type GridEl = Extract<SlideElement, { type: "grid" }>;
type FlexEl = Extract<SlideElement, { type: "flex" }>;
type TableEl = Extract<SlideElement, { type: "table" }>;

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
  lineHeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
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
  size = 11,
  color = INK,
  marker = "bullet",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  items: string[];
  size?: number;
  color?: string;
  marker?: "bullet" | "number" | "none";
}): TextListEl {
  return {
    type: "text-list",
    position: { x, y },
    size: { width: w, height: h },
    marker,
    items: items.map((item) => ({ type: "text", text: item })),
    font: { family: SANS, size, color, lineHeight: 1.22 },
  };
}

function rect({
  x,
  y,
  w,
  h,
  fill,
  stroke,
  r,
  opacity,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke?: { color: string; width: number };
  r?: number;
  opacity?: number;
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
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  opacity?: number;
}): EllipseEl {
  return {
    type: "ellipse",
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: fill, opacity },
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

function card({
  x,
  y,
  w,
  h,
  fill = PAPER,
  stroke = LINE,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  children: SlideElement[];
}): ContainerEl {
  return {
    type: "container",
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: fill },
    stroke: { color: stroke, width: 0.75 },
    borderRadius: radius(0.14),
    child: group(0, 0, w, h, children),
  };
}

function cell(value: string, fill = PAPER, color = INK, bold = false): TableCell {
  return {
    text: value,
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
  fontSize = 8,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  columns: string[];
  rows: string[][];
  fontSize?: number;
}): TableEl {
  return {
    type: "table",
    position: { x, y },
    size: { width: w, height: h },
    font: { family: SANS, size: fontSize, color: INK },
    columns: columns.map((item) => cell(item, NAVY, PAPER, true)),
    rows: rows.map((row) => row.map((item) => cell(item))),
  };
}

function chart({
  x,
  y,
  w,
  h,
  chartType,
  title,
  color,
  data,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  chartType: ChartElement["chartType"];
  title: string;
  color: string;
  data: ChartElement["data"];
}): ChartElement {
  return {
    type: "chart",
    position: { x, y },
    size: { width: w, height: h },
    chartType,
    title,
    color,
    axisColor: "91A2B8",
    labelColor: MUTED,
    showValues: true,
    data,
  };
}

function header(num: number, title: string, subtitle: string, onDark = false) {
  const titleColor = onDark ? PAPER : INK;
  const subColor = onDark ? "CAD6E7" : MUTED;
  return [
    rect({ x: 0.5, y: 0.42, w: 0.48, h: 0.055, fill: onDark ? TEAL : BLUE }),
    text({
      x: 0.5,
      y: 0.62,
      w: 3.3,
      h: 0.22,
      value: `EZSECURITY EXEC REVIEW | ${String(num).padStart(2, "0")}`,
      size: 8,
      color: onDark ? TEAL : BLUE,
      bold: true,
      letterSpacing: 190,
    }),
    text({
      x: 0.5,
      y: 0.92,
      w: 6.7,
      h: 0.5,
      value: title,
      size: 23,
      color: titleColor,
      bold: true,
      lineHeight: 1.05,
    }),
    text({
      x: 0.52,
      y: 1.44,
      w: 6.8,
      h: 0.38,
      value: subtitle,
      size: 10.5,
      color: subColor,
      lineHeight: 1.28,
    }),
  ];
}

function footer(num: number, onDark = false) {
  return [
    text({
      x: 0.5,
      y: 5.18,
      w: 6.6,
      h: 0.22,
      value: "ezsecurity internal | Jira + Salesforce inferred | W/E May 29, 2026",
      size: 7.6,
      color: onDark ? "B9C8DA" : MUTED,
      bold: true,
    }),
    text({
      x: 8.7,
      y: 5.18,
      w: 0.78,
      h: 0.22,
      value: `${String(num).padStart(2, "0")}/${String(TOTAL).padStart(2, "0")}`,
      size: 8,
      color: onDark ? "B9C8DA" : MUTED,
      align: "right",
      letterSpacing: 120,
    }),
  ];
}

function kpi(
  title: string,
  value: string,
  delta: string,
  fill: string,
  accent: string,
): GroupEl {
  return group(0, 0, 2.04, 1.08, [
    rect({ x: 0, y: 0, w: 2.04, h: 1.08, fill, stroke: { color: LINE, width: 0.65 }, r: 0.12 }),
    rect({ x: 0, y: 0, w: 0.07, h: 1.08, fill: accent, r: 0.03 }),
    text({ x: 0.24, y: 0.18, w: 1.4, h: 0.36, value, size: 22, color: INK, bold: true }),
    text({ x: 0.24, y: 0.6, w: 1.35, h: 0.16, value: title, size: 7.3, color: MUTED, bold: true, letterSpacing: 150 }),
    text({ x: 0.24, y: 0.82, w: 1.28, h: 0.18, value: delta, size: 8.5, color: accent, bold: true }),
  ]);
}

function signalCard(title: string, source: string, body: string, accent: string) {
  return group(0, 0, 2.62, 1.18, [
    rect({ x: 0, y: 0, w: 2.62, h: 1.18, fill: PAPER, stroke: { color: LINE, width: 0.65 }, r: 0.13 }),
    ellipse({ x: 0.22, y: 0.2, w: 0.28, h: 0.28, fill: accent }),
    text({ x: 0.62, y: 0.18, w: 1.72, h: 0.22, value: title, size: 11.5, color: INK, bold: true }),
    text({ x: 0.62, y: 0.46, w: 1.55, h: 0.16, value: source, size: 7.2, color: accent, bold: true, letterSpacing: 130 }),
    text({ x: 0.62, y: 0.7, w: 1.66, h: 0.3, value: body, size: 8.2, color: MUTED, lineHeight: 1.2 }),
  ]);
}

function sourceCard(title: string, source: string, accent: string) {
  return group(0, 0, 1.5, 0.62, [
    rect({ x: 0, y: 0, w: 1.5, h: 0.62, fill: PAPER, stroke: { color: "22334D", width: 0.55 }, r: 0.11 }),
    ellipse({ x: 0.14, y: 0.18, w: 0.18, h: 0.18, fill: accent }),
    text({ x: 0.42, y: 0.14, w: 0.9, h: 0.16, value: title, size: 8.5, color: INK, bold: true }),
    text({ x: 0.42, y: 0.36, w: 0.9, h: 0.13, value: source, size: 6.5, color: accent, bold: true, letterSpacing: 110 }),
  ]);
}

function slide(
  num: number,
  title: string,
  subtitle: string,
  elements: SlideElement[],
  background = MIST,
  onDark = false,
): Slide {
  return {
    title,
    background,
    elements: [...header(num, title, subtitle, onDark), ...elements, ...footer(num, onDark)],
  };
}

const slide1 = {
  title: "ezsecurity Q2 Command Center",
  background: NAVY,
  elements: [
    ...header(
      1,
      "ezsecurity Q2 FY26 command center",
      "Week ending May 29, 2026: ARR is ahead, but cloud sensor reliability is now the revenue gate.",
      true,
    ),
    text({
      x: 0.58,
      y: 2.08,
      w: 4.95,
      h: 0.88,
      value: "Jira risk is now directly visible in the Salesforce forecast.",
      size: 28,
      color: PAPER,
      bold: true,
      lineHeight: 1.08,
    }),
    text({
      x: 0.6,
      y: 3.2,
      w: 4.28,
      h: 0.56,
      value:
        "$4.6M late-stage pipeline and $3.1M renewal ARR are linked to 18 aged P1/P2 Jira issues.",
      size: 12,
      color: "CAD6E7",
      lineHeight: 1.35,
    }),
    {
      type: "grid",
      position: { x: 0.62, y: 4.08 },
      size: { width: 4.8, height: 0.62 },
      columns: 3,
      gap: 0.14,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: [
        sourceCard("Jira", "1,248 issues", TEAL),
        sourceCard("Salesforce", "$16.7M pipe", AMBER),
        sourceCard("Exec actions", "11 owners", RED),
      ],
    } satisfies GridEl,
    card({
      x: 6.0,
      y: 1.82,
      w: 3.38,
      h: 2.72,
      fill: PAPER,
      stroke: "22334D",
      children: [
        text({ x: 0.26, y: 0.24, w: 2.5, h: 0.22, value: "MAY 29 POSTURE", size: 8, color: BLUE, bold: true, letterSpacing: 170 }),
        chart({
          x: 0.32,
          y: 0.62,
          w: 2.72,
          h: 1.28,
          chartType: "donut",
          title: "Exposure by signal",
          color: BLUE,
          data: [
            { label: "Blocked pipe", value: 46, color: AMBER },
            { label: "Renewals", value: 31, color: RED },
            { label: "Roadmap", value: 15, color: TEAL },
            { label: "Support", value: 8, color: VIOLET },
          ],
        }),
        text({ x: 0.32, y: 2.16, w: 2.7, h: 0.22, value: "Board ask: fund CLOUD reliability cell through Jun 28", size: 9.5, color: MUTED }),
      ],
    }),
    ...footer(1, true),
  ],
} satisfies Slide;

const slide2 = slide(2, "ezsecurity health snapshot", "May 2026 health: $51.8M ARR, 3.4x Q2 pipe, 71% roadmap confidence, 14 risky renewals.", [
  {
    type: "grid",
    position: { x: 0.65, y: 2.0 },
    size: { width: 8.75, height: 1.18 },
    columns: 4,
    gap: 0.18,
    alignItems: "stretch",
    justifyItems: "stretch",
    children: [
      kpi("ARR", "$51.8M", "+21% YoY", SOFT_BLUE, BLUE),
      kpi("Q2 pipeline", "$16.7M", "3.4x target", SOFT_AMBER, AMBER),
      kpi("NRR", "117%", "-2 pts QoQ", SOFT_GREEN, GREEN),
      kpi("Roadmap confidence", "71%", "CLOUD red", SOFT_RED, RED),
    ],
  } satisfies GridEl,
  chart({
    x: 0.72,
    y: 3.48,
    w: 4.08,
    h: 1.25,
    chartType: "line",
    title: "ARR by quarter ($M)",
    color: BLUE,
    data: [
      { label: "FY25 Q3", value: 39.2 },
      { label: "FY25 Q4", value: 43.5 },
      { label: "FY26 Q1", value: 47.9 },
      { label: "FY26 Q2", value: 51.8 },
    ],
  }),
  chart({
    x: 5.08,
    y: 3.48,
    w: 4.08,
    h: 1.25,
    chartType: "bar",
    title: "Operating data freshness",
    color: TEAL,
    data: [
      { label: "Jira updated", value: 96, color: TEAL },
      { label: "SFDC hygiene", value: 88, color: AMBER },
      { label: "Forecast conf", value: 79, color: BLUE },
    ],
  }),
]);

const slide3 = slide(3, "Jira delivery risk by product", "Sprint 24.11 closed May 29: 1,248 active issues, 64 committed epics, 18 aged P1/P2 across four Jira projects.", [
  {
    type: "grid",
    position: { x: 0.65, y: 1.95 },
    size: { width: 5.65, height: 2.72 },
    columns: 2,
    gap: 0.18,
    alignItems: "stretch",
    justifyItems: "stretch",
    children: [
      kpi("Sprint predictability", "78%", "-4 pts", SOFT_GREEN, GREEN),
      kpi("Median cycle", "6.2d", "+0.8d", SOFT_BLUE, BLUE),
      kpi("P1/P2 aging", "18", "+6 WoW", SOFT_RED, RED),
      kpi("Roadmap epics", "46/64", "71% on plan", SOFT_AMBER, AMBER),
    ],
  } satisfies GridEl,
  card({
    x: 6.62,
    y: 1.95,
    w: 2.72,
    h: 2.72,
    children: [
      text({ x: 0.24, y: 0.26, w: 2.15, h: 0.24, value: "JIRA SIGNALS", size: 8, color: TEAL, bold: true, letterSpacing: 170 }),
      bullets({
        x: 0.28,
        y: 0.72,
        w: 2.05,
        h: 1.42,
        items: [
          "CLOUD-2241 touches 4 commit deals",
          "SEN-908 memory leak aged 16 days",
          "DET-1184 false-positive work 62% done",
          "SOAR-447 slipped behind partner API",
        ],
        size: 9.6,
        color: INK,
      }),
    ],
  }),
]);

const slide4 = slide(4, "Salesforce forecast friction", "Q2 Salesforce extract: 382 open opps, $16.7M open pipe, $5.4M commit, $4.6M linked to Jira blockers.", [
  chart({
    x: 0.68,
    y: 2.02,
    w: 4.25,
    h: 1.52,
    chartType: "bar",
    title: "Q2 pipeline by stage ($M)",
    color: AMBER,
    data: [
      { label: "Qual", value: 2.1, color: SOFT_AMBER },
      { label: "Eval", value: 5.8, color: AMBER },
      { label: "Sec review", value: 3.4, color: VIOLET },
      { label: "Legal", value: 2.7, color: BLUE },
      { label: "Commit", value: 2.7, color: GREEN },
    ],
  }),
  chart({
    x: 5.22,
    y: 2.02,
    w: 4.05,
    h: 1.52,
    chartType: "line",
    title: "Win rate by segment (%)",
    color: BLUE,
    data: [
      { label: "SMB", value: 23 },
      { label: "MM", value: 31 },
      { label: "ENT", value: 41 },
      { label: "STR", value: 47 },
    ],
  }),
  table({
    x: 0.78,
    y: 3.88,
    w: 8.25,
    h: 0.88,
    columns: ["Account", "Salesforce risk", "Jira link"],
    rows: [
      ["Northstar Bank", "$1.2M commit aging 19d", "CLOUD-2241"],
      ["Horizon Health", "$520k renewal red", "SEN-908"],
      ["MetroGrid", "$860k security review", "DET-1184"],
    ],
    fontSize: 7.5,
  }),
]);

const slide5 = slide(5, "Renewal risk tied to product gaps", "Salesforce renewals due by Aug 31 matched to Jira blockers: $3.1M at-risk ARR across 14 accounts.", [
  {
    type: "flex",
    position: { x: 0.68, y: 2.02 },
    size: { width: 8.62, height: 1.42 },
    direction: "row",
    gap: 0.14,
    alignItems: "stretch",
    justifyContent: "stretch",
    children: [
      kpi("At-risk ARR", "$3.1M", "14 renewals", SOFT_RED, RED),
      kpi("Expansion ARR", "$2.4M", "9 champions", SOFT_GREEN, GREEN),
      kpi("Open blockers", "31", "18 P1/P2", SOFT_AMBER, AMBER),
      kpi("Exec assists", "12", "named owners", SOFT_BLUE, BLUE),
    ],
  } satisfies FlexEl,
  chart({
    x: 0.78,
    y: 3.78,
    w: 3.85,
    h: 0.92,
    chartType: "donut",
    title: "At-risk ARR drivers",
    color: RED,
    data: [
      { label: "CLOUD sensor", value: 42, color: RED },
      { label: "False positives", value: 21, color: AMBER },
      { label: "Reporting gaps", value: 19, color: BLUE },
      { label: "Budget", value: 18, color: VIOLET },
    ],
  }),
  bullets({
    x: 5.0,
    y: 3.72,
    w: 3.92,
    h: 0.82,
    items: [
      "Top risks: Horizon Health $520k, MetroGrid $430k, Apex Insurance $390k",
      "CISO assist queued for 5 accounts with renewal dates inside 45 days",
      "Renewal save plan depends on SEN-908 and DET-1184 closing before Jun 14",
    ],
    size: 10,
    color: INK,
  }),
]);

const slide6 = slide(6, "Product readiness for revenue", "ezsecurity release 2026.06 readiness combines Jira defects, QA pass rate, Salesforce demand, and renewal dependency.", [
  table({
    x: 0.72,
    y: 2.0,
    w: 4.25,
    h: 2.45,
    columns: ["Product area", "Jira read", "Revenue exposure"],
    rows: [
      ["Detection engine", "DET 84% done; 3 P1", "$1.9M evals"],
      ["Cloud sensor", "CLOUD 62%; memory red", "$2.4M commit"],
      ["SOAR workflow", "SOAR 71%; API blocked", "$740k pipeline"],
      ["Reporting pack", "REP on track; 94% QA", "$1.1M renewal"],
    ],
    fontSize: 7.5,
  }),
  card({
    x: 5.35,
    y: 2.0,
    w: 3.82,
    h: 2.45,
    fill: NAVY,
    stroke: NAVY,
    children: [
      text({ x: 0.28, y: 0.28, w: 2.8, h: 0.2, value: "RELEASE CALL", size: 8, color: TEAL, bold: true, letterSpacing: 170 }),
      text({ x: 0.28, y: 0.72, w: 3.0, h: 0.68, value: "Do not call 2026.06 green until CLOUD-2241 and SEN-908 are below P1.", size: 18, color: PAPER, bold: true, lineHeight: 1.12 }),
      bullets({
        x: 0.32,
        y: 1.68,
        w: 2.95,
        h: 0.5,
        items: ["Move 2 engineers to sensor reliability", "Hold SOAR analytics scope", "Protect top 5 renewal commitments"],
        size: 9,
        color: "CAD6E7",
      }),
    ],
  }),
]);

const slide7 = slide(7, "Where ezsecurity teams intersect", "The useful insight is not a Jira chart or a Salesforce chart; it is the account-product-owner connection.", [
  {
    type: "grid",
    position: { x: 0.72, y: 1.88 },
    size: { width: 8.55, height: 2.58 },
    columns: 3,
    gap: 0.2,
    alignItems: "stretch",
    justifyItems: "stretch",
    children: [
      signalCard("CLOUD-2241", "Jira", "Sensor memory issue blocks $2.4M commit", TEAL),
      signalCard("Northstar Bank", "Salesforce", "$1.2M deal aging in security review", AMBER),
      signalCard("Reliability cell", "Owner", "VP Eng + PM own daily burn-down", VIOLET),
      signalCard("CISO assist", "Customer trust", "5 exec calls before Jun 7", RED),
      signalCard("CRO motion", "Forecast", "Move blocked commit to best-case unless fixed", BLUE),
      signalCard("Support trend", "Cases", "183 open tickets; 41 linked to sensor", GREEN),
    ],
  } satisfies GridEl,
  text({
    x: 0.9,
    y: 4.62,
    w: 8.0,
    h: 0.22,
    value: "Weekly exec loop: filter by ARR exposure, assign one owner, close Jira and SFDC next steps in the same review.",
    size: 10.5,
    color: MUTED,
    align: "center",
  }),
]);

const slide8 = slide(8, "Board actions for June 2026", "Decisions are derived from the linked account-product risk register, not standalone dashboard views.", [
  {
    type: "grid",
    position: { x: 0.68, y: 2.0 },
    size: { width: 8.66, height: 2.42 },
    columns: 2,
    gap: 0.24,
    alignItems: "stretch",
    justifyItems: "stretch",
    children: [
      card({
        x: 0,
        y: 0,
        w: 4.15,
        h: 2.2,
        fill: PAPER,
        children: [
          text({ x: 0.28, y: 0.26, w: 2.7, h: 0.22, value: "DECISIONS", size: 8, color: BLUE, bold: true, letterSpacing: 160 }),
          bullets({
            x: 0.34,
            y: 0.68,
            w: 3.32,
            h: 1.06,
            items: [
              "Approve 2-squad CLOUD reliability cell through Jun 28",
              "CISO to sponsor Northstar and Horizon Health saves",
              "Move SOAR analytics from Q2 unless tied to commit deals",
            ],
            size: 10.2,
            color: INK,
          }),
        ],
      }),
      card({
        x: 0,
        y: 0,
        w: 4.15,
        h: 2.2,
        fill: PAPER,
        children: [
          text({ x: 0.28, y: 0.26, w: 2.7, h: 0.22, value: "NEXT SIGNALS", size: 8, color: AMBER, bold: true, letterSpacing: 160 }),
          table({
            x: 0.28,
            y: 0.66,
            w: 3.54,
            h: 1.04,
            columns: ["Metric", "May 29", "Jun target"],
            rows: [
              ["P1/P2 aging", "18", "< 8"],
              ["Commit blocked", "$4.6M", "< $1.5M"],
              ["Renewal risk", "$3.1M", "< $2.0M"],
            ],
            fontSize: 7.2,
          }),
        ],
      }),
    ],
  } satisfies GridEl,
]);

export const cybersecurityBusinessDeck: Deck = {
  title: "ezsecurity May 2026 Executive Review",
  description:
    "May 2026 ezsecurity operating review combining Jira delivery risk, Salesforce forecast exposure, renewal risk, and board-level actions.",
  theme: {
    background: MIST,
    surface: PAPER,
    primary: NAVY,
    secondary: BLUE,
    accent: AMBER,
    text: INK,
    muted: MUTED,
  },
  slides: [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8],
};
