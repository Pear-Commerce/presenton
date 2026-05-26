import type Konva from "konva";
import { useAtomValue, useSetAtom } from "jotai";
import { useRef, useState } from "react";
import { SLIDE_H, SLIDE_W } from "../lib/slide-schema";
import { filenameFromTitle } from "../editorUtils";
import { waitForDeckExportAssets } from "../slide-surface/konva/exportAssets";
import {
  deckAtom,
  exportModeAtom,
  isExportingAtom,
  type ExportMode,
} from "../state";

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function useDeckExport() {
  const deck = useAtomValue(deckAtom);
  const exportMode = useAtomValue(exportModeAtom);
  const setIsExporting = useSetAtom(isExportingAtom);
  const exportStageRefs = useRef<Array<Konva.Stage | null>>([]);
  const [exportingType, setExportingType] = useState<"pptx" | "pdf" | null>(
    null,
  );

  const handleNativeExport = async () => {
    const { generatePptx } = await import("../lib/generatePptx");
    await generatePptx(deck, filenameFromTitle(deck.title));
  };

  const handleKeynoteExport = async () => {
    const { generatePptx } = await import("../lib/generatePptx");
    await generatePptx(deck, filenameFromTitle(deck.title, "-keynote"), {
      chartMode: "shapes",
    });
  };

  const handleRasterExport = async () => {
    const { default: PptxGenJS } = await import("pptxgenjs");
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "KONVA_16X9", width: SLIDE_W, height: SLIDE_H });
    pptx.layout = "KONVA_16X9";
    pptx.author = "ppty";
    pptx.subject = "Rasterized Konva deck";
    pptx.title = deck.title;

    for (let i = 0; i < deck.slides.length; i += 1) {
      const data = exportStageRefs.current[i]?.toDataURL({
        pixelRatio: 1,
        mimeType: "image/png",
      });
      const slide = pptx.addSlide();
      if (data) {
        slide.addImage({ data, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
      }
    }

    await pptx.writeFile({
      fileName: filenameFromTitle(deck.title, "-raster"),
    });
  };

  const handleExport = async (modeOverride?: ExportMode) => {
    const mode = modeOverride ?? exportMode;
    setIsExporting(true);
    setExportingType("pptx");
    try {
      if (mode === "native") {
        await handleNativeExport();
      } else if (mode === "keynote") {
        await handleKeynoteExport();
      } else {
        await waitForDeckExportAssets(deck);
        await waitForPaint();
        await handleRasterExport();
      }
    } finally {
      setExportingType(null);
      setIsExporting(false);
    }
  };

  const handlePdfExport = async () => {
    setIsExporting(true);
    setExportingType("pdf");
    try {
      await waitForDeckExportAssets(deck);
      await waitForPaint();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: [SLIDE_W, SLIDE_H],
        compress: true,
      });
      let hasSlides = false;

      deck.slides.forEach((_: any, index: number) => {
        const data = exportStageRefs.current[index]?.toDataURL({
          pixelRatio: 2,
          mimeType: "image/png",
        });
        if (!data) return;
        if (hasSlides) pdf.addPage([SLIDE_W, SLIDE_H], "landscape");
        pdf.addImage(data, "PNG", 0, 0, SLIDE_W, SLIDE_H);
        hasSlides = true;
      });
      if (!hasSlides) return;
      pdf.save(filenameFromTitle(deck.title, "", "pdf"));
    } finally {
      setExportingType(null);
      setIsExporting(false);
    }
  };

  return { exportStageRefs, exportingType, handleExport, handlePdfExport };
}
