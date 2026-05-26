import type { TextSlideElement } from "../state";
import { withHash, withoutHash } from "../editorUtils";
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
  return (
    <InlineToolbar element={element} scale={scale}>
      <button
        type="button"
        title="Bold"
        aria-pressed={element.bold ?? false}
        onClick={() =>
          onChange(index, {
            ...element,
            bold: !(element.bold ?? false),
          })
        }
        style={{
          ...inlineStyles.iconButton,
          ...(element.bold ? inlineStyles.iconButtonActive : {}),
        }}
      >
        B
      </button>
      <button
        type="button"
        title="Italic"
        aria-pressed={element.italic ?? false}
        onClick={() =>
          onChange(index, {
            ...element,
            italic: !(element.italic ?? false),
          })
        }
        style={{
          ...inlineStyles.iconButton,
          fontStyle: "italic",
          ...(element.italic ? inlineStyles.iconButtonActive : {}),
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
        aria-label="Text color"
        title="Text color"
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
