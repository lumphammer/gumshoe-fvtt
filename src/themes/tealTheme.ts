import { systemId } from "../constants";
import { defineThemeV2 } from "./theme";

const wallpaper = `url(systems/${systemId}/assets/wallpaper/marjanblan-5Ft4NWTmeJE-unsplash.webp)`;
const logoGradient = "linear-gradient(135deg, #efb183 0%,#222 30%,#efb183 90%)";
const logoShadow =
  "2px 0px 1px black, 6px 0px 4px rgba(0,0,0,0.5), -1px 0px 0px rgba(255,255,255,0.5)";

export const tealTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Teal of Cthulhu",
  layout: "full-frame",
  palette: {
    polarity: "light",
    wallpaper: "#ddd",
    // translucent, over the wallpaper...
    surface: "rgba(255,255,255,0.5)",
    surfaceNested: "rgba(255,255,255,0.2)",
    // ...so things that overlap content get them flattened over it
    surfaceSolid: "rgb(238, 238, 238)",
    surfaceNestedSolid: "rgb(227, 227, 227)",
    control: "rgba(0,0,0,0.1)",
    text: "#433",
    accent: "#1d5d5d",
    line: "#aaa",
    feedback: "#5effff",
    danger: "#ff0000",
    warning: "#d68a00",
    success: "#008000",
    info: "#2b6cb0",
    bodyFont: "16px 'Averia Libre', sans-serif",
    displayFont: "normal small-caps normal 1em 'Federo', serif",
  },
  catalogue: {
    sheetRoot: {
      variants: {
        size: {
          large: {
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: wallpaper,
          },
          small: { backgroundImage: wallpaper },
        },
      },
    },
    logo: {
      base: {
        // the container --w is measured in (cqw), and no perspective of its
        // own: the text's transform has it
        root: { containerType: "inline-size", perspective: "none" },
        backdrop: {
          backgroundImage:
            "radial-gradient(closest-side, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
        },
        text: {
          fontSize: "0.7em",
          caretColor: "black",
          lineHeight: "0.9",
          "--w": "calc(100cqw - 2 * var(--inv-logo-inset, 0px))",
          "--a": "-25deg", // the turn: negative brings the right end towards you
          "--n": "1.5", // how far away the viewer is, in text widths (smaller = stronger)
          transform: `
            translateX(calc(var(--w) * sin(var(--a)) / (4 * var(--n))))
            scale(calc((1 - pow(sin(var(--a)) / (2 * var(--n)), 2)) / cos(var(--a))))
            perspective(calc(var(--n) * var(--w)))
            rotateY(var(--a))`,
        },
        // the front copy's text is a gradient, clipped to the letters, across
        // the name and the subtext
        front_wrapper: {
          color: "transparent",
          background: logoGradient,
          backgroundClip: "text",
        },
        rear_wrapper: { textShadow: logoShadow },
        // no room around the text
        front: { padding: "0" },
        rear: { padding: "0" },
        front_sub: { padding: "0", minHeight: "auto" },
        rear_sub: { padding: "0", minHeight: "auto" },
      },
    },
    tabs: {
      base: {
        // accent ink on every tab, the others on the nested surface, and a
        // glow on the text under the pointer
        tab: {
          color: "var(--inv-accent)",
          background: "var(--inv-surface-nested)",
          "&:hover": { textShadow: "0 0 0.3em var(--inv-feedback)" },
          "&[data-selected]": {
            background: "var(--inv-surface)",
            "&:hover": { textShadow: "none" },
          },
          "input:disabled + &:hover": { textShadow: "none" },
        },
      },
    },
    panel: {
      base: {
        borderColor: "var(--inv-line)",
        borderWidth: "1px",
        borderStyle: "solid",
        padding: "0.25em",
      },
    },
  },
});
