import type Konva from "konva";

export const SELECTION_STROKE = "#7C51F8";

export type ElementEvents = {
  draggable: boolean;
  onClick: (event: Konva.KonvaEventObject<MouseEvent>) => boolean;
  onDblClick?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onTap: (event: Konva.KonvaEventObject<TouchEvent>) => boolean;
  onMouseDown?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onTouchStart?: (event: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchMove?: (event: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEnd?: () => void;
  onTouchCancel?: () => void;
  onDragStart: () => void;
  onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (event: Konva.KonvaEventObject<Event>) => void;
};

export type ElementCommonProps = {
  index: number;
  scale: number;
  selected: boolean;
  editing?: boolean;
  setRef: (node: Konva.Node | null) => void;
  events: ElementEvents;
};

export type TableInteractionProps = {
  onTableCellClick?: (rowIndex: number, colIndex: number) => void;
};

export function geometry(
  box: { x: number; y: number; w: number; h: number },
  scale: number,
  selected: boolean,
) {
  return {
    x: box.x * scale,
    y: box.y * scale,
    width: box.w * scale,
    height: box.h * scale,
    stroke: selected ? SELECTION_STROKE : undefined,
    strokeWidth: selected ? 1.5 : 0,
  };
}
