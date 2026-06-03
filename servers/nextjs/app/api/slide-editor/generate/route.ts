import { createOpenAI } from "@ai-sdk/openai";
import { generateText as generateAIText, Output } from "ai";
import {
  createOllama,
  generateText as generateOllamaText,
} from "ai-sdk-ollama";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildAdaptiveGeneratedDeck,
  createLayoutCatalog,
  fallbackGeneratedPlan,
  type GeneratedChart,
  type GeneratedDeckPlan,
  type GeneratedTable,
} from "@/components/slide-editor/lib/ai-slide-generation";
import type {
  GenerationLayoutKind,
  GenerationLayoutMetadata,
} from "@/components/slide-editor/lib/slide-generation-layout-metadata";
import { TEMPLATES } from "@/components/slide-editor/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_OLLAMA_MODEL = "gemma4";
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

type GenerationModelProvider = "openai" | "ollama";

type GenerationModelSelection = {
  provider: GenerationModelProvider;
  modelId: string;
};

type ModelGeneratedSlide = Omit<
  GeneratedDeckPlan["slides"][number],
  "layoutIndex" | "inspiredLayoutId" | "chart" | "table"
> & {
  layoutId: string;
  chart: GeneratedChart | null;
  table: GeneratedTable | null;
};

type ModelDeckPlan = Omit<GeneratedDeckPlan, "slides"> & {
  slides: ModelGeneratedSlide[];
};

const RequestSchema = z
  .object({
    description: z.string().min(8).max(4000),
    slideCount: z.number().int().min(1).max(20),
    templateId: z.string().min(1).max(80),
    modelProvider: z.enum(["openai", "ollama"]).optional(),
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
  const modelSelection = resolveModelSelection(parsed.data);
  const openAIApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const warnings: string[] = [];
  let plan: GeneratedDeckPlan = fallback;
  let source: "ai" | "fallback" = "fallback";

  if (modelSelection.provider === "openai" && !openAIApiKey) {
    warnings.push(
      "OPENAI_API_KEY is not configured. Used fallback content.",
    );
  } else {
    try {
      const languageModel = createGenerationLanguageModel(
        modelSelection,
        openAIApiKey,
      );
      const schema = createPlanSchema(slideCount, generationLayouts);
      const modelPlan = await generateStructuredPlan({
        languageModel,
        schema,
        description,
        slideCount,
        templateLabel: template.label,
        generationLayouts,
        provider: modelSelection.provider,
      });
      plan = resolveModelPlanLayoutSelections(
        modelPlan,
        generationLayouts,
        fallback,
      );
      source = "ai";
    } catch (error) {
      const warning = generationFailureWarning(
        modelSelection.provider,
        error,
      );
      console.warn("[slide-editor/generate] AI generation failed:", warning);
      warnings.push(warning);
    }
  }

  try {
    const deck = buildAdaptiveGeneratedDeck({
      template: template.deck,
      plan,
      description,
      slideCount,
      generationLayouts,
    });

    return NextResponse.json({
      deck,
      templateId: template.id,
      templateLabel: template.label,
      source,
      modelProvider: source === "ai" ? modelSelection.provider : null,
      model: source === "ai" ? modelSelection.modelId : null,
      warnings,
    });
  } catch (error) {
    console.error("[slide-editor/generate] Deck build failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to build generated deck: ${error.message}`
            : "Failed to build generated deck.",
        templateId: template.id,
        templateLabel: template.label,
        source,
        modelProvider: source === "ai" ? modelSelection.provider : null,
        model: source === "ai" ? modelSelection.modelId : null,
        warnings,
      },
      { status: 500 },
    );
  }
}

function resolveModelSelection({
  modelProvider,
  model,
}: {
  modelProvider?: GenerationModelProvider;
  model?: string;
}): GenerationModelSelection {
  const inferredProvider =
    modelProvider ??
    (model?.toLowerCase().includes("gemma") ? "ollama" : "openai");

  if (inferredProvider === "ollama") {
    return {
      provider: "ollama",
      modelId:
        model ??
        process.env.SLIDE_EDITOR_OLLAMA_MODEL ??
        process.env.OLLAMA_MODEL ??
        DEFAULT_OLLAMA_MODEL,
    };
  }

  return {
    provider: "openai",
    modelId:
      model ??
      process.env.SLIDE_EDITOR_OPENAI_MODEL ??
      process.env.OPENAI_MODEL ??
      DEFAULT_OPENAI_MODEL,
  };
}

