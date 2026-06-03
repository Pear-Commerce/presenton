# Experimental Template To Slide Generation

This document describes the experimental slide-editor generation route at
`servers/nextjs/app/api/slide-editor/generate/route.ts`.

The route turns a user description, slide count, and selected editor template
into an editable `Deck`. It is designed around a two-step contract:

1. The model creates a content-only deck plan and selects one `layoutId` per
   slide from template-owned generation metadata.
2. The server resolves each `layoutId` to the real template `slideIndex`, then
   renders editable slide-editor elements from the normalized plan.

The current implementation is not a direct "clone a template slide and replace
text boxes" pipeline. The selected template provides theme, layout inventory,
and generation metadata; `buildAdaptiveGeneratedDeck` then creates adaptive
editable slides from the selected semantic layout and generated content.

## Endpoint

`POST /api/slide-editor/generate`

Route settings:

- `dynamic = "force-dynamic"` so each request is evaluated at runtime.
- `runtime = "nodejs"` because the route uses the Vercel AI SDK and OpenAI
  provider on the server.
- The route itself does not perform authentication. Any access control happens
  outside this file.

## Request

The request body is validated with a strict Zod schema. Unknown fields are
rejected.

```json
{
  "description": "Quarterly product strategy for a leadership review",
  "slideCount": 6,
  "templateId": "neo-general",
  "model": "gpt-4.1-mini"
}
```

Fields:

- `description`: string, 8 to 4000 characters. This is the user's brief.
- `slideCount`: integer, 1 to 20. The route returns exactly this many slides.
- `templateId`: string, 1 to 80 characters. Must match an entry in
  `TEMPLATES`.
- `model`: optional string, 1 to 160 characters. Overrides the configured model
  for this request.

Validation responses:

- Invalid JSON returns `400` with `{ "error": "Invalid JSON body." }`.
- Invalid schema returns `400` with `{ "error": "Invalid generation request.",
  "details": ... }`.
- Unknown template returns `404` with
  `{ "error": "Unknown slide editor template: <templateId>" }`.

## Response

Successful responses return a generated editable deck and generation metadata:

```json
{
  "deck": {},
  "templateId": "neo-general",
  "templateLabel": "Neo General",
  "source": "ai",
  "model": "gpt-4.1-mini",
  "warnings": []
}
```

Fields:

- `deck`: the generated slide-editor `Deck`.
- `templateId`: the selected template id from the request.
- `templateLabel`: the human-readable label from `TEMPLATES`.
- `source`: `"ai"` when OpenAI generation succeeded, otherwise `"fallback"`.
- `model`: the model id used for AI generation, or `null` for fallback output.
- `warnings`: strings describing fallback reasons, such as a missing
  `OPENAI_API_KEY` or an OpenAI generation failure.

## Model Selection

The route uses OpenAI through the Vercel AI SDK:

```ts
const openai = createOpenAI({ apiKey });
generateText({ model: openai.responses(modelId), ... });
```

The model id is resolved in this order:

1. Request body `model`
2. `SLIDE_EDITOR_OPENAI_MODEL`
3. `OPENAI_MODEL`
4. `gpt-4.1-mini`

If `OPENAI_API_KEY` is missing or blank, the route skips AI generation and uses
fallback content.

## Template Lookup

Templates are defined in
`servers/nextjs/components/slide-editor/templates/index.ts`.

Each `TemplateDescriptor` can include:

```ts
type TemplateDescriptor = {
  id: string;
  label: string;
  description: string;
  deck: Deck;
  componentTemplates?: ReadonlyArray<ComponentTemplate>;
  generationLayouts?: ReadonlyArray<GenerationLayoutMetadata>;
};
```

The important generation field is `generationLayouts`. When present, it makes a
template self-contained for generation. Neo General currently provides this in
`servers/nextjs/components/slide-editor/templates/neo-general.ts`.

## Generation Layout Metadata

