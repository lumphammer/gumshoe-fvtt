import { paletteVar } from "../palette";

/**
 * The card's default styles, per slot, in plain CSS: the `card` recipe is
 * built from them, and a V1 theme's card overrides start from them (an
 * override replaces its slot's default, but V1 spread a theme's card styles
 * over these).
 */
export const cardDefaults = {
  root: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `var(${paletteVar("line")})`,
    padding: "0.5em",
    transformOrigin: "top",
    backgroundColor: `var(${paletteVar("surfaceSolid")})`,
  },
  supertitle: { fontSize: "0.9em" },
  title: {},
  subtitle: { fontWeight: "bold" },
  description: {},
  effect: { fontStyle: "italic" },
} as const;

/** V1's names for the card's parts, by slot. */
export const v1CardStyleNames = {
  root: "backdropStyle",
  supertitle: "supertitleStyle",
  title: "titleStyle",
  subtitle: "subtitleStyle",
  description: "descriptionStyle",
  effect: "effectStyle",
} as const;
