import type { Slide, SlideElement } from "./lib/slide-schema";

export type ComponentTemplate = {
  id: string;
  label: string;
  description?: string;
  elements: SlideElement[];
};

export type SlideTemplate = {
  id: string;
  label: string;
  description?: string;
  slide: Slide;
};

export function createSlideTemplatesFromDeck(deck: { slides: Slide[] }) {
  return deck.slides.map(
    (slide, index): SlideTemplate => ({
      id: `${index}-${slide.title ?? "slide"}`,
      label: slide.title ?? `Slide ${index + 1}`,
      description: `${slide.elements.length} elements`,
      slide,
    }),
  );
}
