import type {
  ChartElement,
  Deck,
  Slide,
  SlideElement,
} from "../lib/slide-schema";
import type { GenerationLayoutMetadata } from "../lib/slide-generation-layout-metadata";
import { createTemplateElements } from "./template-elements";

const SANS = "Poppins";

const BG = "FFFFFE";
const INK = "101828";
const BLACK = "000000";
const MUTED = "4D5463";
const SOFT_TEXT = "6B7280";
const LINE = "F0F0F2";
const CARD = "FFFFFF";
const PANEL = "EEF3F7";
const PRIMARY = "9234EB";
const PRIMARY_DARK = "703AC9";
const ORANGE = "FF751F";
const AMBER = "FFBD59";
const CYAN = "06B6D4";
const GREEN = "10B981";
const BLUE = "457EE5";

const REAL_IMAGES = {
  collaboration:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  analytics:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  quoteMountain:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80",
  quoteLandscape:
    "https://images.pexels.com/photos/33508509/pexels-photo-33508509.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400",
  placeholder:
    "https://presenton-public-assets.s3.ap-southeast-1.amazonaws.com/replaceable_template_image.png",
  headshots: [
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  ],
};

export const neoGeneralGenerationLayouts = [
  {
    layoutId: "headline-description-with-image-layout",
    slideIndex: 16,
    layoutName: "Title Description With Image",
    layoutDescription:
      "A minimal two-column layout featuring bold title, accent bar, and description on the left, with a single rounded image on the right.",
    semanticKind: "cover",
    schemaFields: ["title", "body[0]=short promise", "imagePrompt"],
  },
  {
    layoutId: "headline-description-with-double-image-layout",
    slideIndex: 17,
    layoutName: "Title Description With Two Images",
    layoutDescription:
      "A clean layout with left-aligned bold title, accent bar, and description paragraph, paired with two overlapping rounded images on the right in a grid arrangement.",
    semanticKind: "visual",
    schemaFields: ["title", "body[0]=main explanation", "imagePrompt"],
  },
  {
    layoutId: "quote-slide",
    slideIndex: 23,
    layoutName: "Centered Text On Image Overlay",
    layoutDescription:
      "A full-screen layout with background image, semi-transparent overlay, centered heading with accent line, large quote icon, quote text, and author attribution with decorative lines.",
    semanticKind: "quote",
    schemaFields: ["title", "body[0]=quote", "body[1]=author", "imagePrompt"],
  },
  {
    layoutId: "left-align-quote",
    slideIndex: 11,
    layoutName: "Left-Aligned Text On Background Image",
    layoutDescription:
      "A full-bleed background image layout featuring a left-aligned bold title with accent bar, a prominent quote in large text, and author attribution below.",
    semanticKind: "quote",
    schemaFields: ["title", "body[0]=quote", "body[1]=author", "imagePrompt"],
  },
  {
    layoutId: "title-two-column-numbered-list",
    slideIndex: 24,
    layoutName: "Split Title With Two Column Numbered List",
    layoutDescription:
      "A split layout with large title on the left and two-column numbered list on the right. Each item displays a numbered circle badge and label.",
    semanticKind: "bullets",
    schemaFields: ["title", "bullets[]=numbered agenda or sections"],
  },
  {
    layoutId: "title-side-insight-slide",
    slideIndex: 0,
    layoutName: "Split Title With Text Card",
    layoutDescription:
      "A balanced two-section layout with bold title and accent bar on the left, paired with a white card on the right containing accent-colored heading and description text.",
    semanticKind: "cards",
    schemaFields: ["title", "body[0]=core insight", "bullets[]=supporting points"],
  },
  {
    layoutId: "title-six-card-grid-slide-layout",
    slideIndex: 1,
    layoutName: "Title With Six Text Cards Grid",
    layoutDescription:
      "A layout featuring left-aligned bold title with accent bar, followed by a 3x2 grid of up to 6 cards. Each card contains an accent-colored heading and description text.",
    semanticKind: "cards",
    schemaFields: ["title", "bullets[]=Card title: card description"],
  },
  {
    layoutId: "title-three-column-risk-constraints-slide-layout",
    slideIndex: 5,
    layoutName: "Three Column Category Cards",
    layoutDescription:
      "A layout with bold title and accent bar at top, followed by three column cards each featuring large category label, subtitle with accent dot, and detailed description.",
    semanticKind: "cards",
    schemaFields: ["title", "bullets[]=Category: description"],
  },
  {
    layoutId: "title-three-columns-with-labels",
    slideIndex: 9,
    layoutName: "Three Columns With Index Numbers",
    layoutDescription:
      "A layout featuring bold title with accent bar, followed by three indexed columns each containing large index number, heading, and two labeled content sections.",
    semanticKind: "cards",
    schemaFields: ["title", "bullets[]=Column heading: two short details"],
  },
  {
    layoutId: "title-challenge-outcome-customer-card",
    slideIndex: 13,
    layoutName: "Two Section Text With Highlight Card",
    layoutDescription:
      "A two-section layout featuring title with accent bar, first section with heading and description, numbered list in the second section on the left, and a highlight card on the right with name, subtitle, icon badge, and prominent metric.",
    semanticKind: "cards",
    schemaFields: ["title", "body[]=challenge/outcome copy", "bullets[]", "metrics[0]"],
  },
  {
    layoutId: "bullet-icons-only-slide",
    slideIndex: 18,
    layoutName: "Icon Bullet Grid With Image",
    layoutDescription:
      "A layout featuring a large left-aligned title with a 2-4 icon bullet point grid, each with circular icon badge, title, and optional subtitle. A rounded supporting image sits on the right.",
    semanticKind: "bullets",
    schemaFields: ["title", "bullets[]=Point: subtitle", "imagePrompt"],
  },
  {
    layoutId: "bullet-with-icons-slide",
    slideIndex: 19,
    layoutName: "Image With Icon Bullets",
    layoutDescription:
      "A two-section layout with a full-width title, left-side image with decorative grid pattern, and right-side content featuring description text and 1-3 icon-enhanced bullet points. Each bullet has an icon badge, title, accent line, and description.",
    semanticKind: "bullets",
    schemaFields: ["title", "body[0]=context", "bullets[]=Point: description", "imagePrompt"],
  },
  {
    layoutId: "numbered-bullets-slide",
    slideIndex: 22,
    layoutName: "Title Image With Numbered Points",
    layoutDescription:
      "A layout featuring a large title with accent line, a supporting image in the upper right, and 1-3 numbered bullet points in a two-column grid below. Each point has a large number prefix, title, and description.",
    semanticKind: "bullets",
    schemaFields: ["title", "bullets[]=Step title: description", "imagePrompt"],
  },
  {
    layoutId: "headline-text-with-stats-layout",
    slideIndex: 15,
    layoutName: "Numbered List With Side Metrics",
    layoutDescription:
      "A two-column layout with bold title, accent bar, and numbered bullet point list on the left, paired with 3 large vertical metrics on the right. Each metric shows value with label and accent dot.",
    semanticKind: "metrics",
    schemaFields: ["title", "bullets[]=numbered points", "metrics[]=value,label,description"],
  },
  {
    layoutId: "performance-grid-snapshot-slide",
    slideIndex: 14,
    layoutName: "Metric Cards Grid",
    layoutDescription:
      "A centered layout with bold title and accent bar, followed by a 4x2 grid of up to 8 metric cards. Each card displays a value, label, and subtext. Cards can optionally be highlighted with colored background.",
    semanticKind: "metrics",
    schemaFields: ["title", "metrics[]=value,label,description"],
  },
  {
    layoutId: "layout-text-block-with-metric-cards",
    slideIndex: 10,
    layoutName: "Text Block With Progress Metric Cards",
    layoutDescription:
      "A split layout with title, subheading, and description on the left, paired with a gray panel containing up to 5 metric cards on the right. Each card shows name, value, target comparison, and semi-circular progress indicator.",
    semanticKind: "metrics",
    schemaFields: ["title", "body[]=narrative text", "metrics[]=progress metric"],
  },
  {
    layoutId: "metrics-with-image-slide",
    slideIndex: 21,
    layoutName: "Image With Title And Metrics",
    layoutDescription:
      "A two-column layout with a large supporting image on the left and content on the right including title, description, and a 2-column metrics grid displaying up to 3 statistics with labels and values.",
    semanticKind: "metrics",
    schemaFields: ["title", "body[0]=description", "metrics[]=value,label", "imagePrompt"],
  },
  {
    layoutId: "title-metricValue-metricLabel-funnelStages",
    slideIndex: 6,
    layoutName: "Metric With Funnel Bars",
    layoutDescription:
      "A layout featuring title with accent bar, left-side key metric with label, and horizontal funnel visualization on the right. Each funnel stage shows labeled pill, connector line, and colored bar with value and rate.",
    semanticKind: "metrics",
    schemaFields: ["title", "metrics[0]=headline metric", "chart.data[]=funnel stages"],
  },
  {
    layoutId: "title-metrics-with-chart",
    slideIndex: 3,
    layoutName: "Chart With Sidebar Metrics",
    layoutDescription:
      "A two-column layout featuring a bold title, a large chart container on the left, and up to 6 vertical metrics on the right sidebar. Supports line, bar, grouped, stacked, clustered, diverging, area, pie, and donut charts.",
    semanticKind: "chart",
    schemaFields: ["title", "body[0]=context", "chart", "metrics[]=value,label"],
  },
  {
    layoutId: "title-with-full-width-chart",
    slideIndex: 2,
    layoutName: "Title With Full-Width Chart",
    layoutDescription:
      "A centered layout with a bold title and underline accent, followed by a full-width chart container with legend. Supports line, bar, grouped, stacked, clustered, diverging, area, pie, and donut charts.",
    semanticKind: "chart",
    schemaFields: ["title", "chart"],
  },
  {
    layoutId: "chart-with-bullets-slide",
    slideIndex: 20,
    layoutName: "Chart With Bullet Cards",
    layoutDescription:
      "A split layout with title, description, and a versatile chart on the left, paired with 1-3 colored icon bullet cards on the right. Supports bar, grouped, stacked, clustered, diverging, line, area, pie, and scatter charts.",
    semanticKind: "chart",
    schemaFields: ["title", "body[0]=chart takeaway", "chart", "bullets[]=insight cards"],
  },
  {
    layoutId: "multi-chart-grid-slide",
    slideIndex: 26,
    layoutName: "Title Description With Multi-Chart Grid",
    layoutDescription:
      "A flexible dashboard layout featuring a title section with description and 1-6 auto-arranged charts in a responsive grid. Supports bar, line, area, pie, donut, and scatter charts.",
    semanticKind: "chart",
    schemaFields: ["title", "body[0]=dashboard context", "chart"],
  },
  {
    layoutId: "title-description-multi-chart-grid-bullets",
    slideIndex: 28,
    layoutName: "Title Description With Multi-Chart Grid + Bullets",
    layoutDescription:
      "A dashboard layout featuring a title and description, up to 4 bullet points, and 1-4 auto-arranged charts in a responsive grid. Supports bar, line, area, pie, donut, and scatter charts.",
    semanticKind: "chart",
    schemaFields: ["title", "body[0]=dashboard context", "chart", "bullets[]"],
  },
  {
    layoutId: "title-description-multi-chart-grid-metrics",
    slideIndex: 27,
    layoutName: "Title Description With Multi-Chart Grid + Metrics",
    layoutDescription:
      "A dashboard layout featuring a title and description, up to 4 KPI metrics, and 1-6 auto-arranged charts in a responsive grid. Ideal for analytics overviews, KPI summaries, and performance dashboards.",
    semanticKind: "chart",
    schemaFields: ["title", "body[0]=dashboard context", "chart", "metrics[]"],
  },
  {
    layoutId: "title-description-three-columns-table",
    slideIndex: 12,
    layoutName: "Title Description With Three Column Table",
    layoutDescription:
      "A layout featuring split title and description at the top, followed by a three-column table with colored headers and vertical bullet point sections below each.",
    semanticKind: "table",
    schemaFields: ["title", "body[0]=summary", "table.columns", "table.rows"],
  },
  {
    layoutId: "timeline-alternating-cards-slide",
    slideIndex: 8,
    layoutName: "Horizontal Timeline With Cards",
    layoutDescription:
      "A visual timeline layout featuring centered title, horizontal dashed axis line, and 2-6 milestone cards alternating above and below the axis. Each card shows a date label and description with colored accent dots.",
    semanticKind: "timeline",
    schemaFields: ["title", "table.columns=[Year,Milestone,Impact]", "table.rows", "bullets[]"],
  },
  {
    layoutId: "team-slide",
    slideIndex: 25,
    layoutName: "Description With Photo Cards Grid",
    layoutDescription:
      "A two-section layout with title, accent line, and description on the left, paired with a 2x2 or flexible grid of 2-4 person cards on the right. Each card displays photo, name, position, and bio.",
    semanticKind: "team",
    schemaFields: ["title", "body[0]=team context", "bullets[]=Name: role and bio", "imagePrompt"],
  },
  {
    layoutId: "title-description-team-grid",
    slideIndex: 4,
    layoutName: "Title Description With Photo Row",
    layoutDescription:
      "A top-aligned layout featuring split title and description sections at the top, followed by a horizontal row of up to 4 person cards. Each card shows name, designation, square photo, and brief bio.",
    semanticKind: "team",
    schemaFields: ["title", "body[0]=team context", "bullets[]=Name: role and bio", "imagePrompt"],
  },
  {
    layoutId: "thank-you-contact-info-footer-image-slide-layout",
    slideIndex: 7,
    layoutName: "Centered Title With Contact And Footer Image",
    layoutDescription:
      "A conclusion slide featuring centered title with accent bar, description text on the left, contact information aligned right, and a full-width footer image.",
    semanticKind: "closing",
    schemaFields: ["title", "body[]=closing message and contact details", "imagePrompt"],
  },
] satisfies GenerationLayoutMetadata[];

