import type { ImageSlideElement } from "../state";
import { InlineToolbar } from "./InlineToolbar";
import { inlineStyles } from "./inlineStyles";

export function ImageToolbar({
  element,
  index,
  scale,
  onChange,
  onUpload,
}: {
  element: ImageSlideElement;
  index: number;
  scale: number;
  onChange: (index: number, element: ImageSlideElement) => void;
  onUpload: (index: number) => void;
}) {
  return (
    <InlineToolbar element={element} scale={scale}>
      <button
        type="button"
        title="Upload image"
        onClick={() => onUpload(index)}
        style={inlineStyles.fileButton}
      >
        Image
      </button>
      <select
        aria-label="Image fit"
        title="Fit"
        value={element.fit ?? "contain"}
        onChange={(event) =>
          onChange(index, {
            ...element,
            fit: event.target.value as "contain" | "cover" | "fill",
          })
        }
        style={inlineStyles.select}
      >
        <option value="contain">Contain</option>
        <option value="cover">Cover</option>
        <option value="fill">Fill</option>
      </select>
      <input
        aria-label="Image opacity"
        title="Opacity"
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
      {element.data ? (
        <button
          type="button"
          title="Remove image"
          onClick={() =>
            onChange(index, {
              ...element,
              data: undefined,
              name: undefined,
            })
          }
          style={{
            ...inlineStyles.iconButton,
            ...inlineStyles.dangerButton,
          }}
        >
          ×
        </button>
      ) : null}
    </InlineToolbar>
  );
}
