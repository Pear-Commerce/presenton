// Sentinel `objectName` values we stamp on exported PPTX shapes so a
// round-trip back through `importPptxFile` can recover the original
// element kind. PowerPoint preserves `<p:cNvPr name="...">` losslessly,
// which is what `objectName` in pptxgenjs maps to.

export const PPTY_IMAGE_PLACEHOLDER_TAG = "ppty:image-placeholder";

// Path of the JSON sidecar we add to exported `.pptx` files. PowerPoint
// (and other PPTX consumers) ignore files not listed in
// `[Content_Types].xml`, so this rides along harmlessly. Our importer
// trusts the sidecar when present for perfect lossless round-tripping —
// any element kind (chart, table, custom shape) that PPTX can't express
// cleanly is recovered from here instead of the OOXML XML.
export const PPTY_DECK_SIDECAR_PATH = "ppty/deck.json";
