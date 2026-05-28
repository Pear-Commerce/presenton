import type { SlideElement } from "../lib/slide-schema";
import {
  createDefaultElementFromRegistry,
  type ElementKind,
} from "../registry";

export function createDefaultElement(type: ElementKind): SlideElement {
  return createDefaultElementFromRegistry(type);
}
