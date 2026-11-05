import { irid } from "../irid/irid";
import type { ThemeV1 } from "./types";

/**
 * A theme's palette: the values that catalogue classes are built from. Each
 * entry has one meaning, summarised here; `docs/theming.md` has the full
 * contract. Call sites never read these: only catalogue classes do.
 */
export interface Palette {
  /** Whether the theme is light or dark. Sets `color-scheme`. */
  polarity: "light" | "dark";
  /** The colour the sheet's backdrop averages to; surfaces are flattened over it. */
  wallpaper: string;
  /** What content sits on. Any colour, solid or translucent. */
  surface: string;
  /** What content inside content sits on. */
  surfaceNested: string;
  /** (derived) `surface` flattened over `wallpaper`, for things that overlap other content. */
  surfaceSolid: string;
  /** (derived) `surfaceNested` flattened over `wallpaper`. */
  surfaceNestedSolid: string;
  /** The fill of controls: buttons, toggle tracks. */
  control: string;
  /** The default ink. Legible on `surface`, `surfaceNested` and `control`. */
  text: string;
  /** Ink for secondary information: notes, empty states, inactive rows. */
  textMuted: string;
  /** Ink for links within prose. Not for other clickable things. */
  link: string;
  /** "Selected" or "call to action". Not for "clickable". */
  accent: string;
  /** Ink on an `accent` fill. */
  onAccent: string;
  /** The colour of hover, focus and drag-over feedback. Never state or decoration. */
  feedback: string;
  /** Structural lines: control outlines, separators, heading rules. */
  line: string;
  /** Something bad or destructive. Legible as text on surfaces. */
  danger: string;
  /** Ink on a `danger` fill. */
  onDanger: string;
  /** Something that needs attention, less serious than `danger`. */
  warning: string;
  /** Ink on a `warning` fill. */
  onWarning: string;
  /** Something that went well. */
  success: string;
  /** Ink on a `success` fill. */
  onSuccess: string;
  /** Neutral information. */
  info: string;
  /** Ink on an `info` fill. */
  onInfo: string;
  /** The one corner radius shared by classes. */
  radius: string;
  /** The shadow for anything floating. */
  elevation: string;
  /** The `body` text style's font (a CSS `font` value): prose and controls. */
  bodyFont: string;
  /** The `display` text style's font (a CSS `font` value): titles, headings, tabs, labels. */
  displayFont: string;
  /** The `display` text style's case (a CSS `text-transform` value). */
  displayCase: string;
  /** The `display` text style's letter spacing. */
  displayLetterSpacing: string;
}

/** The custom property a palette entry is set in, e.g. `--inv-surface-nested`. */
export const paletteVar = (key: Exclude<keyof Palette, "polarity">) =>
  `--inv-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** Black or white, whichever reads better on `color`. */
function inkOn(color: string, fallback: string) {
  try {
    return irid(color).contrast("#000", "#fff").toHexString();
  } catch {
    return fallback;
  }
}

function polarityOf(text: string): Palette["polarity"] {
  try {
    // light ink means a dark theme
    return irid(text).relativeLuminance() > 0.5 ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Work out a palette from a V1 theme. It should change nothing about how
 * anything looks: entries that V1 doesn't have get values that match what the
 * components do today.
 */
export function paletteFromV1(theme: ThemeV1): Palette {
  const { colors } = theme;
  const info = "#2b6cb0";
  return {
    polarity: polarityOf(colors.text),
    wallpaper: colors.wallpaper,
    surface: colors.backgroundPrimary,
    surfaceNested: colors.backgroundSecondary,
    surfaceSolid: colors.bgOpaquePrimary,
    surfaceNestedSolid: colors.bgOpaqueSecondary,
    control: colors.backgroundButton,
    text: colors.text,
    textMuted: `color-mix(in srgb, ${colors.text} 70%, ${colors.bgOpaquePrimary})`,
    link: colors.accent,
    accent: colors.accent,
    onAccent: colors.accentContrast,
    feedback: colors.glow,
    line: colors.controlBorder,
    danger: colors.danger,
    onDanger: inkOn(colors.danger, "#fff"),
    warning: colors.warning,
    onWarning: inkOn(colors.warning, "#000"),
    success: colors.success,
    onSuccess: inkOn(colors.success, "#fff"),
    info,
    onInfo: inkOn(info, "#fff"),
    radius: "0.25em",
    elevation: "0 0 0.5em black",
    bodyFont: theme.bodyFont ?? "inherit",
    displayFont: theme.displayFont ?? "inherit",
    displayCase: String(theme.displayFontTextTransform ?? "none"),
    displayLetterSpacing: "normal",
  };
}

/**
 * A palette as an inline style for a themed root: each entry as a custom
 * property, and `polarity` as `color-scheme`. Inline, so a detached window,
 * which copies the page's stylesheets but not what's been inserted into them,
 * still gets it.
 */
export function paletteStyle(palette: Palette): Record<string, string> {
  const { polarity, ...rest } = palette;
  return {
    colorScheme: polarity,
    ...Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [
        paletteVar(key as keyof typeof rest),
        value,
      ]),
    ),
  };
}

/** A stable id for a theme, for `data-inv-theme`. */
export const themeSlug = (theme: ThemeV1) =>
  theme.displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
