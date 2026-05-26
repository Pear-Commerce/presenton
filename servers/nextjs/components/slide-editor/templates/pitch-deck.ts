import { type Deck, type Slide, type SlideElement } from "../lib/slide-schema";

// ── Editorial cream-paper palette ───────────────────────────────────────
// Distinct from layout-kit's corporate navy/gold. The pitch deck reads like
// a print magazine: warm paper, big serif headlines, a single confident
// accent doing all the heavy lifting.
const PAPER = "F5F1E8";       // warm cream — slide background
const SURFACE = "FFFFFF";     // pure white — cards
const INK = "1A1A1A";         // deep near-black — body type
const CORAL = "D9534F";       // primary accent — single hero color
const DEEP = "5A2620";        // burgundy — section dividers / emphasis bg
const AMBER = "C49D5E";       // aged-gold secondary accent
const MUTED = "6B6B6B";       // mid-gray meta text
const WHISPER = "B0B0B0";     // lighter gray
const LINE = "E0DCD3";        // hairline separator

// Georgia ships with PowerPoint, Keynote, Google Slides and macOS/Windows
// — safe cross-renderer serif. Pairs with Arial for body.
const SERIF = "Georgia";
const SANS = "Arial";

const TOTAL = 10;

// ── Shared chrome ───────────────────────────────────────────────────────
function footer(num: number, total: number, onDeep: boolean): SlideElement[] {
  const c = onDeep ? WHISPER : MUTED;
  return [
    {
      kind: "text",
      x: 0.5,
      y: 5.25,
      w: 4,
      h: 0.3,
      text: "Starship",
      fontSize: 11,
      italic: true,
      color: c,
      fontFace: SERIF,
    },
    {
      kind: "text",
      x: 8.5,
      y: 5.25,
      w: 1.0,
      h: 0.3,
      text: `${num} / ${total}`,
      fontSize: 10,
      italic: true,
      color: c,
      align: "right",
      fontFace: SERIF,
    },
  ];
}

function eyebrow(text: string, color: string = CORAL): SlideElement {
  return {
    kind: "text",
    x: 0.6,
    y: 0.65,
    w: 6,
    h: 0.28,
    text,
    fontSize: 10,
    bold: true,
    color,
    charSpacing: 340,
    fontFace: SANS,
  };
}

function headline(text: string): SlideElement {
  return {
    kind: "text",
    x: 0.6,
    y: 1.0,
    w: 8.8,
    h: 0.85,
    text,
    fontSize: 36,
    color: INK,
    lineHeight: 1.05,
    fontFace: SERIF,
  };
}

// Coral hairline under headlines — replaces layout-kit's gold accent rect.
function rule(y: number, w = 0.7, color = CORAL): SlideElement {
  return { kind: "rect", x: 0.6, y, w, h: 0.025, fill: color };
}

// ── Slide 1: Cover ──────────────────────────────────────────────────────
const slide1Cover: Slide = {
  title: "Cover",
  background: PAPER,
  elements: [
    // Right-margin marker — a hairline rule with a coral pin, the kind of
    // confident single flourish you'd see on a magazine cover.
    { kind: "rect", x: 9.4, y: 0.6, w: 0.04, h: 4.4, fill: CORAL },
    { kind: "ellipse", x: 9.22, y: 0.42, w: 0.4, h: 0.4, fill: CORAL },

    {
      kind: "text",
      x: 0.6,
      y: 0.65,
      w: 6,
      h: 0.28,
      text: "SERIES A · SPRING 2026",
      fontSize: 10,
      bold: true,
      color: CORAL,
      charSpacing: 340,
      fontFace: SANS,
    },

    // Massive serif wordmark — left-aligned, hero of the slide.
    {
      kind: "text",
      x: 0.55,
      y: 1.55,
      w: 7,
      h: 2.0,
      text: "Starship.",
      fontSize: 110,
      color: INK,
      lineHeight: 1.0,
      fontFace: SERIF,
    },

    rule(3.55, 0.6, CORAL),

    {
      kind: "text",
      x: 0.6,
      y: 3.75,
      w: 6.2,
      h: 0.9,
      text: "An operating system for the next generation of small teams.",
      fontSize: 18,
      italic: true,
      color: INK,
      lineHeight: 1.4,
      fontFace: SERIF,
    },

    {
      kind: "text",
      x: 0.6,
      y: 4.78,
      w: 5,
      h: 0.28,
      text: "Jane Founder — CEO",
      fontSize: 12,
      color: INK,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 5.05,
      w: 5,
      h: 0.25,
      text: "jane@starship.example",
      fontSize: 11,
      color: MUTED,
      fontFace: SANS,
    },
  ],
};

