# Theming

How themes are defined and how components get their look. This is the
contract: what each palette entry and catalogue class **means**, so that anyone
writing a component or a theme makes the same choice in the same place.

A theme is a **palette** (colours, fonts and a few shared values) and
overrides of the **catalogue**: named classes, one per kind of thing, built
from the palette with Panda recipes. Components apply catalogue classes and
write layout; none reads a theme's colours. Themes are written as ThemeV2
(below); V1 themes still work, converted when they're installed. The runtime
`Theme` (`src/themes/theme.ts`) is just `ThemeV2`. Themes need a browser with
`@scope`, CSS nesting, relative colours (`oklch(from …)`) and `light-dark()`.

## Rules

1. **Call sites apply classes and write layout. They never read palette
   values.** If a call site seems to need a colour, the catalogue is missing
   an entry or a variant.
2. **At most one catalogue class per element**, with its variants, plus
   layout. Layout never comes from the catalogue, and look never comes from
   the call site.
3. **Classes are self-contained.** They share a look only through the palette,
   typography included. Overriding a class affects that class and nothing
   else.
4. **Every class has a default built from the palette**, so a palette on its
   own makes a usable theme. Themes may override any class: an override adds
   declarations over the default, part by part (below). Some parts are
   _expected_ to be overridden, because that's where a theme's personality
   lives: `sheetRoot`, `appFrame`, `tabs.tab`, `logo` and `card.root`.
5. **States are attributes; variants are design choices.** Selected, disabled,
   invalid, expanded and drag states come from attributes the markup should
   have anyway (`aria-selected`, `aria-disabled`, `aria-invalid`,
   `aria-expanded`, `data-state`). Variants are for choices such as `tone`,
   `size` and `kind`.
6. **One `tone` vocabulary** (`tones.ts`): `neutral | danger | warning |
   success | info`, `neutral` by default. `accent` is not a tone: "selected"
   is a state, "call to action" is a kind.

A palette entry exists only if two or more classes need to agree on a value.
Spacing isn't one: it's layout. Every class has a TSDoc summary and the
description below, with what it's **not for** where a neighbour could be
confused with it.

## Writing a theme (ThemeV2)

A theme is plain, JSON-serialisable data: no functions. The built-ins are
TypeScript, through `defineThemeV2()` (which only type-checks); a module's theme
or a file in the custom themes folder (JSON or YAML) has the same shape. The
types are in `@lumphammer/investigator-fvtt-types`: `ThemeV2`, `ThemePalette`,
`ThemeCatalogue`, `ThemeStyle`, `PaletteVar`.
`CONFIG.Investigator.installTheme(id, theme)` and the folder take a V1 or a V2
theme, by its `schemaVersion`. One palette per theme: light and dark versions
of a design are separate themes. There's no `extends`: share code by spreading
objects.

```ts
defineThemeV2({
  schemaVersion: "v2",
  displayName: "Example",
  palette: {
    polarity: "light",
    wallpaper: "#ddd",
    // ...and the other required entries (below)
  },
  catalogue: {
    badge: {
      base: { borderRadius: 0, fontStyle: "italic" },
      variants: { tone: { danger: { fontWeight: "bold" } } },
      compoundVariants: [
        {
          tone: "danger",
          weight: "strong",
          css: { color: "var(--inv-on-danger)" },
        },
      ],
    },
    // a slot recipe: styles by slot
    tabs: { base: { tab: { textTransform: "uppercase" } } },
    // the state layers, everywhere in the theme
    states: { hoverFeedback: { boxShadow: "none" } },
  },
  globalCss: "@import url(modules/my-theme/fonts.css);",
});
```

**The palette.** Required: `polarity` (stated, never guessed), `wallpaper`,
`surface`, `surfaceNested`, `control`, `text`, `accent`, `line`, `feedback`,
`danger`, `warning`, `success`, `info`. Everything else is optional, with a
default in CSS (`src/themes/catalogue/palette.css`, on every themed root); a
theme's own values are inline on the root, so they win. Fonts are palette
entries only: a theme doesn't load them. The built-ins' fonts come from the
system's CSS, a module theme's from its module's, and a folder theme's from
`@font-face` or `@import` in its `globalCss`.

