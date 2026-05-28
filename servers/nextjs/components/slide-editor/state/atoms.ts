import { atom } from "jotai";
import { selectAtom } from "jotai/utils";
import { atomWithImmer } from "jotai-immer";
import type { Slide, SlideElement } from "../lib/slide-schema";
import { textElementOverflows } from "../lib/textMeasure";
import { layoutKitDeck } from "../templates/layout-kit";

export type ExportMode = "native" | "keynote" | "raster";
export type TextSlideElement = Extract<SlideElement, { type: "text" }>;
export type BulletsSlideElement = Extract<SlideElement, { type: "text-list" }>;
export type ImageSlideElement = Extract<SlideElement, { type: "image" }>;
export type ShapeSlideElement = Extract<
  SlideElement,
  { type: "rectangle" | "ellipse" }
>;
export type TableSlideElement = Extract<SlideElement, { type: "table" }>;
export type ChartSlideElement = Extract<SlideElement, { type: "chart" }>;
export type SvgSlideElement = Extract<SlideElement, { type: "svg" }>;
export type TableCellSelection = {
  elementIndex: number;
  rowIndex: number;
  colIndex: number;
};

// --- Primitive atoms ----------------------------------------------------

// Immer-backed: writers receive a draft of the Deck they can mutate
// directly. SlideEditor seeds the real deck via `useHydrateAtoms`.
export const deckAtom = atomWithImmer(layoutKitDeck);
export const activeSlideIndexAtom = atom(0);
export const selectedAtom = atom(-1);
export const selectedItemsAtom = atom<number[]>([]);
export const editorOpenAtom = atom(false);
export const presentingAtom = atom(false);
export const exportModeAtom = atom<ExportMode>("native");
export const isExportingAtom = atom(false);
export const editingTextIndexAtom = atom<number | null>(null);
export const editingBulletsIndexAtom = atom<number | null>(null);
export const editingBulletsDraftAtom = atom("");
export const editingTableIndexAtom = atom<number | null>(null);
export const editingTableDraftAtom = atom("");
export const editingChartIndexAtom = atom<number | null>(null);
export const editingChartDraftAtom = atom("");
export const editingSvgIndexAtom = atom<number | null>(null);
export const editingSvgDraftAtom = atom("");
export const selectedTableCellAtom = atom<TableCellSelection | null>(null);

// --- Derived atoms ------------------------------------------------------

export const activeSlideAtom = atom<Slide>((get) => {
  const deck = get(deckAtom);
  const active = get(activeSlideIndexAtom);
  return deck.slides[active];
});

// Clamp selected index against the active slide's element count so the
// inspector never points at a stale element after a delete.
export const selectedIndexAtom = selectAtom(
  atom((get) => ({
    selected: get(selectedAtom),
    count: get(activeSlideAtom)?.elements.length ?? 0,
  })),
  ({ selected, count }) =>
    selected >= 0 ? Math.min(selected, Math.max(0, count - 1)) : -1,
);

export const selectedElementAtom = atom<SlideElement | null>((get) => {
  const idx = get(selectedIndexAtom);
  if (idx < 0) return null;
  return get(activeSlideAtom)?.elements[idx] ?? null;
});

export const selectedTextElementAtom = atom<TextSlideElement | null>((get) => {
  const element = get(selectedElementAtom);
  return element?.type === "text" ? element : null;
});

export const selectedBulletsElementAtom = atom<BulletsSlideElement | null>(
  (get) => {
    const element = get(selectedElementAtom);
    return element?.type === "text-list" ? element : null;
  },
);

export const selectedImageElementAtom = atom<ImageSlideElement | null>(
  (get) => {
    const element = get(selectedElementAtom);
    return element?.type === "image" ? element : null;
  },
);

export const selectedShapeElementAtom = atom<ShapeSlideElement | null>(
  (get) => {
    const element = get(selectedElementAtom);
    return element?.type === "rectangle" || element?.type === "ellipse"
      ? element
      : null;
  },
);

export const selectedTableElementAtom = atom<TableSlideElement | null>(
  (get) => {
    const element = get(selectedElementAtom);
    return element?.type === "table" ? element : null;
  },
);

export const selectedChartElementAtom = atom<ChartSlideElement | null>(
  (get) => {
    const element = get(selectedElementAtom);
    return element?.type === "chart" ? element : null;
  },
);

export const editingTextElementAtom = atom<TextSlideElement | null>((get) => {
  const index = get(editingTextIndexAtom);
  if (index == null) return null;
  const element = get(activeSlideAtom).elements[index];
  return element?.type === "text" ? element : null;
});

export const editingBulletsElementAtom = atom<BulletsSlideElement | null>(
  (get) => {
    const index = get(editingBulletsIndexAtom);
    if (index == null) return null;
    const element = get(activeSlideAtom).elements[index];
    return element?.type === "text-list" ? element : null;
  },
);

export const editingTableElementAtom = atom<TableSlideElement | null>((get) => {
  const index = get(editingTableIndexAtom);
  if (index == null) return null;
  const element = get(activeSlideAtom).elements[index];
  return element?.type === "table" ? element : null;
});

export const editingChartElementAtom = atom<ChartSlideElement | null>((get) => {
  const index = get(editingChartIndexAtom);
  if (index == null) return null;
  const element = get(activeSlideAtom).elements[index];
  return element?.type === "chart" ? element : null;
});

export const editingSvgElementAtom = atom<SvgSlideElement | null>((get) => {
  const index = get(editingSvgIndexAtom);
  if (index == null) return null;
  const element = get(activeSlideAtom).elements[index];
  return element?.type === "svg" ? element : null;
});

// Set of element indices on the active slide whose declared `h` is too small
// to fit their rendered text. Measured via Pretext — no DOM reflow.
export const activeSlideOverflowIndicesAtom = atom<ReadonlySet<number>>(
  (get) => {
    const slide = get(activeSlideAtom);
    const overflowing = new Set<number>();
    slide.elements.forEach((element, index) => {
      if (element.type === "text" && textElementOverflows(element)) {
        overflowing.add(index);
      }
    });
    return overflowing;
  },
);

export const selectedElementOverflowsAtom = atom<boolean>((get) => {
  const idx = get(selectedIndexAtom);
  if (idx < 0) return false;
  return get(activeSlideOverflowIndicesAtom).has(idx);
});
