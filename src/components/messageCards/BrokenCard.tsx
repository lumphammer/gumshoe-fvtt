import React from "react";

import { Translate } from "../Translate";
import { css, cx } from "../../styled-system/css";

interface BrokenCardProps {
  name: string | null;
  imageUrl: string | null;
  /** translation key explaining why the card could not be rendered */
  reason: string;
}

/**
 * Static stand-in for an ability card whose actor or item can't be resolved.
 * Chat message content is immutable, so a card written by an older version of
 * the system (or one whose actor or item has since been deleted) can never be
 * made interactive again - the best we can do is show what we know and say why.
 */
export const BrokenCard = React.memo(
  ({ name, imageUrl, reason }: BrokenCardProps) => {
    return (
      <div
        className={cx(
          "dice-roll",
          css({
            position: "relative",
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            gridTemplateAreas: '"image headline"',
            alignItems: "center",
            justifyItems: "start",
            opacity: 0.7,
          }),
        )}
      >
        {imageUrl && (
          <div
            className={css({
              height: "4em",
              width: "4em",
              gridArea: "image",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              marginRight: "1em",
              filter: "[grayscale(1)]",
            })}
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        <div className={css({ gridArea: "headline" })}>
          <div
            className={css({
              fontSize: "1.5em",
              fontStyle: "italic",
            })}
          >
            {name ?? <Translate>UnknownAbility</Translate>}
          </div>
          <div className={css({ fontSize: "0.9em" })}>
            <Translate>{reason}</Translate>
          </div>
        </div>
      </div>
    );
  },
);

BrokenCard.displayName = "BrokenCard";
