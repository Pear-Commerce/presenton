import type { SlideElement } from "../lib/slide-schema";
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
}: KindInspectorProps<Extract<SlideElement, { kind: "text" }>>) {
  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextareaField
          label="Text"
          rows={4}
          value={element.text}
          onChange={(text) => text.trim() && onPatch({ text })}
        />
        <div style={styles.grid2}>
          <TextField
            label="Font"
            value={element.fontFace ?? "Arial"}
            onChange={(fontFace) => onPatch({ fontFace })}
          />
          <NumberField
            label="Size"
            min={6}
            max={360}
            step={1}
            value={element.fontSize}
            onChange={(fontSize) => onPatch({ fontSize })}
          />
        </div>
        <ColorField
          label="Color"
          value={element.color}
          onChange={(color) => onPatch({ color })}
        />
        <div style={styles.grid2}>
          <SelectField
            label="Align"
            value={element.align ?? "left"}
            options={[
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]}
            onChange={(align) => onPatch({ align })}
          />
          <SelectField
            label="Vertical"
            value={element.valign ?? "top"}
            options={[
              { label: "Top", value: "top" },
              { label: "Middle", value: "middle" },
              { label: "Bottom", value: "bottom" },
            ]}
            onChange={(valign) => onPatch({ valign })}
          />
        </div>
        <div style={styles.grid2}>
          <NumberField
            label="Line height"
            min={0.8}
            max={2.2}
            step={0.05}
            value={element.lineHeight ?? 1.15}
            onChange={(lineHeight) => onPatch({ lineHeight })}
          />
          <NumberField
            label="Tracking"
            min={-200}
            max={600}
            step={10}
            value={element.charSpacing ?? 0}
            onChange={(charSpacing) => onPatch({ charSpacing })}
          />
        </div>
        <CheckboxField
          label="Bold"
          checked={element.bold ?? false}
          onChange={(bold) => onPatch({ bold })}
        />
        <CheckboxField
          label="Italic"
          checked={element.italic ?? false}
          onChange={(italic) => onPatch({ italic })}
        />
      </form>
    </>
  );
}

export function BulletsInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { kind: "bullets" }>>) {
  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextareaField
          label="Items"
          rows={5}
          value={element.items.join("\n")}
          onChange={(value) => {
            const items = value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
              .slice(0, 8);
            if (items.length > 0) onPatch({ items } as Partial<SlideElement>);
          }}
        />
        <div style={styles.grid2}>
          <TextField
            label="Font"
            value={element.fontFace ?? "Arial"}
            onChange={(fontFace) =>
              onPatch({ fontFace } as Partial<SlideElement>)
            }
          />
          <NumberField
            label="Size"
            min={8}
            max={36}
            step={1}
            value={element.fontSize}
            onChange={(fontSize) =>
              onPatch({ fontSize } as Partial<SlideElement>)
            }
          />
        </div>
        <div style={styles.grid2}>
          <ColorField
            label="Text"
            value={element.color}
            onChange={(color) => onPatch({ color } as Partial<SlideElement>)}
          />
          <ColorField
            label="Bullet"
            value={element.bulletColor ?? element.color}
            onChange={(bulletColor) =>
              onPatch({ bulletColor } as Partial<SlideElement>)
            }
          />
        </div>
        <div style={styles.grid2}>
          <NumberField
            label="Line spacing"
            min={0.9}
            max={2}
            step={0.05}
            value={element.lineSpacingMultiple ?? 1.25}
            onChange={(lineSpacingMultiple) =>
              onPatch({ lineSpacingMultiple } as Partial<SlideElement>)
            }
          />
          <NumberField
            label="Item gap"
            min={0}
            max={0.4}
            step={0.01}
            value={element.itemGap ?? 0.08}
            onChange={(itemGap) =>
              onPatch({ itemGap } as Partial<SlideElement>)
            }
          />
        </div>
      </form>
    </>
  );
}

export function ShapeInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { kind: "rect" | "ellipse" }>>) {
  const line = element.line ?? { color: "0B1F3A", width: 0 };

  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <ColorField
          label="Fill"
          value={element.fill}
          onChange={(fill) => onPatch({ fill } as Partial<SlideElement>)}
        />
        <div style={styles.grid2}>
          <ColorField
            label="Stroke"
            value={line.color}
            onChange={(color) =>
              onPatch({
                line: { color, width: Math.max(0.5, line.width || 1) },
              } as Partial<SlideElement>)
            }
          />
          <NumberField
            label="Stroke width"
            min={0}
            max={8}
            step={0.25}
            value={line.width}
            onChange={(width) =>
              onPatch({
                line: width > 0 ? { color: line.color, width } : undefined,
              } as Partial<SlideElement>)
            }
          />
        </div>
        {element.kind === "rect" ? (
          <NumberField
            label="Corner radius"
            min={0}
            max={0.5}
            step={0.01}
            value={element.rx ?? 0}
            onChange={(rx) => onPatch({ rx } as Partial<SlideElement>)}
          />
        ) : null}
      </form>
    </>
  );
}

export function ImageInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { kind: "image" }>>) {
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
}: KindInspectorProps<Extract<SlideElement, { kind: "table" }>>) {
  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <TextareaField
          label="Rows"
          rows={6}
          value={element.rows.map((row) => row.join(", ")).join("\n")}
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
            if (rows.length >= 2) onPatch({ rows } as Partial<SlideElement>);
          }}
        />
        <div style={styles.grid2}>
          <TextField
            label="Font"
            value={element.fontFace ?? "Arial"}
            onChange={(fontFace) =>
              onPatch({ fontFace } as Partial<SlideElement>)
            }
          />
          <NumberField
            label="Size"
            min={6}
            max={28}
            step={1}
            value={element.fontSize}
            onChange={(fontSize) =>
              onPatch({ fontSize } as Partial<SlideElement>)
            }
          />
        </div>
        <div style={styles.grid2}>
          <ColorField
            label="Text"
            value={element.textColor}
            onChange={(textColor) =>
              onPatch({ textColor } as Partial<SlideElement>)
            }
          />
          <ColorField
            label="Fill"
            value={element.fill ?? "FFFFFF"}
            onChange={(fill) => onPatch({ fill } as Partial<SlideElement>)}
          />
        </div>
        <div style={styles.grid2}>
          <ColorField
            label="Header fill"
            value={element.headerFill}
            onChange={(headerFill) =>
              onPatch({ headerFill } as Partial<SlideElement>)
            }
          />
          <ColorField
            label="Header text"
            value={element.headerTextColor}
            onChange={(headerTextColor) =>
              onPatch({ headerTextColor } as Partial<SlideElement>)
            }
          />
        </div>
        <ColorField
          label="Border"
          value={element.borderColor}
          onChange={(borderColor) =>
            onPatch({ borderColor } as Partial<SlideElement>)
          }
        />
      </form>
    </>
  );
}

export function SvgInspector({
  element,
  onPatch,
}: KindInspectorProps<Extract<SlideElement, { kind: "svg" }>>) {
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
