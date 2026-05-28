import type { ReactNode } from "react";
import type { Slide } from "../../lib/slide-schema";
import {
  getDomOverlayDefinitions,
  type DomOverlayRendererKey,
} from "../../registry";
import type { TableCellSelection } from "../../state";
import { BulletsDomElement } from "./bullets";
import { ChartDomElement } from "./chart";
import { SvgDomElement } from "./svg";
import { TableDomElement } from "./table";
import { TextDomElement } from "./text";

type DomOverlayRenderersProps = {
  editingBulletsIndex?: number | null;
  editingTableIndex?: number | null;
  editingTextIndex?: number | null;
  scale: number;
  selectedTableCell?: TableCellSelection | null;
  slide: Slide;
};

const DOM_OVERLAY_RENDERERS = {
  svg: ({ scale, slide }) => <SvgDomElement scale={scale} slide={slide} />,
  chart: ({ scale, slide }) => <ChartDomElement scale={scale} slide={slide} />,
  "text-list": ({ editingBulletsIndex, scale, slide }) => (
    <BulletsDomElement
      editingBulletsIndex={editingBulletsIndex}
      scale={scale}
      slide={slide}
    />
  ),
  text: ({ editingTextIndex, scale, slide }) => (
    <TextDomElement
      editingTextIndex={editingTextIndex}
      scale={scale}
      slide={slide}
    />
  ),
  table: ({ editingTableIndex, scale, selectedTableCell, slide }) => (
    <TableDomElement
      editingTableIndex={editingTableIndex}
      scale={scale}
      selectedCell={selectedTableCell}
      slide={slide}
    />
  ),
} satisfies Record<
  DomOverlayRendererKey,
  (props: DomOverlayRenderersProps) => ReactNode
>;

export function DomOverlayRenderers(props: DomOverlayRenderersProps) {
  return (
    <>
      {getDomOverlayDefinitions().map((definition) => {
        const renderer = definition.renderers.domOverlay;
        if (renderer == null) return null;
        return (
          <DomOverlayRenderer key={renderer} renderer={renderer} {...props} />
        );
      })}
    </>
  );
}

function DomOverlayRenderer({
  renderer,
  ...props
}: DomOverlayRenderersProps & { renderer: DomOverlayRendererKey }) {
  return DOM_OVERLAY_RENDERERS[renderer](props);
}
