import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

export const greenTriangleTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Green triangle",
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/annie-spratt-xTaOPMa6wAE-unsplash.webp)`,
  },
  smallSheetRootStyle: {
    backgroundImage: `linear-gradient( to right, #fff9,#fff9), url(systems/${systemId}/assets/wallpaper/annie-spratt-xTaOPMa6wAE-unsplash.webp)`,
  },
  bodyFont: averiaLibre.fontFamily,
  // Protest Guerrilla only comes in one weight
  displayFont: "normal normal normal 1em 'Protest Guerrilla', serif",
  displayFontTextTransform: "uppercase",
  logo: {
    frontTextElementStyle: {
      color: "#fff",
    },
    rearTextElementStyle: {
      textShadow: "0 0 0.2em #cfffc2",
    },
    textElementsStyle: {
      transform: "scale(1.0, 0.8) rotate(-1.5deg)",
      maskImage: `url(systems/${systemId}/assets/wallpaper/textured-mask.webp)`,
      maskSize: "10em 0.2em",
      maskOrigin: "border-box",
    },
    backdropStyle: {},
  },
  colors: {
    // accent: "#256425",
    accent: "#150",
    accentContrast: "#fff",
    glow: "#cfffc2",
    wallpaper: "#b6b3b3", //
    backgroundSecondary: "#fff6",
    backgroundPrimary: "#fff9",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#000",
    controlBorder: "#766",
  },
});
