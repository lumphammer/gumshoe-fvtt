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
   * The damage roll shown on the attack card, until a target uses it. This
   * keeps the first target's damage the same as what the card shows, however
   * and whenever it gets added.
   */
  unusedDamageRoll?: DamageRollRecord | null;
  targets: AttackTargetData[];
};