// ── Slide 2: Problem ────────────────────────────────────────────────────
function problemStat(x: number, big: string, label: string): SlideElement[] {
  return [
    {
      kind: "text",
      x,
      y: 3.5,
      w: 2.8,
      h: 1.0,
      text: big,
      fontSize: 56,
      color: CORAL,
      lineHeight: 1.0,
      fontFace: SERIF,
    },
    { kind: "rect", x, y: 4.5, w: 0.35, h: 0.025, fill: INK },
    {
      kind: "text",
      x,
      y: 4.6,
      w: 2.8,
      h: 0.5,
      text: label,
      fontSize: 11,
      color: INK,
      lineHeight: 1.4,
      fontFace: SANS,
    },
  ];
}

const slide2Problem: Slide = {
  title: "Problem",
  background: PAPER,
  elements: [
    eyebrow("THE PROBLEM"),
    {
      kind: "text",
      x: 0.6,
      y: 1.05,
      w: 8.8,
      h: 2.1,
      text:
        "Small teams ship a dozen tools to do the work of one — and pay the\n" +
        "spreadsheet tax every Friday afternoon.",
      fontSize: 32,
      color: INK,
      lineHeight: 1.2,
      fontFace: SERIF,
    },
    rule(3.3, 0.6),
    ...problemStat(0.6, "11", "tools in the average operations stack"),
    ...problemStat(3.7, "62%", "of week lost stitching context across tools"),
    ...problemStat(6.8, "$48k", "per FTE per year on operations software"),
    ...footer(2, TOTAL, false),
  ],
};

// ── Slide 3: Solution ───────────────────────────────────────────────────
const slide3Solution: Slide = {
  title: "Solution",
  background: PAPER,
  elements: [
    eyebrow("THE SOLUTION"),
    headline("One workspace.\nThe work, the data, the decision."),
    rule(2.0, 0.6),

    {
      kind: "text",
      x: 0.6,
      y: 2.3,
      w: 4.3,
      h: 2.2,
      text:
        "Starship unifies the operating layer — projects, customers, " +
        "contracts, and finance — into a single editable surface. " +
        "Replaces the spreadsheet tax with a model your team can " +
        "actually trust.",
      fontSize: 13,
      color: INK,
      lineHeight: 1.55,
      fontFace: SANS,
    },

    {
      kind: "text",
      x: 0.6,
      y: 4.65,
      w: 4.3,
      h: 0.25,
      text: "BUILT FOR TEAMS OF 5 TO 50",
      fontSize: 9,
      bold: true,
      color: CORAL,
      charSpacing: 280,
      fontFace: SANS,
    },

    // Image with a coral rule above it — editorial caption treatment.
    { kind: "rect", x: 5.25, y: 2.25, w: 0.5, h: 0.04, fill: CORAL },
    {
      kind: "image",
      x: 5.25,
      y: 2.4,
      w: 4.15,
      h: 2.6,
      fit: "cover",
      name: "Product screenshot placeholder",
    },
    ...footer(3, TOTAL, false),
  ],
};

// ── Slide 4: Why now ────────────────────────────────────────────────────
function whyNowItem(y: number, num: string, title: string, body: string): SlideElement[] {
  return [
    // Big serif number on the left
    {
      kind: "text",
      x: 0.6,
      y,
      w: 0.9,
      h: 0.7,
      text: num,
      fontSize: 38,
      italic: true,
      color: CORAL,
      lineHeight: 1.0,
      fontFace: SERIF,
    },
    // Title in serif
    {
      kind: "text",
      x: 1.7,
      y: y + 0.05,
      w: 7.6,
      h: 0.45,
      text: title,
      fontSize: 18,
      color: INK,
      fontFace: SERIF,
    },
    // Body in sans
    {
      kind: "text",
      x: 1.7,
      y: y + 0.55,
      w: 7.6,
      h: 0.4,
      text: body,
      fontSize: 12,
      color: MUTED,
      lineHeight: 1.4,
      fontFace: SANS,
    },
    // Hairline separator below
    { kind: "rect", x: 1.7, y: y + 1.05, w: 7.6, h: 0.01, fill: LINE },
  ];
}

