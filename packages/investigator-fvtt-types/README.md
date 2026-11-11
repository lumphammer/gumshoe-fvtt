# @lumphammer/investigator-fvtt-types

This package contains TypeScript types for people wishing to write custom addons for [INVESTIGATOR for Foundry VTT][investigator].

Currently this includes types for

* creating and registering themes: `ThemeV2`, and the older `ThemeSeedV1`
* creating and registering system presets

## Themes

`CONFIG.Investigator.installTheme(id, theme)` takes a `ThemeV2` or a
`ThemeSeedV1`, by its `schemaVersion`. A V2 theme is plain data:

```ts
import type { ThemeV2 } from "@lumphammer/investigator-fvtt-types";

const theme: ThemeV2 = {
  schemaVersion: "v2",
  displayName: "My Theme",
  palette: { polarity: "light", surface: "#fff", accent: "#c00", … },
  catalogue: {
    badge: { variants: { tone: { danger: { fontWeight: "bold" } } } },
  },
};
```

- `ThemePalette` is the palette: a required core, and the rest worked out
  unless a theme sets it. `PaletteVar` names its CSS custom properties
  (`--inv-surface`), for use in overrides' values and `globalCss`.
- `ThemeCatalogue` is the overrides, shaped like the system's catalogue
  recipes: `base` replaces a recipe's own; `variants` and `compoundVariants`
  patch them. `states` patches the state layers (hover, drop target, focus):
  at the top level, everywhere in the theme; in a recipe, just on its
  elements. `StateLayer` names them. Its keys come from the recipes (`CatalogueRecipeShapes`, which
  is generated), so a recipe, slot, variant or value that doesn't exist is a
  type error. The catalogue's names are public API: renaming or removing one
  is a breaking change for this package.
- A V2 theme that isn't one is refused when it's installed, with an error that
  says why; an override that doesn't fit the catalogue is skipped, with a
  warning.

The system's `docs/theming.md` has the whole contract: what each palette entry
and catalogue recipe means.

## Styles and Emotion

The style types (`CSSObject` and friends) are copies of Emotion 11's, built on
[`csstype`](https://github.com/frenic/csstype), so a theme written with
Emotion can pass its styles to us and ours to Emotion. `csstype` is a peer
dependency: install it alongside (`npm install csstype`), and if you use
Emotion, make sure it and this package resolve the same `csstype` (deduplicate
it), because different `csstype` versions make the two `CSSObject`s
incompatible. You don't need Emotion itself.

## Release process

1. Make sure everything is committed, and the catalogue's types are up to date
   (`pnpm generate:catalogue --check` at the repository's root).
2. `npm version {major,minor,patch}` here.
3. Check what will ship: `pnpm pack --dry-run` (`prepack` builds `dist`).
4. `git push`.
5. `pnpm publish`.

[investigator]: https://github.com/lumphammer/gumshoe-fvtt
