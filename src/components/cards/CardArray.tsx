import { useContext } from "react";

import { CardItem } from "../../module/items/card";
import { ThemeContext } from "../../themes/ThemeContext";
import { Masonry } from "../Masonry";
import { Translate } from "../Translate";
import { CardArrayCard } from "./CardArrayCard";
import { CardsAreaSettingsContext } from "./contexts";
import { CardsColumnWidth } from "./types";

interface CardArrayProps {
  cards: CardItem[];
}

const columndWidths: Record<CardsColumnWidth, string> = {
  narrow: "11em",
  wide: "17em",
  full: "100%",
};

export const CardArray = ({ cards }: CardArrayProps) => {
  const theme = useContext(ThemeContext);
  const { columnWidth: columnWidthSetting } = useContext(
    CardsAreaSettingsContext,
  );

  if (cards.length === 0) {
    return (
      <div
        css={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "start",
          alignItems: "center",
          fontSize: "1.5em",
          color: theme.colors.text,
          opacity: 0.5,
          margin: "1em 0em",
        }}
      >
        <Translate>No cards</Translate>
      </div>
    );
  }

  return (
    <Masonry
      minColumnWidth={columndWidths[columnWidthSetting]}
      columnGap={theme.cards.area.horizontalSpacing}
      css={{
        marginTop: theme.cards.area.verticalSpacing,
        marginBottom: theme.cards.area.verticalSpacing,
        marginLeft: theme.cards.area.horizontalSpacing,
        marginRight: theme.cards.area.horizontalSpacing,
      }}
    >
      {cards.map((card) => (
        <CardArrayCard key={card.id} card={card} />
      ))}
    </Masonry>
  );
};

CardArray.displayName = "CardArray";
