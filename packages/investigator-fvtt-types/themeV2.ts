// ThemeV2's catalogue overrides (docs/theming.md, "Themes (ThemeV2)"):
// shaped like the catalogue's recipes, and typed from them.
import type * as CSS from "csstype";

import type { CatalogueRecipeShapes } from "./catalogue.generated.js";

export type { CatalogueRecipeShapes };

type StyleValue = string | number;
type Properties = CSS.PropertiesFallback<StyleValue>;

/**
 * A style in a theme's override: CSS properties in camelCase (a number is
 * pixels, for properties that take a length; an array is fallbacks), custom
 * properties, and nested rules keyed by a selector that contains `&` (`&:hover`,
 * `input:checked + &`) or an at-rule (`@media ...`).
 *
 * A colour property whose value is exactly the name of one of the palette's
 * colours (`color: "accent"`) is that colour. Anywhere else, a palette entry is
 * its custom property: `"oklch(from var(--inv-surface) calc(l - 0.1) c h)"`.
 */
export type ThemeStyle = { [K in keyof Properties]?: Properties[K] } & {
  [custom: `--${string}`]: StyleValue | undefined;
  [nested: `@${string}` | `${string}&${string}`]: ThemeStyle | undefined;
};

/** What a recipe's catalogue shape looks like. */
interface RecipeShape {
  slots: string;
  variants: Record<string, string>;
}

/** A style for each of a slot recipe's slots, or one style for a recipe without. */
type PartStyles<S extends RecipeShape> = [S["slots"]] extends [never]
  ? ThemeStyle
  : { [Slot in S["slots"]]?: ThemeStyle };

/** A variant's value: a boolean variant's can be a boolean too. */
type VariantValue<V extends string> = V extends "true" | "false" ? V | boolean : V;

/** A compound variant: at least one of the recipe's variants, and its css. */
type CompoundVariant<S extends RecipeShape> = {
  [Named in keyof S["variants"]]: {
    [Variant in Named]: VariantValue<S["variants"][Variant]>;
  } & {
    [Variant in keyof S["variants"]]?: VariantValue<S["variants"][Variant]>;
  } & { css: PartStyles<S> };
}[keyof S["variants"]];

/**
 * An override of one of the catalogue's recipes, shaped like the recipe:
 *
 * - `base` **replaces** the recipe's base (for a slot recipe, each slot's
 *   that it names): none of the recipe's own declarations survive there.
 * - `variants` **patch** the recipe's variants: their declarations go over
 *   the variant's own.
 * - `compoundVariants` patch an element with every one of the variants they
 *   name, whether or not the recipe has a compound variant for them.
 *
 * A recipe without variants has neither.
 */
export type RecipeOverride<S extends RecipeShape> = {
  base?: PartStyles<S>;
} & ([keyof S["variants"]] extends [never]
  ? { variants?: never; compoundVariants?: never }
  : {
      variants?: {
        [Variant in keyof S["variants"]]?: {
          [Value in S["variants"][Variant]]?: PartStyles<S>;
        };
      };
      compoundVariants?: ReadonlyArray<CompoundVariant<S>>;
    });

/** A theme's overrides of the catalogue's recipes, by recipe name. */
export type ThemeCatalogue = {
  [Name in keyof CatalogueRecipeShapes]?: RecipeOverride<CatalogueRecipeShapes[Name]>;
};

/**
 * A theme's palette: the values the catalogue is built from, each with one
 * meaning (docs/theming.md, "Palette"). The core is required; the rest is
 * worked out from it unless the theme sets it.
 */
export interface ThemePalette {
  /** Whether the theme is light or dark. Sets `color-scheme`. */
  polarity: "light" | "dark";
  /** The colour the sheet's backdrop averages to, shown while images load. */
  wallpaper: string;
  /**
   * What content sits on. Expected to be opaque: things that overlap other
   * content sit on it too (a translucent one works if the theme keeps those
   * opaque, with overrides).
   */
  surface: string;
  /** What content inside content sits on. Expected to be opaque. */
  surfaceNested: string;
  /** The fill of controls: buttons, toggle tracks. */
  control: string;
  /** The default ink. Legible on `surface`, `surfaceNested` and `control`. */
  text: string;
  /** "Selected" or "call to action". Not for "clickable". */
  accent: string;
  /** Structural lines: control outlines, separators, heading rules. */
  line: string;
  /** The colour of hover, focus and drag-over feedback. */
  feedback: string;
  /** Something bad or destructive. Legible as text on surfaces. */
  danger: string;
  /** Something that needs attention, less serious than `danger`. */
  warning: string;
  /** Something that went well. */
  success: string;
  /** Neutral information. */
  info: string;

  /** Ink for secondary information. Default: `text`, faded towards `surface`. */
  textMuted?: string;
  /** Ink for links within prose. Default: `accent`. */
  link?: string;
  /** Ink on an `accent` fill. Default: black or white, by contrast. */
  onAccent?: string;
  /** Ink on a `danger` fill. Default: black or white, by contrast. */
  onDanger?: string;
  /** Ink on a `warning` fill. Default: black or white, by contrast. */
  onWarning?: string;
  /** Ink on a `success` fill. Default: black or white, by contrast. */
  onSuccess?: string;
  /** Ink on an `info` fill. Default: black or white, by contrast. */
  onInfo?: string;
  /** The corner radius of boxes and controls. Default: `0.25em`. */
  radius?: string;
  /** The shadow of anything floating. Default: `0 0 0.5em black`. */
  elevation?: string;
  /** The `body` text style's font (a CSS `font` value). Default: `inherit`. */
  bodyFont?: string;
  /** The `display` text style's font (a CSS `font` value). Default: `inherit`. */
  displayFont?: string;
  /** The `display` text style's case (`text-transform`). Default: `none`. */
  displayCase?: string;
  /** The `display` text style's letter spacing. Default: `normal`. */
  displayLetterSpacing?: string;
  /**
   * The spacing between cards, as a CSS `gap` value (a row gap, then a column
   * gap, or one for both), and around a card array. Default: `0.5em`.
   */
  cardGap?: string;
}

type Kebab<S extends string> = S extends `${infer Head}${infer Tail}`
  ? `${Head extends Lowercase<Head> ? Head : `-${Lowercase<Head>}`}${Kebab<Tail>}`
  : S;

/**
 * The custom properties a theme's palette is set in, on every themed root
 * (`--inv-surface-nested`): a stable contract, for overrides' expressions and
 * `globalCss`.
 */
export type PaletteVar = `--inv-${Kebab<Exclude<keyof ThemePalette, "polarity">>}`;

/** A theme (docs/theming.md, "Themes (ThemeV2)"). */
export interface ThemeV2 {
  schemaVersion: "v2";
  displayName: string;
  description?: string;
  palette: ThemePalette;
  /** Overrides of the catalogue's recipes. */
  catalogue?: ThemeCatalogue;
  /**
   * Raw CSS, in the themed root, unscoped: an escape hatch for what the
   * catalogue can't express (and for loading a folder theme's fonts). Not
   * supported: it can break as the markup changes.
   */
  globalCss?: string;
}
