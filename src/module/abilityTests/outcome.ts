// Resolving an ability test against a Difficulty. Pure functions: keep Foundry
// out of this file.

import type { StabilityState } from "../stability/states";
import { isShakenOrWorse, shakenDifficultyPenalty } from "../stability/states";

/** The usual Difficulty of a test */
export const standardDifficulty = 4;

export type TestOutcome = "successful6" | "success" | "failure" | "failed1";

export const testOutcomes: readonly TestOutcome[] = [
  "successful6",
  "success",
  "failure",
  "failed1",
];

/** A test succeeds if its total meets the Difficulty */
export function doesTestSucceed(total: number, difficulty: number): boolean {
  return total >= difficulty;
}

/**
 * A successful 6 is a success where the die shows 6; a failed 1 is a failure
 * where it shows 1 (Fall of DELTA GREEN, p. 080).
 */
export function getTestOutcome({
  die,
  total,
  difficulty,
}: {
  die: number;
  total: number;
  difficulty: number;
}): TestOutcome {
  if (doesTestSucceed(total, difficulty)) {
    return die === 6 ? "successful6" : "success";
  }
  return die === 1 ? "failed1" : "failure";
}

export function isSuccessfulOutcome(outcome: TestOutcome): boolean {
  return outcome === "successful6" || outcome === "success";
}

/**
 * Something which changes a test's Difficulty, recorded with its reason so the
 * card can say where the number came from.
 */
export type DifficultyModifier = {
  /** a Stability state: Shaken or worse (Fall of DELTA GREEN, p. 113) */
  kind: "stabilityState";
  state: StabilityState;
  amount: number;
};

export const difficultyModifierKinds = ["stabilityState"] as const;

export function getTestDifficulty(
  base: number,
  modifiers: readonly Pick<DifficultyModifier, "amount">[],
): number {
  return modifiers.reduce((total, { amount }) => total + amount, base);
}

/**
 * What changes the Difficulty of a test with a General ability, given the
 * tester's Stability state (null if they don't have one): +1 while Shaken or
 * worse (Fall of DELTA GREEN, p. 113)
 */
export function getGeneralTestDifficultyModifiers(
  state: StabilityState | null,
): DifficultyModifier[] {
  return state !== null && isShakenOrWorse(state)
    ? [{ kind: "stabilityState", state, amount: shakenDifficultyPenalty }]
    : [];
}
