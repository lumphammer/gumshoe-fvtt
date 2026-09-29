import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { createStarburstGradient, themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

const colors = [
  // "#f4e83f", // this is a bright yellow, dropping it for now
  "#a06f18",
  "#b78d6c",
  "#cc7171",
  "#ebaa4b",
  "#e47005",
  "#ed9907",
];

const starburstGradient = createStarburstGradient(colors, 5, "50%", "50%");
const starburstGradientOffset = createStarburstGradient(
  colors,
  10,
  "10%",
  "10%",
);

export const deltaGroovyTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Delta Groovy",
  global: `
    ${averiaLibre.importStatement}
    @import url('https://fonts.googleapis.com/css2?family=Spicy+Rice&display=swap');
  `,
  smallSheetRootStyle: {
    ":before": {
      backgroundImage: starburstGradientOffset,
      maskImage: "linear-gradient(rgba(0, 0, 0, 0.5), transparent)",
      content: '" "',
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    "&>*": {
      position: "relative",
    },
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/pulpy_paper.webp)`,
    position: "relative",
  },
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/pulpy_paper.webp)`,
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont: "normal normal normal 1.1em 'Spicy Rice', serif",
  logo: {
    frontTextElementStyle: {
      background: "#fff",
      backgroundClip: "text",
    },
    rearTextElementStyle: {
      // front style clips weirdly, this stops it showing through
      color: "#fff",
      textShadow:
        "-0.01em -0.01em 0 #000, " +
        "0.01em 0.01em 0 #000, " +
        "0.1em  0.1em  0 #d22fe5ff, " +
        "0.11em 0.11em 0 #000, " +
        "0.2em 0.2em 0 #e5762fff, " +
        "0.21em 0.21em 0 #000 " +
        "",
    },
    textElementsStyle: {
      transform: "translateY(-0.1em)",
    },
    backdropStyle: {
      backgroundColor: "#293417",
      backgroundImage: starburstGradient,
      maskImage: "linear-gradient(rgba(0, 0, 0, 1.0), transparent)",
      margin: "-50em",
    },
  },
  colors: {
    accent: "#801d8c",
    accentContrast: "white",
    glow: "#fff",
    wallpaper: "#b6b3b3", //
    backgroundSecondary: "rgba(255,255,255,0.2)",
    backgroundPrimary: "rgba(255,255,255,0.5)",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#444",
    controlBorder: "#774",
  },
});
