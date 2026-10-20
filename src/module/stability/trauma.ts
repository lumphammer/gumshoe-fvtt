// Stability tests against trauma (Fall of DELTA GREEN, pp. 115–121), as
// we've ruled on them (see docs/fodg-stability-plan.md), for configurable
// trauma types (see docs/stability-settings-plan.md). Pure functions: keep
// Foundry out of this file.

import { adaptationThreshold, isAdapted } from "../bonds/adaptation";
import type { StabilityState, StabilityThresholds } from "./states";
import { getStabilityState, isShakenOrWorse, isWorseState } from "./states";

/** Shaken (or worse) adds this to General tests */
export const shakenDifficultyPenalty = 1;

/** Stability rating lost on becoming Shattered */
export const shatteredRatingLoss = 1;

/** Sanity rating lost to a shock, by the state it causes */
export function getShockSanityLoss(state: StabilityState): number {
  switch (state) {
    case "shaken":
      return 1;
    case "shattered":
      return 2;
    default:
      return 0;
  }
}

export function getTraumaDifficulty({
  difficulty,
  adaptedDifficulty,
  adapted,
  state,
}: {
  difficulty: number;
  adaptedDifficulty: number;
  /** adapted to this trauma */
  adapted: boolean;
  /** the state before the test */
  state: StabilityState;
}): number {
  return (
    (adapted ? adaptedDifficulty : difficulty) +
    (isShakenOrWorse(state) ? shakenDifficultyPenalty : 0)
  );
}

/**
 * The state for a pool, or steady if states are off (null thresholds):
 * then nobody's ever Shaken, Shattered or Gone.
 */
export function getTraumaState(
  pool: number,
  thresholds: StabilityThresholds | null,
): StabilityState {
  return thresholds === null ? "steady" : getStabilityState(pool, thresholds);
}

export type TraumaTestInput = {
  /** the trauma type can be adapted to */
  adaptable: boolean;
  /** the trauma type's shocks cost Sanity */
  causesSanityLoss: boolean;
  /** the Stability states' thresholds, or null if states are off */
  thresholds: StabilityThresholds | null;
  /** Stability pool and rating before the test */
  pool: number;
  rating: number;
  /** Stability points spent on the test (Bond points don't come off it) */
  spend: number;
  /** the roll's total, with everything spent */
  total: number;
  difficulty: number;
  potentialLoss: number;
  /** progress towards adapting to this trauma */
  adaptationProgress: number;
  /** Sanity rating already lost to shocks this operation */
  sanityLostThisOperation: number;
};

export type TraumaTestResult = {
  succeeded: boolean;
  /** lost to the failure, on top of the spend */
  loss: number;
  poolAfter: number;
  /** the state after spending, and after the loss */
  stateBefore: StabilityState;
  stateAfter: StabilityState;
  /** whether the loss made things worse */
  worsened: boolean;
  /** Stability rating lost (newly Shattered) */
  ratingLoss: number;
  /** adaptation progress after, or null if this trauma doesn't count */
  adaptationProgressAfter: number | null;
  /** Sanity rating lost to a shock */
  sanityLoss: number;
  /** what this operation's shocks have cost after this one */
  sanityLostThisOperationAfter: number;
};

/** Work out everything a Stability test against trauma does */
export function resolveTraumaTest(input: TraumaTestInput): TraumaTestResult {
  const succeeded = input.total >= input.difficulty;
  const afterSpend = input.pool - input.spend;
  const loss = succeeded ? 0 : Math.max(0, input.potentialLoss);
  const poolAfter = afterSpend - loss;
  const stateBefore = getTraumaState(afterSpend, input.thresholds);
  const stateAfter = getTraumaState(poolAfter, input.thresholds);
  const worsened = isWorseState(stateAfter, stateBefore);

  // Gone without passing through Shattered: the Agent's lost anyway
  const ratingLoss =
    worsened && stateAfter === "shattered" ? shatteredRatingLoss : 0;

  // three losses in a row without becoming Shaken; any loss that leaves the
  // Agent Shaken or worse starts again. Successes don't count either way.
  let adaptationProgressAfter: number | null = null;
  if (input.adaptable && !isAdapted(input.adaptationProgress)) {
    adaptationProgressAfter =
      loss === 0
        ? input.adaptationProgress
        : isShakenOrWorse(stateAfter)
          ? 0
          : Math.min(adaptationThreshold, input.adaptationProgress + 1);
  }

  // only the worst shock each operation costs Sanity
  const shock =
    input.causesSanityLoss && worsened ? getShockSanityLoss(stateAfter) : 0;
  const sanityLostThisOperationAfter = Math.max(
    input.sanityLostThisOperation,
    shock,
  );
  const sanityLoss =
    sanityLostThisOperationAfter - input.sanityLostThisOperation;

  return {
    succeeded,
    loss,
    poolAfter,
    stateBefore,
    stateAfter,
    worsened,
    ratingLoss,
    adaptationProgressAfter,
    sanityLoss,
    sanityLostThisOperationAfter,
  };
}

