// Foundry glue for forming DELTA GREEN Bonds after a team crisis (Fall of
// DELTA GREEN, p. 046). The rules are in `crisis.ts`.

import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { getTranslated } from "../../functions/getTranslated";
import { isDefaultActorImage } from "../../functions/isDefaultActorImage";
import { assertGame } from "../../functions/isGame";
import { isPartyActor } from "../actors/party";
import type { PCActor } from "../actors/pc";
import { isPCActor } from "../actors/pc";
import type { ActiveCharacterActor } from "../actors/types";
import { isActiveCharacterActor } from "../actors/types";
import type { BondItem } from "../items/bond";
import type {
  CrisisBond,
  CrisisLosses,
  CrisisPlan,
  CrisisRecord,
  CrisisTeammate,
} from "./crisis";
import {
  areCrisisLossesValid,
  crisisDifficulty,
  getBondAfterLoss,
  maxCrisisTeammates,
  planCrisis,
  serializeCrisisRecord,
} from "./crisis";
import { addBondPoints, clampBondPoints, getMaxBondSpend } from "./rules";

export function toCrisisBond(bond: BondItem): CrisisBond {
  return {
    id: bond.id ?? "",
    name: bond.name ?? "",
    points: bond.system.points,
    isDeltaGreen: bond.system.isDeltaGreen,
    actorUuid: bond.system.actorUuid ?? null,
  };
}

export function toCrisisTeammate(actor: Actor): CrisisTeammate {
  return { uuid: actor.uuid ?? "", name: actor.name ?? "" };
}

/**
 * Who could have been there: the other members of the Agent's parties, or,
 * if they're not in one, every other PC.
 */
