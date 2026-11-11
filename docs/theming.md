# Theming

How themes are defined and how components get their look. This is the
contract: what each palette entry and catalogue class **means**, so that anyone
writing a component or a theme makes the same choice in the same place.

A theme is a **palette** and overrides of the **catalogue**: named classes,
one per kind of thing, built from the palette with Panda. Every component's
look comes from the catalogue, and none reads a theme's colours. Themes are
written as ThemeV2 (below); V1 themes still work, converted when they're
installed. The built-in themes are V2, printed from their V1 originals so
they look as they did: restyling them is still to do. Layout at call sites
is Panda's `css()` (see Converting a component); Emotion is gone.

## End goals

A few end goals of the whole [theming epic](https://github.com/lumphammer/gumshoe-fvtt/issues/1532):

- We will have a way to author themes which is native to the new catalogue +
  Panda system. Let's refer to this as `ThemeV2` for now.
- `ThemeV1` will only exist as a stepping-stone from `ThemeSeedV1` to
  `ThemeV2`; it's never used anywhere else.
- `ThemeContext` will _probably_ go away - ideally the remaining call sites can
  all get what they need from catalogue recipes. If there are exceptions, they
  will be evaluated on a case-by-case basis.
- All our built-in themes will be converted to `ThemeV2` and given a makeover.
- Custom themes loaded from a folder will still work, and they can be
  `ThemeSeedV1` or `ThemeV2` format.

Where they stand: ThemeV2 exists, and module and folder themes can be V1 or
V2; `ThemeV1` is only a step on a V1 theme's way to the runtime theme;
`ThemeContext` is gone; the built-in themes are converted, but not yet given
their makeover.

## The pieces

- **Palette**: a theme's colours, fonts and a few shared values, each with
  one meaning (below). `ThemePalette` in the types package; complete, it's
  `Palette` in `src/themes/palette.ts`.
- **Catalogue**: named classes, each a bag of styles for one kind of thing
  ("a badge", "a callout"), with variants. Built from the palette with Panda
  recipes. Themes can override any of them.
- **Themes**: a palette, overrides of the catalogue, and optionally raw CSS
  (ThemeV2, below). Every installed theme is resolved into one runtime
  `Theme` (`src/themes/theme.ts`), which is all the rest of the code sees.
- **Call sites**: components apply catalogue classes and write layout.

## Rules

1. **Call sites apply classes and write layout. They never read palette
   values.** Only catalogue classes read the palette. If a call site seems to
   need a colour, the catalogue is missing an entry or a variant.
2. **At most one catalogue class per element**, with its variants, plus
   layout. Layout never comes from the catalogue, and look never comes from
   the call site. No exceptions.
3. **Classes are self-contained.** They share a look only through the palette,
   typography included. Overriding a class affects that class and nothing
   else.
4. **Every class has a default built from the palette**, so a palette on its
   own makes a usable theme. Themes may override any class: a shallow
   "replace", per slot for classes with slots. Some slots are _expected_ to be
   overridden, because that's where a theme's personality lives:
   `sheetRoot`, `appFrame`, `tabs.tab`, `logo` and `card.root`.
5. **States are attributes; variants are design choices.** Selected, disabled,
   invalid, inactive, expanded and drag states come from attributes the markup
   should have anyway (`aria-selected`, `aria-disabled`, `aria-invalid`,
   `aria-expanded`, `data-state`). Variants are for choices such as `tone`,
   `size` and `kind`.
6. **One `tone` vocabulary**: `neutral | danger | warning | success | info`.
   `accent` is not a tone.
7. **Everything has a written meaning**: a one-line TSDoc summary, and the
   full description here. Classes also say what they're **not for** where
   there's a neighbour to confuse them with.

A palette entry exists only if two or more classes need to agree on a value.
Spacing isn't one: it's layout.

## Themes (ThemeV2)

A theme is plain, JSON-serialisable data: no functions. Built-in themes are
TypeScript, through `defineThemeV2()` (`src/themes/theme.ts`), which only
type-checks them; a module's theme or a theme file in the custom themes
folder (JSON or YAML) has the same shape. The types are in
`@lumphammer/investigator-fvtt-types`: `ThemeV2`, `ThemePalette`,
`ThemeCatalogue`, `ThemeStyle`, `PaletteVar`.

```ts
defineThemeV2({
  schemaVersion: "v2",
  displayName: "Example",
  description: "Optional",
  palette: {
    polarity: "light",
    wallpaper: "#ddd",
    surface: "#fff",
    surfaceNested: "#f4f4f4",
    control: "#e8e8e8",
    text: "#433",
    accent: "#1d5d5d",
    line: "#766",
    feedback: "#5effff",
    danger: "#c00",
    warning: "#d68a00",
    success: "#080",
    info: "#2b6cb0",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: { backgroundImage: "url(modules/my-theme/paper.webp)" },
        },
      },
    },
    badge: {
      base: { borderRadius: 0, fontStyle: "italic" },
      variants: { tone: { danger: { fontWeight: "bold" } } },
      compoundVariants: [
        { tone: "danger", weight: "strong", css: { color: "onDanger" } },
      ],
    },
    // a slot recipe: styles by slot
    tabs: { base: { tab: { textTransform: "uppercase" } } },
  },
  globalCss: "@import url(modules/my-theme/fonts.css);",
});
```

- One palette per theme: light and dark versions of a design are separate
  themes. No `extends`: TypeScript themes share code by spreading objects.
- `CONFIG.Investigator.installTheme(id, theme)` takes a V1 or a V2 theme, by
  its `schemaVersion`; so does the custom themes folder.
- The theme picker's swatch is drawn from the palette.

### The palette, in a theme

**Required**: `polarity` (stated, never guessed), `wallpaper`, `surface`,
`surfaceNested`, `control`, `text`, `accent`, `line`, `feedback`, `danger`,
`warning`, `success`, `info`. **Optional**, each worked out unless the theme
sets it (`resolvePalette`): `textMuted` (`text`, 70% over `surface`), `link`
(`accent`), the `on*` inks (black or white, whichever reads better by APCA
contrast; for a colour it can't read, such as a `color-mix()` or a
`var()`, white, or black for `onWarning`, so a theme with one of those sets
the ink itself), `radius` (`0.25em`), `elevation` (`0 0 0.5em black`), `bodyFont`
and `displayFont` (`inherit`), `displayCase` (`none`),
`displayLetterSpacing` (`normal`), and `cardGap` (`0.5em`). What each means
is under Palette, below.

Fonts are palette entries only: a theme doesn't load them. The built-in
themes' fonts come from the system's CSS, a module theme's from its module's,
and a folder theme's from `@font-face` or `@import` in its `globalCss`.

### Overrides: `catalogue`

Keyed by recipe name as written in code (`badge`, `partyCell`,
`sectionHeading`), each shaped like the recipe's own Panda config:

- `base` **replaces** the recipe's base: none of the recipe's own
  declarations survive there, so it has to say everything it wants. For a
  slot recipe (`tabs`, `card`, `logo`, `checkbox`, `toggle`, `appFrame`),
  `base` is by slot, and replaces each slot it names.
- `variants` (`{ tone: { danger: {...} } }`, by slot for a slot recipe)
  **patch** the recipe's variants: their declarations go over the variant's,
  and the rest of it stays.
- `compoundVariants` (`[{ tone: "danger", weight: "strong", css: {...} }]`)
  patch an element with every one of the variants they name, whether or not
  the recipe has a compound variant for them. A boolean variant's value can
  be `true` or `"true"`.

A style is CSS properties in camelCase (a number is pixels, for a property
that takes a length; an array is fallbacks, one declaration each), custom
properties (`"--my-thing"`), and nested rules keyed by a selector containing
`&` (`"&:hover"`, `"input:checked + &"`, `"& img"`) or by an at-rule
(`"@media (...)"`). There are no bare descendant selectors, and no Panda
shortcuts (`_hover`). In a colour property (`color`, `background`, `fill`,
`stroke`, and any `…Color`), a value that's exactly the name of a palette
colour (`color: "accent"`) is that colour. Anywhere else, and inside an
expression, a palette entry is its custom property:
`"oklch(from var(--inv-surface) calc(l - 0.1) c h)"`. (`cursor: "text"` is
CSS's `text`.)

A card category's style is a nested selector in the `card` override, on the
`data-category` attribute of the card's root: `'&[data-category="stress"]'`
in the `root` slot, `'[data-category="stress"] &'` in the others. Theme
overrides and how they're rendered are under Theme overrides, below.

### `globalCss`

A raw CSS string, in a `<style>` in the themed root, unscoped: an escape
hatch for what the catalogue can't express, and for loading a folder theme's
fonts. It isn't supported: it can break as the markup changes.

### `layout`

How the character sheets are laid out: `"standard"` (the default) or
`"full-frame"`. In the full-frame layout the sheet runs up to the window's top
edge, under a see-through titlebar: a strip across the top, as tall as
Foundry's own (`--header-height`), with no title. It's still the titlebar: it
drags the window, and a double click on it minimizes it, and its buttons are in
a row at the right, with room for a module's. It shows a faint tint on hover,
so you can see where it is. The title shows only when the window is minimized,
as an ordinary titlebar.

The logo runs up under the strip, but its text keeps below it
(`--inv-logo-top-inset`, `CSSReset`): the name and the subtext are scaled down
together to fit the height left, and the name further, if it needs to, to fit
the width (`LogoEditable`). The PC and NPC sheets put the portrait (and the
sidebar) on the left, its top under the strip too. The sheets' grids follow
`data-inv-layout` on the themed root.

Only for windows with a logo (character sheets), which keeps its text clear of
the strip (`data-inv-clears-titlebar`): other windows keep the standard
titlebar. A detached window keeps the look. The titlebar's look is the
`appFrame` recipe's `layout: full-frame` variant, which a theme can patch (its
tint, or a backing for the buttons, say).

### Types and checks

- `pnpm generate:catalogue` (`scripts/generateCatalogueShapes.ts`) writes
  each recipe's slots and variants from the recipes registered in
  `panda.config.ts`: as types in the types package
  (`catalogue.generated.ts`), which `ThemeCatalogue` is built from, and as
  the list the app checks a theme's catalogue against
  (`src/themes/catalogue/recipeShapes.generated.ts`). `pnpm check` fails if
  they're out of date. So a recipe, slot, variant or value that doesn't exist
  is a type error.
- The catalogue's recipe, slot and variant names and values are public API:
  renaming or removing one is a breaking change for the types package;
  adding one isn't.
- Every theme but the built-ins is checked when it's installed
  (`validateThemeV2`): a module may be plain JavaScript, or built against an
  old version of the types. A theme whose shape is wrong (a missing required
  palette entry, a `polarity` that isn't `light` or `dark`, an unknown
  `schemaVersion`) is refused, with an error that says everything wrong with
  it, shown to the GM for a folder theme. What isn't part of a theme is
  ignored with a warning. So is what doesn't fit the catalogue
  (`compileCatalogue`): an unknown recipe, slot, variant or value is left
  out, and so is a declaration or nested rule that isn't valid inside a
  style, on its own. A style with nothing valid left in it is left out
  whole, so it doesn't replace a base with nothing (an empty one, `{}`,
  still does: that's what it says).
- The types package ships its declarations (`files`, `prepack`), for
  `bundler` and `nodenext` resolution alike (#1557).

## Palette

Each entry is a custom property on the themed root (`--inv-` and the name in
kebab case: `surfaceNested` is `--inv-surface-nested`), and a Panda token
(`colors.surfaceNested`).

| Entry                                                | Meaning                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `polarity`                                           | `light` or `dark`. Sets `color-scheme` on the themed root, so scrollbars and native controls match. Light and dark versions of a design are separate themes                                                                                                                                                                                   |
| `wallpaper`                                          | The colour the sheet's backdrop averages to. Shown while images load. Must agree with the backdrop image                                                                                                                                                                                                                                      |
| `surface`                                            | What content sits on. **Expected to be opaque**: things that overlap or scroll over other content (dropdowns, sticky headers, floating messages, cards) sit on it too. Not enforced: a theme can make it translucent, but then it has to keep those things opaque itself, with overrides (the `solid` and `header` variants are there for it) |
| `surfaceNested`                                      | What content _inside_ content sits on. Opaque, like `surface`. A panel inside a panel uses it, worked out from the structure, never chosen by the call site                                                                                                                                                                                   |
| `control`                                            | The fill of controls: buttons, toggle tracks                                                                                                                                                                                                                                                                                                  |
| `text`                                               | The default ink. Legible on both surfaces and on `control`                                                                                                                                                                                                                                                                                    |
| `textMuted`                                          | Ink for secondary information: notes, empty states, inactive rows, table headers                                                                                                                                                                                                                                                              |
| `link`                                               | Ink for links within prose (rich text, journals, notes). Distinguishable from `text` in running text. Not for other clickable things                                                                                                                                                                                                          |
| `accent`                                             | **Selected, or a call to action**: the active tab, a toggle that's on, the OK button. _Not_ "clickable": most of a sheet is clickable, and that's shown by shape, hover feedback and the cursor                                                                                                                                               |
| `onAccent`                                           | Ink on an `accent` fill                                                                                                                                                                                                                                                                                                                       |
| `feedback`                                           | The colour of hover, focus and drag-over feedback. Never state or decoration                                                                                                                                                                                                                                                                  |
| `line`                                               | Structural lines: control outlines, separators, heading rules, table header rules                                                                                                                                                                                                                                                             |
| `danger`, `warning`, `success`, `info`               | Status. Each is legible as text on both surfaces                                                                                                                                                                                                                                                                                              |
| `onDanger`, `onWarning`, `onSuccess`, `onInfo`       | Ink on the matching status fill. Unless a theme sets it, black or white, whichever reads better by APCA contrast (WCAG 2's ratio prefers black on saturated reds, where white reads far better)                                                                                                                                               |
| `radius`                                             | The one corner radius classes share (Panda: `radii.standard`)                                                                                                                                                                                                                                                                                 |
| `elevation`                                          | The shadow for anything floating (Panda: `shadows.elevation`)                                                                                                                                                                                                                                                                                 |
| `bodyFont`                                           | The `body` text style: prose and controls. A CSS `font` value                                                                                                                                                                                                                                                                                 |
| `displayFont`, `displayCase`, `displayLetterSpacing` | The `display` text style: titles, headings, tabs, labels. Panda applies the three together as `textStyle: "display"`                                                                                                                                                                                                                          |
| `cardGap`                                            | The spacing between cards (a CSS `gap` value: a row gap, then a column gap), and around a card array. `CardArray` reads it, as `--inv-card-gap` and its axes `--inv-card-gap-row` and `--inv-card-gap-column`                                                                                                                                 |

Status-tinted surfaces (flagged rows, invalid inputs, callouts, the party
sheet's abilities nobody has) are derived in their recipes, from the status
colours and the surfaces, not set by themes.

## Catalogue

Each class is a Panda recipe in `src/themes/catalogue/`, registered in
`panda.config.ts`. Its CSS class is `inv-` and its name in kebab case
(`inv-badge`, `inv-section-heading`), and each variant gets its own class
(`inv-badge--tone_danger`); compound variants too
(`inv-badge--compound__tone_danger__weight_strong`). Every variant is
generated whether a call site uses it or not, so a theme can override any of
them.

Call sites import the recipe from `styled-system/recipes` and apply it, with
layout from `css()` alongside:

```tsx
<span className={cx(badge({ tone: "danger", weight: "strong" }), css({ marginInline: "0.25em" }))}>
```

`strictTokens` is on, so a colour in `css()` has to be a palette token (and a
call site shouldn't be setting one anyway). Spacing and sizes take any value:
they're layout, not tokens (the `layout-is-not-tokens` plugin in
`panda.config.ts`).

### `tone`

`neutral | danger | warning | success | info` (`src/themes/catalogue/tones.ts`).
`neutral` is the default. The status tones mean what the status colours mean.
There's no `accent` tone: "selected" is a state and "call to action" is a
kind.

### `badge`

A short label attached to something, saying what it is or what state it's in:
"Boosted", "Hurt", "Broken", an unlock, a situational modifier.

- **Not for** messages or warnings (a callout), or links to documents.
- **Shape**: fully rounded ends, not the palette's `radius`.
- **Variants**: `tone`, and `weight`: `subtle` (the default) is an outline in
  the tone's colour with no fill; `strong` is filled with the tone's colour
  (`control` for `neutral`), with its `on-` ink.
- **States**: a badge that does something when clicked has `data-interactive`.
  A badge that toggles something has `aria-pressed`, and pressed shows as
  selected: an `accent` fill with `onAccent` ink, whatever the tone.
- `Translate` sets an inline `background`, so a badge goes on a wrapper
  around it, never on the `Translate` itself.

### `button`

Something you click to do something. Use the `Button` component
(`src/components/inputs/Button.tsx`), which applies the class, marks itself
`data-interactive`, and is disabled when the sheet isn't editable.

- **Not for** links to documents (a link), or on/off settings (a toggle).
- **Variants**: `kind`:
  - `default`: an ordinary action. `control` fill, `line` border, `text` ink,
    the `display` text style.
  - `cta`: the call to action: what you're probably about to click if you're
    looking at this UI, such as the button that commits a panel ("Rebuild
    Bond", "Establish Bond", "Make the test", the attack button, the ability
    sheet's "Test"). At most one per panel. `accent` fill, `onAccent` ink.
  - `toolbar`: compact, for a row of tools. As wide as its content.
  - `ghost`: no fill or border, just ink: icon buttons such as delete, and
    the settings Back button.
  - `pip`: one of a row of small number picks (a pool tracker's boxes): the
    body text style, no padding, square, on `surface`; pressed when it's the
    current value.
- **States**: `:disabled` (half opacity). Pressed (`aria-pressed="true"`, or
  `data-pressed` on a label standing for a checked radio) shows as selected:
  an `accent` fill with `onAccent` ink, whatever the kind. `CheckButtons`
  (the spend selectors) is a row of pressed-or-not `toolbar` buttons. Hover
  and focus come from the state layers.
- `Button`'s layout defaults (full width; content width for `toolbar`) are
  atomic classes: a call site's own width replaces them.

There's no global button style any more: a `<button>` inside a themed root
that isn't a `Button` (or doesn't apply the class) looks like Foundry's. The
same goes for inputs and selects.

### `input`

A field to type into: `TextInput` (and the async text and number inputs
built on it) and `TextArea` apply it; a raw `<input>` applies `input()`.

- **Not for** rich text (`richText`), or choosing from a list
  (`select`).
- `surface` background, a `line` border, `text` ink in the `body` text
  style. A placeholder is faded and italic.
- **States**: invalid, via `aria-invalid="true"` (`TextInput` sets it when
  validation fails): a `danger` border and tint. Focus is the `focusRing`.

### `select`

A dropdown, for choosing one of a list: `Select` applies it; a raw
`<select>` applies `select()`. Like `input`, but on `surfaceNested`, with
its options on `surface`.

### `checkbox`

A box that's ticked or not, for yes/no in a list or table (an occupational
ability). Slots `box` and `tick` (`inv-checkbox__box`, `inv-checkbox__tick`),
applied by `Checkbox`, which hides the real input just before the box. The
box is `control` with a `line` border; the tick is `accent`, shown when the
input is checked. **Not for** settings that switch something on (`toggle`).

### `toggle`

An on/off switch, for a setting or mode ("Edit mode"). Slots `track` and
`thumb` (`inv-toggle__track`, `inv-toggle__thumb`), applied by `Toggle`. On
(`data-state="checked"`, from Radix) fills the track with `accent` and the
thumb with `onAccent`; off is `control` and `text`.

### `panel`

A block of content on the sheet: an area of it (stats, pools, the NPC
sidebar), or a box of controls (an ability test, a weapon's attack). Use the
`Panel` component (`src/components/Panel.tsx`), which applies the class. The
class owns the look and the padding; the call site owns layout (grid area,
overflow, flex).

- **Not for** things raised above the sheet (`floating`), or boxed messages
  (`callout`).
- **Variants**: `depth`, which the call site **never** chooses: `Panel` works
  it out from where it sits.
  - `top`: content on the sheet. `surface`.
  - `nested`: content inside content: inside another `Panel`, or inside
    something marked `OnSurface`, such as a tab's content.
    `surfaceNested`. Deeper nesting stays `nested`.
- A panel that's also a grid of fields takes `inputGridStyle` rather than
  wrapping an `InputGrid`, so it stays one element.

### `callout`

A boxed message about the content around it: why an action can't happen
("Out of ammo"), or advice ("You have too many push pools"). Use the
`Callout` component (`src/components/Callout.tsx`), which applies the class
and adds the tone's icon and an optional action on the right (a "Clear jam"
button).

- **Not for** "there's nothing here" (an empty state), or a label on a thing
  (a badge).
- **Variants**: `tone`. `danger` is for something that stops an action;
  `warning` is advice. The box is a tint of the tone's colour over
  `surface`, with `text` ink and a bar in the tone's colour on the left
  (`line` for `neutral`).
- A callout saying why an action can't happen goes just below that action's
  button, in one place, so it doesn't move as callouts come and go. Advice
  about the area as a whole (the push-pool warnings) goes at the top of that
  area.

### `tabs`

A strip of tabs and the content of the selected one, applied by
`TabContainer`. Slots `list`, `tab`, `spacer` and `content`
(`inv-tabs__tab` and so on). _`tab` is an expected override, selected and
not._

- **States**, from the DOM rather than variants: a tab is selected when its
  hidden radio, just before it, is checked (`input:checked + &`); the strip
  is wrapped into a grid when the code that measures it sets `data-wrapped`
  on the list (`[data-wrapped] > &`, `[data-wrapped] + &` for the content).
  A theme's override can target these as nested rules. The default selected
  and wrapped looks have their context in `:where()`, so they're part of the
  tab's rule rather than states over it: an override of `tab` replaces them
  too. Disabled (`input:disabled + &`) still applies over an override.
- **Look**: the selected tab is `surface`, like the content, so they read as
  one, with `accent` ink. The others are a fainter `surface`, with `text`
  ink: 40% of its opacity on a light theme, whose pale surface is close to
  the wallpaper, and 80% on a dark one, where more would make the tabs
  vanish. `light-dark()` picks by the `color-scheme` that `polarity` sets.
  Unselected tabs are `data-interactive`.
- `content` is `surface`, owns the padding, and its children are nested, so
  a `Panel` in a tab is `nested`.
- `TabContainer` refits its strip when the theme changes (its fonts can
  change the tabs' widths), by watching the themed root's `data-inv-theme`
  and palette.

### Lists: `sectionHeading`, `tableHeader`, `row`, `dragHandle`, `emptyState`

- **`sectionHeading`**: a heading that divides a sheet into sections
  ("Academic", "Weapons"), with a `line` rule under it. Apply it to the
  heading, or to the row holding the heading and its buttons. _Not for_
  column headers.
- **`tableHeader`**: the row of column headers over a list or table: bold,
  with a `line` rule under it.
- **`row`**: one item in a list or table, in `text` ink with no underline,
  even when it's a link: clickable rows read as text. Variants:
  - `interactive`: it opens or does something, so it's highlighted with a
    wash of `feedback` (laid over its own fill, as a `background-image`, so
    a selected or striped row keeps its colour) under the pointer, on
    keyboard focus, or with
    `data-highlighted` (for a row drawn as separate cells that tracks the
    pointer itself, like an equipment row). Rows don't use
    `data-interactive`: a glow round a row is too much.
  - `alternate`: every other row of a long list, on `control`.
  - `divided`: a `line` under it, for rows with no table around them (a
    menu).
  - `striped`: for rows striped by position rather than by the call site (a
    settings form, whose rows come and go): odd ones are on `control`.
  - State: selected (`aria-current`, `aria-selected` or `data-selected`), the
    current one (the journal page you're on), on `control`.
- **`dragHandle`**: the grip to drag to reorder a list. `textMuted` on
  `surface`, faded until hovered, when it grows and turns `accent`.
- **`emptyState`**: stands in for a list with nothing in it: dashed `line`
  border, italic `textMuted`. _Not for_ warnings (`callout`).

### Text: element defaults, `displayText`, `mutedText`, `outcome`

**Element defaults** (`src/themes/catalogue/elements.css`) style plain
elements inside a themed root, so a call site needs a class only for
something else:

- `h1` to `h4` are in the `display` text style;
- `label` is bold;
- `a` (and `label.parp`) is `link`, underlined with a `feedback` glow under
  the pointer;
- `hr` is a `line` that fades out at both ends;
- scrollbars are `accent` on `control`.

They're in `system.base`, scoped with `:where()` so they're no more specific
than the element: any class beats them.

- **`displayText`**: text in the `display` style that isn't a heading, such
  as column labels ("Rating"), figures (build points) or menu entries.
  `size: sm | md | lg` (smaller, as is, larger).
- **`mutedText`**: secondary information within content, such as a menu
  entry's description or summary. `textMuted` ink; `size: sm | md`. _Not
  for_ things that are switched off.
- **`outcome`**: the result of something, in its tone's ink: a goal met
  (`success`), a limit passed (`danger`), something missing (`warning`).
  `neutral` is `text`. _Not for_ a label on a thing (`badge`) or a message
  about it (`callout`).

### `sheetRoot`

The themed root of a window, applied by `CSSReset` to the element that
carries `data-inv-theme` and the palette's custom properties: the `body` text
style, `text` ink, `accent` for native controls, and the wallpaper. `size`:
`large` (a full sheet) and `small` (a small window) are on `wallpaper`;
`none` (a themed area inside something else) is transparent. Padding and
height are layout, but they're in the `size` variants too, so a theme can
still set them (V1 themes do).

_Expected override:_ a theme's backdrop goes in its `size` variants
(`sheetRoot: { variants: { size: { large: {...}, small: {...} } } }`), which
patch them.

### `appFrame`

Foundry's window around a themed root, as a slot recipe: `root` (the
`.application` element), `header` (its titlebar) and `content` (the
`.window-content` our root sits in). `CSSReset` puts the classes on Foundry's
elements while it's mounted, if it's the outermost themed root in the window
(not with `noStyleAppWindow`); roots side by side in one window (a loading
fallback over a suspended sheet) take turns, the latest first (`frame.ts`).
The window gets the palette's custom properties and `data-inv-frame`, not
`data-inv-theme`: the frame is Foundry's, so it doesn't get our element
defaults or state layers, and a theme's `appFrame` overrides are scoped to
`data-inv-frame` instead.

Empty by default, so a window looks like Foundry's own. _Expected
override:_ a theme's glow or border on `root`. Variant `layout` is set by
the theme's `layout` (above), not by a call site: `full-frame` makes the
header see-through and lays the content under it.

### `logo`

The character sheet's logo (`LogoEditable`): the name and its subtext in large
display text, drawn twice, a front copy over a rear one, on a backdrop, so a
theme can do 3D, shadows and text gradients. Slots: `root` (the outer box: its
`perspective` and `perspective-origin`, by default `500px` and `50% 50%`, are
for the text's 3D transforms), `backdrop`, `text` (the wrapper of both copies,
which the theme can transform), `front_wrapper`,
`front` (the name), `front_sub` (the subtext), and the same three for `rear`.
Slot names are snake_case, so their classes are valid CSS class names
(`inv-logo__front_sub`). The slots' defaults are plain CSS in
`logoDefaults.ts`.

Everything the logo needs to work is `LogoEditable`'s, outside the slots, so
a slot's override is only what the theme changes (`text: { transform:
"scale(0.7)" }` is a whole logo restyle):

- **The look by default**, inherited: the display font, case and letter
  spacing at 4em, on one line, in `text`. The rear copy's text is
  transparent, so only what a theme gives it (a shadow, or a colour on
  `rear` and `rear_sub`) shows.
- **The layout**: the outer box (`root`) is positioned, and sized by the call
  site; the backdrop and `text` fill it, and each copy is centred in it, the
  rear one behind. An override can't change these properties, or the rear
  wrapper's `color` (`logoLayout`): `compileCatalogue` leaves them out,
  nested rules' too, with a warning. `root`'s `display`, `width` and `height`
  are the call site's, in a layer above the theme's (`componentDefaults.css`),
  so a theme's lose to them, unless `!important`; they aren't left out, and
  nor is anything else about its size (`min-height`, say), which a theme
  shouldn't set.
- **The fit**: the name is scaled down to fit the logo's width, by its font
  size, measured with a hidden copy that has the `front` style at full size.
  So `front` can set its own size, spacing and padding, and the fit follows,
  as long as they're relative to the font size (`em`): a length that isn't
  (`48px`, `3rem`, or a letter spacing set on `text` or a wrapper, which is a
  length by the time it's inherited) doesn't shrink, and a long name
  overflows. The palette's `displayLetterSpacing` does shrink. A transform on
  `text` applies after the fit, which doesn't see it: one that shrinks the
  logo is fine, one that enlarges it can overflow. And `front` mustn't set a
  `width` (with `!important`, it would reach the hidden copy too).

_Expected override, every slot:_ each theme's logo is its own.

### `card`

A card (Cards rules), applied by `CardDisplay`. Slots: `root`, `supertitle`,
`title`, `subtitle`, `description`, `effect`. The root is on `surface`
with a `line` border. It has `data-category` (the card's style key), so a
theme can style one category's cards (Themes, above). A card in a card array
is clickable (`data-interactive`), so it gets the `hoverFeedback` glow.
_`root` is an expected override._

The spacing between cards is the palette's `cardGap`, which `CardArray`
reads from its custom properties: `--inv-card-gap`, and `--inv-card-gap-row`
and `--inv-card-gap-column` for its two axes.

### Surfaces: `surface`, `floating`, `partyCell`

- **`surface`**: a plain area of surface that isn't a block of content of its
  own (a panel has padding and nests; this doesn't): a sheet's notes area, a
  cover over a picture, the loading screen. `depth: top | nested` picks
  `surface` or `surfaceNested`; `solid` is for one that overlaps or scrolls
  over other content (a sticky search bar): the same colour, as surfaces are
  expected to be opaque, but a hook for a theme whose surfaces aren't. It
  sets only the background _colour_, so it can go on an element with an
  image of its own (the loading screen's sheet root).
- **`floating`**: something raised above the sheet, overlapping it, on
  `surface`. `kind`: `overlay` (a message over everything,
  rounded, with `elevation`), `drawer` (a panel sliding in from the side,
  with a `line` on its leading edge and a shadow as deep as the gap it slides
  in from, which the call site sets as `--drawer-shadow-size`), `bar` (stuck
  to the top of a scrolling area, with a `line` under it), `chip` (a small
  label over a picture, lighter under the pointer; the label's text style
  goes on its own element inside).
- **`partyCell`** (specialised): a cell of the party sheet's grid of
  abilities. Rows alternate `surface` and `surfaceNested`; an ability nobody
  has is on them tinted halfway to `danger`. Variants `odd`, `zero`,
  `header`: header cells are stuck over the rest as it scrolls, the same
  colours, but a hook for a theme whose surfaces are translucent.

### `richText`

An editor for formatted text (notes, descriptions) and the journal's page
list beside it: `surface`, with a `line` border. The content inside
(ProseMirror's) keeps Foundry's own styling.

Draw a class's parts with real elements (slots), not `::before`/`::after`:
an override replaces the rule for the element its name selects, so a
pseudo-element's defaults would survive it.

## State layers

Feedback that looks the same on anything, whatever its class, so classes don't
each draw their own. They're plain CSS in `src/themes/catalogue/states.css`,
in the `system.states` layer, after the catalogue and theme overrides, so
they always show.

| Layer           | When                                                                                   | Look                                               |
| --------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `hoverFeedback` | `[data-interactive]:hover`, unless disabled                                            | A `feedback` glow, and a pointer                   |
| `focusRing`     | `:focus-visible`, on anything; for a visually hidden input, the label or span after it | A 2px `feedback` outline                           |
| `dropTarget`    | `[data-drop-state="ready"]`: you can drop what you're dragging here                    | A dashed `line` outline, outside the element       |
|                 | `[data-drop-state="over"]`: and it's over it                                           | The outline turns `accent`, with a `feedback` tint |

`focusRing` comes last, so a focused element shows focus whatever other
layer is drawing its outline.

A drop target sets `data-drop-state` itself: `ready` while something it takes
is being dragged (or always, if it can't tell, like a Bond's actor row, which
takes actors dragged from Foundry's sidebar), and `over` from `dragover` to
`dragleave` or `drop`.

## Theme overrides

A theme's catalogue (Themes, above) is compiled into overrides keyed by the
class name without `inv-` (`compileCatalogue`), which the runtime `Theme`
holds:

```ts
{
  badge: { borderRadius: 0, fontStyle: "italic" },        // base
  tabs__tab: { ... },                                      // a slot
  "badge--tone_danger": { ... },                           // a variant
  "badge--tone_danger.badge--weight_strong": { ... },      // a compound
}
```

A replaced base or slot loses all of its default's declarations, but the
class's other parts still apply on top: replacing `badge` keeps its tones and
its pressed state, and every override keeps the state layers. A variant is
patched rather than replaced because all of a class's variants share one
cascade layer: replacing one would drop an element's other variants with it
(a row that's `interactive` and `divided` would lose its divider). To take a
declaration away, set it explicitly (`borderBottomStyle: "none"`).

How: `CSSReset` renders the theme's overrides as a `<style>` inside the themed
root (so it travels with the root into a detached window). The theme scope
is on the class itself, so a nested rule can put context on either side of
it, inside the themed root or outside: `"input:checked + &"` becomes
`input:checked + .inv-tabs__tab:where([data-inv-theme="x"], [data-inv-theme="x"] *)`.
Each rule goes in the same cascade layer as the default it replaces; a
replacing one starts with `all: revert-layer`, which drops everything that
layer had for the element (`src/themes/catalogue/overrides.ts`). The theme
scope is inside `:where()`, so an override is exactly as specific as the
default and wins by coming later. A compound's first class is as it is and
the others are in `:where()` (`.inv-badge--tone_danger:where(.inv-badge--weight_strong)`),
so it's as specific as Panda's own compound class. A class's state rules
(`:is([aria-pressed=true])` and the like) are more specific, so they still
apply over an override, even one of the rule they're in.

Override values are plain CSS text. Numbers get `px`, as in React's `style`,
except for unitless properties and custom properties. Anything that could
end its rule (`{`, `}`, `;`, a comment, or a backslash escape, which could
disguise one) is ignored, with a warning. Inside a quoted string or a
`url()`, `;` and braces are fine. A list of fallbacks
(`width: ["200px", "1lh"]`) becomes one declaration each, and a `<` inside a
quoted string (an inline SVG in a data URL) is escaped as `\3c `, so it
can't end the `<style>`. These checks are against mistakes, not a hostile
theme: a theme is installed by a module's code, which can already add any
CSS it likes, and a crafted selector such as `:is(&, .x)` can reach outside
the themed root.

## V1 themes

A V1 theme (`ThemeSeedV1`) still installs, and keeps its look. It's
converted when it's installed: `themeFactory` fills in V1's defaults for what
the seed leaves out (they're part of the V1 contract too, so they're
converted as well), then `paletteFromV1` makes its palette and `fromV1` a
ThemeV2 catalogue from its styles, compiled as a V2 theme's is
(`themeFromV1`). V1's `global` (a string, or Emotion's serialised styles from
a theme module) becomes `globalCss`, with Emotion's labels stripped and
linked keyframes kept, in order (`frame.ts`). `ThemeV1` exists only for that
conversion. A V1 seed can't write catalogue overrides of its own, and won't
ever be able to: that's ThemeV2.

Converting a V1 style: a pseudo-class key (`":hover"`) attaches to the
element, as Emotion has it (`"&:hover"`); a bare selector is a descendant,
written with `&` (`"h1, h2"` becomes `"& h1, & h2"`), and two keys that come
to the same selector are one rule, the later's declarations over the
earlier's. A V1 theme's values are CSS as written: a palette name isn't a
palette colour there.

### The palette

| V1                                                                           | Palette                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `backgroundPrimary` / `backgroundSecondary`                                  | `surface` / `surfaceNested`                                      |
| `bgOpaquePrimary` / `bgOpaqueSecondary`, `bgOpaqueDanger*`, `bgTransDanger*` | none: `fromV1` puts them where V1 had them, as overrides (below) |
| `backgroundButton`                                                           | `control`                                                        |
| `accent`                                                                     | `accent`, and `link`                                             |
| `accentContrast`                                                             | `onAccent`                                                       |
| `glow`                                                                       | `feedback`                                                       |
| `controlBorder`                                                              | `line`                                                           |
| `danger`, `warning`, `success`                                               | The same. `info` and the `on-` partners are new                  |
| `bodyFont`, `displayFont`, `displayFontTextTransform`                        | `bodyFont`, `displayFont`, `displayCase`                         |
| (from `text`)                                                                | `polarity`: light text means a dark theme                        |

### Its styles

- **Panels**: `panelStylePrimary` patches the `panel` `depth: top`
  variant, and `panelStyleSecondary` (or, without one, `panelStylePrimary`)
  `depth: nested`, so the two stay independent, as in V1. A V1 panel style
  replaced the panel's background, but a variant override patches, so one
  without a background of its own gets `backgroundColor: transparent`.
- **Tabs**: the seven `tab*Style` fields become the `tabs` slots, with V1's
  selected and wrapped states as nested rules, and V1's hover glow dropped
  on a disabled tab. A V1 theme gets V1's default tabs (`accent` ink,
  unselected ones on `backgroundSecondary`, which V1 says is "used for
  inactive tabs"), not the catalogue's.
- **The sheet root**: `largeSheetRootStyle` and `smallSheetRootStyle` patch
  the `sheetRoot` `size` variants, as V1 spread them over the defaults,
  padding and height included.
- **The window**: `appWindowStyle` replaces the `appFrame` `root`. (Before
  this, window styles hadn't shown since our sheets moved to ApplicationV2:
  `CSSReset` looked for ApplicationV1's `.window-app`.)
- **The logo**: each slot starts from its defaults (`logoDefaults.ts`), with
  the theme's style for it spread over them, as V1 did (the front style goes
  on the name and the subtext alike). The layout V1 put after the theme's
  style is `LogoEditable`'s, so it's left out. The text's own size is
  inherited from 4em now, so a relative size the theme gave it is divided by
  4 (`calc(2em / 4)`), and a colour on the rear wrapper goes on the rear
  copies instead.
- **Cards**: each slot is its `themeFactory` style (V1's default, or the
  seed's `cards.base` style for that part, replacing it whole). Each of its
  `cards.categories` becomes a rule of its own with the category's style
  spread over the base, and the base rule leaves those categories' cards
  out, so a category's style wins as it did in V1, `!important` and nested
  rules included. The contexts are in `:where()`, so both rules are as
  specific as the plain class; any style key works, hex-escaped in the
  attribute selector. A `hoverStyle` (the base's, then its category's over
  it) becomes a `:hover` rule on the root, for cards in an array; the
  `hoverFeedback` glow's `box-shadow` comes after it, so it wins over one in
  a `hoverStyle`, such as V1's default glow, which is close to it.
  `cards.area` becomes `cardGap`, `` `${verticalSpacing} ${horizontalSpacing}` ``,
  so the two axes stay independent (Mutant City Blue's differ).
- **Things that overlap content**: V1's surfaces could be translucent, and
  things that overlap other content were on them flattened over the
  wallpaper (`bgOpaque*`). The recipes expect opaque surfaces, so `fromV1`
  puts V1's flattened colours back: the `solid` surfaces, `floating`, the
  `partyCell` headers, `select` and its options, `dragHandle`, and the
  `callout` tints. V1's danger-tinted surfaces (`bgTransDanger*`) kept the
  surface's opacity, which the `partyCell` tint doesn't, so its cells for
  abilities nobody has get V1's too. (The `card` root gets V1's card style,
  which is on `bgOpaquePrimary`.) `select` and `dragHandle` overrides
  replace their base, so they restate the rest of it, from the plain CSS in
  `sharedDefaults.ts`, which the recipes are built from too.
- **Dropped**: `tabClass`, `panelClass` and `notesCssClasses` are deprecated
  and ignored, so a V1 theme that sets them still loads.

### The built-in themes

The built-in themes (`src/themes/*Theme.ts`) are V2, printed from their V1
originals by `pnpm print:theme-v2` (`scripts/printThemeV2.ts`,
`src/themes/v2FromV1.ts`), which leaves out what V2 would work out the same
anyway, and refuses a theme with a value that would change meaning in V2.
The originals are in `src/themes/v1/`: what they were printed from, and V1
themes for the V1 path's tests. Until a built-in theme is restyled,
`v2FromV1.test.ts` checks it still resolves exactly as its original did; a
theme that's restyled on purpose comes out of that check.

## The native world

Some of what we draw lives in Foundry's own UI, not in a themed sheet: chat
cards, the combat tracker, `NativeMenu`, `GamePauseBanner`. These look like
Foundry, whatever theme a sheet uses. They use Foundry's markup, classes and
custom properties, and **never read the theme**: no palette, no catalogue
classes, no `useTheme` (a chat card isn't inside a themed
root, so it would get a fallback theme anyway). `paletteReads.test.ts` checks
this, and that they never use the catalogue, for `components/messageCards/`, `components/combat/`,
`components/native/`, `components/inputs/NativeMenu/` and `GamePauseBanner`.

Shared definitions for the native world are in `src/components/native/`:

- `NativeButton`: Foundry's own button, for chat cards and the combat
  tracker. Never `Button`, which is themed: a chat card has no palette.
- `nativeStatus({ tone })`: status ink (`danger | warning | success | info`)
  from Foundry's `--color-level-*`. Those are tuned for Foundry's dark UI, so
  inside a chat message's parchment they're darkened to stay legible.

## Converting a component

Layout at call sites is Panda's `css()` (`className={css({...})}`). JSX is
plain React's, so there's no `css` prop; `src/themes/catalogue/emotionUses.test.ts`
fails if Emotion (an `@emotion` import or a `css` prop) comes back. Panda
extracts styles when it builds, so `css()` only takes values it can work out
then: literals, constants, objects imported or spread in (`absoluteCover`),
and a whole value chosen by a ternary. Not a ternary inside a template
literal: Panda can't build every combination, so the class has no CSS. A value
that varies at run time goes in `style`, usually as a custom property that a static
class reads (`MwButton`'s `--mw-color`). For a conditional style, pass
`css()` several objects (`css(base, active ? activeStyle : {})`), which it
merges: `cx()` only joins class names, so two classes setting the same
property would be decided by stylesheet order, not by which came last. For
the same reason, a component that takes a `className` doesn't give itself
layout with `css()` for properties a caller might set: that goes in a plain
`inv-default-*` class in `src/components/componentDefaults.css`
(`system.defaults`), under the caller's utilities. And a `className` before a
`{...rest}` spread is replaced by the caller's, not merged with it: put the
spread first and merge the caller's in `cx()`.
Keyframes are in `panda.config.ts`, prefixed `inv` (their names are global).
Literal colours, shadows and radii need the `[...]` escape (strict tokens), as
do some layout values Panda's preset maps to its own (`flex: "[0]"`).

`src/themes/catalogue/paletteReads.test.ts` fails if any component reads a
theme's colours (`.colors`, or destructured `colors`): use a catalogue
class. The list of files allowed to read them, kept while the components were
converted, is now empty. `src/themes/` and `startup/loadCustomThemes.ts`
are exempt: they define themes.

## Where the CSS goes

Foundry v14 orders its CSS in cascade layers, and a system's styles belong in
`system`. Ours go in sub-layers of it, in this order (`src/panda.css`):
`system.reset`, `system.base`, `system.tokens`, `system.recipes`,
`system.defaults`, `system.states`, `system.utilities`. Panda splits `system.recipes` further:
`base`, `slots` (with its own `base`, `variants` and `compound_variants`),
`variants`, `compound_variants`. **Nothing goes directly in `system`**: rules directly in a
layer beat everything in its sub-layers.

- `system.base`: the element defaults (`elements.css`) and
  `investigator.less`'s Foundry fixes.
- `system.recipes`: the catalogue classes, the themed root's look
  (`sheetRoot`) among them, and a theme's overrides of them.
- `system.defaults`: components' own overridable layout
  (`componentDefaults.css`).
- `system.states`: the state layers (`states.css`).
- `system.utilities`: layout from `css()` at call sites.

A theme's `globalCss` is a `<style>` in the root, like its overrides, so it
travels with the root too.

The palette is set as an inline `style` on the themed root, not in a
stylesheet. A detached window (Foundry's own, or PopOut!) copies the page's
stylesheets when it opens, but not rules inserted into them at run time, so
anything themed has to travel with the element (#1537).

The build's CSS target (`build.cssTarget` in `vite.config.ts`) is the
browsers our CSS needs anyway: relative colours (`oklch(from …)`) and
`light-dark()`. With Vite's default, the minifier would polyfill
`light-dark()` with variables it sets only where a stylesheet declares
`color-scheme`, which a themed root sets inline, so it would resolve to
nothing.

Panda's generated code (`src/styled-system`) isn't committed: `pnpm install`
generates it (`prepare`), and so does `pnpm build`. After changing
`panda.config.ts`, run `pnpm exec panda codegen`.
