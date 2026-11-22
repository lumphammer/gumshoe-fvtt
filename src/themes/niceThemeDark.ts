import { systemId } from "../constants";
import { underlineTabs } from "./helpers";
import { defineThemeV2 } from "./theme";

const wallpaper = `url(systems/${systemId}/assets/wallpaper/nice_red_agents.webp)`;

const text = "oklch(0.95 0.04 80)";

export const niceThemeDark = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Nice Dark Red Agents",
  layout: "full-frame",
  palette: {
    polarity: "dark",
    wallpaper: "#4a0d00",
    // translucent, over the wallpaper...
    surface: "rgba(0,0,0,0.45)",
    surfaceNested: "rgba(0,0,0,0.45)",
    // ...so things that overlap content get them flattened over it
    surfaceSolid: "rgb(39, 6, 0)",
    surfaceNestedSolid: "rgb(54, 9, 0)",
    control: "oklch(0.25 0.15 20 / 50%)",
    text,
    // text: "#ccc",
    accent: "oklch(0.8 0.15 80)",
    onAccent: "#000",
    feedback: "#f33",
    line: "oklch(0.35 0.15 20)",
    danger: "oklch(0.4 0.2 60deg)",
    warning: "oklch(0.4 0.2 100deg)",
    success: "#4caf50",
    info: "#6fa8e8",
  },
  fonts: {
    baseSize: "16px",
    body: {
      family: "'Saira', sans-serif",
      weight: 500,
      stretch: "semi-condensed",
    },
    display: {
      family: "'Saira', serif",
      weight: 600,
      stretch: "condensed",
      caps: "small-caps",
      // condensed small caps look small
      scale: 1.2,
    },
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `radial-gradient(ellipse, #0006 0%, #000a 100%), ${wallpaper}`,
          },
          small: {
            backgroundImage: `
              radial-gradient(
                farthest-corner at top right,
                #0004 0%,
                #000 100%
              ),
              ${wallpaper}
            `,
          },
        },
      },
    },
    appFrame: {
      base: {
        root: {
          border: "1px solid oklch(0.5 0.2 20deg)",
          boxShadow: `
            0px 0px 10px 5px #0007,
            0px 0px 20px 10px #0007
            `,

          borderRadius: "0.5em",
          overflow: "hidden",
        },
      },
    },
    logo: {
      base: {
        root: {
          scale: "0.9",
          translate: "0 0.7em",
        },
        backdrop: {
          background: `linear-gradient(to bottom,
            #0007 0%,
            #0000 50%,
            #0007 100%
          )`,
          transform: "scaleY(0.9) scaleX(1.2) translateY(0.2em)",
          zIndex: -1,
          borderStyle: "none",
          borderColor: "#ccc",
        },
        text: { fontWeight: 400 },
        rear_wrapper: {
          textShadow: "2px 0px 1px black, -1px 0px 0px rgba(255,255,255,0.5)",
        },
      },
    },
    card: {
      base: {
        root: {
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em var(--inv-feedback)",
          },
        },
      },
    },
    tabs: underlineTabs,
    button: {
      base: {
        lineHeight: "1",
      },
    },
    region: {
      base: {
        background: "none",
      },
    },
    panel: {
      base: {
        border: "1px solid var(--inv-line)",
      },
    },
  },
});
