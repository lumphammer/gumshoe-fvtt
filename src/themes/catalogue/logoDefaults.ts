import { paletteVar } from "../palette";

/**
 * The logo's default styles, per slot, in plain CSS: the `logo` recipe is
 * built from them, and a V1 theme's logo overrides start from them (an
 * override replaces its slot's default, but V1 spread a theme's logo styles
 * over these).
 */
export const logoDefaults = {
  backdrop: {},
  // the text elements' wrapper: the display font, very large
  text: {
    position: "absolute",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    font: `var(${paletteVar("displayFont")})`,
    textTransform: `var(${paletteVar("displayCase")})`,
    fontSize: "4em",
    whiteSpace: "nowrap",
    caretColor: "black",
    border: "none",
    padding: "0",
    lineHeight: "1",
  },
  // the front and rear copies: centred over each other; the rear one behind
  front_wrapper: {
    color: "transparent",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  rear_wrapper: {
    zIndex: -1,
    color: "transparent",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  // the main text, scaled to fit (LogoEditable sets --logo-fit)
  front: {
    transition: "font-size var(--logo-fit-duration, 0s)",
    fontSize: "calc(1em * var(--logo-fit, 1))",
    padding: "0 1em",
  },
  rear: {
    transition: "font-size var(--logo-fit-duration, 0s)",
    fontSize: "calc(1em * var(--logo-fit, 1))",
    padding: "0 1em",
  },
  // the subtext, under it
  front_sub: { fontSize: "0.5em", padding: "0 1em", minHeight: "1em" },
  rear_sub: { fontSize: "0.5em", padding: "0 1em", minHeight: "1em" },
} as const;
