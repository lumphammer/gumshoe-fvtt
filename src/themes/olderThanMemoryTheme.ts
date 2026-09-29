import { systemId } from "../constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

const glow = "#fda994";

export const olderThanMemoryTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Older Than Memory",
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Fira+Sans+Condensed:ital@0;1&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Unicase:wght@300;400;500;600;700&family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Fira+Sans+Condensed:ital@0;1&display=swap');
  `,
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/red_sands.jpg)`,
    backgroundPosition: "top",
    backgroundSize: "cover",
  },
  smallSheetRootStyle: {
    backgroundImage: `linear-gradient( to right, #0009,#0009), url(systems/${systemId}/assets/wallpaper/red_sands.jpg)`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  },
  appWindowStyle: {
    boxShadow: `0 0 20px ${glow}`,
  },
  bodyFont: "normal 16px 'Signika', sans-serif",
  displayFont: "bold normal normal 1.1em 'Cormorant Unicase', serif",
  logo: {
    fontScaleFactor: 24,
    frontTextElementStyle: {
      color: "#fff",
      textShadow: [
        `0 0 0.5em ${glow}`,
        `0 0 0.2em ${glow}`,
        `0 0 1em ${glow}`,
        `0 0 2em ${glow}`,
      ].join(", "),
    },
    rearTextElementStyle: {},
    rearTextElementWrapperStyle: {
      border: `2px solid ${glow}`,
      borderRadius: "3em",
      boxShadow: [`0 0 0.5em 0 inset ${glow}`, `0 0 0.5em 0 ${glow}`].join(","),
      backgroundImage: [
        `radial-gradient(closest-side, ${glow}77 0%, ${glow}00 100%)`,
        "linear-gradient(to bottom, #6667, #0007)",
      ].join(", "),
      padding: "0.1em",
    },
    textElementsStyle: {
      font: "normal small-caps normal 1.1em 'Longdon Decorative Regular', serif",
      transform: "scale(0.6)",
      fontWeight: "bold",
    },
    backdropStyle: {},
  },
  colors: {
    accent: "#fdbd8e",
    accentContrast: "#333",
    glow,
    wallpaper: "#333",
    backgroundPrimary: "#211616cc",
    backgroundSecondary: "#21161699",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#ccc",
    controlBorder: "#825050",
  },
});
