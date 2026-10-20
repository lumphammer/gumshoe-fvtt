// Foundry glue for rebuilding a Bond between operations (Fall of DELTA GREEN,
// p. 128). The rules are in `rebuild.ts`.

import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { getTranslated } from "../../functions/getTranslated";
import { PoolTerm } from "../../fvtt-exports";
import type { PCActor } from "../actors/pc";
import type { BondItem } from "../items/bond";
import type { InvestigativeAbilityItem } from "../items/investigativeAbility";
import {
  doesRebuildRefreshStability,
  getBondAfterRebuild,
  getRebuildOutcome,
  getRebuildStabilityRefresh,
  getStabilityAfterRebuild,
  rebuildDifficulty,
  serializeRebuildRecord,
} from "./rebuild";

export type RebuildSpends = {
  /** points from the Bond Stability ability */
  stability: number;
  /** points from abilities in the rebuild category */
  abilities: { ability: InvestigativeAbilityItem; spend: number }[];
};

/**
 * Make the Stability test to rebuild a Bond, and apply the outcome: the Bond
 * goes up (or down, on a failed 1), Stability is refreshed on a success, and
 * the points spent come off. One chat card shows the lot.
 */
export async function rebuildBond(
  actor: PCActor,
  bond: BondItem,
  spends: RebuildSpends,
): Promise<void> {
  const stability = actor.system.getStabilityAbility();
  // the sheet only offers what's allowed, but it may be out of date
  const spendable = new Set(actor.system.getRebuildSpendAbilities());
  const abilitySpends = spends.abilities.filter(({ spend }) => spend > 0);
  if (
    stability === undefined ||
    bond.parent !== actor ||
    !actor.system.canRebuildBond(bond) ||
    spends.stability < 0 ||
    spends.stability > Math.max(0, stability.system.pool) ||
    abilitySpends.some(
      ({ ability, spend }) =>
        !spendable.has(ability) || spend > ability.system.pool,
    )
  ) {
    ui.notifications?.warn(getTranslated("CantRebuildBondLikeThat"));
    return;
  }

  const abilityTotal = abilitySpends.reduce(
    (total, { spend }) => total + spend,
    0,
  );
  const testRoll = new Roll("1d6 + @stability + @abilities", {
    stability: spends.stability,
    abilities: abilityTotal,
  });
  await testRoll.evaluate();
  const die = testRoll.dice[0]?.total ?? 0;
  const total = testRoll.total ?? 0;
  const outcome = getRebuildOutcome({ die, total });

  let refreshRoll: Roll | null = null;
  if (doesRebuildRefreshStability(outcome)) {
    refreshRoll = new Roll("1d6");
    await refreshRoll.evaluate();
  }
  const refreshDie = refreshRoll?.total ?? null;

  // the update changes these in place, so note them first
  const bondBefore = bond.system.points;
  const stabilityBefore = stability.system.pool;
  const bondAfter = getBondAfterRebuild(
    bondBefore,
    outcome,
    actor.system.getBondCap(),
  );
  const stabilityAfter = getStabilityAfterRebuild({
    pool: stabilityBefore,
    rating: stability.system.rating,
    spend: spends.stability,
    refresh: getRebuildStabilityRefresh(outcome, refreshDie ?? 0),
  });

  await actor.updateEmbeddedDocuments("Item", [
    { _id: bond.id, system: { points: bondAfter } },
    { _id: stability.id, system: { pool: stabilityAfter } },
    // spent Interpersonal points don't come back before the next operation:
    // vignettes happen after the end-of-operation refresh
    ...abilitySpends.map(({ ability, spend }) => ({
      _id: ability.id,
      system: { pool: ability.system.pool - spend },
    })),
  ]);

  const rolls = refreshRoll ? [testRoll, refreshRoll] : [testRoll];
  // one roll, so dice animations show both dice
  // @ts-expect-error fvtt-types
  const pool = PoolTerm.fromRolls(rolls);
  await Roll.fromTerms([pool]).toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor as Actor.Stored }),
    content: buildAbilityCardContent({
      [constants.htmlDataMode]: constants.htmlDataModeBondRebuild,
      [constants.htmlDataActorId]: actor.id,
      [constants.htmlDataImageUrl]: bond.img,
      [constants.htmlDataBondRebuild]: serializeRebuildRecord({
        bondName: bond.name ?? "",
        difficulty: rebuildDifficulty,
        die,
        total,
        outcome,
        refreshDie,
        bondBefore,
        bondAfter,
        stabilityName: stability.name ?? "",
        stabilityBefore,
        stabilityAfter,
        spends: [
          { name: stability.name ?? "", spend: spends.stability },
          ...abilitySpends.map(({ ability, spend }) => ({
            name: ability.name ?? "",
            spend,
          })),
        ].filter(({ spend }) => spend > 0),
      }),
    }),
  });
}
