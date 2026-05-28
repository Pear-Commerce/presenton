import type { BulletsSlideElement } from "../state";
import { withHash, withoutHash } from "../editorUtils";
import { elementFont, mergeFont } from "../lib/element-model";
import { InlineToolbar } from "./InlineToolbar";
import { inlineStyles } from "./inlineStyles";

export function BulletsToolbar({
  element,
  index,
  scale,
  onChange,
}: {
  element: BulletsSlideElement;
  index: number;
  scale: number;
  onChange: (index: number, element: BulletsSlideElement) => void;
}) {
  const font = elementFont(element);
  return (
    <InlineToolbar element={element} scale={scale}>
      <input
        aria-label="Bullet font size"
        title="Font size"
        type="number"
        min={8}
        max={36}
        value={font.size}
        onChange={(event) =>
          onChange(index, mergeFont(element, { size: Number(event.target.value) || font.size }))
        }
        style={inlineStyles.numberInput}
      />
      <input
        aria-label="Bullet color"
        title="Color"
        type="color"
        value={withHash(font.color)}
        onChange={(event) =>
          onChange(index, mergeFont(element, { color: withoutHash(event.target.value) }))
        }
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Bullet line height"
        title="Line height"
        type="number"
        min={0.9}
        max={2}
        step={0.05}
        value={font.lineHeight ?? 1.3}
        onChange={(event) =>
          onChange(index, mergeFont(element, { lineHeight: Number(event.target.value) || font.lineHeight || 1.3 }))
        }
        style={inlineStyles.numberInput}
      />
    </InlineToolbar>
  );
}
