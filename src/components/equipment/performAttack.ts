import * as constants from "../../constants";
import { buildAbilityCardContent } from "../../functions/buildAbilityCardContent";
import { assertGame } from "../../functions/isGame";
import { PoolTerm } from "../../fvtt-exports";
import { isNPCActor } from "../../module/actors/npc";
import type { AnyRoll } from "../../module/attacks/attackTargets";
import {
  createAttackTarget,
  fillMissingDamageRolls,
  pickSingleTargetToken,
  rollToRecord,
} from "../../module/attacks/attackTargets";
import { getHealth } from "../../module/attacks/health";
import { hurtHealth } from "../../module/attacks/rules";
import type { AttackFlagData } from "../../module/attacks/types";
import { assertAbilityItem } from "../../module/items/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import type { WeaponItem } from "../../module/items/weapon";
import { settings } from "../../settings/settings";
import { consumeWeaponAmmo } from "./consumeWeaponAmmo";

type PerformAttackArgs1 = {
  spend: number;
  bonusPool: number;
  setSpend: (value: number) => void;
  setBonusPool: (value: number) => void;
  weapon: WeaponItem;
  ability: InvestigatorItem | undefined;
};

type PerformAttackArgs2 = {
  rangeName: string;
  rangeDamage: number;
};

/**
 * Build the attack data for damage application, using the user's current
 * targets. The attack's own damage roll is used for the first target which
 * needs one; anything else needed (more targets, critical hits) gets rolled
 * here.
 */
async function buildAttackFlag({
  hitRoll,
  damageRoll,
  damageFormula,
  damageParams,
  weapon,
}: {
  hitRoll: AnyRoll;
  damageRoll: AnyRoll;
  damageFormula: string;
  damageParams: Record<string, number>;
  weapon: WeaponItem;
}): Promise<{ flag: AttackFlagData; extraRolls: AnyRoll[] }> {
  assertGame(game);
  const attackerHealth = weapon.actor ? getHealth(weapon.actor) : null;
  let flag: AttackFlagData = {
    version: 1,
    hitTotal: hitRoll.total ?? 0,
    hitDie: hitRoll.dice[0]?.total ?? 0,
    attackerIsHurt: attackerHealth !== null && attackerHealth <= hurtHealth,
    isGunfire: weapon.system.isGunfire,
    damageFormula,
    damageParams,
    unusedDamageRolls: [rollToRecord(damageRoll)],
    targets: [],
  };
  const extraRolls: AnyRoll[] = [];
  // only use targets here, not selection: your selected token is usually
  // the one doing the shooting
  const token = pickSingleTargetToken({ allowSelected: false });
  if (token) {
    const filled = await fillMissingDamageRolls(
      flag,
      createAttackTarget(token),
    );
    extraRolls.push(...filled.rolls);
    flag = { ...filled.attack, targets: [filled.target] };
  }
  return { flag, extraRolls };
}

export const performAttack =
  ({
    spend,
    ability,
    weapon,
    bonusPool,
    setSpend,
    setBonusPool,
  }: PerformAttackArgs1) =>
  async ({ rangeName, rangeDamage }: PerformAttackArgs2) => {
    assertGame(game);
    assertAbilityItem(ability);
    if (weapon.actor === null) {
      return;
    }
    const damage = weapon.system.damage;

    const useBoost = settings.useBoost.get();
    const isBoosted = useBoost && ability !== undefined && ability.system.boost;
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
    const damageParams: { [name: string]: number } = { damage, rangeDamage };
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

    const attack = settings.useDamageApplication.get()
      ? await buildAttackFlag({
          hitRoll,
          damageRoll,
          damageFormula: damageTerm,
          damageParams,
          weapon,
        })
      : null;
    attack?.extraRolls.forEach((roll, i) => {
      roll.dice[0].options.rollOrder = 3 + i;
    });

    const rolls = [hitRoll, damageRoll, ...(attack?.extraRolls ?? [])];
    // @ts-expect-error fvtt-types
    const pool = PoolTerm.fromRolls(rolls);
    const actualRoll = Roll.fromTerms([pool]);

    const abilityId = ability?._id ?? "";
    const actorId = weapon.actor?._id ?? "";
    const weaponId = weapon._id;

    void actualRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: weapon.actor as Actor.Stored }),
      content: buildAbilityCardContent({
        [constants.htmlDataItemId]: abilityId,
        [constants.htmlDataActorId]: actorId,
        [constants.htmlDataMode]: constants.htmlDataModeAttack,
        [constants.htmlDataRange]: rangeName,
        [constants.htmlDataWeaponId]: weaponId,
        [constants.htmlDataName]: weapon.name,
        [constants.htmlDataImageUrl]: weapon.img,
      }),
      ...(attack ? { flags: { investigator: { attack: attack.flag } } } : {}),
    });

    const currentPool = ability?.system.pool ?? 0;
    const poolHit = Math.max(0, Number(spend) - bonusPool);
    const newPool = Math.max(0, currentPool - poolHit);
    const newBonusPool = Math.max(0, bonusPool - Number(spend));
    await ability?.system.setPool(newPool);
    setBonusPool(newBonusPool);
    setSpend(0);
    await consumeWeaponAmmo(weapon.system);
  };
