import React from "react";

import { InvestigatorItem } from "../../module/InvestigatorItem";
import {
  assertAbilityItem,
  isAbilityItem,
  isGeneralAbilityItem,
} from "../../v10Types";
import { Button } from "../inputs/Button";
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

export const PoolTracker: React.FC<PoolTrackerProps> = ({ ability }) => {
  assertAbilityItem(ability);
  const min = ability?.system.min ?? 0;
  const max = ability?.system.rating;
  const vals = range(min, max);

  const handleClickPush = React.useCallback(() => {
    void ability.setPool(ability.system.pool - 1);
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

      {vals.map<JSX.Element>((value) => (
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
          onClick={handleClickPush}
        >
          Push
        </Button>
      )}
    </div>
  );
};
