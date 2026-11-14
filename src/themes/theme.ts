import type { ThemeV2 } from "@lumphammer/investigator-fvtt-types";
import { z } from "zod";
import { fromZodError } from "zod-validation-error/v4";

import { optionalPaletteKeys, requiredPaletteKeys } from "./palette";

/**
 * A theme, ready to style a sheet: a V2 theme. A V1 theme becomes one when
 * it's installed (`themeFromV1`), so it's the only kind the rest of the code
 * sees (docs/theming.md).
 */
export type Theme = ThemeV2;

/** How the character sheets are laid out (`ThemeV2.layout`). */
export type Layout = NonNullable<ThemeV2["layout"]>;

/** Type-checks a V2 theme: the built-in themes are defined with it. */
export const defineThemeV2 = (theme: ThemeV2) => theme;

const value = z.union([z.string(), z.number()]);

/**
 * A style: values, lists of fallbacks, and nested rules (or slots). A value
 * can be undefined, as a conditional one in a module's theme is.
 */
const style: z.ZodType = z.lazy(() =>
  z.record(z.string(), z.union([value, z.array(value), style, z.undefined()])),
);

const byState = z.record(z.string(), style.optional()).optional();

/**
 * The shape of a V2 theme. Names in its catalogue (recipes, slots, variants,
 * states) aren't checked here: `catalogueRules` leaves out the ones it
 * doesn't know, with a warning, so a theme built against other types still
 * loads.
 */
const themeSchema = z.looseObject({
  schemaVersion: z.literal("v2"),
  displayName: z.string().min(1),
  description: z.string().optional(),
  palette: z.looseObject({
    polarity: z.enum(["light", "dark"]),
    ...Object.fromEntries(
      requiredPaletteKeys.map((key) => [key, z.string().min(1)]),
    ),
    ...Object.fromEntries(
      optionalPaletteKeys.map((key) => [key, z.string().optional()]),
    ),
  }),
  catalogue: z
    .object({ states: byState })
    .catchall(
      z
        .looseObject({
          base: style.optional(),
          variants: z
            .record(
              z.string(),
              z.record(z.string(), style.optional()).optional(),
            )
            .optional(),
          compoundVariants: z
            .array(z.looseObject({ css: style.optional(), states: byState }))
            .optional(),
          states: byState,
        })
        .optional(),
    )
    .optional(),
  layout: z.enum(["standard", "full-frame"]).optional(),
  globalCss: z.string().optional(),
});

/**
 * A V2 theme from somewhere untyped (a theme file, another module), checked:
 * a theme whose shape is wrong is refused, with an error that says why.
 * What isn't part of a theme is ignored, with a warning.
 */
export function validateThemeV2(
  theme: unknown,
  warn: (message: string) => void = (message) =>
    console.warn(`Theme: ${message}`),
): ThemeV2 {
  const result = themeSchema.safeParse(theme);
  if (!result.success) {
    throw new Error(
      `This isn't a V2 theme: ${fromZodError(result.error, { prefix: null }).message}`,
    );
  }
  const { palette } = result.data;
  for (const key of Object.keys(result.data)) {
    if (!(key in themeSchema.shape)) {
      warn(`${key} isn't part of a theme, so it's ignored`);
    }
  }
  for (const key of Object.keys(palette)) {
    if (!(key in themeSchema.shape.palette.shape)) {
      warn(`palette.${key} isn't a palette entry, so it's ignored`);
    }
  }
  return theme as ThemeV2;
}
