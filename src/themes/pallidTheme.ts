import { systemId } from "../constants";
import { tiltedPortrait, underlineTabs } from "./helpers";
import { defineThemeV2 } from "./theme";

const glow = "#7be9e9";
const starlight = "#cdf6ff";
// brushed steel, clipped to the logo's text
const steel = {
  background: `linear-gradient(135deg,
      #000 0%,
      #6c6c6c 24%,
      #949494 34%,
      #6a6a6a 44%,
      #000 87%,
      #8f8f8f 100%
    )`,
  backgroundClip: "text",
};

export const pallidTheme = defineThemeV2({
  schemaVersion: "v2",
  displayName: "Pallid Stars",
  layout: "full-frame",
  palette: {
    polarity: "dark",
    wallpaper: "#152938",
    // translucent, over the wallpaper...
    surface: "oklch(0.2086 0.0085 264 / 80%)",
    surfaceNested: "oklch(0.3 0.03 264 / 80.8%)",
    // ...and flattened over it, for things that overlap content
    surfaceSolid: "color-mix(in srgb, oklch(0.2086 0.0085 264) 80%, #152938)",
    surfaceNestedSolid:
      "color-mix(in srgb, oklch(0.3 0.03 264) 80.8%, #152938)",
    control: "rgba(255,255,255,0.1)",
    text: "oklch(0.95 0.02 212)",
    accent: "#aff2f2",
    onAccent: "#333",
    line: "oklch(0.6 0.03 264)",
    feedback: glow,
    danger: "red",
    warning: "#d68a00",
    success: "green",
    info: "#2b6cb0",
  },
  fonts: {
    baseSize: "16px",
    body: { family: "'Nova Square', sans-serif" },
    display: {
      family: "'Nova Square', sans-serif",
      caps: "small-caps",
      scale: 1.1,
    },
  },
  catalogue: {
    portrait: tiltedPortrait,
    sheetRoot: {
      base: {
        backgroundImage: `
          url(systems/${systemId}/assets/wallpaper/guille-pozzi-sbcIAn4Mn14-unsplash.webp)
        `,
        backgroundPosition: "center",
        backgroundSize: "cover",
        boxShadow: `
          0 0 10px oklch(from ${starlight} l c h / 50%)
        `,
        border: `1px inset ${starlight}`,
      },
      variants: {
        sheet: {
          character: {
            // a nebula behind the logo, fading out down the sheet
            "&:before": {
              backgroundImage: `
                url(systems/${systemId}/assets/wallpaper/philipp-trubchenko-jObj_p885Gg-unsplash.webp)
              `,
              backgroundSize: "cover",
              content: "''",
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              height: "300px",
              maskImage: "linear-gradient(#0007, transparent)",
              // it's over the sheet's content: clicks go through it
              pointerEvents: "none",
            },
          },
        },
      },
    },
    logo: {
      base: {
        // turned away into the distance
        text: {
          transform: "rotateY(16deg) translateX(4%)",
          fontWeight: "bold",
          caretColor: "white",
        },
        // steel, over a starlight halo
        front_wrapper: { color: "transparent" },
        front: steel,
        front_sub: steel,
        rear_wrapper: {
          textShadow: [
            `-3px -3px 5px ${starlight}`,
            `-3px 3px 5px ${starlight}`,
            `3px -3px 5px ${starlight}`,
            `3px 3px 5px ${starlight}`,
          ].join(", "),
        },
      },
    },
    card: {
      base: {
        root: {
          "&.investigator-card-array-card:hover": {
            boxShadow: `0 0 0.3em 0.2em ${glow}`,
          },
        },
      },
    },
    tabs: underlineTabs,
    region: {
      base: {
        borderRadius: "6px",
        border: `1px solid oklch(from ${starlight} l c h / 50%)`,
      },
    },
    panel: {
      base: {
        borderRadius: "6px",
        boxShadow: `0 0 10px ${starlight} inset`,
        border: `1px solid ${starlight}`,
      },
    },
  },
});
