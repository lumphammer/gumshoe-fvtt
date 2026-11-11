import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

// const gradient =
//   "linear-gradient(90deg, oklch(49.2% 0.110 46) 0%, oklch(88.9% 0.105 83) 18%, oklch(87.3% 0.105 81) 21%, oklch(66.5% 0.115 59) 41%, oklch(68.1% 0.108 61) 43%, oklch(91.2% 0.054 84) 56%, oklch(98.1% 0.018 90) 65%, oklch(96.3% 0.026 85) 67%, oklch(68.8% 0.137 63) 83%, oklch(46.6% 0.113 44) 100%)";

// const gold06 = `
//     linear-gradient(90deg,
//     oklch(74.3% 0.086 82) 0%,
//     oklch(91.2% 0.107 98) 8%,
//     oklch(93.3% 0.112 100) 10%,
//     oklch(73.2% 0.109 85) 20%,
//     oklch(74.7% 0.109 85) 22%,
//     oklch(85.4% 0.113 95) 29%,
//     oklch(66.9% 0.120 79) 43%,
//     oklch(90.4% 0.066 99) 61%,
//     oklch(99.0% 0.015 101) 69%,
//     oklch(96.8% 0.014 84) 71%,
//     oklch(60.5% 0.107 72) 84%,
//     oklch(61.1% 0.112 74) 86%,
//     oklch(74.5% 0.135 88) 96%,
//     oklch(75.8% 0.145 90) 100%)
//   `;

const copper02 = `
  linear-gradient(90deg,
  oklch(56.4% 0.105 67) 0%,
  oklch(56.4% 0.101 65) 4%,
  oklch(74.3% 0.073 68) 20%,
  oklch(88.0% 0.039 99) 38%,
  oklch(98.1% 0.025 99) 54%,
  oklch(90.1% 0.028 90) 59%,
  oklch(46.2% 0.062 61) 81%,
  oklch(54.6% 0.071 71) 100%)
  `;

const gradient = copper02;

const textShadow = [
  "0px -1px 0px rgba(255,255,255,0.5)", // white glint
  "0px -2px 4px rgba(0,0,0,0.5)", // shadow up
  "0px 2px 8px rgba(0,0,0,0)", // shadow down
  "0px 2px 1px rgba(0,0,0,0)", // dark line down
].join(",");
// "linear-gradient(135deg, #efb183 0%,#222 30%,#efb183 90%)"

export const cthulhuByCandlelightTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Cthulhu by Candlelight",
  layout: "full-frame",
  palette: {
    polarity: "dark",
    wallpaper: "#222",
    // surface: "oklch(0.25 0.005 195deg / 100%)",
    surface: "oklch(from var(--accent) 0.25 0.005 h / 100%)",
    surfaceNested: "oklch(from var(--accent) 0.3 0.005 h / 100%)",
    control: "oklch(from var(--accent) 0.35 0.005 h / 100%)",
    text: "oklch(from var(--accent) 0.8 0.005 h / 100%)",
    accent: "var(--accent)",
    line: "oklch(from var(--accent) 0.4 0.005 h / 100%)",
    feedback: "#5effff",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    textMuted: "color-mix(in srgb, #433 70%, rgb(238, 238, 238))",
    onAccent: "black",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal small-caps normal 1em 'Federo', serif",
    cardGap: "0.5em 0.5em",
  },
  catalogue: {
    appFrame: {
      base: {
        root: {
          "--accent": "oklch(0.7 0.06 195)",
        },
      },
    },
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "normal",
            backgroundImage: [
              // `linear-gradient(to top, #0000 0%, #0000 70%, #000f 100%)`,
              "linear-gradient(oklch(from var(--accent) 0.05 0.1 h / 50%))",
              `url(systems/${systemId}/assets/wallpaper/annie-spratt-osuiatBDTww-unsplash.webp)`,
            ].join(","),
          },
          small: {
            backgroundImage: `url(systems/${systemId}/assets/wallpaper/marjanblan-5Ft4NWTmeJE-unsplash.webp)`,
          },
        },
      },
    },
    logo: {
      base: {
        root: {
          containerType: "inline-size",
        },
        backdrop: {
          // backgroundImage:
          //   "radial-gradient(closest-side, #000a 0%, #0000 100%)",
        },
        text: {
          font: "var(--inv-display-font)",
          textTransform: "var(--inv-display-case)",
          fontSize: "0.7em",
          caretColor: "black",

          "--line-height": "1",
          // padding: "0",
          // letterSpacing: "0.1em",
          // the text's width: the logo's, less the full-frame inset each side
          "--w": "calc(100cqw - 2 * var(--inv-logo-inset, 0px))",
          "--a": "-45deg", // the turn: negative brings the right end towards you
          "--n": "1", // how far away the viewer is, in text widths (smaller = stronger)
          // transform: `
          //   translateX(calc(var(--w) * sin(var(--a)) / (8 * var(--n))))
          //   scale(calc((1 - pow(sin(var(--a)) / (2 * var(--n)), 2)) / cos(var(--a))))
          //   perspective(calc(var(--n) * var(--w)))
          //   rotateY(var(--a))`,

          transform: "rotateY(0deg)",
          // transform:
          //   "rotateY(-45deg) rotateZ(-1deg) translateX(-0%) scaleX(120%)",
        },

        front_wrapper: {
          color: "transparent",
          lineHeight: "var(--line-height)",
          // textShadow: "-1px -1px 1px white",
        },
        front: {
          background: gradient,
          backgroundClip: "text",
        },
        front_sub: {
          fontSize: "0.5em",
          background: gradient,
          backgroundClip: "text",
        },
        rear_wrapper: {
          lineHeight: "var(--line-height)",
        },
        rear: {
          textShadow,
        },
        rear_sub: {
          fontSize: "0.5em",
          textShadow,
        },
      },
    },
    panel: {
      base: {
        //
        padding: "0.5em",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "var(--inv-line)",
        // borderRadius: "5px",
      },
      variants: {
        depth: {
          top: {
            //
            background: "oklch(from var(--accent) 0.15 0.005 h / 70%)",
          },
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
  },
});
