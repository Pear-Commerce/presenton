import { useAtom, useAtomValue } from "jotai";
import { FileText, Palette, Play, Save } from "lucide-react";
import type { ReactNode } from "react";
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
  onOpenTheme: () => void;
  toolbarLeading?: ReactNode;
};

export function EditorTopbar({
  exportingType,
  onExport,
  onPdfExport,
  onOpenTheme,
  toolbarLeading,
}: EditorTopbarProps) {
  const deck = useAtomValue(deckAtom);
  const active = useAtomValue(activeSlideIndexAtom);
  const activeSlide = useAtomValue(activeSlideAtom);
  const isExporting = useAtomValue(isExportingAtom);
  const [exportMode, setExportMode] = useAtom(exportModeAtom);
  const [, setPresenting] = useAtom(presentingAtom);
  const handleSave = () => {
    console.log(JSON.stringify(deck, null, 2));
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
        {toolbarLeading}
        <button
          type="button"
          onClick={handleSave}
          style={styles.primaryButton}
          title="Log current deck JSON"
        >
          <Save size={15} aria-hidden="true" />
          Save
        </button>
        <button
          type="button"
          onClick={onOpenTheme}
          style={styles.ghostButton}
          title="Configure deck theme"
        >
          <Palette size={15} aria-hidden="true" />
          Theme
        </button>
        <button
          type="button"
          onClick={() => setPresenting(true)}
          style={styles.ghostButton}
          title="Start presentation (fullscreen)"
        >
          <Play size={15} aria-hidden="true" />
          Slide Show
        </button>
        <button
          type="button"
          disabled={isExporting}
          onClick={onPdfExport}
          style={styles.secondaryButton}
        >
          <FileText size={15} aria-hidden="true" />
          {exportingType === "pdf" ? "Exporting PDF..." : "Export PDF"}
        </button>
        <ExportPptxButton
          mode={exportMode}
          onModeChange={setExportMode}
          onExport={onExport}
          isExporting={isExporting}
          exportingLabel={exportingType === "pptx" ? "Exporting PPTX..." : null}
        />
      </div>
    </div>
  );
}
