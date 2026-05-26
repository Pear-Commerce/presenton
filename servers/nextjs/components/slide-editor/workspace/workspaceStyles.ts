import type { CSSProperties } from "react";
import { EXPORT_H, EXPORT_W } from "../editorUtils";
import { editorTheme } from "../editorStyles";

export const workspaceStyles = {
  workArea: {
    flex: 1,
    minHeight: 0,
    display: "flex",
  },
  stagePanel: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background:
      "linear-gradient(180deg, #FFFFFF 0%, #F7F6F9 100%)",
  },
  slideFrame: {
    position: "relative",
    flexShrink: 0,
  },
  slideEditButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 5,
    height: 34,
    padding: "0 14px",
    borderRadius: 8,
    border: `1px solid ${editorTheme.border}`,
    background: "rgba(255,255,255,0.92)",
    color: editorTheme.text,
    boxShadow: "0 10px 28px rgba(16,19,35,0.16)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  hiddenInput: {
    display: "none",
  },
  insertSlideButton: {
    height: 36,
    padding: "0 16px",
    borderRadius: 8,
    border: `1px solid ${editorTheme.border}`,
    background: editorTheme.surface,
    color: "#101323",
    boxShadow: "0 10px 28px rgba(16,19,35,0.12)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  hiddenStages: {
    position: "fixed",
    left: -10000,
    top: 0,
    width: EXPORT_W,
    height: EXPORT_H,
    overflow: "hidden",
    pointerEvents: "none",
  },
} satisfies Record<string, CSSProperties>;
