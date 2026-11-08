import { defineThemeV2 } from "./theme";

export const highContrastTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "High Contrast",
  palette: {
    polarity: "light",
    wallpaper: "#666",
    surface: "#ffffffe5",
    surfaceNested: "#ffffffb2",
    control: "#00000019",
    text: "#000",
    accent: "#005",
    line: "#000",
    feedback: "#bbf",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #000 70%, rgb(239, 239, 239))",
    onAccent: "white",
    bodyFont: "1.1em sans-serif",
    displayFont: "1.1em sans-serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
          },
          small: {},
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          background: "white",
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
          transform: "none",
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
          color: "#000",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          color: "#000",
        },
        measure: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          padding: "0 1em",
          color: "#000",
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
            backgroundColor: "rgb(239, 239, 239)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(208, 208, 208)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(239, 239, 239)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(239, 239, 239)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(208, 208, 208)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(239, 124, 124)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(209, 119, 119)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(255, 127, 127, 0.90)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(255, 127, 127, 0.70)",
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
        background: "rgb(208, 208, 208)",
        "& option": {
          background: "rgb(239, 239, 239)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(239, 239, 239)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(239, 239, 239))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(239, 239, 239))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(239, 239, 239))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(239, 239, 239))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(239, 239, 239))",
          },
        },
      },
    },
    card: {
      base: {
        root: {
          border: "1px solid #000",
          padding: "0.5em",
          transformOrigin: "top",
          backgroundColor: "rgb(239, 239, 239)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #bbf",
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
          background: "#ffffffb2",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#005",
          "&:hover": {
            textShadow: "0 0 0.3em #bbf",
          },
          ":not([data-wrapped]) > input:checked + &": {
            background: "#ffffffe5",
            "&:hover": {
              textShadow: "none",
            },
          },
          "[data-wrapped] > &": {
            borderRadius: "0.2em",
          },
          "[data-wrapped] > input:checked + &": {
            background: "#ffffffe5",
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
          backgroundColor: "#ffffffe5",
          "[data-wrapped] + &": {},
        },
      },
    },
  },
});
