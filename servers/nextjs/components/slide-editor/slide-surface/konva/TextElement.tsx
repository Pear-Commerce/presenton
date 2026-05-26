import { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import type { TextElement as TextEl } from "../../lib/slide-schema";
import { fitFontToBox } from "../../lib/textMeasure";
import { PT_TO_PX, PX_PER_IN, withHash } from "../../editorUtils";
import { rotationProps, shadowProps } from "./elementVisuals";
import { geometry, type ElementCommonProps } from "./types";

export function TextElement({
  element,
  index,
  scale,
  selected,
  editing,
  setRef,
  events,
  renderMode = "canvas",
}: ElementCommonProps & {
  element: TextEl;
  renderMode?: "canvas" | "proxy";
}) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );
  // Shrink-to-fit at render time. The PPTX export uses `fit: shrink`
  // which silently scales text down to fit the box. Without doing the
  // same here, the preview overflows visibly while the export looks
  // tight — diverging from presentation/export. `fitFontToBox` never
  // grows, so authored sizes that fit are untouched.
  const effectiveFontSizePt = useMemo(
    () => fitFontToBox(element, element.h),
    [element],
  );
  const fontSize = effectiveFontSizePt * PT_TO_PX * (scale / PX_PER_IN);
  const isTopAligned = (element.valign ?? "top") === "top";

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
      <Rect width={width} height={height} fill="rgba(0,0,0,0)" />
      {editing || renderMode === "proxy" ? null : (
        <Text
          width={width}
          height={isTopAligned ? undefined : height}
          text={element.text}
          fill={withHash(element.color)}
          fontFamily={`${element.fontFace ?? "Arial"}, Helvetica, sans-serif`}
          fontSize={fontSize}
          fontStyle={`${element.bold ? "bold" : "normal"} ${element.italic ? "italic" : ""}`}
          align={element.align ?? "left"}
          verticalAlign={element.valign ?? "top"}
          lineHeight={element.lineHeight ?? 1.15}
          letterSpacing={
            ((element.charSpacing ?? 0) / 100) * PT_TO_PX * (scale / PX_PER_IN)
          }
          wrap="word"
          listening={false}
        />
      )}
      {selected ? (
        <Rect
          width={width}
          height={height}
          stroke={stroke}
          strokeWidth={strokeWidth}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
