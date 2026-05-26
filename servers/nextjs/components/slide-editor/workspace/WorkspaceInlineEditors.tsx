import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  BulletsInlineEditor,
  ChartInlineEditor,
  SvgInlineEditor,
  TableInlineEditor,
  TextInlineEditor,
} from "../inline";
import {
  editingBulletsDraftAtom,
  editingBulletsElementAtom,
  editingBulletsIndexAtom,
  editingChartDraftAtom,
  editingChartElementAtom,
  editingChartIndexAtom,
  editingSvgDraftAtom,
  editingSvgElementAtom,
  editingSvgIndexAtom,
  editingTableDraftAtom,
  editingTableElementAtom,
  editingTableIndexAtom,
  editingTextElementAtom,
  editingTextIndexAtom,
  updateElementAtom,
} from "../state";

type WorkspaceInlineEditorsProps = {
  scale: number;
};

export function WorkspaceInlineEditors({ scale }: WorkspaceInlineEditorsProps) {
  const editingTextElement = useAtomValue(editingTextElementAtom);
  const editingBulletsElement = useAtomValue(editingBulletsElementAtom);
  const editingTableElement = useAtomValue(editingTableElementAtom);
  const editingChartElement = useAtomValue(editingChartElementAtom);
  const editingSvgElement = useAtomValue(editingSvgElementAtom);
  const [editingTextIndex, setEditingTextIndex] = useAtom(editingTextIndexAtom);
  const [editingBulletsIndex, setEditingBulletsIndex] = useAtom(
    editingBulletsIndexAtom,
  );
  const [editingBulletsDraft, setEditingBulletsDraft] = useAtom(
    editingBulletsDraftAtom,
  );
  const [editingTableIndex, setEditingTableIndex] = useAtom(
    editingTableIndexAtom,
  );
  const [editingTableDraft, setEditingTableDraft] = useAtom(
    editingTableDraftAtom,
  );
  const [editingChartIndex, setEditingChartIndex] = useAtom(
    editingChartIndexAtom,
  );
  const [editingChartDraft, setEditingChartDraft] = useAtom(
    editingChartDraftAtom,
  );
  const [editingSvgIndex, setEditingSvgIndex] = useAtom(editingSvgIndexAtom);
  const [editingSvgDraft, setEditingSvgDraft] = useAtom(editingSvgDraftAtom);
  const updateElement = useSetAtom(updateElementAtom);

  return (
    <>
      {editingTextElement && editingTextIndex != null ? (
        <TextInlineEditor
          element={editingTextElement}
          index={editingTextIndex}
          scale={scale}
          onChange={(index, element) => updateElement({ index, element })}
          onClose={() => setEditingTextIndex(null)}
        />
      ) : null}
      {editingBulletsElement && editingBulletsIndex != null ? (
        <BulletsInlineEditor
          element={editingBulletsElement}
          index={editingBulletsIndex}
          scale={scale}
          draft={editingBulletsDraft}
          onDraftChange={setEditingBulletsDraft}
          onChange={(index, element) => updateElement({ index, element })}
          onClose={() => {
            setEditingBulletsIndex(null);
            setEditingBulletsDraft("");
          }}
        />
      ) : null}
      {editingTableElement && editingTableIndex != null ? (
        <TableInlineEditor
          element={editingTableElement}
          index={editingTableIndex}
          scale={scale}
          draft={editingTableDraft}
          onDraftChange={setEditingTableDraft}
          onChange={(index, element) => updateElement({ index, element })}
          onClose={() => {
            setEditingTableIndex(null);
            setEditingTableDraft("");
          }}
        />
      ) : null}
      {editingChartElement && editingChartIndex != null ? (
        <ChartInlineEditor
          element={editingChartElement}
          index={editingChartIndex}
          scale={scale}
          draft={editingChartDraft}
          onDraftChange={setEditingChartDraft}
          onChange={(index, element) => updateElement({ index, element })}
          onClose={() => {
            setEditingChartIndex(null);
            setEditingChartDraft("");
          }}
        />
      ) : null}
      {editingSvgElement && editingSvgIndex != null ? (
        <SvgInlineEditor
          element={editingSvgElement}
          index={editingSvgIndex}
          scale={scale}
          draft={editingSvgDraft}
          onDraftChange={setEditingSvgDraft}
          onChange={(index, element) => updateElement({ index, element })}
          onClose={() => {
            setEditingSvgIndex(null);
            setEditingSvgDraft("");
          }}
        />
      ) : null}
    </>
  );
}
