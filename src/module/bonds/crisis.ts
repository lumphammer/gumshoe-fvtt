// Forming DELTA GREEN Bonds after a team crisis (Fall of DELTA GREEN, p. 046),
// as we've ruled on it (see docs/fodg-bonds-plan.md). Pure functions: keep
// Foundry out of this file.

import { clampBondPoints, isBondBroken, maxBondPoints } from "./rules";

/** The Stability test after a crisis is at Difficulty 4 */
export const crisisDifficulty = 4;

/** Bonds form with at most five teammates */
export const maxCrisisTeammates = 5;

export type CrisisBond = {
  id: string;
  name: string;
  points: number;
  isDeltaGreen: boolean;
  actorUuid: string | null;
};

export type CrisisTeammate = { uuid: string; name: string };

/**
 * What a failed test does for one teammate: a new DELTA GREEN Bond, a broken
 * Bond with them re-formed (which counts as new), or an existing Bond
 * strengthened.
 */
export type CrisisChange =
  | { kind: "new"; teammate: CrisisTeammate; after: number }
  | {
      kind: "reform" | "strengthen";
      teammate: CrisisTeammate;
      bond: CrisisBond;
      after: number;
    };

/** A Bond which can pay the cost, and the most it can lose (to broken) */
export type CrisisLossCandidate = { bond: CrisisBond; maxLoss: number };

export type CrisisPlan = {
  /** a new Bond's rating: half the highest current Bond, rounded up */
  newRating: number;
  changes: CrisisChange[];
  /** points owed: 1 for any new Bonds, plus 1 per Bond strengthened */
  lossesOwed: number;
  /** what can actually be paid, if the other Bonds run out */
  lossesRequired: number;
  candidates: CrisisLossCandidate[];
};

/**
 * Half the highest current Bond, rounded up (DELTA GREEN Bonds count too). No
 * Bonds, or only broken ones, makes 0.
 */
export function getNewDeltaGreenBondRating(bonds: CrisisBond[]): number {
  const highest = Math.max(0, ...bonds.map((bond) => bond.points));
  return Math.ceil(highest / 2);
}

/**
 * The Bond the Agent already has with a teammate, if any: linked to their
 * actor, preferring an unbroken DELTA GREEN one, then any unbroken one, then a
 * broken one (which a failed test re-forms).
 */
export function findBondWith(
  bonds: CrisisBond[],
  teammate: CrisisTeammate,
): CrisisBond | undefined {
  const linked = bonds.filter((bond) => bond.actorUuid === teammate.uuid);
  return (
    linked.find((bond) => bond.isDeltaGreen && !isBondBroken(bond.points)) ??
    linked.find((bond) => !isBondBroken(bond.points)) ??
    linked[0]
  );
}

/**
 * Work out everything a failed test would do, before any of it happens: the
 * rating for new Bonds comes from the Bonds as they are now.
 */
export function planCrisis(
  bonds: CrisisBond[],
  teammates: CrisisTeammate[],
): CrisisPlan {
  const newRating = getNewDeltaGreenBondRating(bonds);
  const changes = teammates.map((teammate): CrisisChange => {
    const bond = findBondWith(bonds, teammate);
    if (bond === undefined) {
      return { kind: "new", teammate, after: newRating };
    }
    if (isBondBroken(bond.points)) {
      return { kind: "reform", teammate, bond, after: newRating };
    }
    return {
      kind: "strengthen",
      teammate,
      bond,
      after: Math.min(maxBondPoints, bond.points + 1),
    };
  });
  const isNew = changes.some(
    (change) => change.kind === "new" || change.kind === "reform",
  );
  const strengthened = changes.filter(
    (change) => change.kind === "strengthen",
  ).length;
  const lossesOwed = (isNew ? 1 : 0) + strengthened;

  // the cost comes from the other, ordinary Bonds: not the ones this crisis
  // is about
  const involved = new Set(
    changes.flatMap((change) => ("bond" in change ? [change.bond.id] : [])),
  );
  const candidates = bonds
    .filter(
      (bond) =>
        !bond.isDeltaGreen &&
        !isBondBroken(bond.points) &&
        !involved.has(bond.id),
    )
    .map((bond) => ({ bond, maxLoss: bond.points + 1 }));
  const available = candidates.reduce((sum, c) => sum + c.maxLoss, 0);

  return {
    newRating,
    changes,
    lossesOwed,
    lossesRequired: Math.min(lossesOwed, available),
    candidates,
  };
}

