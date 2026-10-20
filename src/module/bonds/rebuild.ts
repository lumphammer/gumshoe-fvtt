// Rebuilding a Bond between operations (Fall of DELTA GREEN, p. 128). Pure
// functions: keep Foundry out of this file.

import { addBondPoints, maxBondPoints } from "./rules";

/** The Stability test to rebuild a Bond is at Difficulty 4 */
export const rebuildDifficulty = 4;

export type RebuildOutcome = "successful6" | "success" | "failure" | "failed1";

/**
 * A successful 6 is a success where the die shows 6; a failed 1 is a failure
 * where it shows 1 (p. 080).
 */
export function getRebuildOutcome({
  die,
  total,
  difficulty = rebuildDifficulty,
}: {
  die: number;
  total: number;
  difficulty?: number;
}): RebuildOutcome {
  if (total >= difficulty) {
    return die === 6 ? "successful6" : "success";
  }
  return die === 1 ? "failed1" : "failure";
}

/** How the Bond changes: +2 on a successful 6, +1 on a success, -1 on a failed 1 */
export function getRebuildBondChange(outcome: RebuildOutcome): number {
  switch (outcome) {
    case "successful6":
      return 2;
    case "success":
      return 1;
    case "failure":
      return 0;
    case "failed1":
      return -1;
  }
}

/** Whether the outcome refreshes some Stability, which needs another die */
export function doesRebuildRefreshStability(outcome: RebuildOutcome): boolean {
  return outcome === "successful6" || outcome === "success";
}

/**
 * Stability refreshed from the refresh die: d+0 on a successful 6, d-2
 * (minimum 1) on a success, nothing otherwise.
 */
export function getRebuildStabilityRefresh(
  outcome: RebuildOutcome,
  refreshDie: number,
): number {
  switch (outcome) {
    case "successful6":
      return refreshDie;
    case "success":
      return Math.max(1, refreshDie - 2);
    default:
      return 0;
  }
}

/**
 * Stability after the test: the points spent come off first, then the
 * refresh goes back on, but a refresh never takes the pool above the rating.
 */
export function getStabilityAfterRebuild({
  pool,
  rating,
  spend,
  refresh,
}: {
  pool: number;
  rating: number;
  spend: number;
  refresh: number;
}): number {
  const afterSpend = pool - spend;
  return Math.max(afterSpend, Math.min(rating, afterSpend + refresh));
}

/** The Bond after the test; gains stop at the cap (when Adapted to Violence) */
export function getBondAfterRebuild(
  points: number,
  outcome: RebuildOutcome,
  cap: number = maxBondPoints,
): number {
  return addBondPoints(points, getRebuildBondChange(outcome), cap);
}

/**
 * Everything the rebuild card shows, settled when it's rolled. Names are
 * stored rather than ids, so the card still reads correctly after a Bond or
 * ability is renamed or deleted.
 */
export type RebuildRecord = {
  bondName: string;
  difficulty: number;
  /** the test: what the die showed, and the total with points spent */
  die: number;
  total: number;
  outcome: RebuildOutcome;
  /** the Stability refresh die, if the outcome called for one */
  refreshDie: number | null;
  bondBefore: number;
  bondAfter: number;
  stabilityName: string;
  stabilityBefore: number;
  stabilityAfter: number;
  /** points spent on the test, Stability first */
  spends: { name: string; spend: number }[];
};

const outcomes: RebuildOutcome[] = [
  "successful6",
  "success",
  "failure",
  "failed1",
];

export function serializeRebuildRecord(record: RebuildRecord): string {
  return JSON.stringify(record);
}

/**
 * Read a rebuild record back from a chat card attribute, or null if it's
 * malformed: chat messages can't be fixed after the fact.
 */
export function parseRebuildRecord(text: string | null): RebuildRecord | null {
  if (!text) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const numbers = [
    "difficulty",
    "die",
    "total",
    "bondBefore",
    "bondAfter",
    "stabilityBefore",
    "stabilityAfter",
  ] as const;
  if (
    typeof record["bondName"] !== "string" ||
    typeof record["stabilityName"] !== "string" ||
    !outcomes.includes(record["outcome"] as RebuildOutcome) ||
    numbers.some((key) => typeof record[key] !== "number") ||
    (record["refreshDie"] !== null &&
      typeof record["refreshDie"] !== "number") ||
    !Array.isArray(record["spends"])
  ) {
    return null;
  }
  const spends = (record["spends"] as unknown[]).flatMap((spend) => {
    if (
      typeof spend === "object" &&
      spend !== null &&
      "name" in spend &&
      "spend" in spend &&
      typeof spend.name === "string" &&
      typeof spend.spend === "number" &&
      spend.spend > 0
    ) {
      return [{ name: spend.name, spend: spend.spend }];
    }
    return [];
  });
  return {
    bondName: record["bondName"],
    difficulty: record["difficulty"] as number,
    die: record["die"] as number,
    total: record["total"] as number,
    outcome: record["outcome"] as RebuildOutcome,
    refreshDie: record["refreshDie"],
    bondBefore: record["bondBefore"] as number,
    bondAfter: record["bondAfter"] as number,
    stabilityName: record["stabilityName"],
    stabilityBefore: record["stabilityBefore"] as number,
    stabilityAfter: record["stabilityAfter"] as number,
    spends,
  };
}
