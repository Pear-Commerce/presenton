import { useAtomValue, useSetAtom } from "jotai";
import {
  selectedResolvedElementAtom,
  selectedIndexAtom,
  selectedPathAtom,
  selectedTableCellAtom,
  updateElementAtPathAtom,
} from "../state";
import { rootPath, type ElementPath } from "../lib/element-path";
import { ElementToolbar } from "./ElementToolbar";

type WorkspaceToolbarsProps = {
  scale: number;
  onEditImage: (index: number, path?: ElementPath) => void;
};

export function WorkspaceToolbars({
  scale,
  onEditImage,
}: WorkspaceToolbarsProps) {
  const selectedIndex = useAtomValue(selectedIndexAtom);
  const selectedPath = useAtomValue(selectedPathAtom);
  const selectedElement = useAtomValue(selectedResolvedElementAtom);
  const selectedTableCell = useAtomValue(selectedTableCellAtom);
  const updateElementAtPath = useSetAtom(updateElementAtPathAtom);

  if (!selectedElement) return null;

  return (
    <ElementToolbar
      element={selectedElement}
      index={selectedIndex}
      scale={scale}
      selectedTableCell={selectedTableCell}
      path={selectedPath ?? rootPath(selectedIndex)}
      onChange={(index, element, path) =>
        updateElementAtPath({ path: path ?? rootPath(index), element })
      }
      onEditImage={onEditImage}
    />
  );
}
