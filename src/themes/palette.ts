import type { ThemePalette } from "@lumphammer/investigator-fvtt-types";

/**
 * A theme's palette is the values that catalogue classes are built from, each
 * with one meaning (`ThemePalette` in the types package has them;
 * `docs/theming.md` has the full contract). Call sites never read these:
 * only catalogue classes do (and `CardArray`, its spacing).
 *
 * A theme sets the required entries; `palette.css` works out the rest.
 */
type PaletteKey = Exclude<keyof ThemePalette, "polarity">;

/** The entries a theme's palette has to have (besides `polarity`). */
export const requiredPaletteKeys = [
  "wallpaper",
  "surface",
  "surfaceNested",
  "control",
  "text",
  "accent",
  "line",
  "feedback",
  "danger",
  "warning",
  "success",
  "info",
] as const satisfies readonly PaletteKey[];

/** The entries a theme's palette can leave out: `palette.css` has defaults. */
export const optionalPaletteKeys = [
  "surfaceSolid",
  "surfaceNestedSolid",
  "textMuted",
  "link",
  "onAccent",
  "onDanger",
  "onWarning",
  "onSuccess",
  "onInfo",
  "radius",
  "elevation",
  "bodyFont",
  "displayFont",
  "displayCase",
  "displayLetterSpacing",
  "cardGap",
] as const satisfies readonly PaletteKey[];

/** The palette's colours: Panda's `colors` tokens. */
export const paletteColorKeys = [
  "wallpaper",
  "surface",
  "surfaceNested",
  "surfaceSolid",
  "surfaceNestedSolid",
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
] as const satisfies readonly PaletteKey[];

/** The custom property a palette entry is set in, e.g. `--inv-surface-nested`. */
export const paletteVar = (key: PaletteKey) =>
  `--inv-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/**
 * A palette as an inline style for a themed root: each entry the theme sets
 * as a custom property, and `polarity` as `color-scheme`. Inline, so a
 * detached window, which copies the page's stylesheets but not what's been
 * inserted into them, still gets it.
 */
export function paletteStyle(palette: ThemePalette): Record<string, string> {
  const style: Record<string, string> = { colorScheme: palette.polarity };
  for (const key of [...requiredPaletteKeys, ...optionalPaletteKeys]) {
    const value = palette[key];
    if (value !== undefined) style[paletteVar(key)] = value;
  }
  if (palette.cardGap !== undefined) {
    // the card gap's two axes, for what needs one of them (a column gap):
    // split at spaces, but not ones inside brackets
    const [row, column = row] = palette.cardGap.trim().split(/\s+(?![^(]*\))/);
    style["--inv-card-gap-row"] = row;
    style["--inv-card-gap-column"] = column;
  }
  return style;
}

const slugs = new WeakMap<{ displayName: string }, string>();
let themeCount = 0;

/**
 * An id for a theme, for `data-inv-theme` and `data-inv-frame`: readable
 * (from its display name), and unique to the theme, so two themes whose
 * names come out the same never style each other's windows.
 */
export const themeSlug = (theme: { displayName: string }) => {
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
