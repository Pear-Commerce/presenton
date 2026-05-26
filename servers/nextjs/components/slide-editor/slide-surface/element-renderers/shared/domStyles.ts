import type { CSSProperties } from "react";
import type { Shadow } from "../../../lib/slide-schema";
import { PT_TO_PX, PX_PER_IN, withHash } from "../../../editorUtils";

export function elementBoxStyle(
  element: {
    x: number;
    y: number;
    w: number;
    h: number;
    opacity?: number | null;
    rotation?: number | null;
    shadow?: Shadow | null;
  },
  scale: number,
): CSSProperties {
  return {
    position: "absolute",
    boxSizing: "border-box",
    height: element.h * scale,
    left: element.x * scale,
    opacity: element.opacity ?? 1,
    top: element.y * scale,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: "top left",
    boxShadow: element.shadow
      ? `${element.shadow.offsetX * scale}px ${element.shadow.offsetY * scale}px ${element.shadow.blur * scale}px rgba(${hexToRgb(
          element.shadow.color,
        )}, ${element.shadow.opacity})`
      : undefined,
    width: element.w * scale,
  };
}

export function fontStyle(
  element: {
    fontSize: number;
    color: string;
    fontFace?: string | null;
    bold?: boolean | null;
    italic?: boolean | null;
    charSpacing?: number | null;
    lineHeight?: number | null;
  },
  scale: number,
): CSSProperties {
  return {
    color: withHash(element.color),
    fontFamily: `${element.fontFace ?? "Arial"}, Helvetica, sans-serif`,
    fontSize: element.fontSize * PT_TO_PX * (scale / PX_PER_IN),
    fontStyle: element.italic ? "italic" : "normal",
    fontWeight: element.bold ? 700 : 400,
    letterSpacing:
      ((element.charSpacing ?? 0) / 100) * PT_TO_PX * (scale / PX_PER_IN),
    lineHeight: element.lineHeight ?? 1.15,
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
