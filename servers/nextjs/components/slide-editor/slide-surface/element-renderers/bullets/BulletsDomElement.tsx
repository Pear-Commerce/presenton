import { useMemo, type CSSProperties } from "react";
import { textListStrings } from "../../../lib/element-model";
import { rootPath, type ElementPath } from "../../../lib/element-path";
import type { ResolvedLayoutItem } from "../../../lib/layout-resolver";
import { fitBulletsFontToBox } from "../../../lib/textMeasure";
import {
  DomElementLayer,
  elementBoxStyle,
  fontStyle,
  wrappedTextStyle,
} from "../shared";

export function BulletsDomElement({
  editingBulletsIndex,
  editingBulletsPath,
  items,
  scale,
}: {
  editingBulletsIndex?: number | null;
  editingBulletsPath?: ElementPath | null;
  items: ResolvedLayoutItem[];
  scale: number;
}) {
  const editingPath =
    editingBulletsPath ??
    (editingBulletsIndex != null ? rootPath(editingBulletsIndex) : null);

  // Pre-compute the effective fontSize for every bullets element on this
  // slide. Same rationale as TextDomElement: the DOM overlay is what the
  // user sees in the editor, so without shrinking here the preview
  // overflows while presentation/export views auto-fit.
  const effectiveFontSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    items.forEach((item) => {
      const element = item.element;
      if (element.type !== "text-list") return;
      sizes.set(item.path, fitBulletsFontToBox(element));
    });
    return sizes;
  }, [items]);

  return (
    <DomElementLayer>
      {items.map((item) => {
        const element = item.element;
        if (element.type !== "text-list" || item.sourcePath === editingPath) {
          return null;
        }
        const effective =
          effectiveFontSizes.get(item.path) ?? element.font?.size;
        const items = textListStrings(element);

        return (
          <ListTag
            key={item.path}
            style={{
              ...elementBoxStyle(element, scale),
              ...fontStyle(
                {
                  font: {
                    ...(element.font ?? {}),
                    size: effective,
                    lineHeight: element.font?.lineHeight ?? 1.3,
                  },
                },
                scale,
              ),
              ...listStyle,
              listStyleType:
                element.marker === "none"
                  ? "none"
                  : element.marker === "number"
                    ? "decimal"
                    : "disc",
            }}
          >
            {items.map((item, itemIndex) => (
              <li
                key={`${item}-${itemIndex}`}
                style={{
                  ...itemStyle,
                  marginBottom: itemIndex === items.length - 1 ? 0 : 0.05 * scale,
                }}
              >
                {item}
              </li>
            ))}
          </ListTag>
        );
      })}
    </DomElementLayer>
  );
}

const ListTag = "ul";

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "1.1em",
  ...wrappedTextStyle,
  whiteSpace: "normal",
};

const itemStyle: CSSProperties = {
  paddingLeft: "0.15em",
};
