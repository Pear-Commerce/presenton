import { Group, Line, Rect } from "react-konva";
import type { LineElement as LineEl } from "../../lib/slide-schema";
import { strokeColor, strokeWidth } from "../../lib/element-model";
import { withHash } from "../../editorUtils";
import { rotationProps, shadowProps } from "./elementVisuals";
import { geometry, type ElementCommonProps } from "./types";

export function LineElement({
  element,
  index,
  scale,
  selected,
  setRef,
  events,
}: ElementCommonProps & { element: LineEl }) {
  const { x, y, width, height, stroke, strokeWidth: selectedStrokeWidth } =
    geometry(element, scale, selected);
  const hitHeight = Math.max(8, height);

  return (
    <Group
      ref={setRef}
      name={`element-${index}`}
      x={x}
      y={y}
      width={width}
      height={height}
      {...rotationProps(element)}
      opacity={element.opacity ?? 1}
      {...shadowProps(element.shadow, scale)}
      {...events}
    >
      <Rect
        y={(height - hitHeight) / 2}
        width={width}
        height={hitHeight}
        fill="rgba(0,0,0,0)"
      />
      <Line
        points={[0, 0, width, height]}
        stroke={withHash(strokeColor(element.stroke))}
        strokeWidth={strokeWidth(element.stroke)}
        dash={element.stroke.dash ?? undefined}
        lineCap="round"
        listening={false}
      />
      {selected ? (
        <Rect
          y={(height - hitHeight) / 2}
          width={width}
          height={hitHeight}
          stroke={stroke}
          strokeWidth={selectedStrokeWidth}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
