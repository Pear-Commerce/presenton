import type { TextSlideElement } from "../state";
import { PT_TO_PX, PX_PER_IN, withHash } from "../editorUtils";
import { inlineStyles } from "./inlineStyles";

export function TextInlineEditor({
  element,
  index,
  scale,
  onChange,
  onClose,
}: {
  element: TextSlideElement;
  index: number;
  scale: number;
  onChange: (index: number, element: TextSlideElement) => void;
  onClose: () => void;
}) {
  return (
    <textarea
      autoFocus
      value={element.text}
      onChange={(event) =>
        onChange(index, { ...element, text: event.target.value || " " })
      }
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.currentTarget.blur();
      }}
      style={{
        ...inlineStyles.textEditor,
        left: element.x * scale,
        top: element.y * scale,
        width: element.w * scale,
        height: element.h * scale,
        color: withHash(element.color),
        fontFamily: `${element.fontFace ?? "Arial"}, Helvetica, sans-serif`,
        fontSize: element.fontSize * PT_TO_PX * (scale / PX_PER_IN),
        fontWeight: element.bold ? 700 : 400,
        fontStyle: element.italic ? "italic" : "normal",
        textAlign: element.align ?? "left",
        lineHeight: element.lineHeight ?? 1.15,
        letterSpacing: ((element.charSpacing ?? 0) / 100) * PT_TO_PX * (scale / PX_PER_IN),
      }}
    />
  );
}
