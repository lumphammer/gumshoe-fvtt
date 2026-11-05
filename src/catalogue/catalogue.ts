// SPIKE (#1532): throwaway. The badge and card from the catalogue, in StyleX.
// StyleX's own class names are hashed atomic classes, so each part also gets
// a stable marker class (`inv-badge`, `inv-card__title`), for themes to
// target.
import * as stylex from "@stylexjs/stylex";

import { colors } from "../themes/spike/tokens.stylex";

const badgeStyles = stylex.create({
  base: {
    display: "inline-block",
    fontSize: "0.9em",
    lineHeight: "1",
    borderRadius: "0.5em",
    padding: "0.1em 0.5em",
    whiteSpace: "nowrap",
  },
  outline: {
    backgroundColor: colors.accentContrast,
    color: colors.accent,
    outline: `1px solid ${colors.accent}`,
  },
  solid: { backgroundColor: colors.accent, color: colors.accentContrast },
  danger: { backgroundColor: colors.danger, color: colors.accentContrast },
});

export type BadgeTone = "outline" | "solid" | "danger";

/** Props for a badge: spread them onto the element. */
export function badge(
  tone: BadgeTone = "outline",
  ...extra: stylex.StyleXStyles[]
) {
  const props = stylex.props(badgeStyles.base, badgeStyles[tone], ...extra);
  return {
    ...props,
    className: `inv-badge inv-badge--tone_${tone} ${props.className ?? ""}`,
  };
}

const cardStyles = stylex.create({
  root: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.controlBorder,
    padding: "0.5em",
    transformOrigin: "top",
    backgroundColor: colors.bgOpaquePrimary,
  },
  supertitle: { fontSize: "0.9em" },
  title: {},
  subtitle: { fontWeight: "bold" },
  description: {},
  effect: { fontStyle: "italic" },
});

export type CardSlot = keyof typeof cardStyles;

/** Props for one part of a card. */
export function card(slot: CardSlot, ...extra: stylex.StyleXStyles[]) {
  const props = stylex.props(cardStyles[slot], ...extra);
  return {
    ...props,
    className: `inv-card__${slot} ${props.className ?? ""}`,
  };
}