const { text, rect, ellipse, line, svg, image, chart, table, slide } =
  createTemplateElements({
    fontFamily: SANS,
    defaultTextColor: INK,
    defaultBackground: BG,
    defaultLineColor: LINE,
    defaultChartColor: PRIMARY,
    defaultChartAxisColor: "D1D5DB",
    defaultChartLabelColor: SOFT_TEXT,
    defaultTableFill: CARD,
    defaultTableHeaderFill: PRIMARY,
    defaultTableStroke: LINE,
  });

function titleBlock(
  value: string,
  x = 0.55,
  y = 0.62,
  w = 4.8,
  centered = false,
  color = INK,
): SlideElement[] {
  return [
    text({
      x,
      y,
      w,
      h: 0.58,
      value,
      size: 24,
      color,
      bold: true,
      lineHeight: 1.05,
      align: centered ? "center" : "left",
    }),
    rect({
      x: centered ? x + w / 2 - 0.455 : x,
      y: y + 0.72,
      w: 0.91,
      h: 0.045,
      fill: PRIMARY,
    }),
  ];
}

function waveArt(color = PRIMARY) {
  return `<svg viewBox="0 0 1200 220" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 105 C300 165 590 40 900 105 C1050 135 1130 105 1200 100 V220 H0Z" fill="#${color}" opacity="0.18"/>
    <path d="M0 148 C250 80 520 195 820 132 C1010 92 1110 130 1200 145 V220 H0Z" fill="#${color}" opacity="0.1"/>
  </svg>`;
}

function iconMark(name: string) {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="#${PRIMARY}"/>
    <path d="M18 34 L28 44 L48 20" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="20" cy="20" r="4" fill="#FFFFFF" opacity="0.75"/>
    <title>${name}</title>
  </svg>`;
}

function dashboardBg() {
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#F8FAFC"/>
        <stop offset="0.55" stop-color="#FFFFFF"/>
        <stop offset="1" stop-color="#EEF2FF"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#dash)"/>
    <circle cx="1140" cy="62" r="260" fill="#DDD6FE" opacity="0.38"/>
    <circle cx="80" cy="680" r="235" fill="#CFFAFE" opacity="0.32"/>
  </svg>`;
}

function metricBlock(
  x: number,
  y: number,
  value: string,
  label: string,
): SlideElement[] {
  return [
    text({
      x,
      y,
      w: 1.95,
      h: 0.42,
      value,
      size: 26,
      color: MUTED,
      wrap: "none",
    }),
    ellipse({ x, y: y + 0.58, w: 0.09, h: 0.09, fill: PRIMARY }),
    text({
      x: x + 0.16,
      y: y + 0.53,
      w: 1.4,
      h: 0.18,
      value: label.toUpperCase(),
      size: 8,
      color: MUTED,
      wrap: "none",
    }),
  ];
}

function chartData(
  values: number[],
  colors = [PRIMARY, BLUE, CYAN, GREEN, ORANGE],
) {
  return values.map((value, index) => ({
    label: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"][index] ?? `P${index + 1}`,
    value,
    color: colors[index % colors.length],
  }));
}

