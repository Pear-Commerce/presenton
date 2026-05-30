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

export function colorWithOpacity(color: string, opacity?: number | null) {
  if (opacity == null || opacity >= 1) return withHash(color);
  const hex = color.replace("#", "");
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function rotationProps(element: Pick<SlideElement, "rotation">) {
  return { rotation: element.rotation ?? 0 };
}
