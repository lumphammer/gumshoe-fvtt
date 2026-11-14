import React, { memo, useCallback, useState } from "react";

import { mwNegateCost, mwWallopCost } from "../../constants";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import type { GeneralAbilityItem } from "../../module/items/generalAbility";
import type { MWDifficulty } from "../../types";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { Translate } from "../Translate";
import { Panel } from "../Panel";
import { css } from "../../styled-system/css";

interface AbilityTestMWProps {
  /** Only to write through (a general ability, in Moribund World) */
  item: AbilityItem;
  pool: number;
}

export const AbilityTestMW = memo(function AbilityTestMW({
  item,
  pool,
}: AbilityTestMWProps) {
  const { mwTestAbility, mWWallop, mWNegateIllustrious } = useSystemMethods(
    item as GeneralAbilityItem,
  );
  const [difficulty, setDifficulty] = useState<MWDifficulty>(0);
  const [boonLevy, setBoonLevy] = useState(0);

  const onTest = useCallback(() => {
    void mwTestAbility(difficulty, boonLevy);
  }, [mwTestAbility, boonLevy, difficulty]);

  const onWallop = useCallback(() => {
    void mWWallop();
  }, [mWWallop]);

  const onNegateIllustrious = useCallback(() => {
    void mWNegateIllustrious();
  }, [mWNegateIllustrious]);

  const onChangeDifficulty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.currentTarget.value;
    const diff = val === "easy" ? "easy" : Number(val);
    setDifficulty(diff);
  };

  const onChangeBoonLevy = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.currentTarget.value;
    const newBoonLevy = Number(val);
    setBoonLevy(newBoonLevy);
  };

  return (
    <Panel
      className={css({
        marginBottom: "1em",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      })}
    >
      <InputGrid>
        <GridField label="Difficulty">
          <Select
            className={css({ display: "block", width: "100%" })}
            value={difficulty}
            onChange={onChangeDifficulty}
          >
            <option value="easy">Easy</option>
            <option value={0}>Normal</option>
            <option value={-1}>Hard (-1)</option>
            <option value={-2}>Very Hard (-2)</option>
          </Select>
        </GridField>
        <GridField label="Boon/levy">
          <div className={css({ position: "relative" })}>
            <Select
              className={css({ display: "block", width: "100%" })}
              value={boonLevy}
              onChange={onChangeBoonLevy}
            >
              <option value={+2}>Boon +2</option>
              <option value={+1}>Boon +1</option>
              <option value={0}>0</option>
              <option value={-1}>Levy (-1)</option>
              <option value={-2}>Levy (-2)</option>
            </Select>
          </div>
        </GridField>
      </InputGrid>
      <div
        className={css({
          display: "flex",
          flexDirection: "row",
        })}
      >
        <Button
          disabled={pool < mwNegateCost}
          className={css({ flex: "1" })}
          onClick={onNegateIllustrious}
        >
          <Translate>Negate</Translate>
        </Button>
        <Button
          disabled={pool < mwWallopCost}
          className={css({ flex: "1" })}
          onClick={onWallop}
        >
          <Translate>Wallop</Translate>
        </Button>
        <Button kind="cta" className={css({ flex: "[2]" })} onClick={onTest}>
          <Translate>Test</Translate>
        </Button>
      </div>
    </Panel>
  );
});
