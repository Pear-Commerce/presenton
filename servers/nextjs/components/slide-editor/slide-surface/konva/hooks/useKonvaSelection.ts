import Konva from "konva";
import { useEffect, useMemo, useRef } from "react";
import type { Slide, SlideElement } from "../../../lib/slide-schema";
import { elementBox } from "../../../lib/element-model";

export function useKonvaSelection({
  interactive,
  selected,
  selectedItems,
  slide,
  scale,
}: {
  interactive: boolean;
  selected?: number;
  selectedItems?: number[];
  slide: Slide;
  scale: number;
}) {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Array<Konva.Node | null>>([]);
  const selectedIndexes = useMemo(
    () =>
      selectedItems && selectedItems.length > 0
        ? selectedItems
        : selected != null && selected >= 0
          ? [selected]
          : [],
    [selected, selectedItems],
  );
  const selectedBounds = useMemo(() => {
    if (selectedIndexes.length === 0) return null;
    const boxes = selectedIndexes
      .map((index) => slide.elements[index])
      .filter((element): element is SlideElement => Boolean(element))
      .map((element) => {
        const box = elementBox(element);
        return {
          x: box.x * scale,
          y: box.y * scale,
          width: box.w * scale,
          height: box.h * scale,
        };
      });
    if (boxes.length === 0) return null;
    const minX = Math.min(...boxes.map((box) => box.x));
    const minY = Math.min(...boxes.map((box) => box.y));
    const maxX = Math.max(...boxes.map((box) => box.x + box.width));
    const maxY = Math.max(...boxes.map((box) => box.y + box.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [scale, selectedIndexes, slide.elements]);

  useEffect(() => {
    if (!interactive) return;
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = selectedIndexes
      .map((index) => nodeRefs.current[index])
      .filter((node): node is Konva.Node => Boolean(node));
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [interactive, selectedIndexes, slide]);

  return {
    nodeRefs,
    selectedBounds,
    selectedIndexes,
    transformerRef,
  };
}
