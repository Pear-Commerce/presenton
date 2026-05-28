import type { TextSlideElement } from "../state";
import { PT_TO_PX, PX_PER_IN, withHash } from "../editorUtils";
import {
  elementBox,
  elementFont,
  setTextContent,
  textContent,
} from "../lib/element-model";
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
  const box = elementBox(element);
  const font = elementFont(element);
  return (
    <textarea
      autoFocus
      value={textContent(element)}
      onChange={(event) =>
        onChange(index, setTextContent(element, event.target.value || " "))
      }
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.currentTarget.blur();
      }}
      style={{
        ...inlineStyles.textEditor,
        left: box.x * scale,
        top: box.y * scale,
        width: box.w * scale,
        height: box.h * scale,
        color: withHash(font.color),
        fontFamily: `${font.family}, Helvetica, sans-serif`,
        fontSize: font.size * PT_TO_PX * (scale / PX_PER_IN),
        fontWeight: font.bold ? 700 : 400,
        fontStyle: font.italic ? "italic" : "normal",
        textAlign: element.alignment?.horizontal ?? "left",
        lineHeight: font.lineHeight ?? 1.15,
        letterSpacing:
          ((font.letterSpacing ?? 0) / 100) * PT_TO_PX * (scale / PX_PER_IN),
      }}
    />
  );
}
