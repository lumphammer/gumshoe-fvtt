import type {
  CardsAreaStyles,
  CardStyles,
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import type { CatalogueOverrides } from "./catalogue/overrides";

export interface ThemeV1 extends ThemeSeedV1 {
  smallSheetRootStyle: CSSObject;
  tabActiveStyle: CSSObject;
  tabStyle: CSSObject;
  tabSpacerStyle: CSSObject;
  tabContentStyle: CSSObject;
  tabWrappedStyle: CSSObject;
  tabWrappedActiveStyle: CSSObject;
  tabContentWrappedStyle: CSSObject;

  colors: ThemeSeedV1["colors"] & {
    bgOpaquePrimary: string;
    bgOpaqueSecondary: string;
    bgTransDangerPrimary: string;
    bgTransDangerSecondary: string;
    bgOpaqueDangerPrimary: string;
    bgOpaqueDangerSecondary: string;
    controlBorder: string;
    danger: string;
    warning: string;
    success: string;
  };

  /**
   * Replacements for catalogue classes (docs/theming.md). Internal: not in
   * the published seed type until the new theme format settles.
   */
  catalogue?: CatalogueOverrides;

  cards: {
    base: CardStyles;
    area: CardsAreaStyles;
    categories: Record<string, Partial<CardStyles>>;
  };
}
