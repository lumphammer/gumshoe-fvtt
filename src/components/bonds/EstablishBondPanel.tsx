import { useNavigationContext } from "@lumphammer/minirouter";
import { useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import type { PCActor } from "../../module/actors/pc";
import {
  establishCost,
  getNeglectedBondPoints,
} from "../../module/bonds/establish";
import { establishBond } from "../../module/bonds/establishBond";
import { isBondBroken } from "../../module/bonds/rules";
import { settings } from "../../settings/settings";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { TextInput } from "../inputs/TextInput";
import { WeaponHint } from "../equipment/WeaponHint";
import { Translate } from "../Translate";

/**
 * Full width, so a long Bond name shrinks the dropdown (and is cut off)
 * rather than pushing the panel out sideways
 */
const selectCss = { width: "100%" };

/** the "who" choice for someone new, rather than a broken Bond */
const someoneNew = "";

/**
 * Establish a new Bond between operations (Fall of DELTA GREEN, p. 129):
 * spend an Interpersonal point, neglect another Bond, and roll a die. A nested
 * panel on the Bonds tab.
 */
export const EstablishBondPanel = ({ actor }: { actor: PCActor }) => {
  const { navigate } = useNavigationContext();
  // the choices refer to other items, which can change under us
  useRefreshOnActorItemChanges(actor);
  const [whoId, setWhoId] = useState(someoneNew);
  const [name, setName] = useState("");
  const [abilityId, setAbilityId] = useState<string | null>(null);
  const [neglectId, setNeglectId] = useState<string | null>(null);

  const reformable = actor.system.getReformableBonds();
  const abilities = actor.system.getRebuildSpendAbilities();
  const neglectable = actor.system.getNeglectableBonds();

  // until something's chosen (or if the choice has gone), take the first
  // that will do
  const reform = reformable.find((bond) => bond.id === whoId) ?? null;
  const ability =
    abilities.find(
      (a) => a.id === abilityId && a.system.pool >= establishCost,
    ) ?? abilities.find((a) => a.system.pool >= establishCost);
  const neglect =
    neglectable.find((bond) => bond.id === neglectId) ?? neglectable[0] ?? null;

  const bondName = reform ? (reform.name ?? "") : name.trim();
  const canEstablish = bondName !== "" && ability !== undefined;
  const noPointsMessage =
    ability === undefined
      ? getTranslated("NoCategoryPointsToEstablishBond", {
          Category: settings.bondRebuildSpendCategory.get(),
        })
      : undefined;

  const onEstablish = async () => {
    if (ability === undefined) {
      return;
    }
    if (
      neglect !== null &&
      isBondBroken(getNeglectedBondPoints(neglect.system.points))
    ) {
      const yes = await confirmADoodleDo({
        message: "NeglectBreaksBondConfirm",
        confirmText: "Establish Bond",
        cancelText: "Cancel",
        confirmIconClass: "fa-dice",
        resolveFalseOnCancel: true,
        values: { BondName: neglect.name ?? "" },
      });
      if (!yes) {
        return;
      }
    }
    await establishBond(actor, {
      who: reform ? { reform } : { name },
      ability,
      neglect,
    });
    // the result is in chat, and on the Bonds tab
    navigate("here", "up");
  };

  return (
    <div data-testid="establish-bond-panel">
      <h2>
        <Translate>Establish a New Bond</Translate>
      </h2>
      {/* outside the grid: spanning it, its width would squash the labels */}
      <p>
        <Translate
          values={{
            Category: settings.bondRebuildSpendCategory.get(),
            AbilityName: actor.system.getBondStabilityAbility()?.name ?? "",
          }}
        >
          EstablishBondHint
        </Translate>
      </p>
      <InputGrid>
        {reformable.length > 0 && (
          <GridField label="Who">
            <Select
              css={selectCss}
              value={whoId}
              onChange={(e) => setWhoId(e.currentTarget.value)}
            >
              <option value={someoneNew}>{getTranslated("Someone new")}</option>
              {reformable.map((bond) => (
                <option key={bond.id} value={bond.id ?? ""}>
                  {getTranslated("BondNameBroken", {
                    BondName: bond.name ?? "",
                  })}
                </option>
              ))}
            </Select>
          </GridField>
        )}
        {reform === null && (
          <GridField label="Person Name">
            <TextInput value={name} onChange={setName} />
          </GridField>
        )}
        <GridField label="Spend">
          <Select
            css={selectCss}
            // with nothing to spend, show the first (empty) one, not a blank
            value={ability?.id ?? abilities[0]?.id ?? ""}
            onChange={(e) => setAbilityId(e.currentTarget.value)}
          >
            {abilities.map((a) => (
              <option
                key={a.id}
                value={a.id ?? ""}
                // listed even when spent, so it's clear it's empty
                disabled={a.system.pool < establishCost}
              >
                {a.name} ({a.system.pool})
              </option>
            ))}
          </Select>
        </GridField>
        <GridField label="Neglect">
          {neglect === null ? (
            <i>
              <Translate>No Bond to neglect</Translate>
            </i>
          ) : (
            <Select
              css={selectCss}
              value={neglect.id ?? ""}
              onChange={(e) => setNeglectId(e.currentTarget.value)}
            >
              {neglectable.map((bond) => (
                <option key={bond.id} value={bond.id ?? ""}>
                  {bond.name} ({bond.system.points} →{" "}
                  {getNeglectedBondPoints(bond.system.points)})
                </option>
              ))}
            </Select>
          )}
        </GridField>
        <GridFieldStacked>
          <Button
            onClick={onEstablish}
            disabled={!canEstablish}
            title={noPointsMessage}
          >
            <Translate title={noPointsMessage}>Establish Bond</Translate>{" "}
            <i className="fa fa-dice" />
          </Button>
        </GridFieldStacked>
        {/* below the button, as on the weapon sheet */}
        {noPointsMessage && (
          <GridFieldStacked>
            <WeaponHint severity="danger">{noPointsMessage}</WeaponHint>
          </GridFieldStacked>
        )}
      </InputGrid>
    </div>
  );
};

EstablishBondPanel.displayName = "EstablishBondPanel";
