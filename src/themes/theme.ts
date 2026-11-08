import type { ThemeV2 } from "@lumphammer/investigator-fvtt-types";

import { globalCss } from "../components/frame";
import { compileCatalogue } from "./catalogue/compileCatalogue";
import { catalogueFromV1 } from "./catalogue/fromV1";
import type { CatalogueOverrides } from "./catalogue/overrides";
import {
  optionalPaletteKeys as optionalPalette,
  type Palette,
  paletteFromV1,
  requiredPaletteKeys as requiredPalette,
  resolvePalette,
} from "./palette";
import type { ThemeV1 } from "./types";

/**
 * A theme, ready to style a sheet: what every installed theme becomes, V1 or
 * V2, and the only kind the rest of the code sees (docs/theming.md).
 */
export interface Theme {
  displayName: string;
  description?: string;
  /** The palette, complete. */
  palette: Palette;
  /** Its catalogue overrides, by class name (`catalogueOverridesCss`). */
  catalogue: CatalogueOverrides;
  /** Raw CSS, in the themed root. */
  globalCss: string;
}

/** Type-checks a V2 theme: the built-in themes are defined with it. */
export const defineThemeV2 = (theme: ThemeV2) => theme;

const fromV1 = new WeakMap<ThemeV1, Theme>();

/**
 * A V1 theme (as `themeFactory` made it from its seed) as a theme: its
 * palette from `paletteFromV1`, and its styles as a V2 catalogue from
 * `fromV1`, compiled as a V2 theme's is. The same theme for the same V1
 * theme.
 */
export function themeFromV1(theme: ThemeV1): Theme {
  let result = fromV1.get(theme);
  if (!result) {
    result = {
      displayName: theme.displayName,
      palette: paletteFromV1(theme),
      // V1's values are CSS as written, palette names or not
      catalogue: compileCatalogue(catalogueFromV1(theme), undefined, {
        literal: true,
      }),
      globalCss: globalCss(theme.global),
    };
    fromV1.set(theme, result);
  }
  return result;
}

/** A V2 theme as a theme: its palette completed, its catalogue compiled. */
export function themeFromV2(theme: ThemeV2): Theme {
  return {
    displayName: theme.displayName,
    description: theme.description,
    palette: resolvePalette(theme.palette),
    catalogue: compileCatalogue(theme.catalogue ?? {}),
    globalCss: theme.globalCss ?? "",
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const topLevel = new Set([
  "schemaVersion",
  "displayName",
  "description",
  "palette",
  "catalogue",
  "globalCss",
]);

/**
 * A V2 theme from somewhere untyped (a theme file, another module), checked:
 * a theme whose shape is wrong is refused, with an error that says why.
 * (Its catalogue's overrides are checked one by one when it's compiled, and
 * a bad one is left out, with a warning.)
 */
export function validateThemeV2(
  theme: unknown,
  warn: (message: string) => void = (message) =>
    console.warn(`Theme: ${message}`),
): ThemeV2 {
  const problems: string[] = [];
  if (!isObject(theme)) throw new Error("A theme has to be an object");
  if (theme["schemaVersion"] !== "v2") {
    problems.push(
      `schemaVersion is ${JSON.stringify(theme["schemaVersion"])}, not "v2"`,
    );
  }
  if (typeof theme["displayName"] !== "string" || theme["displayName"] === "") {
    problems.push("displayName has to be a string, and not empty");
  }
  for (const key of ["description", "globalCss"]) {
    if (theme[key] !== undefined && typeof theme[key] !== "string") {
      problems.push(`${key} has to be a string`);
    }
  }
  if (theme["catalogue"] !== undefined && !isObject(theme["catalogue"])) {
    problems.push("catalogue has to be an object");
  }
  const palette = theme["palette"];
  if (!isObject(palette)) {
    problems.push("palette has to be an object");
  } else {
    if (palette["polarity"] !== "light" && palette["polarity"] !== "dark") {
      problems.push('palette.polarity has to be "light" or "dark"');
    }
    for (const key of requiredPalette) {
      if (typeof palette[key] !== "string" || palette[key] === "") {
        problems.push(`palette.${key} has to be a string, and not empty`);
      }
    }
    for (const key of optionalPalette) {
      if (palette[key] !== undefined && typeof palette[key] !== "string") {
        problems.push(`palette.${key} has to be a string`);
      }
    }
    for (const key of Object.keys(palette)) {
      if (
        key !== "polarity" &&
        !(requiredPalette as readonly string[]).includes(key) &&
        !(optionalPalette as readonly string[]).includes(key)
      ) {
        warn(`palette.${key} isn't a palette entry, so it's ignored`);
      }
    }
  }
  for (const key of Object.keys(theme)) {
    if (!topLevel.has(key)) {
      warn(`${key} isn't part of a theme, so it's ignored`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`This isn't a V2 theme: ${problems.join("; ")}`);
  }
  return theme as unknown as ThemeV2;
}
