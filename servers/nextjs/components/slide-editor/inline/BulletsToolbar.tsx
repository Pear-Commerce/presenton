import type { BulletsSlideElement } from "../state";
import { withHash, withoutHash } from "../editorUtils";
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
  return (
    <InlineToolbar element={element} scale={scale}>
      <input
        aria-label="Bullet font size"
        title="Font size"
        type="number"
        min={8}
        max={36}
        value={element.fontSize}
        onChange={(event) =>
          onChange(index, {
            ...element,
            fontSize: Number(event.target.value) || element.fontSize,
          })
        }
        style={inlineStyles.numberInput}
      />
      <input
        aria-label="Bullet color"
        title="Color"
        type="color"
        value={withHash(element.color)}
        onChange={(event) =>
          onChange(index, {
            ...element,
            color: withoutHash(event.target.value),
          })
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
        value={element.lineSpacingMultiple ?? 1.3}
        onChange={(event) =>
          onChange(index, {
            ...element,
            lineSpacingMultiple:
              Number(event.target.value) || element.lineSpacingMultiple || 1.3,
          })
        }
        style={inlineStyles.numberInput}
      />
      <input
        aria-label="Bullet item gap"
        title="Item gap"
        type="number"
        min={0}
        max={0.4}
        step={0.02}
        value={element.itemGap ?? 0.05}
        onChange={(event) =>
          onChange(index, {
            ...element,
            itemGap: Number(event.target.value) || element.itemGap || 0,
          })
        }
        style={inlineStyles.numberInput}
      />
    </InlineToolbar>
  );
}
