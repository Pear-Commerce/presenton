import type { SlideElement } from "../lib/slide-schema";
import { elementBox } from "../lib/element-model";
import { styles } from "../editorStyles";
import { NumberField } from "./InspectorFields";

type GeometryInspectorProps = {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement>) => void;
};

export function GeometryInspector({
  element,
  onPatch,
}: GeometryInspectorProps) {
  const hasOpacity = "opacity" in element;
  const box = elementBox(element);

  return (
    <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
      <div style={styles.grid2}>
        <NumberField
          label="X"
          value={box.x}
          onChange={(x) =>
            onPatch({ position: { ...(element.position ?? { y: box.y }), x } })
          }
        />
        <NumberField
          label="Y"
          value={box.y}
          onChange={(y) =>
            onPatch({ position: { ...(element.position ?? { x: box.x }), y } })
          }
        />
        <NumberField
          label="W"
          value={box.w}
          onChange={(width) =>
            onPatch({ size: { ...(element.size ?? { height: box.h }), width } })
          }
        />
        <NumberField
          label="H"
          value={box.h}
          onChange={(height) =>
            onPatch({ size: { ...(element.size ?? { width: box.w }), height } })
          }
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
