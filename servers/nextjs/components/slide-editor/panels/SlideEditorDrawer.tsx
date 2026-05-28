import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { useAtomValue, useSetAtom } from "jotai";
import type { SlideElement } from "../lib/slide-schema";
import {
  elementBox,
  fillColor,
  setTableRowsFromStrings,
  setTextContent,
  setTextListStrings,
  strokeColor,
  tableRowsAsStrings,
  textContent,
  textListStrings,
} from "../lib/element-model";
import type { ComponentTemplate } from "../componentTemplates";
import { editorTheme, styles } from "../editorStyles";
import { kindLabel, withHash, withoutHash } from "../editorUtils";
import { ElementInspector } from "../inspector/ElementInspector";
import {
  SelectField,
  TextareaField,
  TextField,
} from "../inspector/InspectorFields";
import { ADDABLE_ELEMENT_KINDS } from "../registry";
import { EditorButton } from "../shared/FormControls";
import {
  activeSlideAtom,
  activeSlideIndexAtom,
  addElementAtom,
  deleteSelectedComponentRunAtom,
  duplicateSelectedAtom,
  getComponentRun,
  insertElementsAtom,
  patchSelectedAtom,
  selectedElementAtom,
  selectedIndexAtom,
  updateActiveSlideAtom,
  updateElementAtom,
} from "../state";
import { drawerStyles } from "./drawerStyles";

type SlideEditorDrawerProps = {
  componentTemplates?: ReadonlyArray<ComponentTemplate>;
  onClose: () => void;
};

