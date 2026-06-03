"use client";

import { Sparkles, X } from "lucide-react";
import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { editorTheme, styles } from "../editorStyles";

export type GenerationTemplateOption = {
  id: string;
  label: string;
  description: string;
};

export type SlideGenerationInput = {
  description: string;
  slideCount: number;
  templateId: string;
};

export function GenerateSlidesModal({
  initialTemplateId,
  generating,
  templates,
  onClose,
  onGenerate,
}: {
  initialTemplateId: string;
  generating: boolean;
  templates: ReadonlyArray<GenerationTemplateOption>;
  onClose: () => void;
  onGenerate: (input: SlideGenerationInput) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [slideCount, setSlideCount] = useState(6);
  const [templateId, setTemplateId] = useState(initialTemplateId);

  useEffect(() => {
    setTemplateId(initialTemplateId);
  }, [initialTemplateId]);

  const canGenerate = description.trim().length >= 8 && !generating;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGenerate) return;
    await onGenerate({
      description: description.trim(),
      slideCount,
      templateId,
    });
  };

  return (
    <div style={modalStyles.backdrop} role="presentation">
      <form
        aria-label="Generate slides"
        onSubmit={handleSubmit}
        style={modalStyles.dialog}
      >
        <div style={modalStyles.header}>
          <div>
            <div style={styles.eyebrow}>GENERATE</div>
            <h2 style={modalStyles.title}>Slides</h2>
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            disabled={generating}
            style={modalStyles.iconButton}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <label style={styles.field}>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Quarterly product strategy for a leadership review..."
            rows={7}
            maxLength={4000}
            style={{ ...styles.textarea, minHeight: 150 }}
          />
        </label>

        <div style={modalStyles.row}>
          <label style={styles.field}>
            Slides
            <input
              type="number"
              min={1}
              max={20}
              value={slideCount}
              onChange={(event) =>
                setSlideCount(clamp(Number(event.target.value), 1, 20))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.field}>
            Template
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              style={styles.input}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={modalStyles.templateDescription}>
          {templates.find((template) => template.id === templateId)
            ?.description ?? ""}
        </div>

        <div style={modalStyles.actions}>
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            style={styles.ghostButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canGenerate}
            style={{
              ...styles.primaryButton,
              opacity: canGenerate ? 1 : 0.62,
              cursor: canGenerate ? "pointer" : "not-allowed",
            }}
          >
            <Sparkles size={16} aria-hidden="true" />
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

const modalStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(25,25,25,0.36)",
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  dialog: {
    width: "min(620px, 100%)",
    maxHeight: "min(720px, calc(100dvh - 48px))",
    overflowY: "auto",
    borderRadius: 8,
    border: `1px solid ${editorTheme.borderStrong}`,
    background: editorTheme.surface,
    boxShadow: "0 24px 70px rgba(16,19,35,0.22)",
    padding: 22,
    display: "grid",
    gap: 16,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    margin: "3px 0 0",
    color: editorTheme.text,
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 800,
  },
  iconButton: {
    width: 34,
    height: 34,
    display: "grid",
    placeItems: "center",
    borderRadius: 8,
    border: `1px solid ${editorTheme.border}`,
    background: editorTheme.surfaceSubtle,
    color: editorTheme.text,
    cursor: "pointer",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 12,
  },
  templateDescription: {
    minHeight: 34,
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${editorTheme.border}`,
    background: editorTheme.surfaceSubtle,
    color: editorTheme.mutedStrong,
    fontSize: 12,
    lineHeight: 1.35,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
} satisfies Record<string, CSSProperties>;
