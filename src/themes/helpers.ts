import type {
  ThemeCatalogue,
  ThemeStyle,
} from "@lumphammer/investigator-fvtt-types";

import { displayFontSize, displaySizeVar, textStyleCss } from "./fonts";

/**
 * Portraits tilted towards the sheet's nearer diagonal, like a photo resting
 * on it (the portrait is at the top left).
 */
export const tiltedPortrait: ThemeCatalogue["portrait"] = {
  base: { transform: "rotateZ(-2deg)" },
};

export const underlineTabs: ThemeCatalogue["tabs"] = {
  states: {
    hoverFeedback: {
      tab: {
        boxShadow: "none",
        borderColor: "oklch(from var(--inv-accent) l c h / 50%)",
      },
    },
    // from nothing, like the tab: an accent underline and ink
    selected: {
      tab: {
        all: "revert-layer",
        borderColor: "var(--inv-accent)",
        color: "var(--inv-accent)",
      },
    },
  },
  base: {
    content: {
      //
      background: `light-dark(
        oklch(from var(--inv-surface) calc(l * 1.3) c h / 40%),
        oklch(from var(--inv-surface) calc(l * 0.7) c h / 60%)
      )`,
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "var(--inv-line)",
      // backdropFilter: "blur(5px)",
      padding: "0.5em",
    },
    tab: {
      // from nothing: none of the catalogue's tab but its text style (the
      // recipe's base, so `revert-layer` would undo it)
      all: "revert-layer",
      // (csstype's `fontVariantCaps` doesn't take a var())
      ...(textStyleCss("display") as ThemeStyle),
      [displaySizeVar]: "1.1",
      fontSize: displayFontSize,
      textAlign: "center",
      borderStyle: "solid",
      borderWidth: "0 0 2px 0",
      borderColor: "transparent",
    },
    list: {
      marginBottom: "5px",
      marginTop: "5px",
    },
  },
};
