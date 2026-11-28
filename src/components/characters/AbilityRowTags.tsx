import { memo } from "react";

import type { AbilityItem } from "../../module/items/exports";
import { css } from "../../styled-system/css";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { AbilitySpecialities } from "./AbilitySpecialities";

/**
 * Under an ability's row on a character sheet: its specialities, then its
 * badges, small, right-aligned in one line which wraps. Nothing (not even a
 * gap in the grid) when it has neither.
 */
export const AbilityRowTags = memo(function AbilityRowTags({
  ability,
  badges = true,
}: {
  /** The live ability: its parts read it through snapshots */
  ability: AbilityItem;
  /** whether to show its badges (Moribund World rows don't) */
  badges?: boolean;
}) {
  return (
    <div
      className={css({
        gridColumn: "1/-1",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "end",
        justifyContent: "end",
        gap: "0.25em",
        // paddingLeft: "1em",
        "&:not(:has(.inv-badge))": { display: "none" },
        marginBottom: "0.25em",
      })}
    >
      <AbilitySpecialities ability={ability} />
      {badges && (
        // its box gives its badges to the line
        <AbilityBadges
          ability={ability}
          size="sm"
          className={css({ display: "contents" })}
        />
      )}
    </div>
  );
});
