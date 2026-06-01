import type { ChartElement, Deck, Slide, SlideElement } from "../lib/slide-schema";
import { createTemplateElements } from "./template-elements";

const FONT = "Source Sans 3";

const WHITE = "FFFFFF";
const BG = "F9F8F8";
const INK = "232223";
const BODY = "353538";
const MUTED = "6C6C6C";
const PRIMARY = "157CFF";
const PRIMARY_ALT = "147CFE";
const PURPLE = "4D4EF3";
const BLUE_SOFT = "9FB6FF";
const ORANGE = "CD7721";
const CARD = "FFFFFF";
const ICON_BG = "ECF5FE";
const LINE = "D9DCE4";

const REPORT_IMAGES = {
  portrait:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80",
  workspace:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  team: [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80",
  ],
};

const { text, rect, ellipse, line, image, svg, chart, slide } =
  createTemplateElements({
    fontFamily: FONT,
    defaultTextColor: INK,
    defaultBackground: BG,
    defaultLineColor: LINE,
    defaultChartColor: PRIMARY,
    defaultChartAxisColor: "C4CAD6",
    defaultChartLabelColor: MUTED,
    rectShadow: {
      color: "000000",
      opacity: 0.12,
      blur: 0.12,
      offsetX: 0,
      offsetY: 0.04,
    },
  });

function accentBar(color = PRIMARY) {
  return rect({
    x: 0,
    y: 0,
    w: 0.33,
    h: 1.45,
    fill: color,
    r: { tl: 0, tr: 0, bl: 0.17, br: 0.17 },
  });
}

function reportTitle(value: string, color = PRIMARY): SlideElement[] {
  return [
    accentBar(color),
    text({
      x: 0.5,
      y: 0.42,
      w: 7.2,
      h: 0.7,
      value,
      size: 42,
      color: INK,
      bold: true,
      lineHeight: 1.05,
    }),
  ];
}

function pulseIcon(color = WHITE): string {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 34h10l6-16 10 30 7-18h11" fill="none" stroke="#${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function serviceIcon(color = PRIMARY): string {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="19" fill="none" stroke="#${color}" stroke-width="5"/>
    <path d="M23 33l6 6 13-16" fill="none" stroke="#${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function arrowSvg(color = PRIMARY): string {
  return `<svg viewBox="0 0 119 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 6.36H0v2h1v-2Zm117.71 1.71a1 1 0 0 0 0-1.41L112.34.29a1 1 0 1 0-1.41 1.42l5.66 5.65-5.66 5.66a1 1 0 0 0 1.41 1.41l6.37-6.36ZM1 7.36v1h117v-2H1v1Z" fill="#${color}"/>
  </svg>`;
}

function imageGradient(color = PURPLE): string {
  return `<svg viewBox="0 0 256 720" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#${color}" stop-opacity="0.98"/>
        <stop offset="0.52" stop-color="#${color}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="256" height="720" fill="url(#g)"/>
  </svg>`;
}

function dotBullets(
  x: number,
  y: number,
  items: string[],
  w = 3.45,
  size = 13.6,
): SlideElement[] {
  return items.flatMap((item, index) => {
    const itemY = y + index * 0.34;
    return [
      ellipse({ x, y: itemY + 0.08, w: 0.07, h: 0.07, fill: INK }),
      text({
        x: x + 0.18,
        y: itemY,
        w,
        h: 0.23,
        value: item,
        size,
        color: INK,
        lineHeight: 1.15,
      }),
    ];
  });
}

