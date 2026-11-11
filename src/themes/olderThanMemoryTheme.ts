import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const olderThanMemoryTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Older Than Memory",
  palette: {
    polarity: "dark",
    wallpaper: "#333",
    surface: "#211616cc",
    surfaceNested: "#21161699",
    control: "rgba(0,0,0,0.1)",
    text: "#ccc",
    accent: "#fdbd8e",
    line: "#825050",
    feedback: "#fda994",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #ccc 70%, rgb(36, 27, 27))",
    onAccent: "#333",
    bodyFont: "normal 16px 'Signika', sans-serif",
    displayFont: "bold normal normal 1.1em 'Cormorant Unicase', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    appFrame: {
      base: {
        root: {
          boxShadow: "0 0 20px #fda994",
        },
      },
    },
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "top",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/red_sands.jpg)`,
          },
          small: {
            backgroundImage: `linear-gradient( to right, #0009,#0009), url(systems/${systemId}/assets/wallpaper/red_sands.jpg)`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {},
        text: {
          font: "normal small-caps normal 1.1em 'Longdon Decorative Regular', serif",
          textTransform: "var(--inv-display-case)",
          fontSize: "1em",
          whiteSpace: "nowrap",
          caretColor: "black",
          border: "none",
          padding: "0",
          lineHeight: "1",
          transform: "scale(0.6)",
          fontWeight: "bold",
        },
        front_wrapper: {
          color: "transparent",
        },
        front: {
          padding: "0 1em",
          color: "#fff",
          textShadow:
            "0 0 0.5em #fda994, 0 0 0.2em #fda994, 0 0 1em #fda994, 0 0 2em #fda994",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          color: "#fff",
          textShadow:
            "0 0 0.5em #fda994, 0 0 0.2em #fda994, 0 0 1em #fda994, 0 0 2em #fda994",
        },
        rear_wrapper: {
          border: "2px solid #fda994",
          borderRadius: "3em",
          boxShadow: "0 0 0.5em 0 inset #fda994,0 0 0.5em 0 #fda994",
          backgroundImage:
            "radial-gradient(closest-side, #fda99477 0%, #fda99400 100%), linear-gradient(to bottom, #6667, #0007)",
          padding: "0.1em",
        },
        rear: {
          padding: "0 1em",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(36, 27, 27)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(40, 33, 33)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(36, 27, 27)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(36, 27, 27)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(40, 33, 33)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(125, 19, 19)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(106, 27, 27)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(144, 11, 11, 0.80)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(144, 11, 11, 0.60)",
          },
        },
      ],
    },
    select: {
      base: {
        font: "var(--inv-body-font)",
        fontVariantLigatures: "none",
        color: "var(--inv-text)",
        padding: "0.1em 0.3em",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--inv-line)",
        boxShadow: "none",
        "&:is(:hover, [data-hover])": {
          borderColor: "var(--inv-line)",
        },
        "&:is(:focus, [data-focus])": {
          borderColor: "var(--inv-line)",
          boxShadow: "none",
        },
        "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])": {
          opacity: 0.7,
        },
        background: "rgb(40, 33, 33)",
        "& option": {
          background: "rgb(36, 27, 27)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(36, 27, 27)",
        opacity: 0.7,
        "&:is(:hover, [data-hover])": {
          opacity: 1,
          transform: "scale(1.1)",
          color: "var(--inv-accent)",
        },
      },
    },
    callout: {
      variants: {
        tone: {
          neutral: {
            background:
              "color-mix(in srgb, var(--inv-line) 30%, rgb(36, 27, 27))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(36, 27, 27))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(36, 27, 27))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(36, 27, 27))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(36, 27, 27))",
          },
        },
      },
    },
    card: {
      base: {
        root: {
          border: "1px solid #825050",
          padding: "0.5em",
          transformOrigin: "top",
          backgroundColor: "rgb(36, 27, 27)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #fda994",
          },
        },
        supertitle: {
          fontSize: "0.9em",
        },
        title: {},
        subtitle: {
          fontWeight: "bold",
        },
        description: {},
        effect: {
          fontStyle: "italic",
        },
      },
    },
    tabs: {
      base: {
        tab: {
          font: "var(--inv-display-font)",
          textTransform: "var(--inv-display-case)",
          letterSpacing: "var(--inv-display-letter-spacing)",
          textAlign: "center",
          flex: 1,
          padding: "0.3em",
          display: "inline-block",
          fontSize: "1.2em",
          background: "#21161699",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#fdbd8e",
          "&:hover": {
            textShadow: "0 0 0.3em #fda994",
          },
          "&[data-selected]:not([data-wrapped])": {
            background: "#211616cc",
            "&:hover": {
              textShadow: "none",
            },
          },
          "&[data-wrapped]": {
            borderRadius: "0.2em",
          },
          "&[data-selected][data-wrapped]": {
            background: "#211616cc",
            "&:hover": {
              textShadow: "none",
            },
          },
          "input:disabled + &:hover": {
            textShadow: "none",
          },
        },
        spacer: {
          width: "0.5em",
        },
        content: {
          padding: "0.5em",
          backgroundColor: "#211616cc",
          "&[data-wrapped]": {},
        },
      },
    },
  },
});
