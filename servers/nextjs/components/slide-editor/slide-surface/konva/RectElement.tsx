import { Rect } from "react-konva";
import type { RectElement as RectEl } from "../../lib/slide-schema";
import { withHash } from "../../editorUtils";
import {
  konvaCornerRadius,
  rotationProps,
  shadowProps,
} from "./elementVisuals";
import { geometry, type ElementCommonProps } from "./types";

export function RectElement({
  element,
  index,
  scale,
  selected,
  setRef,
  events,
}: ElementCommonProps & { element: RectEl }) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );
  return (
    <Rect
      ref={setRef}
      name={`element-${index}`}
      x={x}
      y={y}
      width={width}
      height={height}
      {...rotationProps(element)}
      fill={withHash(element.fill)}
      opacity={element.opacity ?? 1}
      cornerRadius={konvaCornerRadius(element, scale)}
      stroke={element.line ? withHash(element.line.color) : stroke}
      strokeWidth={element.line ? element.line.width : strokeWidth}
      {...shadowProps(element.shadow, scale)}
      {...events}
    />
  );
}
