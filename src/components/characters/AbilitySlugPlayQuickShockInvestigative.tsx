import React, { Fragment, memo, useCallback } from "react";

import { AbilityNameLink } from "./AbilityNameLink";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { AbilityBadges } from "../abilities/AbilityBadges";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { css } from "../../styled-system/css";

type AbilitySlugPlayQuickShockInvestigativeProps = {
  /** The live ability: the row reads it through a snapshot */
  ability: AbilityItem;
  disabled: boolean;
};

export const AbilitySlugPlayQuickShockInvestigative = memo(
  function AbilitySlugPlayQuickShockInvestigative({
    ability,
    disabled,
  }: AbilitySlugPlayQuickShockInvestigativeProps) {
    const row = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
      name: snapshot.name,
      hasSpecialities: snapshot.system.hasSpecialities,
      specialities: snapshot.system.specialities,
    }));
    const { push } = useSystemMethods(ability);

    const handleClickPush = useCallback(() => {
      void push();
    }, [push]);

    return (
      <Fragment key={ability.id}>
        <AbilityNameLink
          ability={ability}
          name={row.name}
          className={css({ lineHeight: 0.9 })}
        />
        <div className={css({ gridColumn: "rating/-1", justifySelf: "right" })}>
          <Button
            className={css({ width: "4.1em" })}
            onClick={handleClickPush}
            disabled={disabled}
          >
            <Translate>Push</Translate>
          </Button>
        </div>
        <AbilityBadges
          ability={ability}
          className={css({ gridColumn: "1/-1" })}
        />
        {row.hasSpecialities && (
          <div className={css({ paddingLeft: "1em", gridColumn: "1/-1" })}>
            {row.specialities.map((x, i) => (
              <div key={i}>{x.trim()}</div>
            ))}
          </div>
        )}
      </Fragment>
    );
  },
);
