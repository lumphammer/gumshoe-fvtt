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

/**
 * Full-auto needs at least this many points spent, which can include Athletics
 * and Stability (p. 100). Machine guns don't need any (p. 100).
 */
export const fullAutoMinimumSpend = 5;

/**
 * The fire modes a weapon can use. Without the autofire rules, everything
 * fires single shots.
 */
export function getAvailableFireModes({
  weaponFireModes,
  useAutofire,
}: {
  weaponFireModes: WeaponFireModes;
  useAutofire: boolean;
}): FireMode[] {
  if (!useAutofire) return ["single"];
  switch (weaponFireModes) {
    case "single":
      return ["single"];
    case "selective":
      return ["single", "burst", "fullAuto"];
    case "alwaysAuto":
      return ["fullAuto"];
  }
}

/**
 * The least an attack in this fire mode needs spent. For full-auto, this is
 * the total including Athletics and Stability.
 */
export function getMinimumSpend({
  fireMode,
  weaponFireModes,
}: {
  fireMode: FireMode;
  weaponFireModes: WeaponFireModes;
}): number {
  switch (fireMode) {
    case "single":
      return 0;
    case "burst":
      return burstMinimumSpend;
    case "fullAuto":
      return weaponFireModes === "alwaysAuto" ? 0 : fullAutoMinimumSpend;
  }
}

/**
 * How many points spent from other abilities (Athletics and Stability) do
 * nothing: they don't add to the roll, so anything beyond what's needed to
 * reach the minimum spend is wasted.
 */
export function getWastedExtraSpend({
  spend,
  extraSpend,
  minimumSpend,
}: {
  /** from the weapon's own ability, which adds to the roll */
  spend: number;
  /** from other abilities, which only count towards the minimum */
  extraSpend: number;
  minimumSpend: number;
}): number {
  const needed = Math.max(0, minimumSpend - spend);
  return Math.max(0, extraSpend - needed);
}

/** Full-auto fire hits everyone downrange; everything else hits one target */
export function isMultiTargetFireMode(fireMode: FireMode): boolean {
  return fireMode === "fullAuto";
}

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

/** A burst is three bullets, however they're shared out (p. 100) */
export const burstMaxBullets = 3;

/**
 * Three-round burst (p. 100): one extra bullet for each 3 points of margin
 * over the target's Hit Threshold, to a maximum of three bullets.
 */
export function getBurstBulletCount(margin: number): number {
  return 1 + Math.min(burstMaxBullets - 1, Math.floor(Math.max(0, margin) / 3));
}

/**
 * How many damage rolls are needed to resolve a hit: one per bullet, plus
 * one for a critical hit (which applies to the first bullet), plus any extra
 * dice (Shot Dry).
 */
export function getRequiredDamageRollCount({
  isHit,
  isCritical,
  bulletCount = 1,
  extraDice = 0,
}: {
  isHit: boolean;
  isCritical: boolean;
  bulletCount?: number;
  extraDice?: number;
}): number {
  if (!isHit) return 0;
  return bulletCount + (isCritical ? 1 : 0) + extraDice;
}

/**
 * Shot Dry (p. 101): an unmodified 6 on full-auto empties the weapon, but
 * grants extra damage.
 */
export function isShotDry({
  fireMode,
  hitDie,
}: {
  fireMode: FireMode;
  hitDie: number;
}): boolean {
  return fireMode === "fullAuto" && hitDie === 6;
}

/** Shot Dry's extra damage goes to at most this many targets (p. 101) */
export const shotDryMaxTargets = 2;

/**
 * Shot Dry gives "two instances of damage for any two targets (or three
 * times for one target)" (p. 101): with one target chosen, it gets two extra
 * dice; with two, they get one extra each.
 */
export function getShotDryExtraDice(chosenTargetCount: number): number {
  if (chosenTargetCount === 1) return 2;
  if (chosenTargetCount === shotDryMaxTargets) return 1;
  return 0;
}

/**
 * A weapon's record of having just rolled a 1 on full-auto, so a second one
 * in a row can jam it. Only counts within the same fight, so we note which
 * combat it was in (null outside combat).
 */
export type PendingJam = { combatId: string | null };

export function isSamePendingJam(
  a: PendingJam | null,
  b: PendingJam | null,
): boolean {
  return a === null || b === null ? a === b : a.combatId === b.combatId;
}

/**
 * Weapon Jams (p. 101): two unmodified 1s in a row on full-auto jam the
 * weapon. Only successive full-auto rolls count (a single shot or burst
 * resets the count), and only within one fight.
 */
export function getJamUpdate({
  fireMode,
  hitDie,
  pendingJam,
  combatId,
}: {
  fireMode: FireMode;
  hitDie: number;
  pendingJam: PendingJam | null;
  combatId: string | null;
}): { jams: boolean; pendingJam: PendingJam | null } {
  if (fireMode !== "fullAuto" || hitDie !== 1) {
    return { jams: false, pendingJam: null };
  }
  if (pendingJam !== null && pendingJam.combatId === combatId) {
    return { jams: true, pendingJam: null };
  }
  return { jams: false, pendingJam: { combatId } };
}

/** Walking fire (p. 100) costs 2 points of the weapon's ability... */
export const walkingFireWeaponCost = 2;
/** ...or 1 point of it, plus 2 points of another ability (Athletics) */
export const walkingFireSplitWeaponCost = 1;
export const walkingFireSplitOtherCost = 2;

export type WalkingFirePayment = {
  /** points from the weapon's own ability */
  weaponSpend: number;
  /** points from another ability, if any */
  other: { name: string; spend: number } | null;
  affordable: boolean;
};

/**
 * The ways to pay for walking fire, given the attacker's pools: all from the
 * weapon's ability, or split with each of the other abilities they have.
 */
export function getWalkingFirePayments({
  weaponPool,
  otherAbilities,
}: {
  weaponPool: number;
  otherAbilities: { name: string; pool: number }[];
}): WalkingFirePayment[] {
  return [
    {
      weaponSpend: walkingFireWeaponCost,
      other: null,
      affordable: weaponPool >= walkingFireWeaponCost,
    },
    ...otherAbilities.map(({ name, pool }) => ({
      weaponSpend: walkingFireSplitWeaponCost,
      other: { name, spend: walkingFireSplitOtherCost },
      affordable:
        weaponPool >= walkingFireSplitWeaponCost &&
        pool >= walkingFireSplitOtherCost,
    })),
  ];
}

/** Walking fire carries on from a burst or full-auto (p. 100) */
export function canWalkFireFrom(fireMode: FireMode): boolean {
  return fireMode === "burst" || fireMode === "fullAuto";
}
