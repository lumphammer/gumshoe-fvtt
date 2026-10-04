import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { getTranslated } from "../../functions/getTranslated";
import { assertGame } from "../../functions/isGame";
import { PoolTerm } from "../../fvtt-exports";
import { isNPCActor } from "../../module/actors/npc";
import type { AnyRoll } from "../../module/attacks/attackTargets";
import {
  addTargetsForTokens,
  createAttackTarget,
  fillMissingDamageRolls,
  pickSingleTargetToken,
  pickTargetTokens,
  rollToRecord,
} from "../../module/attacks/attackTargets";
import { getHealth } from "../../module/attacks/health";
import type { FireMode } from "../../module/attacks/rules";
import { getFullAutoLethality } from "../../module/attacks/lethality";
import {
  getAvailableFireModes,
  getMinimumSpend,
  hurtHealth,
  isMultiTargetFireMode,
} from "../../module/attacks/rules";
import type { AttackData } from "../../module/attacks/types";
import { assertAbilityItem, isAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import type { WeaponItem } from "../../module/items/weapon";
import { settings } from "../../settings/settings";
import { consumeWeaponAmmo, hasAmmoFor } from "./consumeWeaponAmmo";

/**
 * Points spent from another ability, which count towards a minimum spend but
 * don't add to the roll (Athletics and Stability on full-auto, p. 100)
 */
export type ExtraSpend = {
  ability: InvestigatorItem;
  spend: number;
};

type PerformAttackArgs1 = {
  spend: number;
  bonusPool: number;
  setSpend: (value: number) => void;
  setBonusPool: (value: number) => void;
  weapon: WeaponItem;
  ability: InvestigatorItem | undefined;
  /** only used for full-auto */
  extraSpends?: ExtraSpend[];
  resetExtraSpends?: () => void;
};

type PerformAttackArgs2 = {
  rangeName: string;
  rangeDamage: number;
  fireMode: FireMode;
};

/**
 * Build the attack data. With damage application on, this includes the user's
 * current target (or all of them, for full-auto): the attack's own damage
 * roll goes to the first if it needs one, and anything else needed (e.g. for a
 * critical hit) gets rolled here.
 */
async function buildAttackData({
  fireMode,
  hitRoll,
  damageRoll,
  damageFormula,
  damageParams,
  weapon,
}: {
  fireMode: FireMode;
  hitRoll: AnyRoll;
  damageRoll: AnyRoll;
  damageFormula: string;
  damageParams: Record<string, number>;
  weapon: WeaponItem;
}): Promise<{ attack: AttackData; extraRolls: AnyRoll[] }> {
  assertGame(game);
  const attackerHealth = weapon.actor ? getHealth(weapon.actor) : null;
  let attack: AttackData = {
    fireMode,
    hitTotal: hitRoll.total ?? 0,
    hitDie: hitRoll.dice[0]?.total ?? 0,
    attackerIsHurt: attackerHealth !== null && attackerHealth <= hurtHealth,
    isGunfire: weapon.system.isGunfire,
    lethality:
      fireMode === "fullAuto"
        ? getFullAutoLethality({
            weaponFireModes: weapon.system.fireModes,
            weaponLethality: weapon.system.lethality,
          })
        : settings.useLethalityAndAutofire.get()
          ? weapon.system.lethality
          : null,
    damageFormula,
    damageParams,
    unusedDamageRolls: [rollToRecord(damageRoll)],
    targets: [],
  };
  const extraRolls: AnyRoll[] = [];
  if (!settings.useDamageApplication.get()) {
    return { attack, extraRolls };
  }
  // only use targets here, not selection: your selected token is usually
  // the one doing the shooting
  if (isMultiTargetFireMode(fireMode)) {
    const added = await addTargetsForTokens(
      attack,
      pickTargetTokens({ allowSelected: false }),
    );
    return { attack: added.attack, extraRolls: added.rolls };
  }
  const token = pickSingleTargetToken({ allowSelected: false });
  if (token) {
    const filled = await fillMissingDamageRolls(
      attack,
      createAttackTarget(token),
    );
    extraRolls.push(...filled.rolls);
    attack = { ...filled.attack, targets: [filled.target] };
  }
  return { attack, extraRolls };
}

/** weapons with an attack under way */
const weaponsAttacking = new WeakSet<WeaponItem>();

export const performAttack =
  ({
    spend,
    ability,
    weapon,
    bonusPool,
    setSpend,
    setBonusPool,
    extraSpends = [],
    resetExtraSpends,
  }: PerformAttackArgs1) =>
  async ({ rangeName, rangeDamage, fireMode }: PerformAttackArgs2) => {
    assertGame(game);
    assertAbilityItem(ability);
    if (weapon.actor === null) {
      return;
    }
    // the attack panel shouldn't let these through, but just in case
    const availableFireModes = getAvailableFireModes({
      weaponFireModes: weapon.system.fireModes,
      useAutofire:
        settings.useDamageApplication.get() &&
        settings.useLethalityAndAutofire.get(),
    });
    if (!availableFireModes.includes(fireMode)) {
      return;
    }
    const minimumSpend = getMinimumSpend({
      fireMode,
      weaponFireModes: weapon.system.fireModes,
    });
    // other abilities only help towards full-auto's minimum spend
    const usableExtraSpends =
      fireMode === "fullAuto" && minimumSpend > 0 ? extraSpends : [];
    const totalSpend =
      spend +
      usableExtraSpends.reduce((total, extra) => total + extra.spend, 0);
    if (totalSpend < minimumSpend) {
      return;
    }
    // the panel only checks ammo and spend as of its last render, so a quick
    // second click could fire again before this attack has used them up
    if (weaponsAttacking.has(weapon)) {
      return;
    }
    if (!hasAmmoFor(weapon.system, fireMode)) {
      return;
    }
    weaponsAttacking.add(weapon);
    try {
      // pools can change after the points were chosen, e.g. if they get
      // spent from the ability's own sheet or another weapon. Check them and
      // take the points straight away, before anything else can spend them.
      const currentPool =
        ability && isAbilityItem(ability) ? ability.system.pool : 0;
      if (
        spend > currentPool + bonusPool ||
        usableExtraSpends.some(
          (extra) =>
            !isAbilityItem(extra.ability) ||
            extra.spend > extra.ability.system.pool,
        )
      ) {
        ui.notifications?.warn(getTranslated("NotEnoughPointsToSpend"));
        return;
      }
      // if anything goes wrong before the attack is made, these give the
      // points back. They add back what was taken rather than restoring the
      // old value, so they don't undo anything else spent in the meantime.
      const refunds: (() => Promise<void>)[] = [];
      try {
        const poolHit = Math.max(0, Number(spend) - bonusPool);
        const newPool = Math.max(0, currentPool - poolHit);
        const newBonusPool = Math.max(0, bonusPool - Number(spend));
        await ability?.system.setPool(newPool);
        refunds.push(async () => {
          await ability?.system.setPool(
            ability.system.pool + (currentPool - newPool),
          );
          setBonusPool(bonusPool);
          setSpend(spend);
        });
        setBonusPool(newBonusPool);
        setSpend(0);
        for (const extra of usableExtraSpends) {
          const extraAbility = extra.ability;
          if (extra.spend > 0 && isAbilityItem(extraAbility)) {
            const previous = extraAbility.system.pool;
            const next = Math.max(0, previous - extra.spend);
            await extraAbility.system.setPool(next);
            refunds.push(async () => {
              await extraAbility.system.setPool(
                extraAbility.system.pool + (previous - next),
              );
            });
          }
        }
        resetExtraSpends?.();

        const damage = weapon.system.damage;

        const useBoost = settings.useBoost.get();
        const isBoosted =
          useBoost && ability !== undefined && ability.system.boost;
        const boost = isBoosted ? 1 : 0;

        let hitTerm = "1d6 + @spend";
        const hitParams: { [name: string]: number } = { spend };
        if (isBoosted) {
          hitTerm += " + @boost";
          hitParams["boost"] = boost;
        }

        const useNpcBonuses =
          settings.useNpcCombatBonuses.get() &&
          ability?.isOwned &&
          ability.parent &&
          isNPCActor(ability.parent) &&
          isGeneralAbilityItem(ability);

        const parent = ability.parent;
        if (useNpcBonuses) {
          hitTerm += " + @npcCombatBonus";
          if (isNPCActor(parent)) {
            hitParams["npcCombatBonus"] = parent.system.combatBonus;
          }
          hitTerm += " + @abilityCombatBonus";
          hitParams["abilityCombatBonus"] = ability.system.combatBonus;
        }
        const hitRoll = new Roll(hitTerm, hitParams);

        await hitRoll.evaluate();

        hitRoll.dice[0].options = {
          rollOrder: 1,
        };

        hitRoll.dice[0].options.rollOrder = 1;

        let damageTerm = "1d6 + @damage + @rangeDamage";
        const damageParams: { [name: string]: number } = {
          damage,
          rangeDamage,
        };
        if (useNpcBonuses) {
          damageTerm += " + @npcDamageBonus";
          if (isNPCActor(parent)) {
            damageParams["npcDamageBonus"] = parent.system.damageBonus;
          }
          damageTerm += " + @abilityDamageBonus";
          damageParams["abilityDamageBonus"] = ability.system.damageBonus;
        }

        const damageRoll = new Roll(damageTerm, damageParams);
        await damageRoll.evaluate();
        damageRoll.dice[0].options.rollOrder = 2;

        const { attack, extraRolls } = await buildAttackData({
          fireMode,
          hitRoll,
          damageRoll,
          damageFormula: damageTerm,
          damageParams,
          weapon,
        });
        extraRolls.forEach((roll, i) => {
          roll.dice[0].options.rollOrder = 3 + i;
        });

        const rolls = [hitRoll, damageRoll, ...extraRolls];
        // @ts-expect-error fvtt-types
        const pool = PoolTerm.fromRolls(rolls);
        const actualRoll = Roll.fromTerms([pool]);

        void actualRoll.toMessage({
          type: "attack",
          speaker: ChatMessage.getSpeaker({
            actor: weapon.actor as Actor.Stored,
          }),
          // a bare marker for the card to render into. Without some content,
          // Foundry would fill the message with its own roll display.
          content: buildAbilityCardContent({}),
          system: {
            ...attack,
            weaponUuid: weapon.uuid,
            weaponName: weapon.name,
            weaponImg: weapon.img ?? "",
            rangeName,
          },
        });
      } catch (error) {
        for (const refund of refunds.reverse()) {
          await refund().catch(console.error);
        }
        throw error;
      }

      await consumeWeaponAmmo(weapon.system, fireMode);
    } finally {
      weaponsAttacking.delete(weapon);
    }
  };
