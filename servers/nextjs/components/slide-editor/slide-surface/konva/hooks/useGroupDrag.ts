import Konva from "konva";
import { useRef, type RefObject } from "react";
import {
  SLIDE_H,
  SLIDE_W,
  type Slide,
  type SlideElement,
} from "../../../lib/slide-schema";
import { clamp } from "../../../editorUtils";
import { elementBox, resizeElement } from "../../../lib/element-model";

type GroupDragState = {
  index: number;
  nodePositions: Array<{ index: number; x: number; y: number }>;
  elements: Array<{ index: number; element: SlideElement }>;
};

export function useGroupDrag({
  nodeRefs,
  onChangeMany,
  scale,
  selectedIndexes,
  slide,
  transformerRef,
}: {
  nodeRefs: RefObject<Array<Konva.Node | null>>;
  onChangeMany?: (
    updates: Array<{ index: number; element: SlideElement }>,
  ) => void;
  scale: number;
  selectedIndexes: number[];
  slide: Slide;
  transformerRef: RefObject<Konva.Transformer | null>;
}) {
  const groupDragRef = useRef<GroupDragState | null>(null);

  const startGroupDrag = (index: number) => {
    if (!selectedIndexes.includes(index) || selectedIndexes.length <= 1) {
      groupDragRef.current = null;
      return;
    }
    groupDragRef.current = {
      index,
      nodePositions: selectedIndexes.flatMap((selectedIndex) => {
        const node = nodeRefs.current[selectedIndex];
        return node ? [{ index: selectedIndex, x: node.x(), y: node.y() }] : [];
      }),
      elements: selectedIndexes.map((selectedIndex) => ({
        index: selectedIndex,
        element: slide.elements[selectedIndex],
      })),
    };
  };

  const moveGroupDrag = (
    index: number,
    event: Konva.KonvaEventObject<DragEvent>,
  ) => {
    const groupDrag = groupDragRef.current;
    if (!groupDrag || groupDrag.index !== index) return;
    const origin = groupDrag.nodePositions.find((item) => item.index === index);
    if (!origin) return;
    const dx = event.target.x() - origin.x;
    const dy = event.target.y() - origin.y;
    groupDrag.nodePositions.forEach((item) => {
      if (item.index === index) return;
      const node = nodeRefs.current[item.index];
      node?.position({ x: item.x + dx, y: item.y + dy });
    });
    transformerRef.current?.getLayer()?.batchDraw();
  };

  const endGroupDrag = (
    index: number,
    event: Konva.KonvaEventObject<DragEvent>,
  ) => {
    const groupDrag = groupDragRef.current;
    if (!groupDrag || groupDrag.index !== index) return false;
    const origin = groupDrag.nodePositions.find((item) => item.index === index);
    if (!origin) return true;
    const dx = (event.target.x() - origin.x) / scale;
    const dy = (event.target.y() - origin.y) / scale;
    onChangeMany?.(
      groupDrag.elements.map(({ index: selectedIndex, element }) => ({
        index: selectedIndex,
        element: (() => {
          const box = elementBox(element);
          return resizeElement(element, {
            x: clamp(box.x + dx, 0, SLIDE_W - box.w),
            y: clamp(box.y + dy, 0, SLIDE_H - box.h),
          });
        })(),
      })),
    );
    groupDragRef.current = null;
    return true;
  };

  return {
    endGroupDrag,
    moveGroupDrag,
    startGroupDrag,
  };
}
