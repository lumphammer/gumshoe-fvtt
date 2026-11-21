import { defineThemeV2 } from "./theme";

export const nightFogTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Night Fog",
  description: "A very neutral light theme to test the ThemeV2 system",
  layout: "full-frame",
  palette: {
    polarity: "dark",
    wallpaper: "oklch(0.2813 0.0123 250.2)", // shown behind the sheet; there's no image yet
    surface: "oklch(0.22 0.0026 247.96)", // what content sits on (opaque)
    surfaceNested: "#292b2d", // content inside content
    control: "#333", // button and toggle fill
    text: "oklch(0.9134 0.0123 313.2)",
    accent: "oklch(0.8 0.07 251.54)", // selected, or a call to action
    line: "#444", // outlines, rules
    feedback: "#7fb3ff", // hover, focus and drag glow
    danger: "#c0392b",
    warning: "#d68a00",
    success: "#2e7d32",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "16px",
    body: { family: "'Averia Sans Libre', sans-serif" },
    display: { family: "'Averia Serif Libre', sans-serif" },
  },
  catalogue: {
    logo: {
      base: {
        text: {
          transform: "scale(0.8)",
          fontWeight: "bold",
          fontSize: "0.7em",
        },
      },
    },
  },
});
