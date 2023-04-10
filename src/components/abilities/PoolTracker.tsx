import React, { useCallback } from "react";
import { InvestigatorItem } from "../../module/InvestigatorItem";
import {
  assertAbilityDataSource,
  isAbilityDataSource,
} from "../../typeAssertions";
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
  assertAbilityDataSource(ability?.data);
  const min = ability?.data.data.min ?? 0;
  const max = ability?.data.data.rating;
  const vals = range(min, max);

  const setPool = useCallback(
    (pool: number) => {
      ability.update({
        data: {
          pool,
        },
      });
    },
    [ability],
  );

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
          onClick={setPool}
          selected={
            ability &&
            isAbilityDataSource(ability.data) &&
            value === ability.data.data.pool
          }
        />
      ))}
    </div>
  );
};
