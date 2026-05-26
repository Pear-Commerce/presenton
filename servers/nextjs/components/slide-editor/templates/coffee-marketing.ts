import { SLIDE_H, type Deck, type Slide, type SlideElement } from "../lib/slide-schema";

// A coffee deck that avoids the expected all-brown cafe look. The brand world
// is roast-dark, mint-bright, coral-lit, and editorial.
const ROAST = "211714";
const ESPRESSO = "3B211B";
const CREAM = "F7F0E2";
const FOAM = "FFF8EA";
const MINT = "87D8B7";
const CORAL = "F26B5E";
const SAFFRON = "F2B84B";
const PLUM = "35213D";
const INK = "211714";
const MUTED = "7A665D";
const LINE = "E4D8C4";
const WHITE = "FFFFFF";

const SANS = "Arial";
const SERIF = "Georgia";
const TOTAL = 8;

const HERO_CUP_SVG = `<svg viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="heroGlow" cx="52%" cy="42%" r="54%">
      <stop offset="0%" stop-color="#F2B84B" stop-opacity="0.55"/>
      <stop offset="48%" stop-color="#F26B5E" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#211714" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cup" x1="0" x2="1">
      <stop offset="0%" stop-color="#FFF8EA"/>
      <stop offset="54%" stop-color="#F7F0E2"/>
      <stop offset="100%" stop-color="#C7AA84"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="900" height="620" fill="#211714"/>
  <circle cx="500" cy="295" r="290" fill="url(#heroGlow)"/>
  <g fill="none" stroke-linecap="round" opacity="0.95">
    <path d="M328 171 C262 98, 392 82, 327 28" stroke="#87D8B7" stroke-width="14"/>
    <path d="M430 160 C362 88, 498 74, 447 18" stroke="#F26B5E" stroke-width="12"/>
    <path d="M536 178 C478 118, 594 92, 554 48" stroke="#F2B84B" stroke-width="10"/>
  </g>
  <ellipse cx="446" cy="512" rx="255" ry="36" fill="#000" opacity="0.3" filter="url(#soft)"/>
  <path d="M228 244 H605 L562 512 H280 Z" fill="url(#cup)"/>
  <ellipse cx="416" cy="244" rx="188" ry="44" fill="#FFF8EA"/>
  <ellipse cx="416" cy="246" rx="142" ry="28" fill="#3B211B"/>
  <path d="M603 294 C725 278, 737 427, 574 420 L587 354 C659 365, 662 322, 596 326 Z" fill="none" stroke="#FFF8EA" stroke-width="34" stroke-linejoin="round"/>
  <path d="M303 352 C383 392, 466 388, 541 346" fill="none" stroke="#F26B5E" stroke-width="15" stroke-linecap="round"/>
  <g fill="#87D8B7">
    <circle cx="252" cy="211" r="12"/>
    <circle cx="636" cy="208" r="10"/>
    <circle cx="688" cy="462" r="14"/>
  </g>
</svg>`;

const BEAN_CONSTELLATION_SVG = `<svg viewBox="0 0 1000 562" xmlns="http://www.w3.org/2000/svg">
  <rect width="1000" height="562" fill="#F7F0E2"/>
  <g opacity="0.9">
    <path d="M0 416 C166 300, 288 500, 462 350 C637 198, 778 400, 1000 225" fill="none" stroke="#87D8B7" stroke-width="22" stroke-linecap="round"/>
    <path d="M0 342 C140 246, 280 438, 440 286 C628 111, 774 322, 1000 138" fill="none" stroke="#F26B5E" stroke-width="8" stroke-linecap="round" opacity="0.65"/>
  </g>
  <g fill="#3B211B" opacity="0.95">
    <ellipse cx="150" cy="332" rx="32" ry="45" transform="rotate(-24 150 332)"/>
    <ellipse cx="302" cy="417" rx="24" ry="35" transform="rotate(32 302 417)"/>
    <ellipse cx="470" cy="330" rx="35" ry="48" transform="rotate(-16 470 330)"/>
    <ellipse cx="640" cy="222" rx="26" ry="38" transform="rotate(28 640 222)"/>
    <ellipse cx="815" cy="292" rx="31" ry="44" transform="rotate(-32 815 292)"/>
  </g>
  <g fill="none" stroke="#F7F0E2" stroke-width="4" opacity="0.82">
    <path d="M139 294 C170 322, 171 353, 148 372"/>
    <path d="M290 390 C316 412, 316 436, 299 449"/>
    <path d="M459 291 C493 322, 493 354, 469 374"/>
    <path d="M628 191 C655 218, 655 244, 638 256"/>
    <path d="M801 253 C833 285, 834 316, 812 333"/>
  </g>
</svg>`;

