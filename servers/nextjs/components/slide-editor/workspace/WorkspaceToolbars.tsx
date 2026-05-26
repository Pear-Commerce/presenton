import { useAtomValue, useSetAtom } from "jotai";
import {
  selectedElementAtom,
  selectedIndexAtom,
  selectedTableCellAtom,
  updateElementAtom,
} from "../state";
import { ElementToolbar } from "./ElementToolbar";

type WorkspaceToolbarsProps = {
  scale: number;
  onEditImage: (index: number) => void;
};

export function WorkspaceToolbars({
  scale,
  onEditImage,
}: WorkspaceToolbarsProps) {
  const selectedIndex = useAtomValue(selectedIndexAtom);
  const selectedElement = useAtomValue(selectedElementAtom);
  const selectedTableCell = useAtomValue(selectedTableCellAtom);
  const updateElement = useSetAtom(updateElementAtom);

  if (!selectedElement) return null;

  return (
    <ElementToolbar
      element={selectedElement}
      index={selectedIndex}
      scale={scale}
      selectedTableCell={selectedTableCell}
      onChange={(index, element) => updateElement({ index, element })}
      onEditImage={onEditImage}
    />
  );
}
