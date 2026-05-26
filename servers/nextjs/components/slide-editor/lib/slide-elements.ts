import type { SlideElement } from "./slide-schema";

export type ElementKind = SlideElement["kind"];
export type ElementToolbarKey =
  | "text"
  | "bullets"
  | "image"
  | "shape"
  | "chart"
  | "svg"
  | "table";
export type ElementInspectorKey =
  | "text"
  | "bullets"
  | "image"
  | "shape"
  | "chart"
  | "table"
  | "svg";
export type KonvaRendererKey = ElementKind;
export type DomOverlayRendererKey = "svg" | "chart" | "bullets" | "text" | "table";
export type PptxRendererKey = ElementKind;

type ElementDefinition = {
  label: string;
  addable: boolean;
  toolbar: ElementToolbarKey | null;
  inspector: ElementInspectorKey | null;
  renderers: {
    konva: KonvaRendererKey;
    domOverlay: DomOverlayRendererKey | null;
    domOverlayOrder?: number;
  };
  export: {
    pptx: PptxRendererKey;
    pdf: "raster";
  };
  createDefault: () => SlideElement;
};

const base = { x: 0.8, y: 0.8, w: 2.6, h: 0.7 } as const;

export const ELEMENT_REGISTRY = {
  rect: {
    label: "Rect",
    addable: true,
    toolbar: "shape",
    inspector: "shape",
    renderers: { konva: "rect", domOverlay: null },
    export: { pptx: "rect", pdf: "raster" },
    createDefault: () => ({ ...base, kind: "rect", fill: "D4A24C", rx: 0.08 }),
  },
  ellipse: {
    label: "Ellipse",
    addable: true,
    toolbar: "shape",
    inspector: "shape",
    renderers: { konva: "ellipse", domOverlay: null },
    export: { pptx: "ellipse", pdf: "raster" },
    createDefault: () => ({ ...base, kind: "ellipse", fill: "75AADB" }),
  },
  chart: {
    label: "Chart",
    addable: true,
    toolbar: "chart",
    inspector: "chart",
    renderers: { konva: "chart", domOverlay: "chart", domOverlayOrder: 20 },
    export: { pptx: "chart", pdf: "raster" },
    createDefault: () => ({
      ...base,
      w: 4.2,
      h: 1.8,
      kind: "chart",
      chartType: "bar",
      title: "Chart title",
      color: "D4A24C",
      axisColor: "9AA7BD",
      labelColor: "6A7894",
      showValues: true,
      data: [
        { label: "A", value: 42, color: "D4A24C" },
        { label: "B", value: 68, color: "3E78B2" },
        { label: "C", value: 54, color: "0B1F3A" },
      ],
    }),
  },
  table: {
    label: "Table",
    addable: true,
    toolbar: "table",
    inspector: "table",
    renderers: { konva: "table", domOverlay: "table", domOverlayOrder: 50 },
    export: { pptx: "table", pdf: "raster" },
    createDefault: () => ({
      ...base,
      w: 5.2,
      h: 2.1,
      kind: "table",
      rows: [
        ["Metric", "Current", "Target"],
        ["Adoption", "52%", "70%"],
        ["Revenue", "$1.2M", "$1.8M"],
        ["Retention", "84%", "90%"],
      ],
      fontFace: "Arial",
      fontSize: 11,
      textColor: "1A2B45",
      headerFill: "0B1F3A",
      headerTextColor: "FFFFFF",
      borderColor: "DDE5F0",
      fill: "FFFFFF",
    }),
  },
  image: {
    label: "Image",
    addable: true,
    toolbar: "image",
    inspector: "image",
    renderers: { konva: "image", domOverlay: null },
    export: { pptx: "image", pdf: "raster" },
    createDefault: () => ({
      ...base,
      w: 3.6,
      h: 2.4,
      kind: "image",
      fit: "contain",
    }),
  },
  svg: {
    label: "SVG",
    addable: false,
    toolbar: "svg",
    inspector: "svg",
    renderers: { konva: "svg", domOverlay: "svg", domOverlayOrder: 10 },
    export: { pptx: "svg", pdf: "raster" },
    createDefault: () => ({
      ...base,
      w: 2.4,
      h: 2.4,
      kind: "svg",
      name: "SVG shape",
      svg:
        '<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="240" height="240" rx="24" fill="#0B1F3A"/>' +
        '<circle cx="120" cy="120" r="74" fill="none" stroke="#D4A24C" stroke-width="14"/>' +
        '<path d="M62 142 C94 70, 145 70, 178 142" fill="none" stroke="#75AADB" stroke-width="14" stroke-linecap="round"/>' +
        "</svg>",
    }),
  },
  bullets: {
    label: "Bullets",
    addable: true,
    toolbar: "bullets",
    inspector: "bullets",
    renderers: { konva: "bullets", domOverlay: "bullets", domOverlayOrder: 30 },
    export: { pptx: "bullets", pdf: "raster" },
    createDefault: () => ({
      ...base,
      h: 1.35,
      kind: "bullets",
      items: ["First point", "Second point"],
      fontFace: "Arial",
      fontSize: 18,
      color: "1A2B45",
      lineSpacingMultiple: 1.25,
      itemGap: 0.08,
    }),
  },
  text: {
    label: "Text",
    addable: true,
    toolbar: "text",
    inspector: "text",
    renderers: { konva: "text", domOverlay: "text", domOverlayOrder: 40 },
    export: { pptx: "text", pdf: "raster" },
    createDefault: () => ({
      ...base,
      w: 4.2,
      h: 0.7,
      kind: "text",
      text: "New text",
      fontFace: "Arial",
      fontSize: 28,
      bold: true,
      color: "1A2B45",
    }),
  },
} satisfies Record<ElementKind, ElementDefinition>;

export const ADDABLE_ELEMENT_KINDS = [
  "text",
  "rect",
  "ellipse",
  "bullets",
  "chart",
  "table",
  "image",
] as const satisfies ReadonlyArray<ElementKind>;

export function getElementDefinition(kind: ElementKind) {
  return ELEMENT_REGISTRY[kind];
}

export function getElementLabel(kind: string) {
  return kind in ELEMENT_REGISTRY
    ? ELEMENT_REGISTRY[kind as ElementKind].label
    : kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function createDefaultElementFromRegistry(kind: ElementKind) {
  return ELEMENT_REGISTRY[kind].createDefault();
}

export function getDomOverlayDefinitions() {
  return Object.values(ELEMENT_REGISTRY)
    .filter((definition) => definition.renderers.domOverlay != null)
    .sort((a, b) => domOverlayOrder(a) - domOverlayOrder(b));
}

function domOverlayOrder(definition: (typeof ELEMENT_REGISTRY)[ElementKind]) {
  return "domOverlayOrder" in definition.renderers
    ? definition.renderers.domOverlayOrder
    : Number.MAX_SAFE_INTEGER;
}