const PACK_SYSTEM_SVG = `<svg viewBox="0 0 820 520" xmlns="http://www.w3.org/2000/svg">
  <rect width="820" height="520" rx="34" fill="#35213D"/>
  <g transform="translate(74 58)">
    <rect x="0" y="42" width="190" height="335" rx="20" fill="#F7F0E2"/>
    <path d="M24 42 L58 0 H132 L166 42 Z" fill="#87D8B7"/>
    <rect x="29" y="100" width="132" height="112" rx="18" fill="#211714"/>
    <circle cx="95" cy="156" r="38" fill="#F2B84B"/>
    <path d="M70 156 C92 118, 122 118, 140 156" fill="none" stroke="#F26B5E" stroke-width="10" stroke-linecap="round"/>
    <rect x="38" y="244" width="114" height="13" rx="6.5" fill="#3B211B"/>
    <rect x="56" y="272" width="78" height="9" rx="4.5" fill="#7A665D"/>
  </g>
  <g transform="translate(326 86)">
    <rect width="176" height="250" rx="24" fill="#87D8B7"/>
    <text x="32" y="76" fill="#211714" font-family="Arial" font-size="25" font-weight="700">MINT</text>
    <text x="32" y="112" fill="#211714" font-family="Georgia" font-size="42">Cold</text>
    <text x="32" y="158" fill="#211714" font-family="Georgia" font-size="42">Brew</text>
    <circle cx="132" cy="198" r="24" fill="#F26B5E"/>
  </g>
  <g transform="translate(552 132)">
    <rect width="170" height="218" rx="22" fill="#F26B5E"/>
    <text x="28" y="68" fill="#FFF8EA" font-family="Georgia" font-size="43">Glow</text>
    <text x="28" y="112" fill="#FFF8EA" font-family="Arial" font-size="18" font-weight="700">ESPRESSO</text>
    <path d="M40 156 C80 118, 114 118, 142 156" fill="none" stroke="#F2B84B" stroke-width="12" stroke-linecap="round"/>
  </g>
</svg>`;

const FLAVOR_WHEEL_SVG = `<svg viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg">
  <rect width="560" height="560" rx="36" fill="#211714"/>
  <g transform="translate(280 280)">
    <path d="M0 0 L0 -212 A212 212 0 0 1 184 -106 Z" fill="#F26B5E"/>
    <path d="M0 0 L184 -106 A212 212 0 0 1 184 106 Z" fill="#F2B84B"/>
    <path d="M0 0 L184 106 A212 212 0 0 1 0 212 Z" fill="#87D8B7"/>
    <path d="M0 0 L0 212 A212 212 0 0 1 -184 106 Z" fill="#F7F0E2"/>
    <path d="M0 0 L-184 106 A212 212 0 0 1 -184 -106 Z" fill="#C7AA84"/>
    <path d="M0 0 L-184 -106 A212 212 0 0 1 0 -212 Z" fill="#7E4D3D"/>
    <circle r="118" fill="#211714"/>
    <circle r="64" fill="#FFF8EA"/>
    <text x="-40" y="10" fill="#211714" font-family="Georgia" font-size="28">Taste</text>
  </g>
</svg>`;

