import type { Lethality } from "./lethality";
import { applyCoverToLethality } from "./lethality";
import type { DamageInstance, DamageResult } from "./resolveDamage";
import { getDamageInstances, resolveDamage } from "./resolveDamage";
import {
  defaultHitThreshold,
  getEffectiveHitThreshold,
  getRequiredDamageRollCount,
  getBurstBulletCount,
  isCriticalHit,
} from "./rules";
import type { AttackData, AttackTargetData } from "./types";

/** Live information about the target, read from its actor */
export type TargetActorInfo = {
  hitThreshold: number | null;
  armor: number | null;
  health: number | null;
  isHuman: boolean;
  immuneToLethality: boolean;
};

export type ResolveOptions = {
  useCriticalHits: boolean;
  useGunfireOnHumans: boolean;
  useLethality: boolean;
};

export type ResolvedAttackTarget = {
  hitThreshold: number;
  isHit: boolean;
  isCritical: boolean;
  /** how many bullets hit: 1, or up to 3 for a burst */
  bulletCount: number;
  /** damage rolls still needed before this hit can be resolved */
  missingRollCount: number;
  armor: number;
  /** the attack's Lethality after cover, or null if it has none */
  lethality: Lethality | null;
  /** what each damage roll does; empty for a miss or missing rolls */
  instances: DamageInstance[];
  /** null for a miss, missing rolls, or a target without Health */
  damage: DamageResult | null;
};

/**
 * Work out everything about one target of an attack. Pure, so the card and the
 * apply logic agree, and so it can be tested.
 */
export function resolveAttackTarget(
  attack: AttackData,
  target: AttackTargetData,
  info: TargetActorInfo,
  { useCriticalHits, useGunfireOnHumans, useLethality }: ResolveOptions,
): ResolvedAttackTarget {
  const hitThreshold = getEffectiveHitThreshold({
    baseHitThreshold: info.hitThreshold ?? defaultHitThreshold,
    cover: target.cover,
    attackerIsHurt: attack.attackerIsHurt,
  });
  const isHit = attack.hitTotal >= hitThreshold;
  const isBurst = attack.fireMode === "burst";
  // on a burst, a critical hit applies to the first bullet
  const isCritical =
    useCriticalHits &&
    isHit &&
    isCriticalHit({
      hitDie: attack.hitDie,
      hitTotal: attack.hitTotal,
      hitThreshold,
    });
  const bulletCount =
    isHit && isBurst ? getBurstBulletCount(attack.hitTotal - hitThreshold) : 1;
  const requiredRollCount = getRequiredDamageRollCount({
    isHit,
    isCritical,
    bulletCount,
  });
  const missingRollCount = Math.max(
    0,
    requiredRollCount - target.damageRolls.length,
  );
  const armor = target.armorOverride ?? info.armor ?? 0;
  const lethality =
    useLethality && attack.lethality
      ? applyCoverToLethality(attack.lethality, target.cover)
      : null;

  const instances =
    isHit && missingRollCount === 0
      ? getDamageInstances({
          rolls: target.damageRolls,
          isCritical,
          bulletCount,
          lethality,
          immuneToLethality: info.immuneToLethality,
        })
      : [];
  const damage =
    instances.length > 0 && info.health !== null
      ? resolveDamage({
          startingHealth: info.health,
          instances,
          armor,
          applyGunfireOnHumans:
            useGunfireOnHumans && attack.isGunfire && info.isHuman,
        })
      : null;

  return {
    hitThreshold,
    isHit,
    isCritical,
    bulletCount,
    missingRollCount,
    armor,
    lethality,
    instances,
    damage,
  };
}
