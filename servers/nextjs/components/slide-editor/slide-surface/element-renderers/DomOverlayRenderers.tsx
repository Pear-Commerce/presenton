import type { ReactNode } from "react";
import { useMemo } from "react";
import type { Slide } from "../../lib/slide-schema";
import {
  resolveSlideLayout,
  type ResolvedLayoutItem,
} from "../../lib/layout-resolver";
import type { ElementPath } from "../../lib/element-path";
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
  editingBulletsPath?: ElementPath | null;
  editingTableIndex?: number | null;
  editingTablePath?: ElementPath | null;
  editingTextIndex?: number | null;
  editingTextPath?: ElementPath | null;
  items?: ResolvedLayoutItem[];
  scale: number;
  selectedTableCell?: TableCellSelection | null;
  slide: Slide;
};

const DOM_OVERLAY_RENDERERS = {
  svg: ({ items = [], scale }) => <SvgDomElement items={items} scale={scale} />,
  chart: ({ items = [], scale }) => (
    <ChartDomElement items={items} scale={scale} />
  ),
  "text-list": ({ editingBulletsIndex, editingBulletsPath, items = [], scale }) => (
    <BulletsDomElement
      editingBulletsIndex={editingBulletsIndex}
      editingBulletsPath={editingBulletsPath}
      items={items}
      scale={scale}
    />
  ),
  text: ({ editingTextIndex, editingTextPath, items = [], scale }) => (
    <TextDomElement
      editingTextIndex={editingTextIndex}
      editingTextPath={editingTextPath}
      items={items}
      scale={scale}
    />
  ),
  table: ({
    editingTableIndex,
    editingTablePath,
    items = [],
    scale,
    selectedTableCell,
  }) => (
    <TableDomElement
      editingTableIndex={editingTableIndex}
      editingTablePath={editingTablePath}
      items={items}
      scale={scale}
      selectedCell={selectedTableCell}
    />
  ),
} satisfies Record<
  DomOverlayRendererKey,
  (props: DomOverlayRenderersProps) => ReactNode
>;

export function DomOverlayRenderers(props: DomOverlayRenderersProps) {
  const items = useMemo(() => resolveSlideLayout(props.slide), [props.slide]);
  return (
    <>
      {getDomOverlayDefinitions().map((definition) => {
        const renderer = definition.renderers.domOverlay;
        if (renderer == null) return null;
        return (
          <DomOverlayRenderer
            key={renderer}
            renderer={renderer}
            {...props}
            items={items}
          />
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