**The catalogue** is keyed by recipe name (`badge`, `partyCell`), each shaped
like the recipe's own Panda config:

- `base`: the recipe's base (by slot, for a slot recipe: `tabs`, `card`,
  `logo`, `checkbox`, `toggle`, `fieldGrid`, `appFrame`).
- `variants`: `{ tone: { danger: {...} } }` (by slot, for a slot recipe).
- `compoundVariants`: `[{ tone: "danger", weight: "strong", css: {...} }]`
  apply to an element with every variant they name, whether or not the recipe
  has a compound variant for them. A boolean variant's value is `true` or
  `"true"`.
- `states`: `{ hoverFeedback: {...} }` (by slot, for a slot recipe) changes the
  state layers on this recipe's elements only. `states` beside the recipes
  changes them everywhere in the theme (State layers, below).

**Every part patches.** Its declarations go over the default's, in the same
cascade layer, at the same specificity (a theme's rules are scoped, and a
scoped rule beats an unscoped one that's as specific); whatever it doesn't say
stays. To take a declaration away, set it
(`borderBottomStyle: "none"`). To start a part from nothing, write
`all: "revert-layer"` first in its style: it drops what the recipe says for
that part (in `variants`, for every variant, as they share a layer, so use it
on `base`). A class's own state rules (`:is([aria-pressed=true])` and the like)
are more specific, so they still apply over an override.

A style is CSS properties in camelCase (a number is pixels, for a property that
takes a length; an array is fallbacks, one declaration each), custom
properties, and nested rules keyed by a selector containing `&` (`"&:hover"`,
`"&[data-selected]"`, `"input:checked + &"`) or by an at-rule. There are no
bare descendant selectors (write `"& img"`) and no Panda shortcuts (`_hover`).
Values are plain CSS. A palette entry is its custom property, `--inv-` and its
name in kebab case (`PaletteVar`): `color: "var(--inv-accent)"`. A bare
`"accent"` is just CSS, not the palette. A card category's style is a nested
selector in the `card` override, on the `data-category` attribute of the card's
root: `'&[data-category="stress"]'` in the `root` slot,
`'[data-category="stress"] &'` in the others.

**`globalCss`** is raw CSS in a `<style>` in the themed root, unscoped: an
escape hatch for what the catalogue can't express, and for loading a folder
theme's fonts. It isn't supported: it can break as the markup changes.

**`layout`** is `"standard"` (the default) or `"full-frame"`: a character sheet
(a window with a logo) runs up under a see-through titlebar, a strip as tall as
Foundry's (`--header-height`) that still drags the window, with a tint on hover
and no title (shown when minimized). The portrait and sidebar move left, and
the logo's text keeps below the strip (`LogoEditable`, `--inv-logo-overlap` less
`--inv-logo-strip-tuck`, 15px from `CSSReset`). The sheets' grids follow
`data-inv-layout` on the themed root. The strip's look is the `appFrame`
`layout: full-frame` variant, which a theme can patch.

**Types and checks.** `pnpm generate:catalogue` writes each recipe's slots and
variants from `panda.config.ts`, as types for `ThemeCatalogue`
(`catalogue.generated.ts`, in the types package) and as the list the app checks
a catalogue against (`recipeShapes.generated.ts`); `pnpm check` fails if they're
stale. So a recipe, slot, variant or value that doesn't exist is a type error.
Their names are public API: renaming or removing one is a breaking change;
adding one isn't. A V2 theme is checked when it's installed, except the
built-ins, as a module may be plain JavaScript or built against old types
(`validateThemeV2`, a zod schema in `theme.ts`). A wrong shape is refused, with
a message listing what's wrong (shown to the GM for a folder theme). An unknown
top-level or palette key warns. An unknown recipe, slot, variant, value or state
in the catalogue is skipped, with a warning (`catalogueRules`). Nothing checks
the CSS in a style.

## Palette

