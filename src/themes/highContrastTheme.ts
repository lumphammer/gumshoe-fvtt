import { defineThemeV2 } from "./theme";

const glow = "#bbf";

export const highContrastTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "High Contrast",
  layout: "full-frame",
  palette: {
    polarity: "light",
    // dark, so a character sheet's regions stand out from it...
    wallpaper: "#666",
    // ...and opaque surfaces: there's no image to show through
    surface: "#efefef",
    surfaceNested: "#d1d1d1",
    control: "#ddf8",
    text: "#000",
    accent: "#005",
    onAccent: "#fff",
    line: "#000",
    feedback: glow,
    danger: "red",
    warning: "#d68a00",
    success: "green",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "1.1em",
    body: { family: "sans-serif" },
    display: { scale: 1.1 },
  },
  catalogue: {
    sheetRoot: {
      base: {
        background: `linear-gradient(

          to bottom,
          #eee 0%,
          #999 100%
        )`,
      },
      variants: {
        // item and freeform sheets have text on the wallpaper: a light one
        sheet: {
          item: { backgroundColor: "#bbb" },
          freeform: { backgroundColor: "#bbb" },
        },
      },
    },
    // logo: { base: { backdrop: { background: "#fff" } } },
    card: {
      base: {
        root: {
          "&.investigator-card-array-card:hover": {
            boxShadow: `0 0 0.3em 0.2em ${glow}`,
          },
        },
      },
    },
    tabs: {
      base: {
        // accent ink on every tab, the others on the nested surface, and a
        // glow on the text under the pointer
        tab: {
          color: "var(--inv-accent)",
          background: "var(--inv-surface-nested)",
          "&:hover": { textShadow: `0 0 0.3em ${glow}` },
        },
      },
      // the selected tab is the catalogue's, and neither it nor a disabled
      // one glows
      states: {
        selected: { tab: { "&:hover": { textShadow: "none" } } },
        disabled: { tab: { "&:hover": { textShadow: "none" } } },
      },
    },
    button: {
      base: {
        // background: ""
      },
      states: {
        disabled: {
          backgroundColor: "transparent",
          opacity: "0.6",
          color: "var(--inv-text)",
        },
      },
    },
  },
});
