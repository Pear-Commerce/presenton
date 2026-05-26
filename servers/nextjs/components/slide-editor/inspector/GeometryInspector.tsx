import type { SlideElement } from "../lib/slide-schema";
import { styles } from "../editorStyles";
import { NumberField } from "./InspectorFields";

type GeometryPatch = Pick<SlideElement, "x" | "y" | "w" | "h"> &
  Partial<
    Pick<Extract<SlideElement, { opacity?: unknown }>, "opacity" | "rotation">
  >;

type GeometryInspectorProps = {
  element: SlideElement;
  onPatch: (patch: Partial<GeometryPatch>) => void;
};

export function GeometryInspector({
  element,
  onPatch,
}: GeometryInspectorProps) {
  const hasOpacity = "opacity" in element;

  return (
    <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
      <div style={styles.grid2}>
        <NumberField
          label="X"
          value={element.x}
          onChange={(x) => onPatch({ x })}
        />
        <NumberField
          label="Y"
          value={element.y}
          onChange={(y) => onPatch({ y })}
        />
        <NumberField
          label="W"
          value={element.w}
          onChange={(w) => onPatch({ w })}
        />
        <NumberField
          label="H"
          value={element.h}
          onChange={(h) => onPatch({ h })}
        />
      </div>

      {hasOpacity ? (
        <div style={styles.grid2}>
          <NumberField
            label="Opacity"
            value={element.opacity ?? 1}
            min={0}
            max={1}
            step={0.05}
            onChange={(opacity) => onPatch({ opacity })}
          />
          <NumberField
            label="Rotation"
            value={element.rotation ?? 0}
            min={-360}
            max={360}
            step={1}
            onChange={(rotation) => onPatch({ rotation })}
          />
        </div>
      ) : null}
    </form>
  );
}
