import { useAtomValue, useSetAtom } from "jotai";
import {
  DECK_THEME_PRESETS,
  resolveDeckTheme,
  type DeckTheme,
} from "../lib/deck-theme";
import { editorTheme, styles } from "../editorStyles";
import { withHash, withoutHash } from "../editorUtils";
import {
  applyDeckThemePresetAtom,
  deckAtom,
  updateDeckThemeColorAtom,
} from "../state";
import { drawerStyles } from "./drawerStyles";

type DeckThemeDrawerProps = {
  onClose: () => void;
};

const THEME_FIELDS = [
  ["background", "Background"],
  ["surface", "Surface"],
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["accent", "Accent"],
  ["text", "Text"],
  ["muted", "Muted"],
] as const satisfies ReadonlyArray<readonly [keyof DeckTheme, string]>;

export function DeckThemeDrawer({ onClose }: DeckThemeDrawerProps) {
  const deck = useAtomValue(deckAtom);
  const deckTheme = resolveDeckTheme(deck);
  const updateDeckThemeColor = useSetAtom(updateDeckThemeColorAtom);
  const applyDeckThemePreset = useSetAtom(applyDeckThemePresetAtom);
  const activePresetId = DECK_THEME_PRESETS.find((preset) =>
    sameTheme(preset.theme, deckTheme),
  )?.id;

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={drawerStyles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside style={drawerStyles.themeDrawer}>
        <div style={drawerStyles.header}>
          <div>
            <div style={styles.eyebrow}>DECK SETTINGS</div>
            <h2 style={drawerStyles.title}>Theme</h2>
          </div>
          <button
            type="button"
            title="Close theme"
            onClick={onClose}
            style={drawerStyles.iconButton}
          >
            ×
          </button>
        </div>

        <div style={drawerStyles.hint}>
          Updates semantic theme roles across the entire deck. Older untagged
          colors are matched by hex as a fallback.
        </div>

        <div style={drawerStyles.themePanel}>
          <div style={styles.field}>
            <span>Presets</span>
            <div style={presetRowStyle}>
              {DECK_THEME_PRESETS.map((preset) => {
                const isActive = preset.id === activePresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.label}
                    aria-pressed={isActive}
                    onClick={() =>
                      applyDeckThemePreset({
                        id: preset.id,
                        theme: preset.theme,
                      })
                    }
                    style={{
                      ...presetButtonStyle,
                      borderColor: isActive ? editorTheme.primary : editorTheme.border,
                      boxShadow: isActive
                        ? `0 0 0 1px ${editorTheme.primary} inset`
                        : "none",
                    }}
                  >
                    <ThemeSwatch theme={preset.theme} />
                    <span style={presetLabelStyle}>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={drawerStyles.themeGrid}>
            {THEME_FIELDS.map(([key, label]) => (
              <label key={key} style={styles.field}>
                <span>{label}</span>
                <input
                  type="color"
                  value={withHash(deckTheme[key])}
                  onChange={(event) =>
                    updateDeckThemeColor({
                      key,
                      value: withoutHash(event.target.value),
                    })
                  }
                  style={styles.colorInput}
                />
              </label>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ThemeSwatch({ theme }: { theme: DeckTheme }) {
  const stops: Array<keyof DeckTheme> = [
    "background",
    "surface",
    "primary",
    "secondary",
    "accent",
    "text",
  ];
  return (
    <div style={swatchRowStyle}>
      {stops.map((key) => (
        <span
          key={key}
          style={{
            ...swatchStopStyle,
            background: withHash(theme[key] ?? "FFFFFF"),
          }}
        />
      ))}
    </div>
  );
}

function sameTheme(a: DeckTheme, b: DeckTheme): boolean {
  const keys: Array<keyof DeckTheme> = [
    "background",
    "surface",
    "primary",
    "secondary",
    "accent",
    "text",
    "muted",
  ];
  return keys.every((key) => a[key].toUpperCase() === b[key].toUpperCase());
}

const presetRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: 8,
} as const;

const presetButtonStyle = {
  display: "grid",
  gap: 6,
  padding: "8px 9px",
  borderRadius: 7,
  border: `1px solid ${editorTheme.border}`,
  background: editorTheme.surface,
  color: editorTheme.text,
  cursor: "pointer",
  textAlign: "left",
} as const;

const presetLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
} as const;

const swatchRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 3,
  height: 16,
  borderRadius: 4,
  overflow: "hidden",
} as const;

const swatchStopStyle = {
  width: "100%",
  height: "100%",
} as const;
