import rawLayouts from "./layouts.json";
import {
  SLIDE_H,
  SLIDE_W,
  type BorderRadius,
  type Deck,
  type Font,
  type Position,
  type Shadow,
  type Size,
  type Slide,
  type SlideElement,
  type Stroke,
} from "../lib/slide-schema";

const SOURCE_W = 1280;
const SOURCE_H = 720;
const X_SCALE = SLIDE_W / SOURCE_W;
const Y_SCALE = SLIDE_H / SOURCE_H;
const SOURCE_PX_TO_PT = (72 * SLIDE_W) / SOURCE_W;

type RawPosition = { x: number; y: number };
type RawSize = { width: number; height: number };
type RawFont = Omit<Font, "size"> & { size?: number | null };
type RawStroke = Omit<Stroke, "width"> & { width?: number | null };
type RawShadow = Shadow;
type RawElement = Record<string, unknown> & {
  type: SlideElement["type"];
  borderRadius?: BorderRadius | null;
  child?: RawElement | null;
  children?: RawElement[] | null;
  font?: RawFont | null;
  item?: RawElement | null;
  position?: RawPosition | null;
  rotation?: number | null;
  runs?: Array<{ text: string; font?: RawFont | null }>;
  size?: RawSize | null;
  stroke?: RawStroke | null;
};
type RawSlideComponent = {
  id: string;
  description: string;
  position?: RawPosition | null;
  size?: RawSize | null;
  elements: RawElement[];
};
type RawSlideLayout = {
  id: string;
  description: string;
  components: RawSlideComponent[];
};
type RawSlideLayouts = {
  layouts: RawSlideLayout[];
};

export function adaptSlideLayoutsToDeck(raw: RawSlideLayouts): Deck {
  return {
    title: "Converted PPTX Layouts",
    description:
      "Deck template adapted from templates/layouts.json without modifying the source JSON.",
    theme: {
      background: "171717",
      surface: "292929",
      primary: "D6FF3F",
      secondary: "EFEFEF",
      accent: "D6FF3F",
      text: "FFFFFF",
      muted: "A3A3A3",
    },
    slides: raw.layouts.map(adaptLayoutToSlide),
  };
}

function adaptLayoutToSlide(layout: RawSlideLayout, index: number): Slide {
  const elements = layout.components.flatMap((component) =>
    component.elements.map((element) =>
      adaptElement(element, component.position ?? { x: 0, y: 0 }),
    ),
  );

  return {
    title: titleFromLayout(layout, index),
    background: backgroundFromElements(elements),
    elements,
  };
}

function adaptElement(element: RawElement, offset: RawPosition): SlideElement {
  const next: Record<string, unknown> = { ...element };
  const noWrapText = isPageNumberLabel(elementText(element));
  const position = element.position
    ? scalePosition({
        x: element.position.x + offset.x,
        y: element.position.y + offset.y,
      })
    : null;
  const size = element.size ? scaleSize(element.size) : null;

  if (position) {
    next.position = size
      ? konvaPositionForPowerPointRotation(position, size, element.rotation)
      : position;
  }
  if (size) next.size = size;
  if (element.font) next.font = scaleFont(element.font, noWrapText);
  if (element.stroke) next.stroke = scaleStroke(element.stroke);
  if (element.shadow) next.shadow = scaleShadow(element.shadow);
  if (element.borderRadius) {
    next.borderRadius = scaleBorderRadius(element.borderRadius);
  }
  if (element.runs) {
    next.runs = element.runs.map((run) => ({
      ...run,
      font: run.font ? scaleFont(run.font, noWrapText) : run.font,
    }));
  }
  if (element.child) next.child = adaptElement(element.child, { x: 0, y: 0 });
  if (element.children) {
    next.children = element.children.map((child) =>
      adaptElement(child, { x: 0, y: 0 }),
    );
  }
  if (element.item) next.item = adaptElement(element.item, { x: 0, y: 0 });

  return next as SlideElement;
}

function scalePosition(position: RawPosition): Position {
  return {
    x: round(position.x * X_SCALE),
    y: round(position.y * Y_SCALE),
  };
}

function scaleSize(size: RawSize): Size {
  return {
    width: round(size.width * X_SCALE),
    height: round(size.height * Y_SCALE),
  };
}

function konvaPositionForPowerPointRotation(
  position: Position,
  size: Size,
  rotation?: number | null,
): Position {
  if (rotation == null || Math.abs(rotation) < 0.01) return position;
  const radians = (rotation * Math.PI) / 180;
  const halfW = size.width / 2;
  const halfH = size.height / 2;
  const rotatedHalfX = Math.cos(radians) * halfW - Math.sin(radians) * halfH;
  const rotatedHalfY = Math.sin(radians) * halfW + Math.cos(radians) * halfH;
  return {
    x: round(position.x + halfW - rotatedHalfX),
    y: round(position.y + halfH - rotatedHalfY),
  };
}

function scaleFont(font: RawFont, noWrap = false): Font {
  return {
    ...font,
    size: font.size == null ? font.size : round(font.size * SOURCE_PX_TO_PT),
    wrap: noWrap ? "none" : font.wrap,
  };
}

function scaleStroke(stroke: RawStroke): Stroke {
  return {
    ...stroke,
    width: round((stroke.width ?? 1) * SOURCE_PX_TO_PT),
  };
}

function scaleBorderRadius(radius: BorderRadius): BorderRadius {
  return {
    tl: round(radius.tl * X_SCALE),
    tr: round(radius.tr * X_SCALE),
    bl: round(radius.bl * X_SCALE),
    br: round(radius.br * X_SCALE),
  };
}

function scaleShadow(shadow: RawShadow): Shadow {
  return {
    ...shadow,
    blur: shadow.blur == null ? shadow.blur : round(shadow.blur * X_SCALE),
    offsetX:
      shadow.offsetX == null ? shadow.offsetX : round(shadow.offsetX * X_SCALE),
    offsetY:
      shadow.offsetY == null ? shadow.offsetY : round(shadow.offsetY * Y_SCALE),
  };
}

function backgroundFromElements(elements: SlideElement[]) {
  const background = elements.find(
    (element) =>
      element.type === "rectangle" &&
      element.position?.x === 0 &&
      element.position?.y === 0 &&
      element.size?.width === SLIDE_W &&
      element.size?.height === SLIDE_H &&
      element.fill?.color,
  );

  return background?.type === "rectangle" && background.fill?.color
    ? background.fill.color
    : "171717";
}

function titleFromLayout(layout: RawSlideLayout, index: number) {
  const slideNumber = layout.id.match(/\d+/)?.[0] ?? `${index + 1}`;
  return `Slide ${slideNumber}`;
}

function elementText(element: RawElement) {
  return element.runs?.map((run) => run.text).join("") ?? "";
}

function isPageNumberLabel(text: string) {
  return /^\/\d+$/.test(text.trim());
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

export const layoutsJsonDeck = adaptSlideLayoutsToDeck(
  rawLayouts as RawSlideLayouts,
);
