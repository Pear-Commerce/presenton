import type { TableCellSelection, TableSlideElement } from "../state";
import { withHash, withoutHash } from "../editorUtils";
import {
  elementFont,
  mergeFont,
  setTableRowsFromStrings,
  tableRowsAsStrings,
} from "../lib/element-model";
import type { TableCell } from "../lib/slide-schema";
import { InlineToolbar } from "./InlineToolbar";
import { inlineStyles } from "./inlineStyles";

export function TableToolbar({
  element,
  index,
  scale,
  selectedCell,
  onChange,
}: {
  element: TableSlideElement;
  index: number;
  scale: number;
  selectedCell: TableCellSelection | null;
  onChange: (index: number, element: TableSlideElement) => void;
}) {
  const font = elementFont(element);
  const rows = tableRowsAsStrings(element);
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  const canAddRow = rows.length < 8;
  const canAddColumn = columnCount < 6;
  const activeRow = selectedCell?.rowIndex ?? rows.length - 1;
  const activeColumn = selectedCell?.colIndex ?? columnCount - 1;
  const normalizeRows = (rows: string[][]) =>
    rows.map((row) =>
      Array.from({ length: columnCount }, (_, colIndex) => row[colIndex] ?? ""),
    );
  const insertRow = (position: "above" | "below") => {
    const nextRows = normalizeRows(rows);
    const insertIndex =
      position === "above" ? Math.max(1, activeRow) : activeRow + 1;
    nextRows.splice(
      insertIndex,
      0,
      Array.from({ length: columnCount }, () => ""),
    );
    onChange(index, setTableRowsFromStrings(element, nextRows.slice(0, 8)));
  };
  const insertColumn = (position: "left" | "right") => {
    const insertIndex = position === "left" ? activeColumn : activeColumn + 1;
    const nextRows = rows.map((row) => {
      const next = [...row];
      next.splice(insertIndex, 0, "");
      return next.slice(0, 6);
    });
    onChange(index, setTableRowsFromStrings(element, nextRows));
  };
  const updateColumns = (cell: (cell: TableCell) => TableCell) =>
    onChange(index, {
      ...element,
      columns: element.columns.map((column) => cell(column)),
    });
  const updateBodyCells = (cell: (cell: TableCell) => TableCell) =>
    onChange(index, {
      ...element,
      rows: element.rows.map((row) => row.map((item) => cell(item))),
    });
  const updateAllCells = (cell: (cell: TableCell) => TableCell) =>
    onChange(index, {
      ...element,
      columns: element.columns.map((column) => cell(column)),
      rows: element.rows.map((row) => row.map((item) => cell(item))),
    });
  const headerFill = element.columns[0]?.fill?.color ?? "0B1F3A";
  const headerTextColor = element.columns[0]?.font?.color ?? "FFFFFF";
  const bodyFill = element.rows[0]?.[0]?.fill?.color ?? "FFFFFF";
  const borderColor =
    element.columns[0]?.stroke?.color ??
    element.rows[0]?.[0]?.stroke?.color ??
    "D9E2EF";

  return (
    <InlineToolbar element={element} scale={scale}>
      {selectedCell ? (
        <>
          <button
            type="button"
            title="Insert row above selected row"
            disabled={!canAddRow}
            onClick={() => insertRow("above")}
            style={{
              ...inlineStyles.actionButton,
              opacity: canAddRow ? 1 : 0.45,
              cursor: canAddRow ? "pointer" : "not-allowed",
            }}
          >
            Row ↑
          </button>
          <button
            type="button"
            title="Insert row below selected row"
            disabled={!canAddRow}
            onClick={() => insertRow("below")}
            style={{
              ...inlineStyles.actionButton,
              opacity: canAddRow ? 1 : 0.45,
              cursor: canAddRow ? "pointer" : "not-allowed",
            }}
          >
            Row ↓
          </button>
          <button
            type="button"
            title="Insert column left of selected column"
            disabled={!canAddColumn}
            onClick={() => insertColumn("left")}
            style={{
              ...inlineStyles.actionButton,
              opacity: canAddColumn ? 1 : 0.45,
              cursor: canAddColumn ? "pointer" : "not-allowed",
            }}
          >
            Col ←
          </button>
          <button
            type="button"
            title="Insert column right of selected column"
            disabled={!canAddColumn}
            onClick={() => insertColumn("right")}
            style={{
              ...inlineStyles.actionButton,
              opacity: canAddColumn ? 1 : 0.45,
              cursor: canAddColumn ? "pointer" : "not-allowed",
            }}
          >
            Col →
          </button>
        </>
      ) : null}
      <input
        aria-label="Table font size"
        title="Font size"
        type="number"
        min={6}
        max={28}
        value={font.size}
        onChange={(event) =>
          onChange(
            index,
            mergeFont(element, {
              size: Number(event.target.value) || font.size,
            }),
          )
        }
        style={inlineStyles.numberInput}
      />
      <input
        aria-label="Table text color"
        title="Text"
        type="color"
        value={withHash(font.color)}
        onChange={(event) =>
          onChange(
            index,
            mergeFont(element, { color: withoutHash(event.target.value) }),
          )
        }
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Table header fill"
        title="Header fill"
        type="color"
        value={withHash(headerFill)}
        onChange={(event) => {
          const color = withoutHash(event.target.value);
          updateColumns((cell) => ({
            ...cell,
            fill: { ...(cell.fill ?? {}), color },
          }));
        }}
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Table header text"
        title="Header text"
        type="color"
        value={withHash(headerTextColor)}
        onChange={(event) => {
          const color = withoutHash(event.target.value);
          updateColumns((cell) => ({
            ...cell,
            font: { ...(cell.font ?? {}), color, bold: true },
          }));
        }}
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Table fill"
        title="Fill"
        type="color"
        value={withHash(bodyFill)}
        onChange={(event) => {
          const color = withoutHash(event.target.value);
          updateBodyCells((cell) => ({
            ...cell,
            fill: { ...(cell.fill ?? {}), color },
          }));
        }}
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Table border"
        title="Border"
        type="color"
        value={withHash(borderColor)}
        onChange={(event) => {
          const color = withoutHash(event.target.value);
          updateAllCells((cell) => ({
            ...cell,
            stroke: {
              ...(cell.stroke ?? {}),
              color,
              width: cell.stroke?.width ?? 1,
            },
          }));
        }}
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Table opacity"
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
    </InlineToolbar>
  );
}
