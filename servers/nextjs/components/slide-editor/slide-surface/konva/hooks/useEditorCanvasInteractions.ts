import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import type { Slide, SlideElement } from "../../../lib/slide-schema";
import {
  getElementAtPath,
  rootPath,
  type ElementPath,
} from "../../../lib/element-path";
import {
  deleteSelectedAtom,
  editorOpenAtom,
  editingBulletsDraftAtom,
  editingBulletsIndexAtom,
  editingBulletsPathAtom,
  editingChartDraftAtom,
  editingChartIndexAtom,
  editingChartPathAtom,
  editingSvgDraftAtom,
  editingSvgIndexAtom,
  editingSvgPathAtom,
  editingTableDraftAtom,
  editingTableIndexAtom,
  editingTablePathAtom,
  editingTextIndexAtom,
  editingTextPathAtom,
  selectElementAtom,
  selectElementsAtom,
  selectedIndexAtom,
  selectedItemsAtom,
  selectedPathAtom,
  selectedTableCellAtom,
  updateElementAtPathAtom,
  updateElementAtom,
  updateElementsAtom,
} from "../../../state";
import {
  chartDraftFromElement,
  svgDraftFromElement,
  tableDraftFromElement,
} from "../../../inline";
import { textListStrings } from "../../../lib/element-model";

