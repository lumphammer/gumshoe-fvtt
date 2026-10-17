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