Each entry is a custom property on the themed root (`--inv-` and the name in
kebab case: `surfaceNested` is `--inv-surface-nested`), and a Panda token
(`colors.surfaceNested`).

| Entry                                                      | Meaning                                                                                                                                                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `polarity`                                                 | `light` or `dark`. Sets `color-scheme` on the themed root, so scrollbars and native controls match                                                                                                                   |
| `wallpaper`                                                | The colour the sheet's backdrop averages to. Shown while images load. Must agree with the backdrop image                                                                                                             |
| `surface`                                                  | What content sits on. May be translucent, so the wallpaper shows through; things that overlap or scroll over other content use `surfaceSolid`                                                                        |
| `surfaceNested`                                            | What content _inside_ content sits on. A panel inside a panel uses it, worked out from the structure, never chosen by the call site                                                                                  |
| `surfaceSolid`, `surfaceNestedSolid`                       | Opaque versions of the two, for things that overlap or scroll over other content (menus, sticky headers, floating messages, cards). Default: `surface`, `surfaceNested`. A theme with translucent surfaces sets them |
| `control`                                                  | The fill of controls: buttons, toggle tracks                                                                                                                                                                         |
| `text`                                                     | The default ink. Legible on both surfaces and on `control`                                                                                                                                                           |
| `textMuted`                                                | Ink for secondary information: notes, empty states, inactive rows, table headers. Default: `text` at 70% over `surfaceSolid`                                                                                         |
| `link`                                                     | Ink for links within prose (rich text, journals, notes), distinguishable from `text` there. Not for other clickable things. Default: `accent`                                                                        |
| `accent`                                                   | **Selected, or a call to action**: the active tab, a toggle that's on, the OK button. _Not_ "clickable": most of a sheet is clickable, and that's shown by shape, hover feedback and the cursor                      |
| `feedback`                                                 | The colour of hover, focus and drag-over feedback. Never state or decoration                                                                                                                                         |
| `line`                                                     | Structural lines: control outlines, separators, heading rules, table header rules                                                                                                                                    |
| `danger`, `warning`, `success`, `info`                     | Status. Each is legible as text on both surfaces                                                                                                                                                                     |
| `onAccent`, `onDanger`, `onWarning`, `onSuccess`, `onInfo` | Ink on the matching fill. Default: black or white by the fill's lightness (below)                                                                                                                                    |
| `radius`                                                   | The one corner radius classes share (Panda: `radii.standard`). Default: `0.25em`                                                                                                                                     |
| `elevation`                                                | The shadow for anything floating (Panda: `shadows.elevation`). Default: `0 0 0.5em black`                                                                                                                            |
| `bodyFont`                                                 | The `body` text style: prose and controls. A CSS `font` value. Default: `inherit`                                                                                                                                    |
| `displayFont`, `displayCase`, `displayLetterSpacing`       | The `display` text style: titles, headings, tabs, labels (`textStyle: "display"`). Defaults: `inherit`, `none`, `normal`                                                                                             |
| `cardGap`                                                  | The spacing between cards (a CSS `gap` value: a row gap, then a column gap), and around a card array; `CardArray` reads `--inv-card-gap`, `--inv-card-gap-row` and `--inv-card-gap-column`. Default: `0.5em`         |

The `on*` inks are white below 72% OKLCH lightness (where APCA's contrast
flips) and black above, worked out in CSS with relative colour syntax, so they
work for any CSS colour, including `color-mix()` and `var()`. Status-tinted
surfaces (flagged rows, invalid inputs, callouts, abilities nobody has) are
derived in their recipes, from the status colours and the surfaces.

## Catalogue

