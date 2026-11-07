// Panda CSS (https://panda-css.com): the static styles for the theming system.
// See docs/theming.md.
import { defineConfig } from "@pandacss/dev";

import { appFrame } from "./src/themes/catalogue/appFrame";
import { badge } from "./src/themes/catalogue/badge";
import { button } from "./src/themes/catalogue/button";
import { callout } from "./src/themes/catalogue/callout";
import { card } from "./src/themes/catalogue/card";
import { checkbox } from "./src/themes/catalogue/checkbox";
import { input, richText } from "./src/themes/catalogue/input";
import {
  dragHandle,
  emptyState,
  row,
  sectionHeading,
  tableHeader,
} from "./src/themes/catalogue/lists";
import { logo } from "./src/themes/catalogue/logo";
import { panel } from "./src/themes/catalogue/panel";
import { select } from "./src/themes/catalogue/select";
import { sheetRoot } from "./src/themes/catalogue/sheetRoot";
import { floating, partyCell, surface } from "./src/themes/catalogue/surfaces";
import { tabs } from "./src/themes/catalogue/tabs";
import { displayText, mutedText, outcome } from "./src/themes/catalogue/text";
import { toggle } from "./src/themes/catalogue/toggle";
import { type Palette, paletteVar } from "./src/themes/palette";

type PaletteKey = Exclude<keyof Palette, "polarity">;

const v = (key: PaletteKey) => ({ value: `var(${paletteVar(key)})` });

const colorKeys = [
  "wallpaper",
  "surface",
  "surfaceNested",
  "surfaceSolid",
  "surfaceNestedSolid",
  "surfaceDanger",
  "surfaceNestedDanger",
  "surfaceDangerSolid",
  "surfaceNestedDangerSolid",
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
  // only our tokens: an arbitrary colour needs an explicit escape hatch (but
  // see layout-is-not-tokens below)
  strictTokens: true,
  plugins: [
    {
      // Spacing and sizes aren't tokens (docs/theming.md): they're layout,
      // so layout properties take any value, even with strictTokens
      name: "layout-is-not-tokens",
      hooks: {
        "config:resolved": ({ config }) => {
          const layout = new Set(["spacing", "sizes"]);
          for (const utility of Object.values(config.utilities ?? {})) {
            const values = utility?.values;
            // a category, or a function of the theme's categories
            const asks = new Set<string>();
            if (typeof values === "string") asks.add(values);
            if (typeof values === "function") {
              values((category: string) => {
                asks.add(category);
                return {};
              });
            }
            if (utility && [...asks].some((category) => layout.has(category))) {
              delete utility.values;
            }
          }
        },
      },
    },
  ],
  include: ["./src/**/*.{ts,tsx}"],
  exclude: ["./src/styled-system/**"],
  outdir: "src/styled-system",
  // our tokens point at the palette's --inv-* properties, which only exist on
  // a themed root (set by CSSReset), so Panda's own properties must be
  // declared there too: declared on :root, they would resolve to nothing
  // (and on the window around it, which has the palette too: appFrame.ts)
  cssVarRoot: "[data-inv-theme], [data-inv-frame]",
  // all inside Foundry's `system` layer: see src/panda.css
  layers: {
    reset: "system.reset",
    base: "system.base",
    tokens: "system.tokens",
    recipes: "system.recipes",
    utilities: "system.utilities",
  },
  // every variant of every catalogue class, whether or not a call site
  // spells it out: themes override them by name
  staticCss: { recipes: "*", slotRecipes: "*" },
  theme: {
    recipes: {
      badge,
      button,
      callout,
      displayText,
      dragHandle,
      emptyState,
      floating,
      input,
      mutedText,
      outcome,
      panel,
      partyCell,
      richText,
      row,
      sectionHeading,
      select,
      sheetRoot,
      surface,
      tableHeader,
    },
    slotRecipes: { appFrame, card, checkbox, logo, tabs, toggle },
    // names are global, so they're prefixed: Foundry has keyframes too
    keyframes: {
      invSpin: { to: { rotate: "1turn" } },
      invExpandFadeIn: {
        from: { opacity: 0, transform: "scale(0.5)" },
        to: { opacity: 1, transform: "scale(1)" },
      },
      invThrob: {
        "0%": { backgroundColor: "transparent" },
        "100%": {
          backgroundColor:
            "oklch(from var(--button-hover-background-color) l c h / 0.5)",
        },
      },
      invScrollBg: {
        "0%": { backgroundPositionX: "0em" },
        "100%": { backgroundPositionX: "3em" },
      },
    },
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
