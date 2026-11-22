import type {
  CardsAreaStyles,
  CardStyles,
  CSSObject,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

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
    controlBorder: string;
    danger: string;
    warning: string;
    success: string;
  };

  cards: {
    base: CardStyles;
    area: CardsAreaStyles;
    categories: Record<string, Partial<CardStyles>>;
  };
}
