# Slide Generation From Form To Template

This document explains how the slide-editor generation flow works from the
moment a user clicks `Generate` to the moment an editable deck appears in the
canvas.

The short version: the user gives an intent, the UI sends a structured request,
the server asks a model for a content-only slide plan, the server maps that plan
onto a template-owned layout catalog, and the slide editor renders a normal
editable `Deck`.

The important idea is that the model does not directly draw slides. It chooses
slide purposes and fills content fields. The application owns layout,
coordinates, theme, validation, fallback behavior, and final editable output.

## The User Story

A user is in the slide editor with a deck open. They do not want to start from a
blank deck, and they do not want a static image of slides. They want editable
slides that feel like they came from a real template.

They click `Generate`.

The modal asks for four decisions:

- `Description`: the user's brief, for example "Technology development roadmap
  for an AI-powered product pitch".
- `Slides`: the exact number of slides to create, from 1 to 20.
- `Model`: currently OpenAI or local Gemma through Ollama.
- `Template`: the visual/generation template to use, such as `Neo General`.

When the user submits, the UI sends a compact request to:

```txt
POST /api/slide-editor/generate
```

The result is not an image, a PDF, or a rendered HTML page. The result is a
slide-editor `Deck` object. That means the generated slides can still be
selected, edited, themed, exported, presented, and rearranged like any other
deck in the editor.

## Main Actors

The flow is split across a few files:

- `GenerateSlidesModal.tsx`: collects the user prompt, slide count, template,
  and model.
- `SlideEditor.tsx`: owns the modal state, sends the request, receives the
  generated deck, and swaps it into the editor.
- `app/api/slide-editor/generate/route.ts`: validates the request, calls the
  selected model, resolves template layout metadata, and returns a deck.
- `templates/index.ts`: lists available slide-editor templates.
- `templates/neo-general.ts` and `templates/report.ts`: define editable decks
  and template-owned generation layout metadata.
- `slide-generation-layout-metadata.ts`: defines the model-facing layout
  metadata shape.
- `ai-slide-generation.ts`: turns a normalized generation plan into editable
  slide-editor elements.

## Step 1: The Generate Button Opens The Form

In `SlideEditor.tsx`, the topbar renders a template selector and the `Generate`
button. When the button is clicked, the editor opens `GenerateSlidesModal`.

The modal is deliberately small. It does not ask the user to pick slide layouts
one by one. That is the model's job. The user only supplies:

```ts
type SlideGenerationInput = {
  description: string;
  slideCount: number;
  templateId: string;
  modelProvider: "openai" | "ollama";
  model: string;
};
```

The modal keeps local state for:

- `description`
- `slideCount`
- `templateId`
- `modelOptionId`

The generate button is enabled only when the description has at least 8
characters and no generation request is already running.

## Step 2: The Client Sends A Request

When the form is submitted, `SlideEditor.tsx` calls:

```ts
fetch("/api/slide-editor/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
});
```

The client reads the response as text first, then parses JSON. This is
intentional. If the server returns an empty or non-JSON error body, the browser
should show a useful failure message instead of crashing with:

```txt
Unexpected end of JSON input
```

If the response is successful and contains both `deck` and `templateId`, the
editor calls `resetEditorState(payload.templateId, payload.deck)`. That swaps in
the generated deck, resets selection, closes drawers, and returns the user to
slide 1.

If the route returns warnings, the browser logs them. Warnings are not fatal.
They usually mean the route fell back to deterministic content because the
selected model failed or a provider key was missing.

## Step 3: The Route Validates The Request

The route starts with a strict Zod request schema:

```ts
{
  description: string; // 8 to 4000 chars
  slideCount: number;  // integer, 1 to 20
  templateId: string;  // selected editor template id
  modelProvider?: "openai" | "ollama";
  model?: string;
}
```

Unknown fields are rejected. This matters because the model pipeline depends on
a small, predictable input shape.

The route then finds the selected template:

```ts
const template = TEMPLATES.find((item) => item.id === templateId);
```

If the template id is unknown, the route returns `404`. If the JSON body is
invalid or does not match the schema, the route returns `400`.

## Step 4: The Template Becomes A Layout Catalog

A template is not only a visual preset. It is also the source of available slide
structures.

Each template descriptor can provide:

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

The key generation field is `generationLayouts`.

For generation-ready templates such as `Neo General` and `Report`, this
metadata lives beside the template itself in files like
`templates/neo-general.ts` and `templates/report.ts`. Each entry connects a
model-friendly `layoutId` to an actual slide inside the template deck:

```ts
type GenerationLayoutMetadata = {
  layoutId: string;
  slideIndex: number;
  layoutName: string;
  layoutDescription: string;
  semanticKind:
    | "cover"
    | "general"
    | "bullets"
    | "cards"
    | "metrics"
    | "chart"
    | "table"
    | "timeline"
    | "quote"
    | "team"
    | "visual"
    | "closing";
  schemaFields: string[];
};
```

For example:

```ts
{
  layoutId: "timeline-alternating-cards-slide",
  slideIndex: 8,
  layoutName: "Timeline Alternating Cards",
  layoutDescription: "A timeline layout for milestones and sequenced events.",
  semanticKind: "timeline",
  schemaFields: [
    "title",
    "table.columns=[Year,Milestone,Impact]",
    "table.rows",
    "bullets[]"
  ]
}
```

This lets the model choose a stable semantic id instead of guessing the internal
template slide index. The model sees `layoutId`. The server later resolves that
id to `slideIndex`.

If a template does not provide explicit generation metadata, the route derives a
fallback catalog using `createLayoutCatalog(template.deck)`. It scans each slide
for text, lists, charts, tables, images, and title keywords, then creates generic
metadata like:

```ts
{
  layoutId: "template-layout-0",
  slideIndex: 0,
  semanticKind: "cards",
  schemaFields: ["title", "body[]", "bullets[]"]
}
```

Explicit metadata is better because it is more meaningful for the model, but the
fallback keeps every template usable.

## Step 5: The Route Chooses The Model

The route supports two providers:

- `openai`: uses the OpenAI Responses API through `@ai-sdk/openai`.
- `ollama`: uses local Ollama through `ai-sdk-ollama`.

The provider is resolved like this:

1. Use request body `modelProvider` if present.
2. If no provider was supplied and the model name contains `gemma`, use
   `ollama`.
3. Otherwise use `openai`.

OpenAI model resolution:

1. Request body `model`
2. `SLIDE_EDITOR_OPENAI_MODEL`
3. `OPENAI_MODEL`
4. `gpt-4.1-mini`

Ollama model resolution:

1. Request body `model`
2. `SLIDE_EDITOR_OLLAMA_MODEL`
3. `OLLAMA_MODEL`
4. `gemma4`

Ollama base URL resolution:

1. `SLIDE_EDITOR_OLLAMA_BASE_URL`
2. `OLLAMA_BASE_URL`
3. `http://localhost:11434`

If the Ollama base URL ends in `/v1` or `/api`, the route strips that suffix.
The community Ollama provider expects the root Ollama host, not the
OpenAI-compatible path.

If OpenAI is selected and `OPENAI_API_KEY` is missing, the route does not fail
the whole request. It returns fallback generated content with a warning.

## Step 6: The Route Builds A Safe Fallback First

Before calling any model, the route creates a deterministic fallback plan:

```ts
const fallback = syncPlanLayoutIdsToMetadata(
  fallbackGeneratedPlan(template.deck, description, slideCount),
  generationLayouts,
);
```

This fallback matters for three reasons:

- The user still gets a deck when the model fails.
- The normalizer can fill missing slides or fields.
- Layout choices can be aligned to the template's generation metadata.

The fallback is not supposed to be the best possible deck. It is a safety net.
The AI path should replace it when provider generation succeeds.

## Step 7: The Model Gets A Content-Only Contract

The model is asked to return a `ModelDeckPlan`. It does not return a full
slide-editor `Deck`.

The model output has this shape:

```ts
type ModelDeckPlan = {
  title: string;
  outline: string[];
  slides: Array<{
    layoutId: string;
    kind:
      | "cover"
      | "general"
      | "bullets"
      | "cards"
      | "metrics"
      | "chart"
      | "table"
      | "timeline"
      | "closing";
    title: string;
    body: string[];
    bullets: string[];
    metrics: Array<{
      value: string;
      label: string;
      description: string;
    }>;
    chart: {
      title: string;
      type: "bar" | "line" | "donut";
      data: Array<{ label: string; value: number }>;
    } | null;
    table: {
      columns: string[];
      rows: string[][];
    } | null;
    imagePrompt: string;
  }>;
};
```

Notice a few important constraints:

- The model must return exactly `slideCount` slides.
- The model must choose `layoutId` from the provided layout metadata.
- The model must not output `slideIndex` or `layoutIndex`.
- The model must not output coordinates, colors, or fonts.
- The model must not copy layout names or schema field names into visible slide
  text.
- The model should set `chart` to `null` unless the slide really needs a chart.
- The model should set `table` to `null` unless the slide really needs a
  comparison, timeline, or matrix.

The `chart` and `table` fields are nullable instead of optional for a specific
technical reason: OpenAI strict structured outputs require every property in an
object schema to appear in the required list. Nullable fields keep the schema
valid while still letting the model say "this slide has no chart".