const CHANNELS_SVG = `<svg viewBox="0 0 960 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="960" height="300" fill="#FFF8EA"/>
  <g fill="none" stroke="#211714" stroke-width="5" opacity="0.16">
    <path d="M85 146 H875"/>
    <path d="M242 146 C282 68, 352 68, 392 146"/>
    <path d="M568 146 C608 224, 678 224, 718 146"/>
  </g>
  <g>
    <circle cx="110" cy="146" r="54" fill="#F26B5E"/>
    <circle cx="296" cy="146" r="54" fill="#87D8B7"/>
    <circle cx="482" cy="146" r="54" fill="#F2B84B"/>
    <circle cx="668" cy="146" r="54" fill="#35213D"/>
    <circle cx="854" cy="146" r="54" fill="#3B211B"/>
  </g>
  <g fill="#FFF8EA" font-family="Arial" font-size="24" font-weight="700" text-anchor="middle">
    <text x="110" y="154">OOH</text>
    <text x="296" y="154" fill="#211714">SOC</text>
    <text x="482" y="154" fill="#211714">IRL</text>
    <text x="668" y="154">CRM</text>
    <text x="854" y="154">RET</text>
  </g>
</svg>`;

function footer(num: number, onDark: boolean): SlideElement[] {
  const color = onDark ? "C9B9A7" : MUTED;
  return [
    {
      kind: "text",
      x: 0.55,
      y: 5.25,
      w: 3.5,
      h: 0.22,
      text: "MIDNIGHT ROAST",
      fontSize: 8,
      bold: true,
      color,
      charSpacing: 260,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 8.75,
      y: 5.25,
      w: 0.8,
      h: 0.22,
      text: `${num}/${TOTAL}`,
      fontSize: 8,
      bold: true,
      color,
      align: "right",
      fontFace: SANS,
    },
  ];
}

function eyebrow(text: string, color = CORAL): SlideElement {
  return {
    kind: "text",
    x: 0.62,
    y: 0.52,
    w: 5.8,
    h: 0.22,
    text,
    fontSize: 8,
    bold: true,
    color,
    charSpacing: 260,
    fontFace: SANS,
  };
}

function stat(x: number, value: string, label: string, color: string): SlideElement[] {
  return [
    { kind: "rect", x, y: 4.06, w: 1.55, h: 0.72, fill: color, rx: 0.08 },
    {
      kind: "text",
      x: x + 0.16,
      y: 4.2,
      w: 1.23,
      h: 0.28,
      text: value,
      fontSize: 22,
      bold: true,
      color: color === CREAM || color === MINT || color === SAFFRON ? INK : WHITE,
      align: "center",
      fontFace: SANS,
    },
    {
      kind: "text",
      x: x + 0.18,
      y: 4.52,
      w: 1.2,
      h: 0.16,
      text: label,
      fontSize: 6.5,
      bold: true,
      color: color === CREAM || color === MINT || color === SAFFRON ? INK : WHITE,
      align: "center",
      charSpacing: 130,
      fontFace: SANS,
    },
  ];
}

const slide1Cover: Slide = {
  title: "Campaign Cover",
  background: ROAST,
  elements: [
    { kind: "svg", x: 4.72, y: 0, w: 5.28, h: SLIDE_H, svg: HERO_CUP_SVG, name: "Glowing coffee cup" },
    { kind: "rect", x: 0, y: 0, w: 4.82, h: SLIDE_H, fill: ROAST },
    { kind: "rect", x: 0.62, y: 0.62, w: 0.56, h: 0.05, fill: MINT },
    {
      kind: "text",
      x: 0.62,
      y: 0.88,
      w: 3.6,
      h: 0.22,
      text: "COFFEE MARKETING SYSTEM",
      fontSize: 8,
      bold: true,
      color: MINT,
      charSpacing: 250,
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.55,
      y: 1.38,
      w: 4.45,
      h: 1.92,
      text: "Midnight\nRoast",
      fontSize: 64,
      bold: true,
      color: FOAM,
      lineHeight: 0.96,
      fontFace: SERIF,
    },
    {
      kind: "text",
      x: 0.65,
      y: 3.5,
      w: 3.55,
      h: 0.56,
      text: "A sensory launch campaign for an evening coffee ritual: bold enough for night, smooth enough for every day.",
      fontSize: 13,
      color: "D7C8B8",
      lineHeight: 1.35,
      fontFace: SANS,
    },
    ...stat(0.65, "4.7x", "SOCIAL LIFT", CORAL),
    ...stat(2.38, "62%", "TRIAL INTENT", MINT),
    ...footer(1, true),
  ],
};

