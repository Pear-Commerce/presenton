import type { SlideElement } from "./slide-schema";
import { uniformBorderRadius } from "./element-model";

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
export type DomOverlayRendererKey =
  | "svg"
  | "chart"
  | "text-list"
  | "text"
  | "table";

type ElementDefinition = {
  label: string;
  addable: boolean;
  toolbar: ElementToolbarKey | null;
  inspector: ElementInspectorKey | null;
  renderers: {
    konva: string;
    domOverlay: DomOverlayRendererKey | null;
    domOverlayOrder?: number;
  };
  export: {
    pptx: string;
    pdf: "raster";
  };
  createDefault: () => SlideElement;
};

const base = {
  position: { x: 0.8, y: 0.8 },
  size: { width: 2.6, height: 0.7 },
} as const;

export const ELEMENT_REGISTRY = {
  rectangle: {
    label: "Rect",
    addable: true,
    toolbar: "shape",
    inspector: "shape",
    renderers: { konva: "rectangle", domOverlay: null },
    export: { pptx: "rectangle", pdf: "raster" },
    createDefault: () => ({
      ...base,
      type: "rectangle",
      fill: { color: "D4A24C" },
      borderRadius: uniformBorderRadius(0.08),
    }),
  },
  ellipse: {
    label: "Ellipse",
    addable: true,
    toolbar: "shape",
    inspector: "shape",
    renderers: { konva: "ellipse", domOverlay: null },
    export: { pptx: "ellipse", pdf: "raster" },
    createDefault: () => ({
      ...base,
      type: "ellipse",
      fill: { color: "75AADB" },
    }),
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
      size: { width: 4.2, height: 1.8 },
      type: "chart",
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
      size: { width: 5.2, height: 2.1 },
      type: "table",
      font: { family: "Arial", size: 11, color: "1A2B45" },
      columns: [
        {
          text: "Metric",
          fill: { color: "0B1F3A" },
          font: { color: "FFFFFF", bold: true },
        },
        {
          text: "Current",
          fill: { color: "0B1F3A" },
          font: { color: "FFFFFF", bold: true },
        },
        {
          text: "Target",
          fill: { color: "0B1F3A" },
          font: { color: "FFFFFF", bold: true },
        },
      ],
      rows: [
        [{ text: "Adoption" }, { text: "52%" }, { text: "70%" }],
        [{ text: "Revenue" }, { text: "$1.2M" }, { text: "$1.8M" }],
        [{ text: "Retention" }, { text: "84%" }, { text: "90%" }],
      ],
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
      size: { width: 3.6, height: 2.4 },
      type: "image",
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
      size: { width: 2.4, height: 2.4 },
      type: "svg",
      name: "SVG shape",
      svg:
        '<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="240" height="240" rx="24" fill="#0B1F3A"/>' +
        '<circle cx="120" cy="120" r="74" fill="none" stroke="#D4A24C" stroke-width="14"/>' +
        '<path d="M62 142 C94 70, 145 70, 178 142" fill="none" stroke="#75AADB" stroke-width="14" stroke-linecap="round"/>' +
        "</svg>",
    }),
  },
  "text-list": {
    label: "Bullets",
    addable: true,
    toolbar: "bullets",
    inspector: "bullets",
    renderers: {
      konva: "text-list",
      domOverlay: "text-list",
      domOverlayOrder: 30,
    },
    export: { pptx: "text-list", pdf: "raster" },
    createDefault: () => ({
      ...base,
      size: { width: 2.6, height: 1.35 },
      type: "text-list",
      marker: "bullet",
      items: [
        { type: "text", text: "First point" },
        { type: "text", text: "Second point" },
      ],
      font: {
        family: "Arial",
        size: 18,
        color: "1A2B45",
        lineHeight: 1.25,
      },
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
      size: { width: 4.2, height: 0.7 },
      type: "text",
      runs: [{ text: "New text" }],
      font: {
        family: "Arial",
        size: 28,
        bold: true,
        color: "1A2B45",
      },
    }),
  },
} satisfies Record<string, ElementDefinition>;

export type ElementKind = keyof typeof ELEMENT_REGISTRY;
export type KonvaRendererKey = ElementKind;
export type PptxRendererKey = ElementKind;

export const ADDABLE_ELEMENT_KINDS = [
  "text",
  "rectangle",
  "ellipse",
  "text-list",
  "chart",
  "table",
  "image",
] as const satisfies ReadonlyArray<ElementKind>;

const UNKNOWN_ELEMENT_DEFINITION = {
  label: "Element",
  addable: false,
  toolbar: null,
  inspector: null,
  renderers: { konva: "text", domOverlay: null },
  export: { pptx: "text", pdf: "raster" },
  createDefault: () => ELEMENT_REGISTRY.text.createDefault(),
} as const satisfies ElementDefinition;

export function getElementDefinition(kind: SlideElement["type"]) {
  return ELEMENT_REGISTRY[kind as ElementKind] ?? UNKNOWN_ELEMENT_DEFINITION;
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
