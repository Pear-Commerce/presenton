import type { BulletsSlideElement } from "../state";
import { PT_TO_PX, PX_PER_IN, withHash } from "../editorUtils";
import { inlineStyles } from "./inlineStyles";

export function BulletsInlineEditor({
  element,
  index,
  scale,
  draft,
  onDraftChange,
  onChange,
  onClose,
}: {
  element: BulletsSlideElement;
  index: number;
  scale: number;
  draft: string;
  onDraftChange: (draft: string) => void;
  onChange: (index: number, element: BulletsSlideElement) => void;
  onClose: () => void;
}) {
  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value;
        onDraftChange(nextDraft);
        const items = nextDraft
          .split("\n")
          .map((item) => item.replace(/^\s*[•*-]\s?/, "").trimEnd())
          .filter((item) => item.trim())
          .slice(0, 8);
        onChange(index, {
          ...element,
          items: items.length > 0 ? items : [" "],
        });
      }}
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
        lineHeight: element.lineSpacingMultiple ?? 1.3,
      }}
    />
  );
}
