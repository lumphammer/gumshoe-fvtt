import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

const glow = "#7be9e9";
const starlight = "#cdf6ff";
// brushed steel, clipped to the logo's text
const steel = {
  background:
    "linear-gradient(135deg, #000 0%, #6c6c6c 24%, #949494 34%, #6a6a6a 44%, #000 87%, #8f8f8f 100%)",
  backgroundClip: "text",
};

export const pallidTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Aching Stars",
  layout: "full-frame",
  palette: {
    polarity: "dark",
    wallpaper: "#152938",
    // translucent, over the wallpaper...
    surface: "#16181c7f",
    surfaceNested: "#4249567f",
    // ...and flattened over it, for things that overlap content
    surfaceSolid: "#16212a",
    surfaceNestedSolid: "#2b3947",
    control: "rgba(255,255,255,0.1)",
    text: "#ddd",
    accent: "#aff2f2",
    onAccent: "#333",
    line: "#ddd",
    feedback: glow,
    danger: "red",
    warning: "#d68a00",
    success: "green",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "16px",
    body: { family: "'Roboto Flex', sans-serif" },
    display: { family: "'Nova Square', serif", caps: "small-caps", scale: 1.1 },
  },
  catalogue: {
    sheetRoot: {
      base: {
        backgroundImage: `url(systems/${systemId}/assets/wallpaper/guille-pozzi-sbcIAn4Mn14-unsplash.webp)`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      },
    },
    logo: {
      base: {
        // a nebula behind the logo, fading out down the sheet
        backdrop: {
          background: `url(systems/${systemId}/assets/wallpaper/philipp-trubchenko-jObj_p885Gg-unsplash.webp)`,
          backgroundSize: "cover",
          transform: "scale(1.1)",
          height: "400%",
          width: "150%",
          zIndex: -1,
          maskImage: "linear-gradient(#000, transparent)",
        },
        // turned away into the distance
        text: { transform: "rotateY(21deg) translateX(4%) scale(0.8)" },
        // steel, over a starlight halo
        front_wrapper: { color: "transparent" },
        front: steel,
        front_sub: steel,
        rear_wrapper: {
          textShadow: [
            `-3px -3px 5px ${starlight}`,
            `-3px 3px 5px ${starlight}`,
            `3px -3px 5px ${starlight}`,
            `3px 3px 5px ${starlight}`,
          ].join(", "),
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
