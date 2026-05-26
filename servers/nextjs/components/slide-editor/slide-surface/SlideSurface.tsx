import type Konva from "konva";
import { SLIDE_W, type Slide, type SlideElement } from "../lib/slide-schema";
import type { TableCellSelection } from "../state";
import { DomOverlayRenderers } from "./element-renderers/DomOverlayRenderers";
import { KonvaSlide } from "./konva/KonvaSlide";

export function SlideSurface({
  editingBulletsIndex,
  editingChartIndex,
  editingSvgIndex,
  editingTableIndex,
  editingTextIndex,
  height,
  interactive,
  onChange,
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
  selectedItems,
  selectedTableCell,
  slide,
  stageRef,
  width,
}: {
  editingBulletsIndex?: number | null;
  editingChartIndex?: number | null;
  editingSvgIndex?: number | null;
  editingTableIndex?: number | null;
  editingTextIndex?: number | null;
  height: number;
  interactive: boolean;
  onChange?: (index: number, element: SlideElement) => void;
  onChangeMany?: (
    updates: Array<{ index: number; element: SlideElement }>,
  ) => void;
  onDelete?: () => void;
  onEditBullets?: (index: number) => void;
  onEditChart?: (index: number) => void;
  onEditComponentRun?: (indexes: number[]) => void;
  onEditImage?: (index: number) => void;
  onEditSvg?: (index: number) => void;
  onEditTable?: (index: number) => void;
  onEditText?: (index: number) => void;
  onSelect?: (index: number, additive?: boolean) => void;
  onSelectMany?: (indexes: number[]) => void;
  onSelectTableCell?: (
    index: number,
    rowIndex: number,
    colIndex: number,
  ) => void;
  selected?: number;
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
        editingTableIndex={editingTableIndex}
        editingTextIndex={editingTextIndex}
        scale={scale}
        selectedTableCell={selectedTableCell}
        slide={slide}
      />
    </>
  );
}
