import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

export const niceTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Nice Light Agents",
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Text:wght@100;200;300;400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@100;200;300;400;500;600;700;800;900&family=Big+Shoulders+Text:wght@100;200;300;400;500;600;700;800;900&display=swap');
    ${averiaLibre.importStatement}
  `,
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/marjanblan-5Ft4NWTmeJE-unsplash.webp)`,
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont: "normal normal 400 1.2em 'Big Shoulders Text', serif",
  logo: {
    fontScaleFactor: 18,
    frontTextElementStyle: {
      color: "#fff",
    },
    rearTextElementStyle: {
      textShadow: "2px 0px 1px black, -1px 0px 0px rgba(255,255,255,0.5)",
    },
    textElementsStyle: {
      font: "normal normal 300 1.2em 'Big Shoulders Display', serif",
    },
    backdropStyle: {
      background: `#4a0d00 url(systems/${systemId}/assets/wallpaper/nice_red_agents.webp)`,
      backgroundSize: "cover",
      transform: "scaleY(0.9) scaleX(1.2) translateY(0.1em)",
      zIndex: -1,
      borderStyle: "solid",
      borderThickness: "2px 0",
      borderColor: "#433",
    },
  },
  colors: {
    accent: "#962121",
    accentContrast: "white",
    glow: "#ff0000",
    wallpaper: "#ddd",
    backgroundSecondary: "rgba(255,255,255,0.2)",
    backgroundPrimary: "rgba(255,255,255,0.5)",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#433",
    controlBorder: "#766",
  },
});