const slide2Audience: Slide = {
  title: "Audience Signal",
  background: CREAM,
  elements: [
    { kind: "svg", x: 0, y: 2.0, w: 10, h: 2.55, svg: BEAN_CONSTELLATION_SVG, name: "Bean signal map" },
    eyebrow("01 · AUDIENCE SIGNAL", CORAL),
    {
      kind: "text",
      x: 0.62,
      y: 0.9,
      w: 7.4,
      h: 0.78,
      text: "The next coffee occasion is after hours.",
      fontSize: 34,
      bold: true,
      color: INK,
      fontFace: SERIF,
    },
    {
      kind: "bullets",
      x: 6.35,
      y: 0.8,
      w: 2.95,
      h: 1.0,
      items: ["Remote workers want a softer second wind", "Creators buy rituals, not just caffeine", "Flavor-forward coffee travels on social"],
      fontFace: SANS,
      fontSize: 12,
      color: INK,
      bulletColor: CORAL,
      lineSpacingMultiple: 1.18,
      itemGap: 0.04,
    },
    ...stat(0.7, "8:43", "PEAK SAVE TIME", PLUM),
    ...stat(2.5, "38M", "NIGHT-SCROLL REACH", CORAL),
    ...stat(4.3, "+24%", "DECAF CURIOUS", SAFFRON),
    ...stat(6.1, "71%", "RITUAL SEEKERS", MINT),
    ...footer(2, false),
  ],
};

const slide3ProductWorld: Slide = {
  title: "Product World",
  background: PLUM,
  elements: [
    { kind: "svg", x: 0.48, y: 0.48, w: 5.05, h: 3.2, svg: PACK_SYSTEM_SVG, name: "Packaging system" },
    eyebrow("02 · PRODUCT WORLD", MINT),
    {
      kind: "text",
      x: 5.95,
      y: 0.96,
      w: 3.42,
      h: 1.0,
      text: "Three packs. One night ritual.",
      fontSize: 34,
      bold: true,
      color: FOAM,
      lineHeight: 1.05,
      fontFace: SERIF,
    },
    {
      kind: "table",
      x: 5.95,
      y: 2.32,
      w: 3.25,
      h: 1.55,
      rows: [
        ["SKU", "Mood", "Hero note"],
        ["Velvet", "Calm", "Cocoa"],
        ["Mint", "Bright", "Herbal"],
        ["Glow", "Bold", "Citrus"],
      ],
      fontFace: SANS,
      fontSize: 8.5,
      textColor: FOAM,
      headerFill: CORAL,
      headerTextColor: WHITE,
      borderColor: "6B4A70",
      fill: "45284F",
    },
    {
      kind: "text",
      x: 5.98,
      y: 4.18,
      w: 3.1,
      h: 0.42,
      text: "Packaging designed for shelf stop, creator close-ups, and unboxing motion.",
      fontSize: 11.5,
      color: "D8C8DF",
      lineHeight: 1.3,
      fontFace: SANS,
    },
    ...footer(3, true),
  ],
};

