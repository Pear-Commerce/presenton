import { useAtom, useAtomValue } from "jotai";
import { FileText, FileUp, Palette, Play, Save } from "lucide-react";
import { useRef, type ChangeEvent, type ReactNode } from "react";
import { styles } from "../editorStyles";
import { truncateWords } from "../editorUtils";
import { ExportPptxButton } from "../shared/ExportPptxButton";
import {
  activeSlideAtom,
  activeSlideIndexAtom,
  deckAtom,
  exportModeAtom,
  isExportingAtom,
  presentingAtom,
} from "../state";
import { layoutStyles } from "./layoutStyles";

type EditorTopbarProps = {
  exportingType: "pptx" | "pdf" | null;
  onExport: () => void;
  onPdfExport: () => void;
  onImportPptx: (file: File) => void;
  onOpenTheme: () => void;
  importingPptx?: boolean;
  toolbarLeading?: ReactNode;
};

export function EditorTopbar({
  exportingType,
  importingPptx = false,
  onExport,
  onPdfExport,
  onImportPptx,
  onOpenTheme,
  toolbarLeading,
}: EditorTopbarProps) {
  const deck = useAtomValue(deckAtom);
  const active = useAtomValue(activeSlideIndexAtom);
  const activeSlide = useAtomValue(activeSlideAtom);
  const isExporting = useAtomValue(isExportingAtom);
  const [exportMode, setExportMode] = useAtom(exportModeAtom);
  const [, setPresenting] = useAtom(presentingAtom);
  const pptxInputRef = useRef<HTMLInputElement | null>(null);
  const handleSave = () => {
    console.log(JSON.stringify(deck, null, 2));
  };
  const handleImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onImportPptx(file);
  };

  return (
    <div style={layoutStyles.topbar}>
      <div style={layoutStyles.topbarTitle}>
        <div style={layoutStyles.currentTitle}>
          {activeSlide.title ?? `Slide ${active + 1}`}
        </div>
        <div style={layoutStyles.meta}>
          {deck.description
            ? truncateWords(deck.description, 6)
            : "React + Konva live preview; JSON remains the source of truth."}
        </div>
      </div>
      <div style={layoutStyles.toolbar}>
        {toolbarLeading ? (
          <div style={layoutStyles.toolbarGroup}>{toolbarLeading}</div>
        ) : null}
        <div style={layoutStyles.toolbarGroup}>
          <button
            type="button"
            onClick={handleSave}
            style={styles.toolbarPrimaryButton}
            title="Log current deck JSON"
          >
            <Save size={15} aria-hidden="true" />
            Save
          </button>
          <input
            ref={pptxInputRef}
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={handleImportChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            disabled={importingPptx}
            onClick={() => pptxInputRef.current?.click()}
            style={styles.toolbarSecondaryButton}
            title="Import PPTX"
          >
            <FileUp size={15} aria-hidden="true" />
            {importingPptx ? "Importing..." : "Import"}
          </button>
        </div>
        <div style={layoutStyles.toolbarGroup}>
          <button
            type="button"
            onClick={onOpenTheme}
            style={styles.toolbarButton}
            title="Configure deck theme"
          >
            <Palette size={15} aria-hidden="true" />
            Theme
          </button>
          <button
            type="button"
            onClick={() => setPresenting(true)}
            style={styles.toolbarButton}
            title="Start presentation"
          >
            <Play size={15} aria-hidden="true" />
            Present
          </button>
        </div>
        <div style={layoutStyles.toolbarGroup}>
          <button
            type="button"
            disabled={isExporting}
            onClick={onPdfExport}
            style={styles.toolbarSecondaryButton}
            title="Export PDF"
          >
            <FileText size={15} aria-hidden="true" />
            {exportingType === "pdf" ? "Exporting..." : "PDF"}
          </button>
          <ExportPptxButton
            mode={exportMode}
            onModeChange={setExportMode}
            onExport={onExport}
            isExporting={isExporting}
            exportingLabel={exportingType === "pptx" ? "Exporting..." : null}
          />
        </div>
      </div>
    </div>
  );
}
