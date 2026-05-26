import { useMemo } from "react";
import type { Slide } from "../../../lib/slide-schema";
import { sanitizeSvgMarkup } from "../../../lib/svg-sanitize";
import { DomElementLayer, elementBoxStyle } from "../shared";

export function SvgDomElement({
  scale,
  slide,
}: {
  scale: number;
  slide: Slide;
}) {
  const svgElements = useMemo(
    () =>
      slide.elements.map((element) =>
        element.kind === "svg" ? sanitizeSvgMarkup(element.svg) : null,
      ),
    [slide.elements],
  );

  return (
    <DomElementLayer>
      {slide.elements.map((element, index) =>
        element.kind === "svg" ? (
          <div
            key={index}
            style={{
              ...elementBoxStyle(element, scale),
              overflow: "hidden",
            }}
            dangerouslySetInnerHTML={{ __html: svgElements[index] ?? "" }}
          />
        ) : null,
      )}
    </DomElementLayer>
  );
}
