# Theming

How themes are defined and how components get their look. This is the
contract: what each palette entry and catalogue class **means**, so that anyone
writing a component or a theme makes the same choice in the same place.

A theme is a **palette** (colours and a few shared values), its **fonts**, and
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
   lives: `sheetRoot`, `appFrame`, `tabs.tab`, `logo`, `portrait` and
   `card.root`.
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
`ThemeFonts`, `ThemeCatalogue`, `ThemeStyle`, `PaletteVar`, `FontVar`.
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
  fonts: {
    baseSize: "16px",
    body: { family: "'Saira', sans-serif", weight: 500 },
    display: { family: "'Federo', serif", caps: "small-caps", scale: 1.1 },
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
    button: {
      // pressed, and focused, whatever the kind
      states: {
        pressed: { background: "var(--inv-accent)" },
        focusRing: { outlineStyle: "dashed" },
      },
      variants: {
        kind: {
          // a pip: its look, and beside it, its own states
          pip: {
            textAlign: "center",
            states: {
              pressed: { outline: "1px solid var(--inv-line)" },
              hoverFeedback: { boxShadow: "none" },
            },
          },
        },
      },
    },
    // a slot recipe: styles by slot, and its states too
    tabs: {
      base: { tab: { textTransform: "uppercase" } },
      states: { selected: { tab: { fontWeight: "bold" } } },
    },
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
theme's own values are inline on the root, so they win. A theme names its
fonts (below) but doesn't load them. The built-ins' fonts come from the
system's CSS, a module theme's from its module's, and a folder theme's from
`@font-face` or `@import` in its `globalCss`.

**The catalogue** is keyed by recipe name (`badge`, `partyCell`), each shaped
like the recipe's own Panda config:

- `base`: the recipe's base (by slot, for a slot recipe: `tabs`, `card`,
  `logo`, `checkbox`, `toggle`, `fieldGrid`, `appFrame`).
- `variants`: `{ tone: { danger: {...} } }` (by slot, for a slot recipe). A
  value's style can have `states` beside it, for that variant's elements only:
  everything about a pip, pressed and hovered too, is in
  `variants: { kind: { pip: { ..., states: {...} } } }`.
- `compoundVariants`: `[{ tone: "danger", weight: "strong", css: {...} }]`
  apply to an element with every variant they name, whether or not the recipe
  has a compound variant for them. A boolean variant's value is `true` or
  `"true"`. Beside `css`, or instead of it, `states`, for that element only.
- `states`: this recipe's elements' states (by slot, for a slot recipe): the
  state layers (`hoverFeedback`, `focusRing`, `dropTarget`) and the element
  states the recipe has (`pressed`, `disabled`...). `states` beside the
  recipes changes the state layers everywhere in the theme. See States, below.

A state is never a nested selector in `base` or `variants`
(`"&[data-pressed]"`): the state's default goes over those, so a theme's look
for it there wouldn't show. Such a selector, for a state the recipe has, is
kept, with a warning that says where it belongs.

**Every part patches.** Its declarations go over the default's, in the same
cascade layer, at the same specificity (a theme's rules are scoped, and a
scoped rule beats an unscoped one that's as specific); whatever it doesn't say
stays. To take a declaration away, set it
(`borderBottomStyle: "none"`). To start a part from nothing, write
`all: "revert-layer"` first in its style: it drops what the recipe says for
that part (in `variants`, for every variant, as they share a layer, so use it
on `base`). `all: "revert-layer"` there doesn't drop a state's look: the states
are in layers of their own, after the recipes' (start a state from nothing in
its own `states`, below).

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
`layout: full-frame` variant, which a theme can patch. Its buttons, and its
tint on hover, are in `--inv-titlebar-ink` (`text` unless a theme sets it on
the `header` slot): what's under the strip is the theme's backdrop, so the ink
that reads on it is the theme's to choose, kind of sheet by kind of sheet
(below).

**Kinds of sheet.** Every themed window is one of three kinds, the `sheet`
variant of `sheetRoot` and of `appFrame`, and each makes a promise about what's
on the wallpaper, so a theme can give each the backdrop (and titlebar ink) it
needs:

