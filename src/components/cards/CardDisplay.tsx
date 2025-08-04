import React, { useCallback, useContext, useEffect, useState } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { getTranslated } from "../../functions/getTranslated";
import { cleanAndEnrichHtml } from "../../functions/textFunctions";
import { isNullOrEmptyString } from "../../functions/utilities";
import { CardItem } from "../../module/items/card";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { summarizeCategoryMemberships } from "./functions";
import { CardsViewMode } from "./types";

interface CardDisplayProps {
  card: CardItem;
  className?: string;
  viewMode: CardsViewMode;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
}

export const CardDisplay = ({
  card,
  className,
  viewMode,
  draggable,
  onDragStart,
}: CardDisplayProps) => {
  const theme = useContext(ThemeContext);
  const [descriptionHTML, setDescriptionHTML] = useState("");
  const [effectsHTML, setEffectsHTML] = useState("");
  const categoryText = summarizeCategoryMemberships(
    card.system.cardCategoryMemberships,
  );

  const sheet = card.sheet;
  assertApplicationV2(sheet);
  const handleClick = useCallback(() => {
    void sheet.render({ force: true });
  }, [sheet]);

  const showText = viewMode === "full";

  useEffect(() => {
    void cleanAndEnrichHtml(card.system.description.html).then(
      setDescriptionHTML,
    );
  }, [card.system.description.html]);

  useEffect(() => {
    void cleanAndEnrichHtml(card.system.effects.html).then(setEffectsHTML);
  }, [card.system.effects.html]);

  const styleKey = settings.cardCategories
    .get()
    .find((c) => c.id === card.system.styleKeyCategoryId)?.styleKey;
  const categoryTheme = styleKey ? theme.cards.categories[styleKey] : null;

  const supertitleText = [
    // category name
    categoryText,
    // active
    !card.system.active ? getTranslated("Inactive") : null,
    // continuity
    card.system.continuity ? getTranslated("Continuity") : null,
    // supertitle text
    !isNullOrEmptyString(card.system.supertitle)
      ? card.system.supertitle
      : null,
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
      className={`investigator-card-display ${className} ${styleKey}`}
      css={{
        ...theme.cards.base.backdropStyle,
        ...categoryTheme?.backdropStyle,
      }}
    >
      {supertitleText && (
        <p
          className="supertitle"
          css={{
            ...theme.cards.base.supertitleStyle,
            ...categoryTheme?.supertitleStyle,
          }}
        >
          {supertitleText}
        </p>
      )}
      <h2
        className="title"
        css={{
          ...theme.cards.base.titleStyle,
          ...categoryTheme?.titleStyle,
        }}
      >
        {card.name}
      </h2>
      {!isNullOrEmptyString(card.system.subtitle) && (
        <p
          className="subtitle"
          css={{
            ...theme.cards.base.subtitleStyle,
            ...categoryTheme?.subtitleStyle,
          }}
        >
          {card.system.subtitle}
        </p>
      )}
      {showText && !isNullOrEmptyString(descriptionHTML) && (
        <p
          className="description"
          css={{
            ...theme.cards.base.descriptionStyle,
            ...categoryTheme?.descriptionStyle,
          }}
          dangerouslySetInnerHTML={{ __html: descriptionHTML }}
        />
      )}
      {showText && !isNullOrEmptyString(effectsHTML) && (
        <p
          className="effects"
          css={{
            ...theme.cards.base.effectStyle,
            ...categoryTheme?.effectStyle,
          }}
          dangerouslySetInnerHTML={{ __html: effectsHTML }}
        />
      )}
    </div>
  );
};

CardDisplay.displayName = "CardDisplay";
