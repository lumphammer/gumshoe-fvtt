import type {
  ThemePalette,
  ThemeV2,
} from "@lumphammer/investigator-fvtt-types";

import { globalCss } from "../components/frame";
import { systemId } from "../constants";
import { compileCatalogue } from "./catalogue/compileCatalogue";
import { catalogueFromV1 } from "./catalogue/fromV1";
import {
  optionalPaletteKeys,
  paletteFromV1,
  requiredPaletteKeys,
  resolvePalette,
} from "./palette";
import type { ThemeV1 } from "./types";

/**
 * A V1 theme as a V2 theme that looks the same: its palette from
 * `paletteFromV1` (leaving out what V2 would work out the same anyway), its
 * styles as a catalogue from `fromV1`, and its global CSS. For converting a
 * theme's source, as a starting point (`scripts/printThemeV2.ts`).
 *
 * A V1 value is CSS as written, but in a V2 theme a palette colour's name in
 * a colour property is that colour: a V1 theme with such a value (`color:
 * "text"`, which did nothing) can't be converted as it is, and that's an
 * error saying where.
 */
export function v2FromV1(theme: ThemeV1): ThemeV2 {
  const catalogue = catalogueFromV1(theme);
  const asV1 = compileCatalogue(catalogue, undefined, { literal: true });
  const asV2 = compileCatalogue(catalogue);
  const changed = Object.keys(asV1).filter(
    (name) => JSON.stringify(asV1[name]) !== JSON.stringify(asV2[name]),
  );
  if (changed.length > 0) {
    throw new Error(
      `${theme.displayName}: a value that's a palette colour's name would become that colour in V2, in ${changed.join(", ")}`,
    );
  }
  const full = paletteFromV1(theme);
  const core = Object.fromEntries(
    (["polarity", ...requiredPaletteKeys] as const).map((key) => [
      key,
      full[key],
    ]),
  ) as unknown as ThemePalette;
  const derived = resolvePalette(core);
  const palette: ThemePalette = {
    ...core,
    ...Object.fromEntries(
      optionalPaletteKeys
        .filter((key) => full[key] !== derived[key])
        .map((key) => [key, full[key]]),
    ),
  };
  const global = globalCss(theme.global);
  return {
    schemaVersion: "v2",
    displayName: theme.displayName,
    palette,
    catalogue,
    ...(global ? { globalCss: global } : {}),
  };
}

/**
 * A V2 theme as the TypeScript source of a built-in theme: `export const
 * <name> = defineThemeV2({...})`, with the system's asset paths written with
 * `systemId`. Not formatted.
 */
export function themeV2Source(name: string, theme: ThemeV2): string {
  const assets = `systems/${systemId}/`;
  let usesSystemId = false;
  const body = JSON.stringify(theme, null, 2).replace(
    /"(?:[^"\\]|\\.)*"(\s*:)?/g,
    (literal, key: string | undefined) => {
      // a key stays a string: a template literal can't be one
      if (key) return literal;
      const text = JSON.parse(literal) as string;
      if (!text.includes(assets)) return literal;
      usesSystemId = true;
      // a template literal, with the system's id from `systemId`
      const escaped = text
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$\{/g, "\\${")
        .replaceAll(assets, "systems/${systemId}/");
      return `\`${escaped}\``;
    },
  );
  const imports = [
    ...(usesSystemId ? [`import { systemId } from "../constants";`] : []),
    `import { defineThemeV2 } from "./theme";`,
  ];
  return `${imports.join("\n")}\n\nexport const ${name} = defineThemeV2(${body});\n`;
}