function statPill(
  x: number,
  y: number,
  metrics: Array<{ value: string; label: string; description: string }>,
  color = PRIMARY,
): SlideElement[] {
  const w = 1.94;
  const h = 3.42;
  const elements: SlideElement[] = [
    rect({ x, y, w, h, fill: color, r: 0.5 }),
  ];

  metrics.slice(0, 2).forEach((metric, index) => {
    const baseY = y + (metrics.length === 1 ? 1.2 : index === 0 ? 0.58 : 2.04);
    elements.push(
      text({
        x: x + 0.18,
        y: baseY,
        w: w - 0.36,
        h: 0.48,
        value: metric.value,
        size: 30,
        color: WHITE,
        align: "center",
        wrap: "none",
      }),
      text({
        x: x + 0.24,
        y: baseY + 0.55,
        w: w - 0.48,
        h: 0.24,
        value: metric.label,
        size: 11.8,
        color: WHITE,
        align: "center",
      }),
      text({
        x: x + 0.24,
        y: baseY + 0.83,
        w: w - 0.48,
        h: 0.34,
        value: metric.description,
        size: 10.8,
        color: WHITE,
        align: "center",
        lineHeight: 1.15,
        opacity: 0.9,
      }),
    );
  });

  if (metrics.length > 1) {
    elements.push(
      line({
        x: x + 0.34,
        y: y + 1.72,
        w: w - 0.68,
        color: WHITE,
        width: 0.9,
        opacity: 0.22,
        dash: [3.9, 1.95],
      }),
    );
  }

  return elements;
}

function solutionCard(
  x: number,
  y: number,
  step: string,
  description: string,
): SlideElement[] {
  return [
    rect({ x, y, w: 2.44, h: 3.12, fill: PURPLE, r: 0.5 }),
    text({
      x: x + 0.32,
      y: y + 0.58,
      w: 1.8,
      h: 0.44,
      value: step,
      size: 25,
      color: WHITE,
      align: "center",
      wrap: "none",
    }),
    text({
      x: x + 0.34,
      y: y + 1.3,
      w: 1.76,
      h: 1.36,
      value: description,
      size: 16.5,
      color: WHITE,
      align: "center",
      lineHeight: 1.18,
    }),
  ];
}

function iconTextItem({
  x,
  y,
  title,
  body,
  color = PRIMARY,
  compact = false,
}: {
  x: number;
  y: number;
  title: string;
  body: string;
  color?: string;
  compact?: boolean;
}): SlideElement[] {
  return [
    ellipse({ x, y, w: 0.43, h: 0.43, fill: color }),
    svg({
      x: x + 0.11,
      y: y + 0.11,
      w: 0.21,
      h: 0.21,
      markup: pulseIcon(),
      name: `${title} icon`,
    }),
    text({
      x: x + 0.55,
      y: y + 0.04,
      w: compact ? 2.7 : 3.5,
      h: 0.26,
      value: title,
      size: 12.2,
      color: INK,
    }),
    text({
      x,
      y: y + 0.64,
      w: compact ? 3.4 : 3.65,
      h: compact ? 0.46 : 0.5,
      value: body,
      size: compact ? 13.6 : 14.6,
      color: INK,
      lineHeight: 1.12,
    }),
  ];
}

function reportChartData(values: number[], colors = [PRIMARY, PURPLE, BLUE_SOFT, ORANGE]) {
  return values.map((value, index) => ({
    label: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"][index] ?? `P${index + 1}`,
    value,
    color: colors[index % colors.length],
  }));
}

function chartCard(
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  type: ChartElement["chartType"],
  data: ChartElement["data"],
  color = PRIMARY,
): SlideElement[] {
  return [
    rect({ x, y, w, h, fill: CARD, r: 0.06 }),
    chart({
      x: x + 0.08,
      y: y + 0.08,
      w: w - 0.16,
      h: h - 0.16,
      title,
      type,
      data,
      color,
    }),
  ];
}

const defaultBullets = [
  "Ut enim ad minima veniam, quis nostrum",
  "Exercitationem ullam corporis suscipit",
  "Ut enim ad minima veniam, quis nostrum",
  "Exercitationem ullam corporis suscipit",
];

const defaultMetrics = [
  { value: "25K", label: "Students", description: "Ut enim ad minima" },
  { value: "25K", label: "Students", description: "Ut enim ad minima" },
];

