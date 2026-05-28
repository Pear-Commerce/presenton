import type { Deck } from "../lib/slide-schema";
import type { ComponentTemplate } from "../componentTemplates";
import { layoutKitDeck } from "./layout-kit";

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
    label: "Layout Kit",
    description: "Twenty common slide patterns built from editable elements.",
    deck: layoutKitDeck,
  },
];

export { layoutKitDeck };