function dashboardChartCard(
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  type: ChartElement["chartType"],
  data: ChartElement["data"],
): SlideElement[] {
  return [
    rect({
      x,
      y,
      w,
      h,
      fill: CARD,
      stroke: { color: LINE, width: 0.6 },
      r: 0.09,
      shadow: true,
    }),
    chart({
      x: x + 0.08,
      y: y + 0.08,
      w: w - 0.16,
      h: h - 0.16,
      title,
      type,
      data,
    }),
  ];
}

function personCard(
  x: number,
  y: number,
  w: number,
  name: string,
  role: string,
  bio: string,
  seed: number,
): SlideElement[] {
  return [
    text({
      x,
      y,
      w,
      h: 0.2,
      value: name,
      size: 10.2,
      color: "2B3A38",
      bold: true,
    }),
    text({
      x,
      y: y + 0.22,
      w,
      h: 0.2,
      value: role,
      size: 9.8,
      color: "A8ABA3",
    }),
    image({
      x,
      y: y + 0.58,
      w,
      h: w,
      src: REAL_IMAGES.headshots[(seed - 1) % REAL_IMAGES.headshots.length],
      name: `${name} photo`,
      r: 0.06,
    }),
    text({
      x,
      y: y + 0.58 + w + 0.17,
      w,
      h: 0.46,
      value: bio,
      size: 9,
      color: BLACK,
      lineHeight: 1.25,
    }),
  ];
}

