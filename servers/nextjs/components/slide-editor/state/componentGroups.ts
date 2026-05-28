import {
  SLIDE_H,
  SLIDE_W,
  type Slide,
  type SlideElement,
} from "../lib/slide-schema";
import { clamp } from "../editorUtils";
import { elementBox, moveElement } from "../lib/element-model";

export type ComponentRun = {
  componentId: string;
  componentInstanceId?: string;
  start: number;
  end: number;
  indexes: number[];
};

export function getComponentRun(
  elements: SlideElement[],
  index: number,
): ComponentRun | null {
  const target = elements[index];
  const componentId = target?.componentId;
  if (!componentId) return null;
  const componentInstanceId = target.componentInstanceId;

  const belongsToRun = (element: SlideElement | undefined) =>
    !!element &&
    element.componentId === componentId &&
    (componentInstanceId
      ? element.componentInstanceId === componentInstanceId
      : !element.componentInstanceId);

  let start = index;
  while (start > 0 && belongsToRun(elements[start - 1])) start -= 1;

  let end = index;
  while (end < elements.length - 1 && belongsToRun(elements[end + 1])) {
    end += 1;
  }

  return {
    componentId,
    componentInstanceId: componentInstanceId ?? undefined,
    start,
    end,
    indexes: Array.from(
      { length: end - start + 1 },
      (_, offset) => start + offset,
    ),
  };
}

export function arrangeRepeatableComponents(slide: Slide, componentId: string) {
  if (componentId !== "feature_card_large") return;

  const groups = componentRunsFor(slide.elements, componentId);
  if (groups.length <= 1) return;

  const sorted = groups
    .map((run) => ({ run, bounds: boundsFor(slide.elements, run.indexes) }))
    .sort((a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x);

  const columns = [180 / 128, 730 / 128];
  const firstY = 235 / 128;
  const tallest = Math.max(...sorted.map(({ bounds }) => bounds.h));
  const rowGap = Math.max(184 / 128, tallest + 0.22);

  sorted.forEach(({ run, bounds }, order) => {
    const col = order % 2;
    const row = Math.floor(order / 2);
    const targetX = clamp(columns[col], 0, SLIDE_W - bounds.w);
    const targetY = clamp(firstY + row * rowGap, 0, SLIDE_H - bounds.h);
    moveRun(
      slide.elements,
      run.indexes,
      targetX - bounds.x,
      targetY - bounds.y,
    );
  });
}

function componentRunsFor(elements: SlideElement[], componentId: string) {
  const runs: ComponentRun[] = [];
  let index = 0;
  while (index < elements.length) {
    if (elements[index]?.componentId !== componentId) {
      index += 1;
      continue;
    }
    const run = getComponentRun(elements, index);
    if (!run) {
      index += 1;
      continue;
    }
    if (run.componentId === componentId) runs.push(run);
    index = run.end + 1;
  }
  return runs;
}

function boundsFor(elements: SlideElement[], indexes: number[]) {
  const selected = indexes.map((index) => elements[index]).filter(Boolean);
  const boxes = selected.map(elementBox);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w));
  const maxY = Math.max(...boxes.map((box) => box.y + box.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function moveRun(
  elements: SlideElement[],
  indexes: number[],
  dx: number,
  dy: number,
) {
  for (const index of indexes) {
    const element = elements[index];
    if (!element) continue;
    elements[index] = moveElement(element, dx, dy);
  }
}
