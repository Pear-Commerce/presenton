import type { SlideElement, TableCell } from "../lib/slide-schema";
import {
  averageBorderRadius,
  elementFont,
  mergeFont,
  setTableRowsFromStrings,
  setTextContent,
  setTextListStrings,
  tableRowsAsStrings,
  textContent,
  textListStrings,
  uniformBorderRadius,
} from "../lib/element-model";
import { sanitizeSvgMarkup } from "../lib/svg-sanitize";
import { styles } from "../editorStyles";
import { GeometryInspector } from "./GeometryInspector";
import {
  CheckboxField,
  ColorField,
  NumberField,
  SelectField,
  TextField,
  TextareaField,
} from "./InspectorFields";

type Patch = (patch: Partial<SlideElement>) => void;

type KindInspectorProps<T extends SlideElement> = {
  element: T;
  onPatch: Patch;
};

export function TextInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { type: "text" }>>) {
  const font = elementFont(element);

  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextareaField
          label="Text"
          rows={4}
          value={textContent(element)}
          onChange={(text) =>
            text.trim() &&
            onPatch({
              runs: setTextContent(element, text).runs,
            } as Partial<SlideElement>)
          }
        />
        <div style={styles.grid2}>
          <TextField
            label="Font"
            value={font.family}
            onChange={(family) =>
              onPatch({ font: mergeFont(element, { family }).font } as Partial<
                SlideElement
              >)
            }
          />
          <NumberField
            label="Size"
            min={6}
            max={360}
            step={1}
            value={font.size}
            onChange={(size) =>
              onPatch({ font: mergeFont(element, { size }).font } as Partial<
                SlideElement
              >)
            }
          />
        </div>
        <ColorField
          label="Color"
          value={font.color}
          onChange={(color) =>
            onPatch({ font: mergeFont(element, { color }).font } as Partial<
              SlideElement
            >)
          }
        />
        <div style={styles.grid2}>
          <SelectField
            label="Align"
            value={element.alignment?.horizontal ?? "left"}
            options={[
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]}
            onChange={(horizontal) =>
              onPatch({
                alignment: { ...(element.alignment ?? {}), horizontal },
              } as Partial<SlideElement>)
            }
          />
          <SelectField
            label="Vertical"
            value={element.alignment?.vertical ?? "top"}
            options={[
              { label: "Top", value: "top" },
              { label: "Middle", value: "middle" },
              { label: "Bottom", value: "bottom" },
            ]}
            onChange={(vertical) =>
              onPatch({
                alignment: { ...(element.alignment ?? {}), vertical },
              } as Partial<SlideElement>)
            }
          />
        </div>
        <div style={styles.grid2}>
          <NumberField
            label="Line height"
            min={0.8}
            max={2.2}
            step={0.05}
            value={font.lineHeight ?? 1.15}
            onChange={(lineHeight) =>
              onPatch({
                font: mergeFont(element, { lineHeight }).font,
              } as Partial<SlideElement>)
            }
          />
          <NumberField
            label="Tracking"
            min={-200}
            max={600}
            step={10}
            value={font.letterSpacing ?? 0}
            onChange={(letterSpacing) =>
              onPatch({
                font: mergeFont(element, { letterSpacing }).font,
              } as Partial<SlideElement>)
            }
          />
        </div>
        <CheckboxField
          label="Bold"
          checked={font.bold ?? false}
          onChange={(bold) =>
            onPatch({ font: mergeFont(element, { bold }).font } as Partial<
              SlideElement
            >)
          }
        />
        <CheckboxField
          label="Italic"
          checked={font.italic ?? false}
          onChange={(italic) =>
            onPatch({ font: mergeFont(element, { italic }).font } as Partial<
              SlideElement
            >)
          }
        />
      </form>
    </>
  );
}

