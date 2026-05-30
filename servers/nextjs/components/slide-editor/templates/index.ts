import type { Deck } from "../lib/slide-schema";
import type { ComponentTemplate } from "../componentTemplates";
import { cybersecurityBusinessDeck } from "./cybersecurity-business";
import { ezsecurityPitchDeck } from "./ezsecurity-pitch";
import { layoutKitDeck } from "./layout-kit";
import { layoutsJsonDeck } from "./layouts";

export type TemplateDescriptor = {
  id: string;
  label: string;
  description: string;
  deck: Deck;
  componentTemplates?: ReadonlyArray<ComponentTemplate>;
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
    id: "cybersecurity-business",
    label: "Exec Review",
    description:
      "May 2026 business review with Jira and Salesforce-derived operating data.",
    deck: cybersecurityBusinessDeck,
  },
  {
    id: "ezsecurity-pitch",
    label: "Pitch Deck",
    description:
      "Series A pitch deck with traction, market, GTM, business model, and raise.",
    deck: ezsecurityPitchDeck,
  },
];

export {
  cybersecurityBusinessDeck,
  ezsecurityPitchDeck,
  layoutKitDeck,
  layoutsJsonDeck,
};
