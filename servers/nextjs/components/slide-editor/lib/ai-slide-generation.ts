import {
  DeckSchema,
  type ChartElement,
  type ContainerElement,
  type Deck,
  type EllipseElement,
  type FlexElement,
  type GridElement,
  type GroupElement,
  type ImageElement,
  type LineElement,
  type RectangleElement,
  type Slide,
  type SlideElement,
  type SvgElement,
  type TableCell,
  type TableElement,
  type TextElement,
  type TextListElement,
} from "./slide-schema";

export type SlideLayoutManifest = {
  index: number;
  title: string;
  description: string;
  tags: string[];
  slotSummary: {
    text: number;
    lists: number;
    charts: number;
    tables: number;
    images: number;
  };
};

export type GeneratedMetric = {
  value: string;
  label: string;
  description?: string;
};

export type GeneratedChart = {
  title: string;
  type?: ChartElement["chartType"];
  data: Array<{ label: string; value: number }>;
};

export type GeneratedTable = {
  columns: string[];
  rows: string[][];
};

export type GeneratedSlideKind =
  | "cover"
  | "general"
  | "bullets"
  | "cards"
  | "metrics"
  | "chart"
  | "table"
  | "timeline"
  | "closing";

export type GeneratedSlideContent = {
  layoutIndex: number;
  inspiredLayoutId?: string;
  kind?: GeneratedSlideKind;
  title: string;
  body?: string[];
  bullets?: string[];
  metrics?: GeneratedMetric[];
  chart?: GeneratedChart;
  table?: GeneratedTable;
  imagePrompt?: string;
};

export type GeneratedDeckPlan = {
  title: string;
  outline?: string[];
  slides: GeneratedSlideContent[];
};

type TextRef = {
  element: TextElement;
  original: string;
};

type SlideRefs = {
  text: TextRef[];
  lists: TextListElement[];
  charts: ChartElement[];
  tables: TableElement[];
  images: ImageElement[];
};

type AdaptiveTheme = {
  background: string;
  surface: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  primary: string;
  secondary: string;
  accent: string;
  soft: string;
  accents: string[];
};

type TimelineItem = {
  marker: string;
  title: string;
  description: string;
};

type CardItem = {
  title: string;
  body: string;
};

const FALLBACK_PROGRESSIONS = [
  "Overview",
  "Context",
  "Key Insights",
  "Strategy",
  "Execution Plan",
  "Metrics",
  "Roadmap",
  "Next Steps",
];
const SANS = "Poppins";
const DEFAULT_ACCENTS = [
  "9234EB",
  "FF751F",
  "06B6D4",
  "10B981",
  "457EE5",
  "FFBD59",
];

export function createLayoutCatalog(deck: Deck): SlideLayoutManifest[] {
  return deck.slides.map((slide, index) => {
    const refs = collectSlideRefs(slide);
    const title = slide.title ?? `Slide ${index + 1}`;
    const tags = inferLayoutTags(title, refs);
    return {
      index,
      title,
      description: describeLayout(title, tags, refs),
      tags,
      slotSummary: {
        text: refs.text.length,
        lists: refs.lists.length,
        charts: refs.charts.length,
        tables: refs.tables.length,
        images: refs.images.length,
      },
    };
  });
}

export function buildAdaptiveGeneratedDeck({
  template,
  plan,
  description,
  slideCount,
}: {
  template: Deck;
  plan: GeneratedDeckPlan;
  description: string;
  slideCount: number;
}): Deck {
  const fallback = fallbackGeneratedPlan(template, description, slideCount);
  const normalized = normalizePlan(plan, fallback, template.slides.length);
  const catalog = createLayoutCatalog(template);
  const theme = adaptiveTheme(template);
  const deckTitle = truncateText(normalized.title || fallback.title, 90);
  const slideContents = normalized.slides.slice(0, slideCount).map((content, index) => ({
    ...content,
    kind: forcedKindForPosition(content.kind, index, slideCount),
    title: index === 0 && slideCount > 1 ? deckTitle : content.title,
  }));
  const slides = slideContents.map((content, index) => {
    const layout = catalog[clampInt(content.layoutIndex, 0, catalog.length - 1)];
    return (
      buildTemplateNativeSlide({
        template,
        content,
        deckTitle,
        index,
        slideCount,
      }) ??
      buildAdaptiveSlide({
        content,
        deckTitle,
        index,
        slideCount,
        layout,
        theme,
      })
    );
  });

  return DeckSchema.parse({
    ...clone(template),
    title: deckTitle,
    description: truncateText(description, 1200),
    slides,
  });
}

export function fallbackGeneratedPlan(
  template: Deck,
  description: string,
  slideCount: number,
): GeneratedDeckPlan {
  const count = clampInt(slideCount, 1, 50);
  const catalog = createLayoutCatalog(template);
  const focus = createFocusTitle(description);

  return {
    title: focus,
    outline: Array.from({ length: count }, (_, index) => sectionTitle(index, count)),
    slides: Array.from({ length: count }, (_, index) => {
      const kind = desiredKindForPosition(index, count);
      const layoutIndex = pickLayoutIndex(catalog, kind, index);
      const section = sectionTitle(index, count);
      return {
        layoutIndex,
        inspiredLayoutId: fallbackInspiredLayoutId(kind),
        kind,
        title: index === 0 ? focus : `${section}: ${focus}`,
        body: fallbackBody(description, focus, section, kind),
        bullets: fallbackBullets(focus, section, kind),
        metrics: fallbackMetrics(index),
        chart: fallbackChart(section),
        table: fallbackTable(section),
        imagePrompt: `${focus} ${section.toLowerCase()} presentation visual`,
      };
    }),
  };
}

function forcedKindForPosition(
  kind: GeneratedSlideKind | undefined,
  index: number,
  slideCount: number,
): GeneratedSlideKind | undefined {
  if (slideCount > 1 && index === 0) return "cover";
  if (slideCount > 2 && index === slideCount - 1) return "closing";
  return kind;
}

function buildTemplateNativeSlide({
  template,
  content,
  deckTitle,
  index,
  slideCount,
}: {
  template: Deck;
  content: GeneratedSlideContent;
  deckTitle: string;
  index: number;
  slideCount: number;
}): Slide | null {
  const sourceIndex = resolveNativeTemplateSlideIndex(template, content, index, slideCount);
  const source = template.slides[sourceIndex];
  if (!source) return null;

  const slide = clone(source);
  const title = slideTitle(content, index);
  slide.title = truncateText(title || deckTitle, 60);

  const refs = collectSlideRefs(slide);
  fillNativeTextSlots(refs.text, content, deckTitle, index, slideCount);
  fillNativeLists(refs.lists, content);
  fillNativeCharts(refs.charts, content, title);
  fillNativeTables(refs.tables, content, title);
  fillNativeImages(refs.images, content, title);

  return slide;
}

function resolveNativeTemplateSlideIndex(
  template: Deck,
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
) {
  const selectedIndex = clampInt(content.layoutIndex, 0, template.slides.length - 1);
  if (index === 0 && slideCount > 1) {
    return findNativeSlideIndex(template, /title description with image|headline|executive summary/i) ?? selectedIndex;
  }
  if (index === slideCount - 1 && slideCount > 2) {
    return findNativeSlideIndex(template, /thank|contact|closing|footer image/i) ?? selectedIndex;
  }
  return selectedIndex;
}

function findNativeSlideIndex(template: Deck, pattern: RegExp) {
  const index = template.slides.findIndex((slide) => pattern.test(slide.title ?? ""));
  return index >= 0 ? index : undefined;
}

function fillNativeTextSlots(
  refs: TextRef[],
  content: GeneratedSlideContent,
  deckTitle: string,
  index: number,
  slideCount: number,
) {
  const fillableRefs = refs.filter((ref) => !isStructuralTemplateText(ref.element, ref.original));
  const values = nativeTextValues(content, deckTitle, index);
  const fallbackValues = nativeFallbackTextValues(content, deckTitle, index, slideCount);
  let valueIndex = 0;

  for (const ref of fillableRefs) {
    const raw = values[valueIndex] ?? fallbackValues[valueIndex % fallbackValues.length];
    valueIndex += 1;
    fitAndSetTextElement(ref.element, raw);
  }
}

function nativeTextValues(
  content: GeneratedSlideContent,
  deckTitle: string,
  index: number,
) {
  const title = slideTitle(content, index) || deckTitle;
  const layoutId = inspiredLayoutId(content);
  const cards = createCardItems(content);
  const metrics = metricItems(content);
  const summary = content.body?.[0] ?? cards[0]?.body ?? title;

  if (looksLikeQuoteLayout(content)) {
    return compactTextValues([title, quoteText(content), content.body?.[1] ?? cards[0]?.title]);
  }

  if (looksLikeTeamLayout(content)) {
    return compactTextValues([
      title,
      summary,
      ...cards.slice(0, 4).flatMap((member) => {
        const { role, bio } = splitRoleBio(member.body);
        return [member.title, role, bio];
      }),
    ]);
  }

  if (/timeline|roadmap|milestone/.test(layoutId)) {
    return compactTextValues([
      title,
      ...timelineItems(content)
        .slice(0, 6)
        .flatMap((item) => [item.marker, item.title, item.description]),
    ]);
  }

  if (looksLikeFunnelLayout(content)) {
    const stages = funnelStages(content, metrics).slice(0, 4);
    const hero = metrics[0] ?? fallbackMetrics(index)[0];
    return compactTextValues([
      title,
      hero.value,
      hero.label,
      ...stages.flatMap((stage, stageIndex) => [
        stage.label,
        formatNumericLabel(stage.value),
        conversionLabel(stages, stageIndex),
      ]),
    ]);
  }

  if (/metric|stats|kpi|snapshot|performance/.test(layoutId)) {
    return compactTextValues([
      title,
      summary,
      content.body?.[1],
      ...metrics.flatMap((metric) => [
        metric.value,
        metric.label,
        metric.description,
        metric.label,
        metric.value,
      ]),
      ...cards.flatMap((item) => [item.title, item.body]),
    ]);
  }

  if (/chart|dashboard|multi-chart/.test(layoutId)) {
    return compactTextValues([
      title,
      summary,
      ...metrics.flatMap((metric) => [metric.value, metric.label]),
      ...cards.flatMap((item) => [item.title, item.body]),
    ]);
  }

  if (/table/.test(layoutId)) {
    return compactTextValues([
      title,
      summary,
      ...cards.flatMap((item) => [item.title, item.body]),
    ]);
  }

  if (/thank|contact|closing/.test(layoutId)) {
    return compactTextValues([
      title,
      content.body?.[0] ?? summary,
      content.body?.[1] ?? content.bullets?.[0],
      content.body?.[2] ?? content.bullets?.[1],
    ]);
  }

  return compactTextValues([
    title,
    summary,
    ...cards.flatMap((item) => [item.title, item.body]),
    ...metrics.flatMap((metric) => [metric.value, metric.label, metric.description]),
  ]);
}

function nativeFallbackTextValues(
  content: GeneratedSlideContent,
  deckTitle: string,
  index: number,
  slideCount: number,
) {
  return compactTextValues([
    slideTitle(content, index),
    deckTitle,
    ...(content.body ?? []),
    ...(content.bullets ?? []),
    ...createCardItems(content).flatMap((item) => [item.title, item.body]),
    ...metricItems(content).flatMap((metric) => [
      metric.value,
      metric.label,
      metric.description,
    ]),
    sectionTitle(index, slideCount),
  ]);
}

function fillNativeLists(lists: TextListElement[], content: GeneratedSlideContent) {
  const items = [
    ...(content.bullets ?? []),
    ...createCardItems(content).map((item) => `${item.title}: ${item.body}`),
  ].filter((value) => !isScaffoldText(value));

  for (const list of lists) {
    const maxItems = list.maxItems ?? list.items.length;
    const nextItems = (items.length ? items : list.items.map((item) => item.text))
      .slice(0, Math.max(1, maxItems))
      .map((value) => ({
        type: "text" as const,
        text: truncateText(value, list.maxItemLength ?? 90),
      }));
    list.items = nextItems;
  }
}

function fillNativeCharts(
  charts: ChartElement[],
  content: GeneratedSlideContent,
  title: string,
) {
  if (charts.length === 0) return;
  const chartContent = content.chart ?? chartFromMetrics(content, title);
  charts.forEach((chartElement, chartIndex) => {
    const data = rotateChartData(chartContent.data, chartIndex).map((datum, datumIndex) => ({
      label: truncateText(datum.label || `Item ${datumIndex + 1}`, 32),
      value: Math.round(Number(datum.value) || 0),
      color: chartElement.data[datumIndex]?.color,
    }));
    chartElement.title = truncateText(
      chartIndex === 0 ? chartContent.title || title : `${chartContent.title || title} ${chartIndex + 1}`,
      80,
    );
    chartElement.chartType = chartContent.type ?? chartElement.chartType;
    chartElement.data = data.slice(0, 8);
  });
}

function fillNativeTables(
  tables: TableElement[],
  content: GeneratedSlideContent,
  title: string,
) {
  if (tables.length === 0) return;
  const tableContent = normalizeGeneratedTable(content.table ?? tableFromCards(content, title));
  tables.forEach((tableElement) => {
    const columns = tableContent.columns.slice(0, tableElement.maxColumns ?? tableElement.columns.length);
    const rows = tableContent.rows.slice(0, tableElement.maxRows ?? tableElement.rows.length);
    tableElement.columns = columns.map((value, columnIndex) => ({
      ...(tableElement.columns[columnIndex] ?? tableElement.columns[0]),
      text: truncateText(value, 72),
    }));
    tableElement.rows = rows.map((row, rowIndex) =>
      row.slice(0, columns.length).map((value, columnIndex) => ({
        ...(
          tableElement.rows[rowIndex]?.[columnIndex] ??
          tableElement.rows[0]?.[columnIndex] ??
          tableElement.columns[columnIndex]
        ),
        text: truncateText(value, 72),
      })),
    );
  });
}

