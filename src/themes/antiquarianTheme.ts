import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const antiquarianTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Antiquarian",
  palette: {
    polarity: "light",
    wallpaper: "#eee",
    surface: "#fff9",
    surfaceNested: "#fff6",
    control: "rgba(0,0,0,0.1)",
    text: "#222",
    accent: "#236",
    line: "#766",
    feedback: "#cfffc2",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #222 70%, rgb(248, 248, 248))",
    onAccent: "#fff",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal small-caps normal 1.1em 'IM Fell English', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/scott-webb-UjupleczBOY-unsplash.webp)`,
          },
          small: {
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/scott-webb-UjupleczBOY-unsplash.webp)`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          backgroundImage: `url(systems/${systemId}/assets/wallpaper/tailpiece9-768.webp), url(systems/${systemId}/assets/wallpaper/tailpiece9-768.webp)`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom, top",
          backgroundSize: "19%",
          maskImage: `url(systems/${systemId}/assets/wallpaper/stonelike-mask.webp)`,
          maskRepeat: "repeat",
          maskSize: "contain",
          opacity: 0.7,
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
          transform: "scale(0.7)",
          fontWeight: "bold",
        },
        front_wrapper: {
          color: "transparent",
        },
        front: {
          padding: "0 1em",
          color: "#000",
          maskImage: `url(systems/${systemId}/assets/wallpaper/stonelike-mask.webp)`,
          maskRepeat: "repeat",
          maskSize: "contain",
          textShadow: "0.03em 0.03em 0px #fff, -0.03em -0.03em 0px #fff",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          color: "#000",
          maskImage: `url(systems/${systemId}/assets/wallpaper/stonelike-mask.webp)`,
          maskRepeat: "repeat",
          maskSize: "contain",
          textShadow: "0.03em 0.03em 0px #fff, -0.03em -0.03em 0px #fff",
        },
        rear_wrapper: {},
        rear: {
          padding: "0 1em",
          display: "none",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          display: "none",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(248, 248, 248)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(244, 244, 244)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(248, 248, 248)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(248, 248, 248)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(244, 244, 244)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(248, 171, 171)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(244, 193, 193)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(255, 127, 127, 0.60)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(255, 127, 127, 0.40)",
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
        background: "rgb(244, 244, 244)",
        "& option": {
          background: "rgb(248, 248, 248)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(248, 248, 248)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(248, 248, 248))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(248, 248, 248))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(248, 248, 248))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(248, 248, 248))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(248, 248, 248))",
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
          backgroundColor: "rgb(248, 248, 248)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #cfffc2",
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
          background: "#fff6",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#236",
          "&:hover": {
            textShadow: "0 0 0.3em #cfffc2",
          },
          ":not([data-wrapped]) > input:checked + &": {
            background: "#fff9",
            "&:hover": {
              textShadow: "none",
            },
          },
          "[data-wrapped] > &": {
            borderRadius: "0.2em",
          },
          "[data-wrapped] > input:checked + &": {
            background: "#fff9",
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
          backgroundColor: "#fff9",
          "[data-wrapped] + &": {},
        },
      },
    },
  },
});
