import { Ellipse } from "react-konva";
import type { EllipseElement as EllipseEl } from "../../lib/slide-schema";
import { withHash } from "../../editorUtils";
import { rotationProps, shadowProps } from "./elementVisuals";
import { geometry, type ElementCommonProps } from "./types";

export function EllipseElement({
  element,
  index,
  scale,
  selected,
  setRef,
  events,
}: ElementCommonProps & { element: EllipseEl }) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );
  return (
    <Ellipse
      ref={setRef}
      name={`element-${index}`}
      x={x + width / 2}
      y={y + height / 2}
      width={width}
      height={height}
      radiusX={width / 2}
      radiusY={height / 2}
      {...rotationProps(element)}
      fill={withHash(element.fill)}
      opacity={element.opacity ?? 1}
      stroke={element.line ? withHash(element.line.color) : stroke}
      strokeWidth={element.line ? element.line.width : strokeWidth}
      {...shadowProps(element.shadow, scale)}
      offsetX={0}
      offsetY={0}
      {...events}
    />
  );
}
