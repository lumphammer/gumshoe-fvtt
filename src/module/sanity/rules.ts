// The cap on Sanity's rating (see docs/stability-settings-plan.md). Pure
// functions: keep Foundry out of this file.

/**
 * The highest Sanity's rating can go: the base (usually 10) less the cap
 * ability's rating (Cthulhu Mythos, The Unnatural), never below 0
 */
export function getSanityCap({
  base,
  capAbilityRating,
}: {
  base: number;
  capAbilityRating: number;
}): number {
  return Math.max(0, base - Math.max(0, capAbilityRating));
}
