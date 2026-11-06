import { defineRecipe } from "@pandacss/dev";

import { paletteVar } from "../palette";

/** What a text field and a dropdown share. */
export const fieldBase = {
  textStyle: "body",
  fontVariantLigatures: "none",
  color: "text",
  padding: "0.1em 0.3em",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "line",
  // Foundry's own field shadows and outlines: focus is the focusRing's
  boxShadow: "none",
  _hover: { borderColor: "line" },
  _focus: { borderColor: "line", boxShadow: "none" },
  _disabled: { opacity: 0.7 },
} as const;

/**
 * **input**: a field to type into: a text or number input, or a text area.
 *
 * Use for: anything the user types.
 * Not for: rich text (richText), choosing from a list (select).
 *
 * States: invalid, via `aria-invalid="true"`: a `danger` border and tint.
 * Typed text is `text` ink; a placeholder is faded and italic.
 */
export const input = defineRecipe({
  className: "inv-input",
  description: "A field to type into.",
  base: {
    ...fieldBase,
    background: "surface",
    resize: "vertical",
    _placeholder: { opacity: 0.5, fontStyle: "italic" },
    "&:is(textarea)": { lineHeight: "1" },
    "&[aria-invalid=true]": {
      borderColor: "danger",
      background: `[color-mix(in srgb, var(${paletteVar("danger")}) 30%, var(${paletteVar("surface")}))]`,
    },
  },
});
