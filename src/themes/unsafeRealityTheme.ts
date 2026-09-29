import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

const orange = "#af2211";
const darkOrange = "#b63017";
const lightOrange = "#ed6a26";
const yellow = "#ffef78";
const brick = "#84432a";
const wallpaper = brick;

export const unsafeRealityTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Unsafe Reality",
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap');
    ${averiaLibre.importStatement}
  `,
  largeSheetRootStyle: {
    backgroundImage: `
    linear-gradient(
      to bottom,
      ${wallpaper} 0%,
      ${wallpaper} 100%
    ),
    linear-gradient(
      to bottom,
      #000a 0%,
      #000a 100%
    ),
      url(systems/${systemId}/assets/wallpaper/monochrome-unreality-cropped.webp)
    `,
    backgroundSize: "cover, cover, cover",
    backgroundPosition: "center, center, center",
    backgroundBlendMode: "color, normal, normal",
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont: "normal normal normal 1.1em 'Averia Serif Libre', serif",
  logo: {
    frontTextElementStyle: {
      color: yellow,
      maskImage: `url(systems/${systemId}/assets/wallpaper/grunge-gradient.webp)`,
      maskRepeat: "no-repeat",
      maskSize: "100% 100%",
      maskOrigin: "border-box",
    },
    rearTextElementStyle: {
      color: orange,
      textShadow: `
      -5px -5px 10px ${lightOrange},
      5px 5px 10px ${lightOrange}
      `,
    },
    textElementsStyle: {
      transform: "rotateY(15deg) rotateZ(-2deg) translateX(-0%)",
      fontVariant: "small-caps",
    },
    backdropStyle: {
      background: `
        linear-gradient(to bottom, ${darkOrange} 0%, ${orange} 100%)
      `,
      maskImage: `url(systems/${systemId}/assets/wallpaper/esoterica.webp)`,
      maskRepeat: "no-repeat",
      maskSize: "contain",
      maskPosition: "50% 10%",
      maskOrigin: "border-box",
      margin: "-2em -0em -3em",
    },
  },

  colors: {
    accent: "#df9d4f",
    accentContrast: "black",
    glow: "#f4bcf0",
    wallpaper,
    backgroundSecondary: "#5677",
    backgroundPrimary: "#5447",
    backgroundButton: "#7702",
    text: "#ccc",
    controlBorder: "#aaa9",
  },
});