| `sheet`     | Windows                                                                                                    | On the wallpaper                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `character` | a PC's or NPC's sheet, full or limited                                                                     | only regions, tabs (their strip and content), the portrait and the logo                                                                                   |
| `item`      | an item's sheet: `ItemSheetFramework` (equipment, weapons, bonds...), a Moribund World item's, or a card's | its header (the image and the name) over a region with the body; a card's sheet is a toolbar over the card. Text and controls may be on the wallpaper too |
| `freeform`  | anything else: the party sheet, the settings, the journal editor, Team Crisis                              | anything: assume nothing about the layout                                                                                                                 |

So a bold, bright wallpaper can suit character sheets, with smoky regions and
tab content to keep them legible, while item sheets get the same image under a
gradient that mutes it, and freeform ones a wash over all of it. A theme's
`appFrame` can follow, with the strip's ink in a compound variant:
`{ layout: "full-frame", sheet: "character", css: { header: { "--inv-titlebar-ink": "#2c1a1b" } } }`.
A sheet that breaks its kind's promise is a bug in the sheet, not the theme.
The loading spinner (`Suspense`) is the kind of the sheet it stands in for.

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
top-level, palette or font key warns. An unknown recipe, slot, variant, value or state
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
| `surface`                                                  | What a sheet's content sits on: a region, or a tab's content. May be translucent or even transparent, so the wallpaper shows through; things that overlap or scroll over other content use `surfaceSolid`            |
| `surfaceNested`                                            | What a box _within_ that content is made of: a panel                                                                                                                                                                 |
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
| `cardGap`                                                  | The spacing between cards (a CSS `gap` value: a row gap, then a column gap), and around a card array; `CardArray` reads `--inv-card-gap`, `--inv-card-gap-row` and `--inv-card-gap-column`. Default: `0.5em`         |

The `on*` inks are white below 72% OKLCH lightness (where APCA's contrast
flips) and black above, worked out in CSS with relative colour syntax, so they
work for any CSS colour, including `color-mix()` and `var()`. Status-tinted
surfaces (flagged rows, invalid inputs, callouts, abilities nobody has) are
derived in their recipes, from the status colours and the surfaces.

## Fonts

