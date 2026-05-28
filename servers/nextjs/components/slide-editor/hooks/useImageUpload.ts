import { useCallback, useRef, type ChangeEvent } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { activeSlideAtom, updateElementAtom } from "../state";

export function useImageUpload() {
  const activeSlide = useAtomValue(activeSlideAtom);
  const updateElement = useSetAtom(updateElementAtom);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadTargetRef = useRef<number | null>(null);

  const openImageUpload = useCallback((index: number) => {
    imageUploadTargetRef.current = index;
    imageUploadInputRef.current?.click();
  }, []);

  const handleImageUploadChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const targetIndex = imageUploadTargetRef.current;
      imageUploadTargetRef.current = null;
      if (!file || targetIndex == null) {
        event.target.value = "";
        return;
      }
      const target = activeSlide.elements[targetIndex];
      if (target?.type !== "image") {
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result !== "string") return;
        updateElement({
          index: targetIndex,
          element: {
            ...target,
            data: reader.result,
            name: file.name,
          },
        });
      });
      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [activeSlide.elements, updateElement],
  );

  return {
    imageUploadInputRef,
    openImageUpload,
    handleImageUploadChange,
  };
}
