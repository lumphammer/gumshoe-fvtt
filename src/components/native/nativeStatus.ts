import { cva } from "../../styled-system/css";

/**
 * Foundry's level colours are tuned for its dark UI. On a chat message's
 * light parchment they're too faint (success is about 2:1), so there they're
 * darkened, to 4:1 or better.
 */
const ink = (level: "error" | "warning" | "success" | "info") => ({
  color: `var(--color-level-${level})` as const,
  ".chat-message &": {
    color:
      `[color-mix(in srgb, var(--color-level-${level}) 60%, black)]` as const,
  },
});

/**
 * Status ink for the native world: our parts of Foundry's own UI (chat cards,
 * the combat tracker), which look like Foundry, not like a theme. Built on
 * Foundry's level colours, never the palette. See docs/theming.md.
 */
export const nativeStatus = cva({
  variants: {
    tone: {
      danger: ink("error"),
      warning: ink("warning"),
      success: ink("success"),
      info: ink("info"),
    },
  },
});
