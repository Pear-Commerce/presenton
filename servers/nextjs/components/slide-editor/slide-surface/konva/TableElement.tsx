import { Group, Rect, Text } from "react-konva";
import type { TableElement as TableEl } from "../../lib/slide-schema";
import { PT_TO_PX, PX_PER_IN, withHash } from "../../editorUtils";
import { rotationProps, shadowProps } from "./elementVisuals";
import {
  geometry,
  type ElementCommonProps,
  type TableInteractionProps,
} from "./types";

export function TableElement({
  element,
  index,
  scale,
  selected,
  editing,
  onTableCellClick,
  setRef,
  events,
  renderMode = "canvas",
}: ElementCommonProps &
  TableInteractionProps & {
    element: TableEl;
    renderMode?: "canvas" | "proxy";
  }) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );
  const rows = element.rows;
  const cols = Math.max(1, ...rows.map((row) => row.length));
  const rowH = height / rows.length;
  const colW = width / cols;
  const fontSize = element.fontSize * PT_TO_PX * (scale / PX_PER_IN);
  const fill = withHash(element.fill ?? "FFFFFF");
  const borderColor = withHash(element.borderColor);

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
        width={width}
        height={height}
        fill={renderMode === "proxy" ? "rgba(255,255,255,0.01)" : fill}
        stroke={
          selected
            ? stroke
            : renderMode === "proxy"
              ? "rgba(255,255,255,0)"
              : borderColor
        }
        strokeWidth={selected ? strokeWidth : renderMode === "proxy" ? 0 : 1}
        cornerRadius={4}
      />
      {editing
        ? null
        : rows.map((row, rowIndex) =>
            Array.from({ length: cols }).map((_, colIndex) => {
              const isHeader = rowIndex === 0;
              const cellStyle = element.cellStyles?.[rowIndex]?.[colIndex];
              const cellFill =
                cellStyle?.fill ??
                (isHeader ? element.headerFill : (element.fill ?? "FFFFFF"));
              const cellBorder = cellStyle?.borderColor ?? element.borderColor;
              const cellText =
                cellStyle?.textColor ??
                (isHeader ? element.headerTextColor : element.textColor);
              return (
                <Group key={`${rowIndex}-${colIndex}`}>
                  <Rect
                    x={colIndex * colW}
                    y={rowIndex * rowH}
                    width={colW}
                    height={rowH}
                    fill={
                      renderMode === "proxy"
                        ? "rgba(255,255,255,0.01)"
                        : withHash(cellFill)
                    }
                    stroke={
                      renderMode === "proxy"
                        ? "rgba(255,255,255,0)"
                        : withHash(cellBorder)
                    }
                    strokeWidth={renderMode === "proxy" ? 0 : 1}
                    onClick={(event) => {
                      event.cancelBubble = true;
                      if (!events.onClick(event)) return;
                      onTableCellClick?.(rowIndex, colIndex);
                    }}
                    onTap={(event) => {
                      if (!events.onTap(event)) return;
                      onTableCellClick?.(rowIndex, colIndex);
                    }}
                  />
                  {renderMode === "canvas" ? (
                    <Text
                      x={colIndex * colW + 8 * (scale / PX_PER_IN)}
                      y={rowIndex * rowH + 6 * (scale / PX_PER_IN)}
                      width={Math.max(1, colW - 16 * (scale / PX_PER_IN))}
                      height={Math.max(1, rowH - 10 * (scale / PX_PER_IN))}
                      text={row[colIndex] ?? ""}
                      fill={withHash(cellText)}
                      fontFamily={`${element.fontFace ?? "Arial"}, Helvetica, sans-serif`}
                      fontSize={fontSize}
                      fontStyle={
                        (cellStyle?.bold ?? isHeader) ? "bold" : "normal"
                      }
                      align={colIndex === 0 ? "left" : "center"}
                      verticalAlign="middle"
                      listening={false}
                    />
                  ) : null}
                </Group>
              );
            }),
          )}
    </Group>
  );
}