Generation metadata is the bridge between an LLM-friendly layout choice and the
actual slide inside a template.

```ts
type GenerationLayoutMetadata = {
  layoutId: string;
  slideIndex: number;
  layoutName: string;
  layoutDescription: string;
  semanticKind: GenerationLayoutKind;
  schemaFields: string[];
};
```

Fields:

- `layoutId`: stable id the model chooses. This is the canonical model-facing
  selection key.
- `slideIndex`: actual index into `template.deck.slides`. The model is told not
  to output this; the server uses it after the model returns `layoutId`.
- `layoutName`: concise human-readable layout name.
- `layoutDescription`: layout behavior and best use case.
- `semanticKind`: broad purpose, such as `cover`, `cards`, `chart`,
  `timeline`, or `closing`.
- `schemaFields`: guidance for what content fields matter for that layout.

For templates without explicit `generationLayouts`, the route derives a fallback
metadata list from `createLayoutCatalog(template.deck)`. Those derived entries
look like:

```ts
{
  layoutId: `template-layout-${layout.index}`,
  slideIndex: layout.index,
  layoutName: layout.title,
  layoutDescription: layout.description,
  semanticKind: semanticKindFromTags(layout.tags),
  schemaFields: schemaFieldsFromSlots(layout.slotSummary)
}
```

This keeps generation usable for every template, but explicit metadata is better
because it gives the model stronger semantic names, descriptions, and schema
intent.

## AI Output Contract

The model is asked for a content-only `ModelDeckPlan`. The schema is built with
`createPlanSchema(slideCount, generationLayouts)`.

Important details:

- The model must return exactly `slideCount` slides.
- Each slide must choose `layoutId` from a Zod enum of known metadata ids.
- The model must not output `layoutIndex`, `slideIndex`, coordinates, colors, or
  font details.
- The output object is strict, so extra fields are rejected.
- Every slide must include `body`, `bullets`, `metrics`, `chart`, `table`, and
  `imagePrompt`, even if some fields are not later rendered.

Slide shape expected from the model:

```ts
{
  layoutId: "timeline-alternating-cards-slide",
  kind: "timeline",
  title: "Road to Launch",
  body: ["Key milestones from planning to rollout."],
  bullets: ["Research complete", "Pilot launched", "Scale-up ready"],
  metrics: [],
  chart: {
    title: "Milestone Progress",
    type: "bar",
    data: [{ label: "Pilot", value: 80 }]
  },
  table: {
    columns: ["Phase", "Outcome"],
    rows: [["Pilot", "Validated core workflow"]]
  },
  imagePrompt: "product launch roadmap"
}
```

The route uses `Output.object` from the Vercel AI SDK so the response is parsed
as structured output instead of free-form text.

## Prompt Strategy

The system prompt gives durable rules:

- Build exactly the requested number of slides.
- Choose only a provided `layoutId`.
- Make slide 1 a cover when there is more than one slide.
- Make the final slide a closing slide when there are more than two slides.
- Keep `kind` compatible with `layoutId`.
- Leave optional arrays empty when they do not add subject-specific value.
- Avoid generic planning/template language in visible copy.
- Keep fields short for weaker local models.

The user prompt is JSON. It contains:

- `task`
- `template`
- `slideCount`
- `userDescription`
- `generationPattern`
- `generationLayoutMetadata`
- `selectionGuidance`

The prompt intentionally avoids asking the model to choose both a `layoutIndex`
and a `layoutId`. The model chooses one `layoutId`; the server resolves the real
slide index.

## Layout Resolution

After AI generation succeeds, the route calls
`resolveModelPlanLayoutSelections`.

That function performs this mapping:

```txt
model slide.layoutId
  -> GenerationLayoutMetadata.layoutId
  -> GenerationLayoutMetadata.slideIndex
  -> GeneratedSlideContent.layoutIndex
```

It also stores the selected `layoutId` as `inspiredLayoutId` because
`buildAdaptiveGeneratedDeck` still uses that field as a semantic hint.

