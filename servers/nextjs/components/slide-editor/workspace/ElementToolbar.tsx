import type { ReactNode } from "react";
import type { SlideElement } from "../lib/slide-schema";
import { rootPath, type ElementPath } from "../lib/element-path";
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
  path: ElementPath;
  scale: number;
  selectedTableCell: TableCellSelection | null;
  onChange: (index: number, element: SlideElement, path?: ElementPath) => void;
  onEditImage: (index: number, path?: ElementPath) => void;
};

const TOOLBAR_RENDERERS = {
  text: ({ element, index, onChange, path, scale }) =>
    element.type === "text" ? (
      <TextToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element, path)}
      />
    ) : null,
  bullets: ({ element, index, onChange, path, scale }) =>
    element.type === "text-list" ? (
      <BulletsToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element, path)}
      />
    ) : null,
  image: ({ element, index, onChange, onEditImage, path, scale }) =>
    element.type === "image" ? (
      <ImageToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element, path)}
        onUpload={(index) => onEditImage(index, path)}
      />
    ) : null,
  shape: ({ element, index, onChange, path, scale }) =>
    element.type === "rectangle" || element.type === "ellipse" ? (
      <ShapeToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element, path)}
      />
    ) : null,
  chart: ({ element, index, onChange, path, scale }) =>
    element.type === "chart" ? (
      <ChartToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element, path)}
      />
    ) : null,
  svg: ({ element, index, onChange, path, scale }) =>
    element.type === "svg" ? (
      <SvgToolbar
        element={element}
        index={index}
        scale={scale}
        onChange={(index, element) => onChange(index, element, path)}
      />
    ) : null,
  table: ({ element, index, onChange, path, scale, selectedTableCell }) =>
    element.type === "table" ? (
      <TableToolbar
        element={element}
        index={index}
        scale={scale}
        selectedCell={
          (selectedTableCell?.elementPath ??
            (selectedTableCell
              ? rootPath(selectedTableCell.elementIndex)
              : null)) === path
            ? selectedTableCell
            : null
        }
        onChange={(index, element) => onChange(index, element, path)}
      />
    ) : null,
} satisfies Record<
  ElementToolbarKey,
  (props: ElementToolbarProps) => ReactNode
>;

export function ElementToolbar(props: ElementToolbarProps) {
  const toolbar = getElementDefinition(props.element.type).toolbar;
  if (toolbar == null) return null;

  return TOOLBAR_RENDERERS[toolbar](props);
}
