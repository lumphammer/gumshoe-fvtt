import React, { Fragment, memo, useCallback } from "react";

import { AbilityNameLink } from "./AbilityNameLink";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { getSpecialitiesCountOf } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { SpecialityList } from "../abilities/SpecialityList";
import { Toggle } from "../inputs/Toggle";
import { css } from "../../styled-system/css";

type AbilitySlugEditQuickShockInvestigativeProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
};

export const AbilitySlugEditQuickShockInvestigative = memo(
  function AbilitySlugEditQuickShockInvestigative({
    ability,
  }: AbilitySlugEditQuickShockInvestigativeProps) {
    const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
      name: snapshot.name,
      rating: snapshot.system.rating,
      hasSpecialities: snapshot.system.hasSpecialities,
      specialitiesCount: getSpecialitiesCountOf(snapshot.system),
    }));
    const { setRatingAndRefreshPool } = useSystemMethods(ability);

    const handleToggle = useCallback(
      (checked: boolean) => {
        void setRatingAndRefreshPool(checked ? 1 : 0);
      },
      [setRatingAndRefreshPool],
    );

    return (
      <Fragment key={ability.id}>
        <AbilityNameLink
          ability={ability}
          name={row.name}
          className={css({ marginBottom: "0.5em" })}
        />
        <div className={css({ gridColumn: "rating", justifySelf: "center" })}>
          <Toggle checked={row.rating > 0} onChange={handleToggle} />
        </div>
        <AbilityBadges
          ability={ability}
          className={css({ gridColumn: "1/-1" })}
        />
        {row.hasSpecialities && row.specialitiesCount > 0 && (
          <div className={css({ paddingLeft: "2em", gridColumn: "1/-1" })}>
            <SpecialityList ability={ability} />
          </div>
        )}
      </Fragment>
    );
  },
);
