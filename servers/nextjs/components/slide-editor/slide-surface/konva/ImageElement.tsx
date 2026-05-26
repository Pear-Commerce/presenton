import { useEffect, useState } from "react";
import { Ellipse, Group, Image as KonvaImage, Line, Rect } from "react-konva";
import type { ImageElement as ImageEl } from "../../lib/slide-schema";
import {
  konvaCornerRadius,
  rotationProps,
  shadowProps,
} from "./elementVisuals";
import { loadKonvaImage } from "./exportAssets";
import { geometry, type ElementCommonProps } from "./types";

export function ImageElement({
  element,
  index,
  scale,
  selected,
  setRef,
  events,
}: ElementCommonProps & { element: ImageEl }) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );

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
      {element.data ? (
        <SlideImagePicture
          element={element}
          scale={scale}
          width={width}
          height={height}
        />
      ) : (
        <ImagePlaceholder width={width} height={height} />
      )}
      {selected ? (
        <Rect
          width={width}
          height={height}
          stroke={stroke}
          strokeWidth={strokeWidth}
          dash={[6, 4]}
          listening={false}
        />
      ) : null}
    </Group>
  );
}

function SlideImagePicture({
  element,
  scale,
  width,
  height,
}: {
  element: ImageEl;
  scale: number;
  width: number;
  height: number;
}) {
  const [loaded, setLoaded] = useState<{
    image: HTMLImageElement | null;
    src: string;
  } | null>(null);

  useEffect(() => {
    if (!element.data) return;
    const src = element.data;
    let cancelled = false;
    void loadKonvaImage(src).then((next) => {
      if (!cancelled) setLoaded({ image: next, src });
    });
    return () => {
      cancelled = true;
    };
  }, [element.data]);

  const image = loaded && loaded.src === element.data ? loaded.image : null;

  if (!image) return null;

  const fit = element.fit ?? "contain";
  const naturalRatio = image.width / image.height || 1;
  const boxRatio = width / height || 1;

  let drawW = width;
  let drawH = height;
  let offsetX = 0;
  let offsetY = 0;
  if (fit === "contain") {
    if (naturalRatio > boxRatio) {
      drawH = width / naturalRatio;
      offsetY = (height - drawH) / 2;
    } else {
      drawW = height * naturalRatio;
      offsetX = (width - drawW) / 2;
    }
  } else if (fit === "cover") {
    if (naturalRatio > boxRatio) {
      drawW = height * naturalRatio;
      offsetX = (width - drawW) / 2;
    } else {
      drawH = width / naturalRatio;
      offsetY = (height - drawH) / 2;
    }
  }

  return (
    <Group
      clipFunc={(ctx) => {
        const radius = konvaCornerRadius(element, scale);
        roundedRectPath(ctx, 0, 0, width, height, radius);
      }}
    >
      <KonvaImage
        image={image}
        x={offsetX}
        y={offsetY}
        width={drawW}
        height={drawH}
      />
    </Group>
  );
}

function roundedRectPath(
  ctx: {
    beginPath: () => void;
    moveTo: (x: number, y: number) => void;
    lineTo: (x: number, y: number) => void;
    quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => void;
    closePath: () => void;
  },
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | number[],
) {
  const [tl, tr, br, bl] = Array.isArray(radius)
    ? radius
    : [radius, radius, radius, radius];
  const max = Math.min(width, height) / 2;
  const r = [tl, tr, br, bl].map((value) => Math.min(max, Math.max(0, value)));
  ctx.beginPath();
  ctx.moveTo(x + r[0], y);
  ctx.lineTo(x + width - r[1], y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r[1]);
  ctx.lineTo(x + width, y + height - r[2]);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height);
  ctx.lineTo(x + r[3], y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r[3]);
  ctx.lineTo(x, y + r[0]);
  ctx.quadraticCurveTo(x, y, x + r[0], y);
  ctx.closePath();
}

function ImagePlaceholder({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <Group>
      <Rect
        width={width}
        height={height}
        fill="#0a0d14"
        opacity={0.06}
        stroke="#7d89a3"
        strokeWidth={1}
        dash={[6, 4]}
      />
      <Rect
        x={width * 0.22}
        y={height * 0.3}
        width={width * 0.56}
        height={height * 0.32}
        stroke="#7d89a3"
        strokeWidth={1.2}
      />
      <Line
        points={[
          width * 0.26,
          height * 0.58,
          width * 0.4,
          height * 0.46,
          width * 0.54,
          height * 0.54,
          width * 0.74,
          height * 0.36,
        ]}
        stroke="#7d89a3"
        strokeWidth={1.2}
      />
      <Ellipse
        x={width * 0.66}
        y={height * 0.38}
        radiusX={Math.max(2, Math.min(width, height) * 0.02)}
        radiusY={Math.max(2, Math.min(width, height) * 0.02)}
        fill="#7d89a3"
      />
    </Group>
  );
}