/** Whether a test just adapted the Agent (which may cap ratings) */
export function didAdapt(before: number, after: number | null): boolean {
  return after !== null && !isAdapted(before) && isAdapted(after);
}

type Change = { name: string; before: number; after: number };

/**
 * Everything the card shows, settled when it's rolled. Names are stored
 * rather than ids, so the card still reads correctly after an ability is
 * renamed or deleted.
 */
export type TraumaTestRecord = {
  /** the trauma type's name */
  trauma: string;
  difficulty: number;
  /** what went into the Difficulty */
  adapted: boolean;
  shaken: boolean;
  potentialLoss: number;
  die: number;
  total: number;
  succeeded: boolean;
  /** points spent on the test, Stability first, then Bonds */
  spends: { name: string; spend: number }[];
  /** the Stability pool, from before the spend to after the loss */
  stability: Change;
  stateAfter: StabilityState;
  /** whether the loss made the state worse */
  worsened: boolean;
  /** the Stability rating, if it dropped (newly Shattered) */
  stabilityRating: Change | null;
  /** the Sanity rating, if a shock cost some */
  sanity: Change | null;
  /** adaptation progress, if it changed */
  adaptation: { before: number; after: number } | null;
};

export function serializeTraumaTestRecord(record: TraumaTestRecord): string {
  return JSON.stringify(record);
}

function isChange(value: unknown): value is Change {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "before" in value &&
    "after" in value &&
    typeof value.name === "string" &&
    typeof value.before === "number" &&
    typeof value.after === "number"
  );
}

const states: StabilityState[] = ["steady", "shaken", "shattered", "gone"];

/**
 * Read a record back from a chat card attribute, or null if it's malformed:
 * chat messages can't be fixed after the fact.
 */
export function parseTraumaTestRecord(
  text: string | null,
): TraumaTestRecord | null {
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
  const numbers = ["difficulty", "potentialLoss", "die", "total"] as const;
  const booleans = ["adapted", "shaken", "succeeded", "worsened"] as const;
  const adaptation = record["adaptation"];
  if (
    typeof record["trauma"] !== "string" ||
    !states.includes(record["stateAfter"] as StabilityState) ||
    numbers.some((key) => typeof record[key] !== "number") ||
    booleans.some((key) => typeof record[key] !== "boolean") ||
    !isChange(record["stability"]) ||
    (record["stabilityRating"] !== null &&
      !isChange(record["stabilityRating"])) ||
    (record["sanity"] !== null && !isChange(record["sanity"])) ||
    (adaptation !== null &&
      !(
        typeof adaptation === "object" &&
        "before" in adaptation &&
        "after" in adaptation &&
        typeof adaptation.before === "number" &&
        typeof adaptation.after === "number"
      )) ||
    !Array.isArray(record["spends"])
  ) {
    return null;
  }
  const spends = (record["spends"] as unknown[]).flatMap((spend) =>
    typeof spend === "object" &&
    spend !== null &&
    "name" in spend &&
    "spend" in spend &&
    typeof spend.name === "string" &&
    typeof spend.spend === "number" &&
    spend.spend > 0
      ? [{ name: spend.name, spend: spend.spend }]
      : [],
  );
  return {
    trauma: record["trauma"],
    difficulty: record["difficulty"] as number,
    adapted: record["adapted"] as boolean,
    shaken: record["shaken"] as boolean,
    potentialLoss: record["potentialLoss"] as number,
    die: record["die"] as number,
    total: record["total"] as number,
    succeeded: record["succeeded"] as boolean,
    spends,
    stability: record["stability"],
    stateAfter: record["stateAfter"] as StabilityState,
    worsened: record["worsened"] as boolean,
    stabilityRating: record["stabilityRating"],
    sanity: record["sanity"],
    adaptation: adaptation as { before: number; after: number } | null,
  };
}
