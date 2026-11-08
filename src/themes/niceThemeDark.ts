import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const niceThemeDark = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Nice Dark Red Agents",
  palette: {
    polarity: "dark",
    wallpaper: "#4a0d00",
    surface: "#0007",
    surfaceNested: "#0004",
    control: "rgba(255,255,255,0.1)",
    text: "#ccc",
    accent: "#fff",
    line: "#ccc",
    feedback: "#f33",
    danger: "#ffff00",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #ccc 70%, rgb(39, 6, 0))",
    onAccent: "#600",
    bodyFont: "semi-condensed 500 16px 'Saira', sans-serif",
    displayFont: "condensed normal small-caps 600 1.2em 'Saira', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    appFrame: {
      base: {
        root: {
          boxShadow: "0 0 20px #f00",
          border: "1px solid red",
          borderRadius: "0.5em",
          overflow: "hidden",
        },
      },
    },
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/nice_red_agents.webp)`,
          },
          small: {
            backgroundImage: `linear-gradient( to right, #0002,#0002), url(systems/${systemId}/assets/wallpaper/nice_red_agents.webp)`,
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          backgroundColor: "rgba(0,0,0,0.4)",
          transform: "scaleY(0.9) scaleX(1.2) translateY(0.1em)",
          zIndex: -1,
        },
        text: {
          font: "condensed normal small-caps 400 1.2em 'Saira', serif",
          textTransform: "var(--inv-display-case)",
          fontSize: "1em",
          whiteSpace: "nowrap",
          caretColor: "black",
          border: "none",
          padding: "0",
          lineHeight: "1",
        },
        front_wrapper: {
          color: "transparent",
        },
        front: {
          padding: "0 1em",
          background: "linear-gradient(135deg, #fff 0%, #fff 90%)",
          backgroundClip: "text",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          background: "linear-gradient(135deg, #fff 0%, #fff 90%)",
          backgroundClip: "text",
        },
        rear_wrapper: {},
        rear: {
          padding: "0 1em",
          textShadow: "2px 0px 1px black, -1px 0px 0px rgba(255,255,255,0.5)",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          textShadow: "2px 0px 1px black, -1px 0px 0px rgba(255,255,255,0.5)",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(39, 6, 0)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(54, 9, 0)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(39, 6, 0)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(39, 6, 0)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(54, 9, 0)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(98, 66, 0)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(88, 43, 0)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(127, 127, 0, 0.47)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(127, 127, 0, 0.27)",
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
        background: "rgb(54, 9, 0)",
        "& option": {
          background: "rgb(39, 6, 0)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(39, 6, 0)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(39, 6, 0))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(39, 6, 0))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(39, 6, 0))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(39, 6, 0))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(39, 6, 0))",
          },
        },
      },
    },
    card: {
      base: {
        root: {
          border: "1px solid #ccc",
          padding: "0.5em",
          transformOrigin: "top",
          backgroundColor: "rgb(39, 6, 0)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #f33",
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
          background: "#0004",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#fff",
          "&:hover": {
            textShadow: "0 0 0.3em #f33",
          },
          ":not([data-wrapped]) > input:checked + &": {
            background: "#0007",
            "&:hover": {
              textShadow: "none",
            },
          },
          "[data-wrapped] > &": {
            borderRadius: "0.2em",
          },
          "[data-wrapped] > input:checked + &": {
            background: "#0007",
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
          backgroundColor: "#0007",
          "[data-wrapped] + &": {},
        },
      },
    },
  },
});
