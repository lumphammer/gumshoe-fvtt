/**
 * Pure combat rules for resolving attacks against targets. Nothing in here
 * touches Foundry, so it can all be unit tested.
 *
 * Page references are to Fall of DELTA GREEN, but the wound bands and cover
 * modifiers are standard GUMSHOE.
 */

export type Cover = "exposed" | "partial" | "full";

export type WoundState = "ok" | "hurt" | "seriouslyWounded" | "dead";

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
 * How many damage rolls are needed to resolve a hit.
 */
export function getRequiredDamageRollCount({
  isHit,
  isCritical,
}: {
  isHit: boolean;
  isCritical: boolean;
}): number {
  if (!isHit) return 0;
  return isCritical ? 2 : 1;
}

/**
 * Turn damage rolls into instances of damage. A critical hit adds two rolls
 * together into a single instance (p. 104), so armor applies to it once.
 */
export function getDamageInstances({
  rolls,
  isCritical,
}: {
  rolls: number[];
  isCritical: boolean;
}): number[] {
  if (rolls.length === 0) return [];
  if (isCritical) {
    if (rolls.length < 2) return [];
    return [rolls[0] + rolls[1]];
  }
  return [rolls[0]];
}

export type DamageStep = {
  /** damage before armor */
  rolled: number;
  /** damage actually taken from armor */
  armorReduction: number;
  /** extra damage from the gunfire-on-humans rule */
  gunfireExtra: number;
  healthBefore: number;
  healthAfter: number;
};

export type DamageResult = {
  steps: DamageStep[];
  finalHealth: number;
  woundState: WoundState;
};

/**
 * Apply instances of damage, in order, to a target's Health.
 *
 * Armor is subtracted from each instance (p. 095). Statblocks in the books
 * write armor as a negative number ("Armor -1") while the system stat is
 * usually entered as positive, so we take its magnitude either way.
 *
 * Gunfire on humans (p. 092): any instance of gunfire damage which would leave
 * a human Hurt (0 to -5) does an extra 6 points.
 */
export function resolveDamage({
  startingHealth,
  instances,
  armor,
  applyGunfireOnHumans,
}: {
  startingHealth: number;
  instances: number[];
  armor: number;
  applyGunfireOnHumans: boolean;
}): DamageResult {
  const armorValue = Math.abs(armor);
  let health = startingHealth;
  const steps = instances.map((rolled): DamageStep => {
    const healthBefore = health;
    const taken = Math.max(0, rolled - armorValue);
    let healthAfter = healthBefore - taken;
    let gunfireExtra = 0;
    if (
      applyGunfireOnHumans &&
      taken > 0 &&
      getWoundState(healthAfter) === "hurt"
    ) {
      gunfireExtra = gunfireOnHumansExtraDamage;
      healthAfter -= gunfireExtra;
    }
    health = healthAfter;
    return {
      rolled,
      armorReduction: rolled - taken,
      gunfireExtra,
      healthBefore,
      healthAfter,
    };
  });
  return { steps, finalHealth: health, woundState: getWoundState(health) };
}
