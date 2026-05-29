import { useCallback, useRef, type ChangeEvent } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  activeSlideAtom,
  updateElementAtPathAtom,
  updateElementAtom,
} from "../state";
import {
  getElementAtPath,
  rootPath,
  type ElementPath,
} from "../lib/element-path";

export function useImageUpload() {
  const activeSlide = useAtomValue(activeSlideAtom);
  const updateElement = useSetAtom(updateElementAtom);
  const updateElementAtPath = useSetAtom(updateElementAtPathAtom);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadTargetRef = useRef<number | null>(null);
  const imageUploadTargetPathRef = useRef<ElementPath | null>(null);

  const openImageUpload = useCallback((index: number, path?: ElementPath) => {
    imageUploadTargetRef.current = index;
    imageUploadTargetPathRef.current = path ?? rootPath(index);
    imageUploadInputRef.current?.click();
  }, []);

  const handleImageUploadChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const targetIndex = imageUploadTargetRef.current;
      const targetPath = imageUploadTargetPathRef.current;
      imageUploadTargetRef.current = null;
      imageUploadTargetPathRef.current = null;
      if (!file || targetIndex == null) {
        event.target.value = "";
        return;
      }
      const target = getElementAtPath(
        activeSlide,
        targetPath ?? rootPath(targetIndex),
      );
      if (target?.type !== "image") {
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result !== "string") return;
        const element = {
          ...target,
          data: reader.result,
          name: file.name,
        };
        if (targetPath && targetPath !== rootPath(targetIndex)) {
          updateElementAtPath({ path: targetPath, element });
        } else {
          updateElement({ index: targetIndex, element });
        }
      });
      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [activeSlide, updateElement, updateElementAtPath],
  );

  return {
    imageUploadInputRef,
    openImageUpload,
    handleImageUploadChange,
  };
}
