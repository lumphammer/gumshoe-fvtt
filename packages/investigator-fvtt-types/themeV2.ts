// ThemeV2's catalogue overrides (docs/theming.md, "ThemeV2 (planned)"):
// shaped like the catalogue's recipes, and typed from them.
import type * as CSS from "csstype";

import type { CatalogueRecipeShapes } from "./catalogue.generated";

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
