import { useAtomValue } from "jotai";
import type { SlideElement } from "../lib/slide-schema";
import { editorTheme } from "../editorStyles";
import { getElementDefinition } from "../registry";
import { selectedElementOverflowsAtom } from "../state";
import { ChartInspector } from "./ChartInspector";
import {
  BulletsInspector,
  ImageInspector,
  ShapeInspector,
  SvgInspector,
  TableInspector,
  TextInspector,
} from "./KindInspectors";

type ElementInspectorProps = {
  element: SlideElement;
  selectedIndex: number;
  onPatch: (patch: Partial<SlideElement>) => void;
  onReplace: (index: number, element: SlideElement) => void;
};

export function ElementInspector({
  element,
  selectedIndex,
  onPatch,
  onReplace,
}: ElementInspectorProps) {
  const inspector = getElementDefinition(element.kind).inspector;
  const overflows = useAtomValue(selectedElementOverflowsAtom);

  const overflowBanner = overflows ? (
    <OverflowBanner element={element} />
  ) : null;

  if (inspector === "chart" && element.kind === "chart") {
    return (
      <>
        {overflowBanner}
        <ChartInspector
          element={element}
          onPatch={onPatch}
          onReplace={(next) => onReplace(selectedIndex, next)}
        />
      </>
    );
  }

  if (inspector === "text" && element.kind === "text") {
    return (
      <>
        {overflowBanner}
        <TextInspector element={element} onPatch={onPatch} />
      </>
    );
  }

  if (inspector === "bullets" && element.kind === "bullets") {
    return (
      <>
        {overflowBanner}
        <BulletsInspector element={element} onPatch={onPatch} />
      </>
    );
  }

  if (inspector === "image" && element.kind === "image") {
    return <ImageInspector element={element} onPatch={onPatch} />;
  }

  if (
    inspector === "shape" &&
    (element.kind === "rect" || element.kind === "ellipse")
  ) {
    return <ShapeInspector element={element} onPatch={onPatch} />;
  }

  if (inspector === "table" && element.kind === "table") {
    return <TableInspector element={element} onPatch={onPatch} />;
  }

  if (inspector === "svg" && element.kind === "svg") {
    return <SvgInspector element={element} onPatch={onPatch} />;
  }

  return null;
}

function OverflowBanner({ element }: { element: SlideElement }) {
  void element;
  return (
    <div style={bannerStyle} role="status">
      <span style={bannerDotStyle}>!</span>
      <div>
        <div style={bannerTitleStyle}>Text overflows its box</div>
        <div style={bannerHintStyle}>
          Increase the height, shrink the font, or trim the text.
        </div>
      </div>
    </div>
  );
}

const bannerStyle = {
  display: "grid",
  gridTemplateColumns: "22px 1fr",
  alignItems: "start",
  gap: 8,
  padding: "10px 11px",
  marginBottom: 14,
  borderRadius: 8,
  border: `1px solid ${editorTheme.danger}`,
  background: editorTheme.dangerSoft,
} as const;

const bannerDotStyle = {
  width: 20,
  height: 20,
  borderRadius: 10,
  background: editorTheme.danger,
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
  display: "grid",
  placeItems: "center",
  lineHeight: 1,
} as const;

const bannerTitleStyle = {
  color: editorTheme.danger,
  fontSize: 12,
  fontWeight: 800,
} as const;

const bannerHintStyle = {
  color: editorTheme.mutedStrong,
  fontSize: 11,
  marginTop: 2,
  lineHeight: 1.4,
} as const;
