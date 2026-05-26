import {
  type CornerRadius,
  SLIDE_H,
  SLIDE_W,
  type Deck,
  type DeckTheme,
  type Slide,
  type SlideElement,
} from "../lib/slide-schema";

type SpecPoint = { x: number; y: number };
type SpecSize = { width: number; height: number };
type SpecPaint = { color: string; opacity?: number | null };
type SpecStroke = SpecPaint & { width?: number | null; dash?: string | null };
type SpecRadius = { tl?: number | null; tr?: number | null; bl?: number | null; br?: number | null };
type SpecAlignment = {
  horizontal?: "left" | "center" | "right" | null;
  vertical?: "top" | "middle" | "bottom" | null;
} | null;

type SpecElementBase = {
  position: SpecPoint;
  size: SpecSize;
  rotation?: number | null;
  shadow?: {
    color: string;
    blur: number;
    opacity: number;
    offsetX: number;
    offsetY: number;
  } | null;
  name?: string | null;
  slot?: string;
};

type SpecTextElement = SpecElementBase & {
  type: "text";
  text: string;
  font: {
    family?: string | null;
    size: number;
    color: string;
    bold?: boolean | null;
    italic?: boolean | null;
    lineHeight?: number | null;
    letterSpacing?: number | null;
  };
  alignment?: SpecAlignment;
};

type SpecRectangleElement = SpecElementBase & {
  type: "rectangle";
  fill?: SpecPaint | null;
  stroke?: SpecStroke | null;
  borderRadius?: SpecRadius | null;
};

type SpecImageElement = SpecElementBase & {
  type: "image";
  data?: string | null;
  fit?: "contain" | "cover" | "fill" | null;
  is_icon?: boolean | null;
  borderRadius?: SpecRadius | null;
};

type SpecTableCell = {
  fill?: SpecPaint | null;
  stroke?: SpecStroke | null;
  text: string;
};

type SpecTableElement = SpecElementBase & {
  type: "table";
  columns: SpecTableCell[];
  rows: SpecTableCell[][];
};

export type DeckSpecElement =
  | SpecTextElement
  | SpecRectangleElement
  | SpecImageElement
  | SpecTableElement;

export type DeckSpecComponent = {
  id: string;
  description?: string;
  position?: SpecPoint;
  size?: SpecSize;
  elements: DeckSpecElement[];
};

export type DeckSpecComponentInstance = {
  id?: string;
  componentId?: string;
  description?: string;
  position?: SpecPoint;
  size?: SpecSize;
  elements?: DeckSpecElement[];
  overrides?: Record<string, Partial<DeckSpecElement>>;
};

export type DeckSpecLayout = {
  id: string;
  title?: string;
  description?: string;
  background?: string;
  components: DeckSpecComponentInstance[];
};

export type DeckSpec = {
  title: string;
  description?: string;
  theme?: DeckTheme;
  slideSize?: SpecSize;
  components?: DeckSpecComponent[];
  layouts: DeckSpecLayout[];
};

export type DeckComponentTemplate = {
  id: string;
  label: string;
  description?: string;
  elements: SlideElement[];
};

const DEFAULT_SPEC_SIZE: SpecSize = { width: 1280, height: 720 };

export function createDeckFromSpec(spec: DeckSpec): Deck {
  const sourceSize = spec.slideSize ?? DEFAULT_SPEC_SIZE;
  const componentMap = new Map((spec.components ?? []).map((component) => [component.id, component]));

  return {
    title: spec.title,
    description: spec.description,
    theme: spec.theme,
    slides: spec.layouts.map((layout): Slide => {
      const componentCounts = new Map<string, number>();
      return {
        title: layout.title ?? readableTitle(layout.id),
        background: stripHash(layout.background ?? spec.theme?.background ?? "FFFFFF"),
        elements: layout.components.flatMap((instance) => {
          const componentId = instance.componentId ?? instance.id ?? "component";
          const count = componentCounts.get(componentId) ?? 0;
          componentCounts.set(componentId, count + 1);
          return convertComponentInstance(instance, componentMap, sourceSize, {
            componentInstanceId: `${layout.id}:${componentId}:${count}`,
          });
        }),
      };
    }),
  };
}

