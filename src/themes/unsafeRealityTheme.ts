import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const unsafeRealityTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Unsafe Reality",
  palette: {
    polarity: "dark",
    wallpaper: "#84432a",
    surface: "#5447",
    surfaceNested: "#5677",
    control: "#7702",
    text: "#ccc",
    accent: "#df9d4f",
    line: "#aaa9",
    feedback: "#f4bcf0",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #ccc 70%, rgb(110, 67, 54))",
    onAccent: "black",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal normal normal 1.1em 'Averia Serif Libre', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover, cover, cover",
            backgroundPosition: "center, center, center",
            backgroundImage: `
    linear-gradient(
      to bottom,
      #84432a 0%,
      #84432a 100%
    ),
    linear-gradient(
      to bottom,
      #000a 0%,
      #000a 100%
    ),
      url(systems/${systemId}/assets/wallpaper/monochrome-unreality-cropped.webp)
    `,
            backgroundBlendMode: "color, normal, normal",
          },
          small: {
            backgroundImage: `
    linear-gradient(
      to bottom,
      #84432a 0%,
      #84432a 100%
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
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          background:
            "\n        linear-gradient(to bottom, #b63017 0%, #af2211 100%)\n      ",
          maskImage: `url(systems/${systemId}/assets/wallpaper/esoterica.webp)`,
          maskRepeat: "no-repeat",
          maskSize: "contain",
          maskPosition: "50% 10%",
          maskOrigin: "border-box",
          margin: "-2em -0em -3em",
        },
        text: {
          font: "var(--inv-display-font)",
          textTransform: "var(--inv-display-case)",
          fontSize: "1em",
          whiteSpace: "nowrap",
          caretColor: "black",
          border: "none",
          padding: "0",
          lineHeight: "1",
          transform: "rotateY(15deg) rotateZ(-2deg) translateX(-0%)",
          fontVariant: "small-caps",
        },
        front_wrapper: {
          color: "transparent",
        },
        front: {
          padding: "0 1em",
          color: "#ffef78",
          maskImage: `url(systems/${systemId}/assets/wallpaper/grunge-gradient.webp)`,
          maskRepeat: "no-repeat",
          maskSize: "100% 100%",
          maskOrigin: "border-box",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          color: "#ffef78",
          maskImage: `url(systems/${systemId}/assets/wallpaper/grunge-gradient.webp)`,
          maskRepeat: "no-repeat",
          maskSize: "100% 100%",
          maskOrigin: "border-box",
        },
        rear_wrapper: {},
        rear: {
          padding: "0 1em",
          color: "#af2211",
          textShadow:
            "\n      -5px -5px 10px #ed6a26,\n      5px 5px 10px #ed6a26\n      ",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          color: "#af2211",
          textShadow:
            "\n      -5px -5px 10px #ed6a26,\n      5px 5px 10px #ed6a26\n      ",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(110, 67, 54)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(110, 83, 77)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(110, 67, 54)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(110, 67, 54)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(110, 83, 77)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(149, 51, 38)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(149, 59, 49)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(170, 34, 34, 0.47)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(170, 51, 59, 0.47)",
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
        background: "rgb(110, 83, 77)",
        "& option": {
          background: "rgb(110, 67, 54)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(110, 67, 54)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(110, 67, 54))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(110, 67, 54))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(110, 67, 54))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(110, 67, 54))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(110, 67, 54))",
          },
        },
      },
    },
    card: {
      base: {
        root: {
          border: "1px solid #aaa9",
          padding: "0.5em",
          transformOrigin: "top",
          backgroundColor: "rgb(110, 67, 54)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #f4bcf0",
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
          background: "#5677",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#df9d4f",
          "&:hover": {
            textShadow: "0 0 0.3em #f4bcf0",
          },
          "&[data-selected]:not([data-wrapped])": {
            background: "#5447",
            "&:hover": {
              textShadow: "none",
            },
          },
          "&[data-wrapped]": {
            borderRadius: "0.2em",
          },
          "&[data-selected][data-wrapped]": {
            background: "#5447",
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
          backgroundColor: "#5447",
          "&[data-wrapped]": {},
        },
      },
    },
  },
});