/** points to take from each candidate Bond, by id */
export type CrisisLosses = Record<string, number>;

export function getTotalLosses(losses: CrisisLosses): number {
  return Object.values(losses).reduce((sum, points) => sum + points, 0);
}

/**
 * Whether the losses pay exactly what's required, each from a candidate Bond
 * and no more than it can lose.
 */
export function areCrisisLossesValid(
  plan: CrisisPlan,
  losses: CrisisLosses,
): boolean {
  const byId = new Map(plan.candidates.map((c) => [c.bond.id, c]));
  return (
    Object.entries(losses).every(([id, points]) => {
      const candidate = byId.get(id);
      return (
        Number.isInteger(points) &&
        points >= 0 &&
        (points === 0 ||
          (candidate !== undefined && points <= candidate.maxLoss))
      );
    }) && getTotalLosses(losses) === plan.lossesRequired
  );
}

/** A Bond after losing points, which can break it */
export function getBondAfterLoss(points: number, loss: number): number {
  return clampBondPoints(points - loss);
}

/**
 * Everything the card shows, settled when it's rolled. Names are stored
 * rather than ids, so the card still reads correctly after anything is
 * renamed or deleted.
 */
export type CrisisRecord = {
  difficulty: number;
  die: number;
  total: number;
  succeeded: boolean;
  /** points spent on the test, Stability first */
  spends: { name: string; spend: number }[];
  /** on a failure, the Bonds formed or strengthened */
  changes: {
    kind: CrisisChange["kind"];
    name: string;
    before: number | null;
    after: number;
  }[];
  /** on a failure, what the other Bonds lost */
  losses: { name: string; before: number; after: number }[];
};

export function serializeCrisisRecord(record: CrisisRecord): string {
  return JSON.stringify(record);
}

const kinds = ["new", "reform", "strengthen"];

function isRecordObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/**
 * Read a record back from a chat card attribute, or null if it's malformed:
 * chat messages can't be fixed after the fact.
 */
export function parseCrisisRecord(text: string | null): CrisisRecord | null {
  if (!text) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    !isRecordObject(parsed) ||
    typeof parsed["difficulty"] !== "number" ||
    typeof parsed["die"] !== "number" ||
    typeof parsed["total"] !== "number" ||
    typeof parsed["succeeded"] !== "boolean" ||
    !Array.isArray(parsed["spends"]) ||
    !Array.isArray(parsed["changes"]) ||
    !Array.isArray(parsed["losses"])
  ) {
    return null;
  }
  const spends = parsed["spends"];
  const changes = parsed["changes"];
  const losses = parsed["losses"];
  if (
    !spends.every(
      (s) =>
        isRecordObject(s) &&
        typeof s["name"] === "string" &&
        typeof s["spend"] === "number",
    ) ||
    !changes.every(
      (c) =>
        isRecordObject(c) &&
        kinds.includes(c["kind"] as string) &&
        typeof c["name"] === "string" &&
        (c["before"] === null || typeof c["before"] === "number") &&
        typeof c["after"] === "number",
    ) ||
    !losses.every(
      (l) =>
        isRecordObject(l) &&
        typeof l["name"] === "string" &&
        typeof l["before"] === "number" &&
        typeof l["after"] === "number",
    )
  ) {
    return null;
  }
  return {
    difficulty: parsed["difficulty"],
    die: parsed["die"],
    total: parsed["total"],
    succeeded: parsed["succeeded"],
    spends: spends as CrisisRecord["spends"],
    changes: changes as CrisisRecord["changes"],
    losses: losses as CrisisRecord["losses"],
  };
}

/**
 * A GM's call for a team crisis: who was there. Each Agent among them makes
 * their own test.
 */
export type CrisisCall = { members: CrisisTeammate[] };

export function serializeCrisisCall(call: CrisisCall): string {
  return JSON.stringify(call);
}

/** Read a call back from a chat card attribute, or null if it's malformed */
export function parseCrisisCall(text: string | null): CrisisCall | null {
  if (!text) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    !isRecordObject(parsed) ||
    !Array.isArray(parsed["members"]) ||
    !parsed["members"].every(
      (m) =>
        isRecordObject(m) &&
        typeof m["uuid"] === "string" &&
        typeof m["name"] === "string",
    )
  ) {
    return null;
  }
  return { members: parsed["members"] as CrisisTeammate[] };
}
