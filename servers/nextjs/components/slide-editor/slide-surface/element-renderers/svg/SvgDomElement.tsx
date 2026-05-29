import { useMemo } from "react";
import type { ResolvedLayoutItem } from "../../../lib/layout-resolver";
import { sanitizeSvgMarkup } from "../../../lib/svg-sanitize";
import { DomElementLayer, elementBoxStyle } from "../shared";

export function SvgDomElement({
  items,
  scale,
}: {
  items: ResolvedLayoutItem[];
  scale: number;
}) {
  const svgElements = useMemo(
    () =>
      new Map(
        items.flatMap((item) =>
          item.element.type === "svg"
            ? [[item.path, sanitizeSvgMarkup(item.element.svg)]]
            : [],
        ),
      ),
    [items],
  );

  return (
    <DomElementLayer>
      {items.map((item) => {
        const element = item.element;
        return element.type === "svg" ? (
          <div
            key={item.path}
            style={{
              ...elementBoxStyle(element, scale),
              overflow: "hidden",
            }}
            dangerouslySetInnerHTML={{ __html: svgElements.get(item.path) ?? "" }}
          />
        ) : null;
      })}
    </DomElementLayer>
  );
}
