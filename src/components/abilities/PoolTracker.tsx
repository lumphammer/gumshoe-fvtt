import { useCallback } from "react";

import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import {
  assertAbilityItem,
  assertGeneralAbilityItem,
  isAbilityItem,
  isGeneralAbilityItem,
} from "../../v10Types";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { PoolCheckbox } from "./PoolCheckbox";

const range = (from: number, to: number): number[] => {
  if (to < from) {
    return range(to, from).reverse();
  }

  return new Array(to - from + 1).fill(null).map((_, i) => from + i);
};

type PoolTrackerProps = {
  ability: InvestigatorItem;
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
    void ability.push();
  }, [ability]);

  return (
    <div
      style={{
        width: "8em",
        height: "auto",
        display: "grid",
        position: "relative",
        gridTemplateColumns: "[start] 1fr 1fr 1fr 1fr [end]",
        // gridAutoRows: "2em",
      }}
    >
      <h2 css={{ gridColumn: "start / end" }}>
        <a onClick={() => ability.sheet?.render(true)}>{ability.name}</a>
      </h2>

      {vals.map((value) => (
        <PoolCheckbox
          key={value}
          value={value}
          onClick={ability.setPool}
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
