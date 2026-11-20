import type { ThemeCatalogue } from "@lumphammer/investigator-fvtt-types";

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
      // from nothing: none of the catalogue's tab
      all: "revert-layer",
      font: "var(--inv-display-font)",
      fontSize: "1.1em",
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