const slides: Slide[] = [
  slide(
    "Intro/Cover Slide",
    [
      rect({
        x: 0.31,
        y: 0,
        w: 0.35,
        h: 1.96,
        fill: PRIMARY_ALT,
        r: { tl: 0, tr: 0, bl: 0.17, br: 0.17 },
      }),
      rect({
        x: 0.87,
        y: 0,
        w: 0.35,
        h: 1.45,
        fill: PRIMARY_ALT,
        r: { tl: 0, tr: 0, bl: 0.17, br: 0.17 },
      }),
      rect({
        x: 8.78,
        y: 3.67,
        w: 0.35,
        h: 1.96,
        fill: PRIMARY_ALT,
        r: { tl: 0.17, tr: 0.17, bl: 0, br: 0 },
      }),
      rect({
        x: 9.34,
        y: 4.18,
        w: 0.35,
        h: 1.45,
        fill: PRIMARY_ALT,
        r: { tl: 0.17, tr: 0.17, bl: 0, br: 0 },
      }),
      text({
        x: 1.3,
        y: 1.36,
        w: 7.4,
        h: 0.78,
        value: "Company's",
        size: 70,
        color: INK,
        bold: true,
        italic: true,
        align: "center",
        wrap: "none",
      }),
      text({
        x: 1.3,
        y: 2.18,
        w: 7.4,
        h: 0.62,
        value: "Annual Report",
        size: 53,
        color: INK,
        align: "center",
        wrap: "none",
      }),
      rect({ x: 4.74, y: 3.25, w: 0.52, h: 0.025, fill: ORANGE }),
      text({
        x: 3.4,
        y: 3.78,
        w: 3.2,
        h: 0.36,
        value: "John Doe",
        size: 23,
        color: INK,
        align: "center",
      }),
      text({
        x: 2.7,
        y: 4.24,
        w: 4.6,
        h: 0.24,
        value: "Company Name | Strategy, Content, Growth",
        size: 11.6,
        color: INK,
        align: "center",
      }),
    ],
    WHITE,
  ),

  slide("Title Description Image Slide", [
    ...reportTitle("Introduction"),
    text({
      x: 0.75,
      y: 1.55,
      w: 3.35,
      h: 1.36,
      value:
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut alut enim ad minima veniam, quis. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.",
      size: 14.4,
      color: INK,
      lineHeight: 1.12,
    }),
    ...dotBullets(0.75, 3.1, defaultBullets, 3.2),
    image({
      x: 5.45,
      y: 1.66,
      w: 4.55,
      h: 3.1,
      src: REPORT_IMAGES.portrait,
      name: "Feature image",
      r: { tl: 0.5, tr: 0, bl: 0.5, br: 0 },
    }),
  ]),

  slide("Metrics Slide", [
    ...reportTitle("Introduction"),
    text({
      x: 0.75,
      y: 1.62,
      w: 3.15,
      h: 1.36,
      value:
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut alut enim ad minima veniam, quis. Ut enim ad minima veniam, quis nostrum exercitationem.",
      size: 14.4,
      color: INK,
      lineHeight: 1.12,
    }),
    ...dotBullets(0.75, 3.22, defaultBullets, 3.1),
    ...statPill(5.4, 1.56, defaultMetrics),
    ...statPill(7.62, 1.56, defaultMetrics),
  ]),

  slide("Title Image Bullet Cards Slide", [
    ...reportTitle("Solution"),
    image({
      x: 0,
      y: 1.78,
      w: 4.18,
      h: 3.1,
      src: REPORT_IMAGES.workspace,
      name: "Solution image",
      r: { tl: 0, tr: 0.5, bl: 0, br: 0.5 },
    }),
    ...solutionCard(
      4.58,
      1.78,
      "01",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ),
    ...solutionCard(
      7.35,
      1.78,
      "02",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ),
  ]),

  slide("Milestone Slide", [
    ...reportTitle("Milestone"),
    ...[
      ["01", "Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
      ["02", "Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
      ["03", "Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
      ["04", "Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
      ["05", "Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
    ].flatMap(([num, heading, bodyText], index) => {
      const x = 0.42 + index * 1.76;
      const active = index === 4;
      return [
        ellipse({
          x,
          y: 1.55,
          w: 2.11,
          h: 2.11,
          fill: active ? PRIMARY : CARD,
          stroke: { color: PRIMARY, width: 0.9 },
        }),
        text({
          x: x + 0.47,
          y: 2.38,
          w: 1.15,
          h: 0.34,
          value: num,
          size: 24,
          color: active ? WHITE : PRIMARY,
          align: "center",
          wrap: "none",
        }),
        text({
          x: x + 0.2,
          y: 3.9,
          w: 1.72,
          h: 0.25,
          value: heading,
          size: 12.2,
          color: INK,
          align: "center",
        }),
        text({
          x: x + 0.16,
          y: 4.22,
          w: 1.8,
          h: 0.68,
          value: bodyText,
          size: 12.5,
          color: INK,
          align: "center",
          lineHeight: 1.12,
        }),
      ];
    }),
  ]),

  slide("Bullet List with Icon Title Description Slide", [
    ...reportTitle("Data Analysis"),
    ...[
      ["Title 1 title 1 title 1", "Ut enim ad minima veniam, quis. Ut enim ad minima veniam, quis."],
      ["Title 3 title 3 title 3", "Ut enim ad minima veniam, quis. Ut enim ad minima veniam, quis."],
      ["Title 2 title 2 title 2", "Ut enim ad minima veniam, quis. Ut enim ad minima veniam, quis."],
      ["Title 4 title 4 title 4", "Ut enim ad minima veniam, quis. Ut enim ad minima veniam, quis."],
      ["Title 2 title 2 title 2", "Ut enim ad minima veniam, quis. Ut enim ad minima veniam, quis."],
      ["Title 5 title 5 title 5", "Ut enim ad minima veniam, quis. Ut enim ad minima veniam, quis."],
    ].flatMap(([title, bodyText], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      return iconTextItem({
        x: 0.64 + col * 4.55,
        y: 1.65 + row * 1.2,
        title,
        body: bodyText,
      });
    }),
  ]),

  slide("Bar Chart with Bullet List with Title Description Icon Slide", [
    ...reportTitle("Data Analysis", PURPLE),
    ...[
      ["Title 1", "Ut enim ad minima veniam, quis."],
      ["Title 2", "Ut enim ad minima veniam, quis."],
      ["Title 2", "Ut enim ad minima veniam, quis."],
    ].flatMap(([title, bodyText], index) =>
      iconTextItem({
        x: 0.66,
        y: 1.56 + index * 1.23,
        title,
        body: bodyText,
        color: PURPLE,
        compact: true,
      }),
    ),
    chart({
      x: 5.18,
      y: 1.48,
      w: 4.35,
      h: 2.85,
      title: "Traditional Workflow",
      type: "bar",
      data: [
        { label: "Mon", value: 120, color: PURPLE },
        { label: "Tue", value: 200, color: PURPLE },
        { label: "Wed", value: 150, color: PURPLE },
        { label: "Thu", value: 80, color: PURPLE },
        { label: "Fri", value: 70, color: PURPLE },
        { label: "Sat", value: 110, color: PURPLE },
        { label: "Sun", value: 130, color: PURPLE },
      ],
      color: PURPLE,
    }),
    ellipse({ x: 6.68, y: 4.55, w: 0.09, h: 0.09, fill: PURPLE }),
    text({
      x: 6.88,
      y: 4.49,
      w: 2.3,
      h: 0.25,
      value: "Traditional Workflow",
      size: 14,
      color: PURPLE,
    }),
  ]),

  slide("Title Description Chart Slide", [
    ...reportTitle("Data Analysis"),
    ellipse({ x: 0.74, y: 1.86, w: 0.43, h: 0.43, fill: PRIMARY }),
    svg({
      x: 0.85,
      y: 1.97,
      w: 0.21,
      h: 0.21,
      markup: pulseIcon(),
      name: "Insight icon",
    }),
    text({
      x: 0.74,
      y: 2.48,
      w: 4.12,
      h: 1.5,
      value:
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut alut enim ad minima veniam, quis. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.",
      size: 14.4,
      color: INK,
      lineHeight: 1.12,
    }),
    chart({
      x: 5.25,
      y: 1.48,
      w: 4.25,
      h: 3.18,
      title: "Traditional Workflow",
      type: "line",
      data: reportChartData([45, 72, 58, 89]),
    }),
    ellipse({ x: 6.75, y: 4.78, w: 0.09, h: 0.09, fill: PRIMARY }),
    text({
      x: 6.95,
      y: 4.72,
      w: 2.3,
      h: 0.25,
      value: "Traditional Workflow",
      size: 14,
      color: PRIMARY,
    }),
  ]),

  slide("Title Chart with Metrics Cards Slide", [
    ...reportTitle("Data Analysis"),
    line({ x: 1.68, y: 1.44, w: 0.18, color: BLUE_SOFT, width: 1.7 }),
    text({ x: 1.95, y: 1.35, w: 1.0, h: 0.2, value: "Category A", size: 8.8, color: BODY }),
    line({ x: 3.0, y: 1.44, w: 0.18, color: PURPLE, width: 1.7 }),
    text({ x: 3.26, y: 1.35, w: 1.0, h: 0.2, value: "Category B", size: 8.8, color: BODY }),
    chart({
      x: 0.72,
      y: 1.68,
      w: 3.95,
      h: 2.8,
      title: "Category Trends",
      type: "line",
      data: reportChartData([24, 55, 50, 97, 70, 42, 63], [BLUE_SOFT, PURPLE]),
    }),
    ellipse({ x: 1.72, y: 4.72, w: 0.09, h: 0.09, fill: PRIMARY }),
    text({
      x: 1.92,
      y: 4.66,
      w: 2.0,
      h: 0.25,
      value: "Traditional Workflow",
      size: 14,
      color: PRIMARY,
    }),
    ...statPill(5.45, 1.56, defaultMetrics),
    ...statPill(7.65, 1.56, defaultMetrics),
  ]),

  slide("Title Metrics Slide", [
    ...reportTitle("Performance Snapshot"),
    ...statPill(1.54, 1.52, defaultMetrics),
    ...statPill(4.03, 1.52, defaultMetrics),
    ...statPill(6.52, 1.52, defaultMetrics),
  ]),

  slide("Title Workflow with Title Description Slide", [
    ...reportTitle("Services"),
    ...[
      ["Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
      ["Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
      ["Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
      ["Heading", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
    ].flatMap(([heading, bodyText], index) => {
      const x = 0.8 + index * 2.15;
      const active = index === 2;
      const circleColor = active ? PRIMARY : BG;
      const iconColor = active ? WHITE : PRIMARY;
      return [
        ellipse({
          x,
          y: 1.62,
          w: 1.5,
          h: 1.5,
          fill: circleColor,
          stroke: { color: PRIMARY, width: 0.9 },
        }),
        svg({
          x: x + 0.5,
          y: 2.12,
          w: 0.5,
          h: 0.5,
          markup: serviceIcon(iconColor),
          name: `${heading} icon`,
        }),
        text({
          x: x - 0.18,
          y: 3.38,
          w: 1.86,
          h: 0.24,
          value: heading,
          size: 12.4,
          color: INK,
          align: "center",
        }),
        text({
          x: x - 0.28,
          y: 3.78,
          w: 2.06,
          h: 0.58,
          value: bodyText,
          size: 13.2,
          color: BODY,
          align: "center",
          lineHeight: 1.08,
        }),
        ...(index < 3
          ? [
              svg({
                x: x + 1.58,
                y: 2.34,
                w: 0.72,
                h: 0.12,
                markup: arrowSvg(PRIMARY),
                name: `Workflow arrow ${index + 1}`,
              }),
            ]
          : []),
      ];
    }),
  ]),

  slide(
    "Horizontal Height Spanning Images with Title Slide",
    REPORT_IMAGES.team.flatMap((src, index) => {
      const w = 2;
      const x = index * w;
      return [
        image({
          x,
          y: 0,
          w,
          h: 5.625,
          src,
          name: `Team member ${index + 1}`,
          r: 0,
        }),
        svg({
          x,
          y: 0,
          w,
          h: 5.625,
          markup: imageGradient(PURPLE),
          name: `Member ${index + 1} gradient`,
        }),
        text({
          x: x + 0.26,
          y: 4.42,
          w: 1.45,
          h: 0.24,
          value: "Lanny LA",
          size: 13,
          color: WHITE,
          opacity: 0.9,
        }),
        text({
          x: x + 0.26,
          y: 4.82,
          w: 1.45,
          h: 0.34,
          value: "Title",
          size: 17,
          color: WHITE,
        }),
      ];
    }),
    WHITE,
  ),

  slide("Data Analysis Dashboard Slide", [
    ...reportTitle("Data Analysis"),
    rect({ x: 0.5, y: 1.28, w: 9.0, h: 0.64, fill: CARD, r: 0.11 }),
    ...[
      ["5", "Text 1"],
      ["52", "Text 2"],
      ["4", "Text 3"],
      ["80%", "Text 4"],
    ].flatMap(([value, label], index) => {
      const x = 0.74 + index * 2.2;
      return [
        ellipse({ x, y: 1.43, w: 0.28, h: 0.28, fill: ICON_BG }),
        svg({
          x: x + 0.07,
          y: 1.5,
          w: 0.14,
          h: 0.14,
          markup: pulseIcon(INK),
          name: `${label} icon`,
        }),
        text({
          x: x + 0.4,
          y: 1.4,
          w: 0.9,
          h: 0.2,
          value,
          size: 11.5,
          color: BODY,
          wrap: "none",
        }),
        text({
          x: x + 0.4,
          y: 1.63,
          w: 0.9,
          h: 0.17,
          value: label,
          size: 8.8,
          color: MUTED,
        }),
      ];
    }),
    ...chartCard(0.5, 2.08, 2.85, 1.28, "Revenue", "bar", reportChartData([125, 158, 142, 189])),
    ...chartCard(
      3.58,
      2.08,
      2.85,
      1.28,
      "Region Mix",
      "donut",
      [
        { label: "North America", value: 35, color: PRIMARY },
        { label: "Europe", value: 28, color: PURPLE },
        { label: "Asia Pacific", value: 25, color: BLUE_SOFT },
        { label: "Others", value: 12, color: ORANGE },
      ],
    ),
    ...chartCard(6.65, 2.08, 2.85, 1.28, "Momentum", "line", reportChartData([30, 45, 52, 48, 67, 82])),
    ...chartCard(0.5, 3.58, 2.85, 1.28, "Departments", "bar", reportChartData([87, 72, 95, 68])),
    ...chartCard(3.58, 3.58, 2.85, 1.28, "Products", "bar", reportChartData([45, 58, 72])),
    ...chartCard(6.65, 3.58, 2.85, 1.28, "Sentiment", "bar", reportChartData([78, 65, 42])),
  ]),
];

export const reportDeck: Deck = {
  title: "Report",
  description:
    "Data and narrative report layouts rebuilt as editable slide-editor elements.",
  theme: {
    background: BG,
    surface: CARD,
    primary: PRIMARY,
    secondary: PURPLE,
    accent: ORANGE,
    text: INK,
    muted: MUTED,
  },
  slides,
};