Each class is a Panda recipe in `src/themes/catalogue/`, registered in
`panda.config.ts`. Its CSS class is `inv-` and its name in kebab case
(`inv-badge`); each variant gets a class (`inv-badge--tone_danger`), compound
variants too, and a slot's has `__` and the slot (`inv-tabs__tab`). Every
variant is generated whether a call site uses it or not. Call sites import the
recipe from `styled-system/recipes`, with layout from `css()` alongside:
`<span className={cx(badge({ tone: "danger" }), css({ marginInline: "0.25em" }))}>`.
`strictTokens` is on, so a colour in `css()` has to be a palette token (a call
site shouldn't be setting one anyway); spacing and sizes take any value, as
they're layout.

**`badge`**: a short label saying what something is or what state it's in
("Boosted", an unlock). _Not for_ messages (`callout`) or links. Fully rounded.
Variants `tone` and `weight`: `subtle` (default) is an outline in the tone's
colour, `strong` is filled with it (`control` for neutral) and its `on-` ink.
`data-interactive` if clickable; `aria-pressed` makes it a toggle, shown as
selected (`accent` fill, `onAccent` ink). `Translate` sets an inline
`background`, so put a badge on a wrapper around it.

**`button`**: something you click to do something; use `Button`, which sets
`data-interactive` and is disabled when the sheet isn't editable. _Not for_
links, or on/off settings (`toggle`). `kind`: `default`; `cta`, the call to
action, what you're probably about to click (the button that commits a panel),
at most one per panel, `accent` fill; `toolbar`, compact; `ghost`, no fill or
border, for icon buttons; `pip`, one of a row of small number picks. Pressed
(`aria-pressed="true"`, or `data-pressed` on a label standing for a checked
radio) shows as selected, whatever the kind. A `<button>` that isn't a `Button`
looks like Foundry's: there's no global button style, nor for inputs.

**`input`**: a field to type into (`TextInput`, `TextArea`, a raw `<input>`
applying `input()`). _Not for_ rich text (`richText`) or choosing from a list.
`surface`, `line` border, `body` style; `aria-invalid="true"` gives a `danger`
border and tint. **`select`**: a dropdown, like `input` but on
`surfaceNestedSolid` with options on `surfaceSolid`, as a native dropdown
doesn't show what's behind it.

**`checkbox`**: a box ticked or not, for yes/no in a list. Slots `box` and
`tick` (`accent`, shown when the input before the box is checked). **`toggle`**:
an on/off switch for a setting or mode. Slots `track` and `thumb`; on
(`data-state="checked"`, from Radix) is `accent` and `onAccent`.

**`fieldGrid`**: a form as a grid of labelled fields (`InputGrid`, `GridField`,
`GridFieldStacked`). Slots `root` (the grid: its gaps), `label` (end-aligned,
towards its control) and `control` (the cell holding the input). The grid's
structure (its columns, and which column each part sits in) is the components'
layout, not the recipe's, so a theme can't move a part out of its column.
`stacked`: a label above its control, across both columns (`GridFieldStacked`).

**`panel`**: a block of content on the sheet (stats, pools, a box of controls);
use `Panel`, which owns the look and padding, while the call site owns layout.
_Not for_ things above the sheet (`floating`) or boxed messages (`callout`).
`depth` is never a call site's choice (`Panel` works it out from where it sits):
`top` is `surface`; `nested` is `surfaceNested`, inside another `Panel` or
something marked `OnSurface`, such as a tab's content.

**`callout`**: a boxed message about the content around it: why an action can't
happen ("Out of ammo"), or advice; use `Callout`, which adds the tone's icon and
an optional action. _Not for_ "nothing here" (`emptyState`) or a label
(`badge`). `tone`: `danger` stops an action, `warning` is advice. A 30% tint of
the tone's colour over `surfaceSolid`, with a bar in the tone's colour on the
left (`line` for neutral). One that says why an action can't happen goes just
below that action's button; advice about an area goes at its top.

**`tabs`**: a strip of tabs and the selected one's content (`TabContainer`).
Slots `list`, `tab`, `spacer`, `content`. _`tab` is an expected override._

- The selected tab is `surface`, like the content, with `accent` ink; the others
  are a fainter `surface` (40% opacity on a light theme, 80% on a dark one, by
  `light-dark()`) with `text` ink, and `data-interactive`.
- States are attributes on the elements themselves: the selected tab has
  `data-selected`; when the strip is wrapped into a grid (by the code that
  measures it), the list, tabs, spacers and content all have `data-wrapped`. A
  theme targets them with nested rules (`"&[data-selected]"`,
  `"&[data-wrapped]"`, `"&[data-selected]:not([data-wrapped])"`). The tabs are
  measured unwrapped, so a wrapped look can change their size. Disabled
  (`input:disabled + &`) is more specific than an override, so it still applies.
- The default selected and wrapped looks are in `:where()`, so they're no more
  specific than the tab's own rule: a theme that sets `color` or `background`
  on `tab` also beats the selected look, and has to restate it
  in `"&[data-selected]"`.

**Lists.** `sectionHeading`: a heading that divides a sheet into sections, with
a `line` rule (_not for_ column headers). `tableHeader`: a table's column
headers, bold, with a `line` rule. `row`: one item in a list, in `text` ink,
even a link. Variants: `interactive` (it opens or does something: a `feedback`
wash under the pointer, on focus, or with `data-highlighted`; rows don't use
`data-interactive`, as a glow round a row is too much), `alternate` and
`striped` (on `control`, by the call site or by position), `divided` (a `line`
under it). Selected (`aria-current`, `aria-selected`, `data-selected`) is
`control`. `dragHandle`: the grip to reorder a list, `textMuted` on
`surfaceSolid`, `accent` when hovered. `emptyState`: stands in for a list with
nothing in it: dashed `line` border, italic `textMuted` (_not for_ warnings).

**Text.** Element defaults (`elements.css`, in `system.base`, in `:where()` so
any class beats them) style plain `h1`–`h4` (the `display` style), `label`, `a`
(`link` ink), `hr` and scrollbars in a themed root. `displayText`: display-style
text that isn't a heading (column labels, figures), `size: sm | md | lg`.
`mutedText`: secondary information in `textMuted`, `size: sm | md` (_not for_
things switched off). `outcome`: the result of something in its tone's ink.

**`sheetRoot`**: the themed root of a window, applied by `CSSReset` to the
element with `data-inv-theme` and the palette: `body` style, `text` ink, and the
wallpaper. `size`: `large` and `small` are on `wallpaper`; `none` (a themed area
inside something else) is transparent. Padding and height are in the variants
too, so a theme can set them. _Expected override:_ the backdrop image, in `size`.

**`appFrame`**: Foundry's window around a themed root. Slots `root` (the
`.application` element), `header` (the titlebar) and `content` (the
`.window-content` our root sits in). `CSSReset` puts the classes on them while
mounted, if it's the outermost themed root in the window and not
`noStyleAppWindow` (roots side by side take turns, the latest first: `frame.ts`).
The window gets the palette and `data-inv-frame`, not `data-inv-theme`, so it
has no element defaults or state layers. Empty by default, so a window looks
like Foundry's. _Expected override:_ a glow or border on `root`. Variant
`layout` is the theme's, not a call site's.

