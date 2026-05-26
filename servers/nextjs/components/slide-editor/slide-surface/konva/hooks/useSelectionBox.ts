import Konva from "konva";
import { useMemo, useState } from "react";
import type { Slide, SlideElement } from "../../../lib/slide-schema";

type SelectionBox = {
  active: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type RectBox = { x: number; y: number; width: number; height: number };

export function useSelectionBox({
  interactive,
  onSelect,
  onSelectMany,
  scale,
  slide,
}: {
  interactive: boolean;
  onSelect?: (index: number, additive?: boolean) => void;
  onSelectMany?: (indexes: number[]) => void;
  scale: number;
  slide: Slide;
}) {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const normalizedSelectionBox = useMemo(
    () =>
      selectionBox
        ? {
            x: Math.min(selectionBox.startX, selectionBox.x),
            y: Math.min(selectionBox.startY, selectionBox.y),
            width: Math.abs(selectionBox.width),
            height: Math.abs(selectionBox.height),
          }
        : null,
    [selectionBox],
  );

  const stagePointer = (stage: Konva.Stage | null) => {
    const point = stage?.getPointerPosition();
    return point ? { x: point.x, y: point.y } : null;
  };

  const selectionRectFromPoints = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  });

  const elementIntersectsBox = (element: SlideElement, box: RectBox) => {
    const elementBox = {
      x: element.x * scale,
      y: element.y * scale,
      width: element.w * scale,
      height: element.h * scale,
    };
    const elementCenter = {
      x: elementBox.x + elementBox.width / 2,
      y: elementBox.y + elementBox.height / 2,
    };
    const centerInside =
      elementCenter.x >= box.x &&
      elementCenter.x <= box.x + box.width &&
      elementCenter.y >= box.y &&
      elementCenter.y <= box.y + box.height;
    if (centerInside) return true;

    const overlapX = Math.max(
      0,
      Math.min(elementBox.x + elementBox.width, box.x + box.width) -
        Math.max(elementBox.x, box.x),
    );
    const overlapY = Math.max(
      0,
      Math.min(elementBox.y + elementBox.height, box.y + box.height) -
        Math.max(elementBox.y, box.y),
    );
    const elementArea = elementBox.width * elementBox.height;
    const overlapArea = overlapX * overlapY;
    return elementArea > 0 && overlapArea / elementArea >= 0.35;
  };

  const stageHandlers = {
    onMouseDown: (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (!interactive || event.target !== event.target.getStage()) return;
      const point = stagePointer(event.target.getStage());
      if (!point) return;
      setSelectionBox({
        active: true,
        startX: point.x,
        startY: point.y,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      });
    },
    onMouseMove: (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (!selectionBox?.active) return;
      const point = stagePointer(event.target.getStage());
      if (!point) return;
      setSelectionBox((current) =>
        current?.active
          ? {
              ...current,
              x: point.x,
              y: point.y,
              width: point.x - current.startX,
              height: point.y - current.startY,
            }
          : current,
      );
    },
    onMouseUp: (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (!selectionBox?.active) return;
      const endPoint = stagePointer(event.target.getStage());
      const box = endPoint
        ? selectionRectFromPoints(
            { x: selectionBox.startX, y: selectionBox.startY },
            endPoint,
          )
        : normalizedSelectionBox;
      setSelectionBox(null);
      if (!box || (box.width < 4 && box.height < 4)) {
        onSelect?.(-1);
        return;
      }
      const indexes = slide.elements
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => elementIntersectsBox(element, box))
        .map(({ index }) => index);
      onSelectMany?.(indexes);
    },
  };

  return {
    normalizedSelectionBox,
    stageHandlers,
  };
}
