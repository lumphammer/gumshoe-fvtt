import { getTranslated } from "../../functions/getTranslated";
import { settings } from "../../settings/settings";
import type { AbilityItem } from "../items/exports";
import { isAbilityItem } from "../items/exports";
import { findGeneralAbility } from "../items/findGeneralAbility";
import type { InvestigatorItem } from "../items/InvestigatorItem";
import type { WeaponItem } from "../items/weapon";
import { isWeaponItem } from "../items/weapon";
import { addTarget, keepLoneShotDryTarget, replaceTarget } from "./attackData";
import type { AttackMessage } from "./attackTargets";
import {
  createAttackTarget,
  fillMissingDamageRolls,
  getAttackData,
  resolveTargetLive,
  setAttackData,
  showRolls,
} from "./attackTargets";
import type { WalkingFirePayment } from "./rules";
import type { AttackData, AttackTargetData } from "./types";
import { getWalkingFirePayments } from "./rules";

export function getAttackWeapon(message: AttackMessage): WeaponItem | null {
  const weapon = fromUuidSync(message.system.weaponUuid);
  return isWeaponItem(weapon) ? weapon : null;
}

function getPool(ability: InvestigatorItem | undefined): number {
  return ability && isAbilityItem(ability) ? ability.system.pool : 0;
}

/**
 * How the attacker can pay to walk their fire, from their pools right now.
 * Null if we can't find the weapon or its ability.
 */
export function getWalkingFirePaymentsLive(message: AttackMessage): {
  weaponAbilityName: string;
  payments: WalkingFirePayment[];
} | null {
  const weapon = getAttackWeapon(message);
  const actor = weapon?.actor ?? null;
  if (!weapon || !actor) return null;
  const weaponAbility = findGeneralAbility(actor, weapon.system.ability);
  if (!weaponAbility) return null;
  const otherAbilities = settings.walkingFireSpendAbilities
    .get()
    .map((name) => findGeneralAbility(actor, name))
    .filter(
      (ability): ability is InvestigatorItem =>
        ability !== undefined && ability !== weaponAbility,
    )
    // in case a name is listed twice
    .filter((ability, i, all) => all.indexOf(ability) === i)
    .map((ability) => ({ name: ability.name, pool: getPool(ability) }));
  return {
    weaponAbilityName: weaponAbility.name,
    payments: getWalkingFirePayments({
      weaponPool: getPool(weaponAbility),
      otherAbilities,
    }),
  };
}

type WalkFirePlan = {
  /** the attack with the new target added */
  attack: AttackData;
  target: AttackTargetData;
  /** what to take from which abilities */
  spends: { ability: AbilityItem; spend: number }[];
};

/**
 * Work out walking the attack's fire onto a token (p. 100), with the
 * attacker's pools as they are now. Returns the plan, or a warning saying why
 * it can't be done. Only payments the attacker could choose from right now
 * are allowed, whatever the payment says it costs.
 */
export function planWalkFire(
  message: AttackMessage,
  payment: WalkingFirePayment,
  token: TokenDocument,
): WalkFirePlan | { warning: string } {
  const latest = getAttackData(message);
  const weapon = getAttackWeapon(message);
  const actor = weapon?.actor ?? null;
  const weaponAbility = weapon
    ? findGeneralAbility(actor, weapon.system.ability)
    : undefined;
  const livePayment = getWalkingFirePaymentsLive(message)?.payments.find(
    (p) => (p.other?.name ?? null) === (payment.other?.name ?? null),
  );
  const otherAbility = livePayment?.other
    ? findGeneralAbility(actor, livePayment.other.name)
    : undefined;
  if (
    !latest ||
    !livePayment ||
    !weaponAbility ||
    !isAbilityItem(weaponAbility) ||
    (livePayment.other && !(otherAbility && isAbilityItem(otherAbility)))
  ) {
    return { warning: getTranslated("CantFindWalkingFireAbilities") };
  }
  if (latest.targets.some((t) => t.tokenUuid === token.uuid)) {
    return {
      warning: getTranslated("AlreadyATarget", { TokenName: token.name ?? "" }),
    };
  }
  const target = { ...createAttackTarget(token), walked: true };
  const withTarget = addTarget(keepLoneShotDryTarget(latest), target);
  const resolved = resolveTargetLive(withTarget, target);
  if (!resolved.isHit) {
    return {
      warning: getTranslated("WalkingFireWouldMiss", {
        TokenName: token.name ?? "",
      }),
    };
  }
  if (latest.fireMode === "burst" && resolved.bulletCount === 0) {
    return { warning: getTranslated("BurstHasNoBulletsLeft") };
  }
  const spends = [
    { ability: weaponAbility, spend: livePayment.weaponSpend },
    ...(livePayment.other && otherAbility && isAbilityItem(otherAbility)
      ? [{ ability: otherAbility, spend: livePayment.other.spend }]
      : []),
  ];
  if (spends.some(({ ability, spend }) => ability.system.pool < spend)) {
    return { warning: getTranslated("NotEnoughPointsToSpend") };
  }
  return { attack: withTarget, target, spends };
}

/**
 * Walk the attack's fire onto a token: pay for it, then add them to the
 * attack and roll their damage. Runs on the GM's client (see `editAttack`),
 * after the requester has already checked it with `planWalkFire`, so if it
 * can't be done now, it quietly doesn't happen.
 *
 * @param user who asked for it, to show the dice as theirs
 */
export async function walkFireNow(
  message: AttackMessage,
  payment: WalkingFirePayment,
  token: TokenDocument,
  user: User | null,
): Promise<void> {
  const plan = planWalkFire(message, payment, token);
  if ("warning" in plan) return;

  // take the points first, so nothing else can spend them meanwhile, and
  // give them back if anything goes wrong
  const refunds: (() => Promise<void>)[] = [];
  try {
    for (const { ability, spend } of plan.spends) {
      await ability.system.setPool(ability.system.pool - spend);
      refunds.push(async () => {
        await ability.system.setPool(ability.system.pool + spend);
      });
    }
    const filled = await fillMissingDamageRolls(plan.attack, plan.target);
    await showRolls(filled.rolls, user);
    await setAttackData(message, replaceTarget(filled.attack, filled.target));
  } catch (error) {
    for (const refund of refunds.reverse()) {
      await refund().catch(console.error);
    }
    throw error;
  }
}