const slide4WhyNow: Slide = {
  title: "Why Now",
  background: PAPER,
  elements: [
    eyebrow("WHY NOW"),
    headline("Three forces just made the old stack obsolete."),
    rule(2.0, 0.6),
    ...whyNowItem(
      2.2,
      "01",
      "AI assistants go mainstream",
      "Embedded copilots collapsed the cost of building integrated workflows.",
    ),
    ...whyNowItem(
      3.25,
      "02",
      "Distributed hiring is default",
      "Small teams now operate across five timezones — async coordination is non-negotiable.",
    ),
    ...whyNowItem(
      4.3,
      "03",
      "SaaS budgets are being cut",
      "CFOs are consolidating tools; the team that replaces four wins the budget.",
    ),
    ...footer(4, TOTAL, false),
  ],
};

// ── Slide 5: Product ────────────────────────────────────────────────────
const slide5Product: Slide = {
  title: "Product",
  background: PAPER,
  elements: [
    eyebrow("PRODUCT"),
    headline("Four surfaces. One model underneath."),
    rule(2.0, 0.6),
    ...[
      ["Operate", "Run projects with built-in finance and capacity tracking."],
      ["Decide", "Compare scenarios with versioned, queryable docs."],
      ["Automate", "Trigger workflows from any field with no-code recipes."],
      ["Report", "Ship board-ready views without rebuilding the spreadsheet."],
    ].flatMap((entry, index): SlideElement[] => {
      const [label, body] = entry;
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 0.6 + col * 4.4;
      const y = 2.25 + row * 1.35;
      return [
        // Subtle card — only a hairline border + paper-white fill.
        {
          kind: "rect",
          x,
          y,
          w: 4.15,
          h: 1.15,
          fill: SURFACE,
          line: { color: LINE, width: 0.5 },
        },
        // Coral hairline above the feature name — replaces the gold stripe.
        { kind: "rect", x: x + 0.3, y: y + 0.22, w: 0.32, h: 0.025, fill: CORAL },
        {
          kind: "text",
          x: x + 0.3,
          y: y + 0.3,
          w: 3.6,
          h: 0.36,
          text: label,
          fontSize: 18,
          color: INK,
          fontFace: SERIF,
        },
        {
          kind: "text",
          x: x + 0.3,
          y: y + 0.7,
          w: 3.6,
          h: 0.4,
          text: body,
          fontSize: 11,
          color: MUTED,
          lineHeight: 1.4,
          fontFace: SANS,
        },
      ];
    }),
    ...footer(5, TOTAL, false),
  ],
};

// ── Slide 6: Traction ───────────────────────────────────────────────────
function tractionStat(x: number, big: string, label: string): SlideElement[] {
  return [
    {
      kind: "text",
      x,
      y: 3.85,
      w: 2.8,
      h: 0.85,
      text: big,
      fontSize: 44,
      color: CORAL,
      lineHeight: 1.0,
      fontFace: SERIF,
    },
    { kind: "rect", x, y: 4.7, w: 0.32, h: 0.025, fill: INK },
    {
      kind: "text",
      x,
      y: 4.8,
      w: 2.8,
      h: 0.28,
      text: label,
      fontSize: 9,
      bold: true,
      color: INK,
      charSpacing: 280,
      fontFace: SANS,
    },
  ];
}

const slide6Traction: Slide = {
  title: "Traction",
  background: PAPER,
  elements: [
    eyebrow("TRACTION"),
    headline("Eighteen months. Compounding revenue."),
    rule(2.0, 0.6),
    {
      kind: "chart",
      chartType: "line",
      x: 0.6,
      y: 2.3,
      w: 8.8,
      h: 1.45,
      title: "ARR ($k) · trailing 6 quarters",
      color: CORAL,
      axisColor: WHISPER,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Q1", value: 42 },
        { label: "Q2", value: 88 },
        { label: "Q3", value: 162 },
        { label: "Q4", value: 240 },
        { label: "Q5", value: 358 },
        { label: "Q6", value: 510 },
      ],
    },
    ...tractionStat(0.6, "$510k", "ARR"),
    ...tractionStat(3.7, "118%", "NET RETENTION"),
    ...tractionStat(6.8, "1.4×", "QUARTERLY GROWTH"),
    ...footer(6, TOTAL, false),
  ],
};

