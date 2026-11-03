import React, { memo, useContext } from "react";

import { useDragStart } from "../../hooks/useDragStart";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import type { CardItem } from "../../module/items/card";
import { ThemeContext } from "../../themes/ThemeContext";
import { CardDisplay } from "./CardDisplay";
import { CardsAreaSettingsContext } from "./contexts";

interface CardArrayCardProps {
  card: CardItem;
  className?: string;
}

/**
 * A card in the Cards tab. Memoised: it reads only what it shows itself
 * (whether the card's active, and its category's hover style) through
 * snapshots. `CardDisplay`, below, is memoised too, and reads the rest.
 */
export const CardArrayCard = memo(function CardArrayCard({
  card,
  className,
}: CardArrayCardProps) {
  const data = useItemSelector(card, ({ system }) => ({
    active: system.active,
    styleKeyCategoryId: system.styleKeyCategoryId,
  }));
  const styleKey = useSettings(
    (s) =>
      s.cardCategories.find((cat) => cat.id === data.styleKeyCategoryId)
        ?.styleKey,
  );
  const theme = useContext(ThemeContext);

  const { viewMode } = useContext(CardsAreaSettingsContext);

  const handleDragStart = useDragStart();

  const categoryTheme = styleKey ? theme.cards.categories[styleKey] : null;

  return (
    // opacity has to be applied on a wrapper otherwise we break transform-style
    // (if used.) See https://stackoverflow.com/a/70627306/212676
    <div
      css={{
        opacity: data.active ? 1 : 0.5,
        transition: "opacity 0.2s ease-in-out",
        containerType: "inline-size",
      }}
    >
      <CardDisplay
        key={card.id}
        draggable
        onDragStart={handleDragStart}
        className={`investigator-card-array-card ${className}`}
        card={card}
        css={{
          cursor: "pointer",
          marginBottom: theme.cards.area.verticalSpacing,
          ":hover": {
            ...theme.cards.base.hoverStyle,
            ...categoryTheme?.hoverStyle,
          },
        }}
        viewMode={viewMode}
      />
    </div>
  );
});

CardArrayCard.displayName = "CardArrayCard";
