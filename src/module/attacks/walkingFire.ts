import { getTranslated } from "../../functions/getTranslated";
import { settings } from "../../settings/settings";
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
  pickSingleTargetToken,
  resolveTargetLive,
  setAttackData,
  showRolls,
} from "./attackTargets";
import type { WalkingFirePayment } from "./rules";
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

/**
 * Walk the attack's fire onto the user's target (p. 100): if the original
 * result would hit them, pay for it, then add them to the attack and roll
 * their damage.
 */
export async function walkFire(
  message: AttackMessage,
  payment: WalkingFirePayment,
): Promise<void> {
  const latest = getAttackData(message);
  const weapon = getAttackWeapon(message);
  const actor = weapon?.actor ?? null;
  const weaponAbility = weapon
    ? findGeneralAbility(actor, weapon.system.ability)
    : undefined;
  const otherAbility = payment.other
    ? findGeneralAbility(actor, payment.other.name)
    : undefined;
  if (
    !latest ||
    !weaponAbility ||
    !isAbilityItem(weaponAbility) ||
    (payment.other && !(otherAbility && isAbilityItem(otherAbility)))
  ) {
    ui.notifications?.warn(getTranslated("CantFindWalkingFireAbilities"));
    return;
  }

  const token = pickSingleTargetToken();
  if (!token) return;
  if (latest.targets.some((t) => t.tokenUuid === token.uuid)) {
    ui.notifications?.warn(
      getTranslated("AlreadyATarget", { TokenName: token.name ?? "" }),
    );
    return;
  }
  const target = { ...createAttackTarget(token), walked: true };
  const withTarget = addTarget(keepLoneShotDryTarget(latest), target);
  const resolved = resolveTargetLive(withTarget, target);
  if (!resolved.isHit) {
    ui.notifications?.warn(
      getTranslated("WalkingFireWouldMiss", { TokenName: token.name ?? "" }),
    );
    return;
  }
  if (latest.fireMode === "burst" && resolved.bulletCount === 0) {
    ui.notifications?.warn(getTranslated("BurstHasNoBulletsLeft"));
    return;
  }

  // take the points first, so nothing else can spend them meanwhile, and
  // give them back if anything goes wrong
  const spends = [
    { ability: weaponAbility, spend: payment.weaponSpend },
    ...(payment.other && otherAbility && isAbilityItem(otherAbility)
      ? [{ ability: otherAbility, spend: payment.other.spend }]
      : []),
  ];
  if (spends.some(({ ability, spend }) => ability.system.pool < spend)) {
    ui.notifications?.warn(getTranslated("NotEnoughPointsToSpend"));
    return;
  }
  const refunds: (() => Promise<void>)[] = [];
  try {
    for (const { ability, spend } of spends) {
      await ability.system.setPool(ability.system.pool - spend);
      refunds.push(async () => {
        await ability.system.setPool(ability.system.pool + spend);
      });
    }
    const filled = await fillMissingDamageRolls(withTarget, target);
    await showRolls(filled.rolls);
    await setAttackData(message, replaceTarget(filled.attack, filled.target));
  } catch (error) {
    for (const refund of refunds.reverse()) {
      await refund().catch(console.error);
    }
    throw error;
  }
}