// ── Slide 7: Business Model ─────────────────────────────────────────────
const slide7Model: Slide = {
  title: "Business Model",
  background: PAPER,
  elements: [
    eyebrow("BUSINESS MODEL"),
    headline("Per-seat pricing with usage-based add-ons."),
    rule(2.0, 0.6),
    {
      kind: "table",
      x: 0.6,
      y: 2.3,
      w: 8.8,
      h: 2.5,
      rows: [
        ["Tier", "Seats", "Monthly", "Includes"],
        ["Starter", "1 – 5", "$24 / seat", "Operate + Decide"],
        ["Team", "6 – 25", "$36 / seat", "+ Automate"],
        ["Scale", "26 – 100", "$48 / seat", "+ Report, SSO, audit"],
        ["Enterprise", "100+", "Talk to us", "Dedicated infra, SLAs"],
      ],
      fontFace: SANS,
      fontSize: 11,
      textColor: INK,
      headerFill: CORAL,
      headerTextColor: "FFFFFF",
      borderColor: LINE,
      fill: SURFACE,
      opacity: 1,
    },
    {
      kind: "text",
      x: 0.6,
      y: 4.95,
      w: 8.8,
      h: 0.25,
      text:
        "Gross margin holds at 82%; payback under 9 months on Team and above.",
      fontSize: 11,
      italic: true,
      color: MUTED,
      fontFace: SERIF,
    },
    ...footer(7, TOTAL, false),
  ],
};

// ── Slide 8: Competition ────────────────────────────────────────────────
const slide8Competition: Slide = {
  title: "Competition",
  background: PAPER,
  elements: [
    eyebrow("COMPETITION"),
    headline("Bundled where the market is unbundled."),
    rule(2.0, 0.6),

    // Quadrant card — pure white surface with hairline border.
    {
      kind: "rect",
      x: 0.6,
      y: 2.3,
      w: 5.0,
      h: 2.8,
      fill: SURFACE,
      line: { color: LINE, width: 0.5 },
    },
    // Axes
    { kind: "rect", x: 0.6, y: 3.7, w: 5.0, h: 0.01, fill: WHISPER },
    { kind: "rect", x: 3.1, y: 2.3, w: 0.01, h: 2.8, fill: WHISPER },

    // Axis labels — serif italic for an editorial feel.
    {
      kind: "text",
      x: 0.7,
      y: 2.4,
      w: 2.2,
      h: 0.22,
      text: "AI-native",
      fontSize: 10,
      italic: true,
      color: MUTED,
      fontFace: SERIF,
    },
    {
      kind: "text",
      x: 0.7,
      y: 4.85,
      w: 2.2,
      h: 0.22,
      text: "Legacy",
      fontSize: 10,
      italic: true,
      color: MUTED,
      fontFace: SERIF,
    },
    {
      kind: "text",
      x: 0.7,
      y: 5.13,
      w: 5,
      h: 0.22,
      text: "single tool        BREADTH        all-in-one",
      fontSize: 9,
      bold: true,
      color: MUTED,
      charSpacing: 180,
      align: "center",
      fontFace: SANS,
    },

    // Quadrant dots
    { kind: "ellipse", x: 1.0, y: 4.25, w: 0.22, h: 0.22, fill: INK },
    {
      kind: "text",
      x: 1.3,
      y: 4.23,
      w: 1.6,
      h: 0.26,
      text: "Spreadsheet",
      fontSize: 10,
      color: INK,
      fontFace: SERIF,
    },
    { kind: "ellipse", x: 4.1, y: 4.2, w: 0.22, h: 0.22, fill: INK },
    {
      kind: "text",
      x: 4.4,
      y: 4.18,
      w: 1.3,
      h: 0.26,
      text: "Legacy ERP",
      fontSize: 10,
      color: INK,
      fontFace: SERIF,
    },
    { kind: "ellipse", x: 1.55, y: 2.85, w: 0.22, h: 0.22, fill: INK },
    {
      kind: "text",
      x: 1.85,
      y: 2.83,
      w: 1.4,
      h: 0.26,
      text: "AI point tool",
      fontSize: 10,
      color: INK,
      fontFace: SERIF,
    },
    // Starship — bigger, coral, the hero dot.
    { kind: "ellipse", x: 4.55, y: 2.7, w: 0.36, h: 0.36, fill: CORAL },
    {
      kind: "text",
      x: 4.95,
      y: 2.75,
      w: 1.4,
      h: 0.28,
      text: "Starship",
      fontSize: 12,
      italic: true,
      color: CORAL,
      fontFace: SERIF,
    },

    // Right column — editorial wedge list with serif markers.
    {
      kind: "text",
      x: 5.95,
      y: 2.3,
      w: 3.45,
      h: 0.3,
      text: "OUR WEDGE",
      fontSize: 9,
      bold: true,
      color: CORAL,
      charSpacing: 280,
      fontFace: SANS,
    },
    { kind: "rect", x: 5.95, y: 2.6, w: 0.5, h: 0.025, fill: CORAL },
    ...[
      "Built model-first, not feature-first.",
      "Replaces four incumbents on average.",
      "AI assist priced into the seat, not extra.",
      "Migration in days, not quarters.",
    ].flatMap((text, index): SlideElement[] => {
      const y = 2.85 + index * 0.55;
      return [
        {
          kind: "text",
          x: 5.95,
          y,
          w: 0.3,
          h: 0.3,
          text: "—",
          fontSize: 14,
          color: CORAL,
          fontFace: SERIF,
        },
        {
          kind: "text",
          x: 6.3,
          y,
          w: 3.1,
          h: 0.45,
          text,
          fontSize: 12,
          color: INK,
          lineHeight: 1.35,
          fontFace: SERIF,
        },
      ];
    }),
    ...footer(8, TOTAL, false),
  ],
};

