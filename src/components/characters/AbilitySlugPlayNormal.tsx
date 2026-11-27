import { memo } from "react";

import { AbilityRollRow } from "./AbilityRollRow";
import { PoolPips } from "./PoolPips";
import { AbilityRowTags } from "./AbilityRowTags";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { css } from "../../styled-system/css";

type AbilitySlugPlayNormalProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
};

/**
 * An ability's row in play: its name and pool, which open a popover to test or
 * spend it, with its specialities and badges under them.
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
        <PoolPips
          pool={row.pool}
          rating={row.rating}
          className={css({ justifySelf: "end" })}
        />
      </AbilityRollRow>
      <AbilityRowTags ability={ability} />
    </>
  );
});
