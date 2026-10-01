import type { Cover } from "./rules";

/** One damage roll, keeping the raw die so later rules (Lethality) can use it */
export type DamageRollRecord = {
  die: number;
  total: number;
};

/** A record of damage having been applied, so it can be undone */
export type AppliedDamageRecord = {
  previousHealth: number;
  newHealth: number;
};

export type AttackTargetData = {
  /** local id for this entry, so a token can't get confused with itself */
  id: string;
  tokenUuid: string;
  /** snapshot, in case the token goes away */
  name: string;
  img: string;
  cover: Cover;
  /** when null, use the target's armor stat */
  armorOverride: number | null;
  damageRolls: DamageRollRecord[];
  applied: AppliedDamageRecord | null;
};

/**
 * Stored at `flags.investigator.attack` on attack chat messages when damage
 * application is enabled.
 */
export type AttackFlagData = {
  version: 1;
  hitTotal: number;
  /** the unmodified die, for critical hits */
  hitDie: number;
  /** snapshot of whether the attacker was Hurt when they attacked */
  attackerIsHurt: boolean;
  isGunfire: boolean;
  /** so we can roll more damage later, e.g. for a crit or a new target */
  damageFormula: string;
  damageParams: Record<string, number>;
  /**
   * Damage rolls which belong to the attack but no target is using: to start
   * with, the one shown on the attack card, and later any rolls from a target
   * which has been removed. Targets take these before anything new gets
   * rolled, so damage doesn't change when you add, remove, or re-add a target.
   */
  unusedDamageRolls?: DamageRollRecord[];
  /**
   * Single-roll predecessor of `unusedDamageRolls`, only found on messages
   * from before it existed. Ignored once `unusedDamageRolls` is set.
   */
  unusedDamageRoll?: DamageRollRecord | null;
  targets: AttackTargetData[];
};
