/**
 * Pure combat rules for resolving attacks against targets. Nothing in here
 * touches Foundry, so it can all be unit tested.
 *
 * Page references are to Fall of DELTA GREEN, but the wound bands and cover
 * modifiers are standard GUMSHOE.
 */

export const coverValues = ["exposed", "partial", "full"] as const;

export type Cover = (typeof coverValues)[number];

export type WoundState = "ok" | "hurt" | "seriouslyWounded" | "dead";

/** How an attack was fired (p. 100) */
export const fireModeValues = ["single", "burst", "fullAuto"] as const;

export type FireMode = (typeof fireModeValues)[number];

/**
 * What a weapon can do: single shots only; selective fire (single, burst, or
 * full-auto, declared before rolling); or always full-auto (machine guns).
 */
export const weaponFireModesValues = [
  "single",
  "selective",
  "alwaysAuto",
] as const;

export type WeaponFireModes = (typeof weaponFireModesValues)[number];

/** A three-round burst needs at least this many points spent (p. 100) */
export const burstMinimumSpend = 3;

/** Health at or below which you are Hurt (p. 094) */
export const hurtHealth = 0;
/** Health at or below which you are Seriously Wounded (p. 094) */
export const seriouslyWoundedHealth = -6;
/** Health at or below which you are dead (p. 095) */
export const deadHealth = -12;

/** Extra damage when gunfire would leave a human Hurt (p. 092) */
export const gunfireOnHumansExtraDamage = 6;

/** Standard GUMSHOE Hit Threshold, used when a target has no such stat */
export const defaultHitThreshold = 3;

export function getWoundState(health: number): WoundState {
  if (health <= deadHealth) return "dead";
  if (health <= seriouslyWoundedHealth) return "seriouslyWounded";
  if (health <= hurtHealth) return "hurt";
  return "ok";
}

/** p. 096 */
export function getCoverHitThresholdModifier(cover: Cover): number {
  switch (cover) {
    case "exposed":
      return -1;
    case "partial":
      return 0;
    case "full":
      return 1;
  }
}

/**
 * The Hit Threshold the attacker actually needs to meet. A Hurt attacker's
 * pain adds +1 to their opponents' Hit Thresholds (p. 094).
 */
export function getEffectiveHitThreshold({
  baseHitThreshold,
  cover,
  attackerIsHurt,
}: {
  baseHitThreshold: number;
  cover: Cover;
  attackerIsHurt: boolean;
}): number {
  return (
    baseHitThreshold +
    getCoverHitThresholdModifier(cover) +
    (attackerIsHurt ? 1 : 0)
  );
}

/**
 * A successful unmodified 6 with a margin of 5 or more is a critical hit
 * (p. 104).
 */
export function isCriticalHit({
  hitDie,
  hitTotal,
  hitThreshold,
}: {
  hitDie: number;
  hitTotal: number;
  hitThreshold: number;
}): boolean {
  return hitDie === 6 && hitTotal - hitThreshold >= 5;
}

/**
 * Three-round burst (p. 100): one extra bullet for each 3 points of margin
 * over the target's Hit Threshold, to a maximum of three bullets.
 */
export function getBurstBulletCount(margin: number): number {
  return 1 + Math.min(2, Math.floor(Math.max(0, margin) / 3));
}

/**
 * How many damage rolls are needed to resolve a hit: one per bullet, or two
 * for a critical hit.
 */
export function getRequiredDamageRollCount({
  isHit,
  isCritical,
  bulletCount = 1,
}: {
  isHit: boolean;
  isCritical: boolean;
  bulletCount?: number;
}): number {
  if (!isHit) return 0;
  return isCritical ? 2 : bulletCount;
}
