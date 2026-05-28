import type { ShapeSlideElement } from "../state";
import { withHash, withoutHash } from "../editorUtils";
import { averageBorderRadius, uniformBorderRadius } from "../lib/element-model";
import { InlineToolbar } from "./InlineToolbar";
import { inlineStyles } from "./inlineStyles";

export function ShapeToolbar({
  element,
  index,
  scale,
  onChange,
}: {
  element: ShapeSlideElement;
  index: number;
  scale: number;
  onChange: (index: number, element: ShapeSlideElement) => void;
}) {
  const fill = element.fill ?? { color: "FFFFFF" };
  const stroke = element.stroke ?? { color: "172033", width: 0 };

  return (
    <InlineToolbar element={element} scale={scale}>
      <input
        aria-label="Shape fill"
        title="Fill"
        type="color"
        value={withHash(fill.color)}
        onChange={(event) =>
          onChange(index, {
            ...element,
            fill: { ...fill, color: withoutHash(event.target.value) },
          })
        }
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Shape border color"
        title="Border color"
        type="color"
        value={withHash(stroke.color)}
        onChange={(event) =>
          onChange(index, {
            ...element,
            stroke: { ...stroke, color: withoutHash(event.target.value) },
          })
        }
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Shape border width"
        title="Border width"
        type="number"
        min={0}
        max={8}
        step={0.25}
        value={stroke.width}
        onChange={(event) =>
          onChange(index, {
            ...element,
            stroke: { ...stroke, width: Number(event.target.value) || 0 },
          })
        }
        style={inlineStyles.numberInput}
      />
      {element.type === "rectangle" ? (
        <input
          aria-label="Shape radius"
          title="Radius"
          type="number"
          min={0}
          max={0.5}
          step={0.02}
          value={averageBorderRadius(element.borderRadius)}
          onChange={(event) =>
            onChange(index, {
              ...element,
              borderRadius: uniformBorderRadius(Number(event.target.value) || 0),
            })
          }
          style={inlineStyles.numberInput}
        />
      ) : null}
      <input
        aria-label="Shape opacity"
        title="Opacity"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={element.opacity ?? 1}
        onChange={(event) =>
          onChange(index, { ...element, opacity: Number(event.target.value) })
        }
        style={inlineStyles.opacityInput}
      />
    </InlineToolbar>
  );
}