export function createComponentTemplatesFromSpec(
  spec: Pick<DeckSpec, "components" | "slideSize">,
): DeckComponentTemplate[] {
  const sourceSize = spec.slideSize ?? DEFAULT_SPEC_SIZE;
  return (spec.components ?? []).map((component) => ({
    id: component.id,
    label: readableTitle(component.id),
    description: component.description,
    elements: convertComponentInstance(
      { componentId: component.id },
      new Map([[component.id, component]]),
      sourceSize,
    ),
  }));
}

function convertComponentInstance(
  instance: DeckSpecComponentInstance,
  componentMap: Map<string, DeckSpecComponent>,
  sourceSize: SpecSize,
  options: { componentInstanceId?: string } = {},
): SlideElement[] {
  const component = instance.componentId ? componentMap.get(instance.componentId) : undefined;
  const id = instance.componentId ?? instance.id;
  const elements = instance.elements ?? component?.elements;

  if (!elements) {
    throw new Error(`Deck spec component "${id ?? "unknown"}" has no elements.`);
  }

  const componentPosition = instance.position ?? component?.position ?? { x: 0, y: 0 };
  const metadata = {
    componentId: id,
    componentInstanceId: options.componentInstanceId,
    componentDescription: instance.description ?? component?.description,
  };

  return elements
    .map((element) => applyElementOverride(element, instance.overrides))
    .map((element) =>
      convertElement(element, componentPosition, sourceSize, {
        ...metadata,
        componentSlot: element.slot ?? element.name ?? undefined,
      }),
    )
    .filter((element): element is SlideElement => element != null);
}

function applyElementOverride(
  element: DeckSpecElement,
  overrides: DeckSpecComponentInstance["overrides"],
): DeckSpecElement {
  const key = element.slot ?? element.name ?? "";
  if (!key || !overrides?.[key]) return element;
  return { ...element, ...overrides[key] } as DeckSpecElement;
}

function convertElement(
  element: DeckSpecElement,
  componentPosition: SpecPoint,
  sourceSize: SpecSize,
  metadata: {
    componentId?: string;
    componentInstanceId?: string;
    componentDescription?: string;
    componentSlot?: string;
  },
): SlideElement | null {
  const x = toSlideX(componentPosition.x + element.position.x, sourceSize);
  const y = toSlideY(componentPosition.y + element.position.y, sourceSize);
  const w = toSlideX(element.size.width, sourceSize);
  const h = toSlideY(element.size.height, sourceSize);

  if (element.type === "text") {
    const fontSize = pxToPt(element.font.size, sourceSize);
    return {
      kind: "text",
      x,
      y,
      w,
      h,
      ...commonElementProps(element, sourceSize, metadata),
      text: element.text,
      fontFace: element.font.family ?? "Poppins",
      fontSize,
      bold: element.font.bold ?? undefined,
      italic: element.font.italic ?? undefined,
      color: stripHash(element.font.color),
      align: element.alignment?.horizontal ?? undefined,
      valign: element.alignment?.vertical ?? undefined,
      charSpacing:
        element.font.letterSpacing != null
          ? clamp(pxToPt(element.font.letterSpacing, sourceSize) * 100, -200, 600)
          : undefined,
      lineHeight:
        element.font.lineHeight != null && element.font.size > 0
          ? clamp(element.font.lineHeight / element.font.size, 0.8, 2.2)
          : undefined,
    };
  }

  if (element.type === "rectangle") {
    return {
      kind: "rect",
      x,
      y,
      w,
      h,
      ...commonElementProps(element, sourceSize, metadata),
      fill: stripHash(element.fill?.color ?? "FFFFFF"),
      opacity: element.fill?.opacity ?? undefined,
      line: element.stroke
        ? {
            color: stripHash(element.stroke.color),
            width: element.stroke.width ?? 1,
          }
        : undefined,
      rx: radiusToSlide(element.borderRadius, sourceSize),
      radius: cornerRadiusToSlide(element.borderRadius, sourceSize),
    };
  }

  if (element.type === "image") {
    return {
      kind: "image",
      x,
      y,
      w,
      h,
      ...commonElementProps(element, sourceSize, metadata),
      data: element.data ?? undefined,
      name: element.name ?? undefined,
      fit: element.fit ?? undefined,
      rx: radiusToSlide(element.borderRadius, sourceSize),
      radius: cornerRadiusToSlide(element.borderRadius, sourceSize),
    };
  }

  if (element.type === "table") {
    const header = element.columns.map((column) => column.text);
    const rows = element.rows.map((row) => row.map((cell) => cell.text));
    const firstHeader = element.columns[0];
    const firstBodyCell = element.rows[0]?.[0];
    return {
      kind: "table",
      x,
      y,
      w,
      h,
      ...commonElementProps(element, sourceSize, metadata),
      rows: [header, ...rows],
      cellStyles: [
        element.columns.map((column) => ({
          fill: column.fill?.color ? stripHash(column.fill.color) : undefined,
          borderColor: column.stroke?.color ? stripHash(column.stroke.color) : undefined,
          bold: true,
        })),
        ...element.rows.map((row) =>
          row.map((cell) => ({
            fill: cell.fill?.color ? stripHash(cell.fill.color) : undefined,
            borderColor: cell.stroke?.color ? stripHash(cell.stroke.color) : undefined,
          })),
        ),
      ],
      fontFace: "Poppins",
      fontSize: 12,
      textColor: "111827",
      headerFill: stripHash(firstHeader?.fill?.color ?? "F9FAFB"),
      headerTextColor: "111827",
      borderColor: stripHash(firstHeader?.stroke?.color ?? firstBodyCell?.stroke?.color ?? "E5E7EB"),
      fill: stripHash(firstBodyCell?.fill?.color ?? "FFFFFF"),
    };
  }

  return null;
}

