import type { Deck } from "../lib/slide-schema";
import type { ComponentTemplate } from "../componentTemplates";
import type { GenerationLayoutMetadata } from "../lib/slide-generation-layout-metadata";
import { layoutKitDeck } from "./layout-kit";
import { layoutsJsonDeck } from "./layouts";
import { neoGeneralDeck, neoGeneralGenerationLayouts } from "./neo-general";
import { reportDeck } from "./report";

export type TemplateDescriptor = {
  id: string;
  label: string;
  description: string;
  deck: Deck;
  componentTemplates?: ReadonlyArray<ComponentTemplate>;
  generationLayouts?: ReadonlyArray<GenerationLayoutMetadata>;
};

export const TEMPLATES: ReadonlyArray<TemplateDescriptor> = [
  {
    id: "layout-kit",
    label: "Editor Showcase",
    description:
      "Guided editor feature tour built from editable layout elements.",
    deck: layoutKitDeck,
  },
  {
    id: "layouts-json",
    label: "Converted Layouts",
    description:
      "PPTX-derived layouts adapted from layouts.json into editable slides.",
    deck: layoutsJsonDeck,
  },
  {
    id: "neo-general",
    label: "Neo General",
    description:
      "Legacy Neo General layouts rebuilt as editable slide-editor elements.",
    deck: neoGeneralDeck,
    generationLayouts: neoGeneralGenerationLayouts,
  },
  {
    id: "report",
    label: "Report",
    description:
      "Legacy Report layouts rebuilt as editable slide-editor elements.",
    deck: reportDeck,
  },
];

export {
  layoutKitDeck,
  layoutsJsonDeck,
  neoGeneralDeck,
  neoGeneralGenerationLayouts,
  reportDeck,
};
