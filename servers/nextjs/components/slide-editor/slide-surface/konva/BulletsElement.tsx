import { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import type { BulletsElement as BulletsEl } from "../../lib/slide-schema";
import { elementFont, textListStrings } from "../../lib/element-model";
import { fitBulletsFontToBox } from "../../lib/textMeasure";
import { PT_TO_PX, PX_PER_IN, withHash } from "../../editorUtils";
import { rotationProps, shadowProps } from "./elementVisuals";
import { geometry, type ElementCommonProps } from "./types";

export function BulletsElement({
  element,
  index,
  scale,
  selected,
  editing,
  setRef,
  events,
  renderMode = "canvas",
}: ElementCommonProps & {
  element: BulletsEl;
  renderMode?: "canvas" | "proxy";
}) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );
  // Same shrink-to-fit the DOM overlay uses, so the Konva render path
  // (PDF export, presentation, thumbnails) matches the editor preview
  // for bullets that don't fit at their authored size.
  const effectiveFontSizePt = useMemo(
    () => fitBulletsFontToBox(element),
    [element],
  );
  const font = elementFont(element);
  const bulletFontSize = effectiveFontSizePt * PT_TO_PX * (scale / PX_PER_IN);
  const lineHeight = font.lineHeight ?? 1.3;
  const itemGap = 0.05 * scale;
  const linePx = bulletFontSize * lineHeight;
  const averageCharWidth = bulletFontSize * 0.52;
  const charsPerLine = Math.max(8, Math.floor(width / averageCharWidth));
  const items = textListStrings(element).map((item) => {
    const marker = element.marker === "number" ? "1." : "•";
    const text = element.marker === "none" ? item : `${marker} ${item}`;
    const lineCount = Math.max(1, Math.ceil(text.length / charsPerLine));
    return {
      text,
      height: lineCount * linePx,
    };
  });

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
      {editing || renderMode === "proxy"
        ? null
        : items.map((item, itemIndex) => {
            const yOffset = items
              .slice(0, itemIndex)
              .reduce((sum, previous) => sum + previous.height + itemGap, 0);
            return (
              <Text
                key={`${item.text}-${itemIndex}`}
                x={0}
                y={yOffset}
                width={width}
                text={item.text}
                fill={withHash(font.color)}
                fontFamily={`${font.family}, Helvetica, sans-serif`}
                fontSize={bulletFontSize}
                lineHeight={lineHeight}
                wrap="word"
                listening={false}
              />
            );
          })}
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
