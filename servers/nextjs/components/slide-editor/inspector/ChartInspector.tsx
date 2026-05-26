import type { ChartElement, SlideElement } from "../lib/slide-schema";
import { styles } from "../editorStyles";
import { withoutHash } from "../editorUtils";
import { GeometryInspector } from "./GeometryInspector";
import {
  CheckboxField,
  ColorField,
  SelectField,
  TextField,
  TextareaField,
} from "./InspectorFields";

export function ChartInspector({
  element,
  onPatch,
  onReplace,
}: {
  element: ChartElement;
  onPatch: (patch: Partial<SlideElement>) => void;
  onReplace: (next: ChartElement) => void;
}) {
  return (
    <>
      <GeometryInspector element={element} onPatch={onPatch} />
      <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
        <div style={styles.grid2}>
          <SelectField
            label="Chart type"
            value={element.chartType}
            options={[
              { label: "Bar", value: "bar" },
              { label: "Line", value: "line" },
              { label: "Donut", value: "donut" },
            ]}
            onChange={(chartType) => onPatch({ chartType })}
          />
          <ColorField
            label="Color"
            value={element.color}
            onChange={(color) => onPatch({ color })}
          />
        </div>
        <TextField
          label="Title"
          value={element.title ?? ""}
          onChange={(title) => onPatch({ title })}
        />
        <TextareaField
          label="Data"
          value={element.data
            .map(
              (datum) =>
                `${datum.label}, ${datum.value}${datum.color ? `, ${datum.color}` : ""}`,
            )
            .join("\n")}
          rows={5}
          onChange={(value) => {
            const data = value
              .split("\n")
              .map((line) => {
                const [label, value, color] = line
                  .split(",")
                  .map((part) => part.trim());
                return {
                  label,
                  value: Number(value) || 0,
                  color: color ? withoutHash(color) : undefined,
                };
              })
              .filter((datum) => datum.label)
              .slice(0, 8);
            if (data.length > 0) onReplace({ ...element, data });
          }}
        />
        <CheckboxField
          label="Show values"
          checked={element.showValues ?? false}
          onChange={(showValues) => onPatch({ showValues })}
        />
      </form>
    </>
  );
}
