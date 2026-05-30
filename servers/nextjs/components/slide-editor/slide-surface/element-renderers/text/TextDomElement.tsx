import { useMemo, type CSSProperties } from "react";
import type { TextElement } from "../../../lib/slide-schema";
import { elementBox, textContent } from "../../../lib/element-model";
import { rootPath, type ElementPath } from "../../../lib/element-path";
import type { ResolvedLayoutItem } from "../../../lib/layout-resolver";
import { fitFontToBox } from "../../../lib/textMeasure";
import {
  DomElementLayer,
  elementBoxStyle,
  fontStyle,
  wrappedTextStyle,
} from "../shared";

export function TextDomElement({
  editingTextIndex,
  editingTextPath,
  items,
  scale,
}: {
  editingTextIndex?: number | null;
  editingTextPath?: ElementPath | null;
  items: ResolvedLayoutItem[];
  scale: number;
}) {
  const editingPath =
    editingTextPath ??
    (editingTextIndex != null ? rootPath(editingTextIndex) : null);

  // Pre-compute the effective (post-shrink) fontSize for every text
  // element on this slide. The DOM overlay is what the user actually sees
  // in the interactive editor, so without shrinking here the preview
  // overflows visibly while the export silently fits the text — diverging
  // from PPTX export, PDF export, and presentation mode.
  const effectiveFontSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    items.forEach((item) => {
      const element = item.element;
      if (element.type !== "text") return;
      sizes.set(item.path, computeEffectiveFontSize(element));
    });
    return sizes;
  }, [items]);

  return (
    <DomElementLayer>
      {items.map((item) => {
        const element = item.element;
        if (element.type !== "text" || item.sourcePath === editingPath) {
          return null;
        }

        const valign = element.alignment?.vertical ?? "top";
        const effective =
          effectiveFontSizes.get(item.path) ?? element.font?.size;
        return (
          <div
            key={item.path}
            style={{
              ...elementBoxStyle(element, scale),
              ...fontStyle(
                { font: { ...(element.font ?? {}), size: effective } },
                scale,
              ),
              ...textBoxStyle,
              whiteSpace: element.font?.wrap === "none" ? "pre" : "pre-wrap",
              wordBreak:
                element.font?.wrap === "none" ? "normal" : "break-word",
              alignItems:
                valign === "middle"
                  ? "center"
                  : valign === "bottom"
                    ? "flex-end"
                    : "flex-start",
              textAlign: element.alignment?.horizontal ?? "left",
            }}
          >
            <div style={textContentStyle}>{textContent(element)}</div>
          </div>
        );
      })}
    </DomElementLayer>
  );
}

function computeEffectiveFontSize(element: TextElement): number {
  return fitFontToBox(element, elementBox(element).h);
}

const textBoxStyle: CSSProperties = {
  display: "flex",
  ...wrappedTextStyle,
  whiteSpace: "pre-wrap",
};

const textContentStyle: CSSProperties = {
  width: "100%",
};
