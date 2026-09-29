import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

export const niceThemeDark: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Nice Dark Red Agents",
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Text:wght@100;200;300;400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@100;200;300;400;500;600;700;800;900&family=Big+Shoulders+Text:wght@100;200;300;400;500;600;700;800;900&display=swap');
    ${averiaLibre.importStatement}
  `,
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/nice_red_agents.webp)`,
  },
  smallSheetRootStyle: {
    backgroundImage: `linear-gradient( to right, #0002,#0002), url(systems/${systemId}/assets/wallpaper/nice_red_agents.webp)`,
  },
  appWindowStyle: {
    boxShadow: "0 0 20px #f00",
    border: "1px solid red",
    borderRadius: "0.5em",
    overflow: "hidden",
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont: "normal normal 400 1.2em 'Big Shoulders Text', serif",
  logo: {
    fontScaleFactor: 18,
    frontTextElementStyle: {
      background: "linear-gradient(135deg, #fff 0%, #fff 90%)",
      backgroundClip: "text",
    },
    rearTextElementStyle: {
      textShadow: "2px 0px 1px black, -1px 0px 0px rgba(255,255,255,0.5)",
    },
    textElementsStyle: {
      font: "normal normal 300 1.2em 'Big Shoulders Display', serif",
    },
    backdropStyle: {
      backgroundColor: "rgba(0,0,0,0.4)",
      transform: "scaleY(0.9) scaleX(1.2) translateY(0.1em)",
      zIndex: -1,
    },
  },
  colors: {
    accent: "#fff",
    accentContrast: "#600",
    glow: "#f33",
    wallpaper: "#4a0d00",
    danger: "yellow",

    backgroundSecondary: "#0004",
    backgroundPrimary: "#0007",

    backgroundButton: "rgba(255,255,255,0.1)",
    text: "#ccc",
  },
});
