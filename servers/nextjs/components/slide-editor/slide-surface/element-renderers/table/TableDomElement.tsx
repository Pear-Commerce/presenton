import type { CSSProperties } from "react";
import type { Slide } from "../../../lib/slide-schema";
import { PT_TO_PX, PX_PER_IN, withHash } from "../../../editorUtils";
import { elementFont } from "../../../lib/element-model";
import type { TableCellSelection } from "../../../state";
import { DomElementLayer, elementBoxStyle } from "../shared";

export function TableDomElement({
  editingTableIndex,
  scale,
  selectedCell,
  slide,
}: {
  editingTableIndex?: number | null;
  scale: number;
  selectedCell?: TableCellSelection | null;
  slide: Slide;
}) {
  return (
    <DomElementLayer>
      {slide.elements.map((element, elementIndex) => {
        if (element.type !== "table" || editingTableIndex === elementIndex) {
          return null;
        }

        const rows = [element.columns, ...element.rows];
        const cols = Math.max(1, ...rows.map((row) => row.length));
        const font = elementFont(element);
        const borderColor = withHash(
          element.columns[0]?.stroke?.color ??
            element.rows[0]?.[0]?.stroke?.color ??
            "D9E2EF",
        );

        return (
          <table
            key={elementIndex}
            style={{
              ...elementBoxStyle(element, scale),
              ...tableStyle,
              borderColor,
              color: withHash(font.color),
              fontFamily: `${font.family}, Helvetica, sans-serif`,
              fontSize: font.size * PT_TO_PX * (scale / PX_PER_IN),
            }}
          >
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: cols }).map((_, colIndex) => {
                    const isHeader = rowIndex === 0;
                    const isSelected =
                      selectedCell?.elementIndex === elementIndex &&
                      selectedCell.rowIndex === rowIndex &&
                      selectedCell.colIndex === colIndex;
                    const cell = row[colIndex] ?? {};
                    const cellFont = cell.font ?? {};
                    const cellBorderColor = withHash(
                      cell.stroke?.color ?? borderColor,
                    );
                    return (
                      <td
                        key={colIndex}
                        style={{
                          ...cellStyle,
                          width: `${100 / cols}%`,
                          height: `${100 / rows.length}%`,
                          borderColor: cellBorderColor,
                          background: withHash(
                            cell.fill?.color ??
                              (isHeader ? "0B1F3A" : "FFFFFF"),
                          ),
                          color: withHash(cellFont.color ?? font.color),
                          fontWeight:
                            (cellFont.bold ?? font.bold ?? isHeader) ? 700 : 400,
                          textAlign: colIndex === 0 ? "left" : "center",
                          boxShadow: isSelected
                            ? "inset 0 0 0 2px #6f93ff"
                            : undefined,
                        }}
                      >
                        {cell.text ?? ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </DomElementLayer>
  );
}

const tableStyle: CSSProperties = {
  tableLayout: "fixed",
  borderCollapse: "collapse",
  borderWidth: 1,
  borderStyle: "solid",
  overflow: "hidden",
};

const cellStyle: CSSProperties = {
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  padding: "0.05in 0.08in",
  lineHeight: 1.15,
  verticalAlign: "middle",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "normal",
  wordBreak: "break-word",
};
