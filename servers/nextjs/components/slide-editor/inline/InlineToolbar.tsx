import type { ReactNode } from "react";
import type { SlideElement } from "../lib/slide-schema";
import { inlineStyles } from "./inlineStyles";

export function InlineToolbar({
  element,
  scale,
  children,
}: {
  element: Pick<SlideElement, "x" | "y">;
  scale: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        ...inlineStyles.toolbar,
        left: Math.max(8, element.x * scale),
        top: Math.max(8, element.y * scale - 48),
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}
