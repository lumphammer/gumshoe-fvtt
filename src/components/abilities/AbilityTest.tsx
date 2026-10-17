import { useCallback, useContext, useState } from "react";

import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { isPCActor } from "../../module/actors/pc";
import { getMaxBondSpend } from "../../module/bonds/rules";
import { assertAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { Button } from "../inputs/Button";

import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { SpendButtons } from "../inputs/SpendButtons";
import { Translate } from "../Translate";

export const AbilityTest = () => {
  const { item } = useItemSheetContext();
  assertAbilityItem(item);
  const theme = useContext(ThemeContext);
  const [spend, setSpend] = useState(0);
  // points to spend from each Bond, by id
  const [bondSpends, setBondSpends] = useState<Record<string, number>>({});
  // Bonds live on the actor, not this item
  useRefreshOnActorItemChanges(item.actor);

  const isGeneral = isGeneralAbilityItem(item);
  const actor = item.actor;
  // Fall of DELTA GREEN: Bond points can go on Stability tests (p. 120)
  const bonds =
    isGeneral &&
    settings.useBonds.get() &&
    item.name === settings.bondStabilityAbility.get() &&
    isPCActor(actor)
      ? actor.system
          .getBonds()
          .filter((bond) => getMaxBondSpend(bond.system.points) > 0)
      : [];

  const handleClickTest = () => {
    void item.system.testAbility(
      spend,
      bonds.map((bond) => ({ bond, spend: bondSpends[bond.id ?? ""] ?? 0 })),
    );
    setSpend(0);
    setBondSpends({});
  };

  const handleClickSpend = useCallback(() => {
    void item.system.spendAbility(spend);
    setSpend(0);
  }, [item, spend]);

  // alongside Bonds, name the ability being spent (as the weapon sheet does)
  const spendLabel = bonds.length > 0 ? (item.name ?? undefined) : undefined;

  return (
    <InputGrid
      className={theme.panelClass}
      css={{
        padding: "0.5em",
        marginBottom: "0.5em",
        ...theme.panelStyleSecondary,
      }}
    >
      <GridField
        label={spendLabel ?? "Spend"}
        noTranslate={spendLabel !== undefined}
      >
        <SpendButtons
          value={spend}
          onChange={setSpend}
          max={item.system.pool}
        />
      </GridField>
      {bonds.map((bond) => (
        <GridField
          key={bond.id}
          label={`${bond.name} (${bond.system.points})`}
          noTranslate
        >
          <SpendButtons
            value={bondSpends[bond.id ?? ""] ?? 0}
            onChange={(bondSpend) =>
              setBondSpends((current) => ({
                ...current,
                [bond.id ?? ""]: bondSpend,
              }))
            }
            max={getMaxBondSpend(bond.system.points)}
          />
        </GridField>
      ))}
      <GridFieldStacked>
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Button
            css={{ flex: 1 }}
            disabled={spend === 0}
            onClick={handleClickSpend}
          >
            <Translate>{isGeneral ? "Simple Spend" : "Spend"}</Translate>
          </Button>
          {isGeneral && (
            <Button css={{ flex: 1 }} onClick={handleClickTest}>
              <Translate>Test</Translate> <i className="fa fa-dice" />
            </Button>
          )}
        </div>
      </GridFieldStacked>
    </InputGrid>
  );
};
