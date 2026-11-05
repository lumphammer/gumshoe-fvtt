# Theming

How themes are defined and how components get their look. This is the
contract: what each palette entry and catalogue class **means**, so that anyone
writing a component or a theme makes the same choice in the same place.

The system is being built in steps (#1532). Today the palette exists, as
custom properties on every themed root, and Panda is set up to read it, but no
components use either yet: everything is still drawn by Emotion from V1
themes. The catalogue of classes and the rules for using them are agreed
(#1533) and arrive with the first conversions.

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

## Where the CSS goes

Foundry v14 orders its CSS in cascade layers, and a system's styles belong in
`system`. Ours go in sub-layers of it, in this order (`src/panda.css`):
`system.reset`, `system.base`, `system.tokens`, `system.recipes`,
`system.utilities`. **Nothing goes directly in `system`**: rules directly in a
layer beat everything in its sub-layers. CSSReset's Emotion rules and
`investigator.less`'s Foundry fixes are in `system.base`.

The palette is set as an inline `style` on the themed root, not in a
stylesheet. A detached window (Foundry's own, or PopOut!) copies the page's
stylesheets when it opens, but not rules inserted into them at run time, so
anything themed has to travel with the element (#1537).

Panda's generated code (`src/styled-system`) isn't committed: `pnpm install`
generates it (`prepare`), and so does `pnpm build`. After changing
`panda.config.ts`, run `pnpm exec panda codegen`.
