import type {
  BorderRadius,
  ChartElement,
  EllipseElement,
  ImageElement,
  LineElement,
  RectangleElement,
  Shadow,
  Slide,
  SlideElement,
  Stroke,
  SvgElement,
  TableCell,
  TableElement,
  TextElement,
} from "../lib/slide-schema";

export type TemplateRadius = BorderRadius;
export type TemplateRectElement = RectangleElement;

type TextOptions = {
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  opacity?: number;
  wrap?: "word" | "char" | "none";
};

type ShapeOptions = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  opacity?: number;
  stroke?: Stroke;
};

type RectOptions = ShapeOptions & {
  r?: number | BorderRadius | null;
  shadow?: boolean | Shadow;
};

type LineOptions = {
  x: number;
  y: number;
  w: number;
  h?: number;
  color?: string;
  width?: number;
  opacity?: number;
  dash?: number[];
};

type SvgOptions = {
  x: number;
  y: number;
  w: number;
  h: number;
  markup: string;
  name: string;
  opacity?: number;
};

type ImageOptions = {
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  name: string;
  fit?: ImageElement["fit"];
  r?: number | BorderRadius | null;
  shadow?: boolean | Shadow;
};

type ChartOptions = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  type?: ChartElement["chartType"];
  data: ChartElement["data"];
  color?: string;
  axisColor?: string;
  labelColor?: string;
  showValues?: boolean;
};

type TableOptions = {
  x: number;
  y: number;
  w: number;
  h: number;
  columns: string[];
  rows: string[][];
  fontSize?: number;
  headerFill?: string;
  headerColor?: string;
};

type TemplateElementOptions = {
  fontFamily: string;
  defaultTextColor: string;
  defaultBackground: string;
  defaultLineColor: string;
  defaultChartColor: string;
  defaultChartAxisColor: string;
  defaultChartLabelColor: string;
  defaultTableFill?: string;
  defaultTableHeaderFill?: string;
  defaultTableStroke?: string;
  rectShadow?: Shadow;
  imageShadow?: Shadow;
};

export function radius(value = 0.08): BorderRadius {
  return { tl: value, tr: value, bl: value, br: value };
}

function resolveRadius(
  value: number | BorderRadius | null | undefined,
): BorderRadius | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? radius(value) : value;
}

function resolveShadow(
  value: boolean | Shadow | undefined,
  preset: Shadow | undefined,
): Shadow | undefined {
  if (!value) return undefined;
  return value === true ? preset : value;
}

export function createTemplateElements({
  fontFamily,
  defaultTextColor,
  defaultBackground,
  defaultLineColor,
  defaultChartColor,
  defaultChartAxisColor,
  defaultChartLabelColor,
  defaultTableFill = "FFFFFF",
  defaultTableHeaderFill = defaultChartColor,
  defaultTableStroke = defaultLineColor,
  rectShadow = {
    color: "000000",
    opacity: 0.12,
    blur: 0.08,
    offsetX: 0,
    offsetY: 0.03,
  },
  imageShadow = {
    color: "000000",
    opacity: 0.16,
    blur: 0.12,
    offsetX: 0,
    offsetY: 0.04,
  },
}: TemplateElementOptions) {
  function text({
    x,
    y,
    w,
    h,
    value,
    size = 12,
    color = defaultTextColor,
    bold,
    italic,
    lineHeight,
    align,
    valign,
    opacity,
    wrap,
  }: TextOptions): TextElement {
    return {
      type: "text",
      position: { x, y },
      size: { width: w, height: h },
      runs: [{ text: value }],
      font: { family: fontFamily, size, color, bold, italic, lineHeight, wrap },
      alignment:
        align || valign ? { horizontal: align, vertical: valign } : undefined,
      opacity,
    };
  }

  function rect({
    x,
    y,
    w,
    h,
    fill,
    opacity,
    stroke,
    r,
    shadow,
  }: RectOptions): RectangleElement {
    return {
      type: "rectangle",
      position: { x, y },
      size: { width: w, height: h },
      fill: { color: fill, opacity },
      stroke,
      borderRadius: resolveRadius(r),
      shadow: resolveShadow(shadow, rectShadow),
    };
  }

  function ellipse({
    x,
    y,
    w,
    h,
    fill,
    opacity,
    stroke,
  }: ShapeOptions): EllipseElement {
    return {
      type: "ellipse",
      position: { x, y },
      size: { width: w, height: h },
      fill: { color: fill, opacity },
      stroke,
    };
  }

  function line({
    x,
    y,
    w,
    h = 0.01,
    color = defaultLineColor,
    width = 1,
    opacity,
    dash,
  }: LineOptions): LineElement {
    return {
      type: "line",
      position: { x, y },
      size: { width: w, height: h },
      stroke: { color, width, opacity, dash },
    };
  }

  function svg({
    x,
    y,
    w,
    h,
    markup,
    name,
    opacity,
  }: SvgOptions): SvgElement {
    return {
      type: "svg",
      position: { x, y },
      size: { width: w, height: h },
      svg: markup,
      name,
      opacity,
    };
  }

  function image({
    x,
    y,
    w,
    h,
    src,
    name,
    fit = "cover",
    r = 0.08,
    shadow,
  }: ImageOptions): ImageElement {
    return {
      type: "image",
      position: { x, y },
      size: { width: w, height: h },
      data: src,
      fit,
      name,
      borderRadius: resolveRadius(r),
      shadow: resolveShadow(shadow, imageShadow),
    };
  }

  function chart({
    x,
    y,
    w,
    h,
    title,
    type = "bar",
    data,
    color = defaultChartColor,
    axisColor = defaultChartAxisColor,
    labelColor = defaultChartLabelColor,
    showValues = true,
  }: ChartOptions): ChartElement {
    return {
      type: "chart",
      position: { x, y },
      size: { width: w, height: h },
      chartType: type,
      title,
      color,
      axisColor,
      labelColor,
      showValues,
      data,
    };
  }

  function cell(
    value: string,
    fill = defaultTableFill,
    color = defaultTextColor,
    bold = false,
  ): TableCell {
    return {
      text: value,
      fill: { color: fill },
      stroke: { color: defaultTableStroke, width: 0.5 },
      font: { family: fontFamily, color, bold },
    };
  }

  function table({
    x,
    y,
    w,
    h,
    columns,
    rows,
    fontSize = 10,
    headerFill = defaultTableHeaderFill,
    headerColor = "FFFFFF",
  }: TableOptions): TableElement {
    return {
      type: "table",
      position: { x, y },
      size: { width: w, height: h },
      font: { family: fontFamily, size: fontSize, color: defaultTextColor },
      columns: columns.map((item) => cell(item, headerFill, headerColor, true)),
      rows: rows.map((row) => row.map((item) => cell(item))),
    };
  }

  function slide(
    title: string,
    elements: SlideElement[],
    background = defaultBackground,
  ): Slide {
    return { title, background, elements };
  }

  return { text, rect, ellipse, line, svg, image, chart, cell, table, slide };
}
