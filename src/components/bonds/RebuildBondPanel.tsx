import { useNavigationContext } from "@lumphammer/minirouter";
import { useState } from "react";

import * as constants from "../../constants";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { isPCActor } from "../../module/actors/pc";
import {
  getRebuildSpendAbilitiesIn,
  getStabilityAbilityIn,
  getStabilityTestDifficultyIn,
} from "../../module/actors/pcDerived";
import { rebuildDifficulty } from "../../module/bonds/rebuild";
import { rebuildBond } from "../../module/bonds/rebuildBond";
import { isBondBroken } from "../../module/bonds/rules";
import type { BondItem } from "../../module/items/bond";
import { isInvestigativeAbilityItem } from "../../module/items/investigativeAbility";
import { BondCapNote, getBondCapOf } from "./BondCapNote";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { SpendButtons } from "../inputs/SpendButtons";
import { Translate } from "../Translate";
import { ItemSheetLink } from "../ItemSheetLink";

/**
 * Rebuild a Bond between operations (Fall of DELTA GREEN, p. 128): a
 * Stability test at Difficulty 4, which can also take points from
 * Interpersonal abilities. A nested panel on the Bond's sheet, for ordinary
 * Bonds that aren't broken.
 */
export const RebuildBondPanel = ({ bond }: { bond: BondItem }) => {
  "use memo";

  const { navigate } = useNavigationContext();
  const [stabilitySpend, setStabilitySpend] = useState(0);
  // points to spend from each ability, by id
  const [abilitySpends, setAbilitySpends] = useState<Record<string, number>>(
    {},
  );

  const settings = useSettings((s) => s);
  const view = useItemSelector(bond, (snapshot) => {
    const system = snapshot.system as { points: number; isDeltaGreen: boolean };
    return {
      name: snapshot.name,
      // only ordinary Bonds that aren't broken (`PCModel#canRebuildBond`)
      isRebuildable: !system.isDeltaGreen && !isBondBroken(system.points),
    };
  });
  // the PC's: the spend rows show other items' pools
  const pc = useActorSnapshot(bond.actor, (actor) => {
    if (actor?.type !== constants.pc) return null;
    const pc = { system: actor.system, items: actor.items };
    const pool = (item: { system: unknown }) =>
      (item.system as { pool: number }).pool;
    const stability = getStabilityAbilityIn(actor.items, settings);
    return {
      stability: stability
        ? {
            id: stability._id ?? "",
            name: stability.name,
            pool: pool(stability),
          }
        : null,
      abilities: getRebuildSpendAbilitiesIn(actor.items, settings).map(
        (ability) => ({ id: ability._id ?? "", pool: pool(ability) }),
      ),
      difficulty: getStabilityTestDifficultyIn(pc, rebuildDifficulty, settings),
      bondCap: getBondCapOf(pc, settings),
    };
  });
  if (pc === null || pc.stability === null || !view.isRebuildable) {
    return null;
  }
  const { stability, abilities } = pc;
  // the live documents, for links and to spend from
  const actor = bond.actor;
  const liveStability = actor?.items.get(stability.id);

  const onRebuild = async () => {
    const actor = bond.actor;
    if (!isPCActor(actor)) return;
    await rebuildBond(actor, bond, {
      stability: stabilitySpend,
      abilities: abilities.flatMap(({ id }) => {
        const ability = actor.items.get(id);
        return isInvestigativeAbilityItem(ability)
          ? [{ ability, spend: abilitySpends[id] ?? 0 }]
          : [];
      }),
    });
    setStabilitySpend(0);
    setAbilitySpends({});
    // the result is in chat, and the Bond's points on the sheet
    navigate("here", "up");
  };

  return (
    <div data-testid="rebuild-bond-panel">
      <h2>
        <Translate values={{ BondName: view.name }}>
          RebuildingBondWithBondName
        </Translate>
      </h2>
      {/* outside the grid: spanning it, its width would squash the labels */}
      <p>
        <Translate
          values={{
            AbilityName: stability.name,
            Difficulty: String(pc.difficulty),
            Category: settings.bondRebuildSpendCategory,
          }}
        >
          RebuildBondHint
        </Translate>
      </p>
      <BondCapNote {...pc.bondCap} />
      <InputGrid>
        {/* noLabel: a label would pass clicks on the link to the buttons */}
        <GridField
          label={
            liveStability ? (
              <ItemSheetLink item={liveStability} />
            ) : (
              stability.name
            )
          }
          noLabel
        >
          <SpendButtons
            value={stabilitySpend}
            onChange={setStabilitySpend}
            max={stability.pool}
            disabled={stability.pool <= 0}
          />
        </GridField>
        {abilities.map((ability) => {
          const live = actor?.items.get(ability.id);
          return (
            <GridField
              key={ability.id}
              label={live && <ItemSheetLink item={live} />}
              noLabel
            >
              <SpendButtons
                value={abilitySpends[ability.id] ?? 0}
                onChange={(spend) => {
                  setAbilitySpends((current) => ({
                    ...current,
                    [ability.id]: spend,
                  }));
                }}
                max={ability.pool}
                // listed even when spent, so it's clear it's empty
                disabled={ability.pool <= 0}
              />
            </GridField>
          );
        })}
        <GridFieldStacked>
          <Button onClick={onRebuild}>
            <Translate>Rebuild Bond</Translate> <i className="fa fa-dice" />
          </Button>
        </GridFieldStacked>
      </InputGrid>
    </div>
  );
};

RebuildBondPanel.displayName = "RebuildBondPanel";