export function SlideEditorDrawer({
  componentTemplates = [],
  onClose,
}: SlideEditorDrawerProps) {
  const [componentPickerOpen, setComponentPickerOpen] = useState(false);
  const active = useAtomValue(activeSlideIndexAtom);
  const activeSlide = useAtomValue(activeSlideAtom);
  const selectedElement = useAtomValue(selectedElementAtom);
  const selectedIndex = useAtomValue(selectedIndexAtom);
  const selectedComponentRun = getComponentRun(
    activeSlide.elements,
    selectedIndex,
  );
  const selectedGroupedComponentRun =
    selectedComponentRun && selectedComponentRun.indexes.length > 1
      ? selectedComponentRun
      : null;
  const updateActiveSlide = useSetAtom(updateActiveSlideAtom);
  const updateElement = useSetAtom(updateElementAtom);
  const patchSelected = useSetAtom(patchSelectedAtom);
  const addElement = useSetAtom(addElementAtom);
  const insertElements = useSetAtom(insertElementsAtom);
  const duplicateSelected = useSetAtom(duplicateSelectedAtom);
  const deleteSelectedComponentRun = useSetAtom(deleteSelectedComponentRunAtom);
  const backgroundImageInputRef = useRef<HTMLInputElement | null>(null);
  const selectedComponentElements =
    selectedGroupedComponentRun?.indexes
      .map((index) => ({ index, element: activeSlide.elements[index] }))
      .filter(
        (item): item is { index: number; element: SlideElement } =>
          item.element != null,
      ) ?? [];

  const handleBackgroundImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      updateActiveSlide((slide) => {
        slide.backgroundImage = {
          data: reader.result as string,
          fit: slide.backgroundImage?.fit ?? "cover",
          opacity: slide.backgroundImage?.opacity ?? null,
        };
      });
    });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const insertComponent = (component: ComponentTemplate) => {
    insertElements(component.elements);
    setComponentPickerOpen(false);
  };

  const patchElementAtIndex = (
    index: number,
    patch: Partial<SlideElement>,
  ) => {
    const element = activeSlide.elements[index];
    if (!element) return;
    updateElement({
      index,
      element: { ...element, ...patch } as SlideElement,
    });
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={drawerStyles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {componentPickerOpen && componentTemplates.length > 0 ? (
        <ComponentPickerDrawer
          components={componentTemplates}
          onClose={() => setComponentPickerOpen(false)}
          onInsert={insertComponent}
        />
      ) : null}
      <aside style={drawerStyles.drawer}>
        <div style={drawerStyles.header}>
          <div>
            <div style={styles.eyebrow}>
              SLIDE {String(active + 1).padStart(2, "0")}
            </div>
            <h2 style={drawerStyles.title}>
              {selectedGroupedComponentRun
                ? componentLabel(selectedGroupedComponentRun.componentId)
                : selectedElement
                  ? kindLabel(selectedElement.type)
                  : "Slide"}
            </h2>
          </div>
          <div style={drawerStyles.iconRow}>
            {selectedElement && !selectedGroupedComponentRun ? (
              <button
                type="button"
                title="Duplicate"
                onClick={() => duplicateSelected()}
                style={drawerStyles.iconButton}
              >
                ⧉
              </button>
            ) : null}
            <button
              type="button"
              title="Close editor"
              onClick={onClose}
              style={drawerStyles.iconButton}
            >
              ×
            </button>
          </div>
        </div>

        <div style={drawerStyles.hint}>
          {selectedGroupedComponentRun
            ? "Edit the content fields for this grouped component."
            : selectedElement
            ? "Select an object on the slide, then adjust it here."
            : "Adjust slide-level settings or add new elements."}
        </div>

        {selectedGroupedComponentRun ? (
          <div style={drawerStyles.componentPanel}>
            <div style={drawerStyles.sectionTitle}>
              {componentLabel(selectedGroupedComponentRun.componentId)}
            </div>
            <div style={drawerStyles.componentMeta}>
              {selectedGroupedComponentRun.indexes.length} editable elements
              selected as one component.
            </div>
            <EditorButton onClick={() => deleteSelectedComponentRun()}>
              Delete component
            </EditorButton>
          </div>
        ) : null}

        {selectedGroupedComponentRun ? (
          <ComponentRunInspector
            items={selectedComponentElements}
            onPatch={patchElementAtIndex}
          />
        ) : selectedElement ? (
          <ElementInspector
            element={selectedElement}
            selectedIndex={selectedIndex}
            onPatch={patchSelected}
            onReplace={(index, element) => updateElement({ index, element })}
          />
        ) : null}

        {!selectedElement ? (
          <>
            <label style={styles.field}>
              <span>Slide background</span>
              <input
                type="color"
                value={withHash(activeSlide.background)}
                onChange={(event) =>
                  updateActiveSlide((slide) => {
                    slide.background = withoutHash(event.target.value);
                  })
                }
                style={styles.colorInput}
              />
            </label>

            <div style={styles.field}>
              <span>Background image</span>
              <input
                ref={backgroundImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleBackgroundImageChange}
                style={{ display: "none" }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: activeSlide.backgroundImage
                    ? "1fr 1fr"
                    : "1fr",
                  gap: 8,
                }}
              >
                <EditorButton
                  onClick={() => backgroundImageInputRef.current?.click()}
                >
                  {activeSlide.backgroundImage ? "Replace" : "Upload"}
                </EditorButton>
                {activeSlide.backgroundImage ? (
                  <EditorButton
                    onClick={() =>
                      updateActiveSlide((slide) => {
                        slide.backgroundImage = null;
                      })
                    }
                  >
                    Remove
                  </EditorButton>
                ) : null}
              </div>
              {activeSlide.backgroundImage ? (
                <select
                  value={activeSlide.backgroundImage.fit ?? "cover"}
                  onChange={(event) =>
                    updateActiveSlide((slide) => {
                      if (!slide.backgroundImage) return;
                      slide.backgroundImage.fit = event.target.value as
                        | "cover"
                        | "contain"
                        | "fill";
                    })
                  }
                  style={styles.input}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
              ) : null}
            </div>

            <div style={drawerStyles.addGrid}>
              {ADDABLE_ELEMENT_KINDS.map((kind: any) => (
                <EditorButton key={kind} onClick={() => addElement(kind)}>
                  + {kindLabel(kind)}
                </EditorButton>
              ))}
              {componentTemplates.length > 0 ? (
                <EditorButton onClick={() => setComponentPickerOpen(true)}>
                  + Component
                </EditorButton>
              ) : null}
            </div>

            {componentTemplates.length > 0 ? (
              <div style={drawerStyles.componentHint}>
                {componentTemplates.length} reusable component templates
                available.
              </div>
            ) : null}
          </>
        ) : null}
      </aside>
    </div>
  );
}

