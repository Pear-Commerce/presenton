import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildAdaptiveGeneratedDeck,
  createLayoutCatalog,
  fallbackGeneratedPlan,
  type GeneratedDeckPlan,
} from "@/components/slide-editor/lib/ai-slide-generation";
import type {
  GenerationLayoutKind,
  GenerationLayoutMetadata,
} from "@/components/slide-editor/lib/slide-generation-layout-metadata";
import { TEMPLATES } from "@/components/slide-editor/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

type ModelGeneratedSlide = Omit<
  GeneratedDeckPlan["slides"][number],
  "layoutIndex" | "inspiredLayoutId"
> & {
  layoutId: string;
};

type ModelDeckPlan = Omit<GeneratedDeckPlan, "slides"> & {
  slides: ModelGeneratedSlide[];
};

const RequestSchema = z
  .object({
    description: z.string().min(8).max(4000),
    slideCount: z.number().int().min(1).max(20),
    templateId: z.string().min(1).max(80),
    model: z.string().min(1).max(160).optional(),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid generation request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { description, slideCount, templateId } = parsed.data;
  const template = TEMPLATES.find((item) => item.id === templateId);
  if (!template) {
    return NextResponse.json(
      { error: `Unknown slide editor template: ${templateId}` },
      { status: 404 },
    );
  }

  const catalog = createLayoutCatalog(template.deck);
  const generationLayouts = resolveGenerationLayouts(
    template.generationLayouts,
    catalog,
  );
  const fallback = syncPlanLayoutIdsToMetadata(
    fallbackGeneratedPlan(template.deck, description, slideCount),
    generationLayouts,
  );
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const modelId =
    parsed.data.model ??
    process.env.SLIDE_EDITOR_OPENAI_MODEL ??
    process.env.OPENAI_MODEL ??
    DEFAULT_OPENAI_MODEL;
  const warnings: string[] = [];
  let plan: GeneratedDeckPlan = fallback;
  let source: "ai" | "fallback" = "fallback";

  if (apiKey) {
    try {
      const openai = createOpenAI({ apiKey });
      const schema = createPlanSchema(slideCount, generationLayouts);
      const result = await generateText({
        model: openai.responses(modelId),
        temperature: 0.25,
        maxOutputTokens: 4500,
        output: Output.object({
          schema,
          name: "slide_editor_deck_plan",
          description:
            "Content-only plan for generating editable slide-editor slides.",
        }),
        system: getSystemPrompt(slideCount),
        prompt: getUserPrompt({
          description,
          slideCount,
          templateLabel: template.label,
          generationLayouts,
        }),
      });
      plan = resolveModelPlanLayoutSelections(
        result.output,
        generationLayouts,
        fallback,
      );
      source = "ai";
    } catch (error) {
      console.warn("[slide-editor/generate] OpenAI generation failed", error);
      warnings.push(
        error instanceof Error
          ? `OpenAI generation failed: ${error.message}`
          : "OpenAI generation failed. Used fallback content.",
      );
    }
  } else {
    warnings.push(
      "OPENAI_API_KEY is not configured. Used fallback content.",
    );
  }

  const deck = buildAdaptiveGeneratedDeck({
    template: template.deck,
    plan,
    description,
    slideCount,
  });

  return NextResponse.json({
    deck,
    templateId: template.id,
    templateLabel: template.label,
    source,
    model: source === "ai" ? modelId : null,
    warnings,
  });
}

function createPlanSchema(
  slideCount: number,
  generationLayouts: ReadonlyArray<GenerationLayoutMetadata>,
) {
  const layoutIds = (
    generationLayouts.length > 0
      ? generationLayouts.map((layout) => layout.layoutId)
      : ["template-layout-0"]
  ) as [string, ...string[]];

  return z
    .object({
      title: z.string().min(1).max(90),
      outline: z
        .array(z.string().min(1).max(120))
        .min(1)
        .max(Math.max(1, slideCount)),
      slides: z
        .array(
          z
            .object({
              layoutId: z.enum(layoutIds),
              kind: z.enum([
                "cover",
                "general",
                "bullets",
                "cards",
                "metrics",
                "chart",
                "table",
                "timeline",
                "closing",
              ]),
              title: z.string().min(1).max(60),
              body: z.array(z.string().min(1).max(160)).min(1).max(12),
              bullets: z.array(z.string().min(1).max(120)).min(0).max(8),
              metrics: z
                .array(
                  z
                    .object({
                      value: z.string().min(1).max(20),
                      label: z.string().min(1).max(40),
                      description: z.string().min(0).max(90),
                    })
                    .strict(),
                )
                .min(0)
                .max(8),
              chart: z
                .object({
                  title: z.string().min(1).max(80),
                  type: z.enum(["bar", "line", "donut"]),
                  data: z
                    .array(
                      z
                        .object({
                          label: z.string().min(1).max(40),
                          value: z.number().min(0).max(1000000),
                        })
                        .strict(),
                    )
                    .min(1)
                    .max(8),
                })
                .strict(),
              table: z
                .object({
                  columns: z.array(z.string().min(1).max(40)).min(1).max(6),
                  rows: z
                    .array(z.array(z.string().min(1).max(60)).min(1).max(6))
                    .min(1)
                    .max(7),
                })
                .strict(),
              imagePrompt: z.string().min(0).max(120),
            })
            .strict(),
        )
        .length(slideCount),
    })
    .strict();
}

function getSystemPrompt(slideCount: number) {
  return `You generate content-only plans for editable presentation templates.

Return exactly ${slideCount} slides.
Choose layoutId from the provided generation layout metadata, using the exact layoutId value.
Do not output layoutIndex or slideIndex.
Do not describe visual geometry, coordinates, colors, or fonts.
Use concise presentation copy that fits inside adaptive editable slide layouts.
Prefer varied layouts across adjacent slides.
If ${slideCount} is greater than 1, slide 1 must be kind=cover and should introduce the whole deck, not jump directly into details.
If ${slideCount} is greater than 2, the final slide should be kind=closing with concrete next steps or a strong closing message.
Set kind to the semantic slide type: cover, timeline, metrics, chart, table, cards, bullets, general, or closing.
Keep kind compatible with layoutId: timeline layouts use timeline, chart layouts use chart, table layouts use table, metrics/stat layouts use metrics, image/text split and quote layouts use cards or general, team layouts use cards, thank/contact layouts use closing.
Use chart/table/metrics fields only when they support the requested content.
Always provide body, bullets, metrics, chart, table, and imagePrompt fields for every slide.
Use empty bullets and metrics arrays when they do not add subject-specific value; never add filler just to occupy a layout area.
For cover slides, body should contain the main promise/summary, and bullets should be empty unless each bullet is concrete to the user's subject.
Unused chart/table fields can contain simple relevant fallback data because they will not be rendered unless the slide kind needs them.
Do not copy layout names, schema field names, outline labels, or planning labels into visible slide copy.
Avoid generic scaffolding phrases such as "overview priorities", "audience impact", "risks, constraints, and assumptions", and "recommended next action"; write subject-specific content instead.
For weak/local models: keep every field simple, literal, and short.`;
}

function getUserPrompt({
  description,
  slideCount,
  templateLabel,
  generationLayouts,
}: {
  description: string;
  slideCount: number;
  templateLabel: string;
  generationLayouts: ReadonlyArray<GenerationLayoutMetadata>;
}) {
  return JSON.stringify(
    {
      task: "Create an editable slide deck plan.",
      template: templateLabel,
      slideCount,
      userDescription: description,
      generationPattern: [
        "First create a concise outline for the full deck.",
        "Then select exactly one layoutId from generationLayoutMetadata for each slide based on slide purpose.",
        "Then fill schema-shaped content fields so they match that selected layout's schemaFields intent.",
      ],
      generationLayoutMetadata: generationLayouts.map(toPromptLayoutMetadata),
      selectionGuidance: [
        "Make slide 1 an enticing intro/cover with the deck title and audience promise.",
        "Build a narrative arc across the deck instead of independent template-like slides.",
        "Use varied slide purposes: intro, context, insight, evidence, timeline/process, metrics/data, and closing.",
        "Set layoutId to one of the provided layoutId values; do not invent new layout ids.",
        "Prefer layout meanings such as image split, emphasis card, metric dashboard, full-width chart, table, timeline, quote, team, and closing.",
        "Visible slide text must be about the user's subject, not about presentation planning or template structure.",
        "Do not use layout names or schema fields as slide titles, card titles, or bullet text.",
        "Set kind=timeline for milestones, career paths, roadmaps, histories, and sequenced events.",
        "Set kind=metrics only when KPI cards are the main point.",
        "Set kind=cards or kind=bullets for qualitative insight slides.",
        "Use data/chart layouts only for numeric or trend content.",
        "Use table layouts only when comparison rows are useful.",
        "Use image layouts when a supporting visual helps the slide.",
        "Use metrics layouts for KPIs, outcomes, and snapshot slides.",
        "Use closing/contact layouts only for the final slide.",
      ],
    },
    null,
    2,
  );
}

function resolveGenerationLayouts(
  templateLayouts: ReadonlyArray<GenerationLayoutMetadata> | undefined,
  catalog: ReturnType<typeof createLayoutCatalog>,
): GenerationLayoutMetadata[] {
  if (templateLayouts?.length) {
    return [...templateLayouts];
  }

  return catalog.map((layout) => ({
    layoutId: `template-layout-${layout.index}`,
    slideIndex: layout.index,
    layoutName: layout.title,
    layoutDescription: layout.description,
    semanticKind: semanticKindFromTags(layout.tags),
    schemaFields: schemaFieldsFromSlots(layout.slotSummary),
  }));
}

function resolveModelPlanLayoutSelections(
  modelPlan: ModelDeckPlan,
  generationLayouts: ReadonlyArray<GenerationLayoutMetadata>,
  fallback: GeneratedDeckPlan,
): GeneratedDeckPlan {
  const layoutById = new Map(
    generationLayouts.map((layout) => [layout.layoutId, layout]),
  );

  return {
    title: modelPlan.title,
    outline: modelPlan.outline,
    slides: modelPlan.slides.map((slide, index) => {
      const fallbackSlide = fallback.slides[index % fallback.slides.length];
      const layout =
        layoutById.get(slide.layoutId) ??
        findCompatibleGenerationLayout(slide.kind, generationLayouts);
      const { layoutId, ...content } = slide;

      return {
        ...content,
        layoutIndex: layout?.slideIndex ?? fallbackSlide.layoutIndex,
        inspiredLayoutId:
          layout?.layoutId ?? fallbackSlide.inspiredLayoutId ?? layoutId,
      };
    }),
  };
}

function syncPlanLayoutIdsToMetadata(
  plan: GeneratedDeckPlan,
  generationLayouts: ReadonlyArray<GenerationLayoutMetadata>,
): GeneratedDeckPlan {
  const layoutBySlideIndex = new Map(
    generationLayouts.map((layout) => [layout.slideIndex, layout]),
  );

  return {
    ...plan,
    slides: plan.slides.map((slide) => {
      const layout =
        layoutBySlideIndex.get(slide.layoutIndex) ??
        findCompatibleGenerationLayout(slide.kind, generationLayouts);

      return {
        ...slide,
        layoutIndex: layout?.slideIndex ?? slide.layoutIndex,
        inspiredLayoutId: layout?.layoutId ?? slide.inspiredLayoutId,
      };
    }),
  };
}

function findCompatibleGenerationLayout(
  kind: ModelGeneratedSlide["kind"],
  generationLayouts: ReadonlyArray<GenerationLayoutMetadata>,
) {
  const preferredKinds = preferredMetadataKinds(kind);
  return preferredKinds
    .map((semanticKind) =>
      generationLayouts.find((layout) => layout.semanticKind === semanticKind),
    )
    .find(Boolean);
}

function preferredMetadataKinds(
  kind: ModelGeneratedSlide["kind"],
): GenerationLayoutKind[] {
  switch (kind) {
    case "cover":
      return ["cover", "visual", "general"];
    case "timeline":
      return ["timeline", "cards", "general"];
    case "metrics":
      return ["metrics", "chart", "cards"];
    case "chart":
      return ["chart", "metrics"];
    case "table":
      return ["table", "cards"];
    case "closing":
      return ["closing", "general"];
    case "bullets":
      return ["bullets", "cards", "general"];
    case "cards":
      return ["cards", "visual", "quote", "team", "general"];
    case "general":
    default:
      return ["general", "cards", "visual"];
  }
}

function semanticKindFromTags(tags: ReadonlyArray<string>): GenerationLayoutKind {
  const hasTag = (...values: string[]) =>
    values.some((value) => tags.includes(value));
  if (hasTag("closing")) return "closing";
  if (hasTag("timeline")) return "timeline";
  if (hasTag("chart", "data")) return "chart";
  if (hasTag("table")) return "table";
  if (hasTag("metrics")) return "metrics";
  if (hasTag("team")) return "team";
  if (hasTag("quote")) return "quote";
  if (hasTag("image")) return "visual";
  if (hasTag("cards")) return "cards";
  if (hasTag("bullets")) return "bullets";
  return "general";
}

function schemaFieldsFromSlots(
  slotSummary: ReturnType<typeof createLayoutCatalog>[number]["slotSummary"],
) {
  const fields = ["title", "body[]"];
  if (slotSummary.lists > 0) fields.push("bullets[]");
  if (slotSummary.charts > 0) fields.push("chart");
  if (slotSummary.tables > 0) fields.push("table.columns", "table.rows");
  if (slotSummary.images > 0) fields.push("imagePrompt");
  return fields;
}

function toPromptLayoutMetadata(layout: GenerationLayoutMetadata) {
  return {
    layoutId: layout.layoutId,
    slideIndex: layout.slideIndex,
    layoutName: layout.layoutName,
    layoutDescription: layout.layoutDescription,
    semanticKind: layout.semanticKind,
    schemaFields: layout.schemaFields,
  };
}
