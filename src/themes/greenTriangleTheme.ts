import { systemId } from "../constants";
import { tiltedPortrait } from "./helpers";
import { defineThemeV2 } from "./theme";

const glow = "#cfffc2";
const leaves = `url(systems/${systemId}/assets/wallpaper/annie-spratt-xTaOPMa6wAE-unsplash.webp)`;

export const greenTriangleTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Green triangle",
  layout: "full-frame",
  palette: {
    polarity: "light",
    wallpaper: "#b6b3b3",
    // translucent, over the wallpaper...
    surface: "#fff9",
    surfaceNested: "#fff6",
    // ...and flattened over it, for things that overlap content
    surfaceSolid: "#e2e1e1",
    surfaceNestedSolid: "#d3d1d1",
    control: "rgba(0,0,0,0.1)",
    text: "#000",
    accent: "#150",
    onAccent: "#fff",
    line: "#766",
    feedback: glow,
    danger: "red",
    warning: "#d68a00",
    success: "green",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "16px",
    body: { family: "'Averia Libre', sans-serif" },
    // Protest Guerrilla only comes in one weight
    display: {
      family: "'Protest Guerrilla', serif",
      weight: "normal",
      case: "uppercase",
    },
  },
  catalogue: {
    portrait: tiltedPortrait,
    appFrame: {
      // on a character sheet the strip is over the dark canvas
      compoundVariants: [
        {
          layout: "full-frame",
          sheet: "character",
          css: { header: { "--inv-titlebar-ink": "#fff" } },
        },
      ],
    },
    sheetRoot: {
      base: {
        backgroundImage: leaves,
        backgroundPosition: "center",
        backgroundSize: "cover",
      },
      variants: {
        // the others have text on the wallpaper, so the leaves are faded
        sheet: {
          item: { backgroundImage: `linear-gradient(#fff9 0 0), ${leaves}` },
          freeform: {
            backgroundImage: `linear-gradient(#fff9 0 0), ${leaves}`,
          },
        },
      },
    },
    logo: {
      base: {
        // stencilled, squashed and askew
        text: {
          transform: "scale(1.0, 0.8) rotate(-1.5deg)",
          maskImage: `url(systems/${systemId}/assets/wallpaper/textured-mask.webp)`,
          maskSize: "10em 0.2em",
          maskOrigin: "border-box",
        },
        // white, over a glow
        front_wrapper: { color: "#fff" },
        // (on each text: an em in a text-shadow is the declaring element's)
        rear: { textShadow: `0 0 0.2em ${glow}` },
        rear_sub: { textShadow: `0 0 0.2em ${glow}` },
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
