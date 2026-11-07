# Theming

How themes are defined and how components get their look. This is the
contract: what each palette entry and catalogue class **means**, so that anyone
writing a component or a theme makes the same choice in the same place.

The system is being built in steps (#1532). The palette exists, as custom
properties on every themed root, and the catalogue has `badge`, `button`,
`panel`, `callout`, `input`, `select`, `checkbox`, `toggle`, `tabs`,
`sectionHeading`, `tableHeader`, `row`, `dragHandle`, `emptyState`,
`displayText`, `mutedText`, `outcome`, `sheetRoot`, `logo`, `card`,
`surface`, `floating`, `partyCell` and `richText`, plus element defaults.
Every component's look now comes from the catalogue, and none reads a
theme's colours. Emotion is still used for layout at call sites (`css`
props), and V1 themes are mapped onto the catalogue (`fromV1.ts`); moving
layout to Panda's `css()` and a V2 theme format are later work.

## The pieces

- **Palette**: a theme's colours, fonts and a few shared values, each with
  one meaning (below). Defined by `Palette` in `src/themes/palette.ts`.
- **Catalogue**: named classes, each a bag of styles for one kind of thing
  ("a badge", "a callout"), with variants. Built from the palette with Panda
  recipes. Themes can override any of them.
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
   "replace", per slot for classes with slots. Some slots are *expected* to be
   overridden, because that's where a theme's personality lives:
   `sheetRoot`, `window.titlebar`, `tabs.tab`, `logo` and `card.root`.
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

## Palette

Each entry is a custom property on the themed root (`--inv-` and the name in
kebab case: `surfaceNested` is `--inv-surface-nested`), and a Panda token
(`colors.surfaceNested`).

