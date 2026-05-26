import type { ReactNode } from "react";
import type { SlideElement } from "../lib/slide-schema";
import {
  BulletsToolbar,
  ChartToolbar,
  ImageToolbar,
  ShapeToolbar,
  SvgToolbar,
  TableToolbar,
  TextToolbar,
} from "../inline";
import { getElementDefinition, type ElementToolbarKey } from "../registry";
import type { TableCellSelection } from "../state";

type ElementToolbarProps = {
  element: SlideElement;
  index: number;
  scale: number;
  selectedTableCell: TableCellSelection | null;
  onChange: (index: number, element: SlideElement) => void;
  onEditImage: (index: number) => void;
};

const TOOLBAR_RENDERERS = {
  text: ({ element, index, onChange, scale }) =>
    element.kind === "text" ? (
      <TextToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element)}
      />
    ) : null,
  bullets: ({ element, index, onChange, scale }) =>
    element.kind === "bullets" ? (
      <BulletsToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element)}
      />
    ) : null,
  image: ({ element, index, onChange, onEditImage, scale }) =>
    element.kind === "image" ? (
      <ImageToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element)}
        onUpload={onEditImage}
      />
    ) : null,
  shape: ({ element, index, onChange, scale }) =>
    element.kind === "rect" || element.kind === "ellipse" ? (
      <ShapeToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element)}
      />
    ) : null,
  chart: ({ element, index, onChange, scale }) =>
    element.kind === "chart" ? (
      <ChartToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element)}
      />
    ) : null,
  svg: ({ element, index, onChange, scale }) =>
    element.kind === "svg" ? (
      <SvgToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element)}
      />
    ) : null,
  table: ({ element, index, onChange, scale, selectedTableCell }) =>
    element.kind === "table" ? (
      <TableToolbar
        element={element}
        index={index}
        scale={scale}
        selectedCell={
          selectedTableCell?.elementIndex === index ? selectedTableCell : null
        }
        onChange={(index, element) => onChange(index, element)}
      />
    ) : null,
} satisfies Record<
  ElementToolbarKey,
  (props: ElementToolbarProps) => ReactNode
>;

export function ElementToolbar(props: ElementToolbarProps) {
  const toolbar = getElementDefinition(props.element.kind).toolbar;
  if (toolbar == null) return null;

  return TOOLBAR_RENDERERS[toolbar](props);
}
