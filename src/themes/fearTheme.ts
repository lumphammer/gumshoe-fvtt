import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

// worn ink, fading to the right, clipped to the logo's text
const ink = {
  background: "linear-gradient(90deg, #493d33, #615144b3)",
  backgroundClip: "text",
};

export const fearTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Nothing To Fear",
  layout: "full-frame",
  palette: {
    polarity: "light",
    wallpaper: "#b6b3b3",
    // translucent, over the stained paper...
    surface: "#ffffff80",
    surfaceNested: "#ffffff33",
    // ...and flattened over the wallpaper, for things that overlap content
    surfaceSolid: "color-mix(in srgb, #fff 50%, #b6b3b3)",
    surfaceNestedSolid: "color-mix(in srgb, #fff 20%, #b6b3b3)",
    control: "rgba(0,0,0,0.1)",
    text: "#444",
    accent: "#615144",
    onAccent: "#fff",
    line: "#766",
    feedback: "#fff",
    danger: "red",
    warning: "#d68a00",
    success: "green",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "16px",
    body: { family: "'Averia Libre', sans-serif" },
    display: { family: "'Special Elite', serif", scale: 1.1 },
  },
  catalogue: {
    sheetRoot: {
      base: {
        backgroundImage: `url(systems/${systemId}/assets/wallpaper/annie-spratt-xvU-X0GV9-o-unsplash.webp)`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      },
    },
    logo: {
      base: {
        text: { transform: "scale(0.8)" },
        // typewritten ink, over a white haze
        front_wrapper: { color: "transparent" },
        front: ink,
        front_sub: ink,
        rear_wrapper: { textShadow: "0 0 10px #fff" },
      },
    },
    card: {
      base: {
        root: {
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #fff",
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
          "&:hover": { textShadow: "0 0 0.3em #fff" },
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
