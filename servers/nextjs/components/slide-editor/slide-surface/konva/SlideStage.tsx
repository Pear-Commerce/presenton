import type Konva from "konva";
import { useEffect, useState, type ReactNode } from "react";
import { Group, Image as KonvaImage, Layer, Rect, Stage } from "react-konva";
import type { Slide, SlideBackgroundImage } from "../../lib/slide-schema";
import { withHash } from "../../editorUtils";
import { loadKonvaImage } from "./exportAssets";

export function SlideStage({
  children,
  height,
  interactive,
  slide,
  stageHandlers,
  stageRef,
  width,
}: {
  children: ReactNode;
  height: number;
  interactive: boolean;
  slide: Slide;
  stageHandlers: {
    onMouseDown: (event: Konva.KonvaEventObject<MouseEvent>) => void;
    onMouseMove: (event: Konva.KonvaEventObject<MouseEvent>) => void;
    onMouseUp: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  };
  stageRef?: (stage: Konva.Stage | null) => void;
  width: number;
}) {
  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{
        display: "block",
        background: withHash(slide.background),
        borderRadius: interactive ? 6 : 2,
        overflow: "hidden",
        boxShadow: interactive ? "0 24px 70px rgba(0,0,0,0.42)" : "none",
      }}
      {...stageHandlers}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={withHash(slide.background)}
          listening={false}
        />
        {slide.backgroundImage ? (
          <SlideBackgroundImagePicture
            background={slide.backgroundImage}
            width={width}
            height={height}
          />
        ) : null}
        {children}
      </Layer>
    </Stage>
  );
}

function SlideBackgroundImagePicture({
  background,
  width,
  height,
}: {
  background: SlideBackgroundImage;
  width: number;
  height: number;
}) {
  const [loaded, setLoaded] = useState<{
    image: HTMLImageElement | null;
    src: string;
  } | null>(null);

  useEffect(() => {
    const src = background.data;
    let cancelled = false;
    void loadKonvaImage(src).then((next) => {
      if (!cancelled) setLoaded({ image: next, src });
    });
    return () => {
      cancelled = true;
    };
  }, [background.data]);

  const image = loaded && loaded.src === background.data ? loaded.image : null;
  if (!image) return null;

  const fit = background.fit ?? "cover";
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
      clipFunc={(ctx) => ctx.rect(0, 0, width, height)}
      opacity={background.opacity ?? 1}
      listening={false}
    >
      <KonvaImage
        image={image}
        x={offsetX}
        y={offsetY}
        width={drawW}
        height={drawH}
        listening={false}
      />
    </Group>
  );
}
