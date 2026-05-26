import { useMemo, type CSSProperties } from "react";
import type { Slide, TextElement } from "../../../lib/slide-schema";
import { fitFontToBox } from "../../../lib/textMeasure";
import {
  DomElementLayer,
  elementBoxStyle,
  fontStyle,
  wrappedTextStyle,
} from "../shared";

export function TextDomElement({
  editingTextIndex,
  scale,
  slide,
}: {
  editingTextIndex?: number | null;
  scale: number;
  slide: Slide;
}) {
  // Pre-compute the effective (post-shrink) fontSize for every text
  // element on this slide. The DOM overlay is what the user actually sees
  // in the interactive editor, so without shrinking here the preview
  // overflows visibly while the export silently fits the text — diverging
  // from PPTX export, PDF export, and presentation mode.
  const effectiveFontSizes = useMemo(() => {
    const sizes = new Map<number, number>();
    slide.elements.forEach((element, index) => {
      if (element.kind !== "text") return;
      sizes.set(index, computeEffectiveFontSize(element));
    });
    return sizes;
  }, [slide]);

  return (
    <DomElementLayer>
      {slide.elements.map((element, elementIndex) => {
        if (element.kind !== "text" || editingTextIndex === elementIndex) {
          return null;
        }

        const valign = element.valign ?? "top";
        const effective =
          effectiveFontSizes.get(elementIndex) ?? element.fontSize;
        return (
          <div
            key={elementIndex}
            style={{
              ...elementBoxStyle(element, scale),
              ...fontStyle({ ...element, fontSize: effective }, scale),
              ...textBoxStyle,
              alignItems:
                valign === "middle"
                  ? "center"
                  : valign === "bottom"
                    ? "flex-end"
                    : "flex-start",
              textAlign: element.align ?? "left",
            }}
          >
            <div style={textContentStyle}>{element.text}</div>
          </div>
        );
      })}
    </DomElementLayer>
  );
}

function computeEffectiveFontSize(element: TextElement): number {
  return fitFontToBox(element, element.h);
}

const textBoxStyle: CSSProperties = {
  display: "flex",
  ...wrappedTextStyle,
  whiteSpace: "pre-wrap",
};

const textContentStyle: CSSProperties = {
  width: "100%",
};
