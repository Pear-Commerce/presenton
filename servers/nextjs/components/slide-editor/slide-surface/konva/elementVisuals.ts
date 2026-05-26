import type {
  CornerRadius,
  Shadow,
  SlideElement,
} from "../../lib/slide-schema";
import { withHash } from "../../editorUtils";

export function konvaCornerRadius(
  element: { rx?: number | null; radius?: CornerRadius | null },
  scale: number,
) {
  if (element.radius) {
    const r = element.radius;
    return [
      (r.tl ?? element.rx ?? 0) * scale,
      (r.tr ?? element.rx ?? 0) * scale,
      (r.br ?? element.rx ?? 0) * scale,
      (r.bl ?? element.rx ?? 0) * scale,
    ];
  }
  return (element.rx ?? 0) * scale;
}

export function shadowProps(shadow?: Shadow | null, scale = 1) {
  if (!shadow) return {};
  return {
    shadowColor: withHash(shadow.color),
    shadowBlur: shadow.blur * scale,
    shadowOpacity: shadow.opacity,
    shadowOffsetX: shadow.offsetX * scale,
    shadowOffsetY: shadow.offsetY * scale,
  };
}

export function rotationProps(element: Pick<SlideElement, "rotation">) {
  return { rotation: element.rotation ?? 0 };
}