const slides: Slide[] = [
  slide("Split Title With Text Card", [
    ...titleBlock("Key Insights & Learnings", 0.52, 2.14, 3.4),
    rect({
      x: 5.28,
      y: 1.48,
      w: 3.76,
      h: 2.7,
      fill: CARD,
      r: 0.08,
      shadow: true,
    }),
    text({
      x: 5.8,
      y: 2.0,
      w: 2.9,
      h: 0.62,
      value: "CONTENT + PAID SOCIAL COMBINATION DRIVES HIGHEST QUALITY LEADS",
      size: 12,
      color: PRIMARY,
      bold: true,
      lineHeight: 1.2,
    }),
    text({
      x: 5.8,
      y: 2.84,
      w: 2.9,
      h: 0.76,
      value:
        "Leads from integrated campaigns had 47% faster time-to-close and 28% higher average contract value.",
      size: 13,
      color: BLACK,
      lineHeight: 1.38,
    }),
  ]),

  slide("Title With Six Text Cards Grid", [
    ...titleBlock("Key Insights & Learnings", 0.5, 0.6, 5.9),
    ...[
      [
        "ENTERPRISE ABM DELIVERS 3.2X HIGHER CONVERSION RATES",
        "Account-based campaigns targeting enterprises.",
      ],
      [
        "CONTENT + PAID SOCIAL COMBINATION DRIVES HIGHEST",
        "Leads from integrated campaigns had 47% faster.",
      ],
      [
        "MOBILE OPTIMIZATION INCREASED MOBILE",
        "Landing page redesign focused on mobile.",
      ],
      [
        "ENTERPRISE ABM DELIVERS 3.2X HIGHER CONVERSION RATES",
        "Account-based campaigns targeting enterprises.",
      ],
      [
        "CONTENT + PAID SOCIAL COMBINATION DRIVES HIGHEST",
        "Leads from integrated campaigns had 47% faster.",
      ],
      [
        "MOBILE OPTIMIZATION INCREASED MOBILE",
        "Landing page redesign focused on mobile.",
      ],
    ].flatMap(([heading, body], index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 0.62 + col * 3.02;
      const y = 1.86 + row * 1.45;
      return [
        text({
          x,
          y,
          w: 2.55,
          h: 0.45,
          value: heading,
          size: 12,
          color: PRIMARY,
          bold: true,
          lineHeight: 1.12,
        }),
        text({
          x,
          y: y + 0.58,
          w: 2.55,
          h: 0.42,
          value: body,
          size: 13,
          color: BLACK,
          lineHeight: 1.18,
        }),
      ];
    }),
  ]),

  slide("Title With Full-Width Chart", [
    ...titleBlock("Spend & ROI Dashboard", 2.8, 0.42, 4.4, true),
    rect({
      x: 0.45,
      y: 1.48,
      w: 9.1,
      h: 3.62,
      fill: LINE,
      stroke: { color: LINE, width: 0.6 },
      r: 0.18,
    }),
    text({
      x: 3.8,
      y: 1.62,
      w: 2.4,
      h: 0.2,
      value: "Revenue   Spend",
      size: 9,
      color: INK,
      align: "center",
    }),
    chart({
      x: 0.72,
      y: 1.88,
      w: 8.56,
      h: 2.92,
      title: "Revenue vs Spend",
      type: "bar",
      data: chartData([520, 660, 985, 420, 690, 810]),
    }),
  ]),

  slide("Chart With Sidebar Metrics", [
    ...titleBlock("Spend & ROI Dashboard", 0.5, 0.45, 3.35),
    text({
      x: 4.55,
      y: 0.5,
      w: 4.55,
      h: 0.54,
      value:
        "Full-funnel performance is improving as spend shifts to channels with faster payback and higher conversion quality.",
      size: 10,
      color: BLACK,
      lineHeight: 1.35,
    }),
    rect({
      x: 0.5,
      y: 1.5,
      w: 5.35,
      h: 3.62,
      fill: LINE,
      stroke: { color: LINE, width: 0.6 },
      r: 0.12,
    }),
    chart({
      x: 0.7,
      y: 1.72,
      w: 4.95,
      h: 3.18,
      title: "Revenue vs Spend",
      type: "line",
      data: chartData([220, 420, 380, 610, 740, 880]),
    }),
    ...[
      ["$1.8M", "Total Planned"],
      ["$1.6M", "Total Actual"],
      ["4.8x", "ROAS"],
      ["28%", "Conversion"],
      ["8.4K", "MQLs"],
      ["342", "SQLs"],
    ].flatMap(([value, label], index) => {
      const x = 6.28 + (index % 2) * 1.75;
      const y = 1.72 + Math.floor(index / 2) * 1.12;
      return metricBlock(x, y, value, label);
    }),
  ]),

  slide("Title Description With Photo Row", [
    ...titleBlock("Our Team Members", 0.62, 0.65, 3.9),
    text({
      x: 5.15,
      y: 0.72,
      w: 3.92,
      h: 0.74,
      value:
        "Focus on companies with 500+ employees in Financial Services, Healthcare, and Technology sectors. Target high-quality pipeline through focused account-based campaigns.",
      size: 9,
      color: BLACK,
      lineHeight: 1.35,
    }),
    ...[
      [
        "Hannah Morales",
        "Founder & CEO",
        "Focus on enterprise growth and customer strategy.",
      ],
      [
        "James Wilson",
        "Head of Sales",
        "Owns pipeline development and revenue partnerships.",
      ],
      [
        "Helene Paquet",
        "Chief Tech Officer",
        "Leads technical strategy and product architecture.",
      ],
      [
        "Marcus Chen",
        "Creative Director",
        "Shapes brand systems and campaign storytelling.",
      ],
    ].flatMap(([name, role, bio], index) =>
      personCard(0.72 + index * 2.25, 2.0, 1.66, name, role, bio, index + 1),
    ),
  ]),

  slide("Three Column Category Cards", [
    ...titleBlock("Risks & Constraints", 0.5, 0.78, 4.1),
    ...[
      [
        "MARKET",
        "Market Saturation",
        "Increasing competition in key verticals may pressure conversion rates and CAC.",
      ],
      [
        "BUDGET",
        "Budget Constraints",
        "Q1 budget reduction of 15% may limit ability to scale successful campaigns.",
      ],
      [
        "CAPACITY",
        "Resource Capacity",
        "Content production team at 110% capacity may impact content velocity.",
      ],
    ].flatMap(([label, subtitle, body], index) => {
      const x = 0.55 + index * 3.1;
      return [
        text({
          x,
          y: 2.45,
          w: 2.4,
          h: 0.54,
          value: label,
          size: 29,
          color: MUTED,
          wrap: "none",
        }),
        ellipse({ x, y: 3.15, w: 0.12, h: 0.12, fill: PRIMARY }),
        text({
          x: x + 0.2,
          y: 3.07,
          w: 2.1,
          h: 0.26,
          value: subtitle,
          size: 10,
          color: MUTED,
        }),
        text({
          x,
          y: 3.55,
          w: 2.46,
          h: 0.96,
          value: body,
          size: 13,
          color: BLACK,
          lineHeight: 1.28,
        }),
      ];
    }),
  ]),

  slide("Metric With Funnel Bars", [
    ...titleBlock("Funnel Performance", 0.5, 0.36, 4.2),
    text({
      x: 0.82,
      y: 2.26,
      w: 2.1,
      h: 0.55,
      value: "0.24%",
      size: 39,
      color: MUTED,
      wrap: "none",
    }),
    text({
      x: 0.84,
      y: 3.06,
      w: 1.6,
      h: 0.55,
      value: "Overall\nVisit to Customer",
      size: 10,
      color: MUTED,
      lineHeight: 1.35,
    }),
    ...[
      ["Visitors", "124,500", "10%", 5.05],
      ["Leads", "12,450", "10%", 4.55],
      ["Marketing Qualified", "4,356", "35%", 3.9],
      ["Customers", "298", "6.8%", 3.25],
    ].flatMap(([label, value, rate, barW], index) => {
      const y = 1.35 + index * 0.82;
      return [
        rect({
          x: 3.82,
          y: y + 0.13,
          w: 1,
          h: 0.48,
          fill: CARD,
          stroke: { color: PRIMARY, width: 0.9 },
          r: 0.24,
          shadow: true,
        }),
        text({
          x: 3.9,
          y: y + 0.23,
          w: 0.84,
          h: 0.24,
          value: String(label),
          size: 8.4,
          color: BLACK,
          align: "center",
          valign: "middle",
        }),
        line({ x: 4.82, y: y + 0.37, w: 0.35, color: PRIMARY, width: 1.6 }),
        rect({ x: 5.16, y, w: Number(barW), h: 0.74, fill: PRIMARY }),
        text({
          x: 5.42,
          y: y + 0.24,
          w: 1.2,
          h: 0.24,
          value: String(value),
          size: 13,
          color: "FFFFFF",
          bold: true,
        }),
        text({
          x: 5.16 + Number(barW) - 1.0,
          y: y + 0.15,
          w: 0.74,
          h: 0.36,
          value: `Conversion\n${rate}`,
          size: 7.8,
          color: "FFFFFF",
          bold: true,
          align: "right",
          lineHeight: 1.15,
        }),
      ];
    }),
  ]),

  slide("Centered Title With Contact And Footer Image", [
    ...titleBlock("Thank you", 2.9, 0.58, 4.2, true),
    text({
      x: 0.52,
      y: 2.2,
      w: 4.05,
      h: 0.8,
      value:
        "Thanks for supporting our small business. To show our love, please enjoy 20% off your next order with the code CODE20.",
      size: 13,
      color: BLACK,
      lineHeight: 1.4,
    }),
    text({
      x: 6.32,
      y: 1.86,
      w: 3.1,
      h: 0.32,
      value: "Contact Us",
      size: 16,
      color: PRIMARY,
      align: "right",
    }),
    text({
      x: 6.32,
      y: 2.32,
      w: 3.1,
      h: 0.86,
      value: "+977-98000000\npresenton@gmail.com\nwww.presenton.com",
      size: 12,
      color: "324712",
      align: "right",
      lineHeight: 1.45,
    }),
    line({ x: 0.5, y: 3.22, w: 4.38, color: "D3CFCF", width: 0.7 }),
    image({
      x: 0.5,
      y: 3.25,
      w: 9.0,
      h: 2.16,
      src: REAL_IMAGES.placeholder,
      name: "Footer image",
      r: 0,
    }),
  ]),

  slide("Horizontal Timeline With Cards", [
    ...titleBlock("Timeline", 2.95, 0.55, 4.1, true),
    line({ x: 0.78, y: 3.23, w: 8.45, color: BLACK, width: 0.8, dash: [3, 3] }),
    ...["2017", "2018", "2019", "2020", "2021", "2022"].flatMap(
      (year, index) => {
        const x = 0.72 + index * 1.45;
        const top = index % 2 === 0;
        const y = top ? 1.9 : 3.55;
        return [
          rect({ x, y, w: 1.35, h: 1.08, fill: LINE, r: 0.1 }),
          text({
            x: x + 0.18,
            y: y + 0.22,
            w: 0.98,
            h: 0.22,
            value: year,
            size: 11,
            color: BLACK,
            align: "center",
          }),
          text({
            x: x + 0.12,
            y: y + 0.53,
            w: 1.1,
            h: 0.38,
            value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            size: 6.6,
            color: BLACK,
            align: "center",
            lineHeight: 1.25,
          }),
          top
            ? ellipse({
                x: x + 0.47,
                y: 3.04,
                w: 0.36,
                h: 0.36,
                fill: BG,
                stroke: { color: "707070", width: 1.2 },
              })
            : ellipse({
                x: x + 0.58,
                y: 3.14,
                w: 0.18,
                h: 0.18,
                fill: [ORANGE, AMBER, "FF914D"][index % 3],
                stroke: { color: BLACK, width: 0.4 },
              }),
        ];
      },
    ),
  ]),

  slide("Three Columns With Index Numbers", [
    ...titleBlock("Target Audience Breakdown", 0.58, 0.58, 5.2),
    ...[
      [
        "01",
        "C-Suite Executives",
        "KEY NEED",
        "Strategic growth & competitive advantage",
        "PRIMARY CHANNEL",
        "LinkedIn, executive events",
      ],
      [
        "02",
        "VP of Operations",
        "KEY NEED",
        "Efficiency & cost optimization",
        "PRIMARY CHANNEL",
        "Industry publications, webinars",
      ],
      [
        "03",
        "Technical Leaders",
        "KEY NEED",
        "Integration capabilities & security",
        "PRIMARY CHANNEL",
        "Technical content, product demos",
      ],
    ].flatMap(
      ([num, heading, labelOne, contentOne, labelTwo, contentTwo], index) => {
        const x = 0.65 + index * 3.0;
        return [
          text({
            x,
            y: 1.95,
            w: 1.3,
            h: 0.68,
            value: num,
            size: 48,
            color: PRIMARY,
            wrap: "none",
          }),
          text({
            x,
            y: 2.68,
            w: 2.25,
            h: 0.5,
            value: heading,
            size: 16,
            color: BLACK,
            lineHeight: 1.1,
          }),
          text({
            x,
            y: 3.42,
            w: 1.6,
            h: 0.22,
            value: labelOne,
            size: 11,
            color: "737373",
          }),
          text({
            x,
            y: 3.74,
            w: 2.2,
            h: 0.4,
            value: contentOne,
            size: 13,
            color: BLACK,
            lineHeight: 1.18,
          }),
          text({
            x,
            y: 4.42,
            w: 1.7,
            h: 0.22,
            value: labelTwo,
            size: 11,
            color: "737373",
          }),
          text({
            x,
            y: 4.73,
            w: 2.2,
            h: 0.38,
            value: contentTwo,
            size: 13,
            color: BLACK,
            lineHeight: 1.18,
          }),
        ];
      },
    ),
  ]),

  slide("Text Block With Progress Metric Cards", [
    ...titleBlock("Business Objective & KPIs", 0.4, 1.02, 4.15),
    text({
      x: 0.42,
      y: 2.02,
      w: 3.9,
      h: 0.46,
      value:
        "Accelerate enterprise customer acquisition across EMEA and North America",
      size: 12,
      color: BLACK,
      bold: true,
      lineHeight: 1.22,
    }),
    text({
      x: 0.42,
      y: 2.7,
      w: 3.88,
      h: 0.72,
      value:
        "Focus on companies with 500+ employees in Financial Services, Healthcare, and Technology sectors. Target $3.5M in new pipeline with sub-$150 CAC.",
      size: 9,
      color: BLACK,
      lineHeight: 1.35,
      opacity: 0.82,
    }),
    rect({ x: 5.0, y: 0, w: 5.0, h: 5.625, fill: PANEL }),
    ...[
      ["Pipeline Generated", "$4.2M", "Target", "$3.5M", 85],
      ["Marketing Qualified Leads", "8,420", "Target", "6,250", 75],
      ["Return on Ad Spend", "4.8X", "Target", "4.0x", 80],
      ["Pipeline Generated", "$4.2M", "Target", "$3.5M", 85],
      ["Marketing Qualified Leads", "8,420", "Target", "6,250", 75],
    ].flatMap(([name, value, target, targetValue, progress], index) => {
      const col = index < 2 ? 0 : 1;
      const row = index < 2 ? index : index - 2;
      const x = col === 0 ? 5.22 : 7.55;
      const y = 0.54 + row * 1.52;
      const progressText = `${progress}%`;
      return [
        rect({
          x,
          y,
          w: 2.15,
          h: 1.24,
          fill: CARD,
          stroke: { color: LINE, width: 0.7 },
          r: 0.1,
          shadow: true,
        }),
        rect({ x, y, w: 2.15, h: 0.48, fill: PRIMARY, r: 0.1 }),
        text({
          x: x + 0.16,
          y: y + 0.14,
          w: 1.05,
          h: 0.22,
          value: String(name),
          size: 8.7,
          color: "FFFFFF",
        }),
        text({
          x: x + 1.25,
          y: y + 0.09,
          w: 0.72,
          h: 0.3,
          value: String(value),
          size: 14,
          color: "FFFFFF",
          bold: true,
          align: "right",
        }),
        text({
          x: x + 0.18,
          y: y + 0.7,
          w: 0.8,
          h: 0.2,
          value: String(target),
          size: 8.7,
          color: "514E7D",
        }),
        text({
          x: x + 0.18,
          y: y + 0.94,
          w: 0.82,
          h: 0.24,
          value: String(targetValue),
          size: 12,
          color: "322C23",
          bold: true,
        }),
        svg({
          x: x + 1.16,
          y: y + 0.64,
          w: 0.78,
          h: 0.46,
          name: `${name} progress`,
          markup: `<svg viewBox="0 0 100 55" xmlns="http://www.w3.org/2000/svg"><path d="M12 48 A38 38 0 0 1 88 48" fill="none" stroke="#E6EAF1" stroke-width="14" stroke-linecap="round"/><path d="M12 48 A38 38 0 0 1 ${12 + Number(progress) * 0.76} ${48 - Math.sin((Number(progress) / 100) * Math.PI) * 38}" fill="none" stroke="#${index > 1 ? "FF5400" : PRIMARY}" stroke-width="14" stroke-linecap="round"/></svg>`,
        }),
        text({
          x: x + 1.32,
          y: y + 1.04,
          w: 0.44,
          h: 0.16,
          value: progressText,
          size: 6.5,
          color: SOFT_TEXT,
          align: "center",
        }),
      ];
    }),
  ]),

  slide("Left-Aligned Text On Background Image", [
    image({
      x: 0,
      y: 0,
      w: 10,
      h: 5.625,
      src: REAL_IMAGES.quoteLandscape,
      name: "Quote background",
      r: 0,
    }),
    rect({ x: 0, y: 0, w: 10, h: 5.625, fill: "000000", opacity: 0.5 }),
    ...titleBlock("Word of Wisdom", 0.7, 1.24, 4.2, false, "FFFFFF"),
    text({
      x: 0.7,
      y: 2.25,
      w: 8.4,
      h: 1.45,
      value:
        '"Success is not final, failure is not fatal: it is the courage to continue that counts. The future belongs to those who believe in the beauty of their dreams."',
      size: 15.5,
      color: "FFFFFF",
      lineHeight: 1.78,
    }),
    text({
      x: 0.7,
      y: 4.05,
      w: 4.0,
      h: 0.32,
      value: "-Winston Churchill",
      size: 15.5,
      color: "FFFFFF",
    }),
  ]),

  slide("Title Description With Three Column Table", [
    ...titleBlock("Go-to-Market Strategy", 0.48, 0.55, 4.1),
    text({
      x: 5.28,
      y: 0.62,
      w: 4.0,
      h: 0.74,
      value:
        "Focus on companies with 500+ employees in Financial Services, Healthcare, and Technology sectors. Target $3.5M in new pipeline with sub-$150 CAC.",
      size: 9,
      color: BLACK,
      lineHeight: 1.42,
    }),
    table({
      x: 0.5,
      y: 2.18,
      w: 9.0,
      h: 2.45,
      columns: ["Paid Channels", "Organic Channels", "Partnerships"],
      rows: [
        [
          "LinkedIn Ads: ABM",
          "SEO: Thought Leadership",
          "Events: Network Building",
        ],
        ["Google Ads: Intent", "Content: Education", "Co-Marketing: Reach"],
        ["Display: Awareness", "Social: Community", "Referrals: Trust"],
      ],
      fontSize: 10.5,
    }),
    ellipse({ x: 7.5, y: 2.8, w: 0.12, h: 0.12, fill: PRIMARY, opacity: 0.1 }),
  ]),

  slide("Two Section Text With Highlight Card", [
    ...titleBlock("Customer Proof / Case Snapshot", 0.48, 0.45, 5.7),
    text({
      x: 0.48,
      y: 1.66,
      w: 1.5,
      h: 0.24,
      value: "CHALLENGE",
      size: 11,
      color: "737373",
    }),
    text({
      x: 0.48,
      y: 1.98,
      w: 4.0,
      h: 0.78,
      value:
        "Fragmented marketing operations across 12 regions leading to inefficient spend allocation and inconsistent messaging. CAC increased 43% YoY.",
      size: 13,
      color: BLACK,
      lineHeight: 1.38,
    }),
    text({
      x: 0.48,
      y: 3.05,
      w: 1.4,
      h: 0.24,
      value: "OUTCOME",
      size: 11,
      color: "737373",
    }),
    ...[
      "34% reduction in CAC within 6 months",
      "Unified operations across all regions",
      "$4.2M additional pipeline generated",
    ].map((item, index) =>
      text({
        x: 0.48,
        y: 3.4 + index * 0.32,
        w: 4.1,
        h: 0.24,
        value: `${index + 1}. ${item}`,
        size: 13,
        color: BLACK,
      }),
    ),
    rect({
      x: 5.62,
      y: 1.42,
      w: 3.35,
      h: 2.75,
      fill: CARD,
      r: 0.12,
      shadow: true,
    }),
    text({
      x: 5.95,
      y: 1.82,
      w: 2.5,
      h: 0.35,
      value: "TechCorp Global",
      size: 16,
      color: BLACK,
      bold: true,
    }),
    text({
      x: 5.95,
      y: 2.2,
      w: 2.2,
      h: 0.22,
      value: "Fortune 500 Technology Company",
      size: 8.4,
      color: BLACK,
    }),
    ellipse({ x: 5.95, y: 2.9, w: 0.44, h: 0.44, fill: PRIMARY }),
    svg({
      x: 6.05,
      y: 3.0,
      w: 0.24,
      h: 0.24,
      markup: iconMark("Metric"),
      name: "Metric icon",
    }),
    text({
      x: 6.55,
      y: 2.8,
      w: 1.45,
      h: 0.62,
      value: "$4.2M",
      size: 39,
      color: MUTED,
      wrap: "none",
    }),
    text({
      x: 6.58,
      y: 3.48,
      w: 1.35,
      h: 0.38,
      value: "incremental pipeline in Q4",
      size: 10,
      color: MUTED,
      lineHeight: 1.2,
    }),
  ]),

  slide("Metric Cards Grid", [
    ...titleBlock("Campaign Performance Snapshot", 2.25, 0.5, 5.5, true),
    ...[
      ["342 SQLs", "Enterprise ABM Launch", "28% CONVERSION RATE", false],
      ["$1.8M pipeline", "Product Feature Release", "4.7X ROAS", false],
      ["156 Deals", "Industry Summit Sponsorship", "42% MEETING RATE", true],
      ["4.8x ROI", "Paid Search Retargeting", "31% LOWER CAC", false],
      ["342 SQLs", "Enterprise ABM Launch", "28% CONVERSION RATE", false],
      ["$1.8M pipeline", "Product Feature Release", "4.7X ROAS", false],
      ["156 Deals", "Industry Summit Sponsorship", "42% MEETING RATE", false],
      ["4.8x ROI", "Paid Search Retargeting", "31% LOWER CAC", false],
    ].flatMap(([metric, label, subtext, highlighted], index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 0.56 + col * 2.26;
      const y = 1.7 + row * 1.54;
      const isHigh = Boolean(highlighted);
      return [
        ...(isHigh
          ? [
              rect({
                x: x - 0.1,
                y: y - 0.16,
                w: 2.08,
                h: 1.3,
                fill: PRIMARY,
                r: 0.12,
              }),
            ]
          : []),
        text({
          x,
          y,
          w: 1.8,
          h: 0.34,
          value: String(metric),
          size: 16,
          color: isHigh ? "FFFFFF" : INK,
        }),
        text({
          x,
          y: y + 0.48,
          w: 1.66,
          h: 0.38,
          value: String(label),
          size: 10,
          color: isHigh ? "FFFFFF" : INK,
          lineHeight: 1.15,
        }),
        text({
          x,
          y: y + 1.03,
          w: 1.66,
          h: 0.2,
          value: String(subtext),
          size: 7.4,
          color: isHigh ? "FFFFFF" : INK,
        }),
      ];
    }),
  ]),

  slide("Numbered List With Side Metrics", [
    ...titleBlock("Executive Summary", 0.7, 0.72, 3.7),
    ...[
      "Exceeded revenue target by 12%, driven by paid search and email campaigns.",
      "Marketing influenced 68% of total pipeline value, up from 52% last quarter.",
      "Paid Search ROI improved to 5.8x, making it our most efficient channel.",
      "Enterprise ABM delivered 3.2x higher conversion rates.",
      "Mobile landing pages lifted demo requests by 24%.",
    ].map((item, index) =>
      text({
        x: 0.7,
        y: 1.92 + index * 0.48,
        w: 5.3,
        h: 0.32,
        value: `${index + 1}. ${item}`,
        size: 9,
        color: index === 0 ? BLACK : MUTED,
        lineHeight: 1.4,
      }),
    ),
    ...[
      ["8,450", "Leads"],
      ["2,680", "MQLs"],
      ["$2.4M", "Revenue"],
    ].flatMap(([value, label], index) =>
      metricBlock(6.7, 1.05 + index * 1.32, value, label),
    ),
  ]),

  slide("Title Description With Image", [
    ...titleBlock("Executive Summary", 0.7, 1.72, 3.9),
    text({
      x: 0.7,
      y: 2.72,
      w: 4.0,
      h: 0.86,
      value:
        "Focus on companies with 500+ employees in Financial Services, Healthcare, and Technology sectors. Target $3.5M in new pipeline with sub-$150 CAC through account-based marketing and content-led strategies.",
      size: 9,
      color: BLACK,
      lineHeight: 1.6,
    }),
    image({
      x: 6.15,
      y: 1.42,
      w: 2.95,
      h: 2.73,
      src: REAL_IMAGES.collaboration,
      name: "Supporting image",
      r: 0.24,
      shadow: true,
    }),
  ]),

  slide("Title Description With Two Images", [
    ...titleBlock("Executive Summary", 0.7, 1.6, 3.8),
    text({
      x: 0.7,
      y: 2.65,
      w: 4.0,
      h: 0.78,
      value:
        "Focus on companies with 500+ employees in Financial Services, Healthcare, and Technology sectors. Target $3.5M in new pipeline with sub-$150 CAC.",
      size: 9,
      color: BLACK,
      lineHeight: 1.6,
    }),
    rect({
      x: 5.68,
      y: 0.82,
      w: 2.95,
      h: 2.95,
      fill: INK,
      r: 0.24,
      shadow: true,
    }),
    image({
      x: 5.72,
      y: 0.86,
      w: 2.87,
      h: 2.87,
      src: REAL_IMAGES.collaboration,
      name: "Top image",
      r: 0.24,
    }),
    rect({
      x: 6.98,
      y: 2.18,
      w: 2.95,
      h: 2.95,
      fill: INK,
      r: 0.24,
      shadow: true,
    }),
    image({
      x: 7.02,
      y: 2.22,
      w: 2.87,
      h: 2.87,
      src: REAL_IMAGES.analytics,
      name: "Bottom image",
      r: 0.24,
    }),
  ]),

  slide("Icon Bullet Grid With Image", [
    svg({
      x: 0,
      y: 0,
      w: 1.25,
      h: 5.625,
      markup: waveArt(),
      name: "Left wave",
      opacity: 0.5,
    }),
    text({
      x: 0.62,
      y: 0.62,
      w: 3.2,
      h: 0.54,
      value: "Solutions",
      size: 24,
      color: INK,
      bold: true,
    }),
    ...[
      [
        "Custom Software",
        "Tailored software to optimize processes and boost efficiency.",
      ],
      [
        "Digital Consulting",
        "Guidance for organizations leveraging modern technologies.",
      ],
      [
        "Support Services",
        "Ongoing support to adapt and maintain performance.",
      ],
    ].flatMap(([title, subtitle], index) => {
      const x = 0.72 + (index % 2) * 2.65;
      const y = 1.62 + Math.floor(index / 2) * 1.22;
      return [
        ellipse({ x, y, w: 0.38, h: 0.38, fill: PRIMARY }),
        svg({
          x: x + 0.08,
          y: y + 0.08,
          w: 0.22,
          h: 0.22,
          markup: iconMark(title),
          name: `${title} icon`,
        }),
        text({
          x: x + 0.52,
          y: y,
          w: 1.68,
          h: 0.24,
          value: title,
          size: 12,
          color: INK,
          bold: true,
        }),
        text({
          x: x + 0.52,
          y: y + 0.32,
          w: 1.72,
          h: 0.44,
          value: subtitle,
          size: 8,
          color: MUTED,
          lineHeight: 1.25,
        }),
      ];
    }),
    image({
      x: 6.42,
      y: 1.42,
      w: 2.82,
      h: 2.5,
      src: REAL_IMAGES.collaboration,
      name: "Solutions image",
      r: 0.16,
      shadow: true,
    }),
    svg({
      x: 8.75,
      y: 0.82,
      w: 0.28,
      h: 0.28,
      markup: iconMark("Sparkle"),
      name: "Sparkle",
    }),
  ]),

  slide("Image With Icon Bullets", [
    text({
      x: 0.62,
      y: 0.48,
      w: 3.2,
      h: 0.54,
      value: "Problem",
      size: 24,
      color: INK,
      bold: true,
    }),
    image({
      x: 0.72,
      y: 1.25,
      w: 4.12,
      h: 3.3,
      src: REAL_IMAGES.collaboration,
      name: "Problem image",
      r: 0.16,
      shadow: true,
    }),
    text({
      x: 5.55,
      y: 1.42,
      w: 3.65,
      h: 0.5,
      value:
        "Businesses face challenges with outdated technology and rising costs, limiting efficiency and growth in competitive markets.",
      size: 10,
      color: MUTED,
      lineHeight: 1.35,
    }),
    ...[
      [
        "Inefficiency",
        "Digital tools fail to match needs, causing operational slowdowns.",
      ],
      [
        "High Costs",
        "Outdated systems increase expenses and limit market reach.",
      ],
    ].flatMap(([title, body], index) => {
      const y = 2.35 + index * 1.05;
      return [
        rect({
          x: 5.55,
          y,
          w: 0.42,
          h: 0.42,
          fill: PRIMARY,
          r: 0.08,
          shadow: true,
        }),
        svg({
          x: 5.66,
          y: y + 0.1,
          w: 0.22,
          h: 0.22,
          markup: iconMark(title),
          name: `${title} icon`,
        }),
        text({
          x: 6.15,
          y,
          w: 2.2,
          h: 0.24,
          value: title,
          size: 12,
          color: INK,
          bold: true,
        }),
        rect({ x: 6.15, y: y + 0.35, w: 0.38, h: 0.02, fill: PRIMARY }),
        text({
          x: 6.15,
          y: y + 0.5,
          w: 2.65,
          h: 0.38,
          value: body,
          size: 9,
          color: MUTED,
          lineHeight: 1.3,
        }),
      ];
    }),
  ]),

  slide("Chart With Bullet Cards", [
    text({
      x: 0.62,
      y: 0.42,
      w: 3.2,
      h: 0.52,
      value: "Market Size",
      size: 24,
      color: INK,
      bold: true,
    }),
    text({
      x: 0.62,
      y: 1.05,
      w: 4.65,
      h: 0.45,
      value:
        "Businesses face challenges with outdated technology and rising costs, limiting efficiency and growth in competitive markets.",
      size: 9.5,
      color: MUTED,
      lineHeight: 1.35,
    }),
    rect({
      x: 0.62,
      y: 1.72,
      w: 5.7,
      h: 3.32,
      fill: CARD,
      stroke: { color: LINE, width: 0.7 },
      r: 0.08,
      shadow: true,
    }),
    chart({
      x: 0.78,
      y: 1.88,
      w: 5.38,
      h: 3.0,
      title: "Market Growth",
      type: "bar",
      data: chartData([45, 72, 58, 89]),
    }),
    ...[
      [
        "Total Addressable Market",
        "Companies can use TAM to plan expansion and investment.",
      ],
      [
        "Serviceable Available Market",
        "More measurable market segments for focused sales efforts.",
      ],
      [
        "Serviceable Obtainable Market",
        "Plan development strategies according to market reach.",
      ],
    ].flatMap(([title, body], index) => {
      const y = 1.25 + index * 1.25;
      return [
        rect({ x: 6.72, y, w: 2.55, h: 1.0, fill: PRIMARY, r: 0.14 }),
        rect({
          x: 6.92,
          y: y + 0.2,
          w: 0.26,
          h: 0.26,
          fill: PRIMARY_DARK,
          r: 0.05,
        }),
        svg({
          x: 6.97,
          y: y + 0.25,
          w: 0.16,
          h: 0.16,
          markup: iconMark(title),
          name: `${title} icon`,
        }),
        text({
          x: 7.3,
          y: y + 0.15,
          w: 1.55,
          h: 0.25,
          value: title,
          size: 10,
          color: "FFFFFF",
          bold: true,
        }),
        text({
          x: 6.95,
          y: y + 0.52,
          w: 2.0,
          h: 0.35,
          value: body,
          size: 7.8,
          color: "FFFFFF",
          lineHeight: 1.22,
          opacity: 0.92,
        }),
      ];
    }),
  ]),

  slide("Image With Title And Metrics", [
    svg({
      x: 0,
      y: 4.1,
      w: 2.2,
      h: 1.4,
      markup: waveArt(),
      name: "Bottom wave",
      opacity: 0.5,
    }),
    image({
      x: 0.62,
      y: 1.1,
      w: 4.15,
      h: 3.0,
      src: REAL_IMAGES.analytics,
      name: "Analytics image",
      r: 0.16,
      shadow: true,
    }),
    text({
      x: 5.55,
      y: 1.28,
      w: 3.2,
      h: 0.65,
      value: "Competitive Advantage",
      size: 24,
      color: INK,
      bold: true,
      lineHeight: 1.08,
    }),
    text({
      x: 5.55,
      y: 2.08,
      w: 3.55,
      h: 0.7,
      value:
        "Ginyard International Co. stands out by offering custom digital solutions tailored for client needs, alongside long-term support.",
      size: 10,
      color: MUTED,
      lineHeight: 1.35,
    }),
    text({
      x: 5.8,
      y: 3.32,
      w: 1.45,
      h: 0.2,
      value: "Satisfied Clients",
      size: 8.5,
      color: MUTED,
      align: "center",
    }),
    text({
      x: 5.86,
      y: 3.6,
      w: 1.3,
      h: 0.48,
      value: "200+",
      size: 27,
      color: PRIMARY,
      bold: true,
      align: "center",
    }),
    text({
      x: 7.38,
      y: 3.32,
      w: 1.55,
      h: 0.2,
      value: "Client Retention Rate",
      size: 8.5,
      color: MUTED,
      align: "center",
    }),
    text({
      x: 7.58,
      y: 3.6,
      w: 1.15,
      h: 0.48,
      value: "95%",
      size: 27,
      color: PRIMARY,
      bold: true,
      align: "center",
    }),
  ]),

  slide("Title Image With Numbered Points", [
    text({
      x: 0.62,
      y: 0.55,
      w: 4.0,
      h: 0.52,
      value: "Market Validation",
      size: 24,
      color: INK,
      bold: true,
    }),
    rect({ x: 0.62, y: 1.2, w: 0.75, h: 0.035, fill: PRIMARY }),
    image({
      x: 6.8,
      y: 0.55,
      w: 2.5,
      h: 1.5,
      src: REAL_IMAGES.collaboration,
      name: "Market image",
      r: 0.08,
      shadow: true,
    }),
    ...[
      [
        "Customer Insights",
        "Surveys reveal that 78% of businesses are planning to invest in digital solutions.",
      ],
      [
        "Pilot Program Success",
        "The survey revealed that 85% prefer a tailored digital approach.",
      ],
      [
        "Expansion Signals",
        "Early adopters are asking for deeper integrations and reporting workflows.",
      ],
    ].flatMap(([title, body], index) => {
      const x = 0.78 + (index % 2) * 4.5;
      const y = 2.58 + Math.floor(index / 2) * 1.1;
      return [
        text({
          x,
          y,
          w: 0.72,
          h: 0.42,
          value: String(index + 1).padStart(2, "0"),
          size: 26,
          color: INK,
          bold: true,
          wrap: "none",
        }),
        text({
          x: x + 0.9,
          y: y + 0.05,
          w: 2.6,
          h: 0.28,
          value: title,
          size: 14,
          color: INK,
          bold: true,
        }),
        text({
          x: x + 0.9,
          y: y + 0.48,
          w: 3.0,
          h: 0.38,
          value: body,
          size: 9,
          color: MUTED,
          lineHeight: 1.3,
        }),
      ];
    }),
    svg({
      x: 0,
      y: 4.92,
      w: 10,
      h: 0.68,
      markup: waveArt(),
      name: "Bottom wave",
      opacity: 0.8,
    }),
  ]),

  slide("Centered Text On Image Overlay", [
    image({
      x: 0,
      y: 0,
      w: 10,
      h: 5.625,
      src: REAL_IMAGES.quoteMountain,
      name: "Centered quote background",
      r: 0,
    }),
    rect({ x: 0, y: 0, w: 10, h: 5.625, fill: "000000", opacity: 0.5 }),
    text({
      x: 2.85,
      y: 1.06,
      w: 4.3,
      h: 0.5,
      value: "Words of Wisdom",
      size: 27,
      color: "FFFFFF",
      bold: true,
      align: "center",
    }),
    rect({ x: 4.7, y: 1.76, w: 0.62, h: 0.04, fill: PRIMARY }),
    text({
      x: 4.58,
      y: 2.02,
      w: 0.85,
      h: 0.6,
      value: '"',
      size: 52,
      color: PRIMARY,
      align: "center",
      opacity: 0.85,
    }),
    text({
      x: 1.65,
      y: 2.72,
      w: 6.7,
      h: 0.82,
      value:
        '"Success is not final, failure is not fatal: it is the courage to continue that counts."',
      size: 17,
      color: "FFFFFF",
      italic: true,
      align: "center",
      lineHeight: 1.3,
    }),
    line({ x: 3.48, y: 4.05, w: 0.5, color: PRIMARY, width: 1 }),
    text({
      x: 4.08,
      y: 3.95,
      w: 1.82,
      h: 0.25,
      value: "Winston Churchill",
      size: 10.5,
      color: "FFFFFF",
      bold: true,
      align: "center",
    }),
    line({ x: 5.98, y: 4.05, w: 0.5, color: PRIMARY, width: 1 }),
  ]),

  slide("Split Title With Two Column Numbered List", [
    text({
      x: 0.7,
      y: 1.7,
      w: 3.2,
      h: 1.02,
      value: "Table\nof Content",
      size: 24,
      color: INK,
      bold: true,
      lineHeight: 1.05,
    }),
    rect({ x: 0.7, y: 2.86, w: 0.91, h: 0.045, fill: PRIMARY }),
    ...[
      "Introduction",
      "Key Findings",
      "Data Analysis",
      "Recommendations",
      "Conclusion",
      "Introduction",
      "Key Findings",
      "Data Analysis",
      "Recommendations",
      "Conclusion",
    ].flatMap((label, index) => {
      const col = index < 5 ? 0 : 1;
      const row = index % 5;
      const x = 4.55 + col * 2.45;
      const y = 0.95 + row * 0.78;
      return [
        ellipse({ x, y, w: 0.4, h: 0.4, fill: PRIMARY_DARK }),
        text({
          x,
          y: y + 0.08,
          w: 0.4,
          h: 0.18,
          value: `${index + 1}`,
          size: 10.8,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
        }),
        text({
          x: x + 0.58,
          y: y + 0.09,
          w: 1.6,
          h: 0.22,
          value: label,
          size: 11.5,
          color: "18181B",
          wrap: "none",
        }),
      ];
    }),
  ]),

  slide("Description With Photo Cards Grid", [
    svg({
      x: 0,
      y: 4.55,
      w: 2.6,
      h: 0.95,
      markup: waveArt(),
      name: "Team wave",
      opacity: 0.55,
    }),
    ...titleBlock("Our Team Members", 0.62, 1.58, 3.2),
    text({
      x: 0.62,
      y: 2.65,
      w: 3.55,
      h: 0.82,
      value:
        "Ginyard International Co. is a leading provider of innovative digital solutions tailored for businesses.",
      size: 10,
      color: MUTED,
      lineHeight: 1.35,
    }),
    ...[
      [
        "Juliana Silva",
        "CEO",
        "Strategic leader with 15+ years in digital transformation.",
      ],
      [
        "Daniel Gallego",
        "CTO",
        "Technology expert specializing in scalable solutions.",
      ],
      [
        "Ketut Susilo",
        "COO",
        "Operations leader focused on process optimization.",
      ],
      [
        "Anna Robertson",
        "CMO",
        "Marketing strategist for brand and engagement.",
      ],
    ].flatMap(([name, role, bio], index) => {
      const x = 5.1 + (index % 2) * 2.05;
      const y = 0.92 + Math.floor(index / 2) * 2.05;
      return [
        image({
          x: x + 0.3,
          y,
          w: 1.0,
          h: 1.0,
          src: REAL_IMAGES.headshots[index % REAL_IMAGES.headshots.length],
          name: `${name} headshot`,
          r: 0.08,
        }),
        text({
          x,
          y: y + 1.18,
          w: 1.6,
          h: 0.22,
          value: name,
          size: 10,
          color: INK,
          bold: true,
          align: "center",
        }),
        text({
          x,
          y: y + 1.43,
          w: 1.6,
          h: 0.18,
          value: role,
          size: 8,
          color: MUTED,
          italic: true,
          align: "center",
        }),
        text({
          x,
          y: y + 1.66,
          w: 1.6,
          h: 0.34,
          value: bio,
          size: 7.2,
          color: MUTED,
          align: "center",
          lineHeight: 1.2,
        }),
      ];
    }),
  ]),

  slide("Title Description With Multi-Chart Grid", [
    svg({
      x: 0,
      y: 0,
      w: 10,
      h: 5.625,
      markup: dashboardBg(),
      name: "Dashboard background",
    }),
    text({
      x: 0.42,
      y: 0.34,
      w: 4.8,
      h: 0.42,
      value: "Data Analytics Dashboard",
      size: 24,
      color: INK,
      bold: true,
    }),
    rect({ x: 0.42, y: 0.9, w: 0.5, h: 0.04, fill: PRIMARY, r: 0.02 }),
    text({
      x: 0.42,
      y: 1.08,
      w: 5.2,
      h: 0.3,
      value:
        "Comprehensive overview of key metrics and performance indicators across multiple data dimensions.",
      size: 9,
      color: SOFT_TEXT,
    }),
    ...dashboardChartCard(
      0.42,
      1.68,
      2.86,
      1.6,
      "Revenue by Quarter",
      "bar",
      chartData([125, 158, 142, 189]),
    ),
    ...dashboardChartCard(
      3.58,
      1.68,
      2.86,
      1.6,
      "Market Distribution",
      "donut",
      [
        { label: "NA", value: 35, color: PRIMARY },
        { label: "EU", value: 28, color: CYAN },
        { label: "APAC", value: 25, color: GREEN },
        { label: "Other", value: 12, color: ORANGE },
      ],
    ),
    ...dashboardChartCard(
      6.74,
      1.68,
      2.86,
      1.6,
      "Growth Trend",
      "line",
      chartData([30, 45, 52, 48, 67, 82]),
    ),
    ...dashboardChartCard(
      0.42,
      3.55,
      2.86,
      1.6,
      "Department Performance",
      "bar",
      chartData([87, 72, 95, 68]),
    ),
    ...dashboardChartCard(
      3.58,
      3.55,
      2.86,
      1.6,
      "Product Comparison",
      "bar",
      chartData([45, 58, 72, 65]),
    ),
    ...dashboardChartCard(
      6.74,
      3.55,
      2.86,
      1.6,
      "Customer Feedback",
      "donut",
      chartData([78, 65, 42]),
    ),
  ]),

  slide("Title Description With Multi-Chart Grid + Metrics", [
    svg({
      x: 0,
      y: 0,
      w: 10,
      h: 5.625,
      markup: dashboardBg(),
      name: "Dashboard background",
    }),
    text({
      x: 0.42,
      y: 0.34,
      w: 4.8,
      h: 0.42,
      value: "Data Analytics Dashboard",
      size: 24,
      color: INK,
      bold: true,
    }),
    rect({ x: 0.42, y: 0.9, w: 0.5, h: 0.04, fill: PRIMARY, r: 0.02 }),
    text({
      x: 0.42,
      y: 1.08,
      w: 5.2,
      h: 0.3,
      value:
        "Comprehensive overview of key metrics and performance indicators across multiple data dimensions.",
      size: 9,
      color: SOFT_TEXT,
    }),
    ...[
      ["$3.5M", "Pipeline"],
      ["28%", "Conversion"],
      ["1.9x", "ROI"],
      ["42", "Accounts"],
    ].flatMap(([value, label], index) => [
      rect({
        x: 0.42 + index * 2.18,
        y: 1.48,
        w: 1.92,
        h: 0.58,
        fill: CARD,
        stroke: { color: LINE, width: 0.7 },
        r: 0.07,
        shadow: true,
      }),
      text({
        x: 0.58 + index * 2.18,
        y: 1.58,
        w: 1.2,
        h: 0.23,
        value,
        size: 12,
        color: INK,
        bold: true,
      }),
      text({
        x: 0.58 + index * 2.18,
        y: 1.84,
        w: 1.2,
        h: 0.14,
        value: label.toUpperCase(),
        size: 6.4,
        color: SOFT_TEXT,
      }),
    ]),
    ...dashboardChartCard(
      0.42,
      2.32,
      2.86,
      1.32,
      "Revenue by Quarter",
      "bar",
      chartData([125, 158, 142, 189]),
    ),
    ...dashboardChartCard(
      3.58,
      2.32,
      2.86,
      1.32,
      "Market Distribution",
      "donut",
      chartData([35, 28, 25, 12]),
    ),
    ...dashboardChartCard(
      6.74,
      2.32,
      2.86,
      1.32,
      "Growth Trend",
      "line",
      chartData([30, 45, 52, 48, 67, 82]),
    ),
    ...dashboardChartCard(
      0.42,
      3.92,
      2.86,
      1.32,
      "Department Performance",
      "bar",
      chartData([87, 72, 95, 68]),
    ),
    ...dashboardChartCard(
      3.58,
      3.92,
      2.86,
      1.32,
      "Product Comparison",
      "bar",
      chartData([45, 58, 72, 65]),
    ),
    ...dashboardChartCard(
      6.74,
      3.92,
      2.86,
      1.32,
      "Customer Feedback",
      "donut",
      chartData([78, 65, 42]),
    ),
  ]),

  slide("Title Description With Multi-Chart Grid + Bullets", [
    svg({
      x: 0,
      y: 0,
      w: 10,
      h: 5.625,
      markup: dashboardBg(),
      name: "Dashboard background",
    }),
    text({
      x: 0.42,
      y: 0.34,
      w: 4.8,
      h: 0.42,
      value: "Data Analytics Dashboard",
      size: 24,
      color: INK,
      bold: true,
    }),
    rect({ x: 0.42, y: 0.9, w: 0.5, h: 0.04, fill: PRIMARY, r: 0.02 }),
    text({
      x: 0.42,
      y: 1.08,
      w: 5.2,
      h: 0.3,
      value:
        "Comprehensive overview of key metrics and performance indicators across multiple data dimensions.",
      size: 9,
      color: SOFT_TEXT,
    }),
    ...dashboardChartCard(
      0.42,
      1.68,
      2.65,
      1.58,
      "Revenue by Quarter",
      "bar",
      chartData([125, 158, 142, 189]),
    ),
    ...dashboardChartCard(
      3.32,
      1.68,
      2.65,
      1.58,
      "Market Distribution",
      "donut",
      chartData([35, 28, 25, 12]),
    ),
    ...dashboardChartCard(
      0.42,
      3.55,
      2.65,
      1.58,
      "Growth Trend",
      "line",
      chartData([30, 45, 52, 48, 67, 82]),
    ),
    ...dashboardChartCard(
      3.32,
      3.55,
      2.65,
      1.58,
      "Department Performance",
      "bar",
      chartData([87, 72, 95, 68]),
    ),
    rect({
      x: 6.45,
      y: 1.7,
      w: 2.9,
      h: 1.96,
      fill: CARD,
      stroke: { color: LINE, width: 0.7 },
      r: 0.12,
      shadow: true,
    }),
    ...[
      "Pipeline coverage above 3x target",
      "CAC payback under 6 months",
      "Enterprise conversion improved QoQ",
      "Expansion revenue driving growth",
      "Retention above 95% across cohorts",
      "Forecast accuracy improved this quarter",
    ].flatMap((item, index) => [
      ellipse({
        x: 6.68,
        y: 1.95 + index * 0.27,
        w: 0.08,
        h: 0.08,
        fill: PRIMARY,
      }),
      text({
        x: 6.85,
        y: 1.89 + index * 0.27,
        w: 2.1,
        h: 0.18,
        value: item,
        size: 7.7,
        color: MUTED,
      }),
    ]),
  ]),
];

export const neoGeneralDeck: Deck = {
  title: "Neo General",
  description: "New general purpose layouts for common presentation elements",
  theme: {
    background: BG,
    surface: LINE,
    primary: PRIMARY,
    secondary: CYAN,
    accent: ORANGE,
    text: INK,
    muted: MUTED,
  },
  slides,
};
