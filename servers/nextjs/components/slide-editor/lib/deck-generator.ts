import { z } from "zod";
import {
  DeckSchema,
  type Deck,
  type Slide,
  type SlideElement,
  type ThemeRole,
} from "./slide-schema";

export const MIN_SLIDE_COUNT = 5;
export const MAX_SLIDE_COUNT = 20;

// Sections + title slide + agenda slide = total slides.
export const MIN_SECTION_COUNT = MIN_SLIDE_COUNT - 2;
export const MAX_SECTION_COUNT = MAX_SLIDE_COUNT - 2;

export const DeckGenerationInputSchema = z.object({
  title: z.string().min(1).max(90),
  description: z.string().min(1).max(1200),
  slideCount: z
    .number()
    .int()
    .min(MIN_SLIDE_COUNT)
    .max(MAX_SLIDE_COUNT)
    .default(6),
  theme: z.object({
    background: z.string().min(1),
    surface: z.string().min(1),
    primary: z.string().min(1),
    secondary: z.string().min(1),
    accent: z.string().min(1),
    text: z.string().min(1),
    muted: z.string().min(1),
  }),
});

export const SlideOutlineSchema = z.object({
  title: z.string().min(1).max(90),
  subtitle: z.string().min(1).max(140),
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(60),
        summary: z.string().min(1).max(180),
        bullets: z.array(z.string().min(1).max(110)).min(2).max(5),
        visual: z.enum(["bullets", "chart", "table"]),
      }),
    )
    .min(MIN_SECTION_COUNT)
    .max(MAX_SECTION_COUNT),
});

export type DeckGenerationInput = z.infer<typeof DeckGenerationInputSchema>;
export type SlideOutline = z.infer<typeof SlideOutlineSchema>;

const SANS = "Arial";

function cleanHex(value: string, fallback: string): string {
  const stripped = value.trim().replace(/^#/, "");
  return /^[0-9A-Fa-f]{6}$/.test(stripped) ? stripped.toUpperCase() : fallback;
}

function palette(input: DeckGenerationInput) {
  return {
    background: cleanHex(input.theme.background, "F7F8FB"),
    surface: cleanHex(input.theme.surface, "FFFFFF"),
    primary: cleanHex(input.theme.primary, "16324F"),
    secondary: cleanHex(input.theme.secondary, "3E78B2"),
    accent: cleanHex(input.theme.accent, "D4A24C"),
    text: cleanHex(input.theme.text, "172033"),
    muted: cleanHex(input.theme.muted, "68748A"),
    white: cleanHex(input.theme.surface, "FFFFFF"),
    line: "DDE4EF",
  };
}

function roleForColor(
  color: string | null | undefined,
  colors: ReturnType<typeof palette>,
): ThemeRole | undefined {
  if (!color) return undefined;
  const normalized = cleanHex(color, "");
  const roles: ThemeRole[] = [
    "background",
    "surface",
    "primary",
    "secondary",
    "accent",
    "text",
    "muted",
  ];
  return roles.find((role) => colors[role] === normalized);
}

function applyGeneratedThemeRoles(deck: Deck, colors: ReturnType<typeof palette>) {
  for (const slide of deck.slides) {
    slide.backgroundRole = roleForColor(slide.background, colors);
    for (const element of slide.elements) applyElementThemeRoles(element, colors);
  }
}

function applyElementThemeRoles(
  element: SlideElement,
  colors: ReturnType<typeof palette>,
) {
  if (element.kind === "text") {
    element.colorRole = roleForColor(element.color, colors);
    return;
  }
  if (element.kind === "rect" || element.kind === "ellipse") {
    element.fillRole = roleForColor(element.fill, colors);
    if (element.line) element.line.colorRole = roleForColor(element.line.color, colors);
    return;
  }
  if (element.kind === "bullets") {
    element.colorRole = roleForColor(element.color, colors);
    element.bulletColorRole = roleForColor(element.bulletColor, colors);
    return;
  }
  if (element.kind === "chart") {
    element.colorRole = roleForColor(element.color, colors);
    element.axisColorRole = roleForColor(element.axisColor, colors);
    element.labelColorRole = roleForColor(element.labelColor, colors);
    element.data.forEach((datum) => {
      datum.colorRole = roleForColor(datum.color, colors);
    });
    return;
  }
  if (element.kind === "table") {
    element.textColorRole = roleForColor(element.textColor, colors);
    element.headerFillRole = roleForColor(element.headerFill, colors);
    element.headerTextColorRole = roleForColor(element.headerTextColor, colors);
    element.borderColorRole = roleForColor(element.borderColor, colors);
    element.fillRole = roleForColor(element.fill, colors);
  }
}

export function fallbackOutline(input: DeckGenerationInput): SlideOutline {
  const subject = input.title.trim();
  const words = input.description
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 12);
  const angle = words.slice(0, 4).join(" ") || "strategy";

  const seedSections: SlideOutline["sections"] = [
    {
      title: "Context",
      summary: `Why ${subject} matters now and what the audience should understand first.`,
      bullets: [
        `Frame the current state of ${angle}`,
        "Name the audience, stakes, and decision window",
        "Separate durable facts from open questions",
      ],
      visual: "bullets",
    },
    {
      title: "Momentum",
      summary: "A compact readout of the signals that point to progress or pressure.",
      bullets: ["Adoption", "Efficiency", "Reach"],
      visual: "chart",
    },
    {
      title: "Operating Model",
      summary: "The core components that need to work together for the idea to land.",
      bullets: ["People", "Process", "Product", "Data", "Distribution", "Risk"],
      visual: "bullets",
    },
    {
      title: "Plan",
      summary: "A practical phased path from exploration to repeatable execution.",
      bullets: ["Discover", "Prototype", "Launch", "Scale"],
      visual: "table",
    },
    {
      title: "Risks",
      summary: "The failure modes worth naming up front so the plan stays honest.",
      bullets: ["Adoption gaps", "Capacity limits", "Data quality"],
      visual: "bullets",
    },
    {
      title: "Decisions",
      summary: "The open calls that need an owner and a date.",
      bullets: ["Budget approval", "Scope cut", "Hire trigger", "Vendor pick"],
      visual: "table",
    },
  ];

  const desiredSections = Math.max(
    MIN_SECTION_COUNT,
    Math.min(MAX_SECTION_COUNT, input.slideCount - 2),
  );
  const sections: SlideOutline["sections"] = [];
  for (let i = 0; i < desiredSections; i += 1) {
    const base = seedSections[i % seedSections.length];
    sections.push(
      i < seedSections.length
        ? base
        : { ...base, title: `${base.title} ${Math.floor(i / seedSections.length) + 1}` },
    );
  }

  return {
    title: subject,
    subtitle: input.description.slice(0, 130),
    sections,
  };
}

