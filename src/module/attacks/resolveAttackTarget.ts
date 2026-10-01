import type { DamageResult } from "./rules";
import {
  defaultHitThreshold,
  getDamageInstances,
  getEffectiveHitThreshold,
  getRequiredDamageRollCount,
  isCriticalHit,
  resolveDamage,
} from "./rules";
import type { AttackFlagData, AttackTargetData } from "./types";

/** Live information about the target, read from its actor */
export type TargetActorInfo = {
  hitThreshold: number | null;
  armor: number | null;
  health: number | null;
  isHuman: boolean;
};

export type ResolveOptions = {
  useCriticalHits: boolean;
  useGunfireOnHumans: boolean;
};

export type ResolvedAttackTarget = {
  hitThreshold: number;
  isHit: boolean;
  isCritical: boolean;
  /** damage rolls still needed before this hit can be resolved */
  missingRollCount: number;
  armor: number;
  /** null for a miss, missing rolls, or a target without Health */
  damage: DamageResult | null;
};

/**
 * Work out everything about one target of an attack. Pure, so the card and the
 * apply logic agree, and so it can be tested.
 */
export function resolveAttackTarget(
  attack: AttackFlagData,
  target: AttackTargetData,
  info: TargetActorInfo,
  { useCriticalHits, useGunfireOnHumans }: ResolveOptions,
): ResolvedAttackTarget {
  const hitThreshold = getEffectiveHitThreshold({
    baseHitThreshold: info.hitThreshold ?? defaultHitThreshold,
    cover: target.cover,
    attackerIsHurt: attack.attackerIsHurt,
  });
  const isHit = attack.hitTotal >= hitThreshold;
  const isCritical =
    useCriticalHits &&
    isHit &&
    isCriticalHit({
      hitDie: attack.hitDie,
      hitTotal: attack.hitTotal,
      hitThreshold,
    });
  const requiredRollCount = getRequiredDamageRollCount({ isHit, isCritical });
  const missingRollCount = Math.max(
    0,
    requiredRollCount - target.damageRolls.length,
  );
  const armor = target.armorOverride ?? info.armor ?? 0;

  const canResolve = isHit && missingRollCount === 0 && info.health !== null;
  const damage =
    canResolve && info.health !== null
      ? resolveDamage({
          startingHealth: info.health,
          instances: getDamageInstances({
            rolls: target.damageRolls.map((r) => r.total),
            isCritical,
          }),
          armor,
          applyGunfireOnHumans:
            useGunfireOnHumans && attack.isGunfire && info.isHuman,
        })
      : null;

  return { hitThreshold, isHit, isCritical, missingRollCount, armor, damage };
}
