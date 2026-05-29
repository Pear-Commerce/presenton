import Konva from "konva";
import { SLIDE_W, type Slide, type SlideElement } from "../../lib/slide-schema";
import type { ElementPath } from "../../lib/element-path";
import { ElementLayer } from "./ElementLayer";
import { useEditorCanvasInteractions } from "./hooks/useEditorCanvasInteractions";
import { useKonvaSelection } from "./hooks/useKonvaSelection";
import { useSelectionBox } from "./hooks/useSelectionBox";
import { SlideStage } from "./SlideStage";

export function KonvaSlide({
  slide,
  width,
  height,
  interactive,
  selected,
  selectedPath,
  selectedItems,
  onSelect,
  onSelectMany,
  onDelete,
  onEditText,
  onEditBullets,
  onEditChart,
  onEditComponentRun,
  onEditImage,
  onEditSvg,
  onEditTable,
  onSelectTableCell,
  onChange,
  onChangeAtPath,
  onChangeMany,
  stageRef,
  bulletsRenderMode,
  chartRenderMode,
  tableRenderMode,
  textRenderMode,
  editingTextIndex,
  editingBulletsIndex,
  editingChartIndex,
  editingSvgIndex,
  editingTableIndex,
}: {
  slide: Slide;
  width: number;
  height: number;
  interactive: boolean;
  selected?: number;
  selectedPath?: ElementPath | null;
  selectedItems?: number[];
  onSelect?: (index: number, additive?: boolean, path?: ElementPath) => void;
  onSelectMany?: (indexes: number[]) => void;
  onDelete?: () => void;
  onEditText?: (index: number, path?: ElementPath) => void;
  onEditBullets?: (index: number, path?: ElementPath) => void;
  onEditChart?: (index: number, path?: ElementPath) => void;
  onEditComponentRun?: (indexes: number[]) => void;
  onEditImage?: (index: number, path?: ElementPath) => void;
  onEditSvg?: (index: number, path?: ElementPath) => void;
  onEditTable?: (index: number, path?: ElementPath) => void;
  onSelectTableCell?: (
    index: number,
    rowIndex: number,
    colIndex: number,
    path?: ElementPath,
  ) => void;
  onChange?: (index: number, element: SlideElement) => void;
  onChangeAtPath?: (path: ElementPath, element: SlideElement) => void;
  onChangeMany?: (
    updates: Array<{ index: number; element: SlideElement }>,
  ) => void;
  stageRef?: (stage: Konva.Stage | null) => void;
  bulletsRenderMode?: "canvas" | "proxy";
  chartRenderMode?: "canvas" | "proxy";
  tableRenderMode?: "canvas" | "proxy";
  textRenderMode?: "canvas" | "proxy";
  editingTextIndex?: number | null;
  editingBulletsIndex?: number | null;
  editingChartIndex?: number | null;
  editingSvgIndex?: number | null;
  editingTableIndex?: number | null;
}) {
  const scale = width / SLIDE_W;
  const editorInteractions = useEditorCanvasInteractions({
    onEditImage,
    slide,
  });
  const resolvedSelected =
    selected ?? (interactive ? editorInteractions.selected : undefined);
  const resolvedSelectedPath =
    selectedPath ?? (interactive ? editorInteractions.selectedPath : undefined);
  const resolvedSelectedItems =
    selectedItems ??
    (interactive ? editorInteractions.selectedItems : undefined);
  const resolvedEditingTextIndex =
    editingTextIndex ??
    (interactive ? editorInteractions.editingTextIndex : undefined);
  const resolvedEditingBulletsIndex =
    editingBulletsIndex ??
    (interactive ? editorInteractions.editingBulletsIndex : undefined);
  const resolvedEditingChartIndex =
    editingChartIndex ??
    (interactive ? editorInteractions.editingChartIndex : undefined);
  const resolvedEditingSvgIndex =
    editingSvgIndex ??
    (interactive ? editorInteractions.editingSvgIndex : undefined);
  const resolvedEditingTableIndex =
    editingTableIndex ??
    (interactive ? editorInteractions.editingTableIndex : undefined);
  const resolvedOnSelect =
    onSelect ?? (interactive ? editorInteractions.onSelect : undefined);
  const resolvedOnSelectMany =
    onSelectMany ?? (interactive ? editorInteractions.onSelectMany : undefined);
  const resolvedOnDelete =
    onDelete ?? (interactive ? editorInteractions.onDelete : undefined);
  const resolvedOnEditText =
    onEditText ?? (interactive ? editorInteractions.onEditText : undefined);
  const resolvedOnEditBullets =
    onEditBullets ??
    (interactive ? editorInteractions.onEditBullets : undefined);
  const resolvedOnEditChart =
    onEditChart ?? (interactive ? editorInteractions.onEditChart : undefined);
  const resolvedOnEditComponentRun =
    onEditComponentRun ??
    (interactive ? editorInteractions.onEditComponentRun : undefined);
  const resolvedOnEditImage =
    onEditImage ?? (interactive ? editorInteractions.onEditImage : undefined);
  const resolvedOnEditSvg =
    onEditSvg ?? (interactive ? editorInteractions.onEditSvg : undefined);
  const resolvedOnEditTable =
    onEditTable ?? (interactive ? editorInteractions.onEditTable : undefined);
  const resolvedOnSelectTableCell =
    onSelectTableCell ??
    (interactive ? editorInteractions.onSelectTableCell : undefined);
  const resolvedOnChange =
    onChange ?? (interactive ? editorInteractions.onChange : undefined);
  const resolvedOnChangeAtPath =
    onChangeAtPath ??
    (interactive ? editorInteractions.onChangeAtPath : undefined);
  const resolvedOnChangeMany =
    onChangeMany ?? (interactive ? editorInteractions.onChangeMany : undefined);
  const { nodeRefs, selectedBounds, selectedIndexes, transformerRef } =
    useKonvaSelection({
      interactive,
      scale,
      selected: resolvedSelected,
      selectedItems: resolvedSelectedItems,
      selectedPath: resolvedSelectedPath,
      slide,
    });
  const { normalizedSelectionBox, stageHandlers } = useSelectionBox({
    interactive,
    onSelect: resolvedOnSelect,
    onSelectMany: resolvedOnSelectMany,
    scale,
    slide,
  });

  return (
    <SlideStage
      height={height}
      interactive={interactive}
      slide={slide}
      stageHandlers={stageHandlers}
      stageRef={stageRef}
      width={width}
    >
      <ElementLayer
        editingBulletsIndex={resolvedEditingBulletsIndex}
        editingChartIndex={resolvedEditingChartIndex}
        editingSvgIndex={resolvedEditingSvgIndex}
        editingTableIndex={resolvedEditingTableIndex}
        editingTextIndex={resolvedEditingTextIndex}
        interactive={interactive}
        nodeRefs={nodeRefs}
        normalizedSelectionBox={normalizedSelectionBox}
        bulletsRenderMode={bulletsRenderMode}
        chartRenderMode={chartRenderMode}
        onChange={resolvedOnChange}
        onChangeAtPath={resolvedOnChangeAtPath}
        onChangeMany={resolvedOnChangeMany}
        onDelete={resolvedOnDelete}
        onEditBullets={resolvedOnEditBullets}
        onEditChart={resolvedOnEditChart}
        onEditComponentRun={resolvedOnEditComponentRun}
        onEditImage={resolvedOnEditImage}
        onEditSvg={resolvedOnEditSvg}
        onEditTable={resolvedOnEditTable}
        onEditText={resolvedOnEditText}
        onSelect={resolvedOnSelect}
        onSelectMany={resolvedOnSelectMany}
        onSelectTableCell={resolvedOnSelectTableCell}
        scale={scale}
        selectedBounds={selectedBounds}
        selectedIndexes={selectedIndexes}
        selectedPath={resolvedSelectedPath}
        slide={slide}
        tableRenderMode={tableRenderMode}
        textRenderMode={textRenderMode}
        transformerRef={transformerRef}
        width={width}
        height={height}
      />
    </SlideStage>
  );
}
