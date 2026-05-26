import type { ChangeEventHandler, RefObject } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { SLIDE_H, SLIDE_W } from "../lib/slide-schema";
import { SlideSurface } from "../slide-surface";
import {
  activeSlideAtom,
  editingBulletsIndexAtom,
  editingChartIndexAtom,
  editingSvgIndexAtom,
  editingTableIndexAtom,
  editingTextIndexAtom,
  editorOpenAtom,
  selectedTableCellAtom,
} from "../state";
import { WorkspaceInlineEditors } from "./WorkspaceInlineEditors";
import { WorkspaceToolbars } from "./WorkspaceToolbars";
import { workspaceStyles } from "./workspaceStyles";

type SlideWorkspaceProps = {
  stageWrapRef: RefObject<HTMLDivElement | null>;
  stageWidth: number;
  imageUploadInputRef: RefObject<HTMLInputElement | null>;
  onImageUploadChange: ChangeEventHandler<HTMLInputElement>;
  onEditImage: (index: number) => void;
  canInsertSlide?: boolean;
  onInsertSlide?: () => void;
};

export function SlideWorkspace({
  stageWrapRef,
  stageWidth,
  imageUploadInputRef,
  onImageUploadChange,
  onEditImage,
  canInsertSlide = false,
  onInsertSlide,
}: SlideWorkspaceProps) {
  const activeSlide = useAtomValue(activeSlideAtom);
  const selectedTableCell = useAtomValue(selectedTableCellAtom);
  const editingTextIndex = useAtomValue(editingTextIndexAtom);
  const editingBulletsIndex = useAtomValue(editingBulletsIndexAtom);
  const editingChartIndex = useAtomValue(editingChartIndexAtom);
  const editingSvgIndex = useAtomValue(editingSvgIndexAtom);
  const editingTableIndex = useAtomValue(editingTableIndexAtom);
  const setEditorOpen = useSetAtom(editorOpenAtom);
  const stageScale = stageWidth / SLIDE_W;
  const stageHeight = stageWidth * (SLIDE_H / SLIDE_W);

  return (
    <section style={workspaceStyles.workArea}>
      <div ref={stageWrapRef} style={workspaceStyles.stagePanel}>
        <div
          style={{
            ...workspaceStyles.slideFrame,
            width: stageWidth,
            height: stageHeight,
          }}
        >
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            style={workspaceStyles.slideEditButton}
          >
            Edit
          </button>
          <input
            ref={imageUploadInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            style={workspaceStyles.hiddenInput}
            onChange={onImageUploadChange}
          />
          <WorkspaceToolbars scale={stageScale} onEditImage={onEditImage} />
          <WorkspaceInlineEditors scale={stageScale} />
          <SlideSurface
            editingBulletsIndex={editingBulletsIndex}
            editingChartIndex={editingChartIndex}
            editingSvgIndex={editingSvgIndex}
            editingTableIndex={editingTableIndex}
            editingTextIndex={editingTextIndex}
            selectedTableCell={selectedTableCell}
            slide={activeSlide}
            width={stageWidth}
            height={stageHeight}
            interactive
            onEditImage={onEditImage}
          />
        </div>
        {canInsertSlide ? (
          <button
            type="button"
            onClick={onInsertSlide}
            style={workspaceStyles.insertSlideButton}
          >
            Insert Slide
          </button>
        ) : null}
      </div>
    </section>
  );
}
