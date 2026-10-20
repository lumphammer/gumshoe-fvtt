import { useNavigationContext } from "@lumphammer/minirouter";
import { useState } from "react";

import { isPCActor } from "../../module/actors/pc";
import { rebuildDifficulty } from "../../module/bonds/rebuild";
import { rebuildBond } from "../../module/bonds/rebuildBond";
import type { BondItem } from "../../module/items/bond";
import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import { settings } from "../../settings/settings";
import { BondCapNote } from "./BondCapNote";
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
  const { navigate } = useNavigationContext();
  const [stabilitySpend, setStabilitySpend] = useState(0);
  // points to spend from each ability, by id
  const [abilitySpends, setAbilitySpends] = useState<Record<string, number>>(
    {},
  );

  const actor = bond.actor;
  // the spend rows show other items' pools
  useRefreshOnActorItemChanges(actor);
  if (!isPCActor(actor) || !actor.system.canRebuildBond(bond)) {
    return null;
  }
  const stability = actor.system.getStabilityAbility();
  const abilities = actor.system.getRebuildSpendAbilities();

  const onRebuild = async () => {
    await rebuildBond(actor, bond, {
      stability: stabilitySpend,
      abilities: abilities.map((ability) => ({
        ability,
        spend: abilitySpends[ability.id ?? ""] ?? 0,
      })),
    });
    setStabilitySpend(0);
    setAbilitySpends({});
    // the result is in chat, and the Bond's points on the sheet
    navigate("here", "up");
  };

  return (
    <div data-testid="rebuild-bond-panel">
      <h2>
        <Translate values={{ BondName: bond.name ?? "" }}>
          RebuildingBondWithBondName
        </Translate>
      </h2>
      {/* outside the grid: spanning it, its width would squash the labels */}
      <p>
        <Translate
          values={{
            AbilityName: stability?.name ?? "",
            Difficulty: String(rebuildDifficulty),
            Category: settings.bondRebuildSpendCategory.get(),
          }}
        >
          RebuildBondHint
        </Translate>
      </p>
      <BondCapNote actor={actor} />
      <InputGrid>
        {/* noLabel: a label would pass clicks on the link to the buttons */}
        <GridField
          label={stability && <ItemSheetLink item={stability} />}
          noLabel
        >
          <SpendButtons
            value={stabilitySpend}
            onChange={setStabilitySpend}
            max={stability?.system.pool ?? 0}
            disabled={(stability?.system.pool ?? 0) <= 0}
          />
        </GridField>
        {abilities.map((ability) => (
          <GridField
            key={ability.id}
            label={<ItemSheetLink item={ability} />}
            noLabel
          >
            <SpendButtons
              value={abilitySpends[ability.id ?? ""] ?? 0}
              onChange={(spend) =>
                setAbilitySpends((current) => ({
                  ...current,
                  [ability.id ?? ""]: spend,
                }))
              }
              max={ability.system.pool}
              // listed even when spent, so it's clear it's empty
              disabled={ability.system.pool <= 0}
            />
          </GridField>
        ))}
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
