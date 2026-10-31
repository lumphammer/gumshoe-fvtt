// Adapting to trauma (Fall of DELTA GREEN, p. 120, and the Extreme Violence
// inciting event, p. 050), as we've ruled on it (see
// docs/fodg-bonds-plan.md), for configurable trauma types (see
// docs/stability-settings-plan.md). Pure functions: keep Foundry out of this
// file.

import type { TraumaType } from "@lumphammer/investigator-fvtt-types";

import { maxBondPoints } from "./rules";

/** Boxes on the sheet: the last one ticked means adapted */
export const adaptationThreshold = 3;

/** Adapting caps some ratings at this (Violence: Interpersonal ones) */
export const adaptedRatingCap = 1;

/** ...and may cap Bonds at this */
export const adaptedBondCap = 2;

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

/** The highest a Bond can go: 2 when adapted to something which caps them */
export function getBondCap(capped: boolean): number {
  return capped ? adaptedBondCap : maxBondPoints;
}

/** Progress towards adapting to each trauma type, by id: missing is 0 */
export type AdaptationProgress = Record<string, number>;

export type AdaptationEffects = {
  /** abilities whose ratings are capped */
  cappedAbilities: string[];
  capsBonds: boolean;
  /** off each refresh, all the adaptations' penalties together */
  refreshPenalty: number;
};

/** The trauma types an Agent has adapted to */
export function getAdaptedTypes<
  T extends Pick<TraumaType, "id" | "useAdaptation">,
>(types: readonly T[], progress: Readonly<AdaptationProgress>): T[] {
  return types.filter(
    (type) => type.useAdaptation && isAdapted(progress[type.id] ?? 0),
  );
}

/** What everything an Agent has adapted to does, together */
export function getAdaptationEffects(
  types: TraumaType[],
  progress: AdaptationProgress,
): AdaptationEffects {
  const adapted = getAdaptedTypes(types, progress);
  return {
    cappedAbilities: [
      ...new Set(adapted.flatMap((type) => type.cappedAbilities)),
    ],
    capsBonds: adapted.some((type) => type.capsBonds),
    refreshPenalty: adapted.reduce(
      (sum, type) => sum + Math.max(0, type.refreshPenalty),
      0,
    ),
  };
}

/** A rating within the cap, if there is one */
export function getCappedRating(rating: number, cap: number | null): number {
  return cap === null ? rating : Math.min(cap, rating);
}

/**
 * A pool after a refresh. Normally that's the rating. A refresh penalty
 * (e.g. 1 when Adapted to Helplessness) gains that many points fewer, so a
 * pool already within the penalty of its rating gains nothing; a pool above
 * the rating comes down to it either way.
 */
export function getRefreshedPool({
  pool,
  rating,
  refreshPenalty,
}: {
  pool: number;
  rating: number;
  refreshPenalty: number;
}): number {
  if (refreshPenalty <= 0 || pool >= rating) {
    return rating;
  }
  return Math.max(pool, rating - refreshPenalty);
}
