import type Konva from "konva";
import { SLIDE_W, type Slide, type SlideElement } from "../lib/slide-schema";
import type { ElementPath } from "../lib/element-path";
import type { TableCellSelection } from "../state";
import { DomOverlayRenderers } from "./element-renderers/DomOverlayRenderers";
import { KonvaSlide } from "./konva/KonvaSlide";

export function SlideSurface({
  editingBulletsIndex,
  editingBulletsPath,
  editingChartIndex,
  editingSvgIndex,
  editingTableIndex,
  editingTablePath,
  editingTextIndex,
  editingTextPath,
  height,
  interactive,
  onChange,
  onChangeAtPath,
  onChangeMany,
  onDelete,
  onEditBullets,
  onEditChart,
  onEditComponentRun,
  onEditImage,
  onEditSvg,
  onEditTable,
  onEditText,
  onSelect,
  onSelectMany,
  onSelectTableCell,
  selected,
  selectedPath,
  selectedItems,
  selectedTableCell,
  slide,
  stageRef,
  width,
}: {
  editingBulletsIndex?: number | null;
  editingBulletsPath?: ElementPath | null;
  editingChartIndex?: number | null;
  editingSvgIndex?: number | null;
  editingTableIndex?: number | null;
  editingTablePath?: ElementPath | null;
  editingTextIndex?: number | null;
  editingTextPath?: ElementPath | null;
  height: number;
  interactive: boolean;
  onChange?: (index: number, element: SlideElement) => void;
  onChangeAtPath?: (path: ElementPath, element: SlideElement) => void;
  onChangeMany?: (
    updates: Array<{ index: number; element: SlideElement }>,
  ) => void;
  onDelete?: () => void;
  onEditBullets?: (index: number, path?: ElementPath) => void;
  onEditChart?: (index: number, path?: ElementPath) => void;
  onEditComponentRun?: (indexes: number[]) => void;
  onEditImage?: (index: number, path?: ElementPath) => void;
  onEditSvg?: (index: number, path?: ElementPath) => void;
  onEditTable?: (index: number, path?: ElementPath) => void;
  onEditText?: (index: number, path?: ElementPath) => void;
  onSelect?: (index: number, additive?: boolean, path?: ElementPath) => void;
  onSelectMany?: (indexes: number[]) => void;
  onSelectTableCell?: (
    index: number,
    rowIndex: number,
    colIndex: number,
    path?: ElementPath,
  ) => void;
  selected?: number;
  selectedPath?: ElementPath | null;
  selectedItems?: number[];
  selectedTableCell?: TableCellSelection | null;
  slide: Slide;
  stageRef?: (stage: Konva.Stage | null) => void;
  width: number;
}) {
  const scale = width / SLIDE_W;

  return (
    <>
      <KonvaSlide
        editingBulletsIndex={editingBulletsIndex}
        editingChartIndex={editingChartIndex}
        editingSvgIndex={editingSvgIndex}
        editingTableIndex={editingTableIndex}
        editingTextIndex={editingTextIndex}
        height={height}
        interactive={interactive}
        onChange={onChange}
        onChangeAtPath={onChangeAtPath}
        onChangeMany={onChangeMany}
        onDelete={onDelete}
        onEditBullets={onEditBullets}
        onEditChart={onEditChart}
        onEditComponentRun={onEditComponentRun}
        onEditImage={onEditImage}
        onEditSvg={onEditSvg}
        onEditTable={onEditTable}
        onEditText={onEditText}
        onSelect={onSelect}
        onSelectMany={onSelectMany}
        onSelectTableCell={onSelectTableCell}
        selected={selected}
        selectedPath={selectedPath}
        selectedItems={selectedItems}
        slide={slide}
        stageRef={stageRef}
        bulletsRenderMode="proxy"
        chartRenderMode="proxy"
        tableRenderMode="proxy"
        textRenderMode="proxy"
        width={width}
      />
      <DomOverlayRenderers
        editingBulletsIndex={editingBulletsIndex}
        editingBulletsPath={editingBulletsPath}
        editingTableIndex={editingTableIndex}
        editingTablePath={editingTablePath}
        editingTextIndex={editingTextIndex}
        editingTextPath={editingTextPath}
        scale={scale}
        selectedTableCell={selectedTableCell}
        slide={slide}
      />
    </>
  );
}
