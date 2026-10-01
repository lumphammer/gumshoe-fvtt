import type { Lethality, LethalityResult } from "./lethality";
import { resolveLethality } from "./lethality";
import type { WoundState } from "./rules";
import { getWoundState, gunfireOnHumansExtraDamage } from "./rules";
import type { DamageRollRecord } from "./types";

/**
 * One instance of damage: either plain damage, or a Lethality die which might
 * kill or wound outright.
 */
export type DamageInstance =
  | { kind: "damage"; amount: number }
  | { kind: "lethality"; die: number; lethality: Lethality; immune: boolean };

/**
 * Turn damage rolls into instances of damage.
 *
 * Normally a critical hit adds two rolls together into a single instance
 * (p. 104), so armor applies to it once. Adding two Lethality dice together
 * means nothing, though, so with Lethality a critical hit is two separate
 * Lethality rolls - two chances, as with Shot Dry's "extra chances for
 * Lethality" (p. 101).
 *
 * Otherwise, each bullet is its own instance (a burst's bullets are applied
 * one after another, p. 100).
 *
 * Lethality uses the raw die, not the weapon's damage total.
 */
export function getDamageInstances({
  rolls,
  isCritical,
  bulletCount = 1,
  lethality,
  immuneToLethality,
}: {
  rolls: DamageRollRecord[];
  isCritical: boolean;
  bulletCount?: number;
  lethality: Lethality | null;
  immuneToLethality: boolean;
}): DamageInstance[] {
  const needed = isCritical ? 2 : bulletCount;
  if (rolls.length < needed) return [];
  const used = rolls.slice(0, needed);
  if (lethality) {
    return used.map((roll) => ({
      kind: "lethality",
      die: roll.die,
      lethality,
      immune: immuneToLethality,
    }));
  }
  if (isCritical) {
    const amount = used.reduce((sum, roll) => sum + roll.total, 0);
    return [{ kind: "damage", amount }];
  }
  return used.map((roll) => ({ kind: "damage", amount: roll.total }));
}

export type DamageStep = {
  instance: DamageInstance;
  /** for Lethality instances, what the die did */
  lethality: LethalityResult | null;
  /** damage before armor (for Lethality, only the damage band has any) */
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
 * Armor is subtracted from each instance of plain damage (p. 095), and from
 * the damage band of Lethality. Statblocks in the books write armor as a
 * negative number ("Armor -1") while the system stat is usually entered as
 * positive, so we take its magnitude either way.
 *
 * Gunfire on humans (p. 092): any instance of gunfire which would leave a
 * human Hurt (0 to -5) does an extra 6 points - including a Lethality "Hurt"
 * result.
 */
export function resolveDamage({
  startingHealth,
  instances,
  armor,
  applyGunfireOnHumans,
}: {
  startingHealth: number;
  instances: DamageInstance[];
  armor: number;
  applyGunfireOnHumans: boolean;
}): DamageResult {
  const armorValue = Math.abs(armor);
  let health = startingHealth;
  const steps = instances.map((instance): DamageStep => {
    const healthBefore = health;
    let lethality: LethalityResult | null = null;
    let rolled: number;
    let armorReduction: number;
    let healthAfter: number;

    if (instance.kind === "lethality") {
      lethality = resolveLethality({
        lethality: instance.lethality,
        die: instance.die,
        healthBefore,
        armor: armorValue,
        immune: instance.immune,
      });
      rolled = lethality.rolledDamage;
      armorReduction = lethality.armorReduction;
      healthAfter = lethality.healthAfter;
    } else {
      rolled = instance.amount;
      const taken = Math.max(0, rolled - armorValue);
      armorReduction = rolled - taken;
      healthAfter = healthBefore - taken;
    }

    let gunfireExtra = 0;
    if (
      applyGunfireOnHumans &&
      healthAfter < healthBefore &&
      getWoundState(healthAfter) === "hurt"
    ) {
      gunfireExtra = gunfireOnHumansExtraDamage;
      healthAfter -= gunfireExtra;
    }
    health = healthAfter;
    return {
      instance,
      lethality,
      rolled,
      armorReduction,
      gunfireExtra,
      healthBefore,
      healthAfter,
    };
  });
  return { steps, finalHealth: health, woundState: getWoundState(health) };
}
