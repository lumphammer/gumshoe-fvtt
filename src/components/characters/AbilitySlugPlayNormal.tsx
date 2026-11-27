import { memo } from "react";

import { AbilityRollRow } from "./AbilityRollRow";
import { AbilityPoolCell } from "./AbilityPoolCell";
import { AbilitySpecialities } from "./AbilitySpecialities";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { css } from "../../styled-system/css";

type AbilitySlugPlayNormalProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
};

/**
 * An ability's row in play: its name and pool, which open a popover to test or
 * spend it, with its badges and specialities under them.
 */
export const AbilitySlugPlayNormal = memo(function AbilitySlugPlayNormal({
  ability,
}: AbilitySlugPlayNormalProps) {
  const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
    name: snapshot.name,
    pool: snapshot.system.pool,
    rating: snapshot.system.rating,
  }));

  return (
    <>
      <AbilityRollRow ability={ability}>
        <span className={css({ lineHeight: 0.9 })}>{row.name}</span>
        <AbilityPoolCell pool={row.pool} rating={row.rating} />
      </AbilityRollRow>
      <AbilityBadges
        ability={ability}
        // under the name, like its specialities
        className={css({
          gridColumn: "1/-1",
          justifyContent: "start",
          paddingLeft: "1em",
        })}
      />
      <AbilitySpecialities ability={ability} />
    </>
  );
});
