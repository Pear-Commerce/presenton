import { elementBox } from "../lib/element-model";
import { sanitizeSvgMarkup } from "../lib/svg-sanitize";
import type { SvgSlideElement } from "../state";
import { inlineStyles } from "./inlineStyles";

export function SvgInlineEditor({
  element,
  index,
  scale,
  draft,
  onDraftChange,
  onChange,
  onClose,
}: {
  element: SvgSlideElement;
  index: number;
  scale: number;
  draft: string;
  onDraftChange: (draft: string) => void;
  onChange: (index: number, element: SvgSlideElement) => void;
  onClose: () => void;
}) {
  const box = elementBox(element);

  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value;
        onDraftChange(nextDraft);
        const nextElement = parseSvgDraft(element, nextDraft);
        if (nextElement) onChange(index, nextElement);
      }}
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.currentTarget.blur();
      }}
      spellCheck={false}
      style={{
        ...inlineStyles.textEditor,
        left: box.x * scale,
        top: box.y * scale,
        width: box.w * scale,
        height: box.h * scale,
        color: "#e7edf8",
        fontFamily: "Menlo, Consolas, monospace",
        fontSize: 10 * (scale / 96),
        lineHeight: 1.35,
        padding: 8 * (scale / 96),
        background: "rgba(7,20,37,0.96)",
      }}
    />
  );
}

export function svgDraftFromElement(element: SvgSlideElement) {
  return [`Name: ${element.name ?? ""}`, element.svg].join("\n");
}

function parseSvgDraft(
  element: SvgSlideElement,
  draft: string,
): SvgSlideElement | null {
  const lines = draft.split("\n");
  const firstLine = lines[0] ?? "";
  const hasNameLine = /^name\s*:/i.test(firstLine);
  const name = hasNameLine
    ? firstLine.replace(/^name\s*:\s*/i, "").trim()
    : element.name;
  const svg = (hasNameLine ? lines.slice(1) : lines).join("\n").trim();

  if (!svg) return { ...element, name: name || undefined };

  try {
    return {
      ...element,
      name: name || undefined,
      svg: sanitizeSvgMarkup(svg),
    };
  } catch {
    return null;
  }
}
