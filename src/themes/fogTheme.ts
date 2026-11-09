import { defineThemeV2 } from "./theme";

export const fogTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Fog",
  description: "A very neutral light theme to test the ThemeV2 system",
  palette: {
    polarity: "light",
    wallpaper: "#d9dcdf", // shown behind the sheet; there's no image yet
    surface: "#f4f5f6", // what content sits on (opaque)
    surfaceNested: "#e9ebed", // content inside content
    control: "#dfe2e5", // button and toggle fill
    text: "#2b2f33",
    accent: "#3a6ea5", // selected, or a call to action
    line: "#8a9096", // outlines, rules
    feedback: "#7fb3ff", // hover, focus and drag glow
    danger: "#c0392b",
    warning: "#d68a00",
    success: "#2e7d32",
    info: "#2b6cb0",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "16px 'Averia Libre', sans-serif",
  },
  // the sheet runs under a see-through titlebar: the window's dragged by the
  // logo
  layout: "full-frame",
  catalogue: {
    logo: {
      base: {
        text: {
          transform: "scale(1)",
          fontWeight: "bold",
        },
        front_wrapper: {},
        rear_wrapper: {},
      },
    },
    appFrame: {
      base: {
        header: {
          // the title, when it's minimized
          fontFamily: "'Averia Libre', sans-serif",
        },
        root: {
          background: "wallpaper",
        },
      },
    },
    sheetRoot: {
      variants: {
        size: {
          large: {
            background: "none",
          },
        },
      },
    },
  },
});
