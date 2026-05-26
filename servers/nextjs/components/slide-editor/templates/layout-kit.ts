import { SLIDE_H, type Deck, type Slide, type SlideElement } from "../lib/slide-schema";

// ── Palette ─────────────────────────────────────────────────────────────
const NAVY = "0B1F3A";
const DEEP = "071425";
const BLUE = "75AADB";
const BLUE_DK = "3E78B2";
const GOLD = "D4A24C";
const OFF_WHITE = "F4F6FA";
const PAPER = "FFFFFF";
const INK = "1A2B45";
const MUTED = "6A7894";
const MUTED_DK = "9AA7BD";

// Arial renders the same in Google Slides, PowerPoint Web, Keynote, and on
// Windows/macOS. Helvetica isn't bundled with Google's renderer and gets
// substituted with a wider face, which breaks our hand-tuned line wraps.
const SANS = "Arial";

const ORBIT_SVG = `<svg viewBox="0 0 1000 562" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <defs>
    <radialGradient id="orbitGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#75AADB" stop-opacity="0.28"/>
      <stop offset="55%" stop-color="#0B1F3A" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#071425" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1000" height="562" fill="url(#orbitGlow)"/>
  <g fill="none" stroke="#75AADB" stroke-opacity="0.28">
    <ellipse cx="510" cy="278" rx="360" ry="118"/>
    <ellipse cx="510" cy="278" rx="310" ry="88" transform="rotate(-18 510 278)"/>
    <ellipse cx="510" cy="278" rx="250" ry="62" transform="rotate(24 510 278)"/>
  </g>
  <g stroke="#D4A24C" stroke-width="3" stroke-opacity="0.8" filter="url(#softGlow)">
    <line x1="205" y1="262" x2="365" y2="198"/>
    <line x1="365" y1="198" x2="520" y2="284"/>
    <line x1="520" y1="284" x2="694" y2="214"/>
    <line x1="520" y1="284" x2="758" y2="344"/>
    <line x1="365" y1="198" x2="418" y2="398"/>
  </g>
  <g filter="url(#softGlow)">
    <circle cx="205" cy="262" r="12" fill="#D4A24C"/>
    <circle cx="365" cy="198" r="18" fill="#75AADB"/>
    <circle cx="520" cy="284" r="28" fill="#FFFFFF"/>
    <circle cx="694" cy="214" r="16" fill="#75AADB"/>
    <circle cx="758" cy="344" r="12" fill="#D4A24C"/>
    <circle cx="418" cy="398" r="14" fill="#3E78B2"/>
  </g>
</svg>`;

const FLOW_SVG = `<svg viewBox="0 0 1000 360" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <defs>
    <linearGradient id="flowA" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#75AADB"/>
      <stop offset="48%" stop-color="#D4A24C"/>
      <stop offset="100%" stop-color="#0B1F3A"/>
    </linearGradient>
  </defs>
  <path d="M-30 225 C180 40, 330 320, 510 150 C690 -20, 800 250, 1030 82" fill="none" stroke="url(#flowA)" stroke-width="34" stroke-linecap="round" opacity="0.88"/>
  <path d="M-20 285 C190 130, 360 350, 540 220 C720 88, 850 300, 1030 180" fill="none" stroke="#75AADB" stroke-width="12" stroke-linecap="round" opacity="0.36"/>
  <path d="M-20 145 C190 20, 340 225, 500 100 C680 -35, 820 152, 1030 38" fill="none" stroke="#D4A24C" stroke-width="10" stroke-linecap="round" opacity="0.42"/>
  <g fill="#FFFFFF" stroke="#0B1F3A" stroke-width="7">
    <circle cx="205" cy="151" r="26"/>
    <circle cx="510" cy="150" r="34"/>
    <circle cx="802" cy="215" r="26"/>
  </g>
</svg>`;

const RADAR_SVG = `<svg viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="radarFade" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#75AADB" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#75AADB" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="520" height="520" rx="28" fill="#0B1F3A"/>
  <circle cx="260" cy="260" r="205" fill="url(#radarFade)"/>
  <g fill="none" stroke="#75AADB" stroke-opacity="0.36" stroke-width="2">
    <circle cx="260" cy="260" r="60"/>
    <circle cx="260" cy="260" r="120"/>
    <circle cx="260" cy="260" r="180"/>
    <path d="M260 52v416M52 260h416M113 113l294 294M407 113 113 407"/>
  </g>
  <path d="M260 260 L438 155 A205 205 0 0 1 465 260 Z" fill="#D4A24C" opacity="0.34"/>
  <g fill="#D4A24C">
    <circle cx="363" cy="176" r="8"/>
    <circle cx="180" cy="335" r="6"/>
    <circle cx="308" cy="356" r="10"/>
    <circle cx="228" cy="158" r="5"/>
  </g>
</svg>`;

const STORY_SVG = `<svg viewBox="0 0 900 250" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#0B1F3A" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M78 170 C120 72, 190 72, 232 170"/>
    <path d="M375 178 L450 70 L525 178 Z"/>
    <path d="M660 172 C710 88, 790 88, 840 172"/>
  </g>
  <g fill="#D4A24C">
    <circle cx="155" cy="112" r="18"/>
    <circle cx="450" cy="70" r="18"/>
    <circle cx="750" cy="112" r="18"/>
  </g>
  <g fill="#75AADB" opacity="0.9">
    <rect x="90" y="188" width="130" height="16" rx="8"/>
    <rect x="385" y="190" width="130" height="16" rx="8"/>
    <rect x="685" y="188" width="130" height="16" rx="8"/>
  </g>
</svg>`;

