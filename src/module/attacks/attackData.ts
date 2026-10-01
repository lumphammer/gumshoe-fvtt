import type { AttackFlagData, AttackTargetData } from "./types";

// pure helpers for manipulating attack data - no Foundry in here, so they can
// be tested

/**
 * Give a target the attack's own damage roll, if it needs damage and nobody
 * else has used that roll yet. Pure, so it can be tested.
 */
export function takeUnusedDamageRoll(
  attack: AttackFlagData,
  target: AttackTargetData,
  missingRollCount: number,
): { attack: AttackFlagData; target: AttackTargetData } {
  const unused = attack.unusedDamageRoll ?? null;
  if (missingRollCount <= 0 || unused === null) {
    return { attack, target };
  }
  return {
    attack: { ...attack, unusedDamageRoll: null },
    target: { ...target, damageRolls: [...target.damageRolls, unused] },
  };
}

/**
 * Put an updated target back into an attack
 */
export function replaceTarget(
  attack: AttackFlagData,
  target: AttackTargetData,
): AttackFlagData {
  return {
    ...attack,
    targets: attack.targets.map((t) => (t.id === target.id ? target : t)),
  };
}

/**
 * Single shots and bursts hit one target, so setting a target replaces any
 * existing one. The new target takes over the old one's damage rolls, because
 * they belong to the attack, not to whoever it was aimed at. (Full-auto and
 * walking fire will want multiple targets.)
 */
export function setSingleTarget(
  attack: AttackFlagData,
  target: AttackTargetData,
): AttackFlagData {
  const inheritedRolls = attack.targets.flatMap((t) => t.damageRolls);
  return {
    ...attack,
    targets: [
      {
        ...target,
        damageRolls: [...inheritedRolls, ...target.damageRolls],
      },
    ],
  };
}
