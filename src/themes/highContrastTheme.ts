import { themeFactory } from "./functions";
import type { ThemeV1 } from "./types";

export const highContrastTheme: ThemeV1 = themeFactory({
  schemaVersion: "v1",
  displayName: "High Contrast",
  global: "",
  largeSheetRootStyle: {},
  bodyFont: "1.1em sans-serif",
  displayFont: "1.1em sans-serif",
  logo: {
    frontTextElementStyle: {
      color: "#000",
    },
    rearTextElementStyle: {
      display: "none",
    },
    textElementsStyle: {
      transform: "none",
    },
    backdropStyle: {
      background: "white",
    },
  },
  colors: {
    accent: "#005",
    accentContrast: "white",
    glow: "#bbf",
    wallpaper: "#666",
    backgroundSecondary: "#ffffffb2",
    backgroundPrimary: "#ffffffe5",
    backgroundButton: "#00000019",
    text: "#000",
  },
});