If a layout id is somehow missing, the route falls back to a compatible metadata
entry based on `kind`:

- `cover`: `cover`, `visual`, `general`
- `timeline`: `timeline`, `cards`, `general`
- `metrics`: `metrics`, `chart`, `cards`
- `chart`: `chart`, `metrics`
- `table`: `table`, `cards`
- `closing`: `closing`, `general`
- `bullets`: `bullets`, `cards`, `general`
- `cards`: `cards`, `visual`, `quote`, `team`, `general`
- `general`: `general`, `cards`, `visual`

The fallback compatibility path is mostly defensive because the Zod enum should
prevent unknown layout ids in normal AI output.

## Fallback Generation

Fallback generation is used when:

- `OPENAI_API_KEY` is not configured.
- The OpenAI request fails.
- Structured output parsing fails.

The route starts with:

```ts
const fallback = syncPlanLayoutIdsToMetadata(
  fallbackGeneratedPlan(template.deck, description, slideCount),
  generationLayouts,
);
```

`fallbackGeneratedPlan` creates a deterministic plan from the description and
template layout catalog. `syncPlanLayoutIdsToMetadata` then aligns that plan
with the same generation metadata used by AI output, so fallback slides also
carry consistent `layoutIndex` and `inspiredLayoutId` values.

If OpenAI fails after fallback is prepared, the route keeps `source = "fallback"`
and returns a warning explaining the failure.

## Deck Building

The final server step is:

```ts
const deck = buildAdaptiveGeneratedDeck({
  template: template.deck,
  plan,
  description,
  slideCount,
});
```

`buildAdaptiveGeneratedDeck` lives in
`servers/nextjs/components/slide-editor/lib/ai-slide-generation.ts`.

At a high level, it:

- Normalizes the generated plan against fallback content.
- Forces slide 1 to `cover` for multi-slide decks.
- Forces the last slide to `closing` for decks longer than two slides.
- Uses the selected `layoutIndex` and `inspiredLayoutId` as semantic hints.
- Builds editable slide elements with adaptive cover, cards, timeline, metrics,
  chart, table, and closing renderers.
- Parses the result with `DeckSchema` before returning.

This means the selected template acts as the layout and theme source, while the
adaptive builder is responsible for producing robust editable slide content.

## Adding A Template For Generation

To make a template generation-ready:

1. Add or update a template deck in
   `servers/nextjs/components/slide-editor/templates`.
2. Export a `generationLayouts` array from that template file.
3. Include one metadata item for each layout the model should be allowed to
   choose.
4. Set `slideIndex` to the actual index of the corresponding slide in
   `deck.slides`.
5. Add `generationLayouts` to the template descriptor in
   `templates/index.ts`.

Example:

```ts
export const myTemplateGenerationLayouts = [
  {
    layoutId: "customer-story-cover",
    slideIndex: 0,
    layoutName: "Customer Story Cover",
    layoutDescription:
      "Opening slide with customer name, transformation promise, and supporting visual.",
    semanticKind: "cover",
    schemaFields: ["title", "body[0]=customer promise", "imagePrompt"],
  },
] satisfies GenerationLayoutMetadata[];
```

Keep `layoutId` stable. Changing it affects prompts, fallback alignment, and any
saved/generated plans that reference that layout id.

## Current Limitations

- The route currently uses OpenAI only. Local model support would need another
  provider path or a provider abstraction around the Vercel AI SDK call.
- `slideIndex` is included in prompt metadata for transparency, but the model is
  instructed not to output it. If this becomes confusing for weaker models, the
  prompt payload can omit `slideIndex` while retaining it server-side.
- Explicit generation metadata exists for Neo General. Other templates work via
  derived metadata, but they will select better layouts once they define their
  own metadata.
- The adaptive builder still consumes `inspiredLayoutId` internally. The route
  now derives it from `layoutId`, so callers should treat `layoutId` as the
  canonical model-facing selection.