This also helps local models. Gemma can return simple literal JSON with
`chart: null` instead of inventing placeholder chart data like:

```txt
Title: N/A
N/A, 0
```

The route and deck builder also sanitize placeholder content in case a model
still returns it.

## Step 8: The Prompt Teaches The Model The Narrative Job

The route sends a system prompt and a JSON user prompt.

The system prompt sets global rules:

- Create a content-only plan.
- Return exactly the requested number of slides.
- Use concise copy that fits.
- Make slide 1 a cover when the deck has more than one slide.
- Make the final slide a closing slide when the deck has more than two slides.
- Use varied slide purposes.
- Do not produce scaffold text like "Recommended next action".
- Do not output layout geometry.
- Avoid fake chart/table placeholders.

The user prompt gives the model:

- The user's description.
- The requested slide count.
- The selected template label.
- The generation layout metadata.
- A three-step generation pattern:
  1. Create a concise outline.
  2. Select one `layoutId` per slide.
  3. Fill the schema-shaped content fields.

This is the heart of the generation design. The model is not told "draw a
slide." It is told "choose the right semantic layout and provide content that
fits that layout."

That distinction is what lets weaker local models participate. They only need
to produce a small structured plan, not a full visual representation.

## Step 9: Structured Output Is Validated

Both provider paths use the Vercel AI SDK `Output.object` helper with a Zod
schema.

OpenAI path:

```ts
const openai = createOpenAI({ apiKey });
return openai.responses(modelId);
```

Ollama path:

```ts
const ollama = createOllama({
  baseURL: ollamaBaseURL(),
});

return ollama(modelId, {
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
```

The route uses a lower temperature for local Ollama generation to keep outputs
more literal and schema-shaped.

If the model fails validation, the route catches the error, summarizes it, adds
a warning, and continues with fallback content.

## Step 10: The Server Resolves Layout IDs

The model returns `layoutId`, not `slideIndex`.

The route converts model-facing layout IDs into internal template slide indexes:

```ts
const layoutById = new Map(
  generationLayouts.map((layout) => [layout.layoutId, layout]),
);
```

For each generated slide:

1. Find the matching metadata entry by `layoutId`.
2. Read that metadata entry's `slideIndex`.
3. Store it as `layoutIndex` in the generated plan.
4. Preserve the chosen `layoutId` as `inspiredLayoutId`.
5. Convert `chart: null` and `table: null` into `undefined` for the deck
   builder.

If the model chooses an unknown layout id, the route picks a compatible layout
based on the slide kind. For example:

- `cover` prefers `cover`, then `visual`, then `general`.
- `timeline` prefers `timeline`, then `cards`, then `general`.
- `metrics` prefers `metrics`, then `chart`, then `cards`.
- `closing` prefers `closing`, then `general`.

This prevents one bad layout id from breaking the whole deck.

## Step 11: The Adaptive Builder Creates Real Slides

The route then calls:

```ts
buildAdaptiveGeneratedDeck({
  template: template.deck,
  plan,
  description,
  slideCount,
  generationLayouts,
});
```

This is where the content-only plan becomes a real editable `Deck`.

The builder:

- Creates a fallback plan.
- Normalizes the AI plan against the fallback.
- Builds a layout catalog from the template.
- Uses template generation metadata to preserve semantic cover and closing
  slide choices.
- Extracts/adapts theme colors.
- Forces slide 1 to be a cover when appropriate.
- Forces the final slide to be a closing slide when appropriate.
- First tries to clone and fill the selected native template slide.
- Falls back to adaptive editable slide-editor elements when native filling is
  not possible.
- Validates the final result with `DeckSchema.parse`.

The builder keeps generated slides coherent with the selected template by
reusing native template slides whenever possible. It fills text, list, chart,
table, metric, and image slots from the content-only plan while preserving the
template's geometry, colors, typography, and decorative elements.

When a native slide is not a good fit, the adaptive fallback still uses the
selected layout's semantic purpose and the template theme to compose robust
editable slides. This keeps local-model generation usable even when the model's
layout choice or content shape is imperfect.

## Step 12: Sanitization Protects The Output

Models sometimes produce text that is structurally valid but visually bad. For
example:

```txt
N/A
placeholder
recommended next action
risks, constraints, and assumptions
```

The builder sanitizes generated content before rendering:

- Scaffold titles are replaced or dropped.
- Placeholder chart/table data is removed.
- A `chart` slide without usable chart data degrades to a card/general slide.
- A `table` slide without usable table rows degrades to a card/general slide.
- Donut charts with negative data are converted to a safer chart type.
- Text is truncated and cleaned so it fits the generated layout.

