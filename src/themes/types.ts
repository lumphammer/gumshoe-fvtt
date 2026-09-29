import type { CSSObject } from "@emotion/react";
import type {
  CardsAreaStyles,
  CardStyles,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

export interface ThemeV1 extends ThemeSeedV1 {
  smallSheetRootStyle: CSSObject;
  tabActiveStyle: CSSObject;
  tabStyle: CSSObject;
  tabSpacerStyle: CSSObject;
  panelStylePrimary: CSSObject;
  panelStyleSecondary: CSSObject;
  tabContentStyle: CSSObject;

  colors: ThemeSeedV1["colors"] & {
    bgOpaquePrimary: string;
    bgOpaqueSecondary: string;
    bgTransDangerPrimary: string;
    bgTransDangerSecondary: string;
    bgOpaqueDangerPrimary: string;
    bgOpaqueDangerSecondary: string;
    controlBorder: string;
    danger: string;
    success: string;
  };

  logo: ThemeSeedV1["logo"] & {
    fontScaleFactor: number;
  };

  cards: {
    base: CardStyles;
    area: CardsAreaStyles;
    categories: Record<string, Partial<CardStyles>>;
  };
}