export function BulletsInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { type: "text-list" }>>) {
  const font = elementFont(element);

  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextareaField
          label="Items"
          rows={5}
          value={textListStrings(element).join("\n")}
          onChange={(value) => {
            const items = value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
              .slice(0, 8);
            if (items.length > 0) {
              onPatch({
                items: setTextListStrings(element, items).items,
              } as Partial<SlideElement>);
            }
          }}
        />
        <div style={styles.grid2}>
          <TextField
            label="Font"
            value={font.family}
            onChange={(family) =>
              onPatch({ font: mergeFont(element, { family }).font } as Partial<
                SlideElement
              >)
            }
          />
          <NumberField
            label="Size"
            min={8}
            max={36}
            step={1}
            value={font.size}
            onChange={(size) =>
              onPatch({ font: mergeFont(element, { size }).font } as Partial<
                SlideElement
              >)
            }
          />
        </div>
        <div style={styles.grid2}>
          <ColorField
            label="Text"
            value={font.color}
            onChange={(color) =>
              onPatch({ font: mergeFont(element, { color }).font } as Partial<
                SlideElement
              >)
            }
          />
          <SelectField
            label="Marker"
            value={element.marker ?? "bullet"}
            options={[
              { label: "Bullet", value: "bullet" },
              { label: "Number", value: "number" },
              { label: "None", value: "none" },
            ]}
            onChange={(marker) =>
              onPatch({ marker } as Partial<SlideElement>)
            }
          />
        </div>
        <NumberField
          label="Line height"
          min={0.9}
          max={2}
          step={0.05}
          value={font.lineHeight ?? 1.25}
          onChange={(lineHeight) =>
            onPatch({
              font: mergeFont(element, { lineHeight }).font,
            } as Partial<SlideElement>)
          }
        />
      </form>
    </>
  );
}

export function ShapeInspector({
  element,
  onPatch,
}: KindInspectorProps<
  Extract<SlideElement, { type: "rectangle" | "ellipse" }>
>) {
  const fill = element.fill ?? { color: "FFFFFF" };
  const stroke = element.stroke ?? { color: "0B1F3A", width: 0 };

  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <ColorField
          label="Fill"
          value={fill.color}
          onChange={(color) =>
            onPatch({ fill: { ...fill, color } } as Partial<SlideElement>)
          }
        />
        <div style={styles.grid2}>
          <ColorField
            label="Stroke"
            value={stroke.color}
            onChange={(color) =>
              onPatch({
                stroke: {
                  ...stroke,
                  color,
                  width: Math.max(0.5, stroke.width || 1),
                },
              } as Partial<SlideElement>)
            }
          />
          <NumberField
            label="Stroke width"
            min={0}
            max={8}
            step={0.25}
            value={stroke.width}
            onChange={(width) =>
              onPatch({
                stroke: width > 0 ? { ...stroke, width } : undefined,
              } as Partial<SlideElement>)
            }
          />
        </div>
        {element.type === "rectangle" ? (
          <NumberField
            label="Corner radius"
            min={0}
            max={0.5}
            step={0.01}
            value={averageBorderRadius(element.borderRadius)}
            onChange={(radius) =>
              onPatch({
                borderRadius: uniformBorderRadius(radius),
              } as Partial<SlideElement>)
            }
          />
        ) : null}
      </form>
    </>
  );
}

export function ImageInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { type: "image" }>>) {
  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextField
          label="Name"
          value={element.name ?? ""}
          onChange={(name) => onPatch({ name } as Partial<SlideElement>)}
        />
        <SelectField
          label="Fit"
          value={element.fit ?? "contain"}
          options={[
            { label: "Contain", value: "contain" },
            { label: "Cover", value: "cover" },
            { label: "Fill", value: "fill" },
          ]}
          onChange={(fit) => onPatch({ fit } as Partial<SlideElement>)}
        />
      </form>
    </>
  );
}

