import { useContext } from "react";

import { liveItem } from "../../functions/liveItems";
import { isCardItem } from "../../module/items/card";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { ThemeContext } from "../../themes/ThemeContext";
import { Masonry } from "../Masonry";
import { Translate } from "../Translate";
import { CardArrayCard } from "./CardArrayCard";
import { CardsAreaSettingsContext } from "./contexts";
import type { CardLayoutView } from "./functions";
import type { CardsColumnWidth } from "./types";

interface CardArrayProps {
  /** the cards, in order, from the actor's snapshot */
  cards: readonly CardLayoutView[];
}

const columndWidths: Record<CardsColumnWidth, string> = {
  narrow: "11em",
  wide: "17em",
  full: "100%",
};

export const CardArray = ({ cards }: CardArrayProps) => {
  const { actor } = useActorSheetContext();
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
      {cards.map(({ id }) => {
        // the live card, for the memoised card to read its own snapshot
        const card = liveItem(actor, id, isCardItem);
        return card ? <CardArrayCard key={id} card={card} /> : null;
      })}
    </Masonry>
  );
};

CardArray.displayName = "CardArray";
