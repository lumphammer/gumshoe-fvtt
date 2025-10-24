import { useCallback } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import {
  AbilityItem,
  assertAbilityItem,
  isAbilityItem,
} from "../../module/items/exports";
import {
  assertGeneralAbilityItem,
  isGeneralAbilityItem,
} from "../../module/items/generalAbility";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { PoolCheckbox } from "./PoolCheckbox";

const range = (from: number, to: number): number[] => {
  if (to < from) {
    return range(to, from).reverse();
  }

  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
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