**`logo`**: the character sheet's logo (`LogoEditable`): name and subtext in
large display text, drawn twice, a front copy over a rear one, on a backdrop,
for 3D, shadows and gradients. Slots `root` (the outer box, with the
`perspective` for the text's 3D transforms), `backdrop`, `text` (wraps both
copies), and for each of `front` and `rear` a `_wrapper`, the name (`front`,
`rear`) and the subtext (`front_sub`, `rear_sub`). Defaults are in
`logoDefaults.ts`. _Expected override, every slot._ What the logo needs to work
is `LogoEditable`'s, outside the slots, so an override is only what the theme
changes (`text: { transform: "scale(0.7)" }` is a whole restyle):

- The text inherits the display font, case and letter spacing at 4em, in `text`;
  the rear copy's text is transparent, so only what a theme gives it (a shadow,
  or a colour on `rear`) shows.
- The layout (the box sized by the call site, the backdrop and `text` filling it,
  each copy centred) is in a cascade layer after the theme's, so it wins, unless
  a theme says `!important`.
- The name is scaled down to fit the width, by its font size, measured with a
  hidden copy with the `front` style at full size. So `front` can set its own
  size, spacing and padding as long as they're in `em`: a fixed length (or a
  letter spacing set on `text` or a wrapper) doesn't shrink, and a long name
  overflows. A transform on `text` applies after the fit: shrinking is fine,
  enlarging can overflow. `front` mustn't set a `width`.

