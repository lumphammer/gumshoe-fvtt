import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const pallidTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Aching Stars",
  palette: {
    polarity: "dark",
    wallpaper: "#152938",
    surface: "#16181c7f",
    surfaceNested: "#4249567f",
    control: "rgba(255,255,255,0.1)",
    text: "#ddd",
    accent: "#aff2f2",
    line: "#ddd",
    feedback: "#7be9e9",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #ddd 70%, rgb(21, 32, 42))",
    onAccent: "#333",
    bodyFont: "16px 'Roboto Flex', sans-serif",
    displayFont: "normal small-caps normal 1.1em 'Nova Square', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/guille-pozzi-sbcIAn4Mn14-unsplash.webp)`,
          },
          small: {
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/guille-pozzi-sbcIAn4Mn14-unsplash.webp)`,
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          perspective: "500px",
          perspectiveOrigin: "50% 50%",
          background: `url(systems/${systemId}/assets/wallpaper/philipp-trubchenko-jObj_p885Gg-unsplash.webp)`,
          backgroundSize: "cover",
          transform: "scaleY(1.1) scaleX(1.1) translateY(0%) rotate(0deg)",
          height: "400%",
          width: "150%",
          zIndex: -1,
          borderStyle: "none",
          maskImage: "linear-gradient(rgba(0, 0, 0, 1.0), transparent)",
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
          transform: "rotateY(21deg) rotateZ(0deg) translateX(4%) scale(0.8)",
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
          background:
            "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(108,108,108,1) 24%, rgba(148,148,148,1) 34%, rgba(106,106,106,1) 44%, rgba(0,0,0,1) 87%, rgba(143,143,143,1) 100%)",
          backgroundClip: "text",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          background:
            "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(108,108,108,1) 24%, rgba(148,148,148,1) 34%, rgba(106,106,106,1) 44%, rgba(0,0,0,1) 87%, rgba(143,143,143,1) 100%)",
          backgroundClip: "text",
        },
        measure: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          padding: "0 1em",
          background:
            "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(108,108,108,1) 24%, rgba(148,148,148,1) 34%, rgba(106,106,106,1) 44%, rgba(0,0,0,1) 87%, rgba(143,143,143,1) 100%)",
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
          textShadow:
            "        -3px -3px 5px #cdf6ff,\n        -3px 3px 5px #cdf6ff,\n        3px -3px 5px #cdf6ff,\n        3px 3px 5px #cdf6ff",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          textShadow:
            "        -3px -3px 5px #cdf6ff,\n        -3px 3px 5px #cdf6ff,\n        3px -3px 5px #cdf6ff,\n        3px 3px 5px #cdf6ff",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(21, 32, 42)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(43, 56, 70)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(21, 32, 42)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(21, 32, 42)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(43, 56, 70)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(79, 26, 35)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(90, 38, 49)",
          },
        },
        {
          header: false,
          odd: true,
          zero: true,
          css: {
            background: "rgba(138, 12, 14, 0.50)",
          },
        },
        {
          header: false,
          odd: false,
          zero: true,
          css: {
            background: "rgba(160, 36, 43, 0.50)",
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
        background: "rgb(43, 56, 70)",
        "& option": {
          background: "rgb(21, 32, 42)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(21, 32, 42)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(21, 32, 42))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(21, 32, 42))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(21, 32, 42))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(21, 32, 42))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(21, 32, 42))",
          },
        },
      },
    },
    card: {
      base: {
        root: {
          border: "1px solid #ddd",
          padding: "0.5em",
          transformOrigin: "top",
          backgroundColor: "rgb(21, 32, 42)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #7be9e9",
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
          background: "#4249567f",
          borderRadius: "0.2em 0.2em 0 0",
          color: "#aff2f2",
          "&:hover": {
            textShadow: "0 0 0.3em #7be9e9",
          },
          ":not([data-wrapped]) > input:checked + &": {
            background: "#16181c7f",
            "&:hover": {
              textShadow: "none",
            },
          },
          "[data-wrapped] > &": {
            borderRadius: "0.2em",
          },
          "[data-wrapped] > input:checked + &": {
            background: "#16181c7f",
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
          backgroundColor: "#16181c7f",
          "[data-wrapped] + &": {},
        },
      },
    },
  },
});
