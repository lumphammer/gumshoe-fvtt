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
  /** The colour the sheet's backdrop averages to, shown while images load. */
  wallpaper: string;
  /**
   * What content sits on. Expected to be opaque, as things that overlap
   * other content (menus, sticky headers) sit on it too. Not enforced: a
   * translucent one works if the theme keeps those things opaque with
   * overrides.
   */
  surface: string;
  /** What content inside content sits on. Expected to be opaque, like `surface`. */
  surfaceNested: string;
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

/** The palette's colours: Panda's `colors` tokens. */
export const paletteColorKeys = [
  "wallpaper",
  "surface",
  "surfaceNested",
  "control",
  "text",
  "textMuted",
  "link",
  "accent",
  "onAccent",
  "feedback",
  "line",
  "danger",
  "onDanger",
  "warning",
  "onWarning",
  "success",
  "onSuccess",
  "info",
  "onInfo",
] as const satisfies readonly (keyof Palette)[];

/** The custom property a palette entry is set in, e.g. `--inv-surface-nested`. */
export const paletteVar = (key: Exclude<keyof Palette, "polarity">) =>
  `--inv-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

const channel = (value: string, percent: string, max: number) =>
  percent ? (Number(value) / 100) * max : Number(value);

/**
 * A colour's sRGB channels (0 to 255), or null if it isn't one we can read as
 * sRGB: Irid's hex, named and comma-separated colours, and space-separated
 * `rgb()`.
 */
function sRgbOf(color: string): [number, number, number] | null {
  try {
    const { r, g, b } = irid(color).rgb;
    return [r, g, b];
  } catch {
    // not one Irid reads
  }
  const css = color.trim().toLowerCase();
  const rgb = /^rgba?\(\s*([\d.]+)(%?)\s+([\d.]+)(%?)\s+([\d.]+)(%?)/.exec(css);
  if (!rgb) return null;
  const [r, g, b] = [1, 3, 5].map((i) =>
    Math.round(channel(rgb[i], rgb[i + 1], 255)),
  );
  return [r, g, b];
}

/**
 * A colour's relative luminance (0 is black, 1 is white), or null if we can't
 * tell. Irid reads hex, named and comma-separated colours; this also reads
 * space-separated `rgb()`, and the lightness of `oklch()`, `oklab()`, `lch()`
 * and `lab()`.
 */
export function luminanceOf(color: string): number | null {
  const rgb = sRgbOf(color);
  if (rgb) return irid(`rgb(${rgb.join(", ")})`).relativeLuminance();
  const css = color.trim().toLowerCase();
  const ok = /^okl(?:ch|ab)\(\s*([\d.]+)(%?)/.exec(css);
  if (ok) {
    // OKLab's lightness is roughly the cube root of luminance
    return channel(ok[1], ok[2], 1) ** 3;
  }
  const lab = /^l(?:ch|ab)\(\s*([\d.]+)(%?)/.exec(css);
  if (lab) {
    // CIE L* to luminance
    const l = channel(lab[1], lab[2], 100);
    return l > 8 ? ((l + 16) / 116) ** 3 : l / 903.3;
  }
  return null;
}

/** Whether black reads better than white on a colour of this luminance. */
const blackReadsBetter = (luminance: number) =>
  // contrast ratio with black vs with white (WCAG)
  (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05);

/**
 * APCA's lightness contrast (Lc, about -108 to 106) of text on a background,
 * from their luminances: the perceptual model being developed for WCAG 3
 * (SAPC 0.0.98G constants), with luminances from `apcaLuminanceOf`. Unlike WCAG 2's contrast ratio, it doesn't
 * overrate dark text on saturated mid-tones: on pure red, WCAG 2 prefers
 * black (5.25:1 to 4:1), but white reads far better, and APCA agrees (Lc 70
 * to 40).
 */
export function apcaContrast(text: number, background: number) {
  const clamp = (y: number) => (y < 0.022 ? y + (0.022 - y) ** 1.414 : y);
  const [t, b] = [clamp(text), clamp(background)];
  if (b > t) {
    const sapc = (b ** 0.56 - t ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (b ** 0.65 - t ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
}

/**
 * A colour's luminance as APCA works it out: its sRGB channels to the power
 * 2.4, not WCAG's piecewise curve, which can flip a close choice of ink.
 * Colours we can't read as sRGB fall back to their relative luminance.
 */
function apcaLuminanceOf(color: string): number | null {
  const rgb = sRgbOf(color);
  if (!rgb) return luminanceOf(color);
  const [r, g, b] = rgb.map((c) => (c / 255) ** 2.4);
  return 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
}

/** Black or white, whichever reads better on `color` (APCA). */
function inkOn(color: string, fallback: string) {
  const luminance = apcaLuminanceOf(color);
  if (luminance === null) return fallback;
  return Math.abs(apcaContrast(0, luminance)) >=
    Math.abs(apcaContrast(1, luminance))
    ? "#000000"
    : "#ffffff";
}

/** Light ink means a dark theme. */
function polarityOf(text: string): Palette["polarity"] {
  const luminance = luminanceOf(text);
  return luminance !== null && blackReadsBetter(luminance) ? "dark" : "light";
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
    // V1's surfaces can be translucent, which the palette's aren't: `fromV1`
    // puts V1's flattened ones (`bgOpaque*`) where things overlap content
    surface: colors.backgroundPrimary,
    surfaceNested: colors.backgroundSecondary,
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

const slugs = new WeakMap<ThemeV1, string>();
let themeCount = 0;

/**
 * An id for a theme, for `data-inv-theme`, which scopes its catalogue
 * overrides: readable (from its display name), and unique to the theme, so
 * two themes whose names come out the same ("My Theme", "My-Theme", or two
 * names in a script with no Latin letters) never style each other's sheets.
 */
export const themeSlug = (theme: ThemeV1) => {
  let slug = slugs.get(theme);
  if (slug === undefined) {
    const name = theme.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    themeCount += 1;
    slug = `${name || "theme"}-${themeCount}`;
    slugs.set(theme, slug);
  }
  return slug;
};
