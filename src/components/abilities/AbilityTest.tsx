import { useCallback, useContext, useState } from "react";
import { FaHeartCrack } from "react-icons/fa6";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { isPCActor } from "../../module/actors/pc";
import { doesSpendBreakBond, getMaxBondSpend } from "../../module/bonds/rules";
import { assertAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import type { Trauma } from "../../module/stability/trauma";
import { traumaLabels, traumas } from "../../module/stability/trauma";
import {
  getTraumaTestDifficulty,
  traumaTest,
} from "../../module/stability/traumaTest";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { SpendButtons } from "../inputs/SpendButtons";
import { ItemSheetLink } from "../ItemSheetLink";
import { Translate } from "../Translate";

/** the book's losses run from 1 to 8; a little room beyond */
const potentialLosses = Array.from({ length: 12 }, (_, i) => i + 1);

export const AbilityTest = () => {
  const { item } = useItemSheetContext();
  assertAbilityItem(item);
  const theme = useContext(ThemeContext);
  const [spend, setSpend] = useState(0);
  // points to spend from each Bond, by id
  const [bondSpends, setBondSpends] = useState<Record<string, number>>({});
  // a Stability test against trauma, or an ordinary test
  const [trauma, setTrauma] = useState<Trauma | "">("");
  const [potentialLoss, setPotentialLoss] = useState(1);
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
      ? // broken ones too, so nobody goes looking for them
        actor.system.getBonds()
      : [];

  // Fall of DELTA GREEN: Stability tests against trauma (pp. 115–121)
  const canTestTrauma =
    isGeneral &&
    settings.useStabilityStates.get() &&
    isPCActor(actor) &&
    actor.system.getBondStabilityAbility()?.id === item.id;
  const traumaDifficulty =
    canTestTrauma && trauma !== ""
      ? getTraumaTestDifficulty(actor, trauma)
      : null;

  const handleClickTest = async () => {
    const spends = bonds.map((bond) => ({
      bond,
      spend: bondSpends[bond.id ?? ""] ?? 0,
    }));
    const breaking = spends.filter(({ bond, spend }) =>
      doesSpendBreakBond(bond.system.points, spend),
    );
    if (breaking.length > 0) {
      const yes = await confirmADoodleDo({
        message: "SpendBreaksBondsConfirm",
        confirmText: "Test",
        cancelText: "Cancel",
        confirmIconClass: "fa-dice",
        resolveFalseOnCancel: true,
        values: {
          BondNames: new Intl.ListFormat(game.i18n?.lang).format(
            breaking.map(({ bond }) => bond.name ?? ""),
          ),
        },
      });
      if (!yes) {
        return;
      }
    }
    if (canTestTrauma && trauma !== "") {
      void traumaTest(actor, {
        trauma,
        potentialLoss,
        spend,
        bondSpends: spends,
      });
    } else {
      void item.system.testAbility(spend, spends);
    }
    setSpend(0);
    setBondSpends({});
  };

  const handleClickSpend = useCallback(() => {
    void item.system.confirmSpendAbility(spend);
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
      {canTestTrauma && (
        <>
          <GridField label="Trauma">
            <Select
              value={trauma}
              onChange={(e) => setTrauma(e.currentTarget.value as Trauma | "")}
              css={{ width: "100%" }}
            >
              <option value="">{getTranslated("None")}</option>
              {traumas.map((t) => (
                <option key={t} value={t}>
                  {getTranslated(traumaLabels[t])}
                </option>
              ))}
            </Select>
          </GridField>
          {trauma !== "" && (
            <GridField label="Potential loss">
              <div
                css={{ display: "flex", gap: "0.5em", alignItems: "center" }}
              >
                <Select
                  value={potentialLoss}
                  onChange={(e) =>
                    setPotentialLoss(Number(e.currentTarget.value))
                  }
                >
                  {potentialLosses.map((loss) => (
                    <option key={loss} value={loss}>
                      {loss}
                    </option>
                  ))}
                </Select>
                {traumaDifficulty !== null && (
                  <span data-testid="trauma-difficulty">
                    <Translate
                      values={{ Difficulty: String(traumaDifficulty) }}
                    >
                      DifficultyN
                    </Translate>
                  </span>
                )}
              </div>
            </GridField>
          )}
        </>
      )}
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
          label={
            <>
              <ItemSheetLink item={bond} />
              {/* no points: the enabled buttons say how many there are */}
              {bond.system.isBroken && (
                <>
                  {" "}
                  <FaHeartCrack
                    title={getTranslated("Broken")}
                    css={{ verticalAlign: "middle" }}
                  />
                </>
              )}
            </>
          }
          // a label would pass clicks on the link to the buttons
          noLabel
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
            disabled={bond.system.isBroken}
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