export function getCrisisTeammateCandidates(
  actor: PCActor,
): ActiveCharacterActor[] {
  assertGame(game);
  const actors = game.actors?.contents ?? [];
  const partyMembers = actors
    .flatMap((a) => (isPartyActor(a) ? [a] : []))
    .filter((party) => party.system.getActorIds().includes(actor.id ?? ""))
    .flatMap((party) => party.system.getActors())
    .flatMap((a) => (isActiveCharacterActor(a) ? [a] : []));
  const candidates: ActiveCharacterActor[] =
    partyMembers.length > 0
      ? partyMembers
      : actors.flatMap((a) => (isPCActor(a) ? [a] : []));
  return [...new Set(candidates)]
    .filter((candidate) => candidate !== actor)
    .toSorted((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}

/** `spends`: Bond points to be spent on the test, by Bond id */
export function planTeamCrisis(
  actor: PCActor,
  teammates: Actor[],
  spends: Record<string, number> = {},
): CrisisPlan {
  return planCrisis(
    actor.system.getBonds().map(toCrisisBond),
    teammates.map(toCrisisTeammate),
    actor.system.getBondCap(),
    spends,
  );
}

export type TeamCrisisChoices = {
  teammates: Actor[];
  /** points from the Bond Stability ability */
  stabilitySpend: number;
  /** Bond points spent on the test (p. 120) */
  bondSpends: { bond: BondItem; spend: number }[];
  /** what the other Bonds lose on a failure, chosen in advance */
  losses: CrisisLosses;
};

/**
 * Make the Stability test after a team crisis and, on a failure, form and
 * strengthen DELTA GREEN Bonds with the teammates, and take the cost from
 * the other Bonds. One chat card shows the lot.
 */
export async function teamCrisis(
  actor: PCActor,
  { teammates, stabilitySpend, bondSpends, losses }: TeamCrisisChoices,
): Promise<void> {
  const stability = actor.system.getStabilityAbility();
  const bonds = actor.system.getBonds();
  const candidates = new Set<Actor>(getCrisisTeammateCandidates(actor));
  const usedBondSpends = bondSpends.filter(({ spend }) => spend > 0);
  // the panel only offers what's allowed, but it may be out of date
  const plan = planTeamCrisis(
    actor,
    teammates,
    Object.fromEntries(
      usedBondSpends.map(({ bond, spend }) => [bond.id ?? "", spend]),
    ),
  );
  if (
    stability === undefined ||
    teammates.length === 0 ||
    teammates.length > maxCrisisTeammates ||
    teammates.some((teammate) => !candidates.has(teammate)) ||
    stabilitySpend < 0 ||
    stabilitySpend > Math.max(0, stability.system.pool) ||
    usedBondSpends.some(
      ({ bond, spend }) =>
        !bonds.includes(bond) || spend > getMaxBondSpend(bond.system.points),
    ) ||
    !areCrisisLossesValid(plan, losses)
  ) {
    ui.notifications?.warn(getTranslated("CantMakeCrisisTestLikeThat"));
    return;
  }

  // from the state before anything's spent: +1 while Shaken (p. 113)
  const difficulty = actor.system.getStabilityTestDifficulty(crisisDifficulty);
  const bondTotal = usedBondSpends.reduce((sum, { spend }) => sum + spend, 0);
  const roll = new Roll("1d6 + @stability + @bonds", {
    stability: stabilitySpend,
    bonds: bondTotal,
  });
  await roll.evaluate();
  const die = roll.dice[0]?.total ?? 0;
  const total = roll.total ?? 0;
  const succeeded = total >= difficulty;

  // every Bond's points, as they go: spends come off first (they're part of
  // the test), then on a failure the changes and the losses
  const before = new Map(bonds.map((bond) => [bond, bond.system.points]));
  const points = new Map(before);
  for (const { bond, spend } of usedBondSpends) {
    points.set(bond, clampBondPoints((points.get(bond) ?? 0) - spend));
  }
  const reformed = new Set<BondItem>();
  const record: CrisisRecord = {
    difficulty,
    die,
    total,
    succeeded,
    spends: [
      { name: stability.name ?? "", spend: stabilitySpend },
      ...usedBondSpends.map(({ bond, spend }) => ({
        name: bond.name ?? "",
        spend,
      })),
    ].filter(({ spend }) => spend > 0),
    changes: [],
    losses: [],
  };
  const newBonds: object[] = [];

  if (!succeeded) {
    const byId = new Map(bonds.map((bond) => [bond.id ?? "", bond]));
    const teammatesByUuid = new Map(teammates.map((t) => [t.uuid, t]));
    for (const change of plan.changes) {
      if (change.kind === "new") {
        const teammate = teammatesByUuid.get(change.teammate.uuid);
        newBonds.push({
          type: constants.bond,
          name: change.teammate.name,
          ...(teammate && !isDefaultActorImage(teammate.img)
            ? { img: teammate.img }
            : {}),
          system: {
            points: change.after,
            isDeltaGreen: true,
            actorUuid: change.teammate.uuid,
          },
        });
        record.changes.push({
          kind: "new",
          name: change.teammate.name,
          before: null,
          after: change.after,
        });
        continue;
      }
      const bond = byId.get(change.bond.id);
      if (bond === undefined) {
        continue;
      }
      const current = points.get(bond) ?? 0;
      // a strengthened Bond goes up from wherever its spend left it
      const after =
        change.kind === "reform"
          ? change.after
          : addBondPoints(current, 1, actor.system.getBondCap());
      if (change.kind === "reform") {
        reformed.add(bond);
      }
      points.set(bond, after);
      record.changes.push({
        kind: change.kind,
        name: bond.name ?? "",
        before: before.get(bond) ?? 0,
        after,
      });
    }
    for (const [id, loss] of Object.entries(losses)) {
      const bond = byId.get(id);
      if (bond === undefined || loss <= 0) {
        continue;
      }
      const after = getBondAfterLoss(points.get(bond) ?? 0, loss);
      points.set(bond, after);
      record.losses.push({
        name: bond.name ?? "",
        before: before.get(bond) ?? 0,
        after,
      });
    }
  }

  await actor.updateEmbeddedDocuments("Item", [
    ...(stabilitySpend > 0
      ? [
          {
            _id: stability.id,
            system: { pool: stability.system.pool - stabilitySpend },
          },
        ]
      : []),
    ...bonds
      .filter((bond) => points.get(bond) !== before.get(bond))
      .map((bond) => ({
        _id: bond.id,
        system: {
          points: points.get(bond),
          // a re-formed Bond is a DELTA GREEN Bond now
          ...(reformed.has(bond) ? { isDeltaGreen: true } : {}),
        },
      })),
  ]);
  if (newBonds.length > 0) {
    await actor.createEmbeddedDocuments("Item", newBonds as never[]);
  }

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor as Actor.Stored }),
    content: buildAbilityCardContent({
      [constants.htmlDataMode]: constants.htmlDataModeBondCrisis,
      [constants.htmlDataActorId]: actor.id,
      [constants.htmlDataImageUrl]: constants.bondIcon,
      [constants.htmlDataBondCrisis]: serializeCrisisRecord(record),
    }),
  });
}
