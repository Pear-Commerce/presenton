import type Konva from "konva";
import type { MutableRefObject } from "react";
import type { Slide } from "../lib/slide-schema";
import { EXPORT_H, EXPORT_W } from "../editorUtils";
import { KonvaSlide } from "../slide-surface";
import { workspaceStyles } from "../workspace/workspaceStyles";

type HiddenExportStagesProps = {
  slides: Slide[];
  exportStageRefs: MutableRefObject<Array<Konva.Stage | null>>;
};

export function HiddenExportStages({
  slides,
  exportStageRefs,
}: HiddenExportStagesProps) {
  return (
    <div style={workspaceStyles.hiddenStages} aria-hidden="true">
      {slides.map((slide, index) => (
        <KonvaSlide
          key={index}
          slide={slide}
          width={EXPORT_W}
          height={EXPORT_H}
          interactive={false}
          stageRef={(node) => {
            exportStageRefs.current[index] = node;
          }}
        />
      ))}
    </div>
  );
}
