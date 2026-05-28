import type { CSSProperties } from "react";
import type { Font, Shadow, SlideElement } from "../../../lib/slide-schema";
import { PT_TO_PX, PX_PER_IN, withHash } from "../../../editorUtils";
import { elementBox, elementFont } from "../../../lib/element-model";

export function elementBoxStyle(
  element: Pick<
    SlideElement,
    "position" | "size" | "opacity" | "rotation" | "shadow"
  > & {
    opacity?: number | null;
    rotation?: number | null;
    shadow?: Shadow | null;
  },
  scale: number,
): CSSProperties {
  const box = elementBox(element);
  return {
    position: "absolute",
    boxSizing: "border-box",
    height: box.h * scale,
    left: box.x * scale,
    opacity: element.opacity ?? 1,
    top: box.y * scale,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: "top left",
    boxShadow: element.shadow
      ? `${(element.shadow.offsetX ?? 0) * scale}px ${
          (element.shadow.offsetY ?? 0) * scale
        }px ${(element.shadow.blur ?? 0) * scale}px rgba(${hexToRgb(
          element.shadow.color ?? "000000",
        )}, ${element.shadow.opacity ?? 0.25})`
      : undefined,
    width: box.w * scale,
  };
}

export function fontStyle(
  element: { font?: Font | null },
  scale: number,
): CSSProperties {
  const font = elementFont(element);
  return {
    color: withHash(font.color),
    fontFamily: `${font.family}, Helvetica, sans-serif`,
    fontSize: font.size * PT_TO_PX * (scale / PX_PER_IN),
    fontStyle: font.italic ? "italic" : "normal",
    fontWeight: font.bold ? 700 : 400,
    letterSpacing:
      ((font.letterSpacing ?? 0) / 100) * PT_TO_PX * (scale / PX_PER_IN),
    lineHeight: font.lineHeight ?? 1.15,
  };
}

export const wrappedTextStyle: CSSProperties = {
  overflow: "hidden",
  wordBreak: "break-word",
};

function hexToRgb(color: string) {
  const hex = color.replace("#", "");
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `${red}, ${green}, ${blue}`;
}
