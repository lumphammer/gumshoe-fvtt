import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

export const antiquarianTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Antiquarian",
  global: `
    ${averiaLibre.importStatement}
    @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');
  `,
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/scott-webb-UjupleczBOY-unsplash.webp)`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont: "normal small-caps normal 1.1em 'IM Fell English', serif",
  logo: {
    fontScaleFactor: 24,
    frontTextElementStyle: {
      color: "#000",
      maskImage: `url(systems/${systemId}/assets/wallpaper/stonelike-mask.webp)`,
      maskRepeat: "repeat",
      maskSize: "contain",
      textShadow: ["0.03em 0.03em 0px #fff", "-0.03em -0.03em 0px #fff"].join(
        ", ",
      ),
    },
    rearTextElementStyle: {
      display: "none",
    },
    textElementsStyle: {
      transform: "scale(0.7)",
      fontWeight: "bold",
    },
    backdropStyle: {
      backgroundImage: `url(systems/${systemId}/assets/wallpaper/tailpiece9-768.webp), url(systems/${systemId}/assets/wallpaper/tailpiece9-768.webp)`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "bottom, top",
      backgroundSize: "19%",
      maskImage: `url(systems/${systemId}/assets/wallpaper/stonelike-mask.webp)`,
      maskRepeat: "repeat",
      maskSize: "contain",
      opacity: 0.7,
    },
  },
  colors: {
    accent: "#236",
    accentContrast: "#fff",
    glow: "#cfffc2",
    wallpaper: "#eee", //
    backgroundSecondary: "#fff6",
    backgroundPrimary: "#fff9",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#222",
    controlBorder: "#766",
  },
});