function toSlideX(value: number, sourceSize: SpecSize) {
  return round((value / sourceSize.width) * SLIDE_W);
}

function toSlideY(value: number, sourceSize: SpecSize) {
  return round((value / sourceSize.height) * SLIDE_H);
}

function pxToPt(value: number, sourceSize: SpecSize) {
  return round((value / sourceSize.width) * SLIDE_W * 72);
}

function radiusToSlide(radius: SpecRadius | null | undefined, sourceSize: SpecSize) {
  if (!radius) return undefined;
  const values = [radius.tl, radius.tr, radius.bl, radius.br].filter(
    (value): value is number => typeof value === "number",
  );
  if (!values.length) return undefined;
  return round(Math.min(0.5, toSlideX(values.reduce((sum, value) => sum + value, 0) / values.length, sourceSize)));
}

function cornerRadiusToSlide(
  radius: SpecRadius | null | undefined,
  sourceSize: SpecSize,
): CornerRadius | undefined {
  if (!radius) return undefined;
  return {
    tl: radius.tl != null ? toSlideX(radius.tl, sourceSize) : undefined,
    tr: radius.tr != null ? toSlideX(radius.tr, sourceSize) : undefined,
    bl: radius.bl != null ? toSlideX(radius.bl, sourceSize) : undefined,
    br: radius.br != null ? toSlideX(radius.br, sourceSize) : undefined,
  };
}

function commonElementProps(
  element: DeckSpecElement,
  sourceSize: SpecSize,
  metadata: {
    componentId?: string;
    componentInstanceId?: string;
    componentDescription?: string;
    componentSlot?: string;
  },
) {
  return {
    rotation: element.rotation ?? undefined,
    shadow:
      "shadow" in element && element.shadow
        ? {
            color: stripHash(element.shadow.color),
            blur: toSlideX(element.shadow.blur, sourceSize),
            opacity: element.shadow.opacity,
            offsetX: toSlideX(element.shadow.offsetX, sourceSize),
            offsetY: toSlideY(element.shadow.offsetY, sourceSize),
          }
        : undefined,
    componentId: metadata.componentId,
    componentInstanceId: metadata.componentInstanceId,
    componentDescription: metadata.componentDescription,
    componentSlot: metadata.componentSlot,
  };
}

function stripHash(color: string) {
  return color.replace("#", "").toUpperCase();
}

function readableTitle(id: string) {
  return id
    .replace(/^slide_?/i, "Slide ")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Number(value.toFixed(4));
}
