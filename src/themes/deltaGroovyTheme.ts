import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const deltaGroovyTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Delta Groovy",
  palette: {
    polarity: "light",
    wallpaper: "#b6b3b3",
    surface: "rgba(255,255,255,0.5)",
    surfaceNested: "rgba(255,255,255,0.2)",
    control: "rgba(0,0,0,0.1)",
    text: "#444",
    accent: "#801d8c",
    line: "#774",
    feedback: "#fff",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #444 70%, rgb(218, 217, 217))",
    onAccent: "white",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal normal normal 1.1em 'Spicy Rice', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/pulpy_paper.webp)`,
          },
          small: {
            "&:before": {
              backgroundImage:
                "repeating-conic-gradient(from 0deg at 10% 10%, #a06f18 0deg 6deg, #b78d6c 6deg 12deg, #cc7171 12deg 18deg, #ebaa4b 18deg 24deg, #e47005 24deg 30deg, #ed9907 30deg 36deg)",
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
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          backgroundColor: "#293417",
          backgroundImage:
            "repeating-conic-gradient(from 0deg at 50% 50%, #a06f18 0deg 12deg, #b78d6c 12deg 24deg, #cc7171 24deg 36deg, #ebaa4b 36deg 48deg, #e47005 48deg 60deg, #ed9907 60deg 72deg)",
          maskImage: "linear-gradient(rgba(0, 0, 0, 1.0), transparent)",
          margin: "-50em",
        },
        text: {
          position: "absolute",
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
          font: "var(--inv-display-font)",
          textTransform: "var(--inv-display-case)",
          fontSize: "4em",
          whiteSpace: "nowrap",
          caretColor: "black",
          border: "none",
          padding: "0",
          lineHeight: "1",
          transform: "translateY(-0.1em)",
        },
        front_wrapper: {
          color: "transparent",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        },
        front: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          fontSize: "calc(1em * var(--logo-fit, 1))",
          padding: "0 1em",
          background: "#fff",
          backgroundClip: "text",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          background: "#fff",
          backgroundClip: "text",
        },
        measure: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          padding: "0 1em",
          background: "#fff",
          backgroundClip: "text",
          position: "absolute",
          top: "0",
          left: "0",
          fontSize: "1em",
        },
        rear_wrapper: {
          zIndex: -1,
          color: "transparent",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        },
        rear: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          fontSize: "calc(1em * var(--logo-fit, 1))",
          padding: "0 1em",
          color: "#fff",
          textShadow:
            "-0.01em -0.01em 0 #000, 0.01em 0.01em 0 #000, 0.1em  0.1em  0 #d22fe5ff, 0.11em 0.11em 0 #000, 0.2em 0.2em 0 #e5762fff, 0.21em 0.21em 0 #000 ",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          color: "#fff",
          textShadow:
            "-0.01em -0.01em 0 #000, 0.01em 0.01em 0 #000, 0.1em  0.1em  0 #d22fe5ff, 0.11em 0.11em 0 #000, 0.2em 0.2em 0 #e5762fff, 0.21em 0.21em 0 #000 ",
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
          border: "1px solid #774",
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
          color: "#801d8c",
          "&:hover": {
            textShadow: "0 0 0.3em #fff",
          },
          ":not([data-wrapped]) > input:checked + &": {
            background: "rgba(255,255,255,0.5)",
            "&:hover": {
              textShadow: "none",
            },
          },
          "[data-wrapped] > &": {
            borderRadius: "0.2em",
          },
          "[data-wrapped] > input:checked + &": {
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
          "[data-wrapped] + &": {},
        },
      },
    },
  },
});
