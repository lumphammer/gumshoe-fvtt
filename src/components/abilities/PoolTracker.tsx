import { memo } from "react";

import { openSheet } from "../../functions/openSheet";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { isGeneralAbilitySnapshot } from "../../module/items/abilitySnapshots";
import type { AbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { AbilityBadges } from "./AbilityBadges";
import { PoolCheckbox } from "./PoolCheckbox";
import { css } from "../../styled-system/css";

const range = (from: number, to: number): number[] => {
  if (to < from) {
    return range(to, from).reverse();
  }

  return new Array(to - from + 1).fill(null).map((_, i) => from + i);
};

type PoolTrackerProps = {
  /** The live ability: the tracker reads it through a snapshot */
  ability: AbilityItem;
};

export const PoolTracker = memo(function PoolTracker({
  ability,
}: PoolTrackerProps) {
  const tracker = useItemSelector(ability, (snapshot: AbilitySnapshot) => ({
    name: snapshot.name,
    min: snapshot.system.min ?? 0,
    max: snapshot.system.allowPoolToExceedRating
      ? snapshot.system.max
      : snapshot.system.rating,
    pool: snapshot.system.pool,
    isPushPool:
      isGeneralAbilitySnapshot(snapshot) && snapshot.system.isPushPool,
  }));
  const methods = useSystemMethods(ability);
  const vals = range(tracker.min, tracker.max);

  return (
    <div
      data-testid="pool-tracker"
      style={{
        display: "grid",
        gridTemplateColumns: "[start] 1fr 1fr 1fr 1fr [end]",
      }}
    >
      <h2 className={css({ gridColumn: "start / end" })}>
        <a
          onClick={() => {
            openSheet(ability);
          }}
        >
          {tracker.name}
        </a>
      </h2>
      {/* e.g. Shaken, under Stability: hard to miss on the sheet */}
      {isGeneralAbilityItem(ability) && (
        <AbilityBadges
          ability={ability}
          className={css({
            gridColumn: "start / end",
            justifyContent: "start",
            rowGap: "0.25em",
            // only when there are badges, to keep them off the boxes
            "&:not(:empty)": { marginBottom: "0.5em" },
          })}
        />
      )}

      {vals.map((value) => (
        <PoolCheckbox
          key={value}
          value={value}
          onClick={methods.setPool}
          selected={value === tracker.pool}
        />
      ))}
      {tracker.isPushPool && (
        <Button
          className={css({
            gridColumn: "start / end",
            width: "auto",
            marginTop: "0.5em",
          })}
          disabled={tracker.pool === 0}
          onClick={() => {
            if (isGeneralAbilityItem(ability)) void ability.system.push();
          }}
        >
          <Translate>Push</Translate>
        </Button>
      )}
    </div>
  );
});
