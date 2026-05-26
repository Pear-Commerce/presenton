import Konva from "konva";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Group, Line, Rect, Text, Transformer } from "react-konva";
import {
  SLIDE_H,
  SLIDE_W,
  type Slide,
  type SlideElement,
} from "../../lib/slide-schema";
import { textElementOverflows } from "../../lib/textMeasure";
import { clamp } from "../../editorUtils";
import { getComponentRun } from "../../state";
import { useGroupDrag } from "./hooks/useGroupDrag";
import { KonvaElement } from "./KonvaElement";
import { SELECTION_STROKE } from "./types";

type Bounds = { x: number; y: number; width: number; height: number };
type PressPoint = { x: number; y: number };
type ComponentPress = {
  index: number;
  indexes: number[];
  point: PressPoint;
  timer: ReturnType<typeof setTimeout>;
};

const COMPONENT_LONG_PRESS_MS = 550;
const COMPONENT_LONG_PRESS_MOVE_TOLERANCE = 8;
const SUPPRESS_SELECT_AFTER_LONG_PRESS_MS = 400;

export function ElementLayer({
  editingBulletsIndex,
  editingChartIndex,
  editingSvgIndex,
  editingTableIndex,
  editingTextIndex,
  interactive,
  nodeRefs,
  normalizedSelectionBox,
  bulletsRenderMode = "canvas",
  chartRenderMode = "canvas",
  onChange,
  onChangeMany,
  onDelete,
  onEditBullets,
  onEditChart,
  onEditComponentRun,
  onEditImage,
  onEditSvg,
  onEditTable,
  onEditText,
  onSelect,
  onSelectMany,
  onSelectTableCell,
  scale,
  selectedBounds,
  selectedIndexes,
  slide,
  tableRenderMode = "canvas",
  textRenderMode = "canvas",
  transformerRef,
  width,
  height,
}: {
  editingBulletsIndex?: number | null;
  editingChartIndex?: number | null;
  editingSvgIndex?: number | null;
  editingTableIndex?: number | null;
  editingTextIndex?: number | null;
  interactive: boolean;
  nodeRefs: RefObject<Array<Konva.Node | null>>;
  normalizedSelectionBox: Bounds | null;
  bulletsRenderMode?: "canvas" | "proxy";
  chartRenderMode?: "canvas" | "proxy";
  onChange?: (index: number, element: SlideElement) => void;
  onChangeMany?: (
    updates: Array<{ index: number; element: SlideElement }>,
  ) => void;
  onDelete?: () => void;
  onEditBullets?: (index: number) => void;
  onEditChart?: (index: number) => void;
  onEditComponentRun?: (indexes: number[]) => void;
  onEditImage?: (index: number) => void;
  onEditSvg?: (index: number) => void;
  onEditTable?: (index: number) => void;
  onEditText?: (index: number) => void;
  onSelect?: (index: number, additive?: boolean) => void;
  onSelectMany?: (indexes: number[]) => void;
  onSelectTableCell?: (
    index: number,
    rowIndex: number,
    colIndex: number,
  ) => void;
  scale: number;
  selectedBounds: Bounds | null;
  selectedIndexes: number[];
  slide: Slide;
  tableRenderMode?: "canvas" | "proxy";
  textRenderMode?: "canvas" | "proxy";
  transformerRef: RefObject<Konva.Transformer | null>;
  width: number;
  height: number;
}) {
  const { endGroupDrag, moveGroupDrag, startGroupDrag } = useGroupDrag({
    nodeRefs,
    onChangeMany,
    scale,
    selectedIndexes,
    slide,
    transformerRef,
  });

  // Pretext-measured overflow set, only computed in the live editor — never
  // on export rasters, since the badge is a UI affordance, not deck content.
  const overflowingIndices = useMemo(() => {
    if (!interactive) return null;
    const out = new Set<number>();
    slide.elements.forEach((element, index) => {
      if (element.kind === "text" && textElementOverflows(element)) {
        out.add(index);
      }
    });
    return out;
  }, [interactive, slide]);

  const [hoveredOverflow, setHoveredOverflow] = useState<number | null>(null);
  const componentPressRef = useRef<ComponentPress | null>(null);
  const suppressSelectRef = useRef<Set<number> | null>(null);
  const suppressSelectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const eventPoint = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ): PressPoint | null => {
    const nativeEvent = event.evt;
    if ("touches" in nativeEvent) {
      const touch = nativeEvent.touches[0] ?? nativeEvent.changedTouches[0];
      return touch ? { x: touch.clientX, y: touch.clientY } : null;
    }
    return { x: nativeEvent.clientX, y: nativeEvent.clientY };
  };

  const clearComponentPress = () => {
    if (componentPressRef.current) {
      clearTimeout(componentPressRef.current.timer);
      componentPressRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearComponentPress();
      if (suppressSelectTimerRef.current) {
        clearTimeout(suppressSelectTimerRef.current);
      }
    },
    [],
  );

  const suppressNextSelect = (indexes: number[]) => {
    if (suppressSelectTimerRef.current) {
      clearTimeout(suppressSelectTimerRef.current);
    }
    suppressSelectRef.current = new Set(indexes);
    suppressSelectTimerRef.current = setTimeout(() => {
      suppressSelectRef.current = null;
      suppressSelectTimerRef.current = null;
    }, SUPPRESS_SELECT_AFTER_LONG_PRESS_MS);
  };

  const startComponentPress = (
    index: number,
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    clearComponentPress();
    const componentRun = getComponentRun(slide.elements, index);
    if (!componentRun || componentRun.indexes.length <= 1) return;
    const point = eventPoint(event);
    if (!point) return;

    componentPressRef.current = {
      index,
      indexes: componentRun.indexes,
      point,
      timer: setTimeout(() => {
        const press = componentPressRef.current;
        if (!press || press.index !== index) return;
        componentPressRef.current = null;
        suppressNextSelect(press.indexes);
        if (onEditComponentRun) {
          onEditComponentRun(press.indexes);
        } else {
          onSelectMany?.(press.indexes);
        }
      }, COMPONENT_LONG_PRESS_MS),
    };
  };

  const moveComponentPress = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const press = componentPressRef.current;
    if (!press) return;
    const point = eventPoint(event);
    if (!point) return;
    const dx = point.x - press.point.x;
    const dy = point.y - press.point.y;
    if (Math.hypot(dx, dy) > COMPONENT_LONG_PRESS_MOVE_TOLERANCE) {
      clearComponentPress();
    }
  };

  const shouldSuppressSelect = (index: number) => {
    const suppress = suppressSelectRef.current;
    if (!suppress?.has(index)) return false;
    if (suppressSelectTimerRef.current) {
      clearTimeout(suppressSelectTimerRef.current);
      suppressSelectTimerRef.current = null;
    }
    suppressSelectRef.current = null;
    return true;
  };

  const commonEvents = (index: number, el: SlideElement) => ({
    draggable: interactive,
    onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (shouldSuppressSelect(index)) {
        event.cancelBubble = true;
        return false;
      }
      onSelect?.(
        index,
        event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey,
      );
      return true;
    },
    onDblClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (
        el.kind !== "text" &&
        el.kind !== "bullets" &&
        el.kind !== "chart" &&
        el.kind !== "image" &&
        el.kind !== "svg" &&
        el.kind !== "table"
      )
        return;
      event.cancelBubble = true;
      onSelect?.(index);
      if (el.kind === "text") onEditText?.(index);
      if (el.kind === "bullets") onEditBullets?.(index);
      if (el.kind === "chart") onEditChart?.(index);
      if (el.kind === "image") onEditImage?.(index);
      if (el.kind === "svg") onEditSvg?.(index);
      if (el.kind === "table") onEditTable?.(index);
    },
    onTap: (event: Konva.KonvaEventObject<TouchEvent>) => {
      if (shouldSuppressSelect(index)) {
        event.cancelBubble = true;
        return false;
      }
      onSelect?.(index);
      return true;
    },
    onMouseDown: (event: Konva.KonvaEventObject<MouseEvent>) => {
      startComponentPress(index, event);
    },
    onMouseMove: (event: Konva.KonvaEventObject<MouseEvent>) => {
      moveComponentPress(event);
    },
    onMouseUp: clearComponentPress,
    onMouseLeave: clearComponentPress,
    onTouchStart: (event: Konva.KonvaEventObject<TouchEvent>) => {
      startComponentPress(index, event);
    },
    onTouchMove: (event: Konva.KonvaEventObject<TouchEvent>) => {
      moveComponentPress(event);
    },
    onTouchEnd: clearComponentPress,
    onTouchCancel: clearComponentPress,
    onDragStart: () => {
      clearComponentPress();
      startGroupDrag(index);
    },
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
      moveGroupDrag(index, event);
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      if (endGroupDrag(index, event)) return;
      const rawX = event.target.x() / scale;
      const rawY = event.target.y() / scale;
      const nextX = el.kind === "ellipse" ? rawX - el.w / 2 : rawX;
      const nextY = el.kind === "ellipse" ? rawY - el.h / 2 : rawY;
      onChange?.(index, {
        ...el,
        x: clamp(nextX, 0, SLIDE_W - el.w),
        y: clamp(nextY, 0, SLIDE_H - el.h),
      } as SlideElement);
    },
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      const node = event.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const nextW = Math.max(0.1, (node.width() * scaleX) / scale);
      const nextH = Math.max(0.1, (node.height() * scaleY) / scale);
      const rawX = node.x() / scale;
      const rawY = node.y() / scale;
      const nextX = el.kind === "ellipse" ? rawX - nextW / 2 : rawX;
      const nextY = el.kind === "ellipse" ? rawY - nextH / 2 : rawY;
      node.scaleX(1);
      node.scaleY(1);
      onChange?.(index, {
        ...el,
        x: clamp(nextX, 0, SLIDE_W - nextW),
        y: clamp(nextY, 0, SLIDE_H - nextH),
        w: clamp(nextW, 0.1, SLIDE_W),
        h: clamp(nextH, 0.1, SLIDE_H),
        rotation: node.rotation(),
      } as SlideElement);
    },
  });

  return (
    <>
      {slide.elements.map((el, index) => (
        <KonvaElement
          key={index}
          element={el}
          bulletsRenderMode={bulletsRenderMode}
          chartRenderMode={chartRenderMode}
          index={index}
          scale={scale}
          tableRenderMode={tableRenderMode}
          textRenderMode={textRenderMode}
          selected={selectedIndexes.includes(index)}
          editing={
            editingTextIndex === index ||
            editingBulletsIndex === index ||
            editingChartIndex === index ||
            editingSvgIndex === index ||
            editingTableIndex === index
          }
          onTableCellClick={
            el.kind === "table"
              ? (rowIndex, colIndex) =>
                  onSelectTableCell?.(index, rowIndex, colIndex)
              : undefined
          }
          setRef={(node) => {
            nodeRefs.current[index] = node;
          }}
          events={commonEvents(index, el)}
        />
      ))}
      {overflowingIndices
        ? slide.elements.map((el, index) => {
            if (!overflowingIndices.has(index)) return null;
            const badgeX = el.x * scale + el.w * scale - 10;
            const badgeY = el.y * scale - 10;
            return (
              <Group
                key={`overflow-${index}`}
                x={badgeX}
                y={badgeY}
                onMouseEnter={(event) => {
                  setHoveredOverflow(index);
                  event.target
                    .getStage()
                    ?.container()
                    .style.setProperty("cursor", "help");
                }}
                onMouseLeave={(event) => {
                  setHoveredOverflow((current) =>
                    current === index ? null : current,
                  );
                  event.target
                    .getStage()
                    ?.container()
                    .style.removeProperty("cursor");
                }}
              >
                <Rect
                  width={20}
                  height={20}
                  fill="#d83b3b"
                  cornerRadius={10}
                  shadowColor="rgba(216,59,59,0.45)"
                  shadowBlur={6}
                  shadowOffsetY={2}
                />
                <Text
                  width={20}
                  height={20}
                  text="!"
                  fill="#ffffff"
                  fontSize={13}
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                  listening={false}
                />
              </Group>
            );
          })
        : null}
      {overflowingIndices && hoveredOverflow != null
        ? (() => {
            const el = slide.elements[hoveredOverflow];
            if (!el) return null;
            const tooltipW = 248;
            const tooltipH = 50;
            // Anchor: under the badge, right-aligned to the element's right
            // edge, then clamped so we never paint off-stage.
            const anchorX = el.x * scale + el.w * scale - 10 + 20;
            const anchorY = el.y * scale - 10 + 26;
            const x = clamp(
              anchorX - tooltipW,
              4,
              Math.max(4, width - tooltipW - 4),
            );
            const y = clamp(anchorY, 4, Math.max(4, height - tooltipH - 4));
            return (
              <Group x={x} y={y} listening={false}>
                <Rect
                  width={tooltipW}
                  height={tooltipH}
                  fill="#1a1a1a"
                  cornerRadius={6}
                  opacity={0.96}
                  shadowColor="rgba(0,0,0,0.5)"
                  shadowBlur={10}
                  shadowOffsetY={3}
                />
                <Text
                  x={10}
                  y={8}
                  width={tooltipW - 20}
                  text="Text overflows its box"
                  fill="#ffffff"
                  fontSize={12}
                  fontStyle="bold"
                />
                <Text
                  x={10}
                  y={25}
                  width={tooltipW - 20}
                  text="Increase the height, shrink the font, or trim the text."
                  fill="#cdd2dd"
                  fontSize={11}
                  lineHeight={1.35}
                />
              </Group>
            );
          })()
        : null}
      {interactive && selectedIndexes.length > 0 ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          anchorSize={8}
          borderStroke={SELECTION_STROKE}
          anchorFill="#f4f6fa"
          anchorStroke={SELECTION_STROKE}
          keepRatio={false}
        />
      ) : null}
      {interactive && selectedBounds && onDelete ? (
        <DeleteSelectionButton
          height={height}
          onDelete={onDelete}
          selectedBounds={selectedBounds}
          width={width}
        />
      ) : null}
      {interactive && normalizedSelectionBox ? (
        <Rect
          x={normalizedSelectionBox.x}
          y={normalizedSelectionBox.y}
          width={normalizedSelectionBox.width}
          height={normalizedSelectionBox.height}
          fill="rgba(88, 132, 255, 0.12)"
          stroke="#6f93ff"
          strokeWidth={1}
          dash={[6, 4]}
          listening={false}
        />
      ) : null}
    </>
  );
}

