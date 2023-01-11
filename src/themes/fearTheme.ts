import { systemName } from "../constants";
import { themeFactory } from "./functions";
import { ThemeV1 } from "./types";

export const fearTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Nothing To Fear",
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand+SC&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');
  `,
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemName}/assets/wallpaper/annie-spratt-xvU-X0GV9-o-unsplash.webp)`,
  },
  // smallSheetRootStyle: {
  //   backgroundImage: `url(systems/${systemName}/assets/wallpaper/annie-spratt-xvU-X0GV9-o-unsplash.webp)`,
  // },
  bodyFont: "16px 'Patrick Hand SC', sans-serif",
  displayFont: "normal normal normal 1.1em 'Special Elite', serif",
  logo: {
    frontTextElementStyle: {
      background:
        "linear-gradient(90deg, rgba(73, 61, 51, 1.0) 0%, rgba(97, 81, 68, 0.7) 100%)",
      backgroundClip: "text",
    },
    rearTextElementStyle: {
      textShadow: "0px 0px 10px white",
    },
    textElementsStyle: {
      transform: "scale(0.8)",
    },
    backdropStyle: {},
  },
  colors: {
    accent: "#615144",
    accentContrast: "white",
    glow: "#fff",
    wallpaper: "#b6b3b3", //
    backgroundSecondary: "rgba(255,255,255,0.2)",
    backgroundPrimary: "rgba(255,255,255,0.5)",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#444",
  },
});