function ComponentRunInspector({
  items,
  onPatch,
}: {
  items: Array<{ index: number; element: SlideElement }>;
  onPatch: (index: number, patch: Partial<SlideElement>) => void;
}) {
  const editableItems = items.filter(({ element }) =>
    isComponentDataElement(element),
  );

  if (editableItems.length === 0) {
    return (
      <div style={drawerStyles.componentHint}>
        This component has no editable content fields.
      </div>
    );
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} style={styles.form}>
      {editableItems.map(({ index, element }, fieldIndex) => {
        const label = componentFieldLabel(element, fieldIndex);

        if (element.type === "text") {
          return (
            <TextareaField
              key={index}
              label={label}
              rows={label.toLowerCase().includes("description") ? 4 : 2}
              value={textContent(element)}
              onChange={(text) => {
                if (text.trim()) {
                  onPatch(index, {
                    runs: setTextContent(element, text).runs,
                  } as Partial<SlideElement>);
                }
              }}
            />
          );
        }

        if (element.type === "text-list") {
          return (
            <TextareaField
              key={index}
              label={label}
              rows={5}
              value={textListStrings(element).join("\n")}
              onChange={(value) => {
                const items = value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .slice(0, 8);
                if (items.length > 0) {
                  onPatch(index, {
                    items: setTextListStrings(element, items).items,
                  } as Partial<SlideElement>);
                }
              }}
            />
          );
        }

        if (element.type === "image") {
          return (
            <div key={index} style={styles.grid2}>
              <TextField
                label={label}
                value={element.data ?? ""}
                onChange={(data) =>
                  onPatch(index, {
                    data: data.trim() || undefined,
                  } as Partial<SlideElement>)
                }
              />
              <SelectField
                label={`${label} fit`}
                value={element.fit ?? "cover"}
                options={[
                  { label: "Cover", value: "cover" },
                  { label: "Contain", value: "contain" },
                  { label: "Fill", value: "fill" },
                ]}
                onChange={(fit) =>
                  onPatch(index, { fit } as Partial<SlideElement>)
                }
              />
            </div>
          );
        }

        if (element.type === "table") {
          return (
            <TextareaField
              key={index}
              label={label}
              rows={6}
              value={tableRowsAsStrings(element)
                .map((row) => row.join(", "))
                .join("\n")}
              onChange={(value) => {
                const rows = value
                  .split("\n")
                  .map((row) =>
                    row
                      .split(",")
                      .map((cell) => cell.trim())
                      .slice(0, 6),
                  )
                  .filter((row) => row.some(Boolean))
                  .slice(0, 8);
                if (rows.length >= 2) {
                  const next = setTableRowsFromStrings(element, rows);
                  onPatch(index, {
                    columns: next.columns,
                    rows: next.rows,
                  } as Partial<SlideElement>);
                }
              }}
            />
          );
        }

        return (
          <TextField
            key={index}
            label={label}
            value={element.type === "chart" ? element.title ?? "" : ""}
            onChange={(title) =>
              onPatch(index, { title } as Partial<SlideElement>)
            }
          />
        );
      })}
    </form>
  );
}

function isComponentDataElement(element: SlideElement) {
  return (
    element.type === "text" ||
    element.type === "text-list" ||
    element.type === "image" ||
    element.type === "table" ||
    element.type === "chart"
  );
}

function componentFieldLabel(element: SlideElement, fallbackIndex: number) {
  const slot =
    "componentSlot" in element && element.componentSlot
      ? element.componentSlot
      : element.type === "image" && element.name
        ? element.name
        : "";
  const label = slot ? componentLabel(slot) : kindLabel(element.type);
  return `${label}${slot ? "" : ` ${fallbackIndex + 1}`}`;
}

