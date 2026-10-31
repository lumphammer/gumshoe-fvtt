import React, { memo, useCallback, useContext, useState } from "react";

import { mwNegateCost, mwWallopCost } from "../../constants";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import type { GeneralAbilityItem } from "../../module/items/generalAbility";
import { ThemeContext } from "../../themes/ThemeContext";
import type { MWDifficulty } from "../../types";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { Translate } from "../Translate";

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
  const theme = useContext(ThemeContext);
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
    <div
      css={{
        border: `1px solid ${theme.colors.controlBorder}`,
        padding: "0.5em",
        marginBottom: "1em",
        background: theme.colors.backgroundSecondary,
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      }}
    >
      <InputGrid>
        <GridField label="Difficulty">
          <Select
            css={{ display: "block", width: "100%" }}
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
          <div css={{ position: "relative" }}>
            <Select
              css={{ display: "block", width: "100%" }}
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
        css={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Button
          disabled={pool < mwNegateCost}
          css={{ flex: "1" }}
          onClick={onNegateIllustrious}
        >
          <Translate>Negate</Translate>
        </Button>
        <Button
          disabled={pool < mwWallopCost}
          css={{ flex: "1" }}
          onClick={onWallop}
        >
          <Translate>Wallop</Translate>
        </Button>
        <Button css={{ flex: "2" }} onClick={onTest}>
          <Translate>Test</Translate>
        </Button>
      </div>
    </div>
  );
});
