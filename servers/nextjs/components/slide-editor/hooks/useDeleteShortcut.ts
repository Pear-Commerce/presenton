import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  deleteSelectedAtom,
  selectedIndexAtom,
  selectedItemsAtom,
} from "../state";

export function useDeleteShortcut() {
  const selectedIndex = useAtomValue(selectedIndexAtom);
  const selectedItems = useAtomValue(selectedItemsAtom);
  const deleteSelected = useSetAtom(deleteSelectedAtom);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (selectedItems.length === 0 && selectedIndex < 0) return;
      event.preventDefault();
      deleteSelected();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected, selectedIndex, selectedItems.length]);
}
