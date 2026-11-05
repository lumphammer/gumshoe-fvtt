// Panda CSS (https://panda-css.com): the static styles for the theming system.
// See docs/theming.md.
import { defineConfig } from "@pandacss/dev";

import { type Palette, paletteVar } from "./src/themes/palette";

type PaletteKey = Exclude<keyof Palette, "polarity">;

const v = (key: PaletteKey) => ({ value: `var(${paletteVar(key)})` });

const colorKeys = [
  "wallpaper",
  "surface",
  "surfaceNested",
  "surfaceSolid",
  "surfaceNestedSolid",
  "control",
  "text",
  "textMuted",
  "link",
  "accent",
  "onAccent",
  "feedback",
  "line",
  "danger",
  "onDanger",
  "warning",
  "onWarning",
  "success",
  "onSuccess",
  "info",
  "onInfo",
] as const satisfies readonly PaletteKey[];

export default defineConfig({
  // conditions (_hover, _selected...) and utilities, but not preset-panda:
  // its palette and scales would offer colours and sizes that aren't ours
  presets: ["@pandacss/preset-base"],
  preflight: false,
  // only our tokens: an arbitrary colour needs an explicit escape hatch
  strictTokens: true,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: ["./src/styled-system/**"],
  outdir: "src/styled-system",
  // our tokens point at the palette's --inv-* properties, which only exist on
  // a themed root (set by CSSReset), so Panda's own properties must be
  // declared there too: declared on :root, they would resolve to nothing
  cssVarRoot: "[data-inv-theme]",
  // all inside Foundry's `system` layer: see src/panda.css
  layers: {
    reset: "system.reset",
    base: "system.base",
    tokens: "system.tokens",
    recipes: "system.recipes",
    utilities: "system.utilities",
  },
  theme: {
    tokens: {
      colors: Object.fromEntries(colorKeys.map((key) => [key, v(key)])),
      radii: { standard: v("radius") },
      shadows: { elevation: v("elevation") },
    },
    textStyles: {
      display: {
        value: {
          font: `var(${paletteVar("displayFont")})`,
          textTransform: `var(${paletteVar("displayCase")})`,
          letterSpacing: `var(${paletteVar("displayLetterSpacing")})`,
        },
      },
      body: {
        value: { font: `var(${paletteVar("bodyFont")})` },
      },
    },
  },
});