export function TableInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { type: "table" }>>) {
  const font = elementFont(element);
  const headerFill = element.columns[0]?.fill?.color ?? "0B1F3A";
  const headerTextColor = element.columns[0]?.font?.color ?? "FFFFFF";
  const bodyFill = element.rows[0]?.[0]?.fill?.color ?? "FFFFFF";
  const borderColor =
    element.columns[0]?.stroke?.color ??
    element.rows[0]?.[0]?.stroke?.color ??
    "D9E2EF";
  const updateColumns = (cell: (cell: TableCell) => TableCell) =>
    onPatch({
      columns: element.columns.map((column) => cell(column)),
    } as Partial<SlideElement>);
  const updateBodyCells = (cell: (cell: TableCell) => TableCell) =>
    onPatch({
      rows: element.rows.map((row) => row.map((item) => cell(item))),
    } as Partial<SlideElement>);
  const updateAllCells = (cell: (cell: TableCell) => TableCell) =>
    onPatch({
      columns: element.columns.map((column) => cell(column)),
      rows: element.rows.map((row) => row.map((item) => cell(item))),
    } as Partial<SlideElement>);

  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextareaField
          label="Rows"
          rows={6}
          value={tableRowsAsStrings(element)
            .map((row) => row.join(", "))
            .join("\n")}
          onChange={(value) => {
            const rows = value
              .split("\n")
              .map((row) =>
                row
                  .split(",")
                  .map((cell) => cell.trim())
                  .slice(0, 6),
              )
              .filter((row) => row.some(Boolean))
              .slice(0, 8);
            if (rows.length >= 2) {
              const next = setTableRowsFromStrings(element, rows);
              onPatch({
                columns: next.columns,
                rows: next.rows,
              } as Partial<SlideElement>);
            }
          }}
        />
        <div style={styles.grid2}>
          <TextField
            label="Font"
            value={font.family}
            onChange={(family) =>
              onPatch({ font: mergeFont(element, { family }).font } as Partial<
                SlideElement
              >)
            }
          />
          <NumberField
            label="Size"
            min={6}
            max={28}
            step={1}
            value={font.size}
            onChange={(size) =>
              onPatch({ font: mergeFont(element, { size }).font } as Partial<
                SlideElement
              >)
            }
          />
        </div>
        <div style={styles.grid2}>
          <ColorField
            label="Text"
            value={font.color}
            onChange={(color) =>
              onPatch({ font: mergeFont(element, { color }).font } as Partial<
                SlideElement
              >)
            }
          />
          <ColorField
            label="Fill"
            value={bodyFill}
            onChange={(color) =>
              updateBodyCells((cell) => ({
                ...cell,
                fill: { ...(cell.fill ?? {}), color },
              }))
            }
          />
        </div>
        <div style={styles.grid2}>
          <ColorField
            label="Header fill"
            value={headerFill}
            onChange={(color) =>
              updateColumns((cell) => ({
                ...cell,
                fill: { ...(cell.fill ?? {}), color },
              }))
            }
          />
          <ColorField
            label="Header text"
            value={headerTextColor}
            onChange={(color) =>
              updateColumns((cell) => ({
                ...cell,
                font: { ...(cell.font ?? {}), color, bold: true },
              }))
            }
          />
        </div>
        <ColorField
          label="Border"
          value={borderColor}
          onChange={(color) =>
            updateAllCells((cell) => ({
              ...cell,
              stroke: {
                ...(cell.stroke ?? {}),
                color,
                width: cell.stroke?.width ?? 1,
              },
            }))
          }
        />
      </form>
    </>
  );
}

export function SvgInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { type: "svg" }>>) {
  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextField
          label="Name"
          value={element.name ?? ""}
          onChange={(name) => onPatch({ name } as Partial<SlideElement>)}
        />
        <TextareaField
          label="SVG markup"
          rows={8}
          value={element.svg}
          onChange={(svg) => {
            if (svg.trim()) {
              onPatch({ svg: sanitizeSvgMarkup(svg) } as Partial<SlideElement>);
            }
          }}
        />
      </form>
    </>
  );
}
