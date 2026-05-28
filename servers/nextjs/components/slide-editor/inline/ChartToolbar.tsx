import type { ChartSlideElement } from "../state";
import { withHash, withoutHash } from "../editorUtils";
import { InlineToolbar } from "./InlineToolbar";
import { inlineStyles } from "./inlineStyles";

export function ChartToolbar({
  element,
  index,
  scale,
  onChange,
}: {
  element: ChartSlideElement;
  index: number;
  scale: number;
  onChange: (index: number, element: ChartSlideElement) => void;
}) {
  const canAddDatum = element.data.length < 8;
  const canRemoveDatum = element.data.length > 1;

  const addDatum = () => {
    if (!canAddDatum) return;

    const nextIndex = element.data.length + 1;
    onChange(index, {
      ...element,
      data: [
        ...element.data,
        {
          label: `Item ${nextIndex}`,
          value: Math.max(1, Math.round(averageValue(element.data))),
          color: element.color,
        },
      ],
    });
  };

  const removeDatum = () => {
    if (!canRemoveDatum) return;
    onChange(index, { ...element, data: element.data.slice(0, -1) });
  };

  return (
    <InlineToolbar element={element} scale={scale}>
      <select
        aria-label="Chart type"
        title="Chart type"
        value={element.chartType}
        onChange={(event) =>
          onChange(index, {
            ...element,
            chartType: event.target.value as ChartSlideElement["chartType"],
          })
        }
        style={inlineStyles.select}
      >
        <option value="bar">Bar</option>
        <option value="line">Line</option>
        <option value="donut">Donut</option>
      </select>
      <button
        type="button"
        title="Show values"
        aria-pressed={element.showValues ?? false}
        onClick={() =>
          onChange(index, {
            ...element,
            showValues: !(element.showValues ?? false),
          })
        }
        style={{
          ...inlineStyles.iconButton,
          width: 42,
          ...(element.showValues ? inlineStyles.iconButtonActive : {}),
        }}
      >
        123
      </button>
      <input
        aria-label="Chart color"
        title="Series color"
        type="color"
        value={withHash(element.color ?? "D4A24C")}
        onChange={(event) =>
          onChange(index, {
            ...element,
            color: withoutHash(event.target.value),
          })
        }
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Chart axis color"
        title="Axis color"
        type="color"
        value={withHash(element.axisColor ?? "9AA7BD")}
        onChange={(event) =>
          onChange(index, {
            ...element,
            axisColor: withoutHash(event.target.value),
          })
        }
        style={inlineStyles.colorInput}
      />
      <input
        aria-label="Chart label color"
        title="Label color"
        type="color"
        value={withHash(element.labelColor ?? "6A7894")}
        onChange={(event) =>
          onChange(index, {
            ...element,
            labelColor: withoutHash(event.target.value),
          })
        }
        style={inlineStyles.colorInput}
      />
      <button
        type="button"
        title="Add data point"
        disabled={!canAddDatum}
        onClick={addDatum}
        style={{
          ...inlineStyles.actionButton,
          opacity: canAddDatum ? 1 : 0.45,
          cursor: canAddDatum ? "pointer" : "not-allowed",
        }}
      >
        Data +
      </button>
      <button
        type="button"
        title="Remove last data point"
        disabled={!canRemoveDatum}
        onClick={removeDatum}
        style={{
          ...inlineStyles.actionButton,
          opacity: canRemoveDatum ? 1 : 0.45,
          cursor: canRemoveDatum ? "pointer" : "not-allowed",
        }}
      >
        Data -
      </button>
      <input
        aria-label="Chart opacity"
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

function averageValue(data: ChartSlideElement["data"]) {
  const total = data.reduce((sum: any, datum: any) => sum + datum.value, 0);
  return total / Math.max(1, data.length);
}
