import { useCallback } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import type { AbilityItem } from "../../module/items/exports";
import { assertAbilityItem, isAbilityItem } from "../../module/items/exports";
import {
  assertGeneralAbilityItem,
  isGeneralAbilityItem,
} from "../../module/items/generalAbility";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { AbilityBadges } from "./AbilityBadges";
import { PoolCheckbox } from "./PoolCheckbox";

const range = (from: number, to: number): number[] => {
  if (to < from) {
    return range(to, from).reverse();
  }

  return new Array(to - from + 1).fill(null).map((_, i) => from + i);
};

type PoolTrackerProps = {
  ability: AbilityItem;
};

export const PoolTracker = ({ ability }: PoolTrackerProps) => {
  assertAbilityItem(ability);
  const min = ability?.system.min ?? 0;
  const max = ability.system.allowPoolToExceedRating
    ? ability.system.max
    : ability?.system.rating;
  const vals = range(min, max);

  const handleClickPush = useCallback(() => {
    assertGeneralAbilityItem(ability);
    void ability.system.push();
  }, [ability]);

  const sheet = ability.sheet;
  assertApplicationV2(sheet);

  return (
    <div
      data-testid="pool-tracker"
      style={{
        width: "8em",
        height: "auto",
        display: "grid",
        position: "relative",
        gridTemplateColumns: "[start] 1fr 1fr 1fr 1fr [end]",
      }}
    >
      <h2 css={{ gridColumn: "start / end" }}>
        <a onClick={() => sheet.render({ force: true })}>{ability.name}</a>
      </h2>
      {/* e.g. Shaken, under Stability: hard to miss on the sheet */}
      {isGeneralAbilityItem(ability) && (
        <AbilityBadges
          ability={ability}
          css={{
            gridColumn: "start / end",
            justifyContent: "start",
            rowGap: "0.25em",
          }}
        />
      )}

      {vals.map((value) => (
        <PoolCheckbox
          key={value}
          value={value}
          onClick={ability.system.setPool}
          selected={
            ability && isAbilityItem(ability) && value === ability.system.pool
          }
        />
      ))}
      {isGeneralAbilityItem(ability) && ability.system.isPushPool && (
        <Button
          css={{
            gridColumn: "start / end",
            width: "auto",
            marginTop: "0.5em",
          }}
          disabled={ability.system.pool === 0}
          onClick={handleClickPush}
        >
          <Translate>Push</Translate>
        </Button>
      )}
    </div>
  );
};
