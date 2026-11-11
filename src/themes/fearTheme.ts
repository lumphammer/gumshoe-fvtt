import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const fearTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Nothing To Fear",
  palette: {
    polarity: "light",
    wallpaper: "#b6b3b3",
    surface: "rgba(255,255,255,0.5)",
    surfaceNested: "rgba(255,255,255,0.2)",
    control: "rgba(0,0,0,0.1)",
    text: "#444",
    accent: "#615144",
    line: "#766",
    feedback: "#fff",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #444 70%, rgb(218, 217, 217))",
    onAccent: "white",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal normal normal 1.1em 'Special Elite', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/annie-spratt-xvU-X0GV9-o-unsplash.webp)`,
          },
          small: {
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/annie-spratt-xvU-X0GV9-o-unsplash.webp)`,
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {},
        text: {
          font: "var(--inv-display-font)",
          textTransform: "var(--inv-display-case)",
          fontSize: "1em",
          whiteSpace: "nowrap",
          caretColor: "black",
          border: "none",
          padding: "0",
          lineHeight: "1",
          transform: "scale(0.8)",
        },
        front_wrapper: {
          color: "transparent",
        },
        front: {
          padding: "0 1em",
          background:
            "linear-gradient(90deg, rgba(73, 61, 51, 1.0) 0%, rgba(97, 81, 68, 0.7) 100%)",
          backgroundClip: "text",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          background:
            "linear-gradient(90deg, rgba(73, 61, 51, 1.0) 0%, rgba(97, 81, 68, 0.7) 100%)",
          backgroundClip: "text",
        },
        rear_wrapper: {},
        rear: {
          padding: "0 1em",
          textShadow: "0px 0px 10px white",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          textShadow: "0px 0px 10px white",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(218, 217, 217)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(196, 194, 194)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(218, 217, 217)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(218, 217, 217)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(196, 194, 194)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(218, 153, 153)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(196, 168, 168)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(255, 127, 127, 0.50)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(255, 127, 127, 0.20)",
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
        background: "rgb(196, 194, 194)",
        "& option": {
          background: "rgb(218, 217, 217)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(218, 217, 217)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(218, 217, 217))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(218, 217, 217))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(218, 217, 217))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(218, 217, 217))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(218, 217, 217))",
          },
        },
      },
    },
    card: {
      base: {
        root: {
          border: "1px solid #766",
          padding: "0.5em",
          transformOrigin: "top",
          backgroundColor: "rgb(218, 217, 217)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #fff",
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
          background: "rgba(255,255,255,0.2)",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#615144",
          "&:hover": {
            textShadow: "0 0 0.3em #fff",
          },
          "&[data-selected]:not([data-wrapped])": {
            background: "rgba(255,255,255,0.5)",
            "&:hover": {
              textShadow: "none",
            },
          },
          "&[data-wrapped]": {
            borderRadius: "0.2em",
          },
          "&[data-selected][data-wrapped]": {
            background: "rgba(255,255,255,0.5)",
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
          backgroundColor: "rgba(255,255,255,0.5)",
          "&[data-wrapped]": {},
        },
      },
    },
  },
});