function createGenerationLanguageModel(
  selection: GenerationModelSelection,
  openAIApiKey: string,
) {
  if (selection.provider === "ollama") {
    const ollama = createOllama({
      baseURL: ollamaBaseURL(),
      apiKey: process.env.OLLAMA_API_KEY?.trim() || undefined,
    });
    return ollama(selection.modelId, {
      structuredOutputs: true,
      reliableObjectGeneration: true,
      objectGenerationOptions: {
        maxRetries: 3,
        attemptRecovery: true,
        useFallbacks: true,
        fixTypeMismatches: true,
        enableTextRepair: true,
      },
      options: {
        temperature: 0.15,
        num_ctx: 8192,
      },
    });
  }

  const openai = createOpenAI({ apiKey: openAIApiKey });
  return openai.responses(selection.modelId);
}

function ollamaBaseURL() {
  const configured =
    process.env.SLIDE_EDITOR_OLLAMA_BASE_URL?.trim() ??
    process.env.OLLAMA_BASE_URL?.trim() ??
    "";
  if (!configured) return DEFAULT_OLLAMA_BASE_URL;
  return configured.replace(/\/(?:v1|api)\/?$/, "").replace(/\/+$/, "");
}

function providerLabel(provider: GenerationModelProvider) {
  return provider === "ollama" ? "Ollama" : "OpenAI";
}

function generationFailureWarning(
  provider: GenerationModelProvider,
  error: unknown,
) {
  const label = providerLabel(provider);
  if (!(error instanceof Error)) {
    return `${label} generation failed. Used fallback content.`;
  }

  return `${label} generation failed: ${truncateWarning(
    summarizeGenerationError(error),
  )}. Used fallback content.`;
}

function summarizeGenerationError(error: Error) {
  const zodSummary = summarizeZodCause(error);
  if (zodSummary) return zodSummary;
  return error.message || "Unknown generation error";
}

function summarizeZodCause(error: Error) {
  const queue: unknown[] = [error];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    if (current instanceof z.ZodError) {
      return current.issues
        .slice(0, 2)
        .map((issue) => {
          const path = issue.path.length ? issue.path.join(".") : "output";
          return `${path}: ${issue.message}`;
        })
        .join("; ");
    }

    if (current instanceof Error) {
      queue.push((current as Error & { cause?: unknown }).cause);
    }
  }

  return null;
}

function truncateWarning(message: string) {
  return message.length > 280 ? `${message.slice(0, 280)}...` : message;
}

async function generateStructuredPlan({
  languageModel,
  schema,
  description,
  slideCount,
  templateLabel,
  generationLayouts,
  provider,
}: {
  languageModel: Parameters<typeof generateAIText>[0]["model"];
  schema: ReturnType<typeof createPlanSchema>;
  description: string;
  slideCount: number;
  templateLabel: string;
  generationLayouts: ReadonlyArray<GenerationLayoutMetadata>;
  provider: GenerationModelProvider;
}): Promise<ModelDeckPlan> {
  const options = {
    model: languageModel,
    temperature: provider === "ollama" ? 0.15 : 0.25,
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
      templateLabel,
      generationLayouts,
    }),
  } satisfies Parameters<typeof generateAIText>[0];

  const result =
    provider === "ollama"
      ? await generateOllamaText({
          ...options,
          enhancedOptions: {
            enableSynthesis: true,
            maxSynthesisAttempts: 2,
            minResponseLength: 1,
          },
        })
      : await generateAIText(options);

  return result.output;
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
                          value: z.number().min(-1000000).max(1000000),
                        })
                        .strict(),
                    )
                    .min(1)
                    .max(8),
                })
                .strict()
                .nullable(),
              table: z
                .object({
                  columns: z.array(z.string().min(1).max(40)).min(1).max(6),
                  rows: z
                    .array(z.array(z.string().min(1).max(60)).min(1).max(6))
                    .min(1)
                    .max(7),
                })
                .strict()
                .nullable(),
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
Set chart to null unless the slide needs a real subject-specific chart.
Set table to null unless the slide needs a real comparison, timeline, or matrix.
Chart data values may be negative for real declines, losses, contractions, or below-baseline rates.
Always provide body, bullets, metrics, chart, table, and imagePrompt fields for every slide.
Use empty bullets and metrics arrays when they do not add subject-specific value; never add filler just to occupy a layout area.
For cover slides, body should contain the main promise/summary, and bullets should be empty unless each bullet is concrete to the user's subject.
Never use placeholders such as N/A, none, not applicable, placeholder, TBD, or dummy 0 values for chart or table content.
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
      const { chart, layoutId, table, ...content } = slide;

      return {
        ...content,
        chart: chart ?? undefined,
        table: table ?? undefined,
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
