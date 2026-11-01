import { useNavigationContext } from "@lumphammer/minirouter";
import { useState } from "react";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { getTranslated } from "../../functions/getTranslated";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import type { PCActor } from "../../module/actors/pc";
import {
  getBondPointsOf,
  getNeglectableBondsIn,
  getRebuildSpendAbilitiesIn,
  getReformableBondsIn,
  getStabilityAbilityIn,
} from "../../module/actors/pcDerived";
import { isBondItem } from "../../module/items/bond";
import { isInvestigativeAbilityItem } from "../../module/items/investigativeAbility";
import {
  establishCost,
  getNeglectedBondPoints,
} from "../../module/bonds/establish";
import { establishBond } from "../../module/bonds/establishBond";
import { isBondBroken } from "../../module/bonds/rules";
import { BondCapNote, getBondCapOf } from "./BondCapNote";
import { Button } from "../inputs/Button";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { TextInput } from "../inputs/TextInput";
import { Hint } from "../inputs/Hint";
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
  "use memo";

  const { navigate } = useNavigationContext();
  const settings = useSettings((s) => s);
  // the Bonds tab above is memoised, so this reads what it shows itself
  const view = useActorSnapshot(actor, (snapshot) => {
    const items = snapshot?.items ?? [];
    const pc = { system: snapshot?.system, items };
    const bondOf = (bond: (typeof items)[number]) => ({
      id: bond._id ?? "",
      name: bond.name,
      points: getBondPointsOf(bond).points,
    });
    return {
      reformable: getReformableBondsIn(items).map(bondOf),
      neglectable: getNeglectableBondsIn(items).map(bondOf),
      abilities: getRebuildSpendAbilitiesIn(items, settings).map((a) => ({
        id: a._id ?? "",
        name: a.name,
        pool: (a.system as { pool: number }).pool,
      })),
      stabilityName: getStabilityAbilityIn(items, settings)?.name ?? "",
      bondCap: getBondCapOf(pc, settings),
    };
  });
  const [whoId, setWhoId] = useState(someoneNew);
  const [name, setName] = useState("");
  const [abilityId, setAbilityId] = useState<string | null>(null);
  const [neglectId, setNeglectId] = useState<string | null>(null);

  const { reformable, abilities, neglectable } = view;

  // until something's chosen (or if the choice has gone), take the first
  // that will do
  const reform = reformable.find((bond) => bond.id === whoId) ?? null;
  const ability =
    abilities.find((a) => a.id === abilityId && a.pool >= establishCost) ??
    abilities.find((a) => a.pool >= establishCost);
  const neglect =
    neglectable.find((bond) => bond.id === neglectId) ?? neglectable[0] ?? null;

  const bondName = reform ? reform.name : name.trim();
  const canEstablish = bondName !== "" && ability !== undefined;
  const noPointsMessage =
    ability === undefined
      ? getTranslated("NoCategoryPointsToEstablishBond", {
          Category: settings.bondRebuildSpendCategory,
        })
      : undefined;

  const onEstablish = async () => {
    if (ability === undefined) {
      return;
    }
    if (
      neglect !== null &&
      isBondBroken(getNeglectedBondPoints(neglect.points))
    ) {
      const yes = await confirmADoodleDo({
        message: "NeglectBreaksBondConfirm",
        confirmText: "Establish Bond",
        cancelText: "Cancel",
        confirmIconClass: "fa-dice",
        resolveFalseOnCancel: true,
        values: { BondName: neglect.name },
      });
      if (!yes) {
        return;
      }
    }
    // the live items, to write to
    const liveReform = reform && actor.items.get(reform.id);
    const liveAbility = actor.items.get(ability.id);
    const liveNeglect = neglect && actor.items.get(neglect.id);
    if (
      !isInvestigativeAbilityItem(liveAbility) ||
      (liveReform !== null && !isBondItem(liveReform)) ||
      (liveNeglect !== null && !isBondItem(liveNeglect))
    ) {
      return;
    }
    await establishBond(actor, {
      who: liveReform ? { reform: liveReform } : { name },
      ability: liveAbility,
      neglect: liveNeglect,
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
            Category: settings.bondRebuildSpendCategory,
            AbilityName: view.stabilityName,
          }}
        >
          EstablishBondHint
        </Translate>
      </p>
      <BondCapNote {...view.bondCap} />
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
                <option key={bond.id} value={bond.id}>
                  {getTranslated("BondNameBroken", {
                    BondName: bond.name,
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
                value={a.id}
                // listed even when spent, so it's clear it's empty
                disabled={a.pool < establishCost}
              >
                {a.name} ({a.pool})
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
              value={neglect.id}
              onChange={(e) => setNeglectId(e.currentTarget.value)}
            >
              {neglectable.map((bond) => (
                <option key={bond.id} value={bond.id}>
                  {bond.name} ({bond.points} →{" "}
                  {getNeglectedBondPoints(bond.points)})
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
            <Translate>Establish Bond</Translate> <i className="fa fa-dice" />
          </Button>
        </GridFieldStacked>
        {/* below the button, as on the weapon sheet */}
        {noPointsMessage && (
          <GridFieldStacked>
            <Hint severity="danger">{noPointsMessage}</Hint>
          </GridFieldStacked>
        )}
      </InputGrid>
    </div>
  );
};

EstablishBondPanel.displayName = "EstablishBondPanel";
