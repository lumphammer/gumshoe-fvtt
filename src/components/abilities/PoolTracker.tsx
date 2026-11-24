import { type KeyboardEvent, memo } from "react";

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
import { clickable } from "../clickable";

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
  // the pip in the Tab order: the pool's, or the first if the pool is out of
  // range
  const tabStop = vals.includes(tracker.pool) ? tracker.pool : vals[0];

  /**
   * The WAI-ARIA radio group pattern: the arrow keys move to the next or
   * previous value and set the pool to it. They don't wrap round, which would
   * turn a full pool empty in one press.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    }[event.key];
    const pip = (event.target as HTMLElement).closest<HTMLElement>(
      "[role=radio]",
    );
    if (
      step === undefined ||
      !pip ||
      pip.getAttribute("aria-disabled") === "true"
    ) {
      return;
    }
    event.preventDefault();
    const pips = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        ":scope > [role=radio]",
      ),
    );
    const next = pips[pips.indexOf(pip) + step];
    if (next) {
      next.focus();
      void methods.setPool(Number(next.dataset["value"]));
    }
  };

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
          {...clickable(() => {
            openSheet(ability);
          })}
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

      <div
        role="radiogroup"
        aria-label={tracker.name}
        onKeyDown={onKeyDown}
        className={css({
          gridColumn: "start / end",
          display: "grid",
          gridTemplateColumns: "subgrid",
        })}
      >
        {vals.map((value) => (
          <PoolCheckbox
            key={value}
            value={value}
            onClick={methods.setPool}
            selected={value === tracker.pool}
            tabStop={value === tabStop}
          />
        ))}
      </div>
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
