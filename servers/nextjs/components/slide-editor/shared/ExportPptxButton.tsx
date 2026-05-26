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
  isExporting,
  exportingLabel,
}: {
  mode: ExportMode;
  onModeChange: (mode: ExportMode) => void;
  onExport: (mode?: ExportMode) => void;
  isExporting: boolean;
  exportingLabel: string | null;
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

  const activeOption = OPTIONS.find((option) => option.id === mode) ?? OPTIONS[0];
  const activeLabel =
    activeOption.id === "native"
      ? "Native"
      : activeOption.id === "keynote"
        ? "Keynote"
        : "Raster";

  return (
    <div ref={wrapperRef} style={styles.splitButton}>
      <button
        type="button"
        disabled={isExporting}
        onClick={() => onExport()}
        style={styles.splitButtonMain}
        title={`Export as ${activeOption.label}`}
      >
        {exportingLabel ?? `Export PPTX · ${activeLabel}`}
      </button>
      <button
        type="button"
        disabled={isExporting}
        onClick={() => setOpen((value) => !value)}
        style={styles.splitButtonCaret}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Choose PPTX export type"
      >
        ▾
      </button>
      {open ? (
        <div role="menu" style={styles.exportMenu}>
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
