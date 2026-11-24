import { systemId } from "../constants";
import { createStarburstGradient } from "./functions";
import { defineThemeV2 } from "./theme";

const colors = [
  // "#f4e83f", // this is a bright yellow, dropping it for now
  "#a06f18",
  "#b78d6c",
  "#cc7171",
  "#ebaa4b",
  "#e47005",
  "#ed9907",
];
const paper = `url(systems/${systemId}/assets/wallpaper/pulpy_paper.webp)`;
// a smaller starburst from the top left corner, fading out, behind the content
const cornerBurst = {
  position: "relative",
  isolation: "isolate",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
    pointerEvents: "none",
    backgroundImage: createStarburstGradient(colors, 10, "10%", "10%"),
    maskImage: "linear-gradient(#00000080, transparent)",
  },
} as const;

// the logo's rear copy: white under the front, so nothing shows through its
// edges, and the shadows. On each text, not their wrapper: an em in a
// text-shadow is the size of the element that declares it
const groovyShadow = {
  color: "#fff",
  textShadow: [
    "-0.01em -0.01em 0 #000",
    "0.01em 0.01em 0 #000",
    "0.1em 0.1em 0 #d22fe5",
    "0.11em 0.11em 0 #000",
    "0.2em 0.2em 0 #e5762f",
    "0.21em 0.21em 0 #000",
  ].join(", "),
};

export const deltaGroovyTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Delta Groovy",
  layout: "full-frame",
  palette: {
    polarity: "light",
    wallpaper: "#b6b3b3",
    // translucent, over the paper...
    surface: "#ffffff80",
    surfaceNested: "#ffffff33",
    // ...and flattened over the wallpaper, for things that overlap content
    surfaceSolid: "color-mix(in srgb, #fff 50%, #b6b3b3)",
    surfaceNestedSolid: "color-mix(in srgb, #fff 20%, #b6b3b3)",
    control: "rgba(0,0,0,0.1)",
    text: "#444",
    accent: "#801d8c",
    onAccent: "#fff",
    line: "#774",
    feedback: "#fff",
    danger: "red",
    warning: "#d68a00",
    success: "green",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "16px",
    body: { family: "'Averia Libre', sans-serif" },
    display: { family: "'Spicy Rice', serif", scale: 1.1 },
  },
  catalogue: {
    sheetRoot: {
      base: {
        backgroundImage: paper,
        backgroundPosition: "center",
        backgroundSize: "cover",
      },
      variants: {
        sheet: {
          // a character sheet's starburst is the logo's backdrop
          item: cornerBurst,
          freeform: cornerBurst,
        },
      },
    },
    logo: {
      base: {
        // a starburst that spills out over the top of the sheet, fading out
        backdrop: {
          backgroundColor: "#293417",
          backgroundImage: createStarburstGradient(colors, 5, "50%", "50%"),
          maskImage: "linear-gradient(#000, transparent)",
          margin: "-50em",
        },
        text: { transform: "translateY(-0.1em)" },
        // white, over a stack of outlined purple and orange drop shadows
        front_wrapper: { color: "#fff" },
        rear: groovyShadow,
        rear_sub: groovyShadow,
      },
    },
    card: {
      base: {
        root: {
          "&.investigator-card-array-card:hover": {
            boxShadow: "0 0 0.3em 0.2em #fff",
          },
        },
      },
    },
    tabs: {
      base: {
        // accent ink on every tab, the others on the nested surface, and a
        // glow on the text under the pointer
        tab: {
          color: "var(--inv-accent)",
          background: "var(--inv-surface-nested)",
          "&:hover": { textShadow: "0 0 0.3em #fff" },
        },
      },
      // the selected tab is the catalogue's, and neither it nor a disabled
      // one glows
      states: {
        selected: { tab: { "&:hover": { textShadow: "none" } } },
        disabled: { tab: { "&:hover": { textShadow: "none" } } },
      },
    },
  },
});
