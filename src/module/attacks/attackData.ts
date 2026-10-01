import type {
  AttackFlagData,
  AttackTargetData,
  DamageRollRecord,
} from "./types";

// pure helpers for manipulating attack data - no Foundry in here, so they can
// be tested

export function getUnusedDamageRolls(
  attack: AttackFlagData,
): DamageRollRecord[] {
  if (attack.unusedDamageRolls) return attack.unusedDamageRolls;
  return attack.unusedDamageRoll ? [attack.unusedDamageRoll] : [];
}

/**
 * Give a target as many of the attack's unused damage rolls as it needs.
 */
export function takeUnusedDamageRolls(
  attack: AttackFlagData,
  target: AttackTargetData,
  missingRollCount: number,
): { attack: AttackFlagData; target: AttackTargetData } {
  const unused = getUnusedDamageRolls(attack);
  const count = Math.max(0, Math.min(missingRollCount, unused.length));
  if (count === 0) {
    return { attack, target };
  }
  return {
    attack: { ...attack, unusedDamageRolls: unused.slice(count) },
    target: {
      ...target,
      damageRolls: [...target.damageRolls, ...unused.slice(0, count)],
    },
  };
}

/**
 * Remove a target, returning its damage rolls to the attack so the next
 * target gets the same damage.
 */
export function removeTarget(
  attack: AttackFlagData,
  targetId: string,
): AttackFlagData {
  const removed = attack.targets.find((t) => t.id === targetId);
  if (!removed) return attack;
  return {
    ...attack,
    unusedDamageRolls: [
      ...removed.damageRolls,
      ...getUnusedDamageRolls(attack),
    ],
    targets: attack.targets.filter((t) => t.id !== targetId),
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
