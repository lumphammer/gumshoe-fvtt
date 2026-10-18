// Adapting to trauma (Fall of DELTA GREEN, p. 120, and the Extreme Violence
// inciting event, p. 050), as we've ruled on it (see
// docs/fodg-bonds-plan.md). Pure functions: keep Foundry out of this file.

import { maxBondPoints } from "./rules";

/** The kinds of trauma an Agent can adapt to (never the Unnatural) */
export type Adaptation = "violence" | "helplessness";

export const adaptations: Adaptation[] = ["violence", "helplessness"];

/** Boxes on the sheet: the last one ticked means adapted */
export const adaptationThreshold = 3;

/** Adapted to Violence caps some Interpersonal ratings at this */
export const adaptedToViolenceRatingCap = 1;

/** ...which caps Bonds at this */
export const adaptedToViolenceBondCap = 2;

/** What Adapted to Helplessness takes off each refresh */
export const adaptedToHelplessnessRefreshPenalty = 1;

export function isAdapted(progress: number): boolean {
  return progress >= adaptationThreshold;
}

/**
 * Progress after clicking a box (1-based), like a tracker: clicking a ticked
 * box clears it and any after it, clicking an empty one ticks it and any
 * before it.
 */
export function getProgressAfterClick(progress: number, box: number): number {
  return progress >= box ? box - 1 : box;
}

/** The highest a Bond can go: 2 when Adapted to Violence */
export function getBondCap(adaptedToViolence: boolean): number {
  return adaptedToViolence ? adaptedToViolenceBondCap : maxBondPoints;
}

/** A rating within the cap, if there is one */
export function getCappedRating(rating: number, cap: number | null): number {
  return cap === null ? rating : Math.min(cap, rating);
}

/**
 * A pool after a refresh. Normally that's the rating. Adapted to
 * Helplessness gains a point fewer, so a pool already within a point of its
 * rating gains nothing; a pool above the rating comes down to it either way.
 */
export function getRefreshedPool({
  pool,
  rating,
  adaptedToHelplessness,
}: {
  pool: number;
  rating: number;
  adaptedToHelplessness: boolean;
}): number {
  if (!adaptedToHelplessness || pool >= rating) {
    return rating;
  }
  return Math.max(pool, rating - adaptedToHelplessnessRefreshPenalty);
}
