import type { TextSlideElement } from "../state";
import { withHash, withoutHash } from "../editorUtils";
import { elementFont, mergeFont } from "../lib/element-model";
import { InlineToolbar } from "./InlineToolbar";
import { inlineStyles } from "./inlineStyles";

export function TextToolbar({
  element,
  index,
  scale,
  onChange,
}: {
  element: TextSlideElement;
  index: number;
  scale: number;
  onChange: (index: number, element: TextSlideElement) => void;
}) {
  const font = elementFont(element);
  return (
    <InlineToolbar element={element} scale={scale}>
      <button
        type="button"
        title="Bold"
        aria-pressed={font.bold ?? false}
        onClick={() =>
          onChange(index, mergeFont(element, { bold: !(font.bold ?? false) }))
        }
        style={{
          ...inlineStyles.iconButton,
          ...(font.bold ? inlineStyles.iconButtonActive : {}),
        }}
      >
        B
      </button>
      <button
        type="button"
        title="Italic"
        aria-pressed={font.italic ?? false}
        onClick={() =>
          onChange(index, mergeFont(element, { italic: !(font.italic ?? false) }))
        }
        style={{
          ...inlineStyles.iconButton,
          fontStyle: "italic",
          ...(font.italic ? inlineStyles.iconButtonActive : {}),
        }}
      >
        I
      </button>
      <input
        aria-label="Font size"
        title="Font size"
        type="number"
        min={6}
        max={360}
        value={font.size}
        onChange={(event) =>
          onChange(index, mergeFont(element, { size: Number(event.target.value) || font.size }))
        }
        style={inlineStyles.numberInput}
      />
      <input
        aria-label="Text color"
        title="Text color"
        type="color"
        value={withHash(font.color)}
        onChange={(event) =>
          onChange(index, mergeFont(element, { color: withoutHash(event.target.value) }))
        }
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Text opacity"
        title="Text opacity"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={element.opacity ?? 1}
        onChange={(event) =>
          onChange(index, {
            ...element,
            opacity: Number(event.target.value),
          })
        }
        style={inlineStyles.opacityInput}
      />
    </InlineToolbar>
  );
}
