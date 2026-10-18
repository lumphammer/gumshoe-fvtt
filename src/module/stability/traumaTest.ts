// Foundry glue for Stability tests against trauma (Fall of DELTA GREEN,
// pp. 115–121). The rules are in `trauma.ts`.

import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { getTranslated } from "../../functions/getTranslated";
import type { PCActor } from "../actors/pc";
import { clampBondPoints, getMaxBondSpend } from "../bonds/rules";
import type { BondItem } from "../items/bond";
import { getStabilityState } from "./states";
import type { Trauma, TraumaTestRecord } from "./trauma";
import {
  didAdapt,
  getTraumaDifficulty,
  resolveTraumaTest,
  serializeTraumaTestRecord,
} from "./trauma";

/** Adapted to this trauma? (Never the Unnatural.) */
function isAdaptedTo(actor: PCActor, trauma: Trauma): boolean {
  return trauma !== "unnatural" && actor.system.isAdaptedTo(trauma);
}

/**
 * The Difficulty of a test against this trauma now: from the state before
 * anything's spent on it.
 */
export function getTraumaTestDifficulty(
  actor: PCActor,
  trauma: Trauma,
): number | null {
  const stability = actor.system.getBondStabilityAbility();
  if (stability === undefined) {
    return null;
  }
  return getTraumaDifficulty({
    trauma,
    adapted: isAdaptedTo(actor, trauma),
    state: getStabilityState(stability.system.pool),
  });
}

export type TraumaTestChoices = {
  trauma: Trauma;
  potentialLoss: number;
  /** points from the Stability ability */
  spend: number;
  /** Bond points spent on the test (p. 120) */
  bondSpends: { bond: BondItem; spend: number }[];
};

/**
 * Make a Stability test against trauma, and apply what it does: the loss,
 * a rating point on becoming Shattered, Sanity for an Unnatural shock, and
 * progress towards adapting. One chat card shows the lot.
 */
export async function traumaTest(
  actor: PCActor,
  { trauma, potentialLoss, spend, bondSpends }: TraumaTestChoices,
): Promise<void> {
  const stability = actor.system.getBondStabilityAbility();
  const bonds = actor.system.getBonds();
  const usedBondSpends = bondSpends.filter((bondSpend) => bondSpend.spend > 0);
  // the sheet only offers what's allowed, but it may be out of date
  if (
    stability === undefined ||
    !Number.isInteger(potentialLoss) ||
    potentialLoss < 0 ||
    spend < 0 ||
    spend > Math.max(0, stability.system.pool) ||
    usedBondSpends.some(
      ({ bond, spend }) =>
        !bonds.includes(bond) || spend > getMaxBondSpend(bond.system.points),
    )
  ) {
    ui.notifications?.warn(getTranslated("CantMakeTraumaTestLikeThat"));
    return;
  }

  const adapted = isAdaptedTo(actor, trauma);
  const shaken = getStabilityState(stability.system.pool) !== "steady";
  const difficulty = getTraumaDifficulty({
    trauma,
    adapted,
    state: getStabilityState(stability.system.pool),
  });
  const bondTotal = usedBondSpends.reduce((sum, { spend }) => sum + spend, 0);
  const roll = new Roll("1d6 + @spend + @bonds", {
    spend,
    bonds: bondTotal,
  });
  await roll.evaluate();
  const die = roll.dice[0]?.total ?? 0;
  const total = roll.total ?? 0;

  const adaptationBefore =
    trauma === "unnatural" ? 0 : actor.system.adaptations[trauma];
  const result = resolveTraumaTest({
    trauma,
    pool: stability.system.pool,
    rating: stability.system.rating,
    spend,
    total,
    difficulty,
    potentialLoss,
    adaptationProgress: adaptationBefore,
    sanityLostThisOperation: actor.system.unnaturalShockSanityLoss,
  });

  // the updates change these in place, so note them first
  const sanityAbility =
    result.sanityLoss > 0 ? actor.system.getSanityAbility() : undefined;
  const ratingAfter = stability.system.rating - result.ratingLoss;
  const sanityRatingAfter = sanityAbility
    ? Math.max(0, sanityAbility.system.rating - result.sanityLoss)
    : 0;
  const record: TraumaTestRecord = {
    trauma,
    difficulty,
    adapted,
    shaken,
    potentialLoss,
    die,
    total,
    succeeded: result.succeeded,
    spends: [
      { name: stability.name ?? "", spend },
      ...usedBondSpends.map(({ bond, spend }) => ({
        name: bond.name ?? "",
        spend,
      })),
    ].filter(({ spend }) => spend > 0),
    stability: {
      name: stability.name ?? "",
      before: stability.system.pool,
      after: result.poolAfter,
    },
    stateAfter: result.stateAfter,
    worsened: result.worsened,
    stabilityRating:
      result.ratingLoss > 0
        ? {
            name: stability.name ?? "",
            before: stability.system.rating,
            after: ratingAfter,
          }
        : null,
    sanity: sanityAbility
      ? {
          name: sanityAbility.name ?? "",
          before: sanityAbility.system.rating,
          after: sanityRatingAfter,
        }
      : null,
    adaptation:
      result.adaptationProgressAfter !== null &&
      result.adaptationProgressAfter !== adaptationBefore
        ? { before: adaptationBefore, after: result.adaptationProgressAfter }
        : null,
  };

  await actor.updateEmbeddedDocuments("Item", [
    {
      _id: stability.id,
      system: { pool: result.poolAfter, rating: ratingAfter },
    },
    ...usedBondSpends.map(({ bond, spend }) => ({
      _id: bond.id,
      system: { points: clampBondPoints(bond.system.points - spend) },
    })),
    ...(sanityAbility
      ? [
          {
            _id: sanityAbility.id,
            system: {
              rating: sanityRatingAfter,
              pool: Math.min(sanityAbility.system.pool, sanityRatingAfter),
            },
          },
        ]
      : []),
  ]);
  const actorChanges = {
    ...(record.adaptation && trauma !== "unnatural"
      ? { adaptations: { [trauma]: record.adaptation.after } }
      : {}),
    ...(result.sanityLostThisOperationAfter !==
    actor.system.unnaturalShockSanityLoss
      ? { unnaturalShockSanityLoss: result.sanityLostThisOperationAfter }
      : {}),
  };
  if (Object.keys(actorChanges).length > 0) {
    await actor.update({ system: actorChanges });
  }
  // the rules, not a choice, so no asking this time
  if (
    trauma === "violence" &&
    didAdapt(adaptationBefore, result.adaptationProgressAfter)
  ) {
    await actor.system.capRatingsForViolence();
  }

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor as Actor.Stored }),
    content: buildAbilityCardContent({
      [constants.htmlDataMode]: constants.htmlDataModeStabilityTest,
      [constants.htmlDataActorId]: actor.id,
      [constants.htmlDataImageUrl]: stability.img,
      [constants.htmlDataStabilityTest]: serializeTraumaTestRecord(record),
    }),
  });
}
