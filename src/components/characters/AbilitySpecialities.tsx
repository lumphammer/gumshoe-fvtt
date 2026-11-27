import { memo } from "react";

import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { css } from "../../styled-system/css";

/** An ability's specialities, under its row on a character sheet */
export const AbilitySpecialities = memo(function AbilitySpecialities({
  ability,
}: {
  /** The live ability: read through a snapshot */
  ability: AbilityItem;
}) {
  const specialities = useItemSelector(ability, (snapshot: AbilitySnapshot) =>
    snapshot.system.hasSpecialities ? snapshot.system.specialities : null,
  );
  if (specialities === null) return null;
  return (
    <div
      className={css({
        paddingLeft: "1em",
        gridColumn: "1/-1",
        textAlign: "right",
      })}
    >
      {specialities.map((x) => x.trim()).join(", ")}
    </div>
  );
});