function fillNativeImages(
  images: ImageElement[],
  content: GeneratedSlideContent,
  title: string,
) {
  images.forEach((imageElement, imageIndex) => {
    imageElement.name = truncateText(
      content.imagePrompt ?? `${title} supporting image ${imageIndex + 1}`,
      120,
    );
  });
}

function setTextElementValue(element: TextElement, value: string) {
  const firstRun = element.runs[0];
  element.runs = [
    {
      text: value || " ",
      font: firstRun?.font,
    },
  ];
}

function fitAndSetTextElement(element: TextElement, value: string) {
  const clean = value.replace(/\s+/g, " ").trim() || " ";
  const baseFont = element.font ?? {};
  const baseSize = textElementFontSize(element);
  const lineHeight = baseFont.lineHeight ?? element.runs[0]?.font?.lineHeight ?? 1.15;
  const canWrap = shouldWrapTextSlot(element, clean);
  const minSize = textSlotMinimumFontSize(element, clean);
  const fit = findTextSlotFit({
    element,
    value: clean,
    baseSize,
    minSize,
    lineHeight,
    canWrap,
  });

  element.font = {
    ...baseFont,
    size: fit.size,
    lineHeight,
    wrap: fit.wrap ? "word" : "none",
  };
  setTextElementValue(element, fit.value);
}

function textElementFontSize(element: TextElement) {
  return element.font?.size ?? element.runs[0]?.font?.size ?? 12;
}

function shouldWrapTextSlot(element: TextElement, value: string) {
  const box = {
    w: element.size?.width ?? 1,
    h: element.size?.height ?? 0.3,
  };
  if (element.font?.wrap === "none" && value.length <= 18) return false;
  if (!value.includes(" ")) return false;
  if (box.h < 0.28) return false;
  return box.w >= 1.1;
}

function textSlotMinimumFontSize(element: TextElement, value: string) {
  const baseSize = textElementFontSize(element);
  if (baseSize >= 28) return value.length > 44 ? 10 : 11;
  if (baseSize >= 20) return value.length > 54 ? 8.5 : 9.5;
  if (baseSize >= 14) return 7.5;
  return 6;
}

function findTextSlotFit({
  element,
  value,
  baseSize,
  minSize,
  lineHeight,
  canWrap,
}: {
  element: TextElement;
  value: string;
  baseSize: number;
  minSize: number;
  lineHeight: number;
  canWrap: boolean;
}) {
  const modes = canWrap ? [true, false] : [false];

  for (const wrap of modes) {
    for (let size = baseSize; size >= minSize; size -= 0.5) {
      if (textFitsSlot(element, value, size, lineHeight, wrap)) {
        return { value, size: roundFontSize(size), wrap };
      }
    }
  }

  const wrap = canWrap;
  const size = roundFontSize(minSize);
  return {
    value: truncateText(value, textSlotMaxLength(element, size, lineHeight, wrap)),
    size,
    wrap,
  };
}

function textFitsSlot(
  element: TextElement,
  value: string,
  fontSize: number,
  lineHeight: number,
  wrap: boolean,
) {
  const box = {
    w: element.size?.width ?? 1,
    h: element.size?.height ?? 0.3,
  };
  const lines = estimateTextLines(value, box.w, fontSize, wrap);
  const lineHeightInches = (fontSize / 72) * lineHeight;
  const requiredHeight = lines * lineHeightInches;
  const safety = fontSize >= 18 ? 0.04 : 0.025;
  return requiredHeight <= Math.max(0.05, box.h - safety);
}

function estimateTextLines(
  value: string,
  widthInches: number,
  fontSize: number,
  wrap: boolean,
) {
  const maxChars = Math.max(1, Math.floor(charsPerTextLine(widthInches, fontSize)));
  if (!wrap) return value.length <= maxChars ? 1 : Number.POSITIVE_INFINITY;

  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  let lines = 1;
  let current = 0;
  for (const word of words) {
    const wordLength = word.length;
    if (wordLength > maxChars) {
      lines += Math.max(0, Math.ceil(wordLength / maxChars) - (current > 0 ? 0 : 1));
      current = wordLength % maxChars;
      continue;
    }
    const next = current === 0 ? wordLength : current + 1 + wordLength;
    if (next <= maxChars) {
      current = next;
    } else {
      lines += 1;
      current = wordLength;
    }
  }
  return lines;
}

function charsPerTextLine(widthInches: number, fontSize: number) {
  const averageGlyphWidth = fontSize >= 24 ? 0.5 : fontSize >= 14 ? 0.48 : 0.44;
  return (widthInches * 72) / (fontSize * averageGlyphWidth);
}

function roundFontSize(value: number) {
  return Math.max(6, Math.round(value * 2) / 2);
}

function textSlotMaxLength(
  element: TextElement,
  fontSize = textElementFontSize(element),
  lineHeight = element.font?.lineHeight ?? 1.15,
  wrap = element.font?.wrap !== "none",
) {
  const box = {
    w: element.size?.width ?? 1,
    h: element.size?.height ?? 0.3,
  };
  const lines =
    box.h <= 0.24
      ? 1
      : Math.max(1, Math.floor(box.h / Math.max(0.08, (fontSize / 72) * lineHeight)));
  const charsPerLine = wrap
    ? charsPerTextLine(box.w, fontSize)
    : charsPerTextLine(box.w, fontSize) * 0.95;
  return clampInt(Math.floor(charsPerLine * lines), 8, 180);
}

function isStructuralTemplateText(element: TextElement, original: string) {
  const clean = normalizeScaffoldText(original);
  const raw = original.trim();
  if (!clean) return true;
  if (/^["'“”]$/.test(raw)) return true;
  if (/^0[1-9]$/.test(raw)) return true;
  if (/^\d+$/.test(raw) && Number(raw) > 0 && Number(raw) <= 12) return true;
  if (
    [
      "key need",
      "primary channel",
      "challenge",
      "outcome",
      "target",
      "contact us",
      "revenue spend",
    ].includes(clean)
  ) {
    return true;
  }
  return Boolean(element.fixed && raw.length <= 2);
}

function compactTextValues(values: Array<string | undefined>) {
  const cleaned = values
    .map((value) => value?.replace(/\s+/g, " ").trim())
    .filter((value): value is string => Boolean(value && !isScaffoldText(value)));
  return cleaned.length > 0 ? cleaned : ["Generated insight"];
}

function splitRoleBio(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  const split = clean.match(/^([^:—–-]{2,38})\s*[:—–-]\s*(.+)$/);
  if (split) {
    return {
      role: truncateText(split[1], 38),
      bio: truncateText(split[2], 92),
    };
  }
  const sentenceSplit = clean.split(/(?<=[.!?])\s+/);
  return {
    role: truncateText(sentenceSplit[0] || "Contributor", 38),
    bio: truncateText(sentenceSplit.slice(1).join(" ") || clean, 92),
  };
}

function conversionLabel(stages: Array<{ value: number }>, index: number) {
  if (index === 0) return "Baseline";
  const previous = Math.abs(stages[index - 1]?.value ?? 0);
  const current = Math.abs(stages[index]?.value ?? 0);
  if (!previous || !current) return "Conversion";
  return `Conversion\n${Math.max(1, Math.round((current / previous) * 1000) / 10)}%`;
}

function chartFromMetrics(content: GeneratedSlideContent, title: string): GeneratedChart {
  const metricData = metricItems(content)
    .map((metric) => ({
      label: metric.label,
      value: numericMetricValue(metric.value),
    }))
    .filter((datum) => Number.isFinite(datum.value));

  if (metricData.length > 0) {
    return {
      title: truncateText(content.chart?.title ?? title, 80),
      type: "bar",
      data: metricData,
    };
  }

  return fallbackChart(title);
}

function rotateChartData(data: GeneratedChart["data"], offset: number) {
  if (data.length === 0 || offset === 0) return data;
  const normalizedOffset = offset % data.length;
  return [...data.slice(normalizedOffset), ...data.slice(0, normalizedOffset)];
}

function tableFromCards(content: GeneratedSlideContent, title: string): GeneratedTable {
  const cards = createCardItems(content).slice(0, 5);
  if (cards.length === 0) return fallbackTable(title);
  return {
    columns: ["Area", "Detail", "Action"],
    rows: cards.map((item, index) => [
      item.title,
      item.body,
      content.bullets?.[index] ?? "Review",
    ]),
  };
}

function fallbackInspiredLayoutId(kind: GeneratedSlideKind | undefined) {
  switch (kind) {
    case "cover":
      return "headline-description-with-image-layout";
    case "timeline":
      return "timeline-alternating-cards-slide";
    case "metrics":
      return "title-metrics-with-chart";
    case "chart":
      return "title-with-full-width-chart";
    case "table":
      return "title-description-three-columns-table";
    case "closing":
      return "thank-you-contact-info-footer-image-slide-layout";
    case "cards":
    case "bullets":
    case "general":
    default:
      return "title-six-card-grid-slide-layout";
  }
}

function buildAdaptiveSlide({
  content,
  deckTitle,
  index,
  slideCount,
  layout,
  theme,
}: {
  content: GeneratedSlideContent;
  deckTitle: string;
  index: number;
  slideCount: number;
  layout: SlideLayoutManifest | undefined;
  theme: AdaptiveTheme;
}): Slide {
  const kind = inferAdaptiveKind(content, index, slideCount, layout?.tags ?? []);

  if (kind === "timeline") {
    return buildTimelineSlide(content, index, slideCount, theme);
  }
  if (kind === "metrics") {
    return buildMetricsSlide(content, index, slideCount, theme);
  }
  if (kind === "chart") {
    return buildChartSlide(content, index, slideCount, theme);
  }
  if (kind === "table") {
    return buildTableSlide(content, index, slideCount, theme);
  }
  if (kind === "cover") {
    return buildCoverSlide(content, index, slideCount, theme, deckTitle);
  }
  if (kind === "closing") {
    return buildClosingSlide(content, index, slideCount, theme);
  }
  if (kind === "bullets") {
    return buildBulletSlide(content, index, slideCount, theme);
  }
  return buildCardsSlide(content, index, slideCount, theme);
}

function buildCoverSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
  deckTitle: string,
): Slide {
  const cards = coverCardItems(content, deckTitle);
  const heroCards = cards.slice(0, 3);
  const sideCards = cards.slice(3, 5);
  const optionalCoverElements: SlideElement[] = [
    ...(heroCards.length > 0
      ? [
          {
            type: "grid",
            position: { x: 0.92, y: 3.88 },
            size: { width: 4.34, height: 0.76 },
            columns: Math.min(3, heroCards.length),
            rows: 1,
            gap: 0.14,
            alignItems: "stretch",
            justifyItems: "stretch",
            children: heroCards.map((item, cardIndex) =>
              coverPointCard(item, 1.34, 0.74, theme, cardIndex, true),
            ),
          } satisfies GridElement,
        ]
      : []),
    ...(sideCards.length > 0
      ? [
          rect({ x: 6.08, y: 3.22, w: 0.7, h: 0.045, fill: theme.primary, r: 0.02 }),
          text({
            x: 6.08,
            y: 3.44,
            w: 2.18,
            h: 0.24,
            value: "Focus areas",
            size: 13,
            color: theme.ink,
            bold: true,
          }),
          {
            type: "grid",
            position: { x: 6.08, y: 3.82 },
            size: { width: 3.06, height: 1.08 },
            columns: 1,
            rows: sideCards.length,
            gap: 0.12,
            alignItems: "stretch",
            justifyItems: "stretch",
            children: sideCards.map((item, cardIndex) =>
              coverPointCard(item, 3.06, 0.48, theme, cardIndex + 3, false),
            ),
          } satisfies GridElement,
        ]
      : []),
  ];
  const title = truncateText(deckTitle || slideTitle(content, index), 68);
  const subtitle =
    content.body?.[0] ??
    content.bullets?.[0] ??
    "A concise generated briefing with a clear narrative arc.";
  const dark = "111827";
  const darkLine = "273449";
  return adaptiveSlide(title, theme, [
    rect({ x: 0, y: 0, w: 10, h: 5.625, fill: theme.soft }),
    rect({ x: 0.58, y: 0.52, w: 5.16, h: 4.58, fill: dark, r: 0.18 }),
    rect({ x: 0.58, y: 0.52, w: 0.08, h: 4.58, fill: theme.accent, r: 0.03 }),
    svg({
      x: 5.96,
      y: 0.66,
      w: 3.44,
      h: 2.48,
      markup: visualMotifSvg(theme, title),
      name: `${title} visual motif`,
    }),
    text({
      x: 0.92,
      y: 0.92,
      w: 1.62,
      h: 0.22,
      value: "OVERVIEW",
      size: 7.5,
      color: theme.accent,
      bold: true,
      letterSpacing: 180,
      wrap: "none",
    }),
    text({
      x: 0.88,
      y: 1.28,
      w: 4.34,
      h: 1.44,
      value: title,
      size: 32,
      color: "FFFFFF",
      bold: true,
      lineHeight: 1.04,
      maxLength: 74,
    }),
    text({
      x: 0.92,
      y: 2.92,
      w: 4.02,
      h: 0.64,
      value: subtitle,
      size: 11.5,
      color: "CBD5E1",
      lineHeight: 1.26,
      maxLength: 145,
    }),
    ...optionalCoverElements,
    line({
      x: 5.72,
      y: 0.52,
      w: 0.01,
      h: 4.58,
      color: darkLine,
      width: 0.7,
    }),
    footer(index, slideCount, theme),
  ]);
}

function buildTimelineSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = timelineItems(content).slice(0, 5);
  const count = Math.max(1, items.length);
  const track = { x: 0.74, y: 3.05, w: 8.52 };
  const topChildren: SlideElement[] = items.map((item, itemIndex) =>
    itemIndex % 2 === 0
      ? timelineCard(item, 1.48, 1.1, theme, itemIndex)
      : emptyContainer(),
  );
  const bottomChildren: SlideElement[] = items.map((item, itemIndex) =>
    itemIndex % 2 === 1
      ? timelineCard(item, 1.48, 1.1, theme, itemIndex)
      : emptyContainer(),
  );

  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "TIMELINE"),
    line({
      x: track.x,
      y: track.y,
      w: track.w,
      h: 0.01,
      color: theme.ink,
      width: 0.8,
      dash: [4, 5],
    }),
    ...items.flatMap((item, itemIndex) => {
      const dotX = track.x + ((itemIndex + 0.5) * track.w) / count - 0.12;
      const accent = theme.accents[itemIndex % theme.accents.length];
      return [
        ellipse({
          x: dotX,
          y: track.y - 0.12,
          w: 0.24,
          h: 0.24,
          fill: accent,
          stroke: { color: "FFFFFF", width: 1.2 },
        }),
        text({
          x: dotX - 0.39,
          y: track.y + (itemIndex % 2 === 0 ? 0.28 : -0.47),
          w: 1.02,
          h: 0.18,
          value: item.marker,
          size: 8,
          color: theme.muted,
          bold: true,
          align: "center",
          wrap: "none",
          maxLength: 18,
        }),
      ];
    }),
    {
      type: "grid",
      position: { x: 0.68, y: 1.62 },
      size: { width: 8.64, height: 1.12 },
      columns: count,
      rows: 1,
      gap: 0.18,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: topChildren,
    } satisfies GridElement,
    {
      type: "grid",
      position: { x: 0.68, y: 3.54 },
      size: { width: 8.64, height: 1.12 },
      columns: count,
      rows: 1,
      gap: 0.18,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: bottomChildren,
    } satisfies GridElement,
    footer(index, slideCount, theme),
  ]);
}

function buildMetricsSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  if (looksLikeFunnelLayout(content)) {
    return buildFunnelMetricSlide(content, index, slideCount, theme);
  }
  if (looksLikeMetricImageLayout(content)) {
    return buildMetricImageSlide(content, index, slideCount, theme);
  }
  if (looksLikeMetricNarrativeLayout(content)) {
    return buildMetricNarrativeSlide(content, index, slideCount, theme);
  }
  if (slideVariant(content, index, slideCount) !== 0) {
    return buildMetricDashboardSlide(content, index, slideCount, theme);
  }
  const title = slideTitle(content, index);
  const metrics = metricItems(content).slice(0, 6);
  const columns = metrics.length <= 4 ? 2 : 3;
  const rows = Math.ceil(metrics.length / columns);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "METRICS"),
    {
      type: "grid",
      position: { x: 0.72, y: 1.64 },
      size: { width: 8.56, height: 3.26 },
      columns,
      rows,
      gap: 0.2,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: metrics.map((metric, metricIndex) =>
        metricCard(metric, columns === 2 ? 4.18 : 2.72, 1.48, theme, metricIndex),
      ),
    } satisfies GridElement,
    footer(index, slideCount, theme),
  ]);
}

function buildMetricDashboardSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const metrics = metricItems(content).slice(0, 6);
  const hero = metrics[0] ?? fallbackMetrics(index)[0];
  const rest = metrics.slice(1, 5);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "SIGNALS"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.22,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 3.55,
          h: 3.26,
          fill: "111827",
          stroke: "273449",
          children: [
            text({
              x: 0.36,
              y: 0.38,
              w: 1.46,
              h: 0.2,
              value: "PRIMARY SIGNAL",
              size: 7.5,
              color: theme.accent,
              bold: true,
              letterSpacing: 160,
              wrap: "none",
            }),
            text({
              x: 0.34,
              y: 0.92,
              w: 2.54,
              h: 0.72,
              value: hero.value,
              size: 40,
              color: "FFFFFF",
              bold: true,
              wrap: "none",
              maxLength: 18,
            }),
            text({
              x: 0.38,
              y: 1.78,
              w: 2.44,
              h: 0.28,
              value: hero.label,
              size: 12,
              color: "E2E8F0",
              bold: true,
              maxLength: 40,
            }),
            text({
              x: 0.38,
              y: 2.22,
              w: 2.42,
              h: 0.44,
              value: hero.description ?? content.body?.[0] ?? "Priority indicator",
              size: 8.5,
              color: "CBD5E1",
              lineHeight: 1.18,
              maxLength: 84,
            }),
          ],
        }),
        {
          ...containerCard({
            w: 4.78,
            h: 3.26,
            fill: theme.card,
            stroke: theme.line,
            children: [
              {
                type: "grid",
                position: { x: 0.24, y: 0.26 },
                size: { width: 4.3, height: 2.72 },
                columns: 2,
                rows: 2,
                gap: 0.18,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: rest.map((metric, metricIndex) =>
                  metricCard(metric, 2.06, 1.25, theme, metricIndex + 1),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 4.78 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildMetricNarrativeSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content).slice(0, 4);
  const metrics = metricItems(content).slice(0, 4);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "MEASURES"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.24,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 4.78,
          h: 3.26,
          fill: theme.card,
          stroke: theme.line,
          children: [
            rect({ x: 0.34, y: 0.3, w: 0.74, h: 0.05, fill: theme.primary, r: 0.02 }),
            text({
              x: 0.34,
              y: 0.58,
              w: 3.64,
              h: 0.62,
              value: items[0]?.title ?? "What the numbers mean",
              size: 22,
              color: theme.ink,
              bold: true,
              lineHeight: 1.06,
              maxLength: 58,
            }),
            text({
              x: 0.36,
              y: 1.34,
              w: 3.82,
              h: 0.68,
              value:
                items[0]?.body ??
                content.body?.[0] ??
                "Use the metric set to anchor the decision and explain the trade-off.",
              size: 10.5,
              color: theme.muted,
              lineHeight: 1.22,
              maxLength: 135,
            }),
            bullets({
              x: 0.42,
              y: 2.18,
              w: 3.78,
              h: 0.74,
              items: items.slice(1).map((item) => item.title),
              size: 8.8,
              color: theme.muted,
              marker: "number",
            }),
          ],
        }),
        {
          ...containerCard({
            w: 3.54,
            h: 3.26,
            fill: "111827",
            stroke: "273449",
            children: [
              text({
                x: 0.3,
                y: 0.28,
                w: 2.3,
                h: 0.2,
                value: "SIGNAL STACK",
                size: 7.3,
                color: theme.accent,
                bold: true,
                letterSpacing: 150,
                wrap: "none",
              }),
              {
                type: "grid",
                position: { x: 0.28, y: 0.68 },
                size: { width: 2.98, height: 2.24 },
                columns: 1,
                rows: Math.max(1, metrics.length),
                gap: 0.12,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: metrics.map((metric, metricIndex) =>
                  darkMetricStrip(metric, 2.98, 0.46, theme, metricIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 3.54 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildMetricImageSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const metrics = metricItems(content).slice(0, 4);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "PROOF"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.26,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 4.18,
          h: 3.26,
          fill: theme.soft,
          stroke: theme.line,
          children: [
            svg({
              x: 0.28,
              y: 0.28,
              w: 3.62,
              h: 2.64,
              markup: visualMotifSvg(theme, content.imagePrompt || title),
              name: content.imagePrompt || `${title} metric visual`,
            }),
          ],
        }),
        {
          ...containerCard({
            w: 4.12,
            h: 3.26,
            fill: theme.card,
            stroke: theme.line,
            children: [
              rect({ x: 0.28, y: 0.28, w: 0.7, h: 0.05, fill: theme.secondary, r: 0.02 }),
              text({
                x: 0.28,
                y: 0.56,
                w: 3.12,
                h: 0.46,
                value: "Measured impact",
                size: 19,
                color: theme.ink,
                bold: true,
                maxLength: 42,
              }),
              {
                type: "grid",
                position: { x: 0.28, y: 1.22 },
                size: { width: 3.56, height: 1.72 },
                columns: 2,
                rows: 2,
                gap: 0.16,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: metrics.map((metric, metricIndex) =>
                  metricTile(metric, 1.7, 0.78, theme, metricIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 4.12 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildFunnelMetricSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const metrics = metricItems(content).slice(0, 4);
  const hero = metrics[0] ?? fallbackMetrics(index)[0];
  const stages = funnelStages(content, metrics).slice(0, 5);
  const maxValue = Math.max(1, ...stages.map((stage) => Math.abs(stage.value)));

  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "FUNNEL"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.24,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 3.2,
          h: 3.26,
          fill: "111827",
          stroke: "273449",
          children: [
            text({
              x: 0.34,
              y: 0.36,
              w: 1.76,
              h: 0.2,
              value: "HEADLINE",
              size: 7.4,
              color: theme.accent,
              bold: true,
              letterSpacing: 150,
              wrap: "none",
            }),
            text({
              x: 0.32,
              y: 0.86,
              w: 2.32,
              h: 0.72,
              value: hero.value,
              size: 38,
              color: "FFFFFF",
              bold: true,
              wrap: "none",
              maxLength: 18,
            }),
            text({
              x: 0.36,
              y: 1.72,
              w: 2.22,
              h: 0.32,
              value: hero.label,
              size: 12,
              color: "E2E8F0",
              bold: true,
              maxLength: 38,
            }),
            text({
              x: 0.36,
              y: 2.2,
              w: 2.2,
              h: 0.48,
              value: hero.description ?? content.body?.[0] ?? "Primary conversion signal",
              size: 8.5,
              color: "CBD5E1",
              lineHeight: 1.16,
              maxLength: 82,
            }),
          ],
        }),
        {
          ...containerCard({
            w: 5.12,
            h: 3.26,
            fill: theme.card,
            stroke: theme.line,
            children: [
              text({
                x: 0.3,
                y: 0.26,
                w: 2.6,
                h: 0.26,
                value: content.chart?.title ?? "Stage progression",
                size: 13,
                color: theme.ink,
                bold: true,
                maxLength: 46,
              }),
              ...stages.flatMap((stage, stageIndex) => {
                const y = 0.72 + stageIndex * 0.46;
                const fillWidth = 0.72 + (Math.abs(stage.value) / maxValue) * 3.1;
                return [
                  text({
                    x: 0.32,
                    y: y + 0.02,
                    w: 1.28,
                    h: 0.18,
                    value: stage.label,
                    size: 8,
                    color: theme.muted,
                    bold: true,
                    maxLength: 24,
                  }),
                  rect({
                    x: 1.72,
                    y,
                    w: 3.18,
                    h: 0.24,
                    fill: theme.soft,
                    r: 0.08,
                  }),
                  rect({
                    x: 1.72,
                    y,
                    w: Math.min(3.18, fillWidth),
                    h: 0.24,
                    fill: theme.accents[stageIndex % theme.accents.length],
                    r: 0.08,
                  }),
                  text({
                    x: 4.12,
                    y: y + 0.03,
                    w: 0.68,
                    h: 0.18,
                    value: formatNumericLabel(stage.value),
                    size: 7.5,
                    color: fillWidth > 2.1 ? "FFFFFF" : theme.ink,
                    bold: true,
                    align: "right",
                    wrap: "none",
                  }),
                ];
              }),
            ],
          }),
          layout: { grow: 1, basis: 5.12 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildCardsSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  if (looksLikeTeamLayout(content)) {
    return buildTeamSlide(content, index, slideCount, theme);
  }
  if (looksLikeBulletLayout(content)) {
    return buildBulletSlide(content, index, slideCount, theme);
  }
  if (looksLikeQuoteLayout(content)) {
    return buildQuoteSlide(content, index, slideCount, theme);
  }
  if (looksLikeVisualSplit(content)) {
    return buildVisualSplitSlide(content, index, slideCount, theme);
  }
  if (looksLikeSpotlightLayout(content)) {
    return buildSpotlightSlide(content, index, slideCount, theme);
  }
  if (looksLikeColumnCardLayout(content)) {
    return buildColumnCardsSlide(content, index, slideCount, theme);
  }
  const variant = slideVariant(content, index, slideCount);
  if (variant === 1) {
    return buildSpotlightSlide(content, index, slideCount, theme);
  }
  if (variant === 2) {
    return buildSplitNarrativeSlide(content, index, slideCount, theme);
  }
  return buildCardGridSlide(content, index, slideCount, theme);
}

function buildCardGridSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content).slice(0, 6);
  const columns = items.length <= 2 ? 2 : items.length <= 4 ? 2 : 3;
  const rows = Math.ceil(items.length / columns);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "INSIGHTS"),
    {
      type: "grid",
      position: { x: 0.72, y: 1.64 },
      size: { width: 8.56, height: 3.2 },
      columns,
      rows,
      gap: 0.2,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: items.map((item, itemIndex) =>
        insightCard(item, columns === 3 ? 2.72 : 4.18, rows === 1 ? 2.2 : 1.5, theme, itemIndex),
      ),
    } satisfies GridElement,
    footer(index, slideCount, theme),
  ]);
}

function buildColumnCardsSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content).slice(0, 3);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "FRAMEWORK"),
    {
      type: "grid",
      position: { x: 0.72, y: 1.62 },
      size: { width: 8.56, height: 3.22 },
      columns: Math.max(1, items.length),
      rows: 1,
      gap: 0.2,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: items.map((item, itemIndex) =>
        columnInsightCard(item, 2.72, 3.1, theme, itemIndex),
      ),
    } satisfies GridElement,
    footer(index, slideCount, theme),
  ]);
}

function buildBulletSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  if (looksLikeNumberedBulletLayout(content)) {
    return buildNumberedBulletSlide(content, index, slideCount, theme);
  }
  return buildIconBulletSlide(content, index, slideCount, theme);
}

function buildNumberedBulletSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content).slice(0, 4);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "STEPS"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.24,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 3.16,
          h: 3.26,
          fill: theme.surface,
          stroke: theme.line,
          children: [
            rect({ x: 0.3, y: 0.3, w: 0.66, h: 0.05, fill: theme.accent, r: 0.02 }),
            text({
              x: 0.3,
              y: 0.62,
              w: 2.34,
              h: 0.74,
              value: items[0]?.title ?? "Decision path",
              size: 23,
              color: theme.ink,
              bold: true,
              lineHeight: 1.05,
              maxLength: 52,
            }),
            text({
              x: 0.32,
              y: 1.56,
              w: 2.26,
              h: 0.72,
              value:
                items[0]?.body ??
                content.body?.[0] ??
                "Organize the sequence into clear actions the audience can follow.",
              size: 9.5,
              color: theme.muted,
              lineHeight: 1.22,
              maxLength: 118,
            }),
            rect({ x: 0.32, y: 2.64, w: 1.7, h: 0.05, fill: theme.primary, opacity: 0.22, r: 0.02 }),
          ],
        }),
        {
          ...containerCard({
            w: 5.16,
            h: 3.26,
            fill: theme.card,
            stroke: theme.line,
            children: [
              {
                type: "grid",
                position: { x: 0.24, y: 0.24 },
                size: { width: 4.68, height: 2.78 },
                columns: 2,
                rows: 2,
                gap: 0.16,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: items.map((item, itemIndex) =>
                  numberedItemCard(item, 2.26, 1.31, theme, itemIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 5.16 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildIconBulletSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content).slice(0, 4);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "ACTIONS"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.28,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 3.62,
          h: 3.26,
          fill: theme.soft,
          stroke: theme.line,
          children: [
            svg({
              x: 0.28,
              y: 0.3,
              w: 3.06,
              h: 2.58,
              markup: visualMotifSvg(theme, content.imagePrompt || title),
              name: content.imagePrompt || `${title} action visual`,
            }),
          ],
        }),
        {
          ...containerCard({
            w: 4.66,
            h: 3.26,
            fill: theme.card,
            stroke: theme.line,
            children: [
              {
                type: "grid",
                position: { x: 0.26, y: 0.28 },
                size: { width: 4.14, height: 2.72 },
                columns: 1,
                rows: Math.max(1, items.length),
                gap: 0.14,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: items.map((item, itemIndex) =>
                  iconBulletCard(item, 4.14, 0.58, theme, itemIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 4.66 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildSpotlightSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content);
  const hero = items[0] ?? { title, body: content.body?.[0] ?? title };
  const support = items.slice(1, 5);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "STORY"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.22,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 5.08,
          h: 3.26,
          fill: "111827",
          stroke: "273449",
          children: [
            rect({ x: 0.34, y: 0.32, w: 0.72, h: 0.05, fill: theme.accent, r: 0.02 }),
            text({
              x: 0.34,
              y: 0.58,
              w: 4.16,
              h: 0.86,
              value: hero.title,
              size: 25,
              color: "FFFFFF",
              bold: true,
              lineHeight: 1.04,
              maxLength: 62,
            }),
            text({
              x: 0.36,
              y: 1.64,
              w: 3.78,
              h: 0.76,
              value: hero.body,
              size: 11,
              color: "CBD5E1",
              lineHeight: 1.24,
              maxLength: 150,
            }),
            {
              type: "flex",
              position: { x: 0.36, y: 2.62 },
              size: { width: 3.94, height: 0.3 },
              direction: "row",
              gap: 0.1,
              alignItems: "stretch",
              justifyContent: "flex-start",
              children: theme.accents.slice(0, 4).map((accent) =>
                rect({ x: 0, y: 0, w: 0.48, h: 0.08, fill: accent, r: 0.03 }),
              ),
            } satisfies FlexElement,
          ],
        }),
        {
          ...containerCard({
            w: 3.26,
            h: 3.26,
            fill: theme.surface,
            stroke: theme.line,
            children: [
              text({
                x: 0.26,
                y: 0.24,
                w: 2.22,
                h: 0.24,
                value: "What supports it",
                size: 12.5,
                color: theme.ink,
                bold: true,
              }),
              {
                type: "grid",
                position: { x: 0.26, y: 0.66 },
                size: { width: 2.74, height: 2.28 },
                columns: 1,
                rows: Math.max(1, support.length),
                gap: 0.12,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: support.map((item, itemIndex) =>
                  compactCard(item, 2.74, 0.5, theme, itemIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 3.26 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildSplitNarrativeSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content).slice(0, 4);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "NARRATIVE"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.24,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 3.18,
          h: 3.26,
          fill: theme.surface,
          stroke: theme.line,
          children: [
            rect({ x: 0.28, y: 0.28, w: 0.62, h: 0.05, fill: theme.primary, r: 0.02 }),
            text({
              x: 0.28,
              y: 0.56,
              w: 2.36,
              h: 0.72,
              value: items[0]?.title ?? title,
              size: 21,
              color: theme.ink,
              bold: true,
              lineHeight: 1.05,
              maxLength: 54,
            }),
            bullets({
              x: 0.34,
              y: 1.52,
              w: 2.34,
              h: 1.2,
              items: items.slice(1, 4).map((item) => item.title),
              size: 9.2,
              color: theme.muted,
              marker: "bullet",
            }),
          ],
        }),
        {
          ...containerCard({
            w: 5.14,
            h: 3.26,
            fill: theme.card,
            stroke: theme.line,
            children: [
              {
                type: "grid",
                position: { x: 0.22, y: 0.22 },
                size: { width: 4.7, height: 2.82 },
                columns: 2,
                rows: 2,
                gap: 0.16,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: items.map((item, itemIndex) =>
                  insightCard(item, 2.24, 1.32, theme, itemIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 5.14 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildTeamSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const members = createCardItems(content).slice(0, 4);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "TEAM"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.24,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 3.18,
          h: 3.26,
          fill: "111827",
          stroke: "273449",
          children: [
            rect({ x: 0.32, y: 0.32, w: 0.72, h: 0.05, fill: theme.accent, r: 0.02 }),
            text({
              x: 0.32,
              y: 0.64,
              w: 2.34,
              h: 0.82,
              value: members[0]?.title ?? "Core team",
              size: 24,
              color: "FFFFFF",
              bold: true,
              lineHeight: 1.04,
              maxLength: 54,
            }),
            text({
              x: 0.34,
              y: 1.66,
              w: 2.24,
              h: 0.76,
              value:
                content.body?.[0] ??
                members[0]?.body ??
                "Introduce the people or roles behind the plan.",
              size: 9.4,
              color: "CBD5E1",
              lineHeight: 1.2,
              maxLength: 118,
            }),
            text({
              x: 0.34,
              y: 2.66,
              w: 1.64,
              h: 0.2,
              value: `${members.length || 1} contributors`,
              size: 8.2,
              color: theme.accent,
              bold: true,
              wrap: "none",
            }),
          ],
        }),
        {
          ...containerCard({
            w: 5.14,
            h: 3.26,
            fill: theme.card,
            stroke: theme.line,
            children: [
              {
                type: "grid",
                position: { x: 0.24, y: 0.24 },
                size: { width: 4.66, height: 2.78 },
                columns: 2,
                rows: 2,
                gap: 0.16,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: members.map((member, memberIndex) =>
                  teamMemberCard(member, 2.25, 1.31, theme, memberIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 5.14 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildQuoteSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const quote = quoteText(content);
  const author =
    content.body?.[1] ??
    content.bullets?.[0] ??
    "Generated insight";
  const background = "111827";
  const overlay = "0B1220";

  return adaptiveSlide(title, theme, [
    rect({ x: 0, y: 0, w: 10, h: 5.625, fill: background }),
    svg({
      x: 4.9,
      y: 0.28,
      w: 4.72,
      h: 4.86,
      markup: visualMotifSvg(theme, content.imagePrompt || title),
      name: content.imagePrompt || `${title} visual`,
    }),
    rect({ x: 0, y: 0, w: 10, h: 5.625, fill: overlay, opacity: 0.74 }),
    rect({ x: 0.66, y: 1.18, w: 0.84, h: 0.06, fill: theme.accent, r: 0.02 }),
    text({
      x: 0.66,
      y: 0.78,
      w: 4.4,
      h: 0.34,
      value: title,
      size: 17,
      color: "FFFFFF",
      bold: true,
      maxLength: 52,
    }),
    text({
      x: 0.66,
      y: 1.62,
      w: 5.92,
      h: 1.86,
      value: quote,
      size: 27,
      color: "FFFFFF",
      bold: true,
      lineHeight: 1.12,
      maxLength: 160,
    }),
    rect({ x: 0.7, y: 3.84, w: 0.5, h: 0.04, fill: theme.primary, r: 0.02 }),
    text({
      x: 1.32,
      y: 3.72,
      w: 3.82,
      h: 0.34,
      value: author,
      size: 11.2,
      color: "CBD5E1",
      bold: true,
      maxLength: 72,
    }),
    text({
      x: 8.62,
      y: 5.18,
      w: 0.72,
      h: 0.18,
      value: `${String(index + 1).padStart(2, "0")}/${String(slideCount).padStart(2, "0")}`,
      size: 7.5,
      color: "CBD5E1",
      bold: true,
      align: "right",
      wrap: "none",
    }),
  ]);
}

function buildVisualSplitSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const items = createCardItems(content).slice(0, 3);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "VISUAL"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.26 },
      direction: "row",
      gap: 0.26,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 4.0,
          h: 3.26,
          fill: theme.card,
          stroke: theme.line,
          children: [
            rect({ x: 0.28, y: 0.28, w: 0.68, h: 0.05, fill: theme.primary, r: 0.02 }),
            text({
              x: 0.28,
              y: 0.58,
              w: 3.18,
              h: 0.62,
              value: items[0]?.title ?? title,
              size: 22,
              color: theme.ink,
              bold: true,
              lineHeight: 1.06,
              maxLength: 56,
            }),
            text({
              x: 0.3,
              y: 1.42,
              w: 3.1,
              h: 0.76,
              value: items[0]?.body ?? content.body?.[0] ?? title,
              size: 10.5,
              color: theme.muted,
              lineHeight: 1.24,
              maxLength: 145,
            }),
            bullets({
              x: 0.34,
              y: 2.36,
              w: 3.0,
              h: 0.58,
              items: items.slice(1).map((item) => item.title),
              size: 8.8,
              color: theme.muted,
              marker: "bullet",
            }),
          ],
        }),
        {
          ...containerCard({
            w: 4.3,
            h: 3.26,
            fill: theme.soft,
            stroke: theme.line,
            children: [
              svg({
                x: 0.28,
                y: 0.28,
                w: 3.74,
                h: 2.64,
                markup: visualMotifSvg(theme, content.imagePrompt || title),
                name: content.imagePrompt || `${title} visual`,
              }),
            ],
          }),
          layout: { grow: 1, basis: 4.3 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildChartSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  if (looksLikeFullWidthChartLayout(content)) {
    return buildFullWidthChartSlide(content, index, slideCount, theme);
  }
  if (looksLikeMultiChartLayout(content)) {
    return buildChartDashboardSlide(content, index, slideCount, theme);
  }
  const title = slideTitle(content, index);
  const chartContent = content.chart ?? fallbackChart(title);
  const insights = createCardItems(content).slice(0, 3);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "DATA"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.3 },
      direction: "row",
      gap: 0.22,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 5.35,
          h: 3.3,
          fill: theme.card,
          stroke: theme.line,
          children: [
            text({
              x: 0.28,
              y: 0.24,
              w: 4.1,
              h: 0.28,
              value: chartContent.title || title,
              size: 13,
              color: theme.ink,
              bold: true,
              maxLength: 58,
            }),
            chart({
              x: 0.18,
              y: 0.64,
              w: 4.92,
              h: 2.36,
              title: chartContent.title || title,
              type: chartContent.type ?? "bar",
              color: theme.primary,
              data: chartContent.data,
              theme,
            }),
          ],
        }),
        {
          ...containerCard({
            w: 2.98,
            h: 3.3,
            fill: theme.surface,
            stroke: theme.line,
            children: [
              text({
                x: 0.28,
                y: 0.24,
                w: 2.1,
                h: 0.28,
                value: "Key takeaways",
                size: 13,
                color: theme.ink,
                bold: true,
              }),
              bullets({
                x: 0.32,
                y: 0.76,
                w: 2.22,
                h: 1.52,
                items: insights.map((item) => item.title || item.body),
                size: 9.5,
                color: theme.muted,
                marker: "bullet",
              }),
              ...metricItems(content)
                .slice(0, 1)
                .flatMap((metric, metricIndex) =>
                  metricMiniBlock(metric, 0.3, 2.56, theme, metricIndex),
                ),
            ],
          }),
          layout: { grow: 1, basis: 2.98 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildFullWidthChartSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const chartContent = content.chart ?? fallbackChart(title);
  const insights = createCardItems(content).slice(0, 3);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "TREND"),
    {
      ...containerCard({
        w: 8.56,
        h: 2.72,
        fill: theme.card,
        stroke: theme.line,
        children: [
          chart({
            x: 0.22,
            y: 0.18,
            w: 8.08,
            h: 2.28,
            title: chartContent.title || title,
            type: chartContent.type ?? "bar",
            color: theme.primary,
            data: chartContent.data,
            theme,
          }),
        ],
      }),
      position: { x: 0.72, y: 1.58 },
    },
    {
      type: "grid",
      position: { x: 0.72, y: 4.42 },
      size: { width: 8.56, height: 0.48 },
      columns: Math.max(1, insights.length),
      rows: 1,
      gap: 0.16,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: insights.map((item, itemIndex) =>
        compactCard(item, 2.76, 0.48, theme, itemIndex),
      ),
    } satisfies GridElement,
    footer(index, slideCount, theme),
  ]);
}

function buildChartDashboardSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const chartContent = content.chart ?? fallbackChart(title);
  const metrics = metricItems(content).slice(0, 4);
  const insights = createCardItems(content).slice(0, 2);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "DASHBOARD"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.28 },
      direction: "row",
      gap: 0.2,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 5.2,
          h: 3.28,
          fill: theme.card,
          stroke: theme.line,
          children: [
            text({
              x: 0.28,
              y: 0.24,
              w: 3.52,
              h: 0.24,
              value: chartContent.title || title,
              size: 12.5,
              color: theme.ink,
              bold: true,
              maxLength: 54,
            }),
            chart({
              x: 0.18,
              y: 0.62,
              w: 4.82,
              h: 1.8,
              title: chartContent.title || title,
              type: chartContent.type ?? "bar",
              color: theme.primary,
              data: chartContent.data,
              theme,
            }),
            {
              type: "grid",
              position: { x: 0.24, y: 2.58 },
              size: { width: 4.62, height: 0.44 },
              columns: Math.max(1, insights.length),
              rows: 1,
              gap: 0.12,
              alignItems: "stretch",
              justifyItems: "stretch",
              children: insights.map((item, itemIndex) =>
                compactCard(item, 2.22, 0.44, theme, itemIndex),
              ),
            } satisfies GridElement,
          ],
        }),
        {
          ...containerCard({
            w: 3.12,
            h: 3.28,
            fill: "111827",
            stroke: "273449",
            children: [
              text({
                x: 0.26,
                y: 0.26,
                w: 1.66,
                h: 0.2,
                value: "KPIS",
                size: 7.5,
                color: theme.accent,
                bold: true,
                letterSpacing: 150,
                wrap: "none",
              }),
              {
                type: "grid",
                position: { x: 0.24, y: 0.66 },
                size: { width: 2.64, height: 2.28 },
                columns: 1,
                rows: Math.max(1, metrics.length),
                gap: 0.12,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: metrics.map((metric, metricIndex) =>
                  darkMetricStrip(metric, 2.64, 0.48, theme, metricIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 3.12 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildTableSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = slideTitle(content, index);
  const tableContent = normalizeGeneratedTable(content.table ?? fallbackTable(title));
  const notes = createCardItems(content).slice(0, 3);
  return adaptiveSlide(title, theme, [
    ...header(title, content.body?.[0], theme, "COMPARISON"),
    {
      type: "flex",
      position: { x: 0.72, y: 1.58 },
      size: { width: 8.56, height: 3.3 },
      direction: "row",
      gap: 0.22,
      alignItems: "stretch",
      justifyContent: "stretch",
      children: [
        containerCard({
          w: 5.75,
          h: 3.3,
          fill: theme.card,
          stroke: theme.line,
          children: [
            table({
              x: 0.22,
              y: 0.24,
              w: 5.3,
              h: 2.8,
              columns: tableContent.columns,
              rows: tableContent.rows,
              theme,
            }),
          ],
        }),
        {
          ...containerCard({
            w: 2.58,
            h: 3.3,
            fill: theme.surface,
            stroke: theme.line,
            children: [
              text({
                x: 0.26,
                y: 0.28,
                w: 1.9,
                h: 0.26,
                value: "Notes",
                size: 13,
                color: theme.ink,
                bold: true,
              }),
              {
                type: "grid",
                position: { x: 0.24, y: 0.78 },
                size: { width: 2.1, height: 2.12 },
                columns: 1,
                rows: notes.length,
                gap: 0.12,
                alignItems: "stretch",
                justifyItems: "stretch",
                children: notes.map((item, itemIndex) =>
                  compactCard(item, 2.1, 0.62, theme, itemIndex),
                ),
              } satisfies GridElement,
            ],
          }),
          layout: { grow: 1, basis: 2.58 },
        },
      ],
    } satisfies FlexElement,
    footer(index, slideCount, theme),
  ]);
}

function buildClosingSlide(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): Slide {
  const title = truncateText(content.title || "Next Steps", 56);
  const items = createCardItems(content).slice(0, 4);
  return adaptiveSlide(title, theme, [
    text({
      x: 0.82,
      y: 0.76,
      w: 5.6,
      h: 0.72,
      value: title,
      size: 30,
      color: theme.ink,
      bold: true,
      lineHeight: 1.05,
      maxLength: 64,
    }),
    text({
      x: 0.84,
      y: 1.58,
      w: 4.8,
      h: 0.54,
      value: content.body?.[0] ?? "Align on the next decision and owner.",
      size: 12,
      color: theme.muted,
      lineHeight: 1.25,
      maxLength: 130,
    }),
    {
      type: "grid",
      position: { x: 0.82, y: 2.42 },
      size: { width: 8.36, height: 1.92 },
      columns: 4,
      rows: 1,
      gap: 0.18,
      alignItems: "stretch",
      justifyItems: "stretch",
      children: items.map((item, itemIndex) =>
        insightCard(item, 1.95, 1.72, theme, itemIndex),
      ),
    } satisfies GridElement,
    rect({
      x: 0.84,
      y: 4.74,
      w: 8.24,
      h: 0.05,
      fill: theme.primary,
      opacity: 0.25,
      r: 0.02,
    }),
    footer(index, slideCount, theme),
  ]);
}

function adaptiveSlide(
  title: string,
  theme: AdaptiveTheme,
  elements: SlideElement[],
): Slide {
  return {
    title: truncateText(title, 60),
    background: theme.background,
    elements,
  };
}

function header(
  title: string,
  subtitle: string | undefined,
  theme: AdaptiveTheme,
  label: string,
): SlideElement[] {
  const leftWidth = subtitle ? 5.28 : 8.56;
  const subtitleColumn = subtitle
    ? [
        {
          ...group(0, 0, 3.04, 1.08, [
            text({
              x: 0,
              y: 0.35,
              w: 3.0,
              h: 0.58,
              value: subtitle,
              size: 8.8,
              color: theme.muted,
              lineHeight: 1.22,
              maxLength: 122,
            }),
          ]),
          layout: { basis: 3.04, shrink: 0 },
        },
      ]
    : [];

  return [
    {
      type: "flex",
      position: { x: 0.68, y: 0.5 },
      size: { width: 8.56, height: 1.18 },
      direction: "row",
      gap: 0.34,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      children: [
        {
          ...group(0, 0, leftWidth, 1.18, [
            text({
              x: 0,
              y: 0,
              w: 1.48,
              h: 0.18,
              value: label,
              size: 7.5,
              color: theme.primary,
              bold: true,
              letterSpacing: 180,
              wrap: "none",
            }),
            text({
              x: 0,
              y: 0.3,
              w: leftWidth,
              h: 0.76,
              value: title,
              size: title.length > 42 ? 20 : 22,
              color: theme.ink,
              bold: true,
              lineHeight: 1.04,
              maxLength: 68,
            }),
            rect({
              x: 0,
              y: 1.1,
              w: 0.92,
              h: 0.045,
              fill: theme.accent,
              r: 0.02,
            }),
          ]),
          layout: { basis: leftWidth, shrink: 0 },
        },
        ...subtitleColumn,
      ],
    } satisfies FlexElement,
  ];
}

function footer(
  index: number,
  slideCount: number,
  theme: AdaptiveTheme,
): SlideElement {
  return text({
    x: 8.62,
    y: 5.18,
    w: 0.72,
    h: 0.18,
    value: `${String(index + 1).padStart(2, "0")}/${String(slideCount).padStart(2, "0")}`,
    size: 7.5,
    color: theme.muted,
    bold: true,
    align: "right",
    wrap: "none",
  });
}

function insightCard(
  item: CardItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  return containerCard({
    w,
    h,
    fill: theme.card,
    stroke: theme.line,
    children: [
      rect({ x: 0.22, y: 0.2, w: 0.5, h: 0.045, fill: accent, r: 0.02 }),
      text({
        x: w - 0.58,
        y: 0.16,
        w: 0.34,
        h: 0.2,
        value: String(index + 1).padStart(2, "0"),
        size: 8,
        color: theme.muted,
        bold: true,
        align: "right",
        wrap: "none",
      }),
      text({
        x: 0.22,
        y: 0.48,
        w: w - 0.48,
        h: h > 1.7 ? 0.5 : 0.36,
        value: item.title,
        size: h > 1.7 ? 16 : 13,
        color: theme.ink,
        bold: true,
        lineHeight: 1.08,
        maxLength: h > 1.7 ? 48 : 38,
      }),
      text({
        x: 0.22,
        y: h > 1.7 ? 1.2 : 0.92,
        w: w - 0.48,
        h: h > 1.7 ? h - 1.45 : h - 1.08,
        value: item.body,
        size: 9,
        color: theme.muted,
        lineHeight: 1.22,
        maxLength: h > 1.7 ? 112 : 82,
      }),
    ],
  });
}

function compactCard(
  item: CardItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  return containerCard({
    w,
    h,
    fill: "FFFFFF",
    stroke: theme.line,
    r: 0.08,
    children: [
      ellipse({
        x: 0.18,
        y: 0.16,
        w: 0.18,
        h: 0.18,
        fill: theme.accents[index % theme.accents.length],
      }),
      text({
        x: 0.48,
        y: 0.12,
        w: w - 0.68,
        h: 0.18,
        value: item.title,
        size: 9,
        color: theme.ink,
        bold: true,
        maxLength: 36,
      }),
      text({
        x: 0.48,
        y: 0.33,
        w: w - 0.68,
        h: Math.max(0.12, h - 0.4),
        value: item.body,
        size: 7,
        color: theme.muted,
        lineHeight: 1.15,
        maxLength: 60,
      }),
    ],
  });
}

function coverPointCard(
  item: CardItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
  onDark: boolean,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  return containerCard({
    w,
    h,
    fill: onDark ? "1F2937" : "FFFFFF",
    stroke: onDark ? "334155" : theme.line,
    r: 0.08,
    children: [
      rect({ x: 0.14, y: 0.13, w: 0.32, h: 0.035, fill: accent, r: 0.02 }),
      text({
        x: 0.14,
        y: 0.27,
        w: w - 0.28,
        h: 0.2,
        value: item.title,
        size: onDark ? 7.8 : 8.5,
        color: onDark ? "F8FAFC" : theme.ink,
        bold: true,
        maxLength: onDark ? 22 : 34,
      }),
      text({
        x: 0.14,
        y: 0.47,
        w: w - 0.28,
        h: Math.max(0.1, h - 0.52),
        value: item.body,
        size: 6.3,
        color: onDark ? "CBD5E1" : theme.muted,
        lineHeight: 1.12,
        maxLength: onDark ? 42 : 58,
      }),
    ],
  });
}

function timelineCard(
  item: TimelineItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  return containerCard({
    w,
    h,
    fill: theme.card,
    stroke: theme.line,
    r: 0.1,
    children: [
      text({
        x: 0.18,
        y: 0.18,
        w: w - 0.36,
        h: 0.28,
        value: item.title,
        size: 10.5,
        color: theme.ink,
        bold: true,
        lineHeight: 1.08,
        maxLength: 34,
      }),
      text({
        x: 0.18,
        y: 0.56,
        w: w - 0.36,
        h: 0.36,
        value: item.description || item.marker,
        size: 7.5,
        color: theme.muted,
        lineHeight: 1.18,
        maxLength: 64,
      }),
      rect({
        x: 0,
        y: 0,
        w: 0.06,
        h,
        fill: theme.accents[index % theme.accents.length],
        r: 0.02,
      }),
    ],
  });
}

function metricCard(
  metric: GeneratedMetric,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  return containerCard({
    w,
    h,
    fill: theme.card,
    stroke: theme.line,
    children: [
      rect({ x: 0.24, y: 0.24, w: 0.58, h: 0.05, fill: accent, r: 0.02 }),
      text({
        x: 0.24,
        y: 0.48,
        w: w - 0.5,
        h: 0.46,
        value: metric.value,
        size: 26,
        color: theme.ink,
        bold: true,
        wrap: "none",
        maxLength: 18,
      }),
      text({
        x: 0.26,
        y: 1.02,
        w: w - 0.52,
        h: 0.2,
        value: metric.label,
        size: 9,
        color: theme.primary,
        bold: true,
        letterSpacing: 80,
        maxLength: 38,
      }),
      text({
        x: 0.26,
        y: 1.24,
        w: w - 0.52,
        h: Math.max(0.12, h - 1.34),
        value: metric.description ?? "Generated signal",
        size: 8,
        color: theme.muted,
        lineHeight: 1.16,
        maxLength: 70,
      }),
    ],
  });
}

function metricTile(
  metric: GeneratedMetric,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  return containerCard({
    w,
    h,
    fill: theme.surface,
    stroke: theme.line,
    r: 0.08,
    children: [
      rect({ x: 0.16, y: 0.14, w: 0.38, h: 0.04, fill: accent, r: 0.02 }),
      text({
        x: 0.16,
        y: 0.28,
        w: w - 0.32,
        h: 0.24,
        value: metric.value,
        size: 15.5,
        color: theme.ink,
        bold: true,
        wrap: "none",
        maxLength: 14,
      }),
      text({
        x: 0.18,
        y: 0.56,
        w: w - 0.36,
        h: Math.max(0.1, h - 0.62),
        value: metric.label,
        size: 6.8,
        color: theme.muted,
        bold: true,
        maxLength: 28,
      }),
    ],
  });
}

function metricMiniBlock(
  metric: GeneratedMetric,
  x: number,
  y: number,
  theme: AdaptiveTheme,
  index: number,
): SlideElement[] {
  return [
    rect({
      x,
      y,
      w: 2.22,
      h: 0.02,
      fill: theme.line,
    }),
    text({
      x,
      y: y + 0.16,
      w: 0.9,
      h: 0.28,
      value: metric.value,
      size: 18,
      color: theme.accents[index % theme.accents.length],
      bold: true,
      wrap: "none",
      maxLength: 12,
    }),
    text({
      x: x + 1.0,
      y: y + 0.2,
      w: 1.18,
      h: 0.2,
      value: metric.label,
      size: 8,
      color: theme.muted,
      bold: true,
      maxLength: 28,
    }),
  ];
}

function darkMetricStrip(
  metric: GeneratedMetric,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  return containerCard({
    w,
    h,
    fill: "1F2937",
    stroke: "334155",
    r: 0.08,
    children: [
      text({
        x: 0.16,
        y: 0.1,
        w: 0.78,
        h: 0.18,
        value: metric.value,
        size: 12.5,
        color: theme.accents[index % theme.accents.length],
        bold: true,
        wrap: "none",
        maxLength: 12,
      }),
      text({
        x: 0.98,
        y: 0.09,
        w: w - 1.16,
        h: 0.18,
        value: metric.label,
        size: 8.2,
        color: "F8FAFC",
        bold: true,
        maxLength: 30,
      }),
      text({
        x: 0.98,
        y: 0.29,
        w: w - 1.16,
        h: Math.max(0.1, h - 0.34),
        value: metric.description ?? "Measured signal",
        size: 6.5,
        color: "CBD5E1",
        lineHeight: 1.12,
        maxLength: 48,
      }),
    ],
  });
}

function columnInsightCard(
  item: CardItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  const onDark = index === 0;
  return containerCard({
    w,
    h,
    fill: onDark ? "111827" : theme.card,
    stroke: onDark ? "273449" : theme.line,
    children: [
      text({
        x: 0.24,
        y: 0.24,
        w: 0.62,
        h: 0.34,
        value: String(index + 1).padStart(2, "0"),
        size: 18,
        color: accent,
        bold: true,
        wrap: "none",
      }),
      rect({ x: 0.26, y: 0.78, w: 0.66, h: 0.05, fill: accent, r: 0.02 }),
      text({
        x: 0.24,
        y: 1.02,
        w: w - 0.48,
        h: 0.66,
        value: item.title,
        size: 18,
        color: onDark ? "FFFFFF" : theme.ink,
        bold: true,
        lineHeight: 1.06,
        maxLength: 48,
      }),
      text({
        x: 0.26,
        y: 1.9,
        w: w - 0.52,
        h: 0.68,
        value: item.body,
        size: 8.8,
        color: onDark ? "CBD5E1" : theme.muted,
        lineHeight: 1.2,
        maxLength: 100,
      }),
    ],
  });
}

function numberedItemCard(
  item: CardItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  return containerCard({
    w,
    h,
    fill: theme.surface,
    stroke: theme.line,
    r: 0.08,
    children: [
      ellipse({ x: 0.18, y: 0.18, w: 0.34, h: 0.34, fill: accent }),
      text({
        x: 0.18,
        y: 0.26,
        w: 0.34,
        h: 0.12,
        value: String(index + 1),
        size: 7.2,
        color: "FFFFFF",
        bold: true,
        align: "center",
        wrap: "none",
      }),
      text({
        x: 0.64,
        y: 0.18,
        w: w - 0.84,
        h: 0.34,
        value: item.title,
        size: 11,
        color: theme.ink,
        bold: true,
        lineHeight: 1.08,
        maxLength: 38,
      }),
      text({
        x: 0.22,
        y: 0.7,
        w: w - 0.44,
        h: Math.max(0.2, h - 0.82),
        value: item.body,
        size: 7.6,
        color: theme.muted,
        lineHeight: 1.16,
        maxLength: 76,
      }),
    ],
  });
}

function iconBulletCard(
  item: CardItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  return containerCard({
    w,
    h,
    fill: theme.surface,
    stroke: theme.line,
    r: 0.08,
    children: [
      ellipse({ x: 0.18, y: 0.16, w: 0.3, h: 0.3, fill: accent }),
      rect({ x: 0.26, y: 0.24, w: 0.14, h: 0.035, fill: "FFFFFF", r: 0.02 }),
      text({
        x: 0.62,
        y: 0.12,
        w: 1.45,
        h: 0.18,
        value: item.title,
        size: 9.2,
        color: theme.ink,
        bold: true,
        maxLength: 34,
      }),
      text({
        x: 2.12,
        y: 0.13,
        w: w - 2.34,
        h: Math.max(0.18, h - 0.22),
        value: item.body,
        size: 7,
        color: theme.muted,
        lineHeight: 1.14,
        maxLength: 66,
      }),
    ],
  });
}

function teamMemberCard(
  item: CardItem,
  w: number,
  h: number,
  theme: AdaptiveTheme,
  index: number,
): ContainerElement {
  const accent = theme.accents[index % theme.accents.length];
  return containerCard({
    w,
    h,
    fill: theme.surface,
    stroke: theme.line,
    r: 0.08,
    children: [
      ellipse({
        x: 0.18,
        y: 0.18,
        w: 0.46,
        h: 0.46,
        fill: accent,
        stroke: { color: "FFFFFF", width: 1 },
      }),
      text({
        x: 0.18,
        y: 0.31,
        w: 0.46,
        h: 0.14,
        value: initials(item.title),
        size: 7,
        color: "FFFFFF",
        bold: true,
        align: "center",
        wrap: "none",
      }),
      text({
        x: 0.76,
        y: 0.18,
        w: w - 0.94,
        h: 0.22,
        value: item.title,
        size: 9.5,
        color: theme.ink,
        bold: true,
        maxLength: 30,
      }),
      text({
        x: 0.76,
        y: 0.43,
        w: w - 0.94,
        h: 0.18,
        value: truncateText(item.body.split(/[.;]/)[0] || item.body, 38),
        size: 7.2,
        color: theme.primary,
        bold: true,
        maxLength: 38,
      }),
      text({
        x: 0.22,
        y: 0.78,
        w: w - 0.44,
        h: Math.max(0.18, h - 0.9),
        value: item.body,
        size: 6.8,
        color: theme.muted,
        lineHeight: 1.12,
        maxLength: 68,
      }),
    ],
  });
}

function containerCard({
  w,
  h,
  fill,
  stroke,
  children,
  r = 0.11,
}: {
  w: number;
  h: number;
  fill: string;
  stroke: string;
  children: SlideElement[];
  r?: number;
}): ContainerElement {
  return {
    type: "container",
    position: { x: 0, y: 0 },
    size: { width: w, height: h },
    fill: { color: fill },
    stroke: { color: stroke, width: 0.7 },
    borderRadius: radius(r),
    child: group(0, 0, w, h, children),
  };
}

function emptyContainer(): ContainerElement {
  return {
    type: "container",
    position: { x: 0, y: 0 },
    size: { width: 0.1, height: 0.1 },
  };
}

function text({
  x,
  y,
  w,
  h,
  value,
  size = 10,
  color,
  bold,
  italic,
  lineHeight,
  letterSpacing,
  align,
  valign,
  wrap = "word",
  opacity,
  maxLength,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
  size?: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  wrap?: "word" | "char" | "none";
  opacity?: number;
  maxLength?: number;
}): TextElement {
  const textValue = truncateText(value || " ", maxLength ?? 220) || " ";
  return {
    type: "text",
    position: { x, y },
    size: { width: w, height: h },
    runs: [{ text: textValue }],
    font: {
      family: SANS,
      size,
      color,
      bold,
      italic,
      lineHeight,
      letterSpacing,
      wrap,
    },
    alignment:
      align || valign ? { horizontal: align, vertical: valign } : undefined,
    maxLength,
    opacity: normalizeOpacity(opacity),
  };
}

function bullets({
  x,
  y,
  w,
  h,
  items,
  size,
  color,
  marker,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  items: string[];
  size: number;
  color: string;
  marker: "bullet" | "number" | "none";
}): TextListElement {
  const safeItems = (items.length > 0 ? items : ["Key point"]).slice(0, 5);
  return {
    type: "text-list",
    position: { x, y },
    size: { width: w, height: h },
    marker,
    items: safeItems.map((item) => ({
      type: "text",
      text: truncateText(item, 88),
    })),
    font: { family: SANS, size, color, lineHeight: 1.18 },
    maxItemLength: 88,
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
}): RectangleElement {
  return {
    type: "rectangle",
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: fill, opacity: normalizeOpacity(opacity) },
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
  stroke,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke?: { color: string; width: number };
}): EllipseElement {
  return {
    type: "ellipse",
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: fill },
    stroke,
  };
}

function line({
  x,
  y,
  w,
  h,
  color,
  width,
  dash,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  width: number;
  dash?: number[];
}): LineElement {
  return {
    type: "line",
    position: { x, y },
    size: { width: w, height: Math.max(0.01, h) },
    stroke: { color, width, dash },
  };
}

function group(
  x: number,
  y: number,
  w: number,
  h: number,
  children: SlideElement[],
): GroupElement {
  return {
    type: "group",
    position: { x, y },
    size: { width: w, height: h },
    children,
  };
}

function svg({
  x,
  y,
  w,
  h,
  markup,
  name,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  markup: string;
  name: string;
}): SvgElement {
  return {
    type: "svg",
    position: { x, y },
    size: { width: w, height: h },
    svg: markup,
    name: truncateText(name, 120),
  };
}

function chart({
  x,
  y,
  w,
  h,
  title,
  type,
  data,
  color,
  theme,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  type: ChartElement["chartType"];
  data: GeneratedChart["data"];
  color: string;
  theme: AdaptiveTheme;
}): ChartElement {
  return {
    type: "chart",
    position: { x, y },
    size: { width: w, height: h },
    chartType: type,
    title: truncateText(title, 80),
    color,
    axisColor: theme.line,
    labelColor: theme.muted,
    showValues: true,
    data: data.slice(0, 8).map((datum, index) => ({
      label: truncateText(datum.label || `Item ${index + 1}`, 32),
      value: Math.max(0, Math.round(Number(datum.value) || 0)),
      color: theme.accents[index % theme.accents.length],
    })),
  };
}

function table({
  x,
  y,
  w,
  h,
  columns,
  rows,
  theme,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  columns: string[];
  rows: string[][];
  theme: AdaptiveTheme;
}): TableElement {
  return {
    type: "table",
    position: { x, y },
    size: { width: w, height: h },
    font: { family: SANS, size: 8.5, color: theme.ink },
    columns: columns.map((value) => tableCell(value, theme.primary, "FFFFFF", true)),
    rows: rows.map((row) =>
      row.map((value) => tableCell(value, "FFFFFF", theme.ink, false, theme.line)),
    ),
  };
}

function tableCell(
  value: string,
  fill: string,
  color: string,
  bold: boolean,
  stroke = "FFFFFF",
): TableCell {
  return {
    text: truncateText(value || "-", 72),
    fill: { color: fill },
    stroke: { color: stroke, width: 0.5 },
    font: { family: SANS, size: 8.5, color, bold },
    maxLength: 72,
  };
}

function normalizeOpacity(value: number | undefined) {
  if (value == null || !Number.isFinite(value)) return undefined;
  const normalized = value > 1 ? value / 100 : value;
  return Math.min(Math.max(normalized, 0), 1);
}

function inferAdaptiveKind(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
  tags: string[],
): GeneratedSlideKind {
  if (index === 0 && slideCount > 1) return "cover";
  if (index === slideCount - 1 && slideCount > 2) return "closing";
  const inspired = (content.inspiredLayoutId ?? "").toLowerCase();
  if (/timeline|milestone|roadmap|process/.test(inspired)) {
    return "timeline";
  }
  if (/funnel/.test(inspired)) {
    return "metrics";
  }
  if (/chart|graph|multi-chart/.test(inspired) && hasUsableChart(content.chart)) {
    return "chart";
  }
  if (/metric|stat|snapshot|kpi/.test(inspired)) {
    return "metrics";
  }
  if (/table/.test(inspired) && hasUsableTable(content.table)) {
    return "table";
  }
  if (/thank|contact|closing/.test(inspired)) {
    return "closing";
  }
  if (/bullet|numbered|icon/.test(inspired)) {
    return "bullets";
  }
  if (/team|people|member/.test(inspired)) {
    return "cards";
  }
  if (content.kind === "chart" && hasUsableChart(content.chart)) {
    return "chart";
  }
  if (content.kind === "table" && hasUsableTable(content.table)) {
    return "table";
  }
  if (
    content.kind &&
    content.kind !== "general" &&
    content.kind !== "bullets" &&
    content.kind !== "chart" &&
    content.kind !== "table"
  ) {
    return content.kind;
  }
  const haystack = [
    content.title,
    ...(content.body ?? []),
    ...(content.bullets ?? []),
    tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  if (/timeline|milestone|roadmap|career|journey|history/.test(haystack)) {
    return "timeline";
  }
  if (tags.includes("metrics") || /metric|kpi|stat|score|growth|rate/.test(haystack)) {
    return "metrics";
  }
  if (
    hasUsableChart(content.chart) &&
    (tags.includes("chart") || /trend|chart|graph|data|performance/.test(haystack))
  ) {
    return "chart";
  }
  if (
    hasUsableTable(content.table) &&
    (tags.includes("table") || /compare|matrix|table|options|pricing/.test(haystack))
  ) {
    return "table";
  }
  return "general";
}

function createCardItems(content: GeneratedSlideContent): CardItem[] {
  const items = extractContentCardItems(content);
  if (items.length > 0) return items;
  return [
    { title: content.title || "Overview", body: content.body?.[0] ?? "Summarize the main message." },
    { title: "Key context", body: content.bullets?.[0] ?? "Highlight what matters most." },
    { title: "Decision point", body: content.bullets?.[1] ?? "Show the practical next step." },
  ];
}

function extractContentCardItems(content: GeneratedSlideContent): CardItem[] {
  const source = [
    ...(content.bullets ?? []),
    ...(content.body ?? []).slice(1),
  ].filter(Boolean);
  return source
    .filter((value) => !isScaffoldText(value))
    .map(cardItemFromText)
    .filter(Boolean) as CardItem[];
}

function coverCardItems(content: GeneratedSlideContent, deckTitle: string): CardItem[] {
  const topic = normalizeScaffoldText(deckTitle || content.title || "");
  return extractContentCardItems(content)
    .filter((item) => !isScaffoldCard(item))
    .filter((item) => hasSubjectSpecificText(item, topic))
    .filter((item, index, all) =>
      all.findIndex((candidate) => sameCardTitle(candidate.title, item.title)) === index,
    )
    .slice(0, 5);
}

function hasSubjectSpecificText(item: CardItem, topic: string) {
  const text = normalizeScaffoldText(`${item.title} ${item.body}`);
  if (!text || isScaffoldText(text)) return false;
  if (topic && text.includes(topic.slice(0, Math.min(18, topic.length)))) {
    return true;
  }
  return text.split(/\s+/).filter((word) => word.length > 4).length >= 4;
}

function isScaffoldCard(item: CardItem) {
  return isScaffoldText(item.title) || isScaffoldText(item.body);
}

function sameCardTitle(left: string, right: string) {
  return normalizeScaffoldText(left) === normalizeScaffoldText(right);
}

function isScaffoldText(value: string) {
  const clean = normalizeScaffoldText(value);
  return (
    /^(overview|context|key insights|strategy|execution plan|metrics|roadmap|next steps) priorities$/.test(clean) ||
    /^audience impact for /.test(clean) ||
    /^risks constraints and assumptions$/.test(clean) ||
    /^recommended next action$/.test(clean) ||
    /^focus areas$/.test(clean) ||
    /^key evidence$/.test(clean) ||
    /^key evidence dates data or comparisons$/.test(clean) ||
    /^dates data or comparisons$/.test(clean) ||
    /^next move$/.test(clean) ||
    /^next move decision or followup$/.test(clean) ||
    /^decision or followup$/.test(clean) ||
    /^why it matters$/.test(clean) ||
    /^why it matters audience stakes and timing$/.test(clean) ||
    /^audience stakes and timing$/.test(clean) ||
    /^what to watch$/.test(clean) ||
    /^what to watch milestones and signals$/.test(clean) ||
    /^milestones and signals$/.test(clean) ||
    /^clarify the main decision audience need and practical outcome$/.test(clean) ||
    /^keep the message specific measurable and easy to scan$/.test(clean)
  );
}

function normalizeScaffoldText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim()
    .toLowerCase();
}

function cardItemFromText(value: string): CardItem | null {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const split = clean.match(/^([^:—–-]{3,44})\s*[:—–-]\s*(.+)$/);
  if (split) {
    return {
      title: truncateText(split[1], 44),
      body: truncateText(split[2], 120),
    };
  }
  return {
    title: truncateText(clean, 44),
    body: truncateText(clean, 120),
  };
}

function metricItems(content: GeneratedSlideContent): GeneratedMetric[] {
  if (content.metrics?.length) return content.metrics;
  if (content.chart?.data.length) {
    return content.chart.data.slice(0, 4).map((datum) => ({
      value: String(Math.round(datum.value)),
      label: datum.label,
      description: content.chart?.title ?? "Generated data point",
    }));
  }
  return fallbackMetrics(0);
}

function funnelStages(
  content: GeneratedSlideContent,
  metrics: GeneratedMetric[],
): Array<{ label: string; value: number }> {
  const chartContent = content.chart;
  if (chartContent && hasUsableChart(chartContent)) {
    return chartContent.data.map((datum, index) => ({
      label: truncateText(datum.label || `Stage ${index + 1}`, 28),
      value: datum.value,
    }));
  }
  const fromMetrics = metrics
    .map((metric) => ({
      label: truncateText(metric.label, 28),
      value: numericMetricValue(metric.value),
    }))
    .filter((stage) => Number.isFinite(stage.value));
  if (fromMetrics.length > 0) return fromMetrics;
  return fallbackChart(content.title).data;
}

function numericMetricValue(value: string) {
  const normalized = value.replace(/,/g, "").trim().toLowerCase();
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return Number.NaN;
  const number = Number(match[0]);
  if (!Number.isFinite(number)) return Number.NaN;
  if (normalized.includes("m")) return number * 1_000_000;
  if (normalized.includes("k")) return number * 1_000;
  return number;
}

function formatNumericLabel(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (absolute >= 1_000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

function initials(value: string) {
  const parts = value
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]?.toUpperCase()).join("") || "A").slice(0, 2);
}

function timelineItems(content: GeneratedSlideContent): TimelineItem[] {
  const fromTable = timelineItemsFromTable(content.table);
  if (fromTable.length > 0) return fromTable;
  const values = [...(content.bullets ?? []), ...(content.body ?? [])];
  const fromText = values
    .map(timelineItemFromText)
    .filter(Boolean) as TimelineItem[];
  if (fromText.length > 0) return fromText;
  return createCardItems(content).slice(0, 5).map((item, index) => ({
    marker: `Step ${index + 1}`,
    title: item.title,
    description: item.body,
  }));
}

function timelineItemsFromTable(tableContent: GeneratedTable | undefined) {
  if (!tableContent?.rows.length) return [];
  const headers = tableContent.columns.map((column) => column.toLowerCase());
  const looksTemporal = headers.some((column) =>
    /year|date|time|phase|step|milestone|event/.test(column),
  );
  if (!looksTemporal) return [];
  return tableContent.rows.slice(0, 5).map((row, index) => {
    const marker = row[0] || `Step ${index + 1}`;
    return {
      marker: truncateText(marker, 18),
      title: truncateText(row[1] || marker, 34),
      description: truncateText(row.slice(2).join(" ") || row[1] || marker, 70),
    };
  });
}

function timelineItemFromText(value: string): TimelineItem | null {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const temporal = clean.match(
    /\b((?:19|20)\d{2}|Q[1-4]\s*\d{4}|Phase\s+\d+|Step\s+\d+)\b/i,
  );
  const split = clean.match(/^([^:—–-]{2,28})\s*[:—–-]\s*(.+)$/);
  const marker = temporal?.[1] ?? split?.[1] ?? "";
  if (!marker && clean.length > 44) return null;
  const rest = split?.[2] ?? clean.replace(marker, "").replace(/^[:—–-]\s*/, "");
  const item = cardItemFromText(rest || clean);
  if (!item) return null;
  return {
    marker: truncateText(marker || item.title, 18),
    title: item.title,
    description: item.body,
  };
}

function normalizeGeneratedTable(tableContent: GeneratedTable): GeneratedTable {
  const columns = (tableContent.columns.length ? tableContent.columns : ["Area", "Status", "Action"])
    .slice(0, 4)
    .map((column) => truncateText(column, 36));
  const columnCount = columns.length;
  const rows = (tableContent.rows.length ? tableContent.rows : fallbackTable("Plan").rows)
    .slice(0, 5)
    .map((row) =>
      Array.from({ length: columnCount }, (_, index) =>
        truncateText(row[index] || "-", 58),
      ),
    );
  return { columns, rows };
}

function slideTitle(content: GeneratedSlideContent, index: number) {
  return truncateText(content.title || `Slide ${index + 1}`, 60);
}

function adaptiveTheme(template: Deck): AdaptiveTheme {
  const theme = template.theme;
  const primary = cleanHex(theme?.primary ?? DEFAULT_ACCENTS[0]);
  const secondary = cleanHex(theme?.secondary ?? DEFAULT_ACCENTS[1]);
  const accent = cleanHex(theme?.accent ?? DEFAULT_ACCENTS[2]);
  return {
    background: cleanHex(theme?.background ?? "FFFFFE"),
    surface: cleanHex(theme?.surface ?? "F5F7FA"),
    card: "FFFFFF",
    ink: cleanHex(theme?.text ?? "101828"),
    muted: cleanHex(theme?.muted ?? "4D5463"),
    line: "E6E8EF",
    primary,
    secondary,
    accent,
    soft: "F7F8FB",
    accents: [
      primary,
      secondary,
      accent,
      ...DEFAULT_ACCENTS.filter(
        (color) => ![primary, secondary, accent].includes(color),
      ),
    ],
  };
}

function visualMotifSvg(theme: AdaptiveTheme, seedText: string) {
  const seed = hashString(seedText);
  const a = theme.accents[seed % theme.accents.length];
  const b = theme.accents[(seed + 2) % theme.accents.length];
  const c = theme.accents[(seed + 4) % theme.accents.length];
  const lift = 18 + (seed % 28);
  const tall = 116 + (seed % 52);
  return `<svg viewBox="0 0 720 520" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F1F5F9"/>
    </linearGradient>
  </defs>
  <rect width="720" height="520" rx="34" fill="url(#panel)"/>
  <path d="M72 ${340 - lift} C150 ${250 - lift} 214 ${278 + lift} 286 ${206 - lift} C372 ${120 + lift} 444 ${178 - lift} 524 ${102 + lift}" fill="none" stroke="#${a}" stroke-width="16" stroke-linecap="round"/>
  <path d="M92 400 H610" stroke="#CBD5E1" stroke-width="5" stroke-linecap="round" stroke-dasharray="18 18"/>
  <rect x="92" y="${258 - lift}" width="126" height="${tall}" rx="22" fill="#${a}" opacity="0.92"/>
  <rect x="250" y="${210 + lift / 2}" width="126" height="${Math.max(94, tall - 34)}" rx="22" fill="#${b}" opacity="0.9"/>
  <rect x="408" y="${166 - lift / 3}" width="126" height="${Math.min(178, tall + 20)}" rx="22" fill="#${c}" opacity="0.9"/>
  <g fill="#FFFFFF" opacity="0.92">
    <circle cx="155" cy="${232 - lift}" r="16"/>
    <circle cx="313" cy="${186 + lift / 2}" r="16"/>
    <circle cx="471" cy="${142 - lift / 3}" r="16"/>
  </g>
  <g fill="#0F172A" opacity="0.72">
    <rect x="92" y="86" width="170" height="14" rx="7"/>
    <rect x="92" y="122" width="112" height="10" rx="5"/>
    <rect x="92" y="148" width="138" height="10" rx="5"/>
  </g>
  <rect x="486" y="78" width="94" height="94" rx="28" fill="#0F172A" opacity="0.92"/>
  <path d="M516 126 L540 150 L570 96" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function radius(value = 0.1) {
  return { tl: value, tr: value, bl: value, br: value };
}

function cleanHex(value: string) {
  return value.replace(/^#/, "").toUpperCase();
}

function slideVariant(
  content: GeneratedSlideContent,
  index: number,
  slideCount: number,
) {
  return hashString(
    `${content.kind ?? "general"}|${content.inspiredLayoutId ?? ""}|${content.title}|${index}|${slideCount}`,
  ) % 3;
}

function inspiredLayoutId(content: GeneratedSlideContent) {
  return (content.inspiredLayoutId ?? "").toLowerCase();
}

function looksLikeVisualSplit(content: GeneratedSlideContent) {
  const inspired = inspiredLayoutId(content);
  return /image|photo|double-image|media/.test(inspired);
}

function looksLikeQuoteLayout(content: GeneratedSlideContent) {
  const inspired = inspiredLayoutId(content);
  return /quote/.test(inspired);
}

function looksLikeTeamLayout(content: GeneratedSlideContent) {
  return /team|people|member/.test(inspiredLayoutId(content));
}

function looksLikeBulletLayout(content: GeneratedSlideContent) {
  return /bullet|numbered|icon/.test(inspiredLayoutId(content));
}

function looksLikeNumberedBulletLayout(content: GeneratedSlideContent) {
  return /numbered|two-column-numbered/.test(inspiredLayoutId(content));
}

function looksLikeSpotlightLayout(content: GeneratedSlideContent) {
  return /side-insight|challenge-outcome|customer-card/.test(inspiredLayoutId(content));
}

function looksLikeColumnCardLayout(content: GeneratedSlideContent) {
  return /three-column|three-columns|risk|constraint|label/.test(inspiredLayoutId(content));
}

function looksLikeMetricNarrativeLayout(content: GeneratedSlideContent) {
  return /headline-text-with-stats|text-block-with-metric-cards/.test(
    inspiredLayoutId(content),
  );
}

function looksLikeMetricImageLayout(content: GeneratedSlideContent) {
  return /metrics-with-image|image-with-title-and-metrics/.test(inspiredLayoutId(content));
}

function looksLikeFunnelLayout(content: GeneratedSlideContent) {
  return /funnel/.test(inspiredLayoutId(content));
}

function looksLikeFullWidthChartLayout(content: GeneratedSlideContent) {
  return /full-width-chart/.test(inspiredLayoutId(content));
}

function looksLikeMultiChartLayout(content: GeneratedSlideContent) {
  return /multi-chart/.test(inspiredLayoutId(content));
}

function quoteText(content: GeneratedSlideContent) {
  const source =
    content.body?.[0] ??
    content.bullets?.[0] ??
    content.title;
  return truncateText(source.replace(/^["']+|["']+$/g, ""), 170);
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function collectSlideRefs(slide: Slide): SlideRefs {
  const refs: SlideRefs = {
    text: [],
    lists: [],
    charts: [],
    tables: [],
    images: [],
  };
  for (const element of slide.elements) visitElement(element, refs);
  return refs;
}

function visitElement(element: SlideElement | undefined, refs: SlideRefs) {
  if (!element) return;
  switch (element.type) {
    case "text":
      refs.text.push({ element, original: textValue(element) });
      break;
    case "text-list":
      refs.lists.push(element);
      break;
    case "chart":
      refs.charts.push(element);
      break;
    case "table":
      refs.tables.push(element);
      break;
    case "image":
      refs.images.push(element);
      break;
    case "group":
    case "flex":
    case "grid":
      for (const child of element.children) visitElement(child, refs);
      break;
    case "container":
      visitElement(element.child ?? undefined, refs);
      break;
    case "list-view":
    case "grid-view":
      visitElement(element.item, refs);
      break;
  }
}

function inferLayoutTags(title: string, refs: SlideRefs) {
  const text = title.toLowerCase();
  const tags = new Set<string>();
  if (refs.images.length > 0 || /image|photo|picture|visual/.test(text)) {
    tags.add("image");
  }
  if (refs.charts.length > 0 || /chart|dashboard|data|analysis/.test(text)) {
    tags.add("chart");
    tags.add("data");
  }
  if (refs.tables.length > 0 || /table/.test(text)) tags.add("table");
  if (/metric|stat|kpi|funnel|progress/.test(text)) tags.add("metrics");
  if (/timeline|milestone|roadmap/.test(text)) tags.add("timeline");
  if (/team|member|people|photo cards/.test(text)) tags.add("team");
  if (/quote/.test(text)) tags.add("quote");
  if (/contact|footer|thank/.test(text)) tags.add("closing");
  if (/bullet|list|numbered|icon/.test(text)) tags.add("bullets");
  if (/card|grid|column|category/.test(text)) tags.add("cards");
  if (tags.size === 0) tags.add("general");
  return [...tags];
}

function describeLayout(title: string, tags: string[], refs: SlideRefs) {
  const parts = [
    `${title}`,
    `tags: ${tags.join(", ")}`,
    `${refs.text.length} text fields`,
  ];
  if (refs.lists.length) parts.push(`${refs.lists.length} bullet lists`);
  if (refs.charts.length) parts.push(`${refs.charts.length} charts`);
  if (refs.tables.length) parts.push(`${refs.tables.length} tables`);
  if (refs.images.length) parts.push(`${refs.images.length} images`);
  return parts.join("; ");
}

function normalizePlan(
  plan: GeneratedDeckPlan,
  fallback: GeneratedDeckPlan,
  layoutCount: number,
): GeneratedDeckPlan {
  const slides = [...(plan.slides ?? [])];
  while (slides.length < fallback.slides.length) {
    slides.push(fallback.slides[slides.length]);
  }
  return {
    title: truncateText(plan.title || fallback.title, 90),
    outline: nonEmpty(plan.outline, fallback.outline).slice(0, fallback.slides.length),
    slides: slides.map((slide, index) => {
      const fallbackSlide = fallback.slides[index % fallback.slides.length];
      const chart = sanitizeGeneratedChart(slide.chart, slide.title ?? fallbackSlide.title);
      const table = sanitizeGeneratedTable(slide.table);
      const kind = sanitizeGeneratedKind(slide.kind, chart, table);
      return {
        ...fallbackSlide,
        ...slide,
        layoutIndex: clampInt(slide.layoutIndex, 0, layoutCount - 1),
        kind,
        title: sanitizeSlideTitle(slide.title, fallbackSlide.title),
        body: cleanTextList(slide.body, fallbackSlide.body).slice(0, 12),
        bullets: cleanTextList(slide.bullets, fallbackSlide.bullets).slice(0, 8),
        metrics: nonEmpty(slide.metrics, fallbackSlide.metrics).slice(0, 8),
        chart,
        table,
      };
    }),
  };
}

function sanitizeGeneratedKind(
  kind: GeneratedSlideKind | undefined,
  chart: GeneratedChart | undefined,
  table: GeneratedTable | undefined,
): GeneratedSlideKind | undefined {
  if (kind === "chart" && !hasUsableChart(chart)) return "cards";
  if (kind === "table" && !hasUsableTable(table)) return "cards";
  return kind;
}

function sanitizeGeneratedChart(
  chartContent: GeneratedChart | undefined,
  fallbackTitle: string,
): GeneratedChart | undefined {
  if (!chartContent) return undefined;

  const data = chartContent.data
    .filter((datum) => Number.isFinite(datum.value) && !isPlaceholderText(datum.label))
    .slice(0, 8)
    .map((datum) => ({
      label: truncateText(datum.label, 40),
      value: datum.value,
    }));

  if (data.length === 0) return undefined;

  return {
    title: isPlaceholderText(chartContent.title)
      ? truncateText(fallbackTitle, 80)
      : truncateText(chartContent.title, 80),
    type:
      chartContent.type === "donut" && data.some((datum) => datum.value < 0)
        ? "bar"
        : chartContent.type,
    data,
  };
}

function sanitizeGeneratedTable(
  tableContent: GeneratedTable | undefined,
): GeneratedTable | undefined {
  if (!tableContent || !hasUsableTable(tableContent)) return undefined;

  const columns = tableContent.columns
    .map((column, index) =>
      isPlaceholderText(column) ? `Column ${index + 1}` : truncateText(column, 40),
    )
    .slice(0, 6);
  const rows = tableContent.rows
    .filter((row) => row.some((cell) => !isPlaceholderText(cell)))
    .slice(0, 7)
    .map((row) =>
      row.slice(0, columns.length).map((cell) =>
        isPlaceholderText(cell) ? "-" : truncateText(cell, 60),
      ),
    );

  return { columns, rows };
}

function hasUsableChart(chartContent: GeneratedChart | undefined) {
  return Boolean(
    chartContent?.data.some(
      (datum) => Number.isFinite(datum.value) && !isPlaceholderText(datum.label),
    ),
  );
}

function hasUsableTable(tableContent: GeneratedTable | undefined) {
  if (!tableContent) return false;
  return tableContent.rows.some((row) =>
    row.some((value) => !isPlaceholderText(value)),
  );
}

function isPlaceholderText(value: string | undefined) {
  const clean = normalizeScaffoldText(value ?? "");
  return (
    !clean ||
    clean === "n" ||
    clean === "a" ||
    clean === "na" ||
    clean === "n a" ||
    clean === "none" ||
    clean === "null" ||
    clean === "tbd" ||
    clean === "todo" ||
    clean === "placeholder" ||
    clean === "not applicable" ||
    clean === "not available" ||
    clean === "dummy"
  );
}

function sanitizeSlideTitle(title: string | undefined, fallback: string) {
  const value = title || fallback;
  return truncateText(isScaffoldText(value) ? fallback : value, 60);
}

function cleanTextList(primary: string[] | undefined, fallback: string[] | undefined) {
  const cleaned = nonEmpty(primary, fallback).filter((value) => !isScaffoldText(value));
  return cleaned.length > 0 ? cleaned : fallback ?? [];
}

function textValue(element: TextElement) {
  return element.runs.map((run) => run.text).join("");
}

function desiredKindForPosition(index: number, count: number) {
  if (index === 0 && count > 1) return "cover";
  if (index === count - 1 && count > 2) return "closing";
  return (["general", "cards", "bullets", "metrics", "chart", "timeline"] as const)[
    index % 6
  ];
}

function pickLayoutIndex(
  catalog: SlideLayoutManifest[],
  kind: string,
  offset: number,
) {
  const direct = catalog.find((layout) => layout.tags.includes(kind));
  if (direct) return direct.index;
  const general = catalog.find(
    (layout) =>
      !layout.tags.includes("closing") &&
      !layout.tags.includes("quote") &&
      layout.slotSummary.text > 2,
  );
  return general?.index ?? catalog[offset % Math.max(catalog.length, 1)]?.index ?? 0;
}

function createFocusTitle(description: string) {
  const firstLine =
    description
      .split(/\n|[.!?]/)
      .map((part) => part.trim())
      .find(Boolean) ?? "Generated Presentation";
  return titleCase(truncateText(firstLine, 58));
}

function sectionTitle(index: number, count: number) {
  if (index === 0) return "Overview";
  if (index === count - 1 && count > 2) return "Next Steps";
  return FALLBACK_PROGRESSIONS[index % FALLBACK_PROGRESSIONS.length];
}

function fallbackBody(
  description: string,
  focus: string,
  section: string,
  kind: GeneratedSlideKind,
) {
  const clean = description.replace(/\s+/g, " ").trim();
  const seed = clean.length > 0 ? truncateText(clean, 150) : focus;
  if (kind === "cover") {
    return [seed];
  }
  if (kind === "closing") {
    return [
      `Close with the clearest takeaway for ${focus}.`,
      "Confirm the decision, owner, and next milestone.",
      "Share the update path with the right audience.",
    ];
  }
  return [
    `${section} for ${focus}`,
    seed,
    `What the audience should understand about ${focus}.`,
    `The evidence, milestone, or decision that moves ${focus} forward.`,
  ];
}

function fallbackBullets(
  focus: string,
  section: string,
  kind: GeneratedSlideKind,
) {
  const topic = truncateText(focus, 42);
  if (kind === "cover") {
    return [];
  }
  if (kind === "timeline") {
    return [
      `Kickoff: define the ${topic} context`,
      "Milestone: track the major dates or phases",
      "Signal: show what changes at each step",
      "Outcome: connect the sequence to the decision",
    ];
  }
  if (kind === "metrics" || kind === "chart") {
    return [
      `${topic} signal: strongest measurable takeaway`,
      "Trend: what is rising, falling, or changing",
      "Comparison: what the numbers should be judged against",
      "Implication: what the audience should do with the data",
    ];
  }
  if (kind === "table") {
    return [
      `${topic} comparison: options, roles, or phases`,
      "Criteria: what each row should explain",
      "Difference: the most important contrast",
      "Decision: the practical takeaway",
    ];
  }
  if (kind === "closing") {
    return [
      "Confirm the main takeaway",
      "Choose the next decision owner",
      "Track the next milestone",
      "Share the follow-up update",
    ];
  }
  return [
    `${section}: what matters for ${topic}`,
    "Context: the audience and stakes",
    "Evidence: the strongest supporting point",
    "Implication: what changes or becomes possible",
    "Action: the practical next step",
  ];
}

function fallbackMetrics(index: number): GeneratedMetric[] {
  const base = [28, 42, 63, 81].map((value) => value + index * 3);
  return [
    { value: `${base[0]}%`, label: "Adoption", description: "Near-term signal" },
    { value: `${base[1]}%`, label: "Efficiency", description: "Process lift" },
    { value: `${base[2]}k`, label: "Reach", description: "Audience scale" },
    { value: `${base[3]}%`, label: "Confidence", description: "Plan readiness" },
  ];
}

function fallbackChart(title: string): GeneratedChart {
  return {
    title: truncateText(title || "Performance Trend", 40),
    type: "bar",
    data: [
      { label: "Q1", value: 32 },
      { label: "Q2", value: 48 },
      { label: "Q3", value: 61 },
      { label: "Q4", value: 74 },
    ],
  };
}

function fallbackTable(title: string): GeneratedTable {
  return {
    columns: ["Area", "Status", "Action"],
    rows: [
      [truncateText(title || "Priority", 24), "Active", "Align owners"],
      ["Execution", "On track", "Review weekly"],
      ["Risk", "Watch", "Prepare mitigation"],
    ],
  };
}

function truncateText(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.55 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}...`;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function nonEmpty<T>(primary: T[] | undefined, fallback: T[] | undefined) {
  return primary && primary.length > 0 ? primary : fallback ?? [];
}

function clampInt(value: number, min: number, max: number) {
  const parsed = Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.min(Math.max(parsed, min), max);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