// ── Slide 9: Team ───────────────────────────────────────────────────────
function teamCard(x: number, name: string, role: string, bio: string): SlideElement[] {
  return [
    {
      kind: "rect",
      x,
      y: 2.3,
      w: 2.85,
      h: 2.6,
      fill: SURFACE,
      line: { color: LINE, width: 0.5 },
    },
    // Coral-ringed initial — editorial portrait stand-in.
    { kind: "ellipse", x: x + 0.95, y: 2.55, w: 0.95, h: 0.95, fill: PAPER },
    { kind: "ellipse", x: x + 1.0, y: 2.6, w: 0.85, h: 0.85, fill: SURFACE },
    {
      kind: "text",
      x: x + 0.95,
      y: 2.55,
      w: 0.95,
      h: 0.95,
      text: name
        .split(" ")
        .map((part) => part[0])
        .join(""),
      fontSize: 26,
      color: CORAL,
      align: "center",
      valign: "middle",
      fontFace: SERIF,
    },

    {
      kind: "text",
      x: x + 0.2,
      y: 3.7,
      w: 2.45,
      h: 0.32,
      text: name,
      fontSize: 17,
      color: INK,
      align: "center",
      fontFace: SERIF,
    },
    { kind: "rect", x: x + 1.25, y: 4.02, w: 0.3, h: 0.02, fill: CORAL },
    {
      kind: "text",
      x: x + 0.2,
      y: 4.1,
      w: 2.45,
      h: 0.24,
      text: role,
      fontSize: 9,
      bold: true,
      color: MUTED,
      charSpacing: 280,
      align: "center",
      fontFace: SANS,
    },
    {
      kind: "text",
      x: x + 0.2,
      y: 4.4,
      w: 2.45,
      h: 0.5,
      text: bio,
      fontSize: 10,
      italic: true,
      color: INK,
      align: "center",
      lineHeight: 1.4,
      fontFace: SERIF,
    },
  ];
}

const slide9Team: Slide = {
  title: "Team",
  background: PAPER,
  elements: [
    eyebrow("TEAM"),
    headline("Operators who built and shipped this before."),
    rule(2.0, 0.6),
    ...teamCard(
      0.6,
      "Jane Founder",
      "CEO",
      "Previously led ops at Northstar; scaled finance team from 4 to 60.",
    ),
    ...teamCard(
      3.6,
      "Ravi Patel",
      "CTO",
      "Built the data platform at Heron; ten years on distributed systems.",
    ),
    ...teamCard(
      6.6,
      "Mia Chen",
      "HEAD OF GTM",
      "Series-A through D playbook at Vector; took ARR from $2M to $40M.",
    ),
    ...footer(9, TOTAL, false),
  ],
};