**`card`**: a card (Cards rules), applied by `CardDisplay`. Slots `root`,
`supertitle`, `title`, `subtitle`, `description`, `effect`. The root is
`surfaceSolid` with a `line` border, as cards can be laid over other content. It
has `data-category` (the card's style key), so a theme can style a category's
cards (the base defines none). _`root` is an expected override._

**Surfaces.** `surface`: a plain area of surface that isn't a block of content (a
panel has padding and nests; this doesn't): a notes area, a cover over a
picture. `depth: top | nested` is `surface` or `surfaceNested`; `solid` is
`surfaceSolid` or `surfaceNestedSolid`, for one that overlaps or scrolls over
other content. It sets only the background colour, so it can go on an element
with an image. `floating`: something raised above the sheet, on `surfaceSolid`;
`kind`: `overlay` (a message over everything, with `elevation`), `drawer`
(slides in from the side), `bar` (stuck to the top of a scrolling area), `chip`
(a small label over a picture). `partyCell` (specialised): a cell of the party
sheet's grid of abilities; rows alternate `surface` and `surfaceNested`, an
ability nobody has is tinted halfway to `danger`, and `header` cells stay over
the rest as it scrolls, so they're on the solid surfaces. `richText`: an editor
for formatted text, `surface` with a `line` border; its content (ProseMirror's)
keeps Foundry's styling.

## State layers

Feedback that looks the same on anything, whatever its class, so classes don't
each draw their own. They're plain CSS in `src/themes/catalogue/states.css`.

| Layer           | When                                                                                   | Look                                               |
| --------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `hoverFeedback` | `[data-interactive]:hover`, unless disabled                                            | A `feedback` glow, and a pointer                   |
| `focusRing`     | `:focus-visible`, on anything; for a visually hidden input, the label or span after it | A 2px `feedback` outline                           |
| `dropTarget`    | `[data-drop-state="ready"]`: you can drop what you're dragging here                    | A dashed `line` outline, outside the element       |
|                 | `[data-drop-state="over"]`: and it's over it                                           | The outline turns `accent`, with a `feedback` tint |

Each layer is a sub-layer of `system.states` (`hover`, `drop`, `focus`, in that
order), after the catalogue and its overrides, with its defaults in a `default`
sub-layer. So a theme's `base` or `variants` can't change one by accident (a
static `boxShadow` doesn't hide the hover glow, nor `outline: none` the focus
ring). A theme changes one on purpose, with `states`, which goes in the layer's
`theme` sub-layer after the default, so it wins whatever its specificity, and
still loses to the layers after it (focus is last, so it always shows).

- An override patches: it says only what it changes
  (`{ hoverFeedback: { boxShadow: "none" } }` turns the glow off and leaves the
  pointer). A recipe's `states`
  (`tabs: { states: { hoverFeedback: { tab: {...} } } }`) name its class, and
  come after the theme-wide ones, so they win.
- `&` is the element in that state: `[data-interactive]:hover` for
  `hoverFeedback`; either drop state for `dropTarget`
  (`'&[data-drop-state="over"]'` for over only); `:focus-visible` for
  `focusRing` (and, for a visually hidden input, the label or span after it).
  The selectors are `stateLayers.ts`'s, which a test checks against
  `states.css`.
- A drop target sets `data-drop-state` itself: `ready` while something it takes
  is being dragged (or always, if it can't tell, like a Bond's actor row), and
  `over` from `dragover` to `dragleave` or `drop`.

## V1 themes

A V1 theme (`ThemeSeedV1`) still installs, and keeps its look **approximately,
not pixel for pixel**. It's converted when it's installed: `themeFactory`
(`src/themes/functions.ts`) fills in V1's defaults for what the seed leaves out,
then `themeFromV1` (`src/themes/catalogue/fromV1.ts`, which holds everything
V1) makes a ThemeV2. A V1 seed can't write catalogue overrides of its own:
that's ThemeV2. Its values are CSS as written.

| V1                                                    | Palette                                               |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `backgroundPrimary` / `backgroundSecondary`           | `surface` / `surfaceNested`                           |
| `bgOpaquePrimary` / `bgOpaqueSecondary`               | `surfaceSolid` / `surfaceNestedSolid`                 |
| `bgOpaqueDanger*`, `bgTransDanger*`                   | none: the recipes derive their own danger tints       |
| `backgroundButton`                                    | `control`                                             |
| `accent`                                              | `accent` (and `link`, by default)                     |
| `accentContrast`                                      | `onAccent`                                            |
| `glow`                                                | `feedback`                                            |
| `controlBorder`                                       | `line`                                                |
| `danger`, `warning`, `success`                        | The same. `info` is always `#2b6cb0`                  |
| `bodyFont`, `displayFont`, `displayFontTextTransform` | `bodyFont`, `displayFont`, `displayCase`              |
| `cards.area`                                          | `cardGap` (the vertical spacing, then the horizontal) |
| (from `text`)                                         | `polarity`: light text means a dark theme             |

How its styles map:

- `panelStylePrimary` and `panelStyleSecondary` (else the primary) patch the
  `panel` `depth` variants; one without a background gets
  `backgroundColor: transparent`.
- The seven `tab*Style` fields become the `tabs` slots `tab`, `spacer` and
  `content`, each starting `all: "revert-layer"`, with V1's selected and wrapped
  states as nested rules.
- `largeSheetRootStyle` and `smallSheetRootStyle` patch the `sheetRoot` `size`
  variants; `appWindowStyle` goes in the `appFrame` `root`.
- Each `logo` style goes on its slots, spread over `logoDefaults.ts` (a relative
  font size on the text is divided by 4, as it's inherited from 4em now).
- Each `card` slot is V1's style for it, after `all: "revert-layer"`; each of
  `cards.categories` is a nested `[data-category="…"]` rule on the slot,
  patching the base; a `hoverStyle` is a `:hover` rule on the root.
- `global` becomes `globalCss`, with Emotion's labels stripped. `tabClass`,
  `panelClass` and `notesCssClasses` are ignored.

## The built-in themes

`tealTheme`, `fogTheme` and `nightFogTheme` are hand-written ThemeV2. The other
eleven are still their small V1 sources (`src/themes/*Theme.ts`), which
`baseThemes.ts` converts at load, until each gets its makeover. Of the
[theming epic](https://github.com/lumphammer/gumshoe-fvtt/issues/1532)'s end
goals, native ThemeV2 authoring, `ThemeV1` as only a step from `ThemeSeedV1`,
no `ThemeContext`, and custom V1 and V2 themes are done; every built-in being
ThemeV2 with a makeover is not.

## The native world

Some of what we draw lives in Foundry's own UI, not in a themed sheet: chat
cards, the combat tracker, `NativeMenu`, `GamePauseBanner`. These look like
Foundry, whatever theme a sheet uses. They use Foundry's markup, classes and
custom properties, and **never read the theme**: no palette, no catalogue
classes, no `useTheme` (a chat card isn't inside a themed root).
`src/themes/catalogue/nativeWorld.test.ts` checks this for
`components/messageCards/`, `components/combat/`, `components/native/`,
`components/inputs/NativeMenu/` and `GamePauseBanner`. Shared definitions are in
`src/components/native/`: `NativeButton` (never `Button`) and
`nativeStatus({ tone })` (status ink from Foundry's `--color-level-*`).

## Writing a component

Layout at call sites is Panda's `css()`: `className={css({...})}`. JSX is plain
React's, so there's no `css` prop.

- **Static values only.** Panda extracts styles when it builds, so `css()` takes
  only values it can work out then: literals, constants, objects imported or
  spread in, and a whole value chosen by a ternary. Not a ternary inside a
  template literal: the class would have no CSS.
- **Run-time values go in `style`**, usually as a custom property that a static
  class reads (`MwButton`'s `--mw-color`).
- **Conditional styles**: `css(base, active ? activeStyle : {})`, which merges.
  `cx()` only joins class names, so two classes setting the same property would
  be decided by stylesheet order.
- **Overridable defaults**: layout a component gives itself, for properties a
  caller might set, goes in a plain `inv-default-*` class in
  `src/components/componentDefaults.css` (`system.defaults`), under the caller's
  utilities, not in `css()`.
- **`className` after `{...rest}`**, merged in `cx()`: before it, the caller's
  replaces yours.
- Keyframes are in `panda.config.ts`, prefixed `inv`. Literal colours, shadows
  and radii need the `[...]` escape (strict tokens).

## How it works

### A theme's overrides as CSS

`src/themes/catalogue/themeCss.ts` turns a theme's catalogue into CSS.
`catalogueRules` makes a rule of each part: the cascade layer Panda puts that
part's default in, a selector (`.inv-badge`, `.inv-tabs__tab`,
`.inv-badge--tone_danger`) and the style. `rulesCss` writes it in native CSS
nesting (the browser resolves `&`), wrapped like this:

```css
@layer system.recipes.base {
  @scope to (:scope [data-inv-theme]) {
    :where(:scope).inv-badge,
    .inv-badge {
      border-radius: 0;
      font-style: italic;
    }
  }
}
```

- `CSSReset` renders the CSS in a `<style>` inside the themed root, so a bare
  `@scope` is scoped to that root, and travels with it into a detached window.
  The `to (…)` limit stops at a nested themed root, so a theme's rules don't
  reach into another's.
- A scope adds nothing to a selector's specificity, so an override is as
  specific as the default, in the same layer, and wins by being scoped, which
  beats an unscoped rule that's as specific, wherever each is in the document (a
  compound variant's classes after the first are in `:where()`, to be as
  specific as Panda's own).
- A plain selector in `@scope` never matches the scope root, and some classes
  are on it (`sheetRoot`), so each class is written `:where(:scope).inv-x, .inv-x`.
- `appFrame` rules are for Foundry's window, outside the root, so they use
  `@scope ([data-inv-frame="<slug>"])` (`themeSlug`, unique to the theme).
- The CSS is made the first time a theme is used and kept (`themeCss`): only
  themes in use are made, once each. A theme's values go into its `<style>` as
  written.

### Where the CSS goes

Foundry v14 orders its CSS in cascade layers, and a system's styles belong in
`system`. Ours go in sub-layers of it, in this order (`src/panda.css`):
`system.reset`, `system.base`, `system.tokens`, `system.recipes`,
`system.defaults`, `system.states`, `system.utilities`. Panda splits
`system.recipes` into `base`, `slots` (with its own `base`, `variants` and
`compound_variants`), `variants` and `compound_variants`; `system.states` is
`hover`, `drop` and `focus`, each with `default` and `theme`. **Nothing goes
directly in `system`**: rules there beat everything in its sub-layers.
`system.base` has the palette's defaults (`palette.css`), the element defaults
(`elements.css`) and `investigator.less`'s Foundry fixes; `system.recipes` the
catalogue classes and a theme's overrides of them; `system.defaults` components'
own overridable layout; `system.states` the state layers (`states.css`) and a
theme's changes to them; `system.utilities` layout from `css()` at call sites.

A theme's `globalCss` is a `<style>` in the root, like its overrides. The
palette is an inline `style` on the themed root, not in a stylesheet: a detached
window (Foundry's own, or PopOut!) copies the page's stylesheets when it opens,
but not rules inserted into them at run time, so anything themed has to travel
with the element (#1537).

The build's CSS target (`build.cssTarget` in `vite.config.ts`) is the browsers
our CSS needs anyway. With Vite's default, the minifier would polyfill
`light-dark()` with variables it sets only where a stylesheet declares
`color-scheme`, which a themed root sets inline, so it would resolve to nothing.
Panda's generated code (`src/styled-system`) isn't committed: `pnpm install`
and `pnpm build` generate it; after changing `panda.config.ts`, run
`pnpm exec panda codegen`.
