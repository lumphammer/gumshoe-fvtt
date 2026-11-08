import { paletteVar } from "../palette";

/**
 * The logo's default styles, per slot, in plain CSS: the `logo` recipe is
 * built from them, and a V1 theme's logo overrides start from them (an
 * override replaces its slot's default, but V1 spread a theme's logo styles
 * over these).
 *
 * The logo's layout and its look by default aren't here: `LogoEditable` has
 * them, outside the slots, so an override doesn't have to repeat them. It
 * fills the logo with the text (in the display font, 4em, on one line, in
 * `text`, all inherited), centres each copy, fits the name to the width, and
 * measures it with a hidden copy that has the front style.
 */
export const logoDefaults = {
  backdrop: {},
  // the text elements' wrapper. A V1 theme's style here could set `font`,
  // which resets the size and line height, so they're set again after it (1em
  // of the logo's text size)
  text: {
    font: `var(${paletteVar("displayFont")})`,
    textTransform: `var(${paletteVar("displayCase")})`,
    fontSize: "1em",
    whiteSpace: "nowrap",
    caretColor: "black",
    border: "none",
    padding: "0",
    lineHeight: "1",
  },
  // the front and rear copies: the rear one's text is transparent (only its
  // shadows show), and V1's front one is, unless the theme gives it a colour
  front_wrapper: { color: "transparent" },
  rear_wrapper: {},
  // the main text (scaled to fit by LogoEditable)
  front: { padding: "0 1em" },
  rear: { padding: "0 1em" },
  // the subtext, under it
  front_sub: { fontSize: "0.5em", padding: "0 1em", minHeight: "1em" },
  rear_sub: { fontSize: "0.5em", padding: "0 1em", minHeight: "1em" },
} as const;

/**
 * What `LogoEditable` sets on these slots outside the theme's rules: an
 * override can't change it, even with `!important` (`compileCatalogue` leaves
 * these properties out). The backdrop and the text fill the logo; each copy is
 * centred in it, the rear one behind, with transparent text (a theme colours
 * the rear text on `rear` and `rear_sub`).
 */
const fills = ["position", "inset", "top", "right", "bottom", "left"] as const;
export const logoLayout = {
  backdrop: fills,
  text: fills,
  front_wrapper: [...fills, "transform", "translate"],
  rear_wrapper: [...fills, "transform", "translate", "zIndex", "color"],
} as const satisfies Partial<
  Record<keyof typeof logoDefaults, readonly string[]>
>;