// ── Slide 10: Ask ───────────────────────────────────────────────────────
function fundsRow(y: number, percent: string, label: string, body: string): SlideElement[] {
  return [
    {
      kind: "text",
      x: 5.3,
      y,
      w: 1.2,
      h: 0.5,
      text: percent,
      fontSize: 28,
      color: AMBER,
      lineHeight: 1.0,
      fontFace: SERIF,
    },
    {
      kind: "text",
      x: 6.65,
      y,
      w: 2.85,
      h: 0.3,
      text: label,
      fontSize: 10,
      bold: true,
      color: PAPER,
      charSpacing: 280,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 6.65,
      y: y + 0.32,
      w: 2.85,
      h: 0.5,
      text: body,
      fontSize: 11,
      italic: true,
      color: WHISPER,
      lineHeight: 1.4,
      fontFace: SERIF,
    },
  ];
}

const slide10Ask: Slide = {
  title: "Ask",
  background: DEEP,
  elements: [
    // Inverted slide — deep burgundy paper-flip for the closing moment.
    {
      kind: "text",
      x: 0.6,
      y: 0.65,
      w: 4,
      h: 0.28,
      text: "THE ASK",
      fontSize: 10,
      bold: true,
      color: AMBER,
      charSpacing: 340,
      fontFace: SANS,
    },

    {
      kind: "text",
      x: 0.55,
      y: 1.4,
      w: 4.5,
      h: 2.0,
      text: "$8M",
      fontSize: 140,
      color: PAPER,
      lineHeight: 1.0,
      fontFace: SERIF,
    },
    { kind: "rect", x: 0.6, y: 3.4, w: 0.6, h: 0.04, fill: CORAL },
    {
      kind: "text",
      x: 0.6,
      y: 3.55,
      w: 4.2,
      h: 0.45,
      text: "Series A · 24-month runway",
      fontSize: 17,
      italic: true,
      color: PAPER,
      fontFace: SERIF,
    },
    {
      kind: "text",
      x: 0.6,
      y: 4.15,
      w: 4.2,
      h: 0.95,
      text:
        "Leading the round with a strategic partner. Target close: Q3 2026. " +
        "Welcoming follow-on from existing investors.",
      fontSize: 12,
      color: WHISPER,
      lineHeight: 1.5,
      fontFace: SANS,
    },

    // Right column: use of funds
    {
      kind: "text",
      x: 5.3,
      y: 0.65,
      w: 4,
      h: 0.28,
      text: "USE OF FUNDS",
      fontSize: 10,
      bold: true,
      color: AMBER,
      charSpacing: 340,
      fontFace: SANS,
    },
    { kind: "rect", x: 5.3, y: 1.0, w: 4.1, h: 0.015, fill: WHISPER, opacity: 0.3 },
    ...fundsRow(1.25, "45%", "PRODUCT & ENGINEERING", "Ship Automate; double the platform team."),
    ...fundsRow(2.25, "30%", "GO TO MARKET", "Build outbound; mid-market sales motion."),
    ...fundsRow(3.25, "15%", "CUSTOMER SUCCESS", "White-glove onboarding for top quartile."),
    ...fundsRow(4.25, "10%", "OPERATIONS", "Finance, legal, and the next two milestones."),
    ...footer(10, TOTAL, true),
  ],
};

export const pitchDeck: Deck = {
  title: "Starship Pitch Deck",
  description: "A ten-slide editorial pitch from cover through ask.",
  theme: {
    background: PAPER,
    surface: SURFACE,
    primary: CORAL,
    secondary: DEEP,
    accent: AMBER,
    text: INK,
    muted: MUTED,
  },
  slides: [
    slide1Cover,
    slide2Problem,
    slide3Solution,
    slide4WhyNow,
    slide5Product,
    slide6Traction,
    slide7Model,
    slide8Competition,
    slide9Team,
    slide10Ask,
  ],
};
