# Theming

How themes are defined and how components get their look. This is the
contract: what each palette entry and catalogue class **means**, so that anyone
writing a component or a theme makes the same choice in the same place.

The system is being built in steps (#1532). The palette exists, as custom
properties on every themed root, and the catalogue has `badge` and `button`. Everything else is still drawn by Emotion from V1 themes, and the
two run side by side until every component is converted.

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
- **States**: `:disabled` (half opacity). Hover and focus come from the state
  layers.
- `Button`'s layout defaults (full width; content width for `toolbar`) are
  atomic classes: a call site's own width replaces them.

There's no global button style any more: a `<button>` inside a themed root
that isn't a `Button` (or doesn't apply the class) looks like Foundry's.

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
    something marked `OnSurface` (a tab's content, until the `tabs` class).
    `surfaceNested`. Deeper nesting stays `nested`.
- A V1 theme's `panelClass` is still added. Its `panelStylePrimary` becomes a
  `panel` override, and `panelStyleSecondary` a `panel--depth_nested` one
  (`src/themes/catalogue/fromV1.ts`), so V1 themes keep their look.

## State layers

Feedback that looks the same on anything, whatever its class, so classes don't
each draw their own. They're plain CSS in `src/themes/catalogue/states.css`,
in the `system.states` layer, after the catalogue and theme overrides, so
they always show.

| Layer | When | Look |
|---|---|---|
| `hoverFeedback` | `[data-interactive]:hover`, unless disabled | A `feedback` glow, and a pointer |
| `focusRing` | `:focus-visible`, on anything | A 2px `feedback` outline |

Drop targets (`[data-drop-state]`) will join them.

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

An override **replaces** the default for that name: none of the default's
declarations survive, so it has to say everything it wants. The class's other
parts still apply on top: replacing `badge` keeps its tones and its pressed
state, and every override keeps the state layers.

How: `CSSReset` renders the theme's overrides as a `<style>` inside the themed
root (so it travels with the root into a detached window). Each rule goes in
the same cascade layer as the default it replaces, and starts with
`all: revert-layer`, which drops everything that layer had for the element
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

`src/themes/catalogue/paletteReads.test.ts` lists the files that still read a
theme's colours (`.colors`). It fails if a file not on the list starts reading
them, and if a file on the list stops, so the list only shrinks: when you
convert one, take it off.

## Where the CSS goes

Foundry v14 orders its CSS in cascade layers, and a system's styles belong in
`system`. Ours go in sub-layers of it, in this order (`src/panda.css`):
`system.reset`, `system.base`, `system.tokens`, `system.recipes`,
`system.states`, `system.utilities`. Panda splits `system.recipes` further:
`base`, `slots` (with its own `base`, `variants` and `compound_variants`),
`variants`, `compound_variants`. **Nothing goes directly in `system`**: rules directly in a
layer beat everything in its sub-layers. CSSReset's Emotion rules and
`investigator.less`'s Foundry fixes are in `system.base`.

The palette is set as an inline `style` on the themed root, not in a
stylesheet. A detached window (Foundry's own, or PopOut!) copies the page's
stylesheets when it opens, but not rules inserted into them at run time, so
anything themed has to travel with the element (#1537).

Panda's generated code (`src/styled-system`) isn't committed: `pnpm install`
generates it (`prepare`), and so does `pnpm build`. After changing
`panda.config.ts`, run `pnpm exec panda codegen`.