function componentLabel(componentId: string) {
  return componentId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ComponentPickerDrawer({
  components,
  onClose,
  onInsert,
}: {
  components: ReadonlyArray<ComponentTemplate>;
  onClose: () => void;
  onInsert: (component: ComponentTemplate) => void;
}) {
  return (
    <aside style={drawerStyles.componentDrawer}>
      <div style={drawerStyles.header}>
        <div>
          <div style={styles.eyebrow}>ADD COMPONENT</div>
          <h2 style={drawerStyles.title}>Components</h2>
        </div>
        <button
          type="button"
          title="Close components"
          onClick={onClose}
          style={drawerStyles.iconButton}
        >
          ×
        </button>
      </div>

      <div style={drawerStyles.hint}>
        Reusable grouped blocks for this template.
      </div>

      <div style={drawerStyles.componentPreviewGrid}>
        {components.map((component) => (
          <button
            key={component.id}
            type="button"
            title={component.description ?? component.label}
            onClick={() => onInsert(component)}
            style={drawerStyles.componentPreviewCard}
          >
            <ComponentPreview elements={component.elements} />
            <span style={drawerStyles.componentPreviewName}>
              {component.label}
            </span>
            <span style={drawerStyles.componentPreviewMeta}>
              {component.elements.length} elements
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function ComponentPreview({ elements }: { elements: SlideElement[] }) {
  const bounds = useMemo(() => boundsForElements(elements), [elements]);
  return (
    <span style={drawerStyles.componentPreviewFrame}>
      <span style={drawerStyles.componentPreviewStage}>
        {elements.map((element, index) => (
          <span
            key={index}
            style={{
              ...previewElementStyle(element, bounds),
              zIndex: index + 1,
            }}
          />
        ))}
      </span>
    </span>
  );
}

type PreviewBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function boundsForElements(elements: SlideElement[]): PreviewBounds {
  if (elements.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
  const boxes = elements.map(elementBox);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w));
  const maxY = Math.max(...boxes.map((box) => box.y + box.h));
  return {
    x: minX,
    y: minY,
    w: Math.max(0.01, maxX - minX),
    h: Math.max(0.01, maxY - minY),
  };
}

function previewElementStyle(
  element: SlideElement,
  bounds: PreviewBounds,
): CSSProperties {
  const box = elementBox(element);
  const left = ((box.x - bounds.x) / bounds.w) * 100;
  const top = ((box.y - bounds.y) / bounds.h) * 100;
  const width = (box.w / bounds.w) * 100;
  const height = (box.h / bounds.h) * 100;
  const style: CSSProperties = {
    position: "absolute",
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    boxSizing: "border-box",
    opacity: element.opacity ?? 1,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: "center",
  };

  if (element.type === "text" || element.type === "text-list") {
    return {
      ...style,
      borderRadius: 2,
      background: withHash(element.font?.color ?? "1A2B45"),
      opacity: 0.75,
    };
  }

  if (element.type === "rectangle" || element.type === "ellipse") {
    return {
      ...style,
      borderRadius: element.type === "ellipse" ? "999px" : 3,
      background: withHash(fillColor(element.fill, "FFFFFF")),
      border: element.stroke
        ? `1px solid ${withHash(strokeColor(element.stroke))}`
        : undefined,
      boxShadow: element.shadow
        ? `0 2px 8px rgba(0,0,0,${Math.min(0.35, (element.shadow.opacity ?? 0.2) + 0.12)})`
        : undefined,
    };
  }

  if (element.type === "image") {
    return {
      ...style,
      borderRadius: 4,
      background: element.data
        ? `linear-gradient(135deg, ${editorTheme.primarySoft}, ${editorTheme.surfaceSubtle})`
        : editorTheme.surfaceSubtle,
      border: `1px dashed ${editorTheme.borderStrong}`,
    };
  }

  if (element.type === "table") {
    const bodyFill = element.rows[0]?.[0]?.fill?.color ?? "FFFFFF";
    const borderColor =
      element.columns[0]?.stroke?.color ??
      element.rows[0]?.[0]?.stroke?.color ??
      "D9E2EF";
    const headerFill = element.columns[0]?.fill?.color ?? "0B1F3A";
    return {
      ...style,
      borderRadius: 3,
      background: withHash(bodyFill),
      border: `1px solid ${withHash(borderColor)}`,
      backgroundImage: `linear-gradient(${withHash(headerFill)} 0 28%, transparent 28%)`,
    };
  }

  if (element.type === "chart") {
    return {
      ...style,
      borderRadius: 4,
      background: `linear-gradient(135deg, ${withHash(element.color ?? "D4A24C")}, ${editorTheme.surfaceSubtle})`,
    };
  }

  return {
    ...style,
    borderRadius: 4,
    background: editorTheme.muted,
  };
}
