import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

export const tealTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Teal of Cthulhu",
  palette: {
    polarity: "light",
    wallpaper: "#ddd",
    surface: "rgba(255,255,255,0.5)",
    surfaceNested: "rgba(255,255,255,0.2)",
    control: "rgba(0,0,0,0.1)",
    text: "#433",
    accent: "#1d5d5d",
    line: "#766",
    feedback: "#5effff",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #433 70%, rgb(238, 238, 238))",
    onAccent: "white",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal small-caps normal 1em 'Federo', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/marjanblan-5Ft4NWTmeJE-unsplash.webp)`,
          },
          small: {
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/marjanblan-5Ft4NWTmeJE-unsplash.webp)`,
          },
        },
      },
    },
    logo: {
      base: {
        backdrop: {
          perspective: "500px",
          perspectiveOrigin: "50% 50%",
          backgroundImage:
            "radial-gradient(closest-side, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
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
          transform: "rotateY(-30deg) rotateZ(-1deg) translateX(-5%)",
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
            "linear-gradient(135deg, #efb183 0%,#222 30%,#efb183 90%)",
          backgroundClip: "text",
        },
        front_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          background:
            "linear-gradient(135deg, #efb183 0%,#222 30%,#efb183 90%)",
          backgroundClip: "text",
        },
        measure: {
          transition: "font-size var(--logo-fit-duration, 0s)",
          padding: "0 1em",
          background:
            "linear-gradient(135deg, #efb183 0%,#222 30%,#efb183 90%)",
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
            "2px 0px 1px black, 6px 0px 4px rgba(0,0,0,0.5), -1px 0px 0px rgba(255,255,255,0.5)",
        },
        rear_sub: {
          fontSize: "0.5em",
          padding: "0 1em",
          minHeight: "1em",
          textShadow:
            "2px 0px 1px black, 6px 0px 4px rgba(0,0,0,0.5), -1px 0px 0px rgba(255,255,255,0.5)",
        },
      },
    },
    surface: {
      compoundVariants: [
        {
          depth: "top",
          solid: true,
          css: {
            backgroundColor: "rgb(238, 238, 238)",
          },
        },
        {
          depth: "nested",
          solid: true,
          css: {
            backgroundColor: "rgb(227, 227, 227)",
          },
        },
      ],
    },
    floating: {
      base: {
        background: "rgb(238, 238, 238)",
      },
    },
    partyCell: {
      compoundVariants: [
        {
          header: true,
          odd: true,
          zero: false,
          css: {
            background: "rgb(238, 238, 238)",
          },
        },
        {
          header: true,
          odd: false,
          zero: false,
          css: {
            background: "rgb(227, 227, 227)",
          },
        },
        {
          header: true,
          odd: true,
          zero: true,
          css: {
            background: "rgb(238, 174, 174)",
          },
        },
        {
          header: true,
          odd: false,
          zero: true,
          css: {
            background: "rgb(227, 202, 202)",
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
        background: "rgb(227, 227, 227)",
        "& option": {
          background: "rgb(238, 238, 238)",
          color: "var(--inv-text)",
        },
      },
    },
    dragHandle: {
      base: {
        cursor: "n-resize",
        borderRadius: "0.35em",
        color: "var(--inv-text-muted)",
        background: "rgb(238, 238, 238)",
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
              "color-mix(in srgb, var(--inv-line) 30%, rgb(238, 238, 238))",
          },
          danger: {
            background:
              "color-mix(in srgb, var(--inv-danger) 30%, rgb(238, 238, 238))",
          },
          warning: {
            background:
              "color-mix(in srgb, var(--inv-warning) 30%, rgb(238, 238, 238))",
          },
          success: {
            background:
              "color-mix(in srgb, var(--inv-success) 30%, rgb(238, 238, 238))",
          },
          info: {
            background:
              "color-mix(in srgb, var(--inv-info) 30%, rgb(238, 238, 238))",
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
          backgroundColor: "rgb(238, 238, 238)",
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #5effff",
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
          color: "#1d5d5d",
          "&:hover": {
            textShadow: "0 0 0.3em #5effff",
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
