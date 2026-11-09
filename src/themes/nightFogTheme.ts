import { defineThemeV2 } from "./theme";

export const nightFogTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Night Fog",
  description: "A very neutral light theme to test the ThemeV2 system",
  palette: {
    polarity: "dark",
    wallpaper: "#292c2f", // shown behind the sheet; there's no image yet
    surface: "#141516", // what content sits on (opaque)
    surfaceNested: "#292b2d", // content inside content
    control: "#333", // button and toggle fill
    text: "#999",
    accent: "#3a6ea5", // selected, or a call to action
    line: "#444", // outlines, rules
    feedback: "#7fb3ff", // hover, focus and drag glow
    danger: "#c0392b",
    warning: "#d68a00",
    success: "#2e7d32",
    info: "#2b6cb0",
    bodyFont: "'Geist'",
    displayCase: "'Geist'",
  },
  catalogue: {
    logo: {
      base: {
        text: { transform: "scale(0.7)", fontWeight: "bold" },
      },
    },
  },
});
