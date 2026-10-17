import { useContext, useState } from "react";

import { isPCActor } from "../../module/actors/pc";
import { rebuildDifficulty } from "../../module/bonds/rebuild";
import { rebuildBond } from "../../module/bonds/rebuildBond";
import type { BondItem } from "../../module/items/bond";
import { settings } from "../../settings/settings";
import { ThemeContext } from "../../themes/ThemeContext";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { SpendButtons } from "../inputs/SpendButtons";
import { Translate } from "../Translate";

/**
 * Rebuild a Bond between operations (Fall of DELTA GREEN, p. 128): a
 * Stability test at Difficulty 4, which can also take points from
 * Interpersonal abilities. Shown on the Bond's sheet, for ordinary Bonds
 * that aren't broken.
 */
export const RebuildBondPanel = ({ bond }: { bond: BondItem }) => {
  const theme = useContext(ThemeContext);
  const [stabilitySpend, setStabilitySpend] = useState(0);
  // points to spend from each ability, by id
  const [abilitySpends, setAbilitySpends] = useState<Record<string, number>>(
    {},
  );

  const actor = bond.actor;
  if (!isPCActor(actor) || !actor.system.canRebuildBond(bond)) {
    return null;
  }
  const stability = actor.system.getBondStabilityAbility();
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
  };

  return (
    <div data-testid="rebuild-bond-panel" css={{ gridColumn: "1/-1" }}>
      <InputGrid
        className={theme.panelClass}
        css={{ padding: "0.5em", ...theme.panelStyleSecondary }}
      >
        <GridFieldStacked>
          <Translate
            values={{
              AbilityName: stability?.name ?? "",
              Difficulty: String(rebuildDifficulty),
              Category: settings.bondRebuildSpendCategory.get(),
            }}
          >
            RebuildBondHint
          </Translate>
        </GridFieldStacked>
        <GridField label={stability?.name ?? ""} noTranslate>
          <SpendButtons
            value={stabilitySpend}
            onChange={setStabilitySpend}
            max={stability?.system.pool ?? 0}
          />
        </GridField>
        {abilities.map((ability) => (
          <GridField key={ability.id} label={ability.name ?? ""} noTranslate>
            <SpendButtons
              value={abilitySpends[ability.id ?? ""] ?? 0}
              onChange={(spend) =>
                setAbilitySpends((current) => ({
                  ...current,
                  [ability.id ?? ""]: spend,
                }))
              }
              max={ability.system.pool}
            />
          </GridField>
        ))}
        <GridFieldStacked>
          <Button onClick={onRebuild}>
            <i className="fa fa-heart" /> <Translate>Rebuild Bond</Translate>{" "}
            <i className="fa fa-dice" />
          </Button>
        </GridFieldStacked>
      </InputGrid>
    </div>
  );
};

RebuildBondPanel.displayName = "RebuildBondPanel";
