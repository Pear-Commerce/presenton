import type { ChartDatum } from "../lib/slide-schema";
import type { ChartSlideElement } from "../state";
import { inlineStyles } from "./inlineStyles";

export function ChartInlineEditor({
  element,
  index,
  scale,
  draft,
  onDraftChange,
  onChange,
  onClose,
}: {
  element: ChartSlideElement;
  index: number;
  scale: number;
  draft: string;
  onDraftChange: (draft: string) => void;
  onChange: (index: number, element: ChartSlideElement) => void;
  onClose: () => void;
}) {
  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value;
        onDraftChange(nextDraft);
        onChange(index, parseChartDraft(element, nextDraft));
      }}
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.currentTarget.blur();
      }}
      spellCheck={false}
      style={{
        ...inlineStyles.textEditor,
        left: element.x * scale,
        top: element.y * scale,
        width: element.w * scale,
        height: element.h * scale,
        color: "#1a2b45",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 12 * (scale / 96),
        lineHeight: 1.35,
        padding: 8 * (scale / 96),
        background: "rgba(255,255,255,0.96)",
      }}
    />
  );
}

export function chartDraftFromElement(element: ChartSlideElement) {
  return [
    `Title: ${element.title ?? ""}`,
    ...element.data.map((datum: any) =>
      [datum.label, String(datum.value), datum.color ?? ""]
        .filter(Boolean)
        .join(", "),
    ),
  ].join("\n");
}

function parseChartDraft(
  element: ChartSlideElement,
  draft: string,
): ChartSlideElement {
  const [titleLine = "", ...dataLines] = draft.split("\n");
  const title = titleLine.replace(/^title\s*:\s*/i, "").trim();
  const data = dataLines
    .map(parseDatum)
    .filter((datum): datum is ChartDatum => datum != null)
    .slice(0, 8);

  return {
    ...element,
    title: title || undefined,
    data: data.length > 0 ? data : element.data,
  };
}

function parseDatum(line: string): ChartDatum | null {
  const [rawLabel, rawValue, rawColor] = line
    .split(",")
    .map((part) => part.trim());
  if (!rawLabel) return null;

  const value = Number(rawValue);
  if (!Number.isFinite(value)) return null;

  const color =
    rawColor && /^#?[0-9a-f]{6}$/i.test(rawColor)
      ? rawColor.replace(/^#/, "")
      : undefined;

  return {
    label: rawLabel.slice(0, 40),
    value: Math.max(0, Math.min(1_000_000, value)),
    color,
  };
}
