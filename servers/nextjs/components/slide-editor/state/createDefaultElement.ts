import type { SlideElement } from "../lib/slide-schema";
import { createDefaultElementFromRegistry } from "../registry";

export function createDefaultElement(kind: SlideElement["kind"]): SlideElement {
  return createDefaultElementFromRegistry(kind);
}
