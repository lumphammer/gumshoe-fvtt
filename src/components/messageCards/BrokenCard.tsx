import React from "react";

import { useTheme } from "../../hooks/useTheme";
import { Translate } from "../Translate";

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
    const theme = useTheme();

    return (
      <div
        className="dice-roll"
        css={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gridTemplateAreas: '"image headline"',
          alignItems: "center",
          justifyItems: "start",
          opacity: 0.7,
        }}
      >
        {imageUrl && (
          <div
            css={{
              height: "4em",
              width: "4em",
              gridArea: "image",
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              marginRight: "1em",
              filter: "grayscale(1)",
            }}
          />
        )}
        <div css={{ gridArea: "headline" }}>
          <div
            css={{
              fontSize: "1.5em",
              fontStyle: "italic",
              color: theme.colors.accent,
            }}
          >
            {name ?? <Translate>UnknownAbility</Translate>}
          </div>
          <div css={{ fontSize: "0.9em" }}>
            <Translate>{reason}</Translate>
          </div>
        </div>
      </div>
    );
  },
);

BrokenCard.displayName = "BrokenCard";