function DeleteSelectionButton({
  height,
  onDelete,
  selectedBounds,
  width,
}: {
  height: number;
  onDelete: () => void;
  selectedBounds: Bounds;
  width: number;
}) {
  return (
    <Group
      x={clamp(selectedBounds.x, 4, width - 34)}
      y={clamp(selectedBounds.y + selectedBounds.height + 12, 4, height - 34)}
      onMouseDown={(event) => {
        event.cancelBubble = true;
      }}
      onClick={(event) => {
        event.cancelBubble = true;
        onDelete();
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        onDelete();
      }}
      onMouseEnter={(event) => {
        event.target
          .getStage()
          ?.container()
          .style.setProperty("cursor", "pointer");
      }}
      onMouseLeave={(event) => {
        event.target.getStage()?.container().style.removeProperty("cursor");
      }}
    >
      <Rect
        width={30}
        height={30}
        fill="#b4232a"
        stroke="#ff8a8f"
        strokeWidth={1}
        cornerRadius={6}
        shadowColor="rgba(180,35,42,0.35)"
        shadowBlur={10}
        shadowOffsetY={5}
      />
      <Line points={[9, 10, 21, 10]} stroke="#f4f6fa" strokeWidth={1.8} />
      <Line points={[12, 8, 18, 8]} stroke="#f4f6fa" strokeWidth={1.8} />
      <Rect
        x={10}
        y={12}
        width={10}
        height={10}
        stroke="#f4f6fa"
        strokeWidth={1.8}
        cornerRadius={1}
      />
      <Line points={[13, 14, 13, 20]} stroke="#f4f6fa" strokeWidth={1.2} />
      <Line points={[17, 14, 17, 20]} stroke="#f4f6fa" strokeWidth={1.2} />
    </Group>
  );
}
