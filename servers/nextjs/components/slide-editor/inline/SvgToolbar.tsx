import { SLIDE_H, SLIDE_W } from "../lib/slide-schema";
import { elementBox, resizeElement } from "../lib/element-model";
import { sanitizeSvgMarkup } from "../lib/svg-sanitize";
import type { SvgSlideElement } from "../state";
import { createDefaultElement } from "../state";
import { InlineToolbar } from "./InlineToolbar";
import { inlineStyles } from "./inlineStyles";

export function SvgToolbar({
  element,
  index,
  scale,
  onChange,
}: {
  element: SvgSlideElement;
  index: number;
  scale: number;
  onChange: (index: number, element: SvgSlideElement) => void;
}) {
  const editMarkup = () => {
    const nextSvg = window.prompt("Edit SVG markup", element.svg);
    if (nextSvg == null || !nextSvg.trim()) return;

    try {
      onChange(index, { ...element, svg: sanitizeSvgMarkup(nextSvg) });
    } catch {
      window.alert("SVG markup must contain one valid <svg> root.");
    }
  };

  const resetSvg = () => {
    const next = createDefaultElement("svg");
    if (next.type !== "svg") return;

    onChange(index, {
      ...element,
      name: next.name,
      svg: next.svg,
    });
  };

  return (
    <InlineToolbar element={element} scale={scale}>
      <input
        aria-label="SVG name"
        title="Name"
        value={element.name ?? ""}
        placeholder="SVG name"
        onChange={(event) =>
          onChange(index, {
            ...element,
            name: event.target.value || undefined,
          })
        }
        style={inlineStyles.textInput}
      />
      <button
        type="button"
        title="Edit SVG markup"
        onClick={editMarkup}
        style={inlineStyles.fileButton}
      >
        SVG
      </button>
      <button
        type="button"
        title="Make square"
        onClick={() => onChange(index, resizeSvg(element, "square"))}
        style={inlineStyles.actionButton}
      >
        1:1
      </button>
      <button
        type="button"
        title="Make wide"
        onClick={() => onChange(index, resizeSvg(element, "wide"))}
        style={inlineStyles.actionButton}
      >
        Wide
      </button>
      <button
        type="button"
        title="Make tall"
        onClick={() => onChange(index, resizeSvg(element, "tall"))}
        style={inlineStyles.actionButton}
      >
        Tall
      </button>
      <input
        aria-label="SVG opacity"
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
      <button
        type="button"
        title="Reset SVG"
        onClick={resetSvg}
        style={{
          ...inlineStyles.iconButton,
          ...inlineStyles.dangerButton,
          width: 44,
        }}
      >
        Reset
      </button>
    </InlineToolbar>
  );
}

function resizeSvg(
  element: SvgSlideElement,
  preset: "square" | "wide" | "tall",
): SvgSlideElement {
  const box = elementBox(element);

  if (preset === "square") {
    const side = Math.min(
      box.w,
      box.h,
      SLIDE_W - box.x,
      SLIDE_H - box.y,
    );
    return resizeElement(element, { w: side, h: side });
  }

  const ratio = preset === "wide" ? 16 / 9 : 3 / 4;
  const maxW = SLIDE_W - box.x;
  const maxH = SLIDE_H - box.y;
  const nextW = Math.min(maxW, Math.max(0.6, box.w));
  const nextH = Math.min(maxH, Math.max(0.4, nextW / ratio));

  return resizeElement(element, { w: Math.min(maxW, nextH * ratio), h: nextH });
}
