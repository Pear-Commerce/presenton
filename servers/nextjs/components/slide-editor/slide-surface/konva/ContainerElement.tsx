import { Rect } from "react-konva";
import type { ContainerElement as ContainerEl } from "../../lib/slide-schema";
import { withHash } from "../../editorUtils";
import {
  averageBorderRadius,
  fillColor,
  strokeColor,
  strokeWidth,
} from "../../lib/element-model";
import { rotationProps, shadowProps } from "./elementVisuals";
import { geometry, type ElementCommonProps } from "./types";

export function ContainerElement({
  element,
  index,
  scale,
  selected,
  setRef,
  events,
}: ElementCommonProps & { element: ContainerEl }) {
  const { x, y, width, height, stroke, strokeWidth: selectedStrokeWidth } =
    geometry(element, scale, selected);
  const radius = averageBorderRadius(element.borderRadius) * scale;

  return (
    <Rect
      ref={setRef}
      name={`element-${index}`}
      x={x}
      y={y}
      width={width}
      height={height}
      {...rotationProps(element)}
      fill={withHash(fillColor(element.fill, "FFFFFF"))}
      opacity={element.opacity ?? element.fill?.opacity ?? 1}
      cornerRadius={radius}
      stroke={element.stroke ? withHash(strokeColor(element.stroke)) : stroke}
      strokeWidth={element.stroke ? strokeWidth(element.stroke) : selectedStrokeWidth}
      {...shadowProps(element.shadow, scale)}
      {...events}
    />
  );
}