function footer(index: number, total: number, color: string): SlideElement[] {
  return [
    {
      kind: "text",
      x: 0.55,
      y: 5.22,
      w: 4,
      h: 0.25,
      text: "GENERATED DECK",
      fontFace: SANS,
      fontSize: 8,
      color,
      charSpacing: 180,
    },
    {
      kind: "text",
      x: 8.35,
      y: 5.22,
      w: 1.1,
      h: 0.25,
      text: `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
      fontFace: SANS,
      fontSize: 8,
      color,
      align: "right",
    },
  ];
}

function titleSlide(outline: SlideOutline, colors: ReturnType<typeof palette>, total: number): Slide {
  return {
    title: "Title",
    background: colors.primary,
    elements: [
      { kind: "rect", x: 0.65, y: 0.7, w: 0.72, h: 0.06, fill: colors.accent },
      {
        kind: "text",
        x: 0.65,
        y: 1.35,
        w: 8.1,
        h: 1.35,
        text: outline.title,
        fontFace: SANS,
        fontSize: 44,
        bold: true,
        color: colors.white,
        lineHeight: 0.95,
      },
      {
        kind: "text",
        x: 0.7,
        y: 3.05,
        w: 6.8,
        h: 0.72,
        text: outline.subtitle,
        fontFace: SANS,
        fontSize: 17,
        color: "DCE6F2",
        lineHeight: 1.2,
      },
      {
        kind: "ellipse",
        x: 7.25,
        y: 0.75,
        w: 2.4,
        h: 2.4,
        fill: colors.accent,
        opacity: 0.18,
      },
      ...footer(1, total, "9FB0C8"),
    ],
  };
}

function agendaSlide(outline: SlideOutline, colors: ReturnType<typeof palette>, total: number): Slide {
  return {
    title: "Outline",
    background: colors.background,
    elements: [
      {
        kind: "text",
        x: 0.65,
        y: 0.55,
        w: 6.8,
        h: 0.48,
        text: "Deck outline",
        fontFace: SANS,
        fontSize: 26,
        bold: true,
        color: colors.text,
      },
      ...outline.sections.flatMap((section, sectionIndex) => {
        const col = sectionIndex % 2;
        const row = Math.floor(sectionIndex / 2);
        const x = 0.65 + col * 4.43;
        const y = 1.35 + row * 1.7;
        return [
          {
            kind: "rect" as const,
            x,
            y,
            w: 4.25,
            h: 1.52,
            fill: colors.white,
            line: { color: colors.line, width: 0.75 },
            rx: 0.08,
          },
          {
            kind: "text" as const,
            x: x + 0.2,
            y: y + 0.2,
            w: 0.75,
            h: 0.4,
            text: String(sectionIndex + 1).padStart(2, "0"),
            fontFace: SANS,
            fontSize: 25,
            bold: true,
            color: colors.primary,
          },
          {
            kind: "text" as const,
            x: x + 1.05,
            y: y + 0.25,
            w: 2.85,
            h: 0.32,
            text: section.title.toUpperCase(),
            fontFace: SANS,
            fontSize: 9,
            bold: true,
            color: colors.muted,
            charSpacing: 120,
          },
          {
            kind: "text" as const,
            x: x + 1.05,
            y: y + 0.68,
            w: 2.85,
            h: 0.45,
            text: section.summary,
            fontFace: SANS,
            fontSize: 9,
            color: colors.text,
            lineHeight: 1.18,
          },
        ];
      }),
      ...footer(2, total, colors.muted),
    ],
  };
}

function sectionSlide(
  section: SlideOutline["sections"][number],
  index: number,
  total: number,
  colors: ReturnType<typeof palette>,
): Slide {
  const titleWidth = 4.15;
  const leftColumnWidth = 4.1;
  const titleLineCount = Math.min(3, Math.max(1, Math.ceil(section.title.length / 24)));
  const titleHeight = titleLineCount * 0.38;
  const summaryY = 0.82 + titleHeight + 0.16;
  const bulletsY = Math.max(2.35, summaryY + 1);
  const visualY = Math.max(1.05, 0.82 + titleHeight + 0.18);
  const visualH = Math.max(2.2, 4.35 - visualY);
  const base: SlideElement[] = [
    { kind: "rect", x: 0.65, y: 0.62, w: 0.55, h: 0.06, fill: colors.accent },
    {
      kind: "text",
      x: 0.65,
      y: 0.82,
      w: titleWidth,
      h: titleHeight,
      text: section.title,
      fontFace: SANS,
      fontSize: 26,
      bold: true,
      color: colors.text,
      lineHeight: 1.05,
    },
    {
      kind: "text",
      x: 0.68,
      y: summaryY,
      w: leftColumnWidth,
      h: 0.78,
      text: section.summary,
      fontFace: SANS,
      fontSize: 14,
      color: colors.muted,
      lineHeight: 1.25,
    },
  ];

  const visual: SlideElement =
    section.visual === "chart"
      ? {
          kind: "chart",
          x: 5.25,
          y: visualY,
          w: 3.9,
          h: visualH,
          chartType: "bar",
          title: "Signal strength",
          data: section.bullets.slice(0, 4).map((label, itemIndex) => ({
            label: label.slice(0, 14),
            value: 35 + itemIndex * 17,
            color: itemIndex % 2 === 0 ? colors.accent : colors.primary,
          })),
          color: colors.accent,
          axisColor: "AEB8C7",
          labelColor: colors.muted,
          showValues: true,
        }
      : section.visual === "table"
          ? {
              kind: "table",
              x: 5.05,
              y: visualY,
              w: 4.1,
              h: visualH,
              rows: [
                ["Phase", "Focus", "Output"],
                ...section.bullets.slice(0, 4).map((item, itemIndex) => [
                  `${itemIndex + 1}`,
                  item.slice(0, 18),
                  itemIndex === 0 ? "Learn" : itemIndex === 1 ? "Build" : "Ship",
                ]),
              ],
              fontFace: SANS,
              fontSize: 10,
              textColor: colors.text,
              headerFill: colors.primary,
              headerTextColor: colors.white,
              borderColor: colors.line,
              fill: colors.white,
            }
          : {
              kind: "bullets",
              x: 5.05,
              y: visualY,
              w: 3.95,
              h: visualH,
              items: section.bullets,
              fontFace: SANS,
              fontSize: 17,
              color: colors.text,
              bulletColor: colors.accent,
              lineSpacingMultiple: 1.35,
              itemGap: 0.08,
            };

  return {
    title: section.title,
    background: colors.background,
    elements: [
      ...base,
      ...(section.visual === "bullets"
        ? []
        : [
            {
              kind: "bullets" as const,
              x: 0.8,
              y: bulletsY,
              w: 3.7,
              h: Math.max(1.2, 4.82 - bulletsY),
              items: section.bullets.slice(0, 4),
              fontFace: SANS,
              fontSize: 14,
              color: colors.text,
              bulletColor: colors.accent,
              lineSpacingMultiple: 1.25,
              itemGap: 0.07,
            },
          ]),
      visual,
      ...footer(index, total, colors.muted),
    ],
  };
}

export function deckFromOutline(input: DeckGenerationInput, outline: SlideOutline): Deck {
  const colors = palette(input);
  const total = outline.sections.length + 2;
  const slides = [
    titleSlide(outline, colors, total),
    agendaSlide(outline, colors, total),
    ...outline.sections.map((section, index) =>
      sectionSlide(section, index + 3, total, colors),
    ),
  ];

  const deck = DeckSchema.parse({
    title: outline.title,
    description: input.description,
    theme: {
      background: colors.background,
      surface: colors.surface,
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      text: colors.text,
      muted: colors.muted,
    },
    slides,
  });
  applyGeneratedThemeRoles(deck, colors);
  return deck;
}

export function generateFallbackDeck(input: DeckGenerationInput): Deck {
  return deckFromOutline(input, fallbackOutline(input));
}