Two text styles: **`body`** (prose and controls; the sheet's root has it) and
**`display`** (titles, headings, tabs, labels, buttons: `textStyle: "display"`
in a recipe). A theme's `fonts` sets each style's typeface, field by field, and
the size of body text. Each field is a custom property on the themed root
(`--inv-` and the style and field in kebab case: `display.letterSpacing` is
`--inv-display-letter-spacing`), with defaults in `palette.css`:

| Field           | CSS                 | Default                             |
| --------------- | ------------------- | ----------------------------------- |
| `family`        | `font-family`       | body: the window's; display: body's |
| `weight`        | `font-weight`       | body: `normal`; display: body's     |
| `stretch`       | `font-stretch`      | body: `normal`; display: body's     |
| `style`         | `font-style`        | body: `normal`; display: body's     |
| `caps`          | `font-variant-caps` | body: `normal`; display: body's     |
| `case`          | `text-transform`    | body: `none`; display: body's       |
| `letterSpacing` | `letter-spacing`    | body: `normal`; display: body's     |
| `lineHeight`    | `line-height`       | body: `normal`; display: body's     |
| `scale`         | (below)             | `1`                                 |

`baseSize` (`--inv-base-size`, default `1em`, the window's) is the size of the
sheet's body text, times body's `scale`; everything else is relative to it.

**Sizes belong to the catalogue, not the theme.** How big a kind of text is
(a tab's label, an `h1`) is the catalogue's choice. A typeface's `scale` is
how big it _looks_: a condensed or small-caps face that looks small at a given
size wants more than 1, and every size the style is set at is multiplied by
it. So a theme can change typeface without retuning every size, and an
override shared between themes gets each theme's scale.

Display text's size is `--inv-display-size`, a multiple of the text around it
(a number, default `1`, not inherited), set where it's used: the display style's
`font-size` is `calc(1em * var(--inv-display-size) * var(--inv-display-scale))`.
**To resize display text, set `--inv-display-size`**, not `fontSize`, which
would lose the scale:

```ts
tabs: { base: { tab: { "--inv-display-size": "1.1" } } },
```

An override that starts from nothing (`all: "revert-layer"`) loses the text
style too, as it's part of the recipe's base. `underlineTabs` in
`src/themes/helpers.ts` puts it back.

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
`data-interactive` if clickable; `aria-pressed` makes it a toggle: `pressed`
is selected (`accent` fill, `onAccent` ink), whatever the tone. `Translate` sets an inline
`background`, so put a badge on a wrapper around it.

**`button`**: something you click to do something; use `Button`, which sets
`data-interactive` and is disabled when the sheet isn't editable. _Not for_
links, or on/off settings (`toggle`). `kind`: `default`; `cta`, the call to
action, what you're probably about to click (the button that commits a panel),
at most one per panel, `accent` fill; `toolbar`, compact; `ghost`, no fill or
border, for icon buttons; `pip`, one of a row of small number picks. `pressed`
(`aria-pressed="true"`, or `data-pressed` on a label standing for a checked
radio) is selected, whatever the kind; `disabled` is faded. A `<button>` that isn't a `Button`
looks like Foundry's: there's no global button style, nor for inputs.

**`input`**: a field to type into (`TextInput`, `TextArea`, a raw `<input>`
applying `input()`). _Not for_ rich text (`richText`) or choosing from a list.
`surface`, `line` border, `body` style; `invalid` (`aria-invalid="true"`) is a
`danger` border and tint, and `disabled` is faded. **`select`**: a dropdown,
like `input` but on `surfaceNestedSolid` with options on `surfaceSolid`, as a
native dropdown doesn't show what's behind it.

**`checkbox`**: a box ticked or not, for yes/no in a list. Slots `box` and
`tick` (`accent`, shown when `checked`: the input before the box is).
**`toggle`**: an on/off switch for a setting or mode. Slots `track` and
`thumb`; `checked` (on: `data-state="checked"`, from Radix) is `accent` and
`onAccent`.

**`fieldGrid`**: a form as a grid of labelled fields (`InputGrid`, `GridField`,
`GridFieldStacked`). Slots `root` (the grid: its gaps), `label` (end-aligned,
towards its control) and `control` (the cell holding the input). The grid's
structure (its columns, and which column each part sits in) is the components'
layout, not the recipe's, so a theme can't move a part out of its column.
`stacked`: a label above its control, across both columns (`GridFieldStacked`).

**`region`**: an area of a sheet's layout (a character's stats, pools or
sidebar; the body of an item's sheet, below its header); use `Region`, which
owns the look and padding, while the call site owns layout. `surface`. _Not
for_ a box within an area (`panel`). A sheet is wallpaper, then regions, then
panels: regions don't nest, and a tab's content counts as one, though it's the
`tabs` recipe's own `content` slot, so a theme can style the two apart. A theme
may make a region solid, tinted or transparent, and it's the theme's job to
keep text and controls legible on it. _An expected override._

**`panel`**: a box of controls or content within a region (an ability test, a
weapon's attack, the ready weapon); use `Panel`, which owns the look and
padding, while the call site owns layout. `surfaceNested`. _Not for_ an area of
the sheet (`region`), things above the sheet (`floating`) or boxed messages
(`callout`). A panel always goes inside a region or a tab's content, never
straight on the wallpaper, where nothing promises it's legible. A panel inside
a panel looks the same as its parent.

**`callout`**: a boxed message about the content around it: why an action can't
happen ("Out of ammo"), or advice; use `Callout`, which adds the tone's icon and
an optional action. _Not for_ "nothing here" (`emptyState`) or a label
(`badge`). `tone`: `danger` stops an action, `warning` is advice. A 30% tint of
the tone's colour over `surfaceSolid`, with a bar in the tone's colour on the
left (`line` for neutral). One that says why an action can't happen goes just
below that action's button; advice about an area goes at its top.

**`tabs`**: a strip of tabs and the selected one's content (`TabContainer`).
Slots `list`, `tab`, `spacer`, `content`. _`tab` is an expected override, and so
is its `selected` state._

- The `selected` tab is `surface`, like the content, with `accent` ink; the
  others are a fainter `surface` (40% opacity on a light theme, 80% on a dark
  one, by `light-dark()`) with `text` ink, and `data-interactive`. A
  `disabled` tab is faded.
- When the strip is wrapped into a grid (by the code that measures it), the
  list, tabs, spacers and content all have `data-wrapped`: a layout, not a
  state, so a theme targets it with a nested rule (`"&[data-wrapped]"`, and in
  `states.selected` for a selected tab that's wrapped). The tabs are measured
  unwrapped, so a wrapped look can change their size. The default wrapped look
  is in `:where()`, so it's no more specific than the tab's own rule.

**Lists.** `sectionHeading`: a heading that divides a sheet into sections, with
a `line` rule (_not for_ column headers). `tableHeader`: a table's column
headers, bold, with a `line` rule. `row`: one item in a list, in `text` ink,
even a link. Variants: `interactive` (it opens or does something: a `feedback`
wash under the pointer, on focus, or with `data-highlighted`; rows don't use
`data-interactive`, as a glow round a row is too much), `alternate` and
`striped` (on `control`, by the call site or by position), `divided` (a `line`
under it). `selected` (`aria-current`, `aria-selected`, `data-selected`) is
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
wallpaper. Variant `sheet` (`character`, `item`, `freeform`: Kinds of sheet,
above), each on `wallpaper`, with its padding and height, so a theme can set
them. _Expected override:_ the backdrop image, in `sheet`.

**`appFrame`**: Foundry's window around a themed root. Slots `root` (the
`.application` element), `header` (the titlebar) and `content` (the
`.window-content` our root sits in). `CSSReset` puts the classes on them while
mounted, if it's the outermost themed root in the window and not
`noStyleAppWindow` (roots side by side take turns, the latest first: `frame.ts`).
The window gets the palette and `data-inv-frame`, not `data-inv-theme`, so it
has no element defaults or state layers. Empty by default, so a window looks
like Foundry's. _Expected override:_ a glow or border on `root`. Variant
`layout` is the theme's, not a call site's; `sheet` is the themed root's
(Kinds of sheet, above).

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
- A shadow or anything else sized in `em` goes on the name and the subtext
  (`rear`, `rear_sub`), not their `_wrapper`: an `em` is resolved where it's
  declared, so on the wrapper it's the name's, and the subtext gets the same
  offsets at half the size.
- The layout (the box sized by the call site, the backdrop and `text` filling it,
  each copy centred) is in a cascade layer after the theme's, so it wins, unless
  a theme says `!important`.
- The name is scaled down to fit the width, by its font size, measured with a
  hidden copy with the `front` style at full size. So `front` can set its own
  size, spacing and padding as long as they're in `em`: a fixed length (or a
  letter spacing set on `text` or a wrapper) doesn't shrink, and a long name
  overflows. A transform on `text` applies after the fit: shrinking is fine,
  enlarging can overflow. `front` mustn't set a `width`.

**`portrait`**: a document's image on its sheet (`ImagePickle`), the box
around the picture: its frame, shadow and transform. Variant `kind`, `actor`
(character and party sheets) or `item`, from the document. No transform by
default; its size and place are the call site's. _Expected override:_ a tilt
(most built-ins use `tiltedPortrait`, `rotateZ(-2deg)`, from `helpers.ts`).

**`card`**: a card (Cards rules), applied by `CardDisplay`. Slots `root`,
`supertitle`, `title`, `subtitle`, `description`, `effect`. The root is
`surfaceSolid` with a `line` border, as cards can be laid over other content. It
has `data-category` (the card's style key), so a theme can style a category's
cards (the base defines none). _`root` is an expected override._

**Surfaces.** `surface`: a plain area of surface that isn't a block of content (a
region or panel has padding; this doesn't): a notes area, a cover over a
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

## States

A state is something an element is, or feedback on it. Each has a default look,
and a theme changes it in `states`: a recipe's, a variant value's or a compound
variant's (one element), or beside the recipes (everything, for a state layer).
A state goes over `base`, `variants` and `compoundVariants`, the defaults' and
a theme's alike, so a theme's look for a recipe never hides it by accident. The
states are sub-layers of `system.states`, after the catalogue, and a theme's
change to one still loses to the states after it. Their order: `selected`,
`checked`, `pressed`, then `invalid`, then `disabled` (a disabled button
that's pressed looks disabled), then the state layers, `hover`, `drop` and
`focus` (focus is last, so it always shows).

- Within a state, the more specific wins: a compound variant's over a variant
  value's, over the recipe's, over the theme's own.
- A change patches: it says only what it changes
  (`{ hoverFeedback: { boxShadow: "none" } }` turns the glow off and leaves the
  pointer).
- `&` is the element in that state. The selectors are `stateLayers.ts`'s.

**Element states**: what an element is. Each recipe has the ones it has a look
for (its `…States`, next to it, collected in `elementStateDefaults.ts`), and a
theme can style only those, on that recipe's elements: `button.states.checked`
is a type error, and there's no element state beside the recipes. A theme's
change goes in the state's layer, with the defaults, and patches them as a
change to a recipe does (it's scoped, and as specific or more). So it says only
what it changes, and `all: "revert-layer"` first starts the state from nothing:
from the element's own look, without the default's look for the state.
`pnpm generate:catalogue` writes their defaults as CSS
(`elementStates.generated.css`), the recipes' types and this table:

<!-- element-states:start (pnpm generate:catalogue) -->

| Recipe     | `selected` | `checked` | `pressed` | `invalid` | `disabled` |
| ---------- | ---------- | --------- | --------- | --------- | ---------- |
| `badge`    |            |           | ✓         |           |            |
| `button`   |            |           | ✓         |           | ✓          |
| `checkbox` |            | ✓         |           |           | ✓          |
| `input`    |            |           |           | ✓         | ✓          |
| `row`      | ✓          |           |           |           |            |
| `select`   |            |           |           |           | ✓          |
| `tabs`     | ✓          |           |           |           | ✓          |
| `toggle`   |            | ✓         |           |           | ✓          |

<!-- element-states:end -->

| State      | When                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `selected` | The current one of several: `aria-current` (`page` or `true`), `aria-selected="true"`, `data-selected`                                        |
| `checked`  | On: `:checked`, `data-state="checked"` (Radix), or it's a label or span after a checked, visually hidden input (or in one: a checkbox's tick) |
| `pressed`  | A toggle button that's down (`aria-pressed="true"`), or a label standing for a checked radio (`data-pressed`)                                 |
| `invalid`  | `aria-invalid="true"`                                                                                                                         |
| `disabled` | `:disabled`, `disabled`, `aria-disabled="true"`, `data-disabled`, or it's a label or span after a disabled, visually hidden input (or in one) |

**State layers**: feedback that looks the same on anything, whatever its class,
so classes don't each draw their own. Their defaults are plain CSS in
`src/themes/catalogue/states.css`, which a test checks against
`stateLayers.ts`, in each layer's `default` sub-layer; a theme's changes go in
its `theme` sub-layer, after it, so they win whatever their specificity (one
for everything is less specific than its default). A recipe's `base` or `variants` can't change one by accident
(a static `boxShadow` doesn't hide the hover glow, nor `outline: none` the
focus ring).

| Layer           | When                                                                                   | Look                                               |
| --------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `hoverFeedback` | `[data-interactive]:hover`, unless disabled                                            | A `feedback` glow, and a pointer                   |
| `focusRing`     | `:focus-visible`, on anything; for a visually hidden input, the label or span after it | A 2px `feedback` outline                           |
| `dropTarget`    | `[data-drop-state="ready"]`: you can drop what you're dragging here                    | A dashed `line` outline, outside the element       |
|                 | `[data-drop-state="over"]`: and it's over it                                           | The outline turns `accent`, with a `feedback` tint |

- `&` is `[data-interactive]:hover` for `hoverFeedback`; either drop state for
  `dropTarget` (`'&[data-drop-state="over"]'` for over only); `:focus-visible`
  for `focusRing` (and, for a visually hidden input, the label or span after
  it).
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

A V1 seed's optional `layout` is ThemeV2's (above). It defaults to
`"standard"`, so a V1 theme from a module or the theme folder keeps the layout
it was written for; the built-in V1 themes set `"full-frame"`.

| V1                                                    | Palette                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| `backgroundPrimary` / `backgroundSecondary`           | `surface` / `surfaceNested`                                         |
| `backgroundButton`                                    | `control`                                                           |
| `accent`                                              | `accent` (and `link`, by default)                                   |
| `accentContrast`                                      | `onAccent`                                                          |
| `glow`                                                | `feedback`                                                          |
| `controlBorder`                                       | `line`                                                              |
| `danger`, `warning`, `success`                        | The same. `info` is always `#2b6cb0`                                |
| `bodyFont`, `displayFont`, `displayFontTextTransform` | `fonts` (below)                                                     |
| `cards.area`                                          | `cardGap` (the vertical spacing, then the horizontal)               |
| (from `text`)                                         | `polarity`: light text (measured in the browser) means a dark theme |

V1's fonts were `font` shorthands (`fontsFromV1` takes them apart): body's size
becomes `baseSize`, display's (in `em` or `%`, or `px` over a body size in
`px`) its `scale`, and `displayFontTextTransform` its `case`. What a shorthand
leaves out is `normal`, as the shorthand reset it, and a size keyword is a
length. A system font (`caption`) can't be taken apart, so it's dropped. A V1
tab keeps V1's size, without the scale (V1's tab style sets `1.2em`).

A V1 palette has no solid surfaces: its surfaces can be translucent, and V1
flattened them over the wallpaper where something overlapped other content.
Instead, every part the catalogue puts on a solid surface, or on a tint of one,
is overridden with the surface (or the same tint of it) layered over the
wallpaper (`solidsFromV1`; a test checks it has them all). `color-mix()` takes
alpha into account, so a tint of the translucent surface over the wallpaper is
the tint of the flattened one. Muted text, which can't be layered, mixes with
the translucent surface, and native `<option>`s are on it.

How its styles map:

- `panelStylePrimary` patches `region`, and `panelStyleSecondary` (else the
  primary) patches `panel`: V1's top-level panels are regions now, and its
  nested ones panels. One without a background gets
  `backgroundColor: transparent`.
- The seven `tab*Style` fields become the `tabs` slots `tab`, `spacer` and
  `content`, each starting `all: "revert-layer"`, with V1's wrapped styles as
  nested rules. V1's selected styles (`tabActiveStyle`, and
  `tabWrappedActiveStyle` for a wrapped tab) become the tab's `selected` state,
  starting from nothing, as in V1 the active style went over the tab's own
  look.
- `largeSheetRootStyle` patches the `sheetRoot` `character` variant, and
  `smallSheetRootStyle` the `item` and `freeform` ones (V1's journal editor
  was large, but the small style suits a freeform window better);
  `appWindowStyle` goes in the `appFrame` `root`.
- Each `logo` style goes on its slots, spread over `logoDefaults.ts` (a relative
  font size on the text is divided by 4, as it's inherited from 4em now).
- Portraits are tilted, as they were in V1: an item's `rotateZ(-2deg)`, an
  actor's `rotateZ(2deg)` in the standard layout and `rotateZ(-2deg)` in the
  full-frame one (towards the sheet's nearer diagonal).
- Each `card` slot is V1's style for it, after `all: "revert-layer"`; each of
  `cards.categories` is a nested `[data-category="…"]` rule on the slot,
  patching the base; a `hoverStyle` is a `:hover` rule on the root.
- `global` becomes `globalCss`, with Emotion's labels stripped. `tabClass`,
  `panelClass` and `notesCssClasses` are ignored.

## The built-in themes

Each lives in `src/themes/*Theme.ts`. The ones in `v1Themes` in
`baseThemes.ts` are still V1 sources, converted at load until each gets its
makeover; the rest are hand-written ThemeV2.

A makeover starts from what the V1 theme converts to: `pnpm theme:print
<name>` prints a built-in as the ThemeV2 it installs as. To see a theme,
`pnpm theme:shots` screenshots the sheets in each built-in theme (set
`THEMES=niceTheme,niceThemeDark` for fewer) into `theme-shots/`, on the e2e
servers (`e2e/README.md`), from `build/`: `pnpm build` first.

Of the
[theming epic](https://github.com/lumphammer/gumshoe-fvtt/issues/1532)'s end
goals, native ThemeV2 authoring, `ThemeV1` as only a step from `ThemeSeedV1`,
no `ThemeContext`, and custom V1 and V2 themes are done; every built-in being
ThemeV2 with a makeover is not.

Still to do:

- Check every theme for legibility on item sheets, whose body is a region:
  its fields used to sit on the wallpaper, and its boxes of controls were
  `surface`, not `surfaceNested`.
- The `surface` recipe's `depth` is still chosen by its call sites. Work out
  whether it should follow regions and panels instead.

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
the element states (`selected`, `checked`, `pressed`, `invalid`, `disabled`)
(a layer each), and then `hover`, `drop` and `focus`, each with `default` and
`theme`. **Nothing goes
directly in `system`**: rules there beat everything in its sub-layers.
`system.base` has the palette's defaults (`palette.css`), the element defaults
(`elements.css`) and `investigator.less`'s Foundry fixes; `system.recipes` the
catalogue classes and a theme's overrides of them; `system.defaults` components'
own overridable layout; `system.states` the states' defaults (`states.css`,
`elementStates.generated.css`) and a theme's changes to them; `system.utilities` layout from `css()` at call sites.

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
