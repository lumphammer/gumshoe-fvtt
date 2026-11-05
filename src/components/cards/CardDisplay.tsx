import React, { memo, useCallback, useEffect, useState } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { getTranslated } from "../../functions/getTranslated";
import { cleanAndEnrichHtml } from "../../functions/textFunctions";
import { isNullOrEmptyString } from "../../functions/utilities";
import type { CardItem } from "../../module/items/card";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { card as cardRecipe } from "../../styled-system/recipes";
import { summarizeCategoryMemberships } from "./functions";
import type { CardsViewMode } from "./types";

interface CardDisplayProps {
  card: CardItem;
  className?: string;
  viewMode: CardsViewMode;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
}

/**
 * A card, as shown in the Cards tab and on its own sheet. Memoised: it reads
 * the card, and what it shows from the card categories, through snapshots,
 * so it re-renders only when what it shows changes.
 */
export const CardDisplay = memo(function CardDisplay({
  card,
  className,
  viewMode,
  draggable,
  onDragStart,
}: CardDisplayProps) {
  const [descriptionHTML, setDescriptionHTML] = useState("");
  const [effectsHTML, setEffectsHTML] = useState("");
  const data = useItemSelector(card, (snapshot) => ({
    name: snapshot.name,
    system: snapshot.system,
  }));
  const system = data.system;
  // only what this card shows from the categories, so changing another
  // category doesn't re-render it
  const { categoryText, styleKey } = useSettings((s) => ({
    categoryText: summarizeCategoryMemberships(
      system.cardCategoryMemberships,
      s.cardCategories,
    ),
    styleKey: s.cardCategories.find((c) => c.id === system.styleKeyCategoryId)
      ?.styleKey,
  }));

  const sheet = card.sheet;
  assertApplicationV2(sheet);
  const handleClick = useCallback(() => {
    void sheet.render({ force: true });
  }, [sheet]);

  const showText = viewMode === "full";

  useEffect(() => {
    void cleanAndEnrichHtml(system.description).then(setDescriptionHTML);
  }, [system.description]);

  useEffect(() => {
    void cleanAndEnrichHtml(system.effects).then(setEffectsHTML);
  }, [system.effects]);

  const classes = cardRecipe();

  const supertitleText = [
    // category name
    categoryText,
    // active
    !system.active ? getTranslated("Inactive") : null,
    // continuity
    system.continuity ? getTranslated("Continuity") : null,
    // supertitle text
    !isNullOrEmptyString(system.supertitle) ? system.supertitle : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      data-item-id={card.id}
      tabIndex={0}
      onClick={handleClick}
      className={`investigator-card-display ${classes.root} ${className} ${styleKey}`}
    >
      {supertitleText && (
        <p className={`supertitle ${classes.supertitle}`}>{supertitleText}</p>
      )}
      <h2 className={`title ${classes.title}`}>{data.name}</h2>
      {!isNullOrEmptyString(system.subtitle) && (
        <p className={`subtitle ${classes.subtitle}`}>{system.subtitle}</p>
      )}
      {showText && !isNullOrEmptyString(descriptionHTML) && (
        <p
          className={`description ${classes.description}`}
          dangerouslySetInnerHTML={{ __html: descriptionHTML }}
        />
      )}
      {showText && !isNullOrEmptyString(effectsHTML) && (
        <p
          className={`effects ${classes.effect}`}
          dangerouslySetInnerHTML={{ __html: effectsHTML }}
        />
      )}
    </div>
  );
});

CardDisplay.displayName = "CardDisplay";