const slide4Flavor: Slide = {
  title: "Flavor Strategy",
  background: FOAM,
  elements: [
    eyebrow("03 · FLAVOR STRATEGY", PLUM),
    {
      kind: "text",
      x: 0.62,
      y: 0.9,
      w: 4.2,
      h: 1.0,
      text: "Build taste memory, not menu clutter.",
      fontSize: 33,
      bold: true,
      color: INK,
      lineHeight: 1.06,
      fontFace: SERIF,
    },
    { kind: "svg", x: 5.65, y: 0.56, w: 3.65, h: 3.65, svg: FLAVOR_WHEEL_SVG, name: "Flavor wheel" },
    {
      kind: "chart",
      chartType: "bar",
      x: 0.7,
      y: 2.35,
      w: 4.35,
      h: 1.76,
      title: "Flavor pull in concept test",
      color: CORAL,
      axisColor: LINE,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Cocoa", value: 84, color: ESPRESSO },
        { label: "Mint", value: 76, color: MINT },
        { label: "Citrus", value: 68, color: CORAL },
        { label: "Smoke", value: 52, color: PLUM },
      ],
    },
    {
      kind: "text",
      x: 5.85,
      y: 4.34,
      w: 3.25,
      h: 0.36,
      text: "Lead with cocoa comfort, then let mint and citrus create the talkable edge.",
      fontSize: 12,
      color: MUTED,
      lineHeight: 1.25,
      fontFace: SANS,
    },
    ...footer(4, false),
  ],
};

const slide5Campaign: Slide = {
  title: "Campaign System",
  background: CREAM,
  elements: [
    eyebrow("04 · CAMPAIGN SYSTEM", CORAL),
    {
      kind: "text",
      x: 0.62,
      y: 0.9,
      w: 6.8,
      h: 0.76,
      text: "One ritual, five channel moments.",
      fontSize: 33,
      bold: true,
      color: INK,
      fontFace: SERIF,
    },
    { kind: "svg", x: 0.55, y: 1.88, w: 8.9, h: 2.78, svg: CHANNELS_SVG, name: "Campaign channels" },
    ...["Out-of-home glow", "Creator night desk", "Tasting pop-up", "SMS reorder", "Retail endcap"].map((label, index): SlideElement => ({
      kind: "text",
      x: 0.55 + index * 1.86,
      y: 4.65,
      w: 1.32,
      h: 0.28,
      text: label,
      fontSize: 8.5,
      bold: true,
      color: INK,
      align: "center",
      fontFace: SANS,
    })),
    ...footer(5, false),
  ],
};

const slide6Content: Slide = {
  title: "Content Engine",
  background: ROAST,
  elements: [
    { kind: "rect", x: 0.52, y: 0.52, w: 2.08, h: 3.95, fill: FOAM, rx: 0.1 },
    { kind: "rect", x: 2.85, y: 1.06, w: 2.08, h: 3.95, fill: MINT, rx: 0.1 },
    { kind: "rect", x: 5.18, y: 0.52, w: 2.08, h: 3.95, fill: CORAL, rx: 0.1 },
    { kind: "rect", x: 7.51, y: 1.06, w: 2.08, h: 3.95, fill: SAFFRON, rx: 0.1 },
    ...["POUR", "PAUSE", "POST", "PICKUP"].flatMap((word, index): SlideElement[] => {
      const x = 0.52 + index * 2.33;
      const y = index % 2 === 0 ? 0.52 : 1.06;
      return [
        {
          kind: "text",
          x: x + 0.25,
          y: y + 0.32,
          w: 1.55,
          h: 0.34,
          text: word,
          fontSize: 16,
          bold: true,
          color: index === 0 || index === 3 ? INK : ROAST,
          charSpacing: 120,
          align: "center",
          fontFace: SANS,
        },
        { kind: "image", x: x + 0.24, y: y + 0.9, w: 1.6, h: 1.88, fit: "cover", name: `${word} image slot` },
        {
          kind: "text",
          x: x + 0.24,
          y: y + 3.05,
          w: 1.6,
          h: 0.28,
          text: ["Steam macro", "Desk ritual", "Creator cut", "Shelf story"][index],
          fontSize: 9.5,
          bold: true,
          color: index === 0 || index === 3 ? MUTED : ROAST,
          align: "center",
          fontFace: SANS,
        },
      ];
    }),
    ...footer(6, true),
  ],
};

