import type { Deck, SlideElement, ThemeRole } from "./slide-schema";

export type DeckTheme = Record<ThemeRole, string>;

export const DEFAULT_DECK_THEME: DeckTheme = {
  background: "F4F6FA",
  surface: "FFFFFF",
  primary: "0B1F3A",
  secondary: "3E78B2",
  accent: "D4A24C",
  text: "1A2B45",
  muted: "6A7894",
};

export type DeckThemePreset = {
  id: string;
  label: string;
  theme: DeckTheme;
};

export const DECK_THEME_PRESETS: ReadonlyArray<DeckThemePreset> = [
  {
    id: "navy-gold",
    label: "Navy Gold",
    theme: {
      background: "F4F6FA",
      surface: "FFFFFF",
      primary: "0B1F3A",
      secondary: "3E78B2",
      accent: "D4A24C",
      text: "1A2B45",
      muted: "6A7894",
    },
  },
  {
    id: "mono-slate",
    label: "Mono Slate",
    theme: {
      background: "F4F5F7",
      surface: "FFFFFF",
      primary: "1F2937",
      secondary: "4B5563",
      accent: "E5B95F",
      text: "0F172A",
      muted: "6B7280",
    },
  },
  {
    id: "forest",
    label: "Forest",
    theme: {
      background: "F2F5F2",
      surface: "FFFFFF",
      primary: "14532D",
      secondary: "2F855A",
      accent: "E0B044",
      text: "1A2E22",
      muted: "6B8076",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    theme: {
      background: "FFF6EE",
      surface: "FFFFFF",
      primary: "7A1F1F",
      secondary: "D14E2A",
      accent: "F4A93C",
      text: "2A1310",
      muted: "8B6F65",
    },
  },
  {
    id: "indigo-ink",
    label: "Indigo Ink",
    theme: {
      background: "EEF0FA",
      surface: "FFFFFF",
      primary: "1E2148",
      secondary: "5B5EA6",
      accent: "F2C94C",
      text: "0E1230",
      muted: "696D8A",
    },
  },
  {
    id: "paperwhite",
    label: "Paperwhite",
    theme: {
      background: "FAFAFA",
      surface: "FFFFFF",
      primary: "111827",
      secondary: "4F46E5",
      accent: "EAB308",
      text: "0F172A",
      muted: "6B7280",
    },
  },
  {
    id: "sky",
    label: "Sky",
    theme: {
      background: "EFF6FC",
      surface: "FFFFFF",
      primary: "0F3D62",
      secondary: "2A6EA8",
      accent: "F28E2B",
      text: "14233A",
      muted: "6A7A8F",
    },
  },
  {
    id: "sage",
    label: "Sage",
    theme: {
      background: "F3F6F1",
      surface: "FFFFFF",
      primary: "2D4A3A",
      secondary: "5E8C72",
      accent: "C0894A",
      text: "1F2E25",
      muted: "70806B",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    theme: {
      background: "0A0F1E",
      surface: "1B2A47",
      primary: "0B1F3A",
      secondary: "75AADB",
      accent: "D4A24C",
      text: "F4F6FA",
      muted: "9AA7BD",
    },
  },
];

export function resolveDeckTheme(deck: Deck): DeckTheme {
  const raw = deck.theme;
  if (!raw) return { ...DEFAULT_DECK_THEME };
  return {
    background: raw.background ?? DEFAULT_DECK_THEME.background,
    surface: raw.surface ?? DEFAULT_DECK_THEME.surface,
    primary: raw.primary ?? DEFAULT_DECK_THEME.primary,
    secondary: raw.secondary ?? DEFAULT_DECK_THEME.secondary,
    accent: raw.accent ?? DEFAULT_DECK_THEME.accent,
    text: raw.text ?? DEFAULT_DECK_THEME.text,
    muted: raw.muted ?? DEFAULT_DECK_THEME.muted,
  };
}

// Pure white and pure black get used as "just neutral" all over the deck
// (white headline text, black hairlines, etc). They're too ambiguous to
// safely repaint through the hex-fallback remap — doing so flips white
// headlines into the new surface color on dark→light theme swaps.
// Elements that genuinely want the themed surface/background should set
// `colorRole` explicitly, which still routes through `themedColor`.
const HEX_FALLBACK_BLOCKLIST = new Set(["FFFFFF", "000000"]);

export function applyDeckTheme(deck: Deck, nextTheme: DeckTheme): void {
  const currentTheme = resolveDeckTheme(deck);
  const colorMap = new Map<string, string>(
    (Object.keys(nextTheme) as ThemeRole[])
      .filter((key) => currentTheme[key] !== nextTheme[key])
      .map(
        (key): [string, string] => [
          currentTheme[key].toUpperCase(),
          nextTheme[key].toUpperCase(),
        ],
      )
      .filter(([from]) => !HEX_FALLBACK_BLOCKLIST.has(from)),
  );

  deck.theme = nextTheme;
  if (colorMap.size === 0) return;

  for (const slide of deck.slides) {
    slide.background = themedColor(
      slide.background,
      slide.backgroundRole,
      nextTheme,
      colorMap,
    );
    for (const element of slide.elements) applyElementTheme(element, nextTheme, colorMap);
  }
}

function applyElementTheme(
  element: SlideElement,
  theme: DeckTheme,
  colorMap: Map<string, string>,
): void {
  if (element.kind === "text") {
    element.color = themedColor(element.color, element.colorRole, theme, colorMap);
    return;
  }

  if (element.kind === "rect" || element.kind === "ellipse") {
    element.fill = themedColor(element.fill, element.fillRole, theme, colorMap);
    if (element.line) {
      element.line.color = themedColor(
        element.line.color,
        element.line.colorRole,
        theme,
        colorMap,
      );
    }
    return;
  }

  if (element.kind === "bullets") {
    element.color = themedColor(element.color, element.colorRole, theme, colorMap);
    if (element.bulletColor) {
      element.bulletColor = themedColor(
        element.bulletColor,
        element.bulletColorRole,
        theme,
        colorMap,
      );
    }
    return;
  }

  if (element.kind === "chart") {
    element.color = themedColor(element.color, element.colorRole, theme, colorMap);
    if (element.axisColor) {
      element.axisColor = themedColor(
        element.axisColor,
        element.axisColorRole,
        theme,
        colorMap,
      );
    }
    if (element.labelColor) {
      element.labelColor = themedColor(
        element.labelColor,
        element.labelColorRole,
        theme,
        colorMap,
      );
    }
    element.data.forEach((datum) => {
      if (datum.color) {
        datum.color = themedColor(datum.color, datum.colorRole, theme, colorMap);
      }
    });
    return;
  }

  if (element.kind === "table") {
    element.textColor = themedColor(
      element.textColor,
      element.textColorRole,
      theme,
      colorMap,
    );
    element.headerFill = themedColor(
      element.headerFill,
      element.headerFillRole,
      theme,
      colorMap,
    );
    element.headerTextColor = themedColor(
      element.headerTextColor,
      element.headerTextColorRole,
      theme,
      colorMap,
    );
    element.borderColor = themedColor(
      element.borderColor,
      element.borderColorRole,
      theme,
      colorMap,
    );
    if (element.fill) {
      element.fill = themedColor(element.fill, element.fillRole, theme, colorMap);
    }
    return;
  }

  if (element.kind === "svg") {
    element.svg = mapSvgColors(element.svg, colorMap);
  }
}

function themedColor(
  color: string,
  role: ThemeRole | null | undefined,
  theme: DeckTheme,
  colorMap: Map<string, string>,
): string {
  if (role) return theme[role];
  return mapColor(color, colorMap);
}

function mapColor(color: string, colorMap: Map<string, string>): string {
  const normalized = color.replace("#", "").toUpperCase();
  return colorMap.get(normalized) ?? color;
}

function mapSvgColors(svg: string, colorMap: Map<string, string>): string {
  let next = svg;
  for (const [from, to] of colorMap) {
    next = next.replace(new RegExp(`#${from}\\b`, "gi"), `#${to}`);
  }
  return next;
}
