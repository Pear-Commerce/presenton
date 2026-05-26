import { useEffect, useRef, useState } from "react";
import { STAGE_W, clamp } from "../editorUtils";

export function useStageSize() {
  const [stageWidth, setStageWidth] = useState(STAGE_W);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = stageWrapRef.current;
    if (!node) return;
    const measure = () => {
      setStageWidth(clamp(node.clientWidth, 460, STAGE_W));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, []);

  return { stageWidth, stageWrapRef };
}
