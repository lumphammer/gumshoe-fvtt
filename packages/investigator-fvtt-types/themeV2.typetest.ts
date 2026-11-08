// A compile-time check, not part of the API: what ThemeV2's catalogue types
// accept and refuse. `tsc` fails if one of these stops holding.
import type { ThemeCatalogue } from "./themeV2.js";

export const accepted: ThemeCatalogue = {
  badge: {
    base: { borderRadius: 0, color: "var(--inv-accent)", "--x": "1px" },
    variants: { tone: { danger: { fontWeight: "bold" } } },
    compoundVariants: [{ tone: "danger", weight: "strong", css: { color: "var(--inv-on-danger)" } }],
  },
  // a slot recipe: styles by slot
  tabs: {
    base: {
      tab: {
        background: "oklch(from var(--inv-surface) calc(l - 0.1) c h)",
        "&:hover": { textShadow: "0 0 0.3em var(--inv-feedback)" },
        "&[data-selected]": { color: "var(--inv-accent)" },
        "@media (min-width: 40em)": { padding: 4 },
      },
    },
  },
  // a boolean variant, by string or boolean
  partyCell: {
    variants: { header: { true: { position: "sticky" } } },
    compoundVariants: [{ header: true, zero: false, css: { color: "var(--inv-text)" } }],
  },
  // fallbacks
  input: { base: { width: ["1em", "1lh"] } },
  // a state layer, on a recipe without slots...
  button: { states: { hoverFeedback: { boxShadow: "none" } } },
  // ...and, by slot, on one with
  card: { states: { focusRing: { root: { outlineColor: "var(--inv-accent)" } } } },
  // and everywhere in the theme
  states: {
    hoverFeedback: { boxShadow: "none", textDecoration: "underline" },
    dropTarget: { '&[data-drop-state="over"]': { outlineColor: "var(--inv-danger)" } },
  },
};

export const refused: ThemeCatalogue[] = [
  // @ts-expect-error -- no such recipe
  { badger: {} },
  // @ts-expect-error -- no such property
  { badge: { base: { colr: "red" } } },
  // @ts-expect-error -- a nested selector without `&`
  { badge: { base: { img: { width: 1 } } } },
  // @ts-expect-error -- no such variant value
  { badge: { variants: { tone: { scary: {} } } } },
  // @ts-expect-error -- no such variant
  { badge: { variants: { size: {} } } },
  // @ts-expect-error -- no such slot
  { tabs: { base: { tub: {} } } },
  // @ts-expect-error -- a slot recipe's base is by slot
  { tabs: { base: { color: "red" } } },
  // @ts-expect-error -- a compound variant's value has to be one of the variant's
  { badge: { compoundVariants: [{ tone: "scary", css: {} }] } },
  // @ts-expect-error -- a compound variant needs its css
  { badge: { compoundVariants: [{ tone: "danger" }] } },
  // @ts-expect-error -- a compound variant names at least one variant
  { badge: { compoundVariants: [{ css: { color: "red" } }] } },
  // @ts-expect-error -- a recipe without variants has no variant overrides
  { input: { variants: { typo: { wat: { color: "red" } } } } },
  // @ts-expect-error -- nor compound ones
  { input: { compoundVariants: [] } },
  // @ts-expect-error -- no such state
  { states: { pressed: {} } },
  // @ts-expect-error -- no such state on a recipe
  { button: { states: { pressed: {} } } },
  // @ts-expect-error -- a slot recipe's states are by slot
  { tabs: { states: { hoverFeedback: { boxShadow: "none" } } } },
];
