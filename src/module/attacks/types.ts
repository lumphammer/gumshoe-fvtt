import type { Lethality } from "./lethality";
import type { Cover, FireMode } from "./rules";

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
  /** chosen to get Shot Dry's extra damage */
  shotDryBonus: boolean;
  damageRolls: DamageRollRecord[];
  applied: AppliedDamageRecord | null;
};

/**
 * The combat rules' view of an attack: the system data of an `attack` chat
 * message, minus the weapon details used for display. Must match
 * `attackDataSchema` (see attackDataTypes.test-d.ts).
 */
export type AttackData = {
  fireMode: FireMode;
  hitTotal: number;
  /** the unmodified die, for critical hits */
  hitDie: number;
  /** snapshot of whether the attacker was Hurt when they attacked */
  attackerIsHurt: boolean;
  isGunfire: boolean;
  /** an unmodified 6 on full-auto, with the Shot Dry rule on */
  isShotDry: boolean;
  /** snapshot of the weapon's Lethality, if it has one and the rule is on */
  lethality: Lethality | null;
  /** so we can roll more damage later, e.g. for a crit or a new target */
  damageFormula: string;
  damageParams: Record<string, number>;
  /** damage rolls which belong to the attack but no target is using */
  unusedDamageRolls: DamageRollRecord[];
  targets: AttackTargetData[];
};
