import { systemId } from "../constants";
import { tiltedPortrait, underlineTabs } from "./helpers";
import { defineThemeV2 } from "./theme";

const wallpaper = `url(systems/${systemId}/assets/wallpaper/marjanblan-5Ft4NWTmeJE-unsplash.webp)`;

export const niceTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Nice Light Agents",
  layout: "full-frame",
  palette: {
    polarity: "light",
    wallpaper: "#ddd",
    // translucent, over the wallpaper...
    surface: "rgba(255,255,255,0.5)",
    surfaceNested: "rgba(255,255,255,0.5)",
    // ...so things that overlap content get them flattened over it
    surfaceSolid: "rgb(238, 238, 238)",
    surfaceNestedSolid: "rgb(227, 227, 227)",
    control: "rgba(0,0,0,0.1)",
    text: "#433",
    accent: "#962121",
    feedback: "#ff0000",
    line: "oklch(0.7 0 0)",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
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
    portrait: tiltedPortrait,
    sheetRoot: {
      variants: {
        sheet: {
          character: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: wallpaper,
          },
          item: { backgroundImage: wallpaper },
          freeform: { backgroundImage: wallpaper },
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
          background: `#4a0d00 url(systems/${systemId}/assets/wallpaper/nice_red_agents.webp)`,
          backgroundSize: "cover",
          transform: "scaleY(0.9) scaleX(1.2) translateY(0.2em)",
          zIndex: -1,
          borderStyle: "solid",
          borderColor: "#433",
        },
        text: { fontWeight: 400 },
        front_wrapper: { color: "#fff" },
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
