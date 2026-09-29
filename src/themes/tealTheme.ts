import { systemId } from "../constants";
import { averiaLibre } from "./constants";
import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

export const tealTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "Teal of Cthulhu",
  global: `
    @import url("https://fonts.googleapis.com/css2?family=Federo&display=swap");
    ${averiaLibre.importStatement}
  `,
  largeSheetRootStyle: {
    backgroundImage: `url(systems/${systemId}/assets/wallpaper/marjanblan-5Ft4NWTmeJE-unsplash.webp)`,
  },
  bodyFont: averiaLibre.fontFamily,
  displayFont: "normal small-caps normal 1em 'Federo', serif",
  logo: {
    frontTextElementStyle: {
      background: "linear-gradient(135deg, #efb183 0%,#222 30%,#efb183 90%)",
      backgroundClip: "text",
    },
    rearTextElementStyle: {
      textShadow:
        "2px 0px 1px black, 6px 0px 4px rgba(0,0,0,0.5), -1px 0px 0px rgba(255,255,255,0.5)",
    },
    textElementsStyle: {
      transform: "rotateY(-30deg) rotateZ(-1deg) translateX(-5%)",
    },
    backdropStyle: {
      perspective: "500px",
      perspectiveOrigin: "50% 50%",
      backgroundImage:
        "radial-gradient(closest-side, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
    },
  },
  colors: {
    accent: "#1d5d5d",
    accentContrast: "white",
    glow: "#5effff",
    wallpaper: "#ddd",
    backgroundSecondary: "rgba(255,255,255,0.2)",
    backgroundPrimary: "rgba(255,255,255,0.5)",
    backgroundButton: "rgba(0,0,0,0.1)",
    text: "#433",
    controlBorder: "#766",
  },
});
