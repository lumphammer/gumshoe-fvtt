// Foundry glue for establishing a new Bond (Fall of DELTA GREEN, p. 129). The
// rules are in `establish.ts`.

import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { getTranslated } from "../../functions/getTranslated";
import type { PCActor } from "../actors/pc";
import type { BondItem } from "../items/bond";
import type { InvestigativeAbilityItem } from "../items/investigativeAbility";
import type { EstablishRecord } from "./establish";
import {
  doesEstablishRefund,
  establishCost,
  establishRejectionStabilityLoss,
  getEstablishedBondPoints,
  getEstablishOutcome,
  getNeglectedBondPoints,
  serializeEstablishRecord,
} from "./establish";

export type EstablishBondChoices = {
  /** who the new Bond is with: a new name, or a broken Bond to re-form */
  who: { name: string } | { reform: BondItem };
  /** where the Interpersonal point comes from */
  ability: InvestigativeAbilityItem;
  /** the Bond neglected for this one; null only if there's none to neglect */
  neglect: BondItem | null;
};

/**
 * Try to establish a new Bond: spend the point, neglect another Bond, roll the
 * die, and apply the outcome. One chat card shows the lot.
 */
export async function establishBond(
  actor: PCActor,
  { who, ability, neglect }: EstablishBondChoices,
): Promise<void> {
  // the panel only offers what's allowed, but it may be out of date
  const neglectable = actor.system.getNeglectableBonds();
  const reform = "reform" in who ? who.reform : null;
  const name = reform ? (reform.name ?? "") : "name" in who ? who.name : "";
  if (
    name.trim() === "" ||
    (reform !== null && !actor.system.getReformableBonds().includes(reform)) ||
    !actor.system.getRebuildSpendAbilities().includes(ability) ||
    ability.system.pool < establishCost ||
    (neglect === null ? neglectable.length > 0 : !neglectable.includes(neglect))
  ) {
    ui.notifications?.warn(getTranslated("CantEstablishBondLikeThat"));
    return;
  }

  const roll = new Roll("1d6");
  await roll.evaluate();
  const die = roll.total ?? 0;
  const outcome = getEstablishOutcome(die);
  const bondPoints = getEstablishedBondPoints(die, actor.system.getBondCap());
  const stability =
    outcome === "rejected" ? actor.system.getBondStabilityAbility() : undefined;

  // the updates change these in place, so note them first
  const record: EstablishRecord = {
    bondName: name.trim(),
    die,
    outcome,
    bondPoints,
    reformed: reform !== null,
    abilityName: ability.name ?? "",
    neglected: neglect && {
      name: neglect.name ?? "",
      before: neglect.system.points,
      after: getNeglectedBondPoints(neglect.system.points),
    },
    stability: stability
      ? {
          name: stability.name ?? "",
          before: stability.system.pool,
          after: stability.system.pool - establishRejectionStabilityLoss,
        }
      : null,
  };

  await actor.updateEmbeddedDocuments("Item", [
    // on a 6 the point comes straight back; otherwise it doesn't refresh
    // before the next operation
    ...(doesEstablishRefund(outcome)
      ? []
      : [
          {
            _id: ability.id,
            system: { pool: ability.system.pool - establishCost },
          },
        ]),
    ...(neglect && record.neglected
      ? [{ _id: neglect.id, system: { points: record.neglected.after } }]
      : []),
    ...(stability && record.stability
      ? [{ _id: stability.id, system: { pool: record.stability.after } }]
      : []),
    ...(reform && bondPoints !== null
      ? [{ _id: reform.id, system: { points: bondPoints } }]
      : []),
  ]);
  if (reform === null && bondPoints !== null) {
    await actor.createEmbeddedDocuments("Item", [
      {
        type: constants.bond,
        name: record.bondName,
        system: { points: bondPoints },
      },
    ]);
  }

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor as Actor.Stored }),
    content: buildAbilityCardContent({
      [constants.htmlDataMode]: constants.htmlDataModeBondEstablish,
      [constants.htmlDataActorId]: actor.id,
      [constants.htmlDataImageUrl]: reform?.img ?? constants.bondIcon,
      [constants.htmlDataBondEstablish]: serializeEstablishRecord(record),
    }),
  });
}
