import { useEffect, useMemo, useState } from "react";
import { Group, Image as KonvaImage, Rect } from "react-konva";
import type { SvgElement as SvgEl } from "../../lib/slide-schema";
import { rotationProps, shadowProps } from "./elementVisuals";
import { loadKonvaImage, svgToDataUri } from "./exportAssets";
import { geometry, type ElementCommonProps } from "./types";

export function SvgElement({
  element,
  index,
  scale,
  selected,
  setRef,
  events,
}: ElementCommonProps & { element: SvgEl }) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );
  const src = useMemo(() => svgToDataUri(element.svg), [element.svg]);
  const [loaded, setLoaded] = useState<{
    image: HTMLImageElement | null;
    src: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadKonvaImage(src).then((next) => {
      if (!cancelled) setLoaded({ image: next, src });
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const image = loaded && loaded.src === src ? loaded.image : null;

  return (
    <Group
      ref={setRef}
      name={`element-${index}`}
      x={x}
      y={y}
      width={width}
      height={height}
      {...rotationProps(element)}
      opacity={element.opacity ?? 1}
      {...shadowProps(element.shadow, scale)}
      {...events}
    >
      {image ? (
        <KonvaImage
          image={image}
          width={width}
          height={height}
          listening={false}
        />
      ) : (
        <Rect width={width} height={height} fill="rgba(0,0,0,0.001)" />
      )}
      <Rect
        width={width}
        height={height}
        fill="rgba(0,0,0,0.001)"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
