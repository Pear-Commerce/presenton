import type { ReactNode } from "react";
import type { SlideElement } from "../../lib/slide-schema";
import { getElementDefinition, type KonvaRendererKey } from "../../registry";
import { BulletsElement } from "./BulletsElement";
import { ChartElement } from "./ChartElement";
import { EllipseElement } from "./EllipseElement";
import { ImageElement } from "./ImageElement";
import { RectElement } from "./RectElement";
import { SvgElement } from "./SvgElement";
import { TableElement } from "./TableElement";
import { TextElement } from "./TextElement";
import type { ElementCommonProps, TableInteractionProps } from "./types";

export type KonvaElementRenderProps = ElementCommonProps &
  TableInteractionProps & {
    element: SlideElement;
    bulletsRenderMode?: "canvas" | "proxy";
    chartRenderMode?: "canvas" | "proxy";
    tableRenderMode?: "canvas" | "proxy";
    textRenderMode?: "canvas" | "proxy";
  };

const KONVA_RENDERERS = {
  rect: ({ element, ...rest }) =>
    element.kind === "rect" ? (
      <RectElement element={element} {...rest} />
    ) : null,
  ellipse: ({ element, ...rest }) =>
    element.kind === "ellipse" ? (
      <EllipseElement element={element} {...rest} />
    ) : null,
  chart: ({ chartRenderMode, element, ...rest }) =>
    element.kind === "chart" ? (
      <ChartElement element={element} renderMode={chartRenderMode} {...rest} />
    ) : null,
  table: ({ element, onTableCellClick, tableRenderMode, ...rest }) =>
    element.kind === "table" ? (
      <TableElement
        element={element}
        onTableCellClick={onTableCellClick}
        renderMode={tableRenderMode}
        {...rest}
      />
    ) : null,
  image: ({ element, ...rest }) =>
    element.kind === "image" ? (
      <ImageElement element={element} {...rest} />
    ) : null,
  svg: ({ element, ...rest }) =>
    element.kind === "svg" ? <SvgElement element={element} {...rest} /> : null,
  bullets: ({ bulletsRenderMode, element, ...rest }) =>
    element.kind === "bullets" ? (
      <BulletsElement
        element={element}
        renderMode={bulletsRenderMode}
        {...rest}
      />
    ) : null,
  text: ({ element, textRenderMode, ...rest }) =>
    element.kind === "text" ? (
      <TextElement element={element} renderMode={textRenderMode} {...rest} />
    ) : null,
} satisfies Record<
  KonvaRendererKey,
  (props: KonvaElementRenderProps) => ReactNode
>;

export function renderKonvaElement(props: KonvaElementRenderProps) {
  const renderer = getElementDefinition(props.element.kind).renderers.konva;
  return KONVA_RENDERERS[renderer](props);
}
