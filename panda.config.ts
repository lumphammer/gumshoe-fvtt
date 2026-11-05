// SPIKE (#1532): throwaway Panda CSS config.
import { defineConfig, defineRecipe, defineSlotRecipe } from "@pandacss/dev";

const v = (name: string) => ({ value: `var(--inv-${name})` });

const badge = defineRecipe({
  className: "inv-badge",
  description: "A small label: a state, a tag, an unlock.",
  base: {
    display: "inline-block",
    fontSize: "0.9em",
    lineHeight: "1",
    borderRadius: "0.5em",
    padding: "0.1em 0.5em",
    whiteSpace: "nowrap",
  },
  variants: {
    tone: {
      outline: {
        background: "accentContrast",
        color: "accent",
        outline: "1px solid {colors.accent}",
      },
      solid: { background: "accent", color: "accentContrast" },
      danger: { background: "danger", color: "accentContrast" },
    },
  },
  defaultVariants: { tone: "outline" },
});

const card = defineSlotRecipe({
  className: "inv-card",
  description: "A card in the Cards tab, or on its own sheet.",
  slots: ["root", "supertitle", "title", "subtitle", "description", "effect"],
  base: {
    root: {
      border: "1px solid {colors.controlBorder}",
      padding: "0.5em",
      transformOrigin: "top",
      backgroundColor: "bgOpaquePrimary",
    },
    supertitle: { fontSize: "0.9em" },
    title: {},
    subtitle: { fontWeight: "bold" },
    description: {},
    effect: { fontStyle: "italic" },
  },
});

export default defineConfig({
  // base conditions (_hover...) and utilities, but not preset-panda: its
  // palette and scales would offer colours that aren't ours
  presets: ["@pandacss/preset-base"],
  preflight: false,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "src/styled-system",
  // our tokens point at --inv-* variables, which only exist on a themed
  // root, so Panda's variables must be declared there too: declared on
  // :root, `var(--inv-accent)` would be invalid, and inherited as invalid.
  cssVarRoot: "[data-inv-theme]",
  // everything nests inside Foundry's `system` layer
  layers: {
    reset: "system.reset",
    base: "system.base",
    tokens: "system.tokens",
    recipes: "system.recipes",
    utilities: "system.utilities",
  },
  theme: {
    tokens: {
      colors: {
        accent: v("accent"),
        accentContrast: v("accent-contrast"),
        glow: v("glow"),
        text: v("text"),
        wallpaper: v("wallpaper"),
        bgPrimary: v("bg-primary"),
        bgSecondary: v("bg-secondary"),
        bgOpaquePrimary: v("bg-opaque-primary"),
        bgOpaqueSecondary: v("bg-opaque-secondary"),
        bgButton: v("bg-button"),
        controlBorder: v("control-border"),
        danger: v("danger"),
        warning: v("warning"),
        success: v("success"),
      },
      fonts: {
        body: v("body-font"),
        display: v("display-font"),
      },
    },
    recipes: { badge },
    slotRecipes: { card },
  },
  // CSSReset's element defaults, as plain static CSS under any themed root
  globalCss: {
    "[data-inv-theme]": {
      "& *": {
        scrollbarWidth: "thin",
        userSelect: "auto",
        boxSizing: "border-box",
        scrollbarColor: "{colors.accent} {colors.bgButton}",
      },
      "& :is(h1, h2, h3, h4)": {
        border: "none",
        margin: "0.3em 0 0 0",
        marginBottom: "0.3em",
        padding: 0,
        fontWeight: "inherit",
        font: "{fonts.display}",
        textTransform: "var(--inv-display-transform)",
      },
      "& h1": { fontSize: "1.5em" },
      "& h2": { fontSize: "1.3em" },
      "& h3": { fontSize: "1.1em" },
      "& h4": { fontSize: "1em" },
      "& :is(button, input[type=button])": {
        font: "{fonts.display}",
        textTransform: "var(--inv-display-transform)",
        color: "accent",
        borderRadius: "5px",
        width: "99%",
        "&[disabled]": {
          opacity: 0.5,
          color: "text",
          _hover: { boxShadow: "none", textShadow: "none" },
        },
        _hover: {
          boxShadow: "0 0 0.5em {colors.glow}",
          textShadow: "0 0 0.5em {colors.glow}",
        },
        _focus: { boxShadow: "none" },
      },
      "& label": { fontWeight: "bold" },
      "& :is(a, label.parp)": { color: "accent" },
      "& :is(a:hover, a.hover, .hover a, label.parp:hover, label.parp.hover, .hover label.parp)":
        {
          textDecoration: "underline",
          textShadow: "0 0 0.5em {colors.glow}",
        },
    },
  },
});