const slide7Forecast: Slide = {
  title: "Forecast",
  background: FOAM,
  elements: [
    eyebrow("06 · GROWTH FORECAST", CORAL),
    {
      kind: "text",
      x: 0.62,
      y: 0.9,
      w: 4.0,
      h: 0.82,
      text: "Trial compounds when ritual repeats.",
      fontSize: 32,
      bold: true,
      color: INK,
      lineHeight: 1.06,
      fontFace: SERIF,
    },
    {
      kind: "chart",
      chartType: "line",
      x: 0.72,
      y: 2.04,
      w: 4.52,
      h: 2.22,
      title: "Repeat purchase curve",
      color: CORAL,
      axisColor: LINE,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "W1", value: 18, color: CORAL },
        { label: "W2", value: 29, color: CORAL },
        { label: "W3", value: 46, color: CORAL },
        { label: "W4", value: 58, color: CORAL },
        { label: "W5", value: 72, color: CORAL },
      ],
    },
    {
      kind: "chart",
      chartType: "donut",
      x: 5.72,
      y: 1.08,
      w: 3.38,
      h: 2.28,
      title: "Media mix",
      color: PLUM,
      labelColor: MUTED,
      showValues: true,
      data: [
        { label: "Social", value: 42, color: CORAL },
        { label: "Retail", value: 26, color: ESPRESSO },
        { label: "OOH", value: 20, color: MINT },
        { label: "CRM", value: 12, color: SAFFRON },
      ],
    },
    ...stat(5.78, "$2.8M", "LAUNCH REVENUE", PLUM),
    ...stat(7.55, "41%", "REPEAT TARGET", CORAL),
    ...footer(7, false),
  ],
};

const slide8Close: Slide = {
  title: "Closing",
  background: ROAST,
  elements: [
    { kind: "svg", x: 0, y: 0, w: 10, h: SLIDE_H, svg: HERO_CUP_SVG, name: "Closing cup glow", opacity: 0.34 },
    { kind: "rect", x: 0, y: 0, w: 10, h: SLIDE_H, fill: ROAST, opacity: 0.55 },
    {
      kind: "text",
      x: 0.8,
      y: 0.78,
      w: 8.4,
      h: 0.26,
      text: "THE ASK",
      fontSize: 9,
      bold: true,
      color: MINT,
      charSpacing: 300,
      align: "center",
      fontFace: SANS,
    },
    {
      kind: "text",
      x: 0.8,
      y: 1.45,
      w: 8.4,
      h: 1.34,
      text: "Make coffee feel like the night turning on.",
      fontSize: 47,
      bold: true,
      color: FOAM,
      align: "center",
      lineHeight: 1.03,
      fontFace: SERIF,
    },
    {
      kind: "bullets",
      x: 2.35,
      y: 3.38,
      w: 5.3,
      h: 0.9,
      items: ["Approve hero packaging system", "Fund creator and retail launch", "Ship the 8-week ritual calendar"],
      fontFace: SANS,
      fontSize: 14,
      color: FOAM,
      bulletColor: SAFFRON,
      lineSpacingMultiple: 1.18,
    },
    { kind: "rect", x: 3.82, y: 4.62, w: 2.35, h: 0.05, fill: CORAL },
    ...footer(8, true),
  ],
};

export const coffeeMarketingDeck: Deck = {
  title: "Midnight Roast Coffee Marketing",
  description:
    "A premium coffee campaign deck for an evening ritual launch, built with editable charts, SVG scenes, tables, image placeholders, and rich brand layouts.",
  theme: {
    background: CREAM,
    surface: FOAM,
    primary: ROAST,
    secondary: PLUM,
    accent: CORAL,
    text: INK,
    muted: MUTED,
  },
  slides: [
    slide1Cover,
    slide2Audience,
    slide3ProductWorld,
    slide4Flavor,
    slide5Campaign,
    slide6Content,
    slide7Forecast,
    slide8Close,
  ],
};
