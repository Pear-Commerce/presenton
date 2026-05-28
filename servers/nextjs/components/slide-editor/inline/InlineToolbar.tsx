import type { ReactNode } from "react";
import type { SlideElement } from "../lib/slide-schema";
import { elementBox } from "../lib/element-model";
import { inlineStyles } from "./inlineStyles";

export function InlineToolbar({
  element,
  scale,
  children,
}: {
  element: Pick<SlideElement, "position" | "size">;
  scale: number;
  children: ReactNode;
}) {
  const box = elementBox(element);
  return (
    <div
      style={{
        ...inlineStyles.toolbar,
        left: Math.max(8, box.x * scale),
        top: Math.max(8, box.y * scale - 48),
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}
