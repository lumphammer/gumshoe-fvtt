import { css } from "../../../styled-system/css";

export const nativeMenuContentStyles = css({
  // from .themed.theme-dark#context-menu
  "&.theme-dark": {
    "--background-color": "var(--color-cool-5)",
    "--border-color": "var(--color-cool-3)",
    "--text-color": "var(--color-text-secondary)",
    "--hover-text-color": "var(--color-text-emphatic)",
    "--group-separator": "var(--color-cool-4)",
    "--hover-entry-border": "var(--color-cool-4)",
    "--hover-entry-background": "var(--color-dark-1)",
  },
  // light
  "&.theme-light": {
    "--background-color": "#d9d8c8",
    "--border-color": "#999",
    "--text-color": "var(--color-text-secondary)",
    "--hover-text-color": "var(--color-text-emphatic)",
    "--group-separator": "#999",
    "--hover-entry-border": "#999",
    "--hover-entry-background": "#f0f0e0",
  },
  // from #context-menu
  height: "max-content",
  minWidth: "150px",
  maxWidth: "360px",
  background: "var(--background-color)",
  border: "1px solid var(--border-color)",
  borderRadius: "[5px]",
  color: "var(--text-color)",
  width: "100%",
  zIndex: "calc(var(--z-index-app) + 1)",
  boxShadow: "[0 3px 6px rgba(0, 0, 0, 0.45)]",
  display: "grid",
  gridTemplateColumns: "max-content 1fr",
  transformOrigin: `var(--radix-context-menu-content-transform-origin,
      var(--radix-dropdown-menu-content-transform-origin))`,
  // invExpandFadeIn is in panda.config.ts
  animationName: "invExpandFadeIn",
  animationDuration: "100ms",
  animationTimingFunction: "ease-out",
});
