import type { TableSlideElement } from "../state";
import { PT_TO_PX, PX_PER_IN, withHash } from "../editorUtils";
import { inlineStyles } from "./inlineStyles";

export function TableInlineEditor({
  element,
  index,
  scale,
  draft,
  onDraftChange,
  onChange,
  onClose,
}: {
  element: TableSlideElement;
  index: number;
  scale: number;
  draft: string;
  onDraftChange: (draft: string) => void;
  onChange: (index: number, element: TableSlideElement) => void;
  onClose: () => void;
}) {
  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value;
        onDraftChange(nextDraft);
        const rows = tableRowsFromDraft(nextDraft);
        if (rows.length >= 2) onChange(index, { ...element, rows });
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
        color: withHash(element.textColor),
        fontFamily: `${element.fontFace ?? "Arial"}, Helvetica, sans-serif`,
        fontSize: element.fontSize * PT_TO_PX * (scale / PX_PER_IN),
        lineHeight: 1.35,
      }}
    />
  );
}

export function tableDraftFromElement(element: TableSlideElement) {
  return element.rows
    .map((row: any) => row.map(formatTableCell).join(", "))
    .join("\n");
}

export function tableRowsFromDraft(draft: string) {
  return draft
    .split(/\r?\n/)
    .map(parseTableRow)
    .filter((row) => row.some(Boolean))
    .map((row) => row.slice(0, 6))
    .slice(0, 8);
}

function formatTableCell(cell: string) {
  if (!/[",\n\r]/.test(cell)) return cell;
  return `"${cell.replace(/"/g, '""')}"`;
}

function parseTableRow(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}
