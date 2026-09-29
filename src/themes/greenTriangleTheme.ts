import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

export const greenTriangleTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Green triangle",
  global: `
    ${averiaLibre.importStatement}
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Display:wght@900&family=Big+Shoulders+Stencil+Text:wght@100;200;300;400;500;600;700;800;900&display=swap');
  `,
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/annie-spratt-xTaOPMa6wAE-unsplash.webp)`,
  },
  smallSheetRootStyle: {
    backgroundImage: `linear-gradient( to right, #fff9,#fff9), url(systems/${systemId}/assets/wallpaper/annie-spratt-xTaOPMa6wAE-unsplash.webp)`,
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont:
    "900 small-caps normal 1.1em 'Big Shoulders Stencil Text', serif",
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
