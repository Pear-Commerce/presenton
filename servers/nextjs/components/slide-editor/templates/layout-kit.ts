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
      type: "text",
      position: { x: 0.5, y: 5.25 },
      size: { width: 4, height: 0.3 },
      runs: [{ text: "LAYOUT SAMPLE" }],
      font: { family: SANS, size: 9, color: c, letterSpacing: 200 }
    },
    {
      type: "text",
      position: { x: 8.5, y: 5.25 },
      size: { width: 1.0, height: 0.3 },
      runs: [{ text: `${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}` }],
      font: { family: SANS, size: 9, color: c },
      alignment: { horizontal: "right" }
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
      type: "text",
      position: { x: 3.8, y: 0.1 },
      size: { width: 6.2, height: 5.4 },
      runs: [{ text: "19" }],
      font: { family: SANS, size: 300, color: "FFFFFF", bold: true },
      alignment: { horizontal: "center", vertical: "middle" },
      opacity: 0.05
    },
    // Top kicker
    {
      type: "rectangle",
      position: { x: 0.6, y: 0.55 },
      size: { width: 0.6, height: 0.06 },
      fill: { color: GOLD }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.7 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "LAYOUT KIT · 2026" }],
      font: { family: SANS, size: 11, color: BLUE, bold: true, letterSpacing: 300 }
    },
    // Big title
    {
      type: "text",
      position: { x: 0.6, y: 1.5 },
      size: { width: 8.5, height: 2.55 },
      runs: [{ text: "PRESENTATION\nLAYOUTS" }],
      font: { family: SANS, size: 78, color: "FFFFFF", bold: true, lineHeight: 1.05, letterSpacing: 50 }
    },
    // Divider + tagline
    {
      type: "rectangle",
      position: { x: 0.6, y: 4.15 },
      size: { width: 0.5, height: 0.04 },
      fill: { color: GOLD }
    },
    {
      type: "text",
      position: { x: 0.6, y: 4.3 },
      size: { width: 8, height: 0.45 },
      runs: [{ text: "Nineteen common slide patterns built from editable elements." }],
      font: { family: SANS, size: 18, color: BLUE }
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
    {
      type: "rectangle",
      position: { x: 0, y: 0 },
      size: { width: 3.7, height: SLIDE_H },
      fill: { color: NAVY }
    },
    // Accent bar across panel
    {
      type: "rectangle",
      position: { x: 0, y: 4.55 },
      size: { width: 3.7, height: 0.06 },
      fill: { color: GOLD }
    },
    // Eyebrow
    {
      type: "text",
      position: { x: 0.5, y: 0.6 },
      size: { width: 3.0, height: 0.3 },
      runs: [{ text: "COMPANY PROFILE" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 300 }
    },
    // Name on panel
    {
      type: "text",
      position: { x: 0.5, y: 1.0 },
      size: { width: 3.0, height: 1.6 },
      runs: [{ text: "Acme\nStudio" }],
      font: { family: SANS, size: 40, color: "FFFFFF", bold: true, lineHeight: 1 }
    },
    {
      type: "text",
      position: { x: 0.5, y: 2.65 },
      size: { width: 3.0, height: 0.3 },
      runs: [{ text: "Product strategy team" }],
      font: { family: SANS, size: 12, color: BLUE }
    },
    // Meta block
    {
      type: "text",
      position: { x: 0.5, y: 3.15 },
      size: { width: 3.0, height: 1.3 },
      runs: [{ text: "Founded   2018\n" +
        "HQ        Remote-first\n" +
        "Focus     Product design\n" +
        "Team      42 people" }],
      font: { family: SANS, size: 11, color: "D5DCE8", lineHeight: 1.6 }
    },

    // Right side — eyebrow
    {
      type: "text",
      position: { x: 4.2, y: 0.7 },
      size: { width: 5.4, height: 0.3 },
      runs: [{ text: "OVERVIEW" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    // Headline
    {
      type: "text",
      position: { x: 4.2, y: 1.0 },
      size: { width: 5.4, height: 0.7 },
      runs: [{ text: "A concise overview slide" }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    // Lead paragraph
    {
      type: "text",
      position: { x: 4.2, y: 1.85 },
      size: { width: 5.4, height: 1.3 },
      runs: [{ text: "A flexible profile layout for a company, product, person, or project. " +
        "Use the left panel for identity details, then reserve the wider right " +
        "side for positioning, context, and high-level proof points." }],
      font: { family: SANS, size: 13, color: INK, lineHeight: 1.45 }
    },
    // Highlights header
    {
      type: "text",
      position: { x: 4.2, y: 3.35 },
      size: { width: 5.4, height: 0.3 },
      runs: [{ text: "KEY HIGHLIGHTS" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "rectangle",
      position: { x: 4.2, y: 3.7 },
      size: { width: 5.4, height: 0.02 },
      fill: { color: BLUE }
    },
    {
      type: "text-list",
      position: { x: 4.2, y: 3.85 },
      size: { width: 5.4, height: 1.4 },
      marker: "bullet",
      items: [{ type: "text", text: "Reusable side-panel profile structure" }, { type: "text", text: "Large narrative area for overview copy" }, { type: "text", text: "Editable bullets with accent color" }, { type: "text", text: "Balanced text density for executive scans" }],
      font: { family: SANS, size: 12, color: INK, lineHeight: 1.4 }
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
      type: "text",
      position: { x: cx - 1.0, y: 2.0 },
      size: { width: 2.0, height: 0.35 },
      runs: [{ text: year }],
      font: { family: SANS, size: 12, color: GOLD, bold: true, letterSpacing: 200 },
      alignment: { horizontal: "center" }
    },
    // Circle
    {
      type: "ellipse",
      position: { x: cx - 0.45, y: 2.55 },
      size: { width: 0.9, height: 0.9 },
      fill: { color: BLUE_DK }
    },
    {
      type: "text",
      position: { x: cx - 0.45, y: 2.55 },
      size: { width: 0.9, height: 0.9 },
      runs: [{ text: letter }],
      font: { family: SANS, size: 28, color: "FFFFFF", bold: true },
      alignment: { horizontal: "center", vertical: "middle" }
    },
    // Label
    {
      type: "text",
      position: { x: cx - 1.4, y: 3.65 },
      size: { width: 2.8, height: 0.4 },
      runs: [{ text: label }],
      font: { family: SANS, size: 16, color: "FFFFFF", bold: true },
      alignment: { horizontal: "center" }
    },
    // Period
    {
      type: "text",
      position: { x: cx - 1.4, y: 4.05 },
      size: { width: 2.8, height: 0.3 },
      runs: [{ text: period }],
      font: { family: SANS, size: 11, color: MUTED_DK },
      alignment: { horizontal: "center" }
    },
  ];
}

const slide3Timeline: Slide = {
  title: "Timeline",
  background: DEEP,
  elements: [
    // Eyebrow
    {
      type: "text",
      position: { x: 0.6, y: 0.6 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "PROJECT JOURNEY" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 300 }
    },
    // Title
    {
      type: "text",
      position: { x: 0.6, y: 0.95 },
      size: { width: 9, height: 0.7 },
      runs: [{ text: "Three phases from idea to scale." }],
      font: { family: SANS, size: 28, color: "FFFFFF", bold: true }
    },

    // Connecting line
    {
      type: "rectangle",
      position: { x: 1.5, y: 2.99 },
      size: { width: 7.0, height: 0.025 },
      fill: { color: BLUE_DK }
    },

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
    {
      type: "rectangle",
      position: { x: x, y: y },
      size: { width: w, height: h },
      fill: { color: PAPER },
      borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
    },
    // Left accent stripe
    {
      type: "rectangle",
      position: { x: x, y: y },
      size: { width: 0.06, height: h },
      fill: { color: GOLD }
    },
    // Big number — sized to its own line-box so the frame doesn't extend
    // into the label area below.
    {
      type: "text",
      position: { x: x + 0.35, y: y + 0.22 },
      size: { width: w - 0.5, height: 0.75 },
      runs: [{ text: big }],
      font: { family: SANS, size: 48, color: NAVY, bold: true, lineHeight: 1.0 }
    },
    // Label — anchored to the card bottom with a clear gap above.
    {
      type: "text",
      position: { x: x + 0.35, y: y + h - 0.32 },
      size: { width: w - 0.5, height: 0.22 },
      runs: [{ text: label }],
      font: { family: SANS, size: 11, color: MUTED, bold: true, letterSpacing: 300 }
    },
  ];
}

const slide4Stats: Slide = {
  title: "Stats",
  background: OFF_WHITE,
  elements: [
    {
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "BY THE NUMBERS" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 9, height: 0.7 },
      runs: [{ text: "Performance at a glance." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    {
      type: "text",
      position: { x: 0.6, y: 1.55 },
      size: { width: 9, height: 0.3 },
      runs: [{ text: "Sample metrics for a product, campaign, or operating review." }],
      font: { family: SANS, size: 12, color: MUTED }
    },

    ...statCard(0.6, 2.0, 2.72, 1.32, "85%", "ADOPTION"),
    ...statCard(3.64, 2.0, 2.72, 1.32, "38%", "GROWTH"),
    ...statCard(6.68, 2.0, 2.72, 1.32, "$1.8M", "PIPELINE"),
    {
      type: "chart",
      position: { x: 0.6, y: 3.45 },
      size: { width: 4.25, height: 1.45 },
      chartType: "line",
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
      ]
    },
    {
      type: "chart",
      position: { x: 5.15, y: 3.45 },
      size: { width: 4.25, height: 1.45 },
      chartType: "bar",
      title: "Channel mix",
      color: GOLD,
      axisColor: BLUE_DK,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Web", value: 850, color: GOLD },
        { label: "Sales", value: 380, color: BLUE_DK },
        { label: "Partner", value: 140, color: NAVY },
      ]
    },

    ...footer(4, TOTAL, false),
  ],
};

// ── Slide 5: Milestone highlight ────────────────────────────────────────
function milestoneStat(x: number, big: string, label: string): SlideElement[] {
  return [
    {
      type: "text",
      position: { x: x, y: 4.0 },
      size: { width: 2.6, height: 0.7 },
      runs: [{ text: big }],
      font: { family: SANS, size: 44, color: GOLD, bold: true, lineHeight: 1 },
      alignment: { horizontal: "center" }
    },
    {
      type: "text",
      position: { x: x, y: 4.75 },
      size: { width: 2.6, height: 0.3 },
      runs: [{ text: label }],
      font: { family: SANS, size: 10, color: BLUE, bold: true, letterSpacing: 300 },
      alignment: { horizontal: "center" }
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
      type: "text",
      position: { x: 3.5, y: 0.1 },
      size: { width: 6.5, height: 5.4 },
      runs: [{ text: "26" }],
      font: { family: SANS, size: 240, color: "FFFFFF", bold: true },
      alignment: { horizontal: "center", vertical: "middle" },
      opacity: 0.05
    },

    {
      type: "rectangle",
      position: { x: 0.6, y: 0.55 },
      size: { width: 0.6, height: 0.06 },
      fill: { color: GOLD }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.7 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "MILESTONE 2026" }],
      font: { family: SANS, size: 11, color: GOLD, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 1.25 },
      size: { width: 9, height: 1.6 },
      runs: [{ text: "“A turning point for the team.”" }],
      font: { family: SANS, size: 44, color: "FFFFFF", bold: true, italic: true, lineHeight: 1.1 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 3.1 },
      size: { width: 6.5, height: 0.8 },
      runs: [{ text: "Use this layout for a launch, funding moment, award, major customer win, or any story that deserves a dramatic single-slide treatment." }],
      font: { family: SANS, size: 13, color: "D5DCE8", lineHeight: 1.5 }
    },

    // Divider above stats
    {
      type: "rectangle",
      position: { x: 0.6, y: 3.9 },
      size: { width: 8.8, height: 0.01 },
      fill: { color: BLUE_DK },
      opacity: 0.5
    },

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
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "DATA TABLE" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 8.8, height: 0.7 },
      runs: [{ text: "Performance across segments." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    {
      type: "text",
      position: { x: 0.6, y: 1.55 },
      size: { width: 8.6, height: 0.3 },
      runs: [{ text: "A compact native table assembled from editable text and shape elements." }],
      font: { family: SANS, size: 12, color: MUTED }
    },
    {
      type: "table",
      position: { x: 0.8, y: 2.05 },
      size: { width: 7.65, height: 2.6 },
      font: { family: SANS, size: 11, color: INK },
      columns: [{ text: "Segment", fill: { color: NAVY }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: "FFFFFF", bold: true } }, { text: "Users", fill: { color: NAVY }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: "FFFFFF", bold: true } }, { text: "Revenue", fill: { color: NAVY }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: "FFFFFF", bold: true } }, { text: "Growth", fill: { color: NAVY }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: "FFFFFF", bold: true } }],
      rows: [[{ text: "Enterprise", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "520", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "$4.7M", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "21%", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }], [{ text: "Mid-market", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "163", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "$1.3M", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "40%", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }], [{ text: "Self-serve", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "190+", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "$1.1M", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "60%", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }], [{ text: "Partners", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "26", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "$0.8M", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "18%", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }]],
      opacity: 1
    },
    {
      type: "text",
      position: { x: 8.65, y: 2.05 },
      size: { width: 0.55, height: 2.55 },
      runs: [{ text: "04" }],
      font: { family: SANS, size: 76, color: GOLD, bold: true },
      alignment: { horizontal: "center", vertical: "middle" },
      opacity: 0.26
    },
    ...footer(6, TOTAL, false),
  ],
};

const slide7Grid: Slide = {
  title: "3x3 Grid",
  background: OFF_WHITE,
  elements: [
    {
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "CONTENT GRID" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 8.8, height: 0.7 },
      runs: [{ text: "Nine editable placeholders." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    {
      type: "text",
      position: { x: 0.6, y: 1.5 },
      size: { width: 8.6, height: 0.3 },
      runs: [{ text: "A 3x3 layout for numbered ideas, features, or milestones." }],
      font: { family: SANS, size: 12, color: MUTED }
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
          type: "rectangle",
          position: { x: x, y: y },
          size: { width: 2.41, height: 0.88 },
          fill: { color: PAPER },
          stroke: { color: "DDE5F0", width: 0.75 },
          borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
        },
        {
          type: "text",
          position: { x: x, y: y + 0.16 },
          size: { width: 2.41, height: 0.3 },
          runs: [{ text: String(index + 1).padStart(2, "0") }],
          font: { family: SANS, size: 24, color: BLUE_DK, bold: true },
          alignment: { horizontal: "center" }
        },
        {
          type: "text",
          position: { x: x + 0.18, y: y + 0.58 },
          size: { width: 2.05, height: 0.15 },
          runs: [{ text: label.toUpperCase() }],
          font: { family: SANS, size: 7, color: MUTED, bold: true, letterSpacing: 170 },
          alignment: { horizontal: "center" }
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
    {
      type: "rectangle",
      position: { x: 0, y: 0 },
      size: { width: 3.0, height: SLIDE_H },
      fill: { color: DEEP }
    },
    {
      type: "rectangle",
      position: { x: 3.0, y: 0 },
      size: { width: 0.08, height: SLIDE_H },
      fill: { color: GOLD }
    },
    {
      type: "text",
      position: { x: 0.55, y: 0.72 },
      size: { width: 1.7, height: 0.35 },
      runs: [{ text: "02" }],
      font: { family: SANS, size: 14, color: GOLD, bold: true, letterSpacing: 260 }
    },
    {
      type: "text",
      position: { x: 0.55, y: 2.05 },
      size: { width: 2.0, height: 1.45 },
      runs: [{ text: "THE\nGAME" }],
      font: { family: SANS, size: 36, color: "FFFFFF", bold: true, lineHeight: 1.0 }
    },
    {
      type: "text",
      position: { x: 3.65, y: 1.25 },
      size: { width: 5.8, height: 1.4 },
      runs: [{ text: "Common deck layouts, rendered as fully editable slide elements." }],
      font: { family: SANS, size: 30, color: "FFFFFF", bold: true, lineHeight: 1.18 }
    },
    {
      type: "text",
      position: { x: 3.65, y: 3.05 },
      size: { width: 5.2, height: 0.85 },
      runs: [{ text: "Use this as a richer fixture for previews, export checks, and editor interactions." }],
      font: { family: SANS, size: 13, color: "D5DCE8", lineHeight: 1.45 }
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
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "TWO-COLUMN LAYOUT" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 8.8, height: 0.7 },
      runs: [{ text: "Vision on the left, evidence on the right." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    {
      type: "rectangle",
      position: { x: 0.75, y: 1.85 },
      size: { width: 4.0, height: 2.85 },
      fill: { color: PAPER },
      borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
    },
    {
      type: "rectangle",
      position: { x: 5.25, y: 1.85 },
      size: { width: 4.0, height: 2.85 },
      fill: { color: PAPER },
      borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
    },
    {
      type: "text",
      position: { x: 1.1, y: 2.2 },
      size: { width: 3.25, height: 0.35 },
      runs: [{ text: "STRATEGY" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 260 }
    },
    {
      type: "text",
      position: { x: 1.1, y: 2.62 },
      size: { width: 3.25, height: 1.35 },
      runs: [{ text: "A clear frame for priorities, tradeoffs, and action." }],
      font: { family: SANS, size: 21, color: INK, bold: true, lineHeight: 1.2 }
    },
    {
      type: "text-list",
      position: { x: 5.62, y: 2.22 },
      size: { width: 3.25, height: 1.85 },
      marker: "bullet",
      items: [{ type: "text", text: "Use the left column for the core message" }, { type: "text", text: "Use the right column for evidence or detail" }, { type: "text", text: "Keep both sides balanced and scannable" }],
      font: { family: SANS, size: 12, color: INK, lineHeight: 1.35 }
    },
    ...footer(9, TOTAL, false),
  ],
};

// ── Slide 10: Image and caption ─────────────────────────────────────────
const slide10ImageCaption: Slide = {
  title: "Image Caption",
  background: PAPER,
  elements: [
    {
      type: "image",
      position: { x: 0, y: 0 },
      size: { width: 5.55, height: SLIDE_H },
      fit: "cover",
      name: "Full-height image placeholder"
    },
    {
      type: "rectangle",
      position: { x: 5.55, y: 0 },
      size: { width: 4.45, height: SLIDE_H },
      fill: { color: NAVY }
    },
    {
      type: "text",
      position: { x: 6.05, y: 0.72 },
      size: { width: 3.4, height: 0.3 },
      runs: [{ text: "IMAGE + CAPTION" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 260 }
    },
    {
      type: "text",
      position: { x: 6.05, y: 1.35 },
      size: { width: 3.35, height: 1.65 },
      runs: [{ text: "A visual lead with a strong editorial caption." }],
      font: { family: SANS, size: 30, color: "FFFFFF", bold: true, lineHeight: 1.15 }
    },
    {
      type: "text",
      position: { x: 6.05, y: 3.35 },
      size: { width: 3.25, height: 0.9 },
      runs: [{ text: "Drop in a product screenshot, customer image, venue photo, or campaign visual. The caption block stays editable." }],
      font: { family: SANS, size: 13, color: "D5DCE8", lineHeight: 1.45 }
    },
    {
      type: "rectangle",
      position: { x: 6.05, y: 4.55 },
      size: { width: 0.46, height: 0.04 },
      fill: { color: GOLD }
    },
    ...footer(10, TOTAL, true),
  ],
};

// ── Slide 11: Process steps ─────────────────────────────────────────────
function processStep(x: number, n: string, title: string, body: string): SlideElement[] {
  return [
    {
      type: "ellipse",
      position: { x: x, y: 2.05 },
      size: { width: 0.72, height: 0.72 },
      fill: { color: BLUE_DK }
    },
    {
      type: "text",
      position: { x: x, y: 2.05 },
      size: { width: 0.72, height: 0.72 },
      runs: [{ text: n }],
      font: { family: SANS, size: 18, color: "FFFFFF", bold: true },
      alignment: { horizontal: "center", vertical: "middle" }
    },
    {
      type: "text",
      position: { x: x - 0.42, y: 3.0 },
      size: { width: 1.55, height: 0.35 },
      runs: [{ text: title }],
      font: { family: SANS, size: 14, color: INK, bold: true },
      alignment: { horizontal: "center" }
    },
    {
      type: "text",
      position: { x: x - 0.5, y: 3.42 },
      size: { width: 1.72, height: 0.7 },
      runs: [{ text: body }],
      font: { family: SANS, size: 10, color: MUTED, lineHeight: 1.25 },
      alignment: { horizontal: "center" }
    },
  ];
}

const slide11Process: Slide = {
  title: "Process",
  background: OFF_WHITE,
  elements: [
    {
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "PROCESS LAYOUT" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 8.8, height: 0.7 },
      runs: [{ text: "Four steps from insight to action." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    {
      type: "rectangle",
      position: { x: 1.25, y: 2.4 },
      size: { width: 7.1, height: 0.03 },
      fill: { color: BLUE },
      opacity: 0.55
    },
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
    {
      type: "rectangle",
      position: { x: 0, y: 0 },
      size: { width: 5, height: SLIDE_H },
      fill: { color: OFF_WHITE }
    },
    {
      type: "rectangle",
      position: { x: 5, y: 0 },
      size: { width: 5, height: SLIDE_H },
      fill: { color: NAVY }
    },
    {
      type: "text",
      position: { x: 0.65, y: 0.65 },
      size: { width: 3.6, height: 0.3 },
      runs: [{ text: "BEFORE" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 5.65, y: 0.65 },
      size: { width: 3.6, height: 0.3 },
      runs: [{ text: "AFTER" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.65, y: 1.2 },
      size: { width: 3.65, height: 1.15 },
      runs: [{ text: "A manual workflow with limited visibility." }],
      font: { family: SANS, size: 28, color: INK, bold: true, lineHeight: 1.12 }
    },
    {
      type: "text",
      position: { x: 5.65, y: 1.2 },
      size: { width: 3.65, height: 1.15 },
      runs: [{ text: "A scalable system with shared visibility." }],
      font: { family: SANS, size: 28, color: "FFFFFF", bold: true, lineHeight: 1.12 }
    },
    {
      type: "text-list",
      position: { x: 0.85, y: 2.8 },
      size: { width: 3.55, height: 1.3 },
      marker: "bullet",
      items: [{ type: "text", text: "Fragmented tools" }, { type: "text", text: "Slow handoffs" }, { type: "text", text: "Limited reporting" }],
      font: { family: SANS, size: 12, color: INK, lineHeight: 1.35 }
    },
    {
      type: "text-list",
      position: { x: 5.85, y: 2.8 },
      size: { width: 3.55, height: 1.3 },
      marker: "bullet",
      items: [{ type: "text", text: "Central workspace" }, { type: "text", text: "Clear ownership" }, { type: "text", text: "Reliable dashboards" }],
      font: { family: SANS, size: 12, color: "E8EEF7", lineHeight: 1.35 }
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
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "AGENDA LAYOUT" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 8.8, height: 0.7 },
      runs: [{ text: "A clean structure for meetings and reports." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    ...["Context", "Analysis", "Decision", "Next steps"].flatMap((label, index): SlideElement[] => {
      const y = 1.85 + index * 0.78;
      return [
        {
          type: "rectangle",
          position: { x: 0.85, y: y },
          size: { width: 8.3, height: 0.58 },
          fill: { color: index === 1 ? NAVY : PAPER },
          borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
        },
        {
          type: "text",
          position: { x: 1.15, y: y + 0.16 },
          size: { width: 0.55, height: 0.2 },
          runs: [{ text: String(index + 1).padStart(2, "0") }],
          font: { family: SANS, size: 10, color: index === 1 ? GOLD : BLUE_DK, bold: true }
        },
        {
          type: "text",
          position: { x: 1.95, y: y + 0.13 },
          size: { width: 3.0, height: 0.28 },
          runs: [{ text: label }],
          font: { family: SANS, size: 14, color: index === 1 ? "FFFFFF" : INK, bold: true }
        },
        {
          type: "text",
          position: { x: 5.15, y: y + 0.15 },
          size: { width: 3.45, height: 0.24 },
          runs: [{ text: index === 1 ? "Current section highlighted" : "Editable agenda description" }],
          font: { family: SANS, size: 10, color: index === 1 ? "D5DCE8" : MUTED },
          alignment: { horizontal: "right" }
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
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 6, height: 0.3 },
      runs: [{ text: "GALLERY LAYOUT" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 8.8, height: 0.7 },
      runs: [{ text: "Four visual moments with short labels." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    ...["Kickoff", "Prototype", "Launch", "Scale"].flatMap((label, index): SlideElement[] => {
      const x = 0.75 + index * 2.28;
      return [
        {
          type: "image",
          position: { x: x, y: 1.9 },
          size: { width: 1.85, height: 2.25 },
          fit: "cover",
          name: `${label} image placeholder`
        },
        {
          type: "text",
          position: { x: x, y: 4.28 },
          size: { width: 1.85, height: 0.3 },
          runs: [{ text: label }],
          font: { family: SANS, size: 13, color: INK, bold: true },
          alignment: { horizontal: "center" }
        },
        {
          type: "text",
          position: { x: x, y: 4.62 },
          size: { width: 1.85, height: 0.28 },
          runs: [{ text: `Phase ${index + 1}` }],
          font: { family: SANS, size: 10, color: MUTED },
          alignment: { horizontal: "center" }
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
    {
      type: "svg",
      position: { x: 0, y: 0 },
      size: { width: 10, height: SLIDE_H },
      svg: ORBIT_SVG,
      name: "Orbit network"
    },
    {
      type: "text",
      position: { x: 0.65, y: 0.58 },
      size: { width: 4, height: 0.3 },
      runs: [{ text: "SYSTEM MAP" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.65, y: 1.0 },
      size: { width: 3.65, height: 1.35 },
      runs: [{ text: "Turn scattered signals into a visible operating model." }],
      font: { family: SANS, size: 29, color: "FFFFFF", bold: true, lineHeight: 1.12 }
    },
    {
      type: "text",
      position: { x: 0.65, y: 2.72 },
      size: { width: 3.2, height: 0.82 },
      runs: [{ text: "A wild visual slide for architecture, ecosystems, stakeholder maps, or product platforms." }],
      font: { family: SANS, size: 12, color: "D5DCE8", lineHeight: 1.4 }
    },
    {
      type: "text",
      position: { x: 6.45, y: 4.42 },
      size: { width: 2.8, height: 0.35 },
      runs: [{ text: "CORE NODE" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 240 },
      alignment: { horizontal: "right" }
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
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 5, height: 0.3 },
      runs: [{ text: "KINETIC ROADMAP" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 7.2, height: 0.72 },
      runs: [{ text: "A roadmap that feels like motion." }],
      font: { family: SANS, size: 27, color: INK, bold: true }
    },
    {
      type: "svg",
      position: { x: 0, y: 1.65 },
      size: { width: 10, height: 2.25 },
      svg: FLOW_SVG,
      name: "Flow ribbon"
    },
    ...["Discover", "Build", "Scale"].flatMap((label, index): SlideElement[] => {
      const x = 0.85 + index * 3.05;
      return [
        {
          type: "rectangle",
          position: { x: x, y: 3.8 },
          size: { width: 2.45, height: 0.85 },
          fill: { color: PAPER },
          borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
        },
        {
          type: "text",
          position: { x: x + 0.24, y: 4.03 },
          size: { width: 1.95, height: 0.25 },
          runs: [{ text: label }],
          font: { family: SANS, size: 14, color: INK, bold: true },
          alignment: { horizontal: "center" }
        },
        {
          type: "text",
          position: { x: x + 0.24, y: 4.36 },
          size: { width: 1.95, height: 0.18 },
          runs: [{ text: `MOTION ${index + 1}` }],
          font: { family: SANS, size: 7, color: MUTED, bold: true, letterSpacing: 180 },
          alignment: { horizontal: "center" }
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
    {
      type: "svg",
      position: { x: 0.62, y: 0.62 },
      size: { width: 4.35, height: 4.35 },
      svg: RADAR_SVG,
      name: "Radar panel"
    },
    {
      type: "text",
      position: { x: 5.45, y: 0.72 },
      size: { width: 3.8, height: 0.3 },
      runs: [{ text: "COMMAND CENTER" }],
      font: { family: SANS, size: 10, color: GOLD, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 5.45, y: 1.14 },
      size: { width: 3.65, height: 1.28 },
      runs: [{ text: "High-signal view for moments that need focus." }],
      font: { family: SANS, size: 28, color: "FFFFFF", bold: true, lineHeight: 1.13 }
    },
    ...[
      ["ACTIVE", "24"],
      ["RISK", "03"],
      ["CLEAR", "91%"],
    ].flatMap(([label, value], index): SlideElement[] => {
      const y = 2.78 + index * 0.58;
      return [
        {
          type: "rectangle",
          position: { x: 5.45, y: y },
          size: { width: 3.65, height: 0.42 },
          fill: { color: "102A4A" },
          borderRadius: { tl: 0.06, tr: 0.06, bl: 0.06, br: 0.06 }
        },
        {
          type: "text",
          position: { x: 5.68, y: y + 0.12 },
          size: { width: 1.2, height: 0.18 },
          runs: [{ text: label }],
          font: { family: SANS, size: 8, color: MUTED_DK, bold: true, letterSpacing: 180 }
        },
        {
          type: "text",
          position: { x: 7.85, y: y + 0.07 },
          size: { width: 0.95, height: 0.28 },
          runs: [{ text: value }],
          font: { family: SANS, size: 14, color: GOLD, bold: true },
          alignment: { horizontal: "right" }
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
      type: "text",
      position: { x: 0.6, y: 0.55 },
      size: { width: 5, height: 0.3 },
      runs: [{ text: "STORYBOARD" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.9 },
      size: { width: 8.6, height: 0.65 },
      runs: [{ text: "Three frames, one crisp narrative arc." }],
      font: { family: SANS, size: 26, color: INK, bold: true }
    },
    {
      type: "rectangle",
      position: { x: 0.6, y: 1.82 },
      size: { width: 2.55, height: 2.38 },
      fill: { color: OFF_WHITE },
      borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
    },
    {
      type: "rectangle",
      position: { x: 3.72, y: 1.82 },
      size: { width: 2.55, height: 2.38 },
      fill: { color: OFF_WHITE },
      borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
    },
    {
      type: "rectangle",
      position: { x: 6.84, y: 1.82 },
      size: { width: 2.55, height: 2.38 },
      fill: { color: OFF_WHITE },
      borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
    },
    {
      type: "svg",
      position: { x: 0.78, y: 2.2 },
      size: { width: 8.45, height: 1.55 },
      svg: STORY_SVG,
      name: "Storyboard icons"
    },
    ...["Problem", "Shift", "Outcome"].flatMap((label, index): SlideElement[] => {
      const x = 0.92 + index * 3.12;
      return [
        {
          type: "text",
          position: { x: x, y: 3.78 },
          size: { width: 1.9, height: 0.28 },
          runs: [{ text: label }],
          font: { family: SANS, size: 14, color: INK, bold: true },
          alignment: { horizontal: "center" }
        },
        {
          type: "text",
          position: { x: x, y: 4.22 },
          size: { width: 1.9, height: 0.22 },
          runs: [{ text: `FRAME ${index + 1}` }],
          font: { family: SANS, size: 7, color: MUTED, bold: true, letterSpacing: 160 },
          alignment: { horizontal: "center" }
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
      type: "text",
      position: { x: 0.6, y: 0.5 },
      size: { width: 5.2, height: 0.3 },
      runs: [{ text: "EDITOR FEATURE LAB" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },
    {
      type: "text",
      position: { x: 0.6, y: 0.85 },
      size: { width: 6.2, height: 0.58 },
      runs: [{ text: "One slide for testing new object workflows." }],
      font: { family: SANS, size: 24, color: INK, bold: true }
    },
    {
      type: "text-list",
      position: { x: 0.72, y: 1.62 },
      size: { width: 2.6, height: 1.18 },
      marker: "bullet",
      items: [{ type: "text", text: "Toolbar routing" }, { type: "text", text: "Inline editing" }, { type: "text", text: "Drawer inspection" }],
      font: { family: SANS, size: 15, color: INK, lineHeight: 1.18 }
    },
    {
      type: "image",
      position: { x: 0.72, y: 3.05 },
      size: { width: 2.6, height: 1.38 },
      fit: "cover",
      name: "Upload target"
    },
    {
      type: "rectangle",
      position: { x: 3.62, y: 1.56 },
      size: { width: 1.05, height: 0.64 },
      fill: { color: GOLD },
      stroke: { color: NAVY, width: 0.75 },
      borderRadius: { tl: 0.08, tr: 0.08, bl: 0.08, br: 0.08 }
    },
    {
      type: "ellipse",
      position: { x: 4.88, y: 1.56 },
      size: { width: 0.86, height: 0.64 },
      fill: { color: BLUE },
      stroke: { color: BLUE_DK, width: 0.75 }
    },
    {
      type: "text",
      position: { x: 3.62, y: 2.38 },
      size: { width: 2.2, height: 0.8 },
      runs: [{ text: "Shape toolbar\nand geometry" }],
      font: { family: SANS, size: 17, color: INK, bold: true, lineHeight: 1.15 }
    },
    {
      type: "svg",
      position: { x: 6.2, y: 0.9 },
      size: { width: 2.95, height: 1.88 },
      svg: EDITOR_TOOLS_SVG,
      name: "SVG toolbar target"
    },
    {
      type: "chart",
      position: { x: 3.62, y: 3.1 },
      size: { width: 2.35, height: 1.38 },
      chartType: "donut",
      title: "Chart target",
      color: BLUE_DK,
      axisColor: MUTED_DK,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Edit", value: 46, color: BLUE_DK },
        { label: "Inspect", value: 32, color: GOLD },
        { label: "Export", value: 22, color: NAVY },
      ]
    },
    {
      type: "table",
      position: { x: 6.2, y: 3.05 },
      size: { width: 3.0, height: 1.42 },
      font: { family: SANS, size: 9, color: INK },
      columns: [{ text: "Feature", fill: { color: NAVY }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: "FFFFFF", bold: true } }, { text: "Target", fill: { color: NAVY }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: "FFFFFF", bold: true } }],
      rows: [[{ text: "Chart", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "Toolbar", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }], [{ text: "SVG", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "Toolbar", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }], [{ text: "Table", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }, { text: "Inline", fill: { color: PAPER }, stroke: { color: "DDE5F0", width: 0.5 }, font: { color: INK } }]]
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
      type: "text",
      position: { x: 0.3, y: 0 },
      size: { width: 3.5, height: 4.2 },
      runs: [{ text: "“" }],
      font: { family: SANS, size: 260, color: GOLD, bold: true, lineHeight: 1 },
      opacity: 0.18
    },

    {
      type: "text",
      position: { x: 1.2, y: 0.7 },
      size: { width: 7, height: 0.3 },
      runs: [{ text: "CLOSING THOUGHT" }],
      font: { family: SANS, size: 10, color: BLUE_DK, bold: true, letterSpacing: 300 }
    },

    // Quote — no manual \n; let the engine wrap inside the box so wrapping
    // is identical between the CSS preview and the PPTX export.
    {
      type: "text",
      position: { x: 1.2, y: 1.3 },
      size: { width: 7.6, height: 2.8 },
      runs: [{ text: "The best presentations make the important idea easy to understand, easy to remember, and easy to act on." }],
      font: { family: SANS, size: 24, color: INK, italic: true, lineHeight: 1.35 }
    },

    {
      type: "rectangle",
      position: { x: 1.2, y: 4.2 },
      size: { width: 0.4, height: 0.04 },
      fill: { color: GOLD }
    },
    {
      type: "text",
      position: { x: 1.2, y: 4.35 },
      size: { width: 7, height: 0.35 },
      runs: [{ text: "Sample Attribution" }],
      font: { family: SANS, size: 14, color: INK, bold: true }
    },
    {
      type: "text",
      position: { x: 1.2, y: 4.7 },
      size: { width: 7, height: 0.3 },
      runs: [{ text: "Role, company, or source" }],
      font: { family: SANS, size: 11, color: MUTED }
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
