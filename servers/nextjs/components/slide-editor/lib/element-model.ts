import { SLIDE_H, SLIDE_W } from "./slide-schema";
import type {
  BorderRadius,
  ChartElement,
  Fill,
  Font,
  ImageElement,
  Position,
  RectangleElement,
  Size,
  SlideElement,
  Stroke,
  TableCell,
  TableElement,
  TextElement,
  TextListElement,
  TextRun,
} from "./slide-schema";

export type ElementType = SlideElement["type"];
export type ElementBox = { x: number; y: number; w: number; h: number };
export type ResolvedFont = {
  family: string;
  size: number;
  color: string;
  bold?: boolean | null;
  italic?: boolean | null;
  lineHeight?: number | null;
  letterSpacing?: number | null;
  wrap?: Font["wrap"];
  ellipsis?: boolean | null;
};

export const DEFAULT_FONT_FAMILY = "Arial";
export const DEFAULT_TEXT_COLOR = "1A2B45";
export const DEFAULT_TEXT_SIZE = 18;

export function elementBox(element: Pick<SlideElement, "position" | "size">) {
  return {
    x: element.position?.x ?? 0,
    y: element.position?.y ?? 0,
    w: element.size?.width ?? 0.1,
    h: element.size?.height ?? 0.1,
  };
}

export function boxToPositionSize(box: ElementBox): {
  position: Position;
  size: Size;
} {
  return {
    position: { x: box.x, y: box.y },
    size: { width: box.w, height: box.h },
  };
}

export function resizeElement<T extends SlideElement>(
  element: T,
  box: Partial<ElementBox>,
): T {
  const current = elementBox(element);
  return {
    ...element,
    ...boxToPositionSize({
      x: box.x ?? current.x,
      y: box.y ?? current.y,
      w: box.w ?? current.w,
      h: box.h ?? current.h,
    }),
  } as T;
}

export function moveElement<T extends SlideElement>(
  element: T,
  dx: number,
  dy: number,
): T {
  const box = elementBox(element);
  return resizeElement(element, {
    x: clamp(box.x + dx, 0, SLIDE_W - box.w),
    y: clamp(box.y + dy, 0, SLIDE_H - box.h),
  });
}

export function textContent(element: TextElement): string {
  return element.runs.map((run) => run.text).join("");
}

export function textRun(text: string, font?: Font | null): TextRun {
  return font ? { text, font } : { text };
}

export function setTextContent(element: TextElement, text: string): TextElement {
  const first = element.runs[0];
  return {
    ...element,
    runs: [textRun(text, first?.font)],
  };
}

export function elementFont(element: {
  font?: Font | null;
}): ResolvedFont {
  return {
    family: element.font?.family ?? DEFAULT_FONT_FAMILY,
    size: element.font?.size ?? DEFAULT_TEXT_SIZE,
    color: element.font?.color ?? DEFAULT_TEXT_COLOR,
    bold: element.font?.bold ?? null,
    italic: element.font?.italic ?? null,
    lineHeight: element.font?.lineHeight ?? null,
    letterSpacing: element.font?.letterSpacing ?? null,
    wrap: element.font?.wrap ?? null,
    ellipsis: element.font?.ellipsis ?? null,
  };
}

export function mergeFont<T extends { font?: Font | null }>(
  element: T,
  font: Partial<Font>,
): T {
  return {
    ...element,
    font: { ...(element.font ?? {}), ...font },
  };
}

export function textListStrings(element: TextListElement): string[] {
  return element.items.map((item) => item.text);
}

export function setTextListStrings(
  element: TextListElement,
  items: string[],
): TextListElement {
  return {
    ...element,
    items: items.map((text) => ({ type: "text", text })),
  };
}

export function fillColor(fill: Fill | null | undefined, fallback = "FFFFFF") {
  return fill?.color ?? fallback;
}

export function strokeColor(
  stroke: Stroke | null | undefined,
  fallback = "0B1F3A",
) {
  return stroke?.color ?? fallback;
}

export function strokeWidth(stroke: Stroke | null | undefined) {
  return stroke?.width ?? 0;
}

export function uniformBorderRadius(value: number): BorderRadius {
  return { tl: value, tr: value, bl: value, br: value };
}

export function averageBorderRadius(
  radius: BorderRadius | null | undefined,
): number {
  if (!radius) return 0;
  return (radius.tl + radius.tr + radius.bl + radius.br) / 4;
}

export function tableRowsAsStrings(element: TableElement): string[][] {
  return [
    element.columns.map((cell) => cell.text ?? ""),
    ...element.rows.map((row) => row.map((cell) => cell.text ?? "")),
  ];
}

export function setTableRowsFromStrings(
  element: TableElement,
  rows: string[][],
): TableElement {
  const [header = [], ...body] = rows;
  const existingRows = tableRowsAsStrings(element);
  const cellFor = (text: string, rowIndex: number, colIndex: number): TableCell => ({
    ...((rowIndex === 0
      ? element.columns[colIndex]
      : element.rows[rowIndex - 1]?.[colIndex]) ?? {}),
    text,
    fill:
      rowIndex === 0
        ? element.columns[colIndex]?.fill
        : element.rows[rowIndex - 1]?.[colIndex]?.fill,
    stroke:
      rowIndex === 0
        ? element.columns[colIndex]?.stroke
        : element.rows[rowIndex - 1]?.[colIndex]?.stroke,
  });

  return {
    ...element,
    columns: header.map((text, colIndex) =>
      cellFor(text || existingRows[0]?.[colIndex] || "", 0, colIndex),
    ),
    rows: body.map((row, rowIndex) =>
      row.map((text, colIndex) => cellFor(text, rowIndex + 1, colIndex)),
    ),
  };
}

export function chartColor(element: ChartElement, fallback = "D4A24C") {
  return element.color ?? fallback;
}

export function hasImageData(element: ImageElement) {
  return Boolean(element.data);
}

export function isShapeElement(
  element: SlideElement,
): element is RectangleElement | Extract<SlideElement, { type: "ellipse" }> {
  return element.type === "rectangle" || element.type === "ellipse";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
