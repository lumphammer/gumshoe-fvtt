import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const greenTriangleTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Green triangle",
  palette: {
    polarity: "light",
    wallpaper: "#b6b3b3",
    surface: "#fff9",
    surfaceNested: "#fff6",
    control: "rgba(0,0,0,0.1)",
    text: "#000",
    accent: "#150",
    line: "#766",
    feedback: "#cfffc2",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #000 70%, rgb(225, 224, 224))",
    onAccent: "#fff",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal normal normal 1em 'Protest Guerrilla', serif",
    displayCase: "uppercase",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/annie-spratt-xTaOPMa6wAE-unsplash.webp)`,
          },
          small: {
            backgroundImage: `linear-gradient( to right, #fff9,#fff9), url(systems/${systemId}/assets/wallpaper/annie-spratt-xTaOPMa6wAE-unsplash.webp)`,
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {},
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
          transform: "scale(1.0, 0.8) rotate(-1.5deg)",
          maskImage: `url(systems/${systemId}/assets/wallpaper/textured-mask.webp)`,
          maskSize: "10em 0.2em",
          maskOrigin: "border-box",
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
          color: "#fff",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          color: "#fff",
        },
        measure: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          padding: "0 1em",
          color: "#fff",
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
          textShadow: "0 0 0.2em #cfffc2",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          textShadow: "0 0 0.2em #cfffc2",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(225, 224, 224)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(211, 209, 209)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(225, 224, 224)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(225, 224, 224)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(211, 209, 209)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(225, 147, 147)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(211, 158, 158)",
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
        background: "rgb(211, 209, 209)",
        "& option": {
          background: "rgb(225, 224, 224)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(225, 224, 224)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(225, 224, 224))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(225, 224, 224))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(225, 224, 224))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(225, 224, 224))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(225, 224, 224))",
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
          backgroundColor: "rgb(225, 224, 224)",
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
          color: "#150",
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
