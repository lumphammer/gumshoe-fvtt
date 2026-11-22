import type {
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import type { ThemeV1 } from "./types";

/**
 * Generate a basic tab style from a seed.
 *
 * This is exposed so that themes can use this and them apply their own
 * customisations.
 */
export function createBasicTabStyle(colors: ThemeSeedV1["colors"]): CSSObject {
  return {
    flex: 1,
    padding: "0.3em",
    display: "inline-block",
    textAlign: "center",
    fontSize: "1.2em",
    background: colors.backgroundSecondary,
    borderRadius: "0.2em 0.2em 0 0",
    color: colors.accent,
    ":hover": {
      textShadow: `0 0 0.3em ${colors.glow}`,
    },
  };
}

/**
 * Turn a ThemeSeed (bare basics for defining a theme) into a fully usable
 * theme
 */
export const themeFactory = (seed: ThemeSeedV1): ThemeV1 => {
  const controlBorder = seed.colors.controlBorder ?? seed.colors.text;

  const cardBase = {
    backdropStyle: {
      border: `1px solid ${controlBorder}`,
      padding: "0.5em",
      transformOrigin: "top",
      // opaque: the surface over the wallpaper
      background: `linear-gradient(${seed.colors.backgroundPrimary} 0 0), rgb(from ${seed.colors.wallpaper} r g b / 1)`,
    },
    supertitleStyle: { fontSize: "0.9em" },
    titleStyle: {},
    subtitleStyle: { fontWeight: "bold" },
    descriptionStyle: {},
    effectStyle: { fontStyle: "italic" },
    hoverStyle: {
      boxShadow: `0 0 0.3em 0.2em ${seed.colors.glow}`,
    },
    ...seed.cards?.base,
  };

  const tabContentStyle = seed.tabContentStyle || {
    backgroundColor: seed.colors.backgroundPrimary,
  };

  const final: ThemeV1 = {
    ...seed,
    largeSheetRootStyle: {
      backgroundSize: "cover",
      backgroundPosition: "center",
      ...seed.largeSheetRootStyle,
    },
    smallSheetRootStyle: seed.smallSheetRootStyle ?? seed.largeSheetRootStyle,
    tabActiveStyle: seed.tabActiveStyle || {
      background: seed.colors.backgroundPrimary,
      ":hover": {
        textShadow: "none",
      },
    },
    tabStyle: seed.tabStyle || createBasicTabStyle(seed.colors),
    tabSpacerStyle: seed.tabSpacerStyle ?? {
      width: "0.5em",
    },
    tabContentStyle,
    tabWrappedStyle: seed.tabWrappedStyle ?? {
      borderRadius: "0.2em",
    },
    // the same background as the content, as a selected tab in a row has
    tabWrappedActiveStyle: seed.tabWrappedActiveStyle ?? {
      background:
        tabContentStyle.background ??
        tabContentStyle.backgroundColor ??
        seed.colors.backgroundPrimary,
      ":hover": {
        textShadow: "none",
      },
    },
    tabContentWrappedStyle: seed.tabContentWrappedStyle ?? {},
    colors: {
      ...seed.colors,
      controlBorder,
      danger: seed.colors.danger ?? "red",
      warning: seed.colors.warning ?? "#d68a00",
      success: seed.colors.success ?? "green",
    },
    logo: seed.logo,
    cards: {
      base: cardBase,
      area: {
        horizontalSpacing: "0.5em",
        verticalSpacing: "0.5em",
        ...seed.cards?.area,
      },
      categories: {
        ...seed.cards?.categories,
      },
    },
  };

  return final;
};

export const createStarburstGradient = (
  colors: string[],
  numRepeats: number,
  xPos: string,
  yPos: string,
) => {
  const numColors = colors.length;
  const wedgeAngle = 360 / (numRepeats * numColors);
  const gradientParts = colors
    .map(
      (color, i) => `${color} ${wedgeAngle * i}deg ${wedgeAngle * (i + 1)}deg`,
    )
    .join(", ");
  const starburstGradient = `repeating-conic-gradient(from 0deg at ${xPos} ${yPos}, ${gradientParts})`;

  return starburstGradient;
};
