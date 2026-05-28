import type {
  CornerRadius,
  Shadow,
  SlideElement,
} from "../../lib/slide-schema";
import { withHash } from "../../editorUtils";

export function konvaCornerRadius(
  element: { borderRadius?: CornerRadius | null },
  scale: number,
) {
  if (element.borderRadius) {
    const r = element.borderRadius;
    return [
      r.tl * scale,
      r.tr * scale,
      r.br * scale,
      r.bl * scale,
    ];
  }
  return 0;
}

export function shadowProps(shadow?: Shadow | null, scale = 1) {
  if (!shadow) return {};
  return {
    shadowColor: withHash(shadow.color ?? "000000"),
    shadowBlur: (shadow.blur ?? 0) * scale,
    shadowOpacity: shadow.opacity ?? 0.25,
    shadowOffsetX: (shadow.offsetX ?? 0) * scale,
    shadowOffsetY: (shadow.offsetY ?? 0) * scale,
  };
}

export function rotationProps(element: Pick<SlideElement, "rotation">) {
  return { rotation: element.rotation ?? 0 };
}
