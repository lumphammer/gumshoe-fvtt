import { memo, useCallback } from "react";

import { AbilityRollRow } from "./AbilityRollRow";
import { AbilityRowTags } from "./AbilityRowTags";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
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
              lineHeight: 0.9,
              // a long name wraps anywhere, not past the column
              overflowWrap: "anywhere",
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
        <AbilityRowTags ability={ability} />
      </>
    );
  },
);