const EDITOR_TOOLS_SVG = `<svg viewBox="0 0 420 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="420" height="300" rx="24" fill="#0B1F3A"/>
  <g fill="none" stroke="#75AADB" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M78 210 L155 88 L235 210"/>
    <path d="M185 150 H318"/>
    <path d="M278 110 L318 150 L278 190"/>
  </g>
  <g fill="#D4A24C">
    <circle cx="78" cy="210" r="15"/>
    <circle cx="155" cy="88" r="15"/>
    <circle cx="235" cy="210" r="15"/>
    <circle cx="318" cy="150" r="17"/>
  </g>
  <text x="56" y="265" fill="#FFFFFF" font-family="Arial" font-size="24" font-weight="700">SVG EDIT TARGET</text>
</svg>`;

// ── Shared chrome ───────────────────────────────────────────────────────
function footer(num: number, total: number, onDark: boolean): SlideElement[] {
  const c = onDark ? MUTED_DK : MUTED;
  return [
    {
      kind: "text",
      x: 0.5,
      y: 5.25,
      w: 4,
      h: 0.3,
      text: "LAYOUT SAMPLE",
      fontSize: 9,
      color: c,
      charSpacing: 200,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 8.5,
      y: 5.25,
      w: 1.0,
      h: 0.3,
      text: `${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
      fontSize: 9,
      color: c,
      align: "right",
      fontFace: SANS,
    },
  ];
}

// ── Slide 1: Title ──────────────────────────────────────────────────────
const TOTAL = 20;

const slide1Title: Slide = {
  title: "Title",
  background: NAVY,
  elements: [
    // Massive watermark "19" on the right. Box stays inside the slide and
    // gives ample horizontal room so the digits never wrap or get clipped.
    {
      kind: "text",
      x: 3.8,
      y: 0.1,
      w: 6.2,
      h: 5.4,
      text: "19",
      fontSize: 300,
      bold: true,
      color: "FFFFFF",
      opacity: 0.05,
      fontFace: SANS,
      align: "center",
      valign: "middle",
    },
    // Top kicker
    { kind: "rect", x: 0.6, y: 0.55, w: 0.6, h: 0.06, fill: GOLD },
    {
      kind: "text",
      x: 0.6,
      y: 0.7,
      w: 6,
      h: 0.3,
      text: "LAYOUT KIT · 2026",
      fontSize: 11,
      bold: true,
      color: BLUE,
      charSpacing: 300,
      fontFace: SANS,
    },
    // Big title
    {
      kind: "text",
      x: 0.6,
      y: 1.5,
      w: 8.5,
      h: 2.55,
      text: "PRESENTATION\nLAYOUTS",
      fontSize: 78,
      bold: true,
      color: "FFFFFF",
      charSpacing: 50,
      lineHeight: 1.05,
      fontFace: SANS,
    },
    // Divider + tagline
    { kind: "rect", x: 0.6, y: 4.15, w: 0.5, h: 0.04, fill: GOLD },
    {
      kind: "text",
      x: 0.6,
      y: 4.3,
      w: 8,
      h: 0.45,
      text: "Nineteen common slide patterns built from editable elements.",
      fontSize: 18,
      color: BLUE,
      fontFace: SANS,
    },
    ...footer(1, TOTAL, true),
  ],
};

// ── Slide 2: Profile ────────────────────────────────────────────────────
const slide2Profile: Slide = {
  title: "Profile",
  background: OFF_WHITE,
  elements: [
    // Left navy panel
    { kind: "rect", x: 0, y: 0, w: 3.7, h: SLIDE_H, fill: NAVY },
    // Accent bar across panel
    { kind: "rect", x: 0, y: 4.55, w: 3.7, h: 0.06, fill: GOLD },
    // Eyebrow
    {
      kind: "text",
      x: 0.5,
      y: 0.6,
      w: 3.0,
      h: 0.3,
      text: "COMPANY PROFILE",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 300,
      fontFace: SANS,
    },
    // Name on panel
    {
      kind: "text",
      x: 0.5,
      y: 1.0,
      w: 3.0,
      h: 1.6,
      text: "Acme\nStudio",
      fontSize: 40,
      bold: true,
      color: "FFFFFF",
      lineHeight: 1,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.5,
      y: 2.65,
      w: 3.0,
      h: 0.3,
      text: "Product strategy team",
      fontSize: 12,
      color: BLUE,
      fontFace: SANS,
    },
    // Meta block
    {
      kind: "text",
      x: 0.5,
      y: 3.15,
      w: 3.0,
      h: 1.3,
      text:
        "Founded   2018\n" +
        "HQ        Remote-first\n" +
        "Focus     Product design\n" +
        "Team      42 people",
      fontSize: 11,
      color: "D5DCE8",
      lineHeight: 1.6,
      fontFace: SANS,
    },

    // Right side — eyebrow
    {
      kind: "text",
      x: 4.2,
      y: 0.7,
      w: 5.4,
      h: 0.3,
      text: "OVERVIEW",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    // Headline
    {
      kind: "text",
      x: 4.2,
      y: 1.0,
      w: 5.4,
      h: 0.7,
      text: "A concise overview slide",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    // Lead paragraph
    {
      kind: "text",
      x: 4.2,
      y: 1.85,
      w: 5.4,
      h: 1.3,
      text:
        "A flexible profile layout for a company, product, person, or project. " +
        "Use the left panel for identity details, then reserve the wider right " +
        "side for positioning, context, and high-level proof points.",
      fontSize: 13,
      color: INK,
      lineHeight: 1.45,
      fontFace: SANS,
    },
    // Highlights header
    {
      kind: "text",
      x: 4.2,
      y: 3.35,
      w: 5.4,
      h: 0.3,
      text: "KEY HIGHLIGHTS",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    { kind: "rect", x: 4.2, y: 3.7, w: 5.4, h: 0.02, fill: BLUE },
    {
      kind: "bullets",
      x: 4.2,
      y: 3.85,
      w: 5.4,
      h: 1.4,
      fontSize: 12,
      color: INK,
      bulletColor: GOLD,
      lineSpacingMultiple: 1.4,
      fontFace: SANS,
      items: [
        "Reusable side-panel profile structure",
        "Large narrative area for overview copy",
        "Editable bullets with accent color",
        "Balanced text density for executive scans",
      ],
    },
    ...footer(2, TOTAL, false),
  ],
};

// ── Slide 3: Project timeline ───────────────────────────────────────────
function timelineStop(
  cx: number,
  year: string,
  letter: string,
  label: string,
  period: string,
): SlideElement[] {
  return [
    // Year above
    {
      kind: "text",
      x: cx - 1.0,
      y: 2.0,
      w: 2.0,
      h: 0.35,
      text: year,
      fontSize: 12,
      bold: true,
      color: GOLD,
      charSpacing: 200,
      align: "center",
      fontFace: SANS,
    },
    // Circle
    { kind: "ellipse", x: cx - 0.45, y: 2.55, w: 0.9, h: 0.9, fill: BLUE_DK },
    {
      kind: "text",
      x: cx - 0.45,
      y: 2.55,
      w: 0.9,
      h: 0.9,
      text: letter,
      fontSize: 28,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
      fontFace: SANS,
    },
    // Label
    {
      kind: "text",
      x: cx - 1.4,
      y: 3.65,
      w: 2.8,
      h: 0.4,
      text: label,
      fontSize: 16,
      bold: true,
      color: "FFFFFF",
      align: "center",
      fontFace: SANS,
    },
    // Period
    {
      kind: "text",
      x: cx - 1.4,
      y: 4.05,
      w: 2.8,
      h: 0.3,
      text: period,
      fontSize: 11,
      color: MUTED_DK,
      align: "center",
      fontFace: SANS,
    },
  ];
}

const slide3Timeline: Slide = {
  title: "Timeline",
  background: DEEP,
  elements: [
    // Eyebrow
    {
      kind: "text",
      x: 0.6,
      y: 0.6,
      w: 6,
      h: 0.3,
      text: "PROJECT JOURNEY",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 300,
      fontFace: SANS,
    },
    // Title
    {
      kind: "text",
      x: 0.6,
      y: 0.95,
      w: 9,
      h: 0.7,
      text: "Three phases from idea to scale.",
      fontSize: 28,
      bold: true,
      color: "FFFFFF",
      fontFace: SANS,
    },

    // Connecting line
    { kind: "rect", x: 1.5, y: 2.99, w: 7.0, h: 0.025, fill: BLUE_DK },

    // Stops
    ...timelineStop(1.5, "2024", "D", "Discovery", "Research and framing"),
    ...timelineStop(5.0, "2025", "L", "Launch", "Build and release"),
    ...timelineStop(8.5, "2026", "S", "Scale", "Optimize and expand"),

    ...footer(3, TOTAL, true),
  ],
};

// ── Slide 4: Stats grid ─────────────────────────────────────────────────
function statCard(
  x: number,
  y: number,
  w: number,
  h: number,
  big: string,
  label: string,
): SlideElement[] {
  return [
    // Card
    { kind: "rect", x, y, w, h, fill: PAPER, rx: 0.08 },
    // Left accent stripe
    { kind: "rect", x, y, w: 0.06, h, fill: GOLD },
    // Big number — sized to its own line-box so the frame doesn't extend
    // into the label area below.
    {
      kind: "text",
      x: x + 0.35,
      y: y + 0.22,
      w: w - 0.5,
      h: 0.75,
      text: big,
      fontSize: 48,
      bold: true,
      color: NAVY,
      lineHeight: 1.0,
      fontFace: SANS,
    },
    // Label — anchored to the card bottom with a clear gap above.
    {
      kind: "text",
      x: x + 0.35,
      y: y + h - 0.32,
      w: w - 0.5,
      h: 0.22,
      text: label,
      fontSize: 11,
      bold: true,
      color: MUTED,
      charSpacing: 300,
      fontFace: SANS,
    },
  ];
}

const slide4Stats: Slide = {
  title: "Stats",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 6,
      h: 0.3,
      text: "BY THE NUMBERS",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 9,
      h: 0.7,
      text: "Performance at a glance.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 1.55,
      w: 9,
      h: 0.3,
      text: "Sample metrics for a product, campaign, or operating review.",
      fontSize: 12,
      color: MUTED,
      fontFace: SANS,
    },

    ...statCard(0.6, 2.0, 2.72, 1.32, "85%", "ADOPTION"),
    ...statCard(3.64, 2.0, 2.72, 1.32, "38%", "GROWTH"),
    ...statCard(6.68, 2.0, 2.72, 1.32, "$1.8M", "PIPELINE"),
    {
      kind: "chart",
      chartType: "line",
      x: 0.6,
      y: 3.45,
      w: 4.25,
      h: 1.45,
      title: "Quarterly trend",
      color: BLUE_DK,
      axisColor: MUTED_DK,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Q1", value: 18 },
        { label: "Q2", value: 38 },
        { label: "Q3", value: 58 },
        { label: "Q4", value: 51 },
        { label: "Q5", value: 62 },
      ],
    },
    {
      kind: "chart",
      chartType: "bar",
      x: 5.15,
      y: 3.45,
      w: 4.25,
      h: 1.45,
      title: "Channel mix",
      color: GOLD,
      axisColor: BLUE_DK,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Web", value: 850, color: GOLD },
        { label: "Sales", value: 380, color: BLUE_DK },
        { label: "Partner", value: 140, color: NAVY },
      ],
    },

    ...footer(4, TOTAL, false),
  ],
};

// ── Slide 5: Milestone highlight ────────────────────────────────────────
function milestoneStat(x: number, big: string, label: string): SlideElement[] {
  return [
    {
      kind: "text",
      x,
      y: 4.0,
      w: 2.6,
      h: 0.7,
      text: big,
      fontSize: 44,
      bold: true,
      color: GOLD,
      align: "center",
      lineHeight: 1,
      fontFace: SANS,
    },
    {
      kind: "text",
      x,
      y: 4.75,
      w: 2.6,
      h: 0.3,
      text: label,
      fontSize: 10,
      bold: true,
      color: BLUE,
      charSpacing: 300,
      align: "center",
      fontFace: SANS,
    },
  ];
}

const slide5Milestone: Slide = {
  title: "Milestone",
  background: NAVY,
  elements: [
    // Decorative big "26" watermark. Box is intentionally much wider/taller
    // than the text so engine-to-engine metric differences (Chrome vs Google
    // Slides) can't cause wrapping or clipping.
    {
      kind: "text",
      x: 3.5,
      y: 0.1,
      w: 6.5,
      h: 5.4,
      text: "26",
      fontSize: 240,
      bold: true,
      color: "FFFFFF",
      opacity: 0.05,
      fontFace: SANS,
      align: "center",
      valign: "middle",
    },

    { kind: "rect", x: 0.6, y: 0.55, w: 0.6, h: 0.06, fill: GOLD },
    {
      kind: "text",
      x: 0.6,
      y: 0.7,
      w: 6,
      h: 0.3,
      text: "MILESTONE 2026",
      fontSize: 11,
      bold: true,
      color: GOLD,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 1.25,
      w: 9,
      h: 1.6,
      text: "“A turning point for the team.”",
      fontSize: 44,
      bold: true,
      italic: true,
      color: "FFFFFF",
      lineHeight: 1.1,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 3.1,
      w: 6.5,
      h: 0.8,
      text: "Use this layout for a launch, funding moment, award, major customer win, or any story that deserves a dramatic single-slide treatment.",
      fontSize: 13,
      color: "D5DCE8",
      lineHeight: 1.5,
      fontFace: SANS,
    },

    // Divider above stats
    { kind: "rect", x: 0.6, y: 3.9, w: 8.8, h: 0.01, fill: BLUE_DK, opacity: 0.5 },

    ...milestoneStat(0.6, "7", "MARKETS"),
    ...milestoneStat(3.7, "3", "TEAMS"),
    ...milestoneStat(6.8, "2", "REGIONS"),

    ...footer(5, TOTAL, true),
  ],
};

const slide6Table: Slide = {
  title: "Data Table",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 6,
      h: 0.3,
      text: "DATA TABLE",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 8.8,
      h: 0.7,
      text: "Performance across segments.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 1.55,
      w: 8.6,
      h: 0.3,
      text: "A compact native table assembled from editable text and shape elements.",
      fontSize: 12,
      color: MUTED,
      fontFace: SANS,
    },
    {
      kind: "table",
      x: 0.8,
      y: 2.05,
      w: 7.65,
      h: 2.6,
      rows: [
        ["Segment", "Users", "Revenue", "Growth"],
        ["Enterprise", "520", "$4.7M", "21%"],
        ["Mid-market", "163", "$1.3M", "40%"],
        ["Self-serve", "190+", "$1.1M", "60%"],
        ["Partners", "26", "$0.8M", "18%"],
      ],
      fontFace: SANS,
      fontSize: 11,
      textColor: INK,
      headerFill: NAVY,
      headerTextColor: "FFFFFF",
      borderColor: "DDE5F0",
      fill: PAPER,
      opacity: 1,
    },
    {
      kind: "text",
      x: 8.65,
      y: 2.05,
      w: 0.55,
      h: 2.55,
      text: "04",
      fontSize: 76,
      bold: true,
      color: GOLD,
      opacity: 0.26,
      align: "center",
      valign: "middle",
      fontFace: SANS,
    },
    ...footer(6, TOTAL, false),
  ],
};

const slide7Grid: Slide = {
  title: "3x3 Grid",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 6,
      h: 0.3,
      text: "CONTENT GRID",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 8.8,
      h: 0.7,
      text: "Nine editable placeholders.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 1.5,
      w: 8.6,
      h: 0.3,
      text: "A 3x3 layout for numbered ideas, features, or milestones.",
      fontSize: 12,
      color: MUTED,
      fontFace: SANS,
    },
    ...[
      "Opening idea",
      "Metric placeholder",
      "Visual placeholder",
      "Key point",
      "Trend slot",
      "Photo slot",
      "Proof point",
      "Comparison",
      "Final visual",
    ].flatMap((label, index): SlideElement[] => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 1.25 + col * 2.59;
      const y = 1.85 + row * 1.06;
      return [
        {
          kind: "rect",
          x,
          y,
          w: 2.41,
          h: 0.88,
          fill: PAPER,
          line: { color: "DDE5F0", width: 0.75 },
          rx: 0.08,
        },
        {
          kind: "text",
          x,
          y: y + 0.16,
          w: 2.41,
          h: 0.3,
          text: String(index + 1).padStart(2, "0"),
          fontFace: SANS,
          fontSize: 24,
          bold: true,
          color: BLUE_DK,
          align: "center",
        },
        {
          kind: "text",
          x: x + 0.18,
          y: y + 0.58,
          w: 2.05,
          h: 0.15,
          text: label.toUpperCase(),
          fontFace: SANS,
          fontSize: 7,
          bold: true,
          color: MUTED,
          align: "center",
          charSpacing: 170,
        },
      ];
    }),
    ...footer(7, TOTAL, false),
  ],
};

// ── Slide 8: Section divider ────────────────────────────────────────────
const slide8SectionDivider: Slide = {
  title: "Section Divider",
  background: NAVY,
  elements: [
    { kind: "rect", x: 0, y: 0, w: 3.0, h: SLIDE_H, fill: DEEP },
    { kind: "rect", x: 3.0, y: 0, w: 0.08, h: SLIDE_H, fill: GOLD },
    {
      kind: "text",
      x: 0.55,
      y: 0.72,
      w: 1.7,
      h: 0.35,
      text: "02",
      fontSize: 14,
      bold: true,
      color: GOLD,
      charSpacing: 260,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.55,
      y: 2.05,
      w: 2.0,
      h: 1.45,
      text: "THE\nGAME",
      fontSize: 36,
      bold: true,
      color: "FFFFFF",
      lineHeight: 1.0,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 3.65,
      y: 1.25,
      w: 5.8,
      h: 1.4,
      text: "Common deck layouts, rendered as fully editable slide elements.",
      fontSize: 30,
      bold: true,
      color: "FFFFFF",
      lineHeight: 1.18,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 3.65,
      y: 3.05,
      w: 5.2,
      h: 0.85,
      text: "Use this as a richer fixture for previews, export checks, and editor interactions.",
      fontSize: 13,
      color: "D5DCE8",
      lineHeight: 1.45,
      fontFace: SANS,
    },
    ...footer(8, TOTAL, true),
  ],
};

// ── Slide 9: Two-column content ─────────────────────────────────────────
const slide9TwoColumn: Slide = {
  title: "Two Column",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 6,
      h: 0.3,
      text: "TWO-COLUMN LAYOUT",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 8.8,
      h: 0.7,
      text: "Vision on the left, evidence on the right.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    { kind: "rect", x: 0.75, y: 1.85, w: 4.0, h: 2.85, fill: PAPER, rx: 0.08 },
    { kind: "rect", x: 5.25, y: 1.85, w: 4.0, h: 2.85, fill: PAPER, rx: 0.08 },
    {
      kind: "text",
      x: 1.1,
      y: 2.2,
      w: 3.25,
      h: 0.35,
      text: "STRATEGY",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 260,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 1.1,
      y: 2.62,
      w: 3.25,
      h: 1.35,
      text: "A clear frame for priorities, tradeoffs, and action.",
      fontSize: 21,
      bold: true,
      color: INK,
      lineHeight: 1.2,
      fontFace: SANS,
    },
    {
      kind: "bullets",
      x: 5.62,
      y: 2.22,
      w: 3.25,
      h: 1.85,
      fontSize: 12,
      color: INK,
      bulletColor: GOLD,
      lineSpacingMultiple: 1.35,
      fontFace: SANS,
      items: [
        "Use the left column for the core message",
        "Use the right column for evidence or detail",
        "Keep both sides balanced and scannable",
      ],
    },
    ...footer(9, TOTAL, false),
  ],
};

// ── Slide 10: Image and caption ─────────────────────────────────────────
const slide10ImageCaption: Slide = {
  title: "Image Caption",
  background: PAPER,
  elements: [
    { kind: "image", x: 0, y: 0, w: 5.55, h: SLIDE_H, fit: "cover", name: "Full-height image placeholder" },
    { kind: "rect", x: 5.55, y: 0, w: 4.45, h: SLIDE_H, fill: NAVY },
    {
      kind: "text",
      x: 6.05,
      y: 0.72,
      w: 3.4,
      h: 0.3,
      text: "IMAGE + CAPTION",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 260,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 6.05,
      y: 1.35,
      w: 3.35,
      h: 1.65,
      text: "A visual lead with a strong editorial caption.",
      fontSize: 30,
      bold: true,
      color: "FFFFFF",
      lineHeight: 1.15,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 6.05,
      y: 3.35,
      w: 3.25,
      h: 0.9,
      text: "Drop in a product screenshot, customer image, venue photo, or campaign visual. The caption block stays editable.",
      fontSize: 13,
      color: "D5DCE8",
      lineHeight: 1.45,
      fontFace: SANS,
    },
    { kind: "rect", x: 6.05, y: 4.55, w: 0.46, h: 0.04, fill: GOLD },
    ...footer(10, TOTAL, true),
  ],
};

// ── Slide 11: Process steps ─────────────────────────────────────────────
function processStep(x: number, n: string, title: string, body: string): SlideElement[] {
  return [
    { kind: "ellipse", x, y: 2.05, w: 0.72, h: 0.72, fill: BLUE_DK },
    {
      kind: "text",
      x,
      y: 2.05,
      w: 0.72,
      h: 0.72,
      text: n,
      fontSize: 18,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
      fontFace: SANS,
    },
    {
      kind: "text",
      x: x - 0.42,
      y: 3.0,
      w: 1.55,
      h: 0.35,
      text: title,
      fontSize: 14,
      bold: true,
      color: INK,
      align: "center",
      fontFace: SANS,
    },
    {
      kind: "text",
      x: x - 0.5,
      y: 3.42,
      w: 1.72,
      h: 0.7,
      text: body,
      fontSize: 10,
      color: MUTED,
      align: "center",
      lineHeight: 1.25,
      fontFace: SANS,
    },
  ];
}

const slide11Process: Slide = {
  title: "Process",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 6,
      h: 0.3,
      text: "PROCESS LAYOUT",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 8.8,
      h: 0.7,
      text: "Four steps from insight to action.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    { kind: "rect", x: 1.25, y: 2.4, w: 7.1, h: 0.03, fill: BLUE, opacity: 0.55 },
    ...processStep(1.25, "1", "Discover", "Collect context, constraints, and user needs."),
    ...processStep(3.55, "2", "Define", "Align on scope, priorities, and success criteria."),
    ...processStep(5.85, "3", "Build", "Create the solution and validate the details."),
    ...processStep(8.15, "4", "Launch", "Release, measure, and improve the experience."),
    ...footer(11, TOTAL, false),
  ],
};

// ── Slide 12: Comparison ────────────────────────────────────────────────
const slide12Comparison: Slide = {
  title: "Comparison",
  background: PAPER,
  elements: [
    { kind: "rect", x: 0, y: 0, w: 5, h: SLIDE_H, fill: OFF_WHITE },
    { kind: "rect", x: 5, y: 0, w: 5, h: SLIDE_H, fill: NAVY },
    {
      kind: "text",
      x: 0.65,
      y: 0.65,
      w: 3.6,
      h: 0.3,
      text: "BEFORE",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 5.65,
      y: 0.65,
      w: 3.6,
      h: 0.3,
      text: "AFTER",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.65,
      y: 1.2,
      w: 3.65,
      h: 1.15,
      text: "A manual workflow with limited visibility.",
      fontSize: 28,
      bold: true,
      color: INK,
      lineHeight: 1.12,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 5.65,
      y: 1.2,
      w: 3.65,
      h: 1.15,
      text: "A scalable system with shared visibility.",
      fontSize: 28,
      bold: true,
      color: "FFFFFF",
      lineHeight: 1.12,
      fontFace: SANS,
    },
    {
      kind: "bullets",
      x: 0.85,
      y: 2.8,
      w: 3.55,
      h: 1.3,
      fontSize: 12,
      color: INK,
      bulletColor: BLUE_DK,
      lineSpacingMultiple: 1.35,
      fontFace: SANS,
      items: ["Fragmented tools", "Slow handoffs", "Limited reporting"],
    },
    {
      kind: "bullets",
      x: 5.85,
      y: 2.8,
      w: 3.55,
      h: 1.3,
      fontSize: 12,
      color: "E8EEF7",
      bulletColor: GOLD,
      lineSpacingMultiple: 1.35,
      fontFace: SANS,
      items: ["Central workspace", "Clear ownership", "Reliable dashboards"],
    },
    ...footer(12, TOTAL, false),
  ],
};

// ── Slide 13: Agenda / tabs ─────────────────────────────────────────────
const slide13Agenda: Slide = {
  title: "Agenda",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 6,
      h: 0.3,
      text: "AGENDA LAYOUT",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 8.8,
      h: 0.7,
      text: "A clean structure for meetings and reports.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    ...["Context", "Analysis", "Decision", "Next steps"].flatMap((label, index): SlideElement[] => {
      const y = 1.85 + index * 0.78;
      return [
        { kind: "rect", x: 0.85, y, w: 8.3, h: 0.58, fill: index === 1 ? NAVY : PAPER, rx: 0.08 },
        {
          kind: "text",
          x: 1.15,
          y: y + 0.16,
          w: 0.55,
          h: 0.2,
          text: String(index + 1).padStart(2, "0"),
          fontSize: 10,
          bold: true,
          color: index === 1 ? GOLD : BLUE_DK,
          fontFace: SANS,
        },
        {
          kind: "text",
          x: 1.95,
          y: y + 0.13,
          w: 3.0,
          h: 0.28,
          text: label,
          fontSize: 14,
          bold: true,
          color: index === 1 ? "FFFFFF" : INK,
          fontFace: SANS,
        },
        {
          kind: "text",
          x: 5.15,
          y: y + 0.15,
          w: 3.45,
          h: 0.24,
          text: index === 1 ? "Current section highlighted" : "Editable agenda description",
          fontSize: 10,
          color: index === 1 ? "D5DCE8" : MUTED,
          align: "right",
          fontFace: SANS,
        },
      ];
    }),
    ...footer(13, TOTAL, false),
  ],
};

// ── Slide 14: Gallery cards ─────────────────────────────────────────────
const slide14Gallery: Slide = {
  title: "Gallery",
  background: PAPER,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 6,
      h: 0.3,
      text: "GALLERY LAYOUT",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 8.8,
      h: 0.7,
      text: "Four visual moments with short labels.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    ...["Kickoff", "Prototype", "Launch", "Scale"].flatMap((label, index): SlideElement[] => {
      const x = 0.75 + index * 2.28;
      return [
        { kind: "image", x, y: 1.9, w: 1.85, h: 2.25, fit: "cover", name: `${label} image placeholder` },
        {
          kind: "text",
          x,
          y: 4.28,
          w: 1.85,
          h: 0.3,
          text: label,
          fontSize: 13,
          bold: true,
          color: INK,
          align: "center",
          fontFace: SANS,
        },
        {
          kind: "text",
          x,
          y: 4.62,
          w: 1.85,
          h: 0.28,
          text: `Phase ${index + 1}`,
          fontSize: 10,
          color: MUTED,
          align: "center",
          fontFace: SANS,
        },
      ];
    }),
    ...footer(14, TOTAL, false),
  ],
};

// ── Slide 15: SVG constellation map ─────────────────────────────────────
const slide15Constellation: Slide = {
  title: "Constellation",
  background: DEEP,
  elements: [
    { kind: "svg", x: 0, y: 0, w: 10, h: SLIDE_H, svg: ORBIT_SVG, name: "Orbit network" },
    {
      kind: "text",
      x: 0.65,
      y: 0.58,
      w: 4,
      h: 0.3,
      text: "SYSTEM MAP",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.65,
      y: 1.0,
      w: 3.65,
      h: 1.35,
      text: "Turn scattered signals into a visible operating model.",
      fontSize: 29,
      bold: true,
      color: "FFFFFF",
      lineHeight: 1.12,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.65,
      y: 2.72,
      w: 3.2,
      h: 0.82,
      text: "A wild visual slide for architecture, ecosystems, stakeholder maps, or product platforms.",
      fontSize: 12,
      color: "D5DCE8",
      lineHeight: 1.4,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 6.45,
      y: 4.42,
      w: 2.8,
      h: 0.35,
      text: "CORE NODE",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 240,
      align: "right",
      fontFace: SANS,
    },
    ...footer(15, TOTAL, true),
  ],
};

// ── Slide 16: SVG kinetic flow ──────────────────────────────────────────
const slide16KineticFlow: Slide = {
  title: "Kinetic Flow",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 5,
      h: 0.3,
      text: "KINETIC ROADMAP",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 7.2,
      h: 0.72,
      text: "A roadmap that feels like motion.",
      fontSize: 27,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    { kind: "svg", x: 0, y: 1.65, w: 10, h: 2.25, svg: FLOW_SVG, name: "Flow ribbon" },
    ...["Discover", "Build", "Scale"].flatMap((label, index): SlideElement[] => {
      const x = 0.85 + index * 3.05;
      return [
        { kind: "rect", x, y: 3.8, w: 2.45, h: 0.85, fill: PAPER, rx: 0.08 },
        {
          kind: "text",
          x: x + 0.24,
          y: 4.03,
          w: 1.95,
          h: 0.25,
          text: label,
          fontSize: 14,
          bold: true,
          color: INK,
          align: "center",
          fontFace: SANS,
        },
        {
          kind: "text",
          x: x + 0.24,
          y: 4.36,
          w: 1.95,
          h: 0.18,
          text: `MOTION ${index + 1}`,
          fontSize: 7,
          bold: true,
          color: MUTED,
          charSpacing: 180,
          align: "center",
          fontFace: SANS,
        },
      ];
    }),
    ...footer(16, TOTAL, false),
  ],
};

// ── Slide 17: SVG command center ────────────────────────────────────────
const slide17CommandCenter: Slide = {
  title: "Command Center",
  background: NAVY,
  elements: [
    { kind: "svg", x: 0.62, y: 0.62, w: 4.35, h: 4.35, svg: RADAR_SVG, name: "Radar panel" },
    {
      kind: "text",
      x: 5.45,
      y: 0.72,
      w: 3.8,
      h: 0.3,
      text: "COMMAND CENTER",
      fontSize: 10,
      bold: true,
      color: GOLD,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 5.45,
      y: 1.14,
      w: 3.65,
      h: 1.28,
      text: "High-signal view for moments that need focus.",
      fontSize: 28,
      bold: true,
      color: "FFFFFF",
      lineHeight: 1.13,
      fontFace: SANS,
    },
    ...[
      ["ACTIVE", "24"],
      ["RISK", "03"],
      ["CLEAR", "91%"],
    ].flatMap(([label, value], index): SlideElement[] => {
      const y = 2.78 + index * 0.58;
      return [
        { kind: "rect", x: 5.45, y, w: 3.65, h: 0.42, fill: "102A4A", rx: 0.06 },
        {
          kind: "text",
          x: 5.68,
          y: y + 0.12,
          w: 1.2,
          h: 0.18,
          text: label,
          fontSize: 8,
          bold: true,
          color: MUTED_DK,
          charSpacing: 180,
          fontFace: SANS,
        },
        {
          kind: "text",
          x: 7.85,
          y: y + 0.07,
          w: 0.95,
          h: 0.28,
          text: value,
          fontSize: 14,
          bold: true,
          color: GOLD,
          align: "right",
          fontFace: SANS,
        },
      ];
    }),
    ...footer(17, TOTAL, true),
  ],
};

// ── Slide 18: SVG storyboard ────────────────────────────────────────────
const slide18Storyboard: Slide = {
  title: "Storyboard",
  background: PAPER,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.55,
      w: 5,
      h: 0.3,
      text: "STORYBOARD",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.9,
      w: 8.6,
      h: 0.65,
      text: "Three frames, one crisp narrative arc.",
      fontSize: 26,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    { kind: "rect", x: 0.6, y: 1.82, w: 2.55, h: 2.38, fill: OFF_WHITE, rx: 0.08 },
    { kind: "rect", x: 3.72, y: 1.82, w: 2.55, h: 2.38, fill: OFF_WHITE, rx: 0.08 },
    { kind: "rect", x: 6.84, y: 1.82, w: 2.55, h: 2.38, fill: OFF_WHITE, rx: 0.08 },
    { kind: "svg", x: 0.78, y: 2.2, w: 8.45, h: 1.55, svg: STORY_SVG, name: "Storyboard icons" },
    ...["Problem", "Shift", "Outcome"].flatMap((label, index): SlideElement[] => {
      const x = 0.92 + index * 3.12;
      return [
        {
          kind: "text",
          x,
          y: 3.78,
          w: 1.9,
          h: 0.28,
          text: label,
          fontSize: 14,
          bold: true,
          color: INK,
          align: "center",
          fontFace: SANS,
        },
        {
          kind: "text",
          x,
          y: 4.22,
          w: 1.9,
          h: 0.22,
          text: `FRAME ${index + 1}`,
          fontSize: 7,
          bold: true,
          color: MUTED,
          charSpacing: 160,
          align: "center",
          fontFace: SANS,
        },
      ];
    }),
    ...footer(18, TOTAL, false),
  ],
};

// ── Slide 19: Editor feature lab ────────────────────────────────────────
const slide19EditorFeatureLab: Slide = {
  title: "Editor Feature Lab",
  background: OFF_WHITE,
  elements: [
    {
      kind: "text",
      x: 0.6,
      y: 0.5,
      w: 5.2,
      h: 0.3,
      text: "EDITOR FEATURE LAB",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.6,
      y: 0.85,
      w: 6.2,
      h: 0.58,
      text: "One slide for testing new object workflows.",
      fontSize: 24,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    {
      kind: "bullets",
      x: 0.72,
      y: 1.62,
      w: 2.6,
      h: 1.18,
      items: ["Toolbar routing", "Inline editing", "Drawer inspection"],
      fontFace: SANS,
      fontSize: 15,
      color: INK,
      bulletColor: GOLD,
      lineSpacingMultiple: 1.18,
      itemGap: 0.05,
    },
    {
      kind: "image",
      x: 0.72,
      y: 3.05,
      w: 2.6,
      h: 1.38,
      fit: "cover",
      name: "Upload target",
    },
    {
      kind: "rect",
      x: 3.62,
      y: 1.56,
      w: 1.05,
      h: 0.64,
      fill: GOLD,
      rx: 0.08,
      line: { color: NAVY, width: 0.75 },
    },
    {
      kind: "ellipse",
      x: 4.88,
      y: 1.56,
      w: 0.86,
      h: 0.64,
      fill: BLUE,
      line: { color: BLUE_DK, width: 0.75 },
    },
    {
      kind: "text",
      x: 3.62,
      y: 2.38,
      w: 2.2,
      h: 0.8,
      text: "Shape toolbar\nand geometry",
      fontSize: 17,
      bold: true,
      color: INK,
      lineHeight: 1.15,
      fontFace: SANS,
    },
    {
      kind: "svg",
      x: 6.2,
      y: 0.9,
      w: 2.95,
      h: 1.88,
      svg: EDITOR_TOOLS_SVG,
      name: "SVG toolbar target",
    },
    {
      kind: "chart",
      chartType: "donut",
      x: 3.62,
      y: 3.1,
      w: 2.35,
      h: 1.38,
      title: "Chart target",
      color: BLUE_DK,
      axisColor: MUTED_DK,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Edit", value: 46, color: BLUE_DK },
        { label: "Inspect", value: 32, color: GOLD },
        { label: "Export", value: 22, color: NAVY },
      ],
    },
    {
      kind: "table",
      x: 6.2,
      y: 3.05,
      w: 3.0,
      h: 1.42,
      rows: [
        ["Feature", "Target"],
        ["Chart", "Toolbar"],
        ["SVG", "Toolbar"],
        ["Table", "Inline"],
      ],
      fontFace: SANS,
      fontSize: 9,
      textColor: INK,
      headerFill: NAVY,
      headerTextColor: "FFFFFF",
      borderColor: "DDE5F0",
      fill: PAPER,
    },
    ...footer(19, TOTAL, false),
  ],
};

// ── Slide 20: Closing quote ─────────────────────────────────────────────
const slide20Closing: Slide = {
  title: "Closing",
  background: OFF_WHITE,
  elements: [
    // Big decorative opening quote
    {
      kind: "text",
      x: 0.3,
      y: 0,
      w: 3.5,
      h: 4.2,
      text: "“",
      fontSize: 260,
      bold: true,
      color: GOLD,
      opacity: 0.18,
      lineHeight: 1,
      fontFace: SANS,
    },

    {
      kind: "text",
      x: 1.2,
      y: 0.7,
      w: 7,
      h: 0.3,
      text: "CLOSING THOUGHT",
      fontSize: 10,
      bold: true,
      color: BLUE_DK,
      charSpacing: 300,
      fontFace: SANS,
    },

    // Quote — no manual \n; let the engine wrap inside the box so wrapping
    // is identical between the CSS preview and the PPTX export.
    {
      kind: "text",
      x: 1.2,
      y: 1.3,
      w: 7.6,
      h: 2.8,
      text: "The best presentations make the important idea easy to understand, easy to remember, and easy to act on.",
      fontSize: 24,
      italic: true,
      color: INK,
      lineHeight: 1.35,
      fontFace: SANS,
    },

    { kind: "rect", x: 1.2, y: 4.2, w: 0.4, h: 0.04, fill: GOLD },
    {
      kind: "text",
      x: 1.2,
      y: 4.35,
      w: 7,
      h: 0.35,
      text: "Sample Attribution",
      fontSize: 14,
      bold: true,
      color: INK,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 1.2,
      y: 4.7,
      w: 7,
      h: 0.3,
      text: "Role, company, or source",
      fontSize: 11,
      color: MUTED,
      fontFace: SANS,
    },

    ...footer(20, TOTAL, false),
  ],
};

export const layoutKitDeck: Deck = {
  title: "Presentation Layout Kit",
  theme: {
    background: OFF_WHITE,
    primary: NAVY,
    secondary: BLUE_DK,
    accent: GOLD,
    text: INK,
  },
  slides: [
    slide1Title,
    slide2Profile,
    slide3Timeline,
    slide4Stats,
    slide5Milestone,
    slide6Table,
    slide7Grid,
    slide8SectionDivider,
    slide9TwoColumn,
    slide10ImageCaption,
    slide11Process,
    slide12Comparison,
    slide13Agenda,
    slide14Gallery,
    slide15Constellation,
    slide16KineticFlow,
    slide17CommandCenter,
    slide18Storyboard,
    slide19EditorFeatureLab,
    slide20Closing,
  ],
};
