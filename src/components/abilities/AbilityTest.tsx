import { memo, useCallback, useContext, useState } from "react";
import { FaHeartCrack } from "react-icons/fa6";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { isPCActor } from "../../module/actors/pc";
import {
  getBondPointsOf,
  getBondsIn,
  getStabilityAbilityIn,
  getTraumaTestDifficultyIn,
} from "../../module/actors/pcDerived";
import { doesSpendBreakBond, getMaxBondSpend } from "../../module/bonds/rules";
import type { AbilitySnapshot } from "../../module/items/abilitySnapshots";
import { isGeneralAbilitySnapshot } from "../../module/items/abilitySnapshots";
import { isBondItem } from "../../module/items/bond";
import type { AbilityItem } from "../../module/items/exports";
import {
  areBondsOn,
  getTraumaTypes,
  getTraumaTypesFrom,
} from "../../module/stability/settings";
import { traumaTest } from "../../module/stability/traumaTest";
import { ThemeContext } from "../../themes/ThemeContext";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { SpendButtons } from "../inputs/SpendButtons";
import { EmbeddedItemSheetLink } from "../ItemSheetLink";
import { Translate } from "../Translate";

/** the book's losses run from 1 to 8; a little room beyond */
const potentialLosses = Array.from({ length: 12 }, (_, i) => i + 1);

interface AbilityTestProps {
  /** Only to write through: read from `ability`. */
  item: AbilityItem;
  ability: AbilitySnapshot;
}

export const AbilityTest = memo(function AbilityTest({
  item,
  ability,
}: AbilityTestProps) {
  const theme = useContext(ThemeContext);
  const methods = useSystemMethods(item);
  const settings = useSettings((s) => s);
  const [spend, setSpend] = useState(0);
  // points to spend from each Bond, by id
  const [bondSpends, setBondSpends] = useState<Record<string, number>>({});
  // a Stability test against trauma, or an ordinary test
  // by trauma type id
  const [traumaId, setTraumaId] = useState("");
  const [potentialLoss, setPotentialLoss] = useState(1);

  const isGeneral = isGeneralAbilitySnapshot(ability);
  const actor = item.actor;
  // Fall of DELTA GREEN: Stability tests against trauma (pp. 115–121)
  const traumaTypes = getTraumaTypesFrom(settings);
  // the type may have gone from settings since it was picked
  const pickedTrauma = traumaTypes.find(({ id }) => id === traumaId);

  // Bonds live on the actor, not this item
  const fromActor = useActorSnapshot(actor, (snapshot) => {
    const isStability =
      isGeneral &&
      snapshot !== null &&
      isPCActor(actor) &&
      getStabilityAbilityIn(snapshot.items, settings)?._id === ability._id;
    return {
      isStability,
      // Fall of DELTA GREEN: Bond points can go on Stability tests (p. 120)
      bonds:
        isStability && areBondsOn(settings)
          ? // broken ones too, so nobody goes looking for them
            getBondsIn(snapshot.items).map((bond) => ({
              _id: bond._id,
              name: bond.name,
              ...getBondPointsOf(bond),
            }))
          : [],
      traumaDifficulty:
        isStability && pickedTrauma !== undefined
          ? getTraumaTestDifficultyIn(snapshot, pickedTrauma, settings)
          : null,
    };
  });
  const { isStability, bonds } = fromActor;
  const canTestTrauma =
    isStability && isPCActor(actor) && traumaTypes.length > 0;
  const trauma = canTestTrauma ? pickedTrauma : undefined;
  const traumaDifficulty = canTestTrauma ? fromActor.traumaDifficulty : null;

  const handleClickTest = async () => {
    // test with the live Bonds (the test re-checks what they can spare)
    const spends = bonds.flatMap((bond) => {
      const live = actor?.items.get(bond._id ?? "");
      return isBondItem(live)
        ? [{ bond: live, spend: bondSpends[bond._id ?? ""] ?? 0 }]
        : [];
    });
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
    const liveTrauma =
      trauma && getTraumaTypes().find(({ id }) => id === trauma.id);
    if (canTestTrauma && liveTrauma !== undefined && isPCActor(actor)) {
      void traumaTest(actor, {
        trauma: liveTrauma,
        potentialLoss,
        spend,
        bondSpends: spends,
      });
    } else {
      void methods.testAbility(spend, spends);
    }
    setSpend(0);
    setBondSpends({});
  };

  const { confirmSpendAbility } = methods;
  const handleClickSpend = useCallback(() => {
    void confirmSpendAbility(spend);
    setSpend(0);
  }, [confirmSpendAbility, spend]);

  // alongside Bonds, name the ability being spent (as the weapon sheet does)
  const spendLabel = bonds.length > 0 ? ability.name : undefined;

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
              value={trauma?.id ?? ""}
              onChange={(e) => setTraumaId(e.currentTarget.value)}
              css={{ width: "100%" }}
            >
              <option value="">{getTranslated("None")}</option>
              {traumaTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </GridField>
          {trauma !== undefined && (
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
          max={ability.system.pool}
        />
      </GridField>
      {bonds.map((bond) => (
        <GridField
          key={bond._id}
          label={
            <>
              <EmbeddedItemSheetLink
                actor={actor}
                id={bond._id}
                name={bond.name}
              />
              {/* no points: the enabled buttons say how many there are */}
              {bond.isBroken && (
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
            value={bondSpends[bond._id ?? ""] ?? 0}
            onChange={(bondSpend) =>
              setBondSpends((current) => ({
                ...current,
                [bond._id ?? ""]: bondSpend,
              }))
            }
            max={getMaxBondSpend(bond.points)}
            disabled={bond.isBroken}
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
});
