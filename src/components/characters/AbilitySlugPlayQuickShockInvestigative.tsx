import { memo, useCallback } from "react";

import { AbilityRollRow } from "./AbilityRollRow";
import { AbilitySpecialities } from "./AbilitySpecialities";
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

/**
 * A Quick Shock Investigative ability's row in play: its name opens the
 * popover like any other row's, and its Push button stays beside it.
 */
export const AbilitySlugPlayQuickShockInvestigative = memo(
  function AbilitySlugPlayQuickShockInvestigative({
    ability,
    disabled,
  }: AbilitySlugPlayQuickShockInvestigativeProps) {
    const name = useItemSelector(
      ability,
      (snapshot: AbilitySnapshot) => snapshot.name,
    );
    const { push } = useSystemMethods(ability);

    const handleClickPush = useCallback(() => {
      void push();
    }, [push]);

    return (
      <>
        <AbilityRollRow
          ability={ability}
          className={css({ gridColumn: "1 / -2" })}
        >
          <span
            className={css({
              gridColumn: "1 / -1",
              textAlign: "end",
              lineHeight: 0.9,
            })}
          >
            {name}
          </span>
        </AbilityRollRow>
        <Button
          className={css({ width: "4.1em" })}
          onClick={handleClickPush}
          disabled={disabled}
        >
          <Translate>Push</Translate>
        </Button>
        <AbilityBadges
          ability={ability}
          className={css({ gridColumn: "1/-1" })}
        />
        <AbilitySpecialities ability={ability} />
      </>
    );
  },
);
