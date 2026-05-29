import type {
  ChartElement,
  Deck,
  Slide,
  SlideElement,
  TableCell,
} from "../lib/slide-schema";

const SANS = "Arial";

const INK = "0C1728";
const NAVY = "071426";
const BLUE = "2563A8";
const SKY = "62B7E8";
const CYAN = "28B8A8";
const GREEN = "2E9E61";
const AMBER = "D7A64A";
const RED = "D45246";
const VIOLET = "755BD6";
const PAPER = "FFFFFF";
const MIST = "F4F8FC";
const LINE = "D7E3EF";
const MUTED = "65758B";
const SOFT_BLUE = "E8F2FC";
const SOFT_GREEN = "E9F7F0";
const SOFT_AMBER = "FFF5DF";
const SOFT_RED = "FCEDEB";
const SOFT_VIOLET = "F0EEFF";

const TOTAL = 10;

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
  };
}

function bullets({
  x,
  y,
  w,
  h,
  items,
  size = 10,
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
  fontSize = 7.6,
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
  const subColor = onDark ? "C5D5E7" : MUTED;

  return [
    rect({ x: 0.5, y: 0.42, w: 0.5, h: 0.055, fill: onDark ? CYAN : BLUE }),
    text({
      x: 0.5,
      y: 0.62,
      w: 3.7,
      h: 0.22,
      value: `EZSECURITY SERIES A | ${String(num).padStart(2, "0")}`,
      size: 8,
      color: onDark ? CYAN : BLUE,
      bold: true,
      letterSpacing: 170,
    }),
    text({
      x: 0.5,
      y: 0.92,
      w: 7.2,
      h: 0.48,
      value: title,
      size: 23,
      color: titleColor,
      bold: true,
      lineHeight: 1.05,
    }),
    text({
      x: 0.52,
      y: 1.44,
      w: 7.2,
      h: 0.36,
      value: subtitle,
      size: 10.2,
      color: subColor,
      lineHeight: 1.26,
    }),
  ];
}

function footer(num: number, onDark = false) {
  return [
    text({
      x: 0.5,
      y: 5.18,
      w: 5.4,
      h: 0.22,
      value: "ezsecurity confidential | investor materials | May 2026",
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

function metric(
  label: string,
  value: string,
  detail: string,
  fill: string,
  accent: string,
): GroupEl {
  return group(0, 0, 2.0, 1.02, [
    rect({ x: 0, y: 0, w: 2.0, h: 1.02, fill, stroke: { color: LINE, width: 0.65 }, r: 0.12 }),
    rect({ x: 0, y: 0, w: 0.07, h: 1.02, fill: accent, r: 0.03 }),
    text({ x: 0.22, y: 0.16, w: 1.38, h: 0.32, value, size: 21, color: INK, bold: true }),
    text({ x: 0.22, y: 0.56, w: 1.45, h: 0.15, value: label, size: 7.2, color: MUTED, bold: true, letterSpacing: 130 }),
    text({ x: 0.22, y: 0.78, w: 1.45, h: 0.16, value: detail, size: 8.2, color: accent, bold: true }),
  ]);
}

function miniMetric(
  label: string,
  value: string,
  detail: string,
  accent: string,
): GroupEl {
  return group(0, 0, 1.48, 0.62, [
    rect({ x: 0, y: 0, w: 1.48, h: 0.62, fill: PAPER, stroke: { color: "20344F", width: 0.55 }, r: 0.1 }),
    text({ x: 0.14, y: 0.1, w: 0.72, h: 0.2, value, size: 15.5, color: INK, bold: true }),
    text({ x: 0.14, y: 0.36, w: 0.62, h: 0.12, value: label, size: 6.4, color: MUTED, bold: true }),
    text({ x: 0.82, y: 0.38, w: 0.44, h: 0.12, value: detail, size: 6.8, color: accent, bold: true, align: "right" }),
  ]);
}

function evidenceCard(title: string, source: string, body: string, accent: string) {
  return group(0, 0, 2.68, 1.12, [
    rect({ x: 0, y: 0, w: 2.68, h: 1.12, fill: PAPER, stroke: { color: LINE, width: 0.65 }, r: 0.13 }),
    ellipse({ x: 0.22, y: 0.18, w: 0.25, h: 0.25, fill: accent }),
    text({ x: 0.58, y: 0.16, w: 1.85, h: 0.22, value: title, size: 11.2, color: INK, bold: true }),
    text({ x: 0.58, y: 0.43, w: 1.65, h: 0.15, value: source, size: 7, color: accent, bold: true, letterSpacing: 120 }),
    text({ x: 0.58, y: 0.66, w: 1.78, h: 0.3, value: body, size: 8.1, color: MUTED, lineHeight: 1.2 }),
  ]);
}

function processStep(index: string, title: string, body: string, accent: string) {
  return group(0, 0, 2.05, 1.1, [
    rect({ x: 0, y: 0, w: 2.05, h: 1.1, fill: PAPER, stroke: { color: LINE, width: 0.65 }, r: 0.12 }),
    ellipse({ x: 0.18, y: 0.18, w: 0.28, h: 0.28, fill: accent }),
    text({ x: 0.235, y: 0.22, w: 0.16, h: 0.12, value: index, size: 7, color: PAPER, bold: true, align: "center" }),
    text({ x: 0.56, y: 0.18, w: 1.22, h: 0.2, value: title, size: 10.5, color: INK, bold: true }),
    text({ x: 0.2, y: 0.56, w: 1.58, h: 0.34, value: body, size: 8.1, color: MUTED, lineHeight: 1.2 }),
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
  title: "ezsecurity Series A",
  background: NAVY,
  elements: [
    ...header(
      1,
      "ezsecurity",
      "Autonomous exposure response for security teams that cannot hire their way out of alert overload.",
      true,
    ),
    text({
      x: 0.58,
      y: 2.0,
      w: 5.2,
      h: 0.9,
      value: "We turn noisy security signals into verified fixes.",
      size: 31,
      color: PAPER,
      bold: true,
      lineHeight: 1.05,
    }),
    text({
      x: 0.6,
      y: 3.16,
      w: 4.8,
      h: 0.42,
      value: "$3.9M ARR, 117% NRR, 41 customers, raising $12M Series A.",
      size: 12,
      color: "C5D5E7",
      lineHeight: 1.3,
    }),
    {
      type: "grid",
      position: { x: 0.62, y: 4.04 },
      size: { width: 4.75, height: 0.62 },
      columns: 3,
      gap: 0.14,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: [
        miniMetric("ARR", "$3.9M", "+286%", SKY),
        miniMetric("Customers", "41", "9 F500", CYAN),
        miniMetric("Raise", "$12M", "24 mo", AMBER),
      ],
    } satisfies GridEl,
    card({
      x: 6.08,
      y: 1.82,
      w: 3.26,
      h: 2.8,
      fill: PAPER,
      stroke: "20344F",
      children: [
        text({ x: 0.28, y: 0.28, w: 2.2, h: 0.2, value: "INVESTMENT SNAPSHOT", size: 8, color: BLUE, bold: true, letterSpacing: 160 }),
        chart({
          x: 0.34,
          y: 0.68,
          w: 2.58,
          h: 1.25,
          chartType: "line",
          title: "ARR growth ($M)",
          color: CYAN,
          data: [
            { label: "Q1 25", value: 0.7 },
            { label: "Q2 25", value: 1.1 },
            { label: "Q3 25", value: 1.8 },
            { label: "Q4 25", value: 2.7 },
            { label: "Q1 26", value: 3.4 },
            { label: "Q2 26", value: 3.9 },
          ],
        }),
        text({ x: 0.34, y: 2.16, w: 2.42, h: 0.28, value: "Capital accelerates enterprise GTM and remediation automation.", size: 9, color: MUTED, lineHeight: 1.2 }),
      ],
    }),
    ...footer(1, true),
  ],
} satisfies Slide;

const slide2 = slide(2, "The security work queue is broken", "Midmarket and enterprise teams face more exposures, more tools, and fewer people to verify fixes.", [
  {
    type: "grid",
    position: { x: 0.68, y: 1.96 },
    size: { width: 8.62, height: 1.08 },
    columns: 4,
    gap: 0.14,
    alignItems: "stretch",
    justifyItems: "stretch",
    children: [
      metric("Alerts per week", "18k", "+42% YoY", SOFT_RED, RED),
      metric("Median fix time", "21d", "critical vulns", SOFT_AMBER, AMBER),
      metric("Tool sprawl", "27", "security apps", SOFT_BLUE, BLUE),
      metric("Analyst gap", "3.2M", "global shortage", SOFT_VIOLET, VIOLET),
    ],
  } satisfies GridEl,
  chart({
    x: 0.82,
    y: 3.36,
    w: 3.95,
    h: 1.18,
    chartType: "line",
    title: "Exposure volume vs team capacity",
    color: RED,
    data: [
      { label: "2022", value: 42 },
      { label: "2023", value: 61 },
      { label: "2024", value: 88 },
      { label: "2025", value: 126 },
      { label: "2026", value: 171 },
    ],
  }),
  card({
    x: 5.18,
    y: 3.18,
    w: 3.95,
    h: 1.38,
    children: [
      text({ x: 0.28, y: 0.22, w: 2.75, h: 0.2, value: "WHY NOW", size: 8, color: RED, bold: true, letterSpacing: 160 }),
      bullets({
        x: 0.34,
        y: 0.58,
        w: 3.08,
        h: 0.56,
        items: [
          "AI-generated attacks increase exposure churn",
          "Boards demand proof of remediation",
          "Security teams need outcome automation",
        ],
        size: 9.2,
      }),
    ],
  }),
]);

const slide3 = slide(3, "ezsecurity closes the exposure loop", "The platform prioritizes real risk, creates owner-ready fixes, and proves remediation back to leadership.", [
  {
    type: "flex",
    position: { x: 0.72, y: 1.98 },
    size: { width: 8.52, height: 1.18 },
    direction: "row",
    gap: 0.1,
    alignItems: "stretch",
    justifyContent: "stretch",
    children: [
      processStep("1", "Ingest", "Cloud, endpoint, identity, SIEM, Jira", CYAN),
      processStep("2", "Prioritize", "Exploitability, blast radius, asset value", BLUE),
      processStep("3", "Remediate", "Fix tickets routed to owning teams", AMBER),
      processStep("4", "Prove", "Evidence pack for SOC, CISO, auditors", GREEN),
    ],
  } satisfies FlexEl,
  card({
    x: 0.82,
    y: 3.54,
    w: 3.0,
    h: 1.04,
    fill: NAVY,
    stroke: NAVY,
    children: [
      text({ x: 0.26, y: 0.24, w: 2.2, h: 0.22, value: "CORE CLAIM", size: 8, color: CYAN, bold: true, letterSpacing: 160 }),
      text({ x: 0.28, y: 0.58, w: 2.3, h: 0.28, value: "10x fewer unresolved critical exposures.", size: 14, color: PAPER, bold: true }),
    ],
  }),
  chart({
    x: 4.32,
    y: 3.36,
    w: 4.7,
    h: 1.22,
    chartType: "bar",
    title: "Pilot outcome after 60 days",
    color: CYAN,
    data: [
      { label: "Noise removed", value: 63, color: CYAN },
      { label: "MTTR cut", value: 48, color: BLUE },
      { label: "Auto-routed", value: 71, color: AMBER },
      { label: "Audit ready", value: 92, color: GREEN },
    ],
  }),
]);

const slide4 = slide(4, "Large market, sharp wedge", "Initial wedge: regulated companies with 500 to 8,000 employees and messy security-to-engineering workflows.", [
  chart({
    x: 0.76,
    y: 2.0,
    w: 3.7,
    h: 1.65,
    chartType: "donut",
    title: "Market sizing ($B)",
    color: BLUE,
    data: [
      { label: "TAM", value: 41, color: BLUE },
      { label: "SAM", value: 12, color: CYAN },
      { label: "SOM", value: 1.4, color: GREEN },
    ],
  }),
  table({
    x: 4.82,
    y: 2.02,
    w: 4.08,
    h: 1.58,
    columns: ["Segment", "Accounts", "ACV"],
    rows: [
      ["Fintech 500-5k", "8,400", "$72k"],
      ["Healthcare 1k-8k", "6,100", "$96k"],
      ["SaaS 500-3k", "11,800", "$54k"],
      ["Public sector", "3,900", "$130k"],
    ],
  }),
  bullets({
    x: 1.0,
    y: 4.08,
    w: 7.8,
    h: 0.54,
    items: [
      "Beachhead has urgent compliance pressure and already uses Jira or ServiceNow",
      "Expansion path moves from exposure response into continuous control assurance",
    ],
    size: 10.2,
  }),
]);

const slide5 = slide(5, "Traction is already enterprise-grade", "ezsecurity has moved from founder-led pilots to repeatable enterprise sales with strong expansion behavior.", [
  {
    type: "grid",
    position: { x: 0.66, y: 1.96 },
    size: { width: 8.74, height: 1.08 },
    columns: 4,
    gap: 0.14,
    alignItems: "stretch",
    justifyItems: "stretch",
    children: [
      metric("ARR", "$3.9M", "+286% YoY", SOFT_BLUE, BLUE),
      metric("NRR", "117%", "top quartile", SOFT_GREEN, GREEN),
      metric("Gross margin", "82%", "software only", SOFT_VIOLET, VIOLET),
      metric("Payback", "10.5mo", "blended CAC", SOFT_AMBER, AMBER),
    ],
  } satisfies GridEl,
  chart({
    x: 0.78,
    y: 3.42,
    w: 4.05,
    h: 1.18,
    chartType: "line",
    title: "ARR progression ($M)",
    color: GREEN,
    data: [
      { label: "Q1 25", value: 0.7 },
      { label: "Q2 25", value: 1.1 },
      { label: "Q3 25", value: 1.8 },
      { label: "Q4 25", value: 2.7 },
      { label: "Q1 26", value: 3.4 },
      { label: "Q2 26", value: 3.9 },
    ],
  }),
  card({
    x: 5.12,
    y: 3.28,
    w: 3.9,
    h: 1.34,
    children: [
      text({ x: 0.28, y: 0.22, w: 2.6, h: 0.2, value: "CUSTOMER SIGNALS", size: 8, color: GREEN, bold: true, letterSpacing: 150 }),
      bullets({
        x: 0.34,
        y: 0.58,
        w: 3.06,
        h: 0.56,
        items: [
          "41 paying customers, 9 Fortune 500 teams",
          "71% of new ARR sourced from security-engineering workflows",
          "Top expansion account grew from $82k to $310k ARR",
        ],
        size: 8.9,
      }),
    ],
  }),
]);

const slide6 = slide(6, "Customers buy measurable outcomes", "The buyer is the CISO; the daily user is security engineering; the budget expands through compliance proof.", [
  {
    type: "grid",
    position: { x: 0.72, y: 1.9 },
    size: { width: 8.55, height: 2.5 },
    columns: 2,
    gap: 0.2,
    alignItems: "stretch",
    justifyItems: "stretch",
    children: [
      evidenceCard("Northstar Bank", "Financial services", "Cut critical exposure backlog by 57% in 8 weeks", BLUE),
      evidenceCard("Horizon Health", "Healthcare", "Reduced audit evidence prep from 9 days to 7 hours", GREEN),
      evidenceCard("MetroGrid", "Energy", "Mapped 14,200 assets into owner-ready work queues", AMBER),
      evidenceCard("Apex Insurance", "Insurance", "Expanded from cloud posture to endpoint remediation", VIOLET),
    ],
  } satisfies GridEl,
  text({
    x: 0.9,
    y: 4.66,
    w: 8.0,
    h: 0.22,
    value: "Customer proof is tracked as time-to-fix, evidence completeness, and accountable owner assignment.",
    size: 10.3,
    color: MUTED,
    align: "center",
  }),
]);

const slide7 = slide(7, "Go-to-market is repeatable", "A focused enterprise motion sells into regulated teams with immediate workflow pain and compliance pressure.", [
  chart({
    x: 0.72,
    y: 2.0,
    w: 4.08,
    h: 1.42,
    chartType: "bar",
    title: "Current pipeline by stage ($M)",
    color: AMBER,
    data: [
      { label: "Discovery", value: 2.2, color: SOFT_AMBER },
      { label: "Pilot", value: 3.8, color: AMBER },
      { label: "Security", value: 2.1, color: VIOLET },
      { label: "Legal", value: 1.3, color: BLUE },
      { label: "Commit", value: 1.1, color: GREEN },
    ],
  }),
  table({
    x: 5.1,
    y: 2.0,
    w: 4.08,
    h: 1.42,
    columns: ["Motion", "Metric", "Result"],
    rows: [
      ["Founder-led", "2025 close rate", "38%"],
      ["SE-assisted", "Pilot-to-paid", "72%"],
      ["Partner", "Cloud marketplace", "$410k pipe"],
      ["Expansion", "Seat growth", "2.3x year 2"],
    ],
  }),
  {
    type: "flex",
    position: { x: 0.66, y: 3.72 },
    size: { width: 8.74, height: 1.08 },
    direction: "row",
    gap: 0.14,
    alignItems: "stretch",
    justifyContent: "stretch",
    children: [
      metric("ACV", "$74k", "new logo", SOFT_BLUE, BLUE),
      metric("Sales cycle", "63d", "median", SOFT_GREEN, GREEN),
      metric("Pipeline", "$10.5M", "Q2 open", SOFT_AMBER, AMBER),
      metric("Win rate", "34%", "qualified", SOFT_VIOLET, VIOLET),
    ],
  } satisfies FlexEl,
]);

const slide8 = slide(8, "Business model compounds with usage", "ezsecurity prices by protected asset volume, automation modules, and evidence retention requirements.", [
  table({
    x: 0.72,
    y: 1.98,
    w: 4.3,
    h: 2.08,
    columns: ["Plan", "Target", "ARR"],
    rows: [
      ["Team", "500-1.5k assets", "$36k"],
      ["Business", "1.5k-8k assets", "$84k"],
      ["Enterprise", "8k+ assets", "$180k+"],
      ["Assurance add-on", "Audit evidence", "+28%"],
    ],
  }),
  card({
    x: 5.38,
    y: 1.98,
    w: 3.72,
    h: 2.08,
    fill: NAVY,
    stroke: NAVY,
    children: [
      text({ x: 0.28, y: 0.26, w: 2.8, h: 0.2, value: "UNIT ECONOMICS", size: 8, color: CYAN, bold: true, letterSpacing: 160 }),
      text({ x: 0.32, y: 0.68, w: 1.24, h: 0.34, value: "82%", size: 22, color: PAPER, bold: true }),
      text({ x: 1.86, y: 0.68, w: 1.24, h: 0.34, value: "10.5", size: 22, color: PAPER, bold: true }),
      text({ x: 0.32, y: 1.06, w: 1.1, h: 0.16, value: "gross margin", size: 7.4, color: "C5D5E7", bold: true }),
      text({ x: 1.86, y: 1.06, w: 1.2, h: 0.16, value: "CAC payback mo", size: 7.4, color: "C5D5E7", bold: true }),
      text({ x: 0.32, y: 1.5, w: 2.85, h: 0.24, value: "Expansion comes from asset growth, compliance evidence, and additional remediation modules.", size: 9, color: "C5D5E7", lineHeight: 1.2 }),
    ],
  }),
  bullets({
    x: 0.92,
    y: 4.42,
    w: 8.0,
    h: 0.3,
    items: ["Land in exposure response, expand into control assurance and executive evidence reporting"],
    marker: "none",
    size: 10.5,
    color: MUTED,
  }),
]);

const slide9 = slide(9, "Moat: workflow data plus verified fixes", "Most tools find risk; ezsecurity owns the operating loop from signal to owner to proof.", [
  table({
    x: 0.72,
    y: 1.98,
    w: 5.12,
    h: 2.36,
    columns: ["Capability", "Scanners", "SIEM", "ezsecurity"],
    rows: [
      ["Asset context", "Partial", "Low", "High"],
      ["Owner routing", "Manual", "Manual", "Automated"],
      ["Fix evidence", "Weak", "No", "Verified"],
      ["Exec reporting", "Generic", "Alert-heavy", "Outcome-based"],
    ],
    fontSize: 7.4,
  }),
  card({
    x: 6.18,
    y: 1.98,
    w: 2.92,
    h: 2.36,
    children: [
      text({ x: 0.28, y: 0.26, w: 2.1, h: 0.2, value: "DEFENSIBILITY", size: 8, color: VIOLET, bold: true, letterSpacing: 160 }),
      bullets({
        x: 0.34,
        y: 0.7,
        w: 2.14,
        h: 1.12,
        items: [
          "Remediation graph learns owner patterns",
          "Evidence packs become compliance system of record",
          "Jira, cloud, identity, and endpoint context in one loop",
        ],
        size: 9,
      }),
    ],
  }),
]);

const slide10 = slide(10, "Raising $12M to scale the wedge", "Capital funds enterprise GTM, remediation automation, and marketplace distribution over a 24-month runway.", [
  card({
    x: 0.72,
    y: 1.96,
    w: 3.1,
    h: 2.48,
    fill: NAVY,
    stroke: NAVY,
    children: [
      text({ x: 0.3, y: 0.28, w: 1.8, h: 0.2, value: "THE ASK", size: 8, color: CYAN, bold: true, letterSpacing: 160 }),
      text({ x: 0.3, y: 0.72, w: 1.8, h: 0.42, value: "$12M", size: 30, color: PAPER, bold: true }),
      text({ x: 0.32, y: 1.22, w: 2.2, h: 0.28, value: "Series A for 24 months runway", size: 10, color: "C5D5E7", bold: true }),
      bullets({
        x: 0.36,
        y: 1.72,
        w: 2.14,
        h: 0.42,
        items: ["Reach $11.8M ARR", "Hire 14 GTM + 9 product", "Launch AWS marketplace"],
        size: 8.7,
        color: "C5D5E7",
      }),
    ],
  }),
  chart({
    x: 4.22,
    y: 1.96,
    w: 2.2,
    h: 1.42,
    chartType: "donut",
    title: "Use of funds",
    color: BLUE,
    data: [
      { label: "GTM", value: 52, color: BLUE },
      { label: "Product", value: 32, color: CYAN },
      { label: "Cloud", value: 10, color: AMBER },
      { label: "G&A", value: 6, color: VIOLET },
    ],
  }),
  chart({
    x: 6.72,
    y: 1.96,
    w: 2.4,
    h: 1.42,
    chartType: "line",
    title: "ARR plan ($M)",
    color: GREEN,
    data: [
      { label: "Q2 26", value: 3.9 },
      { label: "Q4 26", value: 6.1 },
      { label: "Q2 27", value: 8.8 },
      { label: "Q4 27", value: 11.8 },
    ],
  }),
  table({
    x: 4.22,
    y: 3.78,
    w: 4.9,
    h: 0.86,
    columns: ["Milestone", "Target"],
    rows: [
      ["Series A close", "Jul 2026"],
      ["Marketplace launch", "Nov 2026"],
      ["Breakout ARR", "$11.8M by Q4 2027"],
    ],
  }),
]);

export const ezsecurityPitchDeck: Deck = {
  title: "ezsecurity Series A Pitch Deck",
  description:
    "Investor pitch deck for ezsecurity with market sizing, product narrative, traction, GTM, business model, moat, financial plan, and raise.",
  theme: {
    background: MIST,
    surface: PAPER,
    primary: NAVY,
    secondary: BLUE,
    accent: CYAN,
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
  ],
};