| Entry | Meaning |
|---|---|
| `polarity` | `light` or `dark`. Sets `color-scheme` on the themed root, so scrollbars and native controls match. Light and dark versions of a design are separate themes |
| `wallpaper` | The colour the sheet's backdrop averages to. Shown while images load, and the colour surfaces are flattened over. Must agree with the backdrop image |
| `surface` | What content sits on. Any colour, solid or translucent |
| `surfaceNested` | What content *inside* content sits on. A panel inside a panel uses it, worked out from the structure, never chosen by the call site |
| `surfaceSolid`, `surfaceNestedSolid` | *Derived*: the surfaces flattened over `wallpaper` (no change if they're already solid). For anything that overlaps or scrolls over other content: popovers, sticky rows, dropdowns |
| `surfaceDanger`, `surfaceNestedDanger`, and their `…Solid` versions | *Derived*: the surfaces tinted halfway to `danger`, keeping their opacity, and those flattened over `wallpaper`. A status tint for an area in trouble (an ability nobody in the party has) |
| `control` | The fill of controls: buttons, toggle tracks |
| `text` | The default ink. Legible on both surfaces and on `control` |
| `textMuted` | Ink for secondary information: notes, empty states, inactive rows, table headers |
| `link` | Ink for links within prose (rich text, journals, notes). Distinguishable from `text` in running text. Not for other clickable things |
| `accent` | **Selected, or a call to action**: the active tab, a toggle that's on, the OK button. *Not* "clickable": most of a sheet is clickable, and that's shown by shape, hover feedback and the cursor |
| `onAccent` | Ink on an `accent` fill |
| `feedback` | The colour of hover, focus and drag-over feedback. Never state or decoration |
| `line` | Structural lines: control outlines, separators, heading rules, table header rules |
| `danger`, `warning`, `success`, `info` | Status. Each is legible as text on both surfaces |
| `onDanger`, `onWarning`, `onSuccess`, `onInfo` | Ink on the matching status fill |
| `radius` | The one corner radius classes share (Panda: `radii.standard`) |
| `elevation` | The shadow for anything floating (Panda: `shadows.elevation`) |
| `bodyFont` | The `body` text style: prose and controls. A CSS `font` value |
| `displayFont`, `displayCase`, `displayLetterSpacing` | The `display` text style: titles, headings, tabs, labels. Panda applies the three together as `textStyle: "display"` |

Status-tinted surfaces (flagged rows, invalid inputs, callouts) will be derived
from the status colours and the surfaces, not set by themes.

### From V1 themes

Every V1 theme gets a palette from `paletteFromV1`, which should change nothing
about how anything looks:

| V1 | Palette |
|---|---|
| `backgroundPrimary` / `backgroundSecondary` | `surface` / `surfaceNested` |
| `bgOpaquePrimary` / `bgOpaqueSecondary` | `surfaceSolid` / `surfaceNestedSolid` |
| `bgTransDanger*` / `bgOpaqueDanger*` | `surfaceDanger`, `surfaceNestedDanger`, `surfaceDangerSolid`, `surfaceNestedDangerSolid` |
| `backgroundButton` | `control` |
| `accent` | `accent`, and `link` |
| `accentContrast` | `onAccent` |
| `glow` | `feedback` |
| `controlBorder` | `line` |
| `danger`, `warning`, `success` | The same. `info` and the `on-` partners are new |
| `bodyFont`, `displayFont`, `displayFontTextTransform` | `bodyFont`, `displayFont`, `displayCase` |
| (from `text`) | `polarity`: light text means a dark theme |

## Catalogue

Each class is a Panda recipe in `src/themes/catalogue/`, registered in
`panda.config.ts`. Its CSS class is `inv-` and its name (`inv-badge`), and
each variant gets its own class (`inv-badge--tone_danger`); compound variants
too (`inv-badge--compound__tone_danger__weight_strong`). Every variant is
generated whether a call site uses it or not, because themes override them by
name.

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
`<select>` applies `select()`. Like `input`, but on `surfaceNestedSolid`,
with its options on `surfaceSolid`, because they open over other content.

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
- A V1 theme's `panelClass` is still added. Its `panelStylePrimary` becomes a
  `panel--depth_top` override, and `panelStyleSecondary` (or, without one,
  `panelStylePrimary`) a `panel--depth_nested` one, so the two stay
  independent, as in V1 (`src/themes/catalogue/fromV1.ts`).
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
  `surfaceSolid`, with `text` ink and a bar in the tone's colour on the left
  (`line` for `neutral`).
- A callout saying why an action can't happen goes just below that action's
  button, in one place, so it doesn't move as callouts come and go. Advice
  about the area as a whole (the push-pool warnings) goes at the top of that
  area.

### `tabs`

A strip of tabs and the content of the selected one, applied by
`TabContainer`. Slots `list`, `tab`, `spacer` and `content`
(`inv-tabs__tab` and so on). *`tab` is an expected override, selected and
not.*

- **States**, from the DOM rather than variants: a tab is selected when its
  hidden radio, just before it, is checked (`input:checked + &`); the strip
  is wrapped into a grid when the code that measures it sets `data-wrapped`
  on the list (`[data-wrapped] > &`, `[data-wrapped] + &` for the content).
  A theme's override can target these as nested rules. The default selected
  and wrapped looks have their context in `:where()`, so they're part of the
  tab's rule rather than states over it: an override of `tab` replaces them
  too. Disabled (`input:disabled + &`) still applies over an override.
- **Look**: the selected tab is `surface`, like the content, so they read as
  one, with `accent` ink. The others are `surface` at 80% of its opacity, with
  `text` ink. Unselected tabs are `data-interactive`.
- `content` is `surface`, owns the padding, and its children are nested, so
  a `Panel` in a tab is `nested`.
- A V1 theme's `tabClass` is still added, and a seed that sets any of the
  seven `tab*Style` fields gets them all as `tabs` overrides
  (`src/themes/catalogue/fromV1.ts`), so V1 themes keep their tabs.

### Lists: `sectionHeading`, `tableHeader`, `row`, `dragHandle`, `emptyState`

Their CSS classes are kebab-case, like every class name (`inv-section-heading`,
`inv-table-header`, `inv-drag-handle`, `inv-empty-state`): theme overrides
take only `[a-z0-9_-]`.

- **`sectionHeading`**: a heading that divides a sheet into sections
  ("Academic", "Weapons"), with a `line` rule under it. Apply it to the
  heading, or to the row holding the heading and its buttons. *Not for*
  column headers.
- **`tableHeader`**: the row of column headers over a list or table: bold,
  with a `line` rule under it.
- **`row`**: one item in a list or table. Variants:
  - `interactive`: it opens or does something, so it's highlighted with a
    wash of `feedback` under the pointer, on keyboard focus, or with
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
  `surfaceSolid`, faded until hovered, when it grows and turns `accent`.
- **`emptyState`**: stands in for a list with nothing in it: dashed `line`
  border, italic `textMuted`. *Not for* warnings (`callout`).

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
  entry's description or summary. `textMuted` ink; `size: sm | md`. *Not
  for* things that are switched off.
- **`outcome`**: the result of something, in its tone's ink: a goal met
  (`success`), a limit passed (`danger`), something missing (`warning`).
  `neutral` is `text`. *Not for* a label on a thing (`badge`) or a message
  about it (`callout`).

### `sheetRoot`

The themed root of a window, applied by `CSSReset` to the element that
carries `data-inv-theme` and the palette's custom properties: the `body` text
style, `text` ink, `accent` for native controls, and the wallpaper. `size`:
`large` (a full sheet) and `small` (a small window) are on `wallpaper`;
`none` (a themed area inside something else) is transparent. Padding and
height are layout, in `CSSReset`.

*Expected override:* a theme's backdrop goes in its `size` variants. A V1
seed's `largeSheetRootStyle` and `smallSheetRootStyle` become
`sheet-root--size_large` and `sheet-root--size_small` overrides, which patch
the variants, as V1 spread them over the defaults; their `padding` and
`height`, if any, go in the root's inline style instead.

The application window around the root (`appWindowStyle` in V1) isn't a
class yet: in Foundry v13, `CSSReset` looks for `.window-app`, which
ApplicationV2 windows don't have, so V1 window styles currently do nothing
there.

### `logo`

The character sheet's logo (`LogoEditable`): the name and its subtext in large
display text, drawn twice, a front copy over a rear one, on a backdrop, so a
theme can do 3D, shadows and text gradients. Slots: `backdrop`, `text` (the
wrapper of both copies, which the theme can transform), `front_wrapper`,
`front` (the name), `front_sub` (the subtext), and the same three for `rear`;
and `measure`, a hidden full-size copy of the name that `LogoEditable`
measures to fit the name to the logo.
Slot names are snake_case, so their classes are valid override names
(`inv-logo__front_sub`).

*Expected override, every slot:* each theme's logo is its own. A V1 seed's
`logo` styles become overrides of the matching slots, each starting from that
slot's defaults (`logoDefaults.ts`), because V1 spread them over the defaults
(the front style goes on the name, the subtext and the measuring copy
alike). What V1 put after the theme's style stays forced, even against a
theme's `!important`: the backdrop's `position` and insets (it's absolutely
positioned at the logo's edges; its size, margins and transforms are the
theme's), and the measuring copy's position and `1em` font size, merged last
into its override.

Override values are serialized carefully: a list of fallbacks
(`width: ["200px", "1lh"]`) becomes one declaration each, and a `<` inside a
quoted string (an inline SVG in a data URL) is escaped as `\3c `, so it
can't end the `<style>`.

### `card`

A card (Cards rules), applied by `CardDisplay`. Slots: `root`, `supertitle`,
`title`, `subtitle`, `description`, `effect`. The root is on `surfaceSolid`
with a `line` border. It has `data-category` (the card's style key), so a
theme can style one category's cards: `&[data-category="x"]` in a `card__root`
override, `[data-category="x"] &` in the others. *`root` is an expected
override.*

A V1 seed that styles its cards gets an override of each slot: its
`themeFactory` style (the default, or the seed's `cards.base` style for that
part, replacing it whole). Each of its `cards.categories` becomes a rule of
its own with the category's style spread over the base, and the base rule
leaves those categories' cards out, so a category's style wins as it did in
V1, `!important` and nested rules included. The contexts are in `:where()`,
so both rules are as specific as the plain class. Any style key works: it's
hex-escaped in the attribute selector.
`cards.area` (the spacing between cards) is still read by `CardArray`.

### Surfaces: `surface`, `floating`, `partyCell`

- **`surface`**: a plain area of surface that isn't a block of content of its
  own (a panel has padding and nests; this doesn't): a sheet's notes area, a
  cover over a picture, the loading screen. `depth: top | nested` picks
  `surface` or `surfaceNested`; `solid` picks the solid version, for one
  that overlaps or scrolls over other content (a sticky search bar). It sets
  only the background *colour*, so it can go on an element with an image of
  its own (the loading screen's sheet root).
- **`floating`**: something raised above the sheet, overlapping it, always
  on the solid surface. `kind`: `overlay` (a message over everything,
  rounded, with `elevation`), `drawer` (a panel sliding in from the side,
  with a `line` on its leading edge and a shadow as deep as the gap it slides
  in from, which the call site sets as `--drawer-shadow-size`), `bar` (stuck
  to the top of a scrolling area, with a `line` under it), `chip` (a small
  label over a picture, lighter under the pointer; the label's text style
  goes on its own element inside).
- **`partyCell`** (specialised): a cell of the party sheet's grid of
  abilities. Rows alternate `surface` and `surfaceNested`; an ability nobody
  has is on the danger surfaces (`surfaceDanger` and so on); header cells,
  stuck over the rest as it scrolls, use the solid versions. Variants `odd`,
  `zero`, `header`.

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

| Layer | When | Look |
|---|---|---|
| `hoverFeedback` | `[data-interactive]:hover`, unless disabled | A `feedback` glow, and a pointer |
| `focusRing` | `:focus-visible`, on anything; for a visually hidden input, the label or span after it | A 2px `feedback` outline |
| `dropTarget` | `[data-drop-state="ready"]`: you can drop what you're dragging here | A dashed `line` outline, outside the element |
| | `[data-drop-state="over"]`: and it's over it | The outline turns `accent`, with a `feedback` tint |

`focusRing` comes last, so a focused element shows focus whatever other
layer is drawing its outline.

A drop target sets `data-drop-state` itself: `ready` while something it takes
is being dragged (or always, if it can't tell, like a Bond's actor row, which
takes actors dragged from Foundry's sidebar), and `over` from `dragover` to
`dragleave` or `drop`.

## Theme overrides

A theme can replace any catalogue class, variant or slot. `ThemeV1` has an
internal `catalogue` field for this (not in the published seed type until the
new theme format settles), keyed by the class name without `inv-`:

```ts
catalogue: {
  badge: { borderRadius: 0, fontStyle: "italic" },
  "badge--compound__tone_danger__weight_strong": { ... },
}
```

An override of a class's base or a slot (`badge`, `tabs__tab`) **replaces**
the default for that name: none of the default's declarations survive, so it
has to say everything it wants. The class's other parts still apply on top:
replacing `badge` keeps its tones and its pressed state, and every override
keeps the state layers.

An override of a variant or compound variant (`row--interactive_true`,
`badge--compound__tone_danger__weight_strong`) **patches** it instead: its
declarations go over the variant's, and the rest of the variant stays. All of
a class's variants share one cascade layer, so replacing one would drop an
element's other variants with it (a row that's `interactive` and `divided`
would lose its divider). To take a declaration away, set it explicitly
(`borderBottomStyle: "none"`).

How: `CSSReset` renders the theme's overrides as a `<style>` inside the themed
root (so it travels with the root into a detached window). The theme scope
is on the class itself, so a nested rule can put context on either side of
it, inside the themed root or outside: `"input:checked + &"` becomes
`input:checked + .inv-tabs__tab:where([data-inv-theme="x"], [data-inv-theme="x"] *)`.
Each rule goes in
the same cascade layer as the default it replaces; a replacing one starts
with `all: revert-layer`, which drops everything that layer had for the element
(`src/themes/catalogue/overrides.ts`). The theme scope is inside `:where()`,
so an override is exactly as specific as the default and wins by coming
later. A class's state rules (`:is([aria-pressed=true])` and the like) are
more specific, so they still apply over an override, even one of the rule
they're in.

Override values are plain CSS text. Numbers get `px`, as in React's `style`,
except for unitless properties and custom properties. Anything that could
end its rule (`{`, `}`, `;`, a comment) is ignored, with a warning.

## The native world

Some of what we draw lives in Foundry's own UI, not in a themed sheet: chat
cards, the combat tracker, `NativeMenu`, `GamePauseBanner`. These look like
Foundry, whatever theme a sheet uses. They use Foundry's markup, classes and
custom properties, and **never read the theme**: no palette, no catalogue
classes, no `ThemeContext` or `useTheme` (a chat card isn't inside a themed
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

`src/themes/catalogue/paletteReads.test.ts` fails if any component reads a
theme's colours (`.colors`, or destructured `colors`): use a catalogue
class. The list of files allowed to read them, kept while the components were
converted, is now empty. `src/themes/` and `startup/loadCustomThemes.ts`
are exempt: they define themes.

## Where the CSS goes

Foundry v14 orders its CSS in cascade layers, and a system's styles belong in
`system`. Ours go in sub-layers of it, in this order (`src/panda.css`):
`system.reset`, `system.base`, `system.tokens`, `system.recipes`,
`system.states`, `system.utilities`. Panda splits `system.recipes` further:
`base`, `slots` (with its own `base`, `variants` and `compound_variants`),
`variants`, `compound_variants`. **Nothing goes directly in `system`**: rules directly in a
layer beat everything in its sub-layers.

- `system.base`: the element defaults (`elements.css`) and
  `investigator.less`'s Foundry fixes.
- `system.recipes`: the catalogue classes, the themed root's look
  (`sheetRoot`) among them, and a theme's overrides of them.
- `system.states`: the state layers (`states.css`).
- `system.utilities`: layout from `css()` at call sites.

The themed root's padding and height are in its inline `style`, with the
palette, so a V1 theme's root style can still set them. What's left of
Emotion (a theme's `global` styles, V1 window styles, and call-site `css`
props not converted yet) isn't in a layer, so it beats all of these.

The palette is set as an inline `style` on the themed root, not in a
stylesheet. A detached window (Foundry's own, or PopOut!) copies the page's
stylesheets when it opens, but not rules inserted into them at run time, so
anything themed has to travel with the element (#1537).

Panda's generated code (`src/styled-system`) isn't committed: `pnpm install`
generates it (`prepare`), and so does `pnpm build`. After changing
`panda.config.ts`, run `pnpm exec panda codegen`.
