import { useContext } from "react";

import { liveItem } from "../../functions/liveItems";
import { isCardItem } from "../../module/items/card";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { Masonry } from "../Masonry";
import { Translate } from "../Translate";
import { CardArrayCard } from "./CardArrayCard";
import { CardsAreaSettingsContext } from "./contexts";
import type { CardLayoutView } from "./functions";
import type { CardsColumnWidth } from "./types";
import { mutedText } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

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
  const { columnWidth: columnWidthSetting } = useContext(
    CardsAreaSettingsContext,
  );

  if (cards.length === 0) {
    return (
      <div
        className={cx(
          mutedText(),
          css({
            display: "flex",
            flexDirection: "row",
            justifyContent: "start",
            alignItems: "center",
            fontSize: "1.5em",
            margin: "1em 0em",
          }),
        )}
      >
        <Translate>No cards</Translate>
      </div>
    );
  }

  return (
    <Masonry
      minColumnWidth={columndWidths[columnWidthSetting]}
      // the theme's card gap (palette.ts): between the cards and around them
      columnGap="var(--inv-card-gap-column)"
      style={{ margin: "var(--inv-card-gap)" }}
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
