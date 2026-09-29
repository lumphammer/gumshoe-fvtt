import type {
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import { irid } from "../irid/irid";
import type { ThemeV1 } from "./types";

const defaultFontScaleFactor = 14;

/**
 * Given two colors, create a third which is the result of overlaying the second
 * on the first
 */
const overlay = (baseString: string, layerString: string): string => {
  const layer = irid(layerString);
  const opacity = layer.opacity();
  const layerOpaque = layer.opacity(1);
  const result = irid(baseString).blend(layerOpaque, opacity);
  return result.toRGBString();
};

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
    fontSize: "1.4em",
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
  const bgOpaquePrimary = overlay(
    seed.colors.wallpaper,
    seed.colors.backgroundPrimary,
  );
  const bgOpaqueSecondary = overlay(
    seed.colors.wallpaper,
    seed.colors.backgroundSecondary,
  );

  const bgTransPrimary = irid(seed.colors.backgroundPrimary);
  const bgTransSecondary = irid(seed.colors.backgroundSecondary);
  const danger = irid(seed.colors.danger ?? "red");
  const success = irid(seed.colors.success ?? "green");

  const bgTransDangerPrimary = bgTransPrimary
    .blend(danger, 0.5)
    .opacity(bgTransPrimary.opacity())
    .toRGBString();
  const bgTransDangerSecondary = bgTransSecondary
    .blend(danger, 0.5)
    .opacity(bgTransSecondary.opacity())
    .toRGBString();
  const bgOpaqueDangerPrimary = overlay(
    seed.colors.wallpaper,
    bgTransDangerPrimary,
  );
  const bgOpaqueDangerSecondary = overlay(
    seed.colors.wallpaper,
    bgTransDangerSecondary,
  );

  const controlBorder = seed.colors.controlBorder ?? seed.colors.text;

  const cardBase = {
    backdropStyle: {
      border: `1px solid ${controlBorder}`,
      padding: "0.5em",
      transformOrigin: "top",
      backgroundColor: bgOpaquePrimary,
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
    panelStylePrimary: seed.panelStylePrimary || {
      backgroundColor: seed.colors.backgroundPrimary,
    },
    tabContentStyle: seed.tabContentStyle || {
      backgroundColor: seed.colors.backgroundPrimary,
    },
    panelStyleSecondary: seed.panelStyleSecondary ||
      seed.panelStylePrimary || {
        backgroundColor: seed.colors.backgroundSecondary,
      },
    colors: {
      ...seed.colors,
      bgOpaquePrimary,
      bgOpaqueSecondary,
      bgTransDangerPrimary,
      bgTransDangerSecondary,
      bgOpaqueDangerPrimary,
      bgOpaqueDangerSecondary,
      controlBorder,
      danger: danger.toString(),
      success: success.toString(),
    },
    logo: {
      ...seed.logo,
      fontScaleFactor: seed.logo.fontScaleFactor ?? defaultFontScaleFactor,
    },
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