export function useEditorCanvasInteractions({
  onEditImage,
  slide,
}: {
  onEditImage?: (index: number, path?: ElementPath) => void;
  slide: Slide;
}) {
  const selected = useAtomValue(selectedIndexAtom);
  const selectedPath = useAtomValue(selectedPathAtom);
  const selectedItems = useAtomValue(selectedItemsAtom);
  const editingTextIndex = useAtomValue(editingTextIndexAtom);
  const editingBulletsIndex = useAtomValue(editingBulletsIndexAtom);
  const editingTableIndex = useAtomValue(editingTableIndexAtom);
  const editingChartIndex = useAtomValue(editingChartIndexAtom);
  const editingSvgIndex = useAtomValue(editingSvgIndexAtom);
  const selectElement = useSetAtom(selectElementAtom);
  const selectElements = useSetAtom(selectElementsAtom);
  const setEditorOpen = useSetAtom(editorOpenAtom);
  const setSelectedTableCell = useSetAtom(selectedTableCellAtom);
  const deleteSelected = useSetAtom(deleteSelectedAtom);
  const setEditingTextIndex = useSetAtom(editingTextIndexAtom);
  const setEditingTextPath = useSetAtom(editingTextPathAtom);
  const setEditingBulletsIndex = useSetAtom(editingBulletsIndexAtom);
  const setEditingBulletsPath = useSetAtom(editingBulletsPathAtom);
  const setEditingBulletsDraft = useSetAtom(editingBulletsDraftAtom);
  const setEditingTableIndex = useSetAtom(editingTableIndexAtom);
  const setEditingTablePath = useSetAtom(editingTablePathAtom);
  const setEditingTableDraft = useSetAtom(editingTableDraftAtom);
  const setEditingChartIndex = useSetAtom(editingChartIndexAtom);
  const setEditingChartPath = useSetAtom(editingChartPathAtom);
  const setEditingChartDraft = useSetAtom(editingChartDraftAtom);
  const setEditingSvgIndex = useSetAtom(editingSvgIndexAtom);
  const setEditingSvgPath = useSetAtom(editingSvgPathAtom);
  const setEditingSvgDraft = useSetAtom(editingSvgDraftAtom);
  const updateElement = useSetAtom(updateElementAtom);
  const updateElementAtPath = useSetAtom(updateElementAtPathAtom);
  const updateElements = useSetAtom(updateElementsAtom);

  const editText = useCallback(
    (index: number, path: ElementPath = rootPath(index)) => {
      setEditingBulletsIndex(null);
      setEditingBulletsPath(null);
      setEditingTableIndex(null);
      setEditingTablePath(null);
      setEditingChartIndex(null);
      setEditingChartPath(null);
      setEditingSvgIndex(null);
      setEditingSvgPath(null);
      setEditingTextIndex(index);
      setEditingTextPath(path);
    },
    [
      setEditingBulletsIndex,
      setEditingBulletsPath,
      setEditingChartIndex,
      setEditingChartPath,
      setEditingSvgIndex,
      setEditingSvgPath,
      setEditingTableIndex,
      setEditingTablePath,
      setEditingTextIndex,
      setEditingTextPath,
    ],
  );

  const editBullets = useCallback(
    (index: number, path: ElementPath = rootPath(index)) => {
      const element = getElementAtPath(slide, path);
      setEditingBulletsDraft(
        element?.type === "text-list" ? textListStrings(element).join("\n") : "",
      );
      setEditingTableIndex(null);
      setEditingTablePath(null);
      setEditingChartIndex(null);
      setEditingChartPath(null);
      setEditingSvgIndex(null);
      setEditingSvgPath(null);
      setEditingTextIndex(null);
      setEditingTextPath(null);
      setEditingBulletsIndex(index);
      setEditingBulletsPath(path);
    },
    [
      setEditingBulletsDraft,
      setEditingBulletsIndex,
      setEditingBulletsPath,
      setEditingChartIndex,
      setEditingChartPath,
      setEditingSvgIndex,
      setEditingSvgPath,
      setEditingTableIndex,
      setEditingTablePath,
      setEditingTextIndex,
      setEditingTextPath,
      slide,
    ],
  );

  const editTable = useCallback(
    (index: number, path: ElementPath = rootPath(index)) => {
      const element = getElementAtPath(slide, path);
      setEditingTableDraft(
        element?.type === "table" ? tableDraftFromElement(element) : "",
      );
      setEditingTextIndex(null);
      setEditingTextPath(null);
      setEditingBulletsIndex(null);
      setEditingBulletsPath(null);
      setEditingChartIndex(null);
      setEditingChartPath(null);
      setEditingSvgIndex(null);
      setEditingSvgPath(null);
      setEditingTableIndex(index);
      setEditingTablePath(path);
    },
    [
      setEditingBulletsIndex,
      setEditingBulletsPath,
      setEditingChartIndex,
      setEditingChartPath,
      setEditingSvgIndex,
      setEditingSvgPath,
      setEditingTableDraft,
      setEditingTableIndex,
      setEditingTablePath,
      setEditingTextIndex,
      setEditingTextPath,
      slide,
    ],
  );

  const editChart = useCallback(
    (index: number, path: ElementPath = rootPath(index)) => {
      const element = getElementAtPath(slide, path);
      setEditingChartDraft(
        element?.type === "chart" ? chartDraftFromElement(element) : "",
      );
      setEditingTextIndex(null);
      setEditingTextPath(null);
      setEditingBulletsIndex(null);
      setEditingBulletsPath(null);
      setEditingTableIndex(null);
      setEditingTablePath(null);
      setEditingSvgIndex(null);
      setEditingSvgPath(null);
      setEditingChartIndex(index);
      setEditingChartPath(path);
    },
    [
      setEditingBulletsIndex,
      setEditingBulletsPath,
      setEditingChartDraft,
      setEditingChartIndex,
      setEditingChartPath,
      setEditingSvgIndex,
      setEditingSvgPath,
      setEditingTableIndex,
      setEditingTablePath,
      setEditingTextIndex,
      setEditingTextPath,
      slide,
    ],
  );

  const editSvg = useCallback(
    (index: number, path: ElementPath = rootPath(index)) => {
      const element = getElementAtPath(slide, path);
      setEditingSvgDraft(
        element?.type === "svg" ? svgDraftFromElement(element) : "",
      );
      setEditingTextIndex(null);
      setEditingTextPath(null);
      setEditingBulletsIndex(null);
      setEditingBulletsPath(null);
      setEditingTableIndex(null);
      setEditingTablePath(null);
      setEditingChartIndex(null);
      setEditingChartPath(null);
      setEditingSvgIndex(index);
      setEditingSvgPath(path);
    },
    [
      setEditingBulletsIndex,
      setEditingBulletsPath,
      setEditingChartIndex,
      setEditingChartPath,
      setEditingSvgDraft,
      setEditingSvgIndex,
      setEditingSvgPath,
      setEditingTableIndex,
      setEditingTablePath,
      setEditingTextIndex,
      setEditingTextPath,
      slide,
    ],
  );

  return {
    editingBulletsIndex,
    editingChartIndex,
    editingSvgIndex,
    editingTableIndex,
    editingTextIndex,
    onChange: (index: number, element: SlideElement) =>
      updateElement({ index, element }),
    onChangeAtPath: (path: ElementPath, element: SlideElement) =>
      updateElementAtPath({ path, element }),
    onChangeMany: updateElements,
    onDelete: deleteSelected,
    onEditBullets: editBullets,
    onEditChart: editChart,
    onEditImage,
    onEditSvg: editSvg,
    onEditTable: editTable,
    onEditText: editText,
    onSelect: (index: number, additive?: boolean, path?: ElementPath) =>
      selectElement({ index, additive, path }),
    onSelectMany: selectElements,
    onEditComponentRun: (indexes: number[]) => {
      selectElements(indexes);
      setEditorOpen(true);
    },
    onSelectTableCell: (
      index: number,
      rowIndex: number,
      colIndex: number,
      path: ElementPath = rootPath(index),
    ) => {
      setSelectedTableCell({
        elementIndex: index,
        elementPath: path,
        rowIndex,
        colIndex,
      });
    },
    selected,
    selectedPath,
    selectedItems,
  };
}
