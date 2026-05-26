"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Provider, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import {
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { Deck } from "./lib/slide-schema";
import { TEMPLATES, layoutKitDeck } from "./templates";
import {
  createSlideTemplatesFromDeck,
  type ComponentTemplate,
  type SlideTemplate,
} from "./componentTemplates";
import {
  DeckThemeDrawer,
  SlideEditorDrawer,
  SlideLayoutDrawer,
} from "./panels";
import { PresentationMode } from "./PresentationMode";
import {
  EditorTopbar,
  HiddenExportStages,
  ThumbnailRail,
  layoutStyles,
} from "./shell";
import { SlideWorkspace } from "./workspace";
import {
  useDeckExport,
  useDeleteShortcut,
  useImageUpload,
  useStageSize,
} from "./hooks";
import {
  activeSlideIndexAtom,
  deckAtom,
  editorOpenAtom,
  insertSlideAtom,
  presentingAtom,
  redoAtom,
  selectedAtom,
  selectedItemsAtom,
  selectedTableCellAtom,
  undoAtom,
} from "./state";
import { styles } from "./editorStyles";

export function SlideEditor({
  componentTemplates,
  initialDeck = layoutKitDeck,
  slideTemplates,
  toolbarLeading,
}: {
  componentTemplates?: ReadonlyArray<ComponentTemplate>;
  initialDeck?: Deck;
  slideTemplates?: ReadonlyArray<SlideTemplate>;
  toolbarLeading?: ReactNode;
}) {
  const initialTemplateId = useMemo(
    () => getTemplateIdForDeck(initialDeck),
    [initialDeck],
  );

  return (
    <Provider>
      <SlideEditorBody
        componentTemplates={componentTemplates}
        initialDeck={initialDeck}
        initialTemplateId={initialTemplateId}
        slideTemplates={slideTemplates}
        toolbarLeading={toolbarLeading}
      />
    </Provider>
  );
}

function SlideEditorBody({
  componentTemplates,
  initialDeck,
  initialTemplateId,
  slideTemplates,
  toolbarLeading,
}: {
  componentTemplates?: ReadonlyArray<ComponentTemplate>;
  initialDeck: Deck;
  initialTemplateId: string;
  slideTemplates?: ReadonlyArray<SlideTemplate>;
  toolbarLeading?: ReactNode;
}) {
  useHydrateAtoms([[deckAtom, initialDeck]]);
  useEditorHotkeys();
  useDeleteShortcut();

  const deck = useAtomValue(deckAtom);
  const active = useAtomValue(activeSlideIndexAtom);
  const setDeck = useSetAtom(deckAtom);
  const setActiveSlideIndex = useSetAtom(activeSlideIndexAtom);
  const setSelected = useSetAtom(selectedAtom);
  const setSelectedItems = useSetAtom(selectedItemsAtom);
  const setSelectedTableCell = useSetAtom(selectedTableCellAtom);
  const [editorOpen, setEditorOpen] = useAtom(editorOpenAtom);
  const [presenting, setPresenting] = useAtom(presentingAtom);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [themeOpen, setThemeOpen] = useState(false);
  const [slideLayoutOpen, setSlideLayoutOpen] = useState(false);
  const insertSlide = useSetAtom(insertSlideAtom);
  const { stageWidth, stageWrapRef } = useStageSize();
  const { exportStageRefs, exportingType, handleExport, handlePdfExport } =
    useDeckExport();
  const { imageUploadInputRef, openImageUpload, handleImageUploadChange } =
    useImageUpload();
  const selectedTemplate = useMemo(
    () => TEMPLATES.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId],
  );
  const resolvedSlideTemplates = useMemo(
    () =>
      slideTemplates ??
      createSlideTemplatesFromDeck(selectedTemplate?.deck ?? initialDeck),
    [initialDeck, selectedTemplate, slideTemplates],
  );
  const resolvedComponentTemplates =
    componentTemplates ?? selectedTemplate?.componentTemplates ?? [];

  const handleTemplateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTemplate = TEMPLATES.find(
      (template) => template.id === event.target.value,
    );
    if (!nextTemplate) return;
    setSelectedTemplateId(nextTemplate.id);
    setDeck(structuredClone(nextTemplate.deck));
    setActiveSlideIndex(0);
    setSelected(-1);
    setSelectedItems([]);
    setSelectedTableCell(null);
    setEditorOpen(false);
    setSlideLayoutOpen(false);
  };

  return (
    <div style={layoutStyles.shell}>
      <ThumbnailRail />

      <main style={layoutStyles.main}>
        <EditorTopbar
          exportingType={exportingType}
          onExport={handleExport}
          onPdfExport={handlePdfExport}
          onOpenTheme={() => setThemeOpen(true)}
          toolbarLeading={
            <>
              <TemplateSelect
                value={selectedTemplateId}
                onChange={handleTemplateChange}
              />
              {toolbarLeading}
            </>
          }
        />

        <SlideWorkspace
          stageWrapRef={stageWrapRef}
          stageWidth={stageWidth}
          imageUploadInputRef={imageUploadInputRef}
          onImageUploadChange={handleImageUploadChange}
          onEditImage={openImageUpload}
          canInsertSlide={
            resolvedSlideTemplates.length > 0 && deck.slides.length < 50
          }
          onInsertSlide={() => setSlideLayoutOpen(true)}
        />
      </main>

      {editorOpen ? (
        <SlideEditorDrawer
          componentTemplates={resolvedComponentTemplates}
          onClose={() => setEditorOpen(false)}
        />
      ) : null}

      {slideLayoutOpen ? (
        <SlideLayoutDrawer
          anchorOffset={editorOpen ? 360 : 0}
          insertAfterIndex={active}
          slideTemplates={resolvedSlideTemplates}
          onClose={() => setSlideLayoutOpen(false)}
          onInsert={(slide) => {
            insertSlide(slide);
            setSlideLayoutOpen(false);
          }}
        />
      ) : null}

      {themeOpen ? (
        <DeckThemeDrawer onClose={() => setThemeOpen(false)} />
      ) : null}

      {presenting ? (
        <PresentationMode
          deck={deck}
          startIndex={active}
          onClose={() => setPresenting(false)}
        />
      ) : null}

      <HiddenExportStages
        slides={deck.slides}
        exportStageRefs={exportStageRefs}
      />
    </div>
  );
}

function TemplateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <select
      aria-label="Deck template"
      value={value}
      onChange={onChange}
      style={templateSelectStyle}
      title="Choose a deck template"
    >
      {TEMPLATES.map((template) => (
        <option key={template.id} value={template.id}>
          {template.label}
        </option>
      ))}
    </select>
  );
}

function getTemplateIdForDeck(deck: Deck) {
  return (
    TEMPLATES.find((template) => template.deck === deck)?.id ??
    TEMPLATES.find((template) => template.deck.title === deck.title)?.id ??
    TEMPLATES[0].id
  );
}

function useEditorHotkeys() {
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);

  useHotkey("Mod+Z", (event) => {
    event.preventDefault();
    undo();
  });
  useHotkey("Mod+Shift+Z", (event) => {
    event.preventDefault();
    redo();
  });
  useHotkey("Mod+Y", (event) => {
    event.preventDefault();
    redo();
  });
}

const templateSelectStyle = {
  ...styles.input,
  width: 190,
  height: 36,
  padding: "0 10px",
  fontWeight: 700,
} satisfies CSSProperties;
