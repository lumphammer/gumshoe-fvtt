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
 * `&[data-selected]`) or an at-rule (`@media ...`), as in CSS nesting.
 *
 * Values are CSS. A palette entry is its custom property (`PaletteVar`):
 * `color: "var(--inv-accent)"`.
 */
export type ThemeStyle = { [K in keyof Properties]?: Properties[K] } & {
  [custom: `--${string}`]: StyleValue | undefined;
  [nested: `@${string}` | `${string}&${string}`]: ThemeStyle | undefined;
};

/**
 * The state layers: feedback that looks the same on anything, whatever its
 * class (docs/theming.md, "State layers"). `hoverFeedback` is
 * `[data-interactive]:hover` (a glow, and a pointer), `dropTarget` is
 * `[data-drop-state]` (a dashed outline, accent with a tint when something's
 * over it), and `focusRing` is `:focus-visible` (an outline).
 */
export type StateLayer = "hoverFeedback" | "dropTarget" | "focusRing";

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

/** The state layers' styles, for a recipe's elements. */
type StateStyles<S extends RecipeShape> = { [State in StateLayer]?: PartStyles<S> };

/**
 * A compound variant: at least one of the recipe's variants, and its css,
 * its states, or both.
 */
type CompoundVariant<S extends RecipeShape> = {
  [Named in keyof S["variants"]]: {
    [Variant in Named]: VariantValue<S["variants"][Variant]>;
  } & {
    [Variant in keyof S["variants"]]?: VariantValue<S["variants"][Variant]>;
  } & (
      | { css: PartStyles<S>; states?: StateStyles<S> }
      | { css?: PartStyles<S>; states: StateStyles<S> }
    );
}[keyof S["variants"]];

/**
 * An override of one of the catalogue's recipes, shaped like the recipe.
 * Every part **patches**: its declarations go over the recipe's own, and
 * the rest of the recipe's stay. (To start a part from nothing, begin its
 * style with `all: "revert-layer"`.)
 *
 * - `base`: the recipe's base (for a slot recipe, by slot).
 * - `variants`: the recipe's variants.
 * - `compoundVariants`: an element with every one of the variants they
 *   name, whether or not the recipe has a compound variant for them: its
 *   look (`css`), and the state layers on it (`states`, like the recipe's
 *   own, which they go over). One variant is enough: a variant's own
 *   states are `[{ kind: "pip", states: {...} }]`.
 * - `states`: the state layers, for this recipe's elements only (by slot,
 *   for a slot recipe): `&` is the element in that state. They go over the
 *   theme's own `states`, and still under the layers after them (focus
 *   always shows).
 *
 * A recipe without variants has neither `variants` nor `compoundVariants`.
 */
export type RecipeOverride<S extends RecipeShape> = {
  base?: PartStyles<S>;
  states?: StateStyles<S>;
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

/**
 * A theme's overrides of the catalogue's recipes, by recipe name, and of the
 * state layers everywhere in the theme (`states`), which they **patch**: `&`
 * is anything in that state. A state's default can't be beaten from a
 * recipe's `base` or `variants` (the state layers come after them), only
 * here, or in a recipe's own `states`.
 */
export type ThemeCatalogue = {
  [Name in keyof CatalogueRecipeShapes]?: RecipeOverride<CatalogueRecipeShapes[Name]>;
} & {
  states?: { [State in StateLayer]?: ThemeStyle };
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
  /** What content sits on. */
  surface: string;
  /** What content inside content sits on. */
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

  /**
   * `surface` for things that overlap or scroll over other content (menus,
   * sticky headers, cards). Only a theme whose `surface` is translucent
   * needs to set it, to an opaque colour. Default: `surface`.
   */
  surfaceSolid?: string;
  /** `surfaceNested`, in the same way. Default: `surfaceNested`. */
  surfaceNestedSolid?: string;
  /** Ink for secondary information. Default: `text`, faded towards `surfaceSolid`. */
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
   * How the character sheets are laid out. `"standard"` (the default) has
   * Foundry's titlebar over the sheet. `"full-frame"` runs the sheet up to
   * the window's top edge, under a see-through titlebar: a strip across the
   * top, still the titlebar (it drags the window, and a double click on it
   * minimizes it), with its buttons in a row at the right, a faint tint on
   * hover, and no title. The logo runs up under it, but its text keeps below
   * it, scaled down to fit. The portrait and the sidebar move to the left.
   * The title shows only when the window is minimized. Windows without a
   * logo (items, say) keep the standard titlebar. The titlebar's look is the
   * `appFrame` recipe's `layout: full-frame` variant.
   */
  layout?: "standard" | "full-frame";
  /**
   * Raw CSS, in the themed root, unscoped: an escape hatch for what the
   * catalogue can't express (and for loading a folder theme's fonts). Not
   * supported: it can break as the markup changes.
   */
  globalCss?: string;
}
