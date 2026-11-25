# @lumphammer/investigator-fvtt-types

This package contains TypeScript types for people wishing to write custom addons for [INVESTIGATOR for Foundry VTT][investigator].

Currently this includes types for

- creating and registering themes: `ThemeV2`, and the older `ThemeSeedV1`
- creating and registering system presets

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
    badge: {
      variants: {
        tone: { danger: { fontWeight: "bold", color: "var(--inv-on-danger)" } },
      },
    },
  },
};
```

- `ThemePalette` is the palette: a required core, and the rest worked out
  (in CSS) unless a theme sets it. A theme with translucent surfaces also sets
  `surfaceSolid` and `surfaceNestedSolid`, opaque versions for things that
  overlap other content. `PaletteVar` names its CSS custom properties
  (`--inv-surface`).
- Style values are plain CSS. A palette entry is its custom property:
  `color: "var(--inv-accent)"`, not `"accent"`.
- `ThemeCatalogue` is the overrides, shaped like the system's catalogue
  recipes. Every part (`base`, `variants`, `compoundVariants`) patches: its
  declarations go over the recipe's own, and what it doesn't say stays. To
  start a part from nothing, begin its style with `all: "revert-layer"`.
  `states` changes the state layers (hover, drop target, focus): at the top
  level, everywhere in the theme; in a recipe, just on its elements.
  `StateLayer` names them. Its keys come from the recipes
  (`CatalogueRecipeShapes`, which is generated), so a recipe, slot, variant or
  value that doesn't exist is a type error. The catalogue's names are public
  API: renaming or removing one is a breaking change for this package.
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

## Presets

A "preset" is a set of values for the INVESTIGATOR system settings that set up INVESTIGATOR for a particular game. The base INVESTIGATOR system comes with built-in presets for a bunch of GUMSHOE games, but you can also publish new ones as Foundry modules.

Construct your preset as an object of type `PresetV1`. The basics (theme id, ability categories, notes, packs and stats) are required, everything else is optional. Any optional parts that are not supplied will be given default values when the preset is applied.

### `installPreset`

`CONFIG.Investigator.installPreset(id, preset)` makes a preset available, so the GM can choose it in the GUMSHOE system settings. Call `installPreset` when your module loads (at the top level of its script, or in an `init` hook), on every client. The id should be unique (your module's id is a good choice.) Installing a preset with an id that's already in use will replace it.

Installing a preset doesn't directly affect the world's settings, it just makes it available to the GM. Also, installing a new version of a preset doesn't automatically update the world setting to the new preset.

```ts
import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

const preset: PresetV1 = {
  schemaVersion: "v1",
  displayName: "My Game",
  defaultThemeName: "tealTheme",
  // …
};

CONFIG.Investigator?.installPreset("my-module", preset);
```

### `applyPreset`

`CONFIG.Investigator.applyPreset(id)` applies an installed preset to the world, exactly the same as choosing it in the GUMSHOE system settings and saving would.

- every setting in the preset is written to the world settings.
- those it leaves out are reset to their defaults
- the preset becomes the world's preset (the `systemPreset` setting).

It returns a promise, which rejects without changing anything if no preset is installed with the given id, if the user isn't a Gamemaster, or if any of the preset's values are invalid. If a setting can't be saved (e.g. the connection to the server drops), it rejects with an error listing which settings were and weren't written.

Call `applyPreset` in response to something the GM does (a button, a dialog), not while the world is starting up: in a new world, INVESTIGATOR writes its own default preset's values during `ready`, and could overwrite yours.

`applyPreset` was released as part of INVESTIGATOR 10.132, so it won't be present under older versions. For that reason, it's optional in `InvestigatorConfig`: check for it, and fall back on something else if it's
missing.

```ts
if (CONFIG.Investigator?.applyPreset) {
  await CONFIG.Investigator.applyPreset("my-module");
} else {
  // an older INVESTIGATOR: write the settings yourself, including the
  // ones your preset leaves out (see below)
}
```

Don't apply a preset by writing its values to the settings one by one (`game.settings.set("investigator", key, value)`): that leaves every setting your preset doesn't mention as it was.

## Release process

1. Make sure everything is committed, and the catalogue's types are up to date
   (`pnpm generate:catalogue --check` at the repository's root).
2. `npm version {major,minor,patch}` here.
3. Check what will ship: `pnpm pack --dry-run` (`prepack` builds `dist`).
4. `git push`.
5. `pnpm publish`.

[investigator]: https://github.com/lumphammer/gumshoe-fvtt
