import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

const glow = "#fda994";
const sands = {
  backgroundImage: `url(systems/${systemId}/assets/wallpaper/red_sands.jpg)`,
  backgroundPosition: "center",
  backgroundSize: "cover",
};
const dimSands = {
  ...sands,
  backgroundImage: `linear-gradient(#0009 0 0), ${sands.backgroundImage}`,
};

export const olderThanMemoryTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Older Than Memory",
  layout: "full-frame",
  palette: {
    polarity: "dark",
    wallpaper: "#333",
    // translucent, over the wallpaper...
    surface: "#211616cc",
    surfaceNested: "#21161699",
    // ...and flattened over it, for things that overlap content
    surfaceSolid: "#251c1c",
    surfaceNestedSolid: "#282222",
    control: "rgba(0,0,0,0.1)",
    text: "#ccc",
    accent: "#fdbd8e",
    onAccent: "#333",
    line: "#825050",
    feedback: glow,
    danger: "red",
    warning: "#d68a00",
    success: "green",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "16px",
    body: { family: "'Signika', sans-serif" },
    display: {
      family: "'Cormorant Unicase', serif",
      weight: "bold",
      scale: 1.1,
    },
  },
  catalogue: {
    appFrame: {
      base: { root: { boxShadow: `0 0 20px ${glow}` } },
      // on a character sheet the strip is over the bright sands
      compoundVariants: [
        {
          layout: "full-frame",
          sheet: "character",
          css: { header: { "--inv-titlebar-ink": "#2c1a1b" } },
        },
      ],
    },
    sheetRoot: {
      variants: {
        sheet: {
          // the top of the sands while they load, so the strip's dark ink reads
          character: {
            ...sands,
            backgroundPosition: "top",
            backgroundColor: "#ca6445",
          },
          // the others have text on the wallpaper, so the sands are dimmed
          item: dimSands,
          freeform: dimSands,
        },
      },
    },
    logo: {
      base: {
        text: {
          font: "bold small-caps 1.1em 'Longdon Decorative Regular', serif",
          transform: "scale(0.8)",
        },
        // the name and subtext in white, glowing
        front_wrapper: {
          color: "#fff",
          textShadow: `0 0 0.5em ${glow}, 0 0 0.2em ${glow}, 0 0 1em ${glow}, 0 0 2em ${glow}`,
        },
        // a glowing lozenge behind them
        rear_wrapper: {
          border: `2px solid ${glow}`,
          borderRadius: "3em",
          boxShadow: `0 0 0.5em 0 inset ${glow}, 0 0 0.5em 0 ${glow}`,
          backgroundImage: `radial-gradient(closest-side, ${glow}77, ${glow}00), linear-gradient(#6667, #0007)`,
          padding: "0.1em",
        },
      },
    },
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
  },
});