This layer is important because a technically valid JSON plan can still be a bad
slide. The sanitization step protects the user from seeing obvious model
artifacts in the final deck.

## Step 13: The Route Returns A Deck

On success, the route returns:

```json
{
  "deck": {},
  "templateId": "neo-general",
  "templateLabel": "Neo General",
  "source": "ai",
  "modelProvider": "openai",
  "model": "gpt-4.1-mini",
  "warnings": []
}
```

If the provider failed but fallback generation succeeded, the response still has
HTTP `200`, but `source` is `"fallback"` and `warnings` explains why.

If the deck builder itself fails, the route returns HTTP `500` with a JSON error
body. The client can display that error safely because it reads response text
before parsing JSON.

## Step 14: The Client Installs The Generated Deck

Back in `SlideEditor.tsx`, the client receives the deck and calls:

```ts
resetEditorState(payload.templateId, payload.deck);
```

That function:

- Stores the generated deck in `deckAtom`.
- Sets the active slide to 0.
- Clears element selection.
- Closes open drawers and modals.
- Stops presentation mode.
- Records the selected template id.

From the user's point of view, the generation modal closes and the new deck is
now open in the editor.

## What The User Gets

The final output is a normal slide-editor deck:

- Text is editable.
- Cards, shapes, tables, charts, images, and groups are normal editor elements.
- The deck can be presented.
- The deck can be exported to PDF or PPTX.
- The user can open theme controls and update colors.
- The user can insert, delete, rearrange, and edit slides.

This is the main product distinction: the generated deck is not a screenshot.
It is not a static preview. It is live editor data.

## Why The Flow Is Designed This Way

The system separates responsibilities:

- User: describes intent.
- Template: defines available visual/layout vocabulary.
- Model: chooses slide purposes and writes content.
- Route: validates, resolves layouts, handles provider differences, and
  provides fallback.
- Builder: turns content into editable slide structures.
- Editor: renders and lets the user continue working.

This makes generation more reliable with both strong hosted models and weaker
local models. The model has a narrow job: produce structured content. The code
has the harder visual job: layout, cleanup, fallback, and final deck validation.

## Adding A Better Template For Generation

To make a template generate well, keep it self-contained:

1. Define the template deck.
2. Add `generationLayouts` beside the template.
3. Give each layout a stable `layoutId`.
4. Point each layout to the real `slideIndex`.
5. Write a practical `layoutDescription`.
6. Set `semanticKind` accurately.
7. Give `schemaFields` that tell the model what content matters.
8. Export the metadata from `templates/index.ts` through the template
   descriptor's `generationLayouts` field.

Good metadata is specific:

```ts
{
  layoutId: "title-with-full-width-chart",
  slideIndex: 2,
  layoutName: "Full Width Chart",
  layoutDescription:
    "A data-focused slide for one chart and one clear takeaway.",
  semanticKind: "chart",
  schemaFields: ["title", "body[0]=chart takeaway", "chart"]
}
```

Weak metadata is vague:

```ts
{
  layoutId: "slide-2",
  layoutDescription: "A nice slide.",
  semanticKind: "general",
  schemaFields: ["title", "body"]
}
```

The first version gives the model a real decision surface. The second version
forces the model to guess.

## Common Failure Modes

### OpenAI says a schema field is missing

OpenAI strict structured outputs require every property to be part of the
object's required schema. For fields that should be skippable, use nullable
values instead of optional keys.

That is why generated slides use:

```ts
chart: GeneratedChart | null;
table: GeneratedTable | null;
```

not:

```ts
chart?: GeneratedChart;
table?: GeneratedTable;
```

### Local model returns placeholder chart data

The prompt tells the model not to do this, but the builder still sanitizes it.
Placeholder chart/table data is dropped before rendering.

### The model chooses the wrong layout

The server maps layout ids to metadata. If the id is unknown, it picks a
compatible layout by semantic kind. This keeps the request from failing because
of one bad selection.

### The model fails completely

The route falls back to deterministic content and returns a warning. The user
still gets an editable deck.

### The deck builder fails

The route returns a JSON `500` response. The client handles it without crashing
on an empty response body.

## Mental Model

Think of the pipeline like a production team:

1. The user is the creative director.
2. The template is the brand/layout system.
3. The model is the content strategist.
4. The route is the producer who checks contracts and assigns layouts.
5. The adaptive builder is the designer who creates the actual slides.
6. The slide editor is the studio where the user keeps refining the result.

That is the reason the implementation has more steps than "send prompt, get
slides." Each step exists to keep the final deck editable, template-aware, and
usable even when the model is small, local, or imperfect.
