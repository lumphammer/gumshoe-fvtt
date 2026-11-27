import { memo } from "react";

import { AbilityRollRow } from "./AbilityRollRow";
import { AbilityPoolCell } from "./AbilityPoolCell";
import { AbilitySpecialities } from "./AbilitySpecialities";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { css } from "../../styled-system/css";

type AbilitySlugPlayMwProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
};

/**
 * A Moribund World ability's row in play: its name and pool, which open a
 * popover to test it.
 */
export const AbilitySlugPlayMw = memo(function AbilitySlugPlayMw({
  ability,
}: AbilitySlugPlayMwProps) {
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
      <AbilitySpecialities ability={ability} />
    </>
  );
});
