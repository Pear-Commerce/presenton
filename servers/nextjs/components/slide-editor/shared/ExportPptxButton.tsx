import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { styles } from "../editorStyles";
import type { ExportMode } from "../state";

const OPTIONS: Array<{
  id: ExportMode;
  label: string;
  description: string;
}> = [
  {
    id: "native",
    label: "Native PPTX",
    description: "Native editable charts for PowerPoint and Google Slides",
  },
  {
    id: "keynote",
    label: "Keynote PPTX",
    description: "Charts as editable shapes for Keynote compatibility",
  },
  {
    id: "raster",
    label: "Rasterized PPTX",
    description: "Pixel-perfect but flat images per slide",
  },
];

export function ExportPptxButton({
  mode,
  onModeChange,
  onExport,
  onPdfExport,
  isExporting,
  exportingType,
}: {
  mode: ExportMode;
  onModeChange: (mode: ExportMode) => void;
  onExport: (mode?: ExportMode) => void;
  onPdfExport: () => void;
  isExporting: boolean;
  exportingType: "pptx" | "pdf" | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const exportLabel = exportingType ? "Exporting..." : "Export";

  return (
    <div ref={wrapperRef} style={styles.splitButton}>
      <button
        type="button"
        disabled={isExporting}
        onClick={() => setOpen((value) => !value)}
        style={styles.splitButtonMain}
        title="Export deck"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={15} aria-hidden="true" />
        {exportLabel}
      </button>
      <button
        type="button"
        disabled={isExporting}
        onClick={() => setOpen((value) => !value)}
        style={styles.splitButtonCaret}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Choose export type"
      >
        ▾
      </button>
      {open ? (
        <div role="menu" style={styles.exportMenu}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onPdfExport();
            }}
            style={styles.exportMenuItem}
          >
            <div style={styles.exportMenuItemHeader}>
              <span style={styles.exportMenuItemLabel}>PDF</span>
            </div>
            <div style={styles.exportMenuItemDesc}>
              Render slides from the current editor surface
            </div>
          </button>
          {OPTIONS.map((option) => {
            const selected = option.id === mode;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onModeChange(option.id);
                  setOpen(false);
                  onExport(option.id);
                }}
                style={{
                  ...styles.exportMenuItem,
                  ...(selected ? styles.exportMenuItemActive : null),
                }}
              >
                <div style={styles.exportMenuItemHeader}>
                  <span style={styles.exportMenuItemLabel}>{option.label}</span>
                  {selected ? <span style={styles.exportMenuItemCheck}>✓</span> : null}
                </div>
                <div style={styles.exportMenuItemDesc}>{option.description}</div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
