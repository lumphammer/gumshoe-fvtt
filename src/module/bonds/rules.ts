// Fall of DELTA GREEN Bond rules (pp. 045–046, 120, 128). Pure functions: keep
// Foundry out of this file.

/** The strongest a Bond can be (p. 045) */
export const maxBondPoints = 4;

/** A Bond that drops to this is permanently broken (p. 046) */
export const brokenBondPoints = -1;

/** Keep a Bond's points between broken and the maximum */
export function clampBondPoints(points: number): number {
  return Math.min(maxBondPoints, Math.max(brokenBondPoints, points));
}

export function isBondBroken(points: number): boolean {
  return points <= brokenBondPoints;
}

type SortableBond = {
  name: string;
  isDeltaGreen: boolean;
};

/**
 * Order Bonds for display: ordinary Bonds first, then DELTA GREEN Bonds, each
 * by name.
 */
export function compareBonds(a: SortableBond, b: SortableBond): number {
  if (a.isDeltaGreen !== b.isDeltaGreen) {
    return a.isDeltaGreen ? 1 : -1;
  }
  return a.name.localeCompare(b.name);
}

/**
 * The most points that can be spent from a Bond with these points. Spending
 * can take a Bond down to broken (p. 120): a desperate measure, but allowed.
 */
export function getMaxBondSpend(points: number): number {
  return Math.max(0, points - brokenBondPoints);
}

/** Would spending this many points break a Bond that isn't broken yet? */
export function doesSpendBreakBond(points: number, spend: number): boolean {
  return spend > 0 && !isBondBroken(points) && isBondBroken(points - spend);
}

/** Bond points per Stability point when burning a Bond (p. 120) */
export const bondPointsPerBurnedStability = 2;

/**
 * Can this Bond be burned for a Stability point? It needs the points (down
 * to broken), and burning only restores lost Stability, so not above the
 * rating.
 */
export function canBurnBond({
  bondPoints,
  stabilityPool,
  stabilityRating,
}: {
  bondPoints: number;
  stabilityPool: number;
  stabilityRating: number;
}): boolean {
  return (
    getMaxBondSpend(bondPoints) >= bondPointsPerBurnedStability &&
    stabilityPool < stabilityRating
  );
}

/**
 * A Bond's points after a change. Gains stop at the cap (2 when Adapted to
 * Violence), but a Bond already above it keeps its points (p. 050: "leave
 * your Bond strengths as they are now").
 */
export function addBondPoints(
  points: number,
  change: number,
  cap: number = maxBondPoints,
): number {
  const after = clampBondPoints(points + change);
  return change > 0 ? Math.max(points, Math.min(cap, after)) : after;
}
